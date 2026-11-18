// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/user/test-login/route';

const {cookiesMock, loginUser, setTokenCookies} = vi.hoisted(() => ({cookiesMock: vi.fn(), loginUser: vi.fn(), setTokenCookies: vi.fn()}));

vi.mock('next/headers', () => ({cookies: cookiesMock}));
vi.mock('@/contracts/user/api', () => ({loginUser}));
vi.mock('@/app/api/cookie/token-cookie', () => ({setTokenCookies}));

/** 백엔드 로그인 결과 — 휴대폰 인증 전 */
const LOGIN_RESULT = {
    access_token: 'user-access',
    refresh_token: 'user-refresh',
    access_token_expires_at: '2026-11-18T10:20:00.000Z',
    refresh_token_expires_at: '2027-11-18T10:00:00.000Z',
    is_phone_verified: 0,
};

/** 가짜 cookies() */
const COOKIE_STORE = {get: vi.fn(), set: vi.fn(), delete: vi.fn(), getAll: vi.fn(() => [])};

/**
 * 테스트 로그인 요청
 *
 * @param returnUrl 돌아갈 주소
 */
function request(returnUrl: string): NextRequest {
    return new NextRequest(`http://localhost:5000/api/user/test-login/?return_url=${encodeURIComponent(returnUrl)}`);
}

beforeEach(() => {
    cookiesMock.mockReset().mockResolvedValue(COOKIE_STORE);
    loginUser.mockReset().mockResolvedValue(LOGIN_RESULT);
    setTokenCookies.mockReset().mockResolvedValue(undefined);
    vi.stubEnv('NEXT_PUBLIC_LOCAL_SERVER_PREFIX', '');
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('GET /api/user/test-login/', () => {
    it('[SUCCESS] 개발 서버(카카오 키가 있어도) → 테스트 이용자로 로그인 1번 → 이용자 토큰 쿠키 → 휴대폰 인증(돌아갈 주소를 들고) 303', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        vi.stubEnv('KAKAO_LOGIN_CLIENT_ID', 'kakao-key');

        const response = await GET(request('/me/'));

        expect(loginUser).toHaveBeenCalledTimes(1);
        expect(loginUser).toHaveBeenCalledWith({sns_id: 'KAKAO', sns_user_id: 'sample-user-01'});
        expect(setTokenCookies).toHaveBeenCalledTimes(1);
        expect(setTokenCookies).toHaveBeenCalledWith(COOKIE_STORE, 'user', LOGIN_RESULT);
        expect(response.status).toBe(303);
        expect(response.headers.get('Location')).toBe('/phone-verification/?return_url=%2Fme%2F');
    });

    it('[FAIL:production] 운영 빌드면 404, 로그인하지 않는다', async () => {
        vi.stubEnv('NODE_ENV', 'production');

        const response = await GET(request('/me/'));

        expect(response.status).toBe(404);
        expect(loginUser).not.toHaveBeenCalled();
    });
});
