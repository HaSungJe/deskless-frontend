import { ApiError, asNetworkError, buildHeaders, buildUrl, HttpMethodType, parseJson, sendRequest, toFailBody } from '@/shared/api/request';
import { takeSseEvents } from '@/shared/api/sse';

/** 스트림 이벤트 하나 — 이름 · JSON 으로 읽은 data(읽을 수 없으면 null) */
export type StreamEventType = {
    event: string; // 이벤트 이름 — event: 줄
    data: unknown; // data: 줄을 JSON 으로 읽은 값
};

/** 스트림 요청 옵션 */
export type StreamOptionsType = {
    method: Exclude<HttpMethodType, 'GET'>;    // 보내기
    path: string;                              // /api/v1 뒤 경로
    body?: unknown;                            // JSON 본문
    token?: string | null;                     // 로그인 토큰
    signal?: AbortSignal;                      // 취소 신호 — 화면을 떠나면 끊는다(서버도 멈춘다)
    onEvent: (event: StreamEventType) => void; // 이벤트마다(받은 순서대로)
};

/**
 * 스트림 API 호출 — 응답이 text/event-stream 이고 이벤트가 여러 번 온다(AI 대화 질문 보내기 — frontend/changes/2026-11-25-chat-ai-search.md)
 * - 시작 전 실패(400 · 401 · 409 · 429 · 503)는 일반 JSON 실패 본문 → ApiError(status, 본문 — resets_at 같은 칸도 그대로 남는다)
 * - 이벤트는 오는 대로 onEvent 에 넘기고 스트림이 끝나면 돌아온다 — 이벤트의 뜻(done · failed …)은 부르는 쪽이 안다(shared 는 도메인을 모른다)
 * - 읽다 끊기면 NetworkError, 취소는 AbortError 그대로 — 큐(callQueue)와 같은 실패 모양
 *
 * @param options 메서드 · 경로 · 본문 · 토큰 · 취소 신호 · 이벤트 받기
 */
export async function callStream({method, path, body, token, signal, onEvent}: StreamOptionsType): Promise<void> {
    const hasBody = body !== undefined;
    const response = await sendRequest(buildUrl(path), {
        method,
        headers: buildHeaders(token, hasBody, 'text/event-stream'),
        body: hasBody ? JSON.stringify(body) : undefined,
        signal,
    });

    if (!response.ok) {
        const text = await response.text().catch((error: unknown) => {
            throw asNetworkError(error);
        });
        throw new ApiError(response.status, toFailBody(parseJson(text)));
    }

    if (!response.body) {
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        for (;;) {
            const {value, done} = await reader.read().catch((error: unknown) => {
                throw asNetworkError(error); // 스트림을 읽다 끊겼다(취소면 AbortError 그대로)
            });
            if (done) {
                return;
            }

            const taken = takeSseEvents(buffer + decoder.decode(value, {stream: true}));
            buffer = taken.rest;
            for (const event of taken.events) {
                onEvent({event: event.event, data: parseJson(event.data) ?? null});
            }
        }
    } finally {
        await reader.cancel().catch((): void => undefined); // 끝났거나 실패 — 스트림을 닫는다
    }
}
