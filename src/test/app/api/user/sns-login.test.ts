// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/user/sns-login/route';
import { API_BASE_URL } from '@/shared/api/request';

const {cookiesMock, getTokenMock} = vi.hoisted(() => ({cookiesMock: vi.fn(), getTokenMock: vi.fn()}));

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
    headers: async () => ({get: (): null => null}),
}));

vi.mock('next-auth/jwt', () => ({getToken: getTokenMock}));

type FakeCookieStoreType = {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
};

const fetchMock = vi.fn();

/** 백엔드 로그인 결과(휴대폰 인증 전) */
const LOGIN_RESULT = {
    access_token: 'user-access',
    refresh_token: 'user-refresh',
    access_token_expires_at: '2026-11-16T10:20:00.000Z',
    refresh_token_expires_at: '2027-11-16T10:00:00.000Z',
    is_phone_verified: 0,
    state_id: 'ACTIVE',
    block_comment: null as string | null,
    leave_reserved_at: null as string | null,
};

/** next-auth 가 남긴 쿠키 — 로그인하면 지운다 */
const NEXT_AUTH_COOKIES = ['next-auth.session-token', 'next-auth.csrf-token', 'next-auth.callback-url'];

/**
 * 가짜 cookies() — getAll 은 next-auth 쿠키 + 다른 쿠키 하나
 */
function fakeCookieStore(): FakeCookieStoreType {
    return {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn(() => [...NEXT_AUTH_COOKIES, 'manager_access_token'].map((name) => ({name, value: 'x'}))),
    };
}

/**
 * OAuth 가 돌아오는 요청 — return_url 붙음
 */
function snsLoginRequest(): NextRequest {
    return new NextRequest('http://localhost:5000/api/user/sns-login/?return_url=%2Fstores%2F1%2F');
}

let store: FakeCookieStoreType;

beforeEach(() => {
    fetchMock.mockReset();
    getTokenMock.mockReset();
    store = fakeCookieStore();
    cookiesMock.mockReset();
    cookiesMock.mockResolvedValue(store);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('NEXTAUTH_SECRET', 'test-secret');
    vi.stubEnv('NEXT_PUBLIC_LOCAL_SERVER_PREFIX', '');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe('GET /api/user/sns-login', () => {
    it('[SUCCESS] SNS 세션으로 백엔드 로그인 → 이용자 토큰 쿠키 · next-auth 쿠키 삭제 → 휴대폰 인증으로 303', async () => {
        getTokenMock.mockResolvedValue({sns_id: 'KAKAO', sns_user_id: '1234567890'});
        fetchMock.mockResolvedValue(new Response(JSON.stringify(LOGIN_RESULT), {status: 200}));
        const request = snsLoginRequest();

        const response = await GET(request);

        expect(response.status).toBe(303);
        expect(response.headers.get('Location')).toBe('/phone-verification/?return_url=%2Fstores%2F1%2F');
        expect(getTokenMock).toHaveBeenCalledWith({req: request, secret: 'test-secret'});
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/user-service/user/login`);
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({sns_id: 'KAKAO', sns_user_id: '1234567890'});
        expect(store.set.mock.calls.map((call) => call[0])).toEqual(['user_access_token', 'user_refresh_token']);
        expect(store.delete.mock.calls.map((call) => call[0])).toEqual(NEXT_AUTH_COOKIES.map((name) => ({name, path: '/', secure: false})));
    });

    it('[FAIL:not-signed] 백엔드 404 면 가입으로 303 — 토큰 쿠키 · next-auth 쿠키를 건드리지 않는다', async () => {
        getTokenMock.mockResolvedValue({sns_id: 'KAKAO', sns_user_id: '1234567890'});
        fetchMock.mockResolvedValue(new Response(JSON.stringify({message: '잘못된 로그인 정보입니다.', validation_errors: null}), {status: 404}));

        const response = await GET(snsLoginRequest());

        expect(response.status).toBe(303);
        expect(response.headers.get('Location')).toBe('/signup/?sns=KAKAO&return_url=%2Fstores%2F1%2F');
        expect(store.set).not.toHaveBeenCalled();
        expect(store.delete).not.toHaveBeenCalled();
    });

    it('[FAIL:no-sns] SNS 세션이 없으면 백엔드를 부르지 않고 로그인 화면 + error=sns', async () => {
        getTokenMock.mockResolvedValue(null);

        const response = await GET(snsLoginRequest());

        expect(response.headers.get('Location')).toBe('/login/?error=sns&return_url=%2Fstores%2F1%2F');
        expect(fetchMock).not.toHaveBeenCalled();
        expect(store.set).not.toHaveBeenCalled();
    });

    it('[FAIL:retry] 백엔드 503 · 응답 없음은 로그인 화면 + error=retry, 그 밖 4xx 는 error=login', async () => {
        getTokenMock.mockResolvedValue({sns_id: 'NAVER', sns_user_id: 'aBc-123_xyz'});
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({message: '잠시 뒤', validation_errors: null}), {status: 503}));
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({message: '잘못된 요청', validation_errors: null}), {status: 400}));

        const busy = await GET(snsLoginRequest());
        const offline = await GET(snsLoginRequest());
        const rejected = await GET(snsLoginRequest());

        expect(busy.headers.get('Location')).toBe('/login/?error=retry&return_url=%2Fstores%2F1%2F');
        expect(offline.headers.get('Location')).toBe('/login/?error=retry&return_url=%2Fstores%2F1%2F');
        expect(rejected.headers.get('Location')).toBe('/login/?error=login&return_url=%2Fstores%2F1%2F');
        expect(store.set).not.toHaveBeenCalled();
    });
});
