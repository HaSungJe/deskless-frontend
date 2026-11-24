import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import ManagerConsoleLayoutContent from '@/app/manager/(console)/ManagerConsoleLayoutContent';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {getMyStore, getAreaAccount, replaceDocument, logout, showErrorPopup} = vi.hoisted(() => ({
    getMyStore: vi.fn(),
    getAreaAccount: vi.fn(),
    replaceDocument: vi.fn(),
    logout: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('next/navigation', () => ({usePathname: () => '/manager/'}));
vi.mock('@/contracts/store/api', () => ({getMyStore}));
vi.mock('@/shared/api/cookie', async (importOriginal) => ({...(await importOriginal<typeof import('@/shared/api/cookie')>()), getAreaAccount}));
vi.mock('@/shared/utils/base-path', async (importOriginal) => ({...(await importOriginal<typeof import('@/shared/utils/base-path')>()), replaceDocument}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

/** 로그인한 매니저 */
const AUTH: AuthContextType = {area: 'manager', token: 'manager-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout};

/** 업체코드 */
const STORE_CODE = '3f9a2c7e5b1d4a8e9c0f6b2d7e4a1c21';

beforeEach(() => {
    getMyStore.mockReset().mockResolvedValue({store_id: 's'.repeat(32), store_code: STORE_CODE, store_name: '스테이 리프 강남역점', store_state_id: 'ACTIVE', suspend_comment: null});
    getAreaAccount.mockReset().mockResolvedValue({login_id: 'leaf_gangnam', auth_id: 'HEAD_MANAGER'});
    logout.mockReset().mockResolvedValue(true);
    replaceDocument.mockClear();
    showErrorPopup.mockClear();
});

describe('ManagerConsoleLayoutContent', () => {
    it('[SUCCESS] 업체 총관리자가 들어와 로그아웃한다 → 상단 바 · 메뉴 7개 → 쿠키 삭제 1번 → 업체 로그인 주소 안내를 새로 연다', async () => {
        await act(async () => {
            render(
                <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                    <ManagerConsoleLayoutContent><p>대시보드 자리</p></ManagerConsoleLayoutContent>
                </RootLayoutProvider>,
            );
        });

        expect(getMyStore).toHaveBeenCalledTimes(1);
        expect(getMyStore.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(getAreaAccount).toHaveBeenCalledTimes(1);
        expect(getAreaAccount).toHaveBeenCalledWith('manager');
        const top = within(screen.getByRole('banner'));
        expect(top.getByText('스테이 리프 강남역점')).toBeTruthy();
        expect(top.queryByText(/업체코드/)).toBeNull();
        expect(top.getByText('leaf_gangnam')).toBeTruthy();
        expect(top.getByText('업체 총관리자')).toBeTruthy();
        expect(top.getByRole('link', {name: '비밀번호 변경'}).getAttribute('href')).toBe('/manager/password/');
        const menu = within(screen.getByRole('navigation'));
        expect(menu.getAllByRole('link').map((link) => link.textContent)).toEqual(['대시보드', '예약 현황', '문의', '호실', '객실 그룹', '상품 설정', '내 업체 설정', '업체 관리자']);
        expect(menu.getByRole('link', {name: '대시보드'}).getAttribute('aria-current')).toBe('page');
        expect(screen.getByText('대시보드 자리')).toBeTruthy();

        await act(async () => {
            fireEvent.click(top.getByRole('button', {name: '로그아웃'}));
        });

        expect(logout).toHaveBeenCalledTimes(1);
        expect(replaceDocument).toHaveBeenCalledTimes(1);
        expect(replaceDocument).toHaveBeenCalledWith('/manager/login/');
        expect(showErrorPopup).not.toHaveBeenCalled();
    });
});
