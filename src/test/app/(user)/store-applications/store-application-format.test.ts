// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { managerLoginUrl } from '@/app/(user)/store-applications/store-application-format';

/** 업체코드 — 32자 */
const STORE_CODE = '3f9a2c7e5b1d4a8e9c0f6b2d7e4a1c21';

describe('managerLoginUrl — 업체 콘솔 로그인 주소', () => {
    it('[SUCCESS] 프론트 주소 뒤에 업체코드 로그인 주소를 붙인다', () => {
        expect(managerLoginUrl(STORE_CODE, 'https://roomless.kr', '')).toBe(`https://roomless.kr/manager/${STORE_CODE}/login/`);
    });

    it('[SUCCESS] 하위 경로로 배포하면 그 경로를 사이에 넣는다', () => {
        expect(managerLoginUrl(STORE_CODE, 'https://roomless.kr', '/app')).toBe(`https://roomless.kr/app/manager/${STORE_CODE}/login/`);
    });

    it('[SUCCESS] 프론트 주소 끝에 / 가 있어도 겹치지 않는다', () => {
        expect(managerLoginUrl(STORE_CODE, 'https://roomless.kr/', '')).toBe(`https://roomless.kr/manager/${STORE_CODE}/login/`);
    });
});
