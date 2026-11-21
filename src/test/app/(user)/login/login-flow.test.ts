// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { afterLoginPath, loginErrorMessage, loginErrorPath, snsLoginCallbackUrl } from '@/app/(user)/login/login-flow';

describe('afterLoginPath', () => {
    it('[SUCCESS] 휴대폰 인증 전이면 휴대폰 인증 — 같은 사이트 돌아갈 주소만 들고 간다', () => {
        expect(afterLoginPath(0, '/stores/1/')).toBe('/phone-verification/?return_url=%2Fstores%2F1%2F');
        expect(afterLoginPath(0, null)).toBe('/phone-verification/');
        expect(afterLoginPath(0, 'https://evil.com/')).toBe('/phone-verification/');
    });

    it('[SUCCESS] 인증했으면 돌아갈 주소(query 그대로), 없거나 다른 사이트면 첫 화면', () => {
        expect(afterLoginPath(1, '/stores/1/?date=2026-11-20')).toBe('/stores/1/?date=2026-11-20');
        expect(afterLoginPath(1, null)).toBe('/');
        expect(afterLoginPath(1, '//evil.com')).toBe('/');
    });
});

describe('login-flow 주소 · 문구', () => {
    it('[SUCCESS] next-auth callbackUrl 은 로그인 route + 돌아갈 주소', () => {
        expect(snsLoginCallbackUrl('/stores/1/')).toBe('/api/user/sns-login/?return_url=%2Fstores%2F1%2F');
        expect(snsLoginCallbackUrl(null)).toBe('/api/user/sns-login/');
    });

    it('[SUCCESS] basePath 로 띄우면 callbackUrl 앞에 basePath — next-auth 가 origin 뒤에 그대로 붙인다', () => {
        vi.stubEnv('NEXT_PUBLIC_LOCAL_SERVER_PREFIX', '/deskless');

        expect(snsLoginCallbackUrl('/stores/1/')).toBe('/deskless/api/user/sns-login/?return_url=%2Fstores%2F1%2F');

        vi.unstubAllEnvs();
    });

    it('[SUCCESS] 로그인 오류 주소 · 모르는 코드는 SNS 실패 문구', () => {
        expect(loginErrorPath('retry', '/stores/1/')).toBe('/login/?error=retry&return_url=%2Fstores%2F1%2F');
        expect(loginErrorMessage('retry')).toBe('서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.');
        expect(loginErrorMessage('OAuthCallback')).toBe('SNS 로그인을 마치지 못했어요. 다시 시도해 주세요.');
        expect(loginErrorMessage('constructor')).toBe('SNS 로그인을 마치지 못했어요. 다시 시도해 주세요.');
    });
});
