// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { managerLoginPath, shortStoreCode } from '@/app/manager/manager-auth';

/** 업체코드 */
const STORE_CODE = '3f9a2c7e5b1d4a8e9c0f6b2d7e4a1c21';

describe('shortStoreCode — 업체코드 줄임', () => {
    it('[SUCCESS] 32자 업체코드는 앞 8자에 줄임표를 붙인다', () => {
        expect(shortStoreCode(STORE_CODE)).toBe('3f9a2c7e…');
    });

    it('[SUCCESS] 8자 이하면 그대로 보인다', () => {
        expect(shortStoreCode('3f9a2c7e')).toBe('3f9a2c7e');
    });
});

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
