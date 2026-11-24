// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiBaseUrl, ApiError } from '@/shared/api/request';
import { callStream, StreamEventType } from '@/shared/api/stream';

const fetchMock = vi.fn();

/**
 * 스트림 응답 — 조각마다 한 번씩 흘려보내는 text/event-stream
 *
 * @param chunks 스트림 조각
 */
function sseResponse(chunks: Array<string>): Response {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
        },
    });

    return new Response(stream, {status: 200, headers: {'Content-Type': 'text/event-stream'}});
}

/**
 * SSE 이벤트 한 개 문자열
 *
 * @param name 이벤트 이름
 * @param data data (JSON 으로 바꿔 넣는다)
 */
function sseEvent(name: string, data: unknown): string {
    return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('callStream', () => {
    it('[SUCCESS] 조각이 나뉘어 와도 이벤트를 받은 순서대로 넘기고, 요청은 한 번 · 스트림 헤더 · JSON 본문으로 보낸다', async () => {
        const delta = sseEvent('delta', {text: '온천은 '});
        fetchMock.mockResolvedValue(sseResponse([
            sseEvent('progress', {phase: 'SEARCHING_WEB'}) + delta.slice(0, 10),
            delta.slice(10) + sseEvent('delta', {text: '부산 쪽이에요'}),
            sseEvent('done', {message: {content: '온천은 부산 쪽이에요'}}),
        ]));
        const events: Array<StreamEventType> = [];

        await callStream({method: 'POST', path: '/user-service/chat/message', body: {content: '온천 가고 싶어'}, token: 't', onEvent: (event) => events.push(event)});

        expect(events).toEqual([
            {event: 'progress', data: {phase: 'SEARCHING_WEB'}},
            {event: 'delta', data: {text: '온천은 '}},
            {event: 'delta', data: {text: '부산 쪽이에요'}},
            {event: 'done', data: {message: {content: '온천은 부산 쪽이에요'}}},
        ]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`${apiBaseUrl()}/user-service/chat/message`);
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({Accept: 'text/event-stream', 'Content-Type': 'application/json', Authorization: 'Bearer t'});
        expect(init.body).toBe('{"content":"온천 가고 싶어"}');
    });

    it('[FAIL:quota] 시작 전 429 JSON 이면 ApiError(429) — 본문의 resets_at 이 남고 이벤트는 0번', async () => {
        const body: Record<string, unknown> = {message: '오늘 질문을 모두 사용했습니다. 자정(한국 시각)에 다시 채워집니다.', validation_errors: null, resets_at: '2026-11-25T15:00:00.000Z'};
        fetchMock.mockResolvedValue(new Response(JSON.stringify(body), {status: 429, headers: {'Content-Type': 'application/json'}}));
        const onEvent = vi.fn();

        const error = await callStream({method: 'POST', path: '/user-service/chat/message', body: {content: '또 물어볼게'}, token: 't', onEvent}).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(429);
        expect((error as ApiError).body).toEqual(body);
        expect(onEvent).not.toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
