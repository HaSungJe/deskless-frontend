import { afterEach, describe, expect, it, vi } from 'vitest';
import { withBasePath } from '@/shared/utils/base-path';

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('withBasePath', () => {
    it('[SUCCESS] basePath 가 없으면 주소 그대로', () => {
        vi.stubEnv('NEXT_PUBLIC_LOCAL_SERVER_PREFIX', '');

        expect(withBasePath('/api/cookie/user/')).toBe('/api/cookie/user/');
        expect(withBasePath('/login/?error=sns')).toBe('/login/?error=sns');
    });

    it('[SUCCESS] basePath 가 있으면 앞에 붙인다 — query 그대로', () => {
        vi.stubEnv('NEXT_PUBLIC_LOCAL_SERVER_PREFIX', '/roomless');

        expect(withBasePath('/api/cookie/user/')).toBe('/roomless/api/cookie/user/');
        expect(withBasePath('/api/user/sns-login/?return_url=%2Fstores%2F1%2F')).toBe('/roomless/api/user/sns-login/?return_url=%2Fstores%2F1%2F');
    });
});
