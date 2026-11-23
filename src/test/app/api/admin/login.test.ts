// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/login/route';
import { apiBaseUrl } from '@/shared/api/request';

const {cookiesMock} = vi.hoisted(() => ({cookiesMock: vi.fn()}));

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
    headers: async () => ({get: (): null => null}),
}));

type FakeCookieStoreType = {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
};

const fetchMock = vi.fn();

/** 로그인 칸 */
const FORM = {login_id: 'admin', login_pw: 'adminpass2026'};

/** 백엔드 로그인 결과 */
const LOGIN_RESULT = {
    access_token: 'admin-access',
    refresh_token: 'admin-refresh',
    access_token_expires_at: '2026-11-22T10:20:00.000Z',
    refresh_token_expires_at: '2027-11-22T10:00:00.000Z',
    is_password_change_required: 1,
    auth_id: 'SUPER_ADMIN',
};

/**
 * 가짜 cookies()
 */
function fakeCookieStore(): FakeCookieStoreType {
    return {get: vi.fn(), set: vi.fn()};
}

/**
 * 같은 사이트 JSON 로그인 요청
 *
 * @param body 본문
 */
function loginRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/admin/login/', {method: 'POST', headers: {'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin'}, body: JSON.stringify(body)});
}

/**
 * set 호출 중 그 쿠키 이름의 [값, 옵션]
 *
 * @param store 가짜 cookies()
 * @param name 쿠키 이름
 */
function setCall(store: FakeCookieStoreType, name: string): [string, {expires: Date; httpOnly: boolean}] | null {
    const call = store.set.mock.calls.find((args) => args[0] === name);
    return call ? [call[1], call[2]] : null;
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

describe('POST /api/admin/login', () => {
    it('[SUCCESS] 백엔드 로그인 1번 → 토큰 · 계정 쿠키(업체코드 쿠키 없음) → 비밀번호 변경 필요 여부', async () => {
        const store = fakeCookieStore();
        cookiesMock.mockResolvedValue(store);
        fetchMock.mockResolvedValue(new Response(JSON.stringify(LOGIN_RESULT), {status: 200}));

        const response = await POST(loginRequest(FORM));

        expect(await response.json()).toEqual({success: true, data: {is_password_change_required: 1}});
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe(`${apiBaseUrl()}/admin-service/admin/login`);
        expect(fetchMock.mock.calls[0][1].method).toBe('POST');
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(FORM);
        expect(store.set).toHaveBeenCalledTimes(3);
        expect(setCall(store, 'admin_access_token')?.[0]).toBe('admin-access');
        expect(setCall(store, 'admin_refresh_token')?.[0]).toBe('admin-refresh');
        const account = setCall(store, 'admin_account');
        expect(JSON.parse(account?.[0] ?? '')).toEqual({login_id: 'admin', auth_id: 'SUPER_ADMIN'});
        expect(account?.[1].httpOnly).toBe(true);
        expect(account?.[1].expires.getTime()).toBe(new Date(LOGIN_RESULT.refresh_token_expires_at).getTime());
    });

    it('[FAIL:backend] 백엔드가 404 · 403 으로 거절하면 받은 문구 · 정지 사유 그대로, 쿠키 0개', async () => {
        const store = fakeCookieStore();
        cookiesMock.mockResolvedValue(store);
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({message: '잘못된 로그인 정보입니다.', validation_errors: null}), {status: 404}));
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({message: '이용이 제한된 계정입니다.', validation_errors: null, block_comment: '보안 점검'}), {status: 403}));

        const notFound = await POST(loginRequest(FORM));
        const blocked = await POST(loginRequest(FORM));

        expect(await notFound.json()).toEqual({success: false, message: '잘못된 로그인 정보입니다.', validation_errors: null, block_comment: null});
        expect(await blocked.json()).toEqual({success: false, message: '이용이 제한된 계정입니다.', validation_errors: null, block_comment: '보안 점검'});
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(store.set).not.toHaveBeenCalled();
    });
});
