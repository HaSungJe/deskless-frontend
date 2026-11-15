import { ApiError, asNetworkError, buildHeaders, buildUrl, HttpMethodType, parseJson, sendRequest, toFailBody } from '@/shared/api/request';
import { takeSseEvents } from '@/shared/api/sse';

/** 큐 응답 이벤트 이름 — contracts/common/sse.ts COMMAND_STREAM_EVENT 와 같은 값 (shared 는 contracts 를 가져오지 않는다) */
const QUEUE_EVENT = {DONE: 'done', FAILED: 'failed', PENDING: 'pending'} as const;

/** 큐 요청 옵션 */
export type QueueOptionsType = {
    method: Exclude<HttpMethodType, 'GET'>; // 상태를 바꾸는 쓰기
    path: string;                           // /api/v1 뒤 경로
    body?: unknown;                         // JSON 본문
    token?: string | null;                  // 로그인 토큰
    signal?: AbortSignal;                   // 취소 신호
};

/**
 * 큐 API 호출 — 상태를 바꾸는 쓰기 (응답이 text/event-stream)
 * - done → data, pending · 결과 없이 끝남 → null (그 리소스를 다시 조회한다), failed → ApiError(status_code, data)
 * - 스트림 전 실패(입력 검증 400 · 로그인 401 · 권한 403)는 일반 JSON 실패 본문 → ApiError(status, 본문)
 * - 응답 DTO 가 null 인 API 는 done 과 pending 이 같은 null — 화면은 null 이면 다시 조회한다
 *
 * @param options 메서드 · 경로 · 본문 · 토큰 · 취소 신호
 */
export async function callQueue<T>({method, path, body, token, signal}: QueueOptionsType): Promise<T | null> {
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
        return null;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        for (;;) {
            const {value, done} = await reader.read().catch((error: unknown) => {
                throw asNetworkError(error); // 스트림을 읽다 끊겼다
            });
            if (done) {
                return null; // done · failed · pending 없이 끝났다 — 다시 조회
            }

            const taken = takeSseEvents(buffer + decoder.decode(value, {stream: true}));
            buffer = taken.rest;

            for (const event of taken.events) {
                const data = parseJson(event.data) ?? null;
                if (event.event === QUEUE_EVENT.DONE) {
                    return data as T;
                }

                if (event.event === QUEUE_EVENT.FAILED) {
                    const fail = toFailBody(data);
                    throw new ApiError(typeof fail.status_code === 'number' ? fail.status_code : 500, fail);
                }

                if (event.event === QUEUE_EVENT.PENDING) {
                    return null;
                }
            }
        }
    } finally {
        await reader.cancel().catch((): void => undefined); // 결과를 받았으면 스트림을 닫는다
    }
}
