// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/cookie/[area]/route';
import { ACCESS_EARLY_EXPIRE_MS, refreshTokens, setTokenCookies, TokenSetType } from '@/app/api/cookie/token-cookie';
import { API_BASE_URL } from '@/shared/api/request';

type FakeCookieStoreType = {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
};

const {cookiesMock} = vi.hoisted(() => ({cookiesMock: vi.fn()}));

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
    headers: async () => ({get: (): null => null}),
}));

const fetchMock = vi.fn();

const TOKENS: TokenSetType = {
    access_token: 'new-access',
    refresh_token: 'new-refresh',
    access_token_expires_at: '2026-11-16T10:20:00.000Z',
    refresh_token_expires_at: '2027-11-16T10:00:00.000Z',
};

/**
 * 가짜 cookies() — 처음 쿠키 값
 *
 * @param initial 쿠키 이름 → 값
 */
function fakeCookieStore(initial: Record<string, string> = {}): FakeCookieStoreType {
    const values = new Map(Object.entries(initial));
    return {
        get: vi.fn((name: string) => (values.has(name) ? {name, value: values.get(name)} : undefined)),
        set: vi.fn((name: string, value: string) => {
            values.set(name, value);
        }),
    };
}

/**
 * set 호출 중 그 쿠키 이름의 [값, 옵션]
 *
 * @param store 가짜 cookies()
 * @param name 쿠키 이름
 */
function setCall(store: FakeCookieStoreType, name: string): [string, {expires: Date; httpOnly: boolean; path: string; maxAge?: number}] {
    const call = store.set.mock.calls.find((args) => args[0] === name);
    return [call[1], call[2]];
}

/**
 * route handler 의 [area] 인자
 *
 * @param area 영역 값
 */
function context(area: string): {params: Promise<{area: string}>} {
    return {params: Promise.resolve({area})};
}

/**
 * 토큰 저장 요청
 *
 * @param body 본문
 * @param contentType Content-Type
 */
function saveRequest(body: unknown, contentType: string = 'application/json'): Request {
    return new Request('http://localhost/api/cookie/user/', {method: 'POST', headers: {'Content-Type': contentType}, body: JSON.stringify(body)});
}

