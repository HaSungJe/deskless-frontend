// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyPublicEnv, getPublicEnv, publicEnvValues } from '@/shared/utils/public-env';

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe('getPublicEnv — 공개 값 읽기 한 곳', () => {
    it('[SUCCESS] 서버 — 부를 때의 process.env 를 읽는다(실행 값을 바꾸면 바로 바뀐 값), 비었으면 undefined', () => {
        vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://gateway.local');
        expect(getPublicEnv('NEXT_PUBLIC_API_URL')).toBe('http://gateway.local');

        vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.deskless.kr');
        expect(getPublicEnv('NEXT_PUBLIC_API_URL')).toBe('https://api.deskless.kr');

        vi.stubEnv('NEXT_PUBLIC_API_URL', '');
        expect(getPublicEnv('NEXT_PUBLIC_API_URL')).toBeUndefined();
    });

    it('[SUCCESS] 브라우저 — 루트 layout 이 넘긴 값만 읽는다(process.env 는 보지 않는다)', () => {
        vi.stubGlobal('window', {});
        vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://server-only.local');
        expect(getPublicEnv('NEXT_PUBLIC_API_URL')).toBeUndefined();

        applyPublicEnv({NEXT_PUBLIC_API_URL: 'https://api.deskless.kr'});

        expect(getPublicEnv('NEXT_PUBLIC_API_URL')).toBe('https://api.deskless.kr');
        expect(getPublicEnv('NEXT_PUBLIC_TOSS_CLIENT_KEY')).toBeUndefined();
    });
});

describe('publicEnvValues — 브라우저로 넘길 공개 값(허용 목록)', () => {
    it('[SUCCESS] NEXT_PUBLIC_ 로 시작하는 값만 — 빈 값은 뺀다', () => {
        expect(publicEnvValues({
            NEXT_PUBLIC_API_URL: 'https://api.deskless.kr',
            NEXT_PUBLIC_TOSS_CLIENT_KEY: 'test_gck_x',
            NEXT_PUBLIC_GA4_ID: '',
        })).toEqual({NEXT_PUBLIC_API_URL: 'https://api.deskless.kr', NEXT_PUBLIC_TOSS_CLIENT_KEY: 'test_gck_x'});
    });

    it('[FAIL:server-only] 서버 전용 값 · 빌드 값(basePath)은 넘기지 않는다', () => {
        expect(publicEnvValues({
            NEXT_PUBLIC_SERVER_URL: 'https://deskless.kr',
            NEXT_PUBLIC_LOCAL_SERVER_PREFIX: '/deskless',
            NEXTAUTH_SECRET: 'secret',
            TOSS_SECRET_KEY: 'test_gsk_x',
            API_INTERNAL_URL: 'http://gateway:3000',
            KAKAO_LOGIN_SECRET_ID: 'kakao-secret',
        })).toEqual({NEXT_PUBLIC_SERVER_URL: 'https://deskless.kr'});
    });
});
