// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { managerLoginPath, managerLoginUrl } from '@/app/manager/manager-auth';

/** 업체코드 */
const STORE_CODE = '3f9a2c7e5b1d4a8e9c0f6b2d7e4a1c21';

describe('managerLoginPath — 업체 로그인 주소', () => {
    it('[SUCCESS] 업체코드로 그 업체 로그인 주소를 만든다', () => {
        expect(managerLoginPath(STORE_CODE, null)).toBe(`/manager/${STORE_CODE}/login/`);
    });

    it('[SUCCESS] 같은 사이트의 돌아갈 주소는 붙인다', () => {
        expect(managerLoginPath(STORE_CODE, '/manager/rooms/')).toBe(`/manager/${STORE_CODE}/login/?return_url=%2Fmanager%2Frooms%2F`);
    });

    it('[FAIL:shape] 업체코드 모양이 아니면 만들지 않는다', () => {
        expect(managerLoginPath('not-a-store-code', null)).toBeNull();
    });
});

describe('managerLoginUrl — 업체 콘솔 로그인 주소(입점 신청 · 내 업체 설정)', () => {
    it('[SUCCESS] 프론트 주소 뒤에 업체코드 로그인 주소를 붙인다', () => {
        expect(managerLoginUrl(STORE_CODE, 'https://deskless.kr', '')).toBe(`https://deskless.kr/manager/${STORE_CODE}/login/`);
    });

    it('[SUCCESS] 하위 경로로 배포하면 그 경로를 사이에 넣는다', () => {
        expect(managerLoginUrl(STORE_CODE, 'https://deskless.kr', '/app')).toBe(`https://deskless.kr/app/manager/${STORE_CODE}/login/`);
    });

    it('[SUCCESS] 프론트 주소 끝에 / 가 있어도 겹치지 않는다', () => {
        expect(managerLoginUrl(STORE_CODE, 'https://deskless.kr/', '')).toBe(`https://deskless.kr/manager/${STORE_CODE}/login/`);
    });
});
