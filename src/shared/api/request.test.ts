// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, ApiError, request, UNREADABLE_FAIL_MESSAGE } from './request';

const fetchMock = vi.fn();

/**
 * JSON 응답
 *
 * @param body 본문
 * @param status 상태 코드
 */
function jsonResponse(body: unknown, status: number = 200): Response {
    return new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});
}

/**
 * fetch 에 넘긴 주소 · 옵션
 */
function fetchCall(): {url: string; init: RequestInit & {headers: Record<string, string>}} {
    const [url, init] = fetchMock.mock.calls[0];
    return {url, init};
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('request', () => {
    it('[SUCCESS] GET 은 빈 값을 뺀 query 를 붙이고 본문 없이 보내 JSON 을 돌려준다', async () => {
        const body: {list: Array<unknown>; pagination: unknown} = {list: [], pagination: null};
        fetchMock.mockResolvedValue(jsonResponse(body));

        const result = await request({path: '/user-service/discovery/stores', query: {page: 1, keyword: undefined}});

        expect(result).toEqual(body);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const {url, init} = fetchCall();
        expect(url).toBe(`${API_BASE_URL}/user-service/discovery/stores?page=1`);
        expect(init.method).toBe('GET');
        expect(init.body).toBeUndefined();
        expect(init.headers).toEqual({Accept: 'application/json'});
    });

    it('[SUCCESS] POST 본문은 JSON 문자열과 Content-Type 으로 보낸다', async () => {
        fetchMock.mockResolvedValue(jsonResponse({access_token: 'a'}));

        await request({method: 'POST', path: '/user-service/user/login', body: {login_id: 'a'}});

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const {init} = fetchCall();
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({Accept: 'application/json', 'Content-Type': 'application/json'});
        expect(init.body).toBe('{"login_id":"a"}');
    });

    it('[SUCCESS] token 이 있으면 Authorization: Bearer 를 붙인다', async () => {
        fetchMock.mockResolvedValue(jsonResponse({}));

        await request({path: '/user-service/user/me', token: 't'});

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchCall().init.headers).toEqual({Accept: 'application/json', Authorization: 'Bearer t'});
    });

    it('[FAIL:validation] 400 이면 실패 본문을 담은 ApiError 를 던진다', async () => {
        const body = {message: '입력값을 확인해 주세요.', validation_errors: [{property: 'login_id', message: '아이디를 입력해 주세요.'}]};
        fetchMock.mockResolvedValue(jsonResponse(body, 400));

        const error = await request({method: 'POST', path: '/user-service/user/login', body: {}}).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).body).toEqual(body);
        expect((error as ApiError).message).toBe('입력값을 확인해 주세요.');
    });

    it('[SUCCESS] 204 · 빈 본문이면 null', async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, {status: 204}));
        fetchMock.mockResolvedValueOnce(new Response('', {status: 200}));

        const noContent = await request({method: 'DELETE', path: '/admin-service/room/rooms/1', token: 't'});
        const empty = await request({path: '/admin-service/room/rooms/1', token: 't'});

        expect(noContent).toBeNull();
        expect(empty).toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('[FAIL:unreadable] JSON 이 아닌 502 본문은 상태 코드를 살려 읽을 수 없음 ApiError 로', async () => {
        fetchMock.mockResolvedValue(new Response('<html><body>502 Bad Gateway</body></html>', {status: 502, headers: {'Content-Type': 'text/html'}}));

        const error = await request({path: '/user-service/discovery/stores'}).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(502);
        expect((error as ApiError).body).toEqual({message: UNREADABLE_FAIL_MESSAGE, validation_errors: null});
    });
});
