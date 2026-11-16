// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteAreaTokens, getAreaToken, refreshAreaToken, saveAreaTokens } from '@/shared/api/cookie';
import { NetworkError } from '@/shared/api/request';

const fetchMock = vi.fn();

/**
 * route handler JSON 응답
 *
 * @param body 본문
 */
function routeResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), {headers: {'Content-Type': 'application/json'}});
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe('토큰 쿠키 route 주소', () => {
    it('[SUCCESS] basePath 로 띄우면 route 주소 앞에 basePath — 조회 · 저장 · 삭제 · 재발급 모두', async () => {
        vi.stubEnv('NEXT_PUBLIC_LOCAL_SERVER_PREFIX', '/roomless');
        fetchMock.mockImplementation(async () => routeResponse({success: true, data: 'access'}));
        const tokens = {access_token: 'a', refresh_token: 'r', access_token_expires_at: '2026-11-16T10:20:00.000Z', refresh_token_expires_at: '2027-11-16T10:00:00.000Z'};

        await getAreaToken('user');
        await saveAreaTokens('manager', tokens);
        await deleteAreaTokens('admin');
        await refreshAreaToken('user');

        expect(fetchMock).toHaveBeenCalledTimes(4);
        expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method ?? 'GET'])).toEqual([
            ['/roomless/api/cookie/user/', 'GET'],
            ['/roomless/api/cookie/manager/', 'POST'],
            ['/roomless/api/cookie/admin/', 'DELETE'],
            ['/roomless/api/cookie/user/refresh/', 'POST'],
        ]);
    });
});

describe('refreshAreaToken', () => {
    it('[SUCCESS] 같은 영역 재발급이 동시에 걸리면 route handler 를 한 번만 부르고 결과를 나눈다', async () => {
        let resolveResponse: (response: Response) => void = () => undefined;
        fetchMock.mockReturnValue(new Promise<Response>((resolve) => {
            resolveResponse = resolve;
        }));

        const first = refreshAreaToken('user');
        const second = refreshAreaToken('user');
        resolveResponse(routeResponse({success: true, data: 'new'}));

        expect(await first).toBe('new');
        expect(await second).toBe('new');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('/api/cookie/user/refresh/');
        expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    });

    it('[SUCCESS] 끝난 뒤에 다시 부르면 새로 부른다', async () => {
        fetchMock.mockResolvedValueOnce(routeResponse({success: true, data: 'first'})).mockResolvedValueOnce(routeResponse({success: true, data: 'second'}));

        expect(await refreshAreaToken('manager')).toBe('first');
        expect(await refreshAreaToken('manager')).toBe('second');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('[FAIL:invalid] 로그인이 끝났으면(success false) null', async () => {
        fetchMock.mockResolvedValue(routeResponse({success: false}));

        expect(await refreshAreaToken('admin')).toBeNull();
    });

    it('[FAIL:retry] 일시 실패(retry) · 응답 없음은 NetworkError — 로그아웃하지 않게', async () => {
        fetchMock.mockResolvedValueOnce(routeResponse({success: false, retry: true})).mockRejectedValueOnce(new TypeError('Failed to fetch'));

        const retry = await refreshAreaToken('user').catch((caught: unknown) => caught);
        const offline = await refreshAreaToken('user').catch((caught: unknown) => caught);

        expect(retry).toBeInstanceOf(NetworkError);
        expect(offline).toBeInstanceOf(NetworkError);
    });
});
