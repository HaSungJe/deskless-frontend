// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { isTestLoginEnabled } from '@/app/(user)/login/test-login';

describe('isTestLoginEnabled — 개발용 테스트 로그인을 쓸 수 있는지', () => {
    it('[SUCCESS] 개발 서버면 쓸 수 있다', () => {
        expect(isTestLoginEnabled({NODE_ENV: 'development'})).toBe(true);
    });

    it('[FAIL:production] 운영 빌드 · 테스트 실행에서는 쓰지 않는다', () => {
        expect(isTestLoginEnabled({NODE_ENV: 'production'})).toBe(false);
        expect(isTestLoginEnabled({NODE_ENV: 'test'})).toBe(false);
        expect(isTestLoginEnabled({})).toBe(false);
    });
});
