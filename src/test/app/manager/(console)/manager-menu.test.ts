// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MANAGER_MENU } from '@/app/manager/(console)/manager-menu';
import { activeMenuHref, visibleMenu } from '@/shared/components/console/console-menu';

describe('visibleMenu — 권한별 메뉴', () => {
    it('[SUCCESS] 업체 총관리자는 업체 관리자 메뉴까지 모두 본다', () => {
        expect(visibleMenu(MANAGER_MENU, 'HEAD_MANAGER').map((item) => item.label)).toEqual(['대시보드', '예약 현황', '문의', '호실', '객실 그룹', '상품 설정', '내 업체 설정', '업체 관리자']);
    });

    it('[FAIL:role] 업체 관리자이거나 권한을 모르면 업체 관리자 메뉴가 없다', () => {
        const expected = ['대시보드', '예약 현황', '문의', '호실', '객실 그룹', '상품 설정', '내 업체 설정'];
        expect(visibleMenu(MANAGER_MENU, 'MANAGER').map((item) => item.label)).toEqual(expected);
        expect(visibleMenu(MANAGER_MENU, null).map((item) => item.label)).toEqual(expected);
    });
});

describe('activeMenuHref — 지금 메뉴', () => {
    it('[SUCCESS] 메뉴 아래 주소도 그 메뉴로 본다', () => {
        expect(activeMenuHref('/manager/room-groups/abc/', MANAGER_MENU)).toBe('/manager/room-groups/');
    });

    it('[SUCCESS] 이름 앞부분만 같은 다른 메뉴는 고르지 않는다', () => {
        expect(activeMenuHref('/manager/rooms/', MANAGER_MENU)).toBe('/manager/rooms/');
        expect(activeMenuHref('/manager/rooms-archive/', MANAGER_MENU)).toBeNull();
    });

    it('[SUCCESS] 대시보드는 첫 화면에서만 강조한다', () => {
        expect(activeMenuHref('/manager/reservations/', MANAGER_MENU)).toBe('/manager/reservations/');
        expect(activeMenuHref('/manager/', MANAGER_MENU)).toBe('/manager/');
    });
});
