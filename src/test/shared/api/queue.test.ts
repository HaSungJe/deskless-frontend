// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callQueue } from '@/shared/api/queue';
import { API_BASE_URL, ApiError, ApiFailBodyType, NetworkError } from '@/shared/api/request';

const fetchMock = vi.fn();

/**
 * 큐 응답 — 조각마다 한 번씩 흘려보내는 text/event-stream
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

/**
 * fetch 에 넘긴 주소 · 옵션
 *
 * @param index 몇 번째 호출
 */
function fetchCall(index: number = 0): {url: string; init: RequestInit & {headers: Record<string, string>}} {
    const [url, init] = fetchMock.mock.calls[index];
    return {url, init};
}

const ACCEPTED = sseEvent('accepted', {request_id: 'r1'});

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('callQueue', () => {
    it('[SUCCESS] done 이면 응답 DTO 를 돌려주고, 요청은 한 번 · 큐 헤더 · JSON 본문으로 보낸다', async () => {
        fetchMock.mockResolvedValue(sseResponse([ACCEPTED, sseEvent('done', {store_id: 1})]));

        const result = await callQueue<{store_id: number}>({method: 'POST', path: '/admin-service/room/rooms', body: {room_name: '101호'}, token: 't'});

        expect(result).toEqual({store_id: 1});
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const {url, init} = fetchCall();
        expect(url).toBe(`${API_BASE_URL}/admin-service/room/rooms`);
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({Accept: 'text/event-stream', 'Content-Type': 'application/json', Authorization: 'Bearer t'});
        expect(init.body).toBe('{"room_name":"101호"}');
    });

    it('[SUCCESS] done 의 data 가 null 이면 null', async () => {
        fetchMock.mockResolvedValue(sseResponse([ACCEPTED, sseEvent('done', null)]));

        const result = await callQueue({method: 'DELETE', path: '/admin-service/room/rooms/1', token: 't'});

        expect(result).toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('[FAIL:failed] failed 면 status_code 와 data 를 담은 ApiError 를 던진다', async () => {
        const failed = {status_code: 400, message: '호실 이름을 입력해 주세요.', validation_errors: [{property: 'room_name', message: '호실 이름을 입력해 주세요.'}]};
        fetchMock.mockResolvedValue(sseResponse([ACCEPTED, sseEvent('failed', failed)]));

        const error = await callQueue({method: 'POST', path: '/admin-service/room/rooms', body: {}, token: 't'}).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).body).toEqual(failed);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('[SUCCESS] pending 이면 null (다시 조회)', async () => {
        fetchMock.mockResolvedValue(sseResponse([ACCEPTED, sseEvent('pending', {request_id: 'r1', message: '처리 중입니다.'})]));

        const result = await callQueue({method: 'PATCH', path: '/admin-service/store/mine', body: {store_name: '바로방'}, token: 't'});

        expect(result).toBeNull();
    });

    it('[SUCCESS] 한 이벤트가 두 조각으로 나뉘어 와도 done 을 읽는다', async () => {
        const done = sseEvent('done', {store_id: 1});
        fetchMock.mockResolvedValue(sseResponse([ACCEPTED + done.slice(0, 12), done.slice(12)]));

        const result = await callQueue<{store_id: number}>({method: 'POST', path: '/admin-service/room/rooms', body: {}, token: 't'});

        expect(result).toEqual({store_id: 1});
    });

    it('[FAIL:unauthorized] 스트림 전 401 JSON 이면 그 본문으로 ApiError(401)', async () => {
        const body: ApiFailBodyType = {message: '로그인이 필요합니다.', validation_errors: null};
        fetchMock.mockResolvedValue(new Response(JSON.stringify(body), {status: 401, headers: {'Content-Type': 'application/json'}}));

        const error = await callQueue({method: 'POST', path: '/admin-service/room/rooms', body: {}, token: 'expired'}).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
        expect((error as ApiError).body).toEqual(body);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('[SUCCESS] done · failed · pending 없이 스트림이 끝나면 null', async () => {
        fetchMock.mockResolvedValue(sseResponse([ACCEPTED]));

        const result = await callQueue({method: 'POST', path: '/admin-service/room/rooms', body: {}, token: 't'});

        expect(result).toBeNull();
    });

    it('[SUCCESS] token 이 null 이면 Authorization 헤더를 붙이지 않는다', async () => {
        fetchMock.mockResolvedValue(sseResponse([ACCEPTED, sseEvent('done', null)]));

        await callQueue({method: 'POST', path: '/user-service/store/applications', body: {store_name: '바로방'}, token: null});

        const {init} = fetchCall();
        expect(init.headers).not.toHaveProperty('Authorization');
        expect(init.headers).toEqual({Accept: 'text/event-stream', 'Content-Type': 'application/json'});
    });

    it('[FAIL:network] 스트림을 읽다 끊기면 NetworkError', async () => {
        const encoder = new TextEncoder();
        const broken = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(encoder.encode(ACCEPTED));
                controller.error(new TypeError('network error'));
            },
        });
        fetchMock.mockResolvedValue(new Response(broken, {status: 200, headers: {'Content-Type': 'text/event-stream'}}));

        const error = await callQueue({method: 'POST', path: '/admin-service/room/rooms', body: {}, token: 't'}).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(NetworkError);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
