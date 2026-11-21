import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import AdminConsoleLayoutContent from '@/app/admin/(console)/AdminConsoleLayoutContent';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {getAreaAccount, replaceDocument, logout, showErrorPopup} = vi.hoisted(() => ({
    getAreaAccount: vi.fn(),
    replaceDocument: vi.fn(),
    logout: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('next/navigation', () => ({usePathname: () => '/admin/'}));
vi.mock('@/shared/api/cookie', async (importOriginal) => ({...(await importOriginal<typeof import('@/shared/api/cookie')>()), getAreaAccount}));
vi.mock('@/shared/utils/base-path', async (importOriginal) => ({...(await importOriginal<typeof import('@/shared/utils/base-path')>()), replaceDocument}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

/** 로그인한 관리자 */
const AUTH: AuthContextType = {area: 'admin', token: 'admin-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout};

beforeEach(() => {
    getAreaAccount.mockReset().mockResolvedValue({login_id: 'admin', auth_id: 'SUPER_ADMIN'});
    logout.mockReset().mockResolvedValue(true);
    replaceDocument.mockClear();
    showErrorPopup.mockClear();
});

describe('AdminConsoleLayoutContent', () => {
    it('[SUCCESS] 총괄관리자가 들어와 로그아웃한다 → 상단 바(아이디 · 총괄관리자) · 메뉴 5개 → 쿠키 삭제 1번 → 관리자 로그인 화면을 새로 연다', async () => {
        await act(async () => {
            render(
                <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                    <AdminConsoleLayoutContent><p>대시보드 자리</p></AdminConsoleLayoutContent>
                </RootLayoutProvider>,
            );
        });

        expect(getAreaAccount).toHaveBeenCalledTimes(1);
        expect(getAreaAccount).toHaveBeenCalledWith('admin');
        const top = within(screen.getByRole('banner'));
        expect(top.getByText('admin')).toBeTruthy();
        expect(top.getByText('총괄관리자')).toBeTruthy();
        const passwordLink = top.getByRole('link', {name: '비밀번호 변경'});
        expect(passwordLink.getAttribute('href')).toBe('/admin/password/');
        expect(passwordLink.getAttribute('aria-current')).toBeNull();
        const menu = within(screen.getByRole('navigation'));
        expect(menu.getAllByRole('link').map((link) => link.textContent)).toEqual(['대시보드', '입점 신청', '업체', '업체 관리자', '이용자']);
        expect(menu.getByRole('link', {name: '대시보드'}).getAttribute('aria-current')).toBe('page');
        expect(screen.getByText('대시보드 자리')).toBeTruthy();

        await act(async () => {
            fireEvent.click(top.getByRole('button', {name: '로그아웃'}));
        });

        expect(logout).toHaveBeenCalledTimes(1);
        expect(replaceDocument).toHaveBeenCalledTimes(1);
        expect(replaceDocument).toHaveBeenCalledWith('/admin/login/');
        expect(showErrorPopup).not.toHaveBeenCalled();
    });
});