beforeEach(() => {
    fetchMock.mockReset();
    cookiesMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('token-cookie', () => {
    it('[SUCCESS] 영역 이름이 붙은 두 쿠키를 저장하고 access 는 60초 일찍 끝낸다', async () => {
        const store = fakeCookieStore();

        await setTokenCookies(store as never, 'manager', TOKENS);

        const [accessValue, accessOptions] = setCall(store, 'manager_access_token');
        const [refreshValue, refreshOptions] = setCall(store, 'manager_refresh_token');
        expect(store.set).toHaveBeenCalledTimes(2);
        expect(accessValue).toBe('new-access');
        expect(accessOptions.expires.getTime()).toBe(new Date(TOKENS.access_token_expires_at).getTime() - ACCESS_EARLY_EXPIRE_MS);
        expect(accessOptions.httpOnly).toBe(true);
        expect(accessOptions.path).toBe('/');
        expect(refreshValue).toBe('new-refresh');
        expect(refreshOptions.expires.getTime()).toBe(new Date(TOKENS.refresh_token_expires_at).getTime());
    });

    it('[SUCCESS] 영역마다 그 영역 token-refresh 를 refresh_token 본문으로 한 번 부른다', async () => {
        const cases: Array<[Parameters<typeof refreshTokens>[0], string]> = [
            ['user', '/user-service/user/token-refresh'],
            ['manager', '/admin-service/manager/token-refresh'],
            ['admin', '/admin-service/admin/token-refresh'],
        ];

        for (const [area, path] of cases) {
            fetchMock.mockReset();
            fetchMock.mockResolvedValue(new Response(JSON.stringify(TOKENS), {status: 200}));

            const result = await refreshTokens(area, 'r');

            expect(result).toEqual({state: 'ok', tokens: TOKENS});
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}${path}`);
            expect(fetchMock.mock.calls[0][1].method).toBe('POST');
            expect(fetchMock.mock.calls[0][1].body).toBe('{"refresh_token":"r"}');
        }
    });

    it('[FAIL:refresh] 재발급이 401 이면 invalid, 503 · 응답 없음이면 retry', async () => {
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({message: '로그인이 필요합니다.', validation_errors: null}), {status: 401}));
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({message: '잠시 뒤 다시 시도해 주세요.', validation_errors: null}), {status: 503}));
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        expect(await refreshTokens('user', 'expired')).toEqual({state: 'invalid'});
        expect(await refreshTokens('user', 'r')).toEqual({state: 'retry'});
        expect(await refreshTokens('user', 'r')).toEqual({state: 'retry'});
    });

    it('[SUCCESS] GET — access 쿠키가 있으면 그 값을 주고 재발급하지 않는다', async () => {
        cookiesMock.mockResolvedValue(fakeCookieStore({user_access_token: 'access', user_refresh_token: 'refresh'}));

        const response = await GET(new Request('http://localhost/api/cookie/user/'), context('user'));

        expect(await response.json()).toEqual({success: true, data: 'access'});
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('[SUCCESS] GET — access 쿠키가 없고 refresh 쿠키가 있으면 재발급해 두 쿠키를 새로 두고 새 access 를 준다', async () => {
        const store = fakeCookieStore({user_refresh_token: 'old-refresh'});
        cookiesMock.mockResolvedValue(store);
        fetchMock.mockResolvedValue(new Response(JSON.stringify(TOKENS), {status: 200}));

        const response = await GET(new Request('http://localhost/api/cookie/user/'), context('user'));

        expect(await response.json()).toEqual({success: true, data: 'new-access'});
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][1].body).toBe('{"refresh_token":"old-refresh"}');
        expect(setCall(store, 'user_access_token')[0]).toBe('new-access');
        expect(setCall(store, 'user_refresh_token')[0]).toBe('new-refresh');
    });

    it('[FAIL:refresh] GET — 재발급이 401 이면 두 쿠키를 지우고, 503 이면 쿠키를 그대로 두고 retry', async () => {
        const expired = fakeCookieStore({user_refresh_token: 'old-refresh'});
        const busy = fakeCookieStore({user_refresh_token: 'old-refresh'});
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({message: '로그인이 필요합니다.', validation_errors: null}), {status: 401}));
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({message: '잠시 뒤 다시 시도해 주세요.', validation_errors: null}), {status: 503}));

        cookiesMock.mockResolvedValueOnce(expired);
        const invalid = await GET(new Request('http://localhost/api/cookie/user/'), context('user'));
        cookiesMock.mockResolvedValueOnce(busy);
        const retry = await GET(new Request('http://localhost/api/cookie/user/'), context('user'));

        expect(await invalid.json()).toEqual({success: false});
        expect(setCall(expired, 'user_access_token')).toEqual(['', expect.objectContaining({maxAge: 0})]);
        expect(setCall(expired, 'user_refresh_token')).toEqual(['', expect.objectContaining({maxAge: 0})]);
        expect(await retry.json()).toEqual({success: false, retry: true});
        expect(busy.set).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 계정 쿠키 — 재발급하면 새 refresh 만료로 다시 쓰고, 로그인이 끝나면(401) 토큰과 함께 지운다 · 업체코드 쿠키는 그대로', async () => {
        const account = JSON.stringify({login_id: 'leaf_gangnam', auth_id: 'HEAD_MANAGER'});
        const renewed = fakeCookieStore({manager_refresh_token: 'old-refresh', manager_account: account, manager_store_code: 'code'});
        const expired = fakeCookieStore({manager_refresh_token: 'old-refresh', manager_account: account, manager_store_code: 'code'});
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(TOKENS), {status: 200}));
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({message: '로그인이 필요합니다.', validation_errors: null}), {status: 401}));

        cookiesMock.mockResolvedValueOnce(renewed);
        const ok = await GET(new Request('http://localhost/api/cookie/manager/'), context('manager'));
        cookiesMock.mockResolvedValueOnce(expired);
        const invalid = await GET(new Request('http://localhost/api/cookie/manager/'), context('manager'));

        expect(await ok.json()).toEqual({success: true, data: 'new-access'});
        const [accountValue, accountOptions] = setCall(renewed, 'manager_account');
        expect(JSON.parse(accountValue)).toEqual({login_id: 'leaf_gangnam', auth_id: 'HEAD_MANAGER'});
        expect(accountOptions.expires.getTime()).toBe(new Date(TOKENS.refresh_token_expires_at).getTime());
        expect(accountOptions.httpOnly).toBe(true);
        expect(await invalid.json()).toEqual({success: false});
        expect(setCall(expired, 'manager_account')).toEqual(['', expect.objectContaining({maxAge: 0})]);
        expect(renewed.set.mock.calls.some((args) => args[0] === 'manager_store_code')).toBe(false);
        expect(expired.set.mock.calls.some((args) => args[0] === 'manager_store_code')).toBe(false);
    });

    it('[FAIL:no-cookie] GET — 두 쿠키가 다 없거나 없는 영역이면 success false · 재발급 안 함', async () => {
        cookiesMock.mockResolvedValue(fakeCookieStore());

        const none = await GET(new Request('http://localhost/api/cookie/user/'), context('user'));
        const unknown = await GET(new Request('http://localhost/api/cookie/staff/'), context('staff'));

        expect(await none.json()).toEqual({success: false});
        expect(await unknown.json()).toEqual({success: false});
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('[SUCCESS] POST — JSON 으로 온 토큰 4개를 두 쿠키에 저장하고, 계정 쿠키는 지운다(계정은 로그인 route 만 쓴다)', async () => {
        const store = fakeCookieStore({manager_account: JSON.stringify({login_id: 'other', auth_id: 'HEAD_MANAGER'})});
        cookiesMock.mockResolvedValue(store);

        const response = await POST(saveRequest(TOKENS), context('manager'));

        expect(await response.json()).toEqual({success: true});
        expect(store.set).toHaveBeenCalledTimes(3);
        expect(setCall(store, 'manager_access_token')[0]).toBe('new-access');
        expect(setCall(store, 'manager_refresh_token')[0]).toBe('new-refresh');
        expect(setCall(store, 'manager_account')).toEqual(['', expect.objectContaining({maxAge: 0})]);
    });

    it('[FAIL:csrf] POST — JSON 이 아니거나 만료 시각을 읽을 수 없으면 저장하지 않는다', async () => {
        const store = fakeCookieStore();
        cookiesMock.mockResolvedValue(store);

        const plain = await POST(saveRequest(TOKENS, 'text/plain'), context('user'));
        const badDate = await POST(saveRequest({...TOKENS, access_token_expires_at: 'soon'}), context('user'));

        expect(await plain.json()).toEqual({success: false});
        expect(await badDate.json()).toEqual({success: false});
        expect(store.set).not.toHaveBeenCalled();
    });
});
