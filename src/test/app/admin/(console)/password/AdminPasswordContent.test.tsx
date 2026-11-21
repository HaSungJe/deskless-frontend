import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AdminConsoleContext } from '@/app/admin/(console)/admin-console-context';
import AdminPasswordContent from '@/app/admin/(console)/password/AdminPasswordContent';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {changeAdminPassword, replace, showErrorPopup} = vi.hoisted(() => ({
    changeAdminPassword: vi.fn(),
    replace: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/admin/api', () => ({changeAdminPassword}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

/** 로그인한 관리자 */
const AUTH: AuthContextType = {area: 'admin', token: 'admin-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/**
 * 콘솔 틀 안의 비밀번호 변경 화면을 그린다(계정은 콘솔 틀이 나눠 준 값)
 *
 * @param required 처음 로그인해서 왔는지
 */
async function renderPassword(required: boolean): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = render(
            <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                <AdminConsoleContext.Provider value={{account: {login_id: 'admin', auth_id: 'SUPER_ADMIN'}}}>
                    <AdminPasswordContent required={required} />
                </AdminConsoleContext.Provider>
            </RootLayoutProvider>,
        ).container;
    });
    return container;
}

/**
 * 현재 · 새 비밀번호를 넣고 변경을 누른다
 *
 * @param current 현재 비밀번호
 * @param next 새 비밀번호
 */
async function submitPassword(current: string, next: string): Promise<void> {
    fireEvent.change(screen.getByLabelText('현재 비밀번호'), {target: {value: current}});
    fireEvent.change(screen.getByLabelText('새 비밀번호'), {target: {value: next}});
    await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: '비밀번호 변경'}));
    });
}

beforeEach(() => {
    changeAdminPassword.mockReset().mockResolvedValue(null);
    replace.mockClear();
    showErrorPopup.mockClear();
});

describe('AdminPasswordContent', () => {
    it('[SUCCESS] 맞는 현재 비밀번호와 규칙에 맞는 새 비밀번호로 바꾼다 → 변경(큐) 1번 → "비밀번호를 변경했습니다." → 첫 화면', async () => {
        await renderPassword(true);
        expect(screen.getByText('지금 로그인한 관리자 계정(admin)의 비밀번호를 바꿉니다.')).toBeTruthy();
        expect(screen.getByText('처음 로그인했습니다. 새 비밀번호로 바꾼 뒤 콘솔을 쓰세요.')).toBeTruthy();

        await submitPassword('seedpass2026', 'adminpass2026!');

        expect(changeAdminPassword).toHaveBeenCalledTimes(1);
        expect(changeAdminPassword.mock.calls[0][0]).toMatchObject({token: 'admin-token'});
        expect({...changeAdminPassword.mock.calls[0][1]}).toEqual({current_password: 'seedpass2026', new_password: 'adminpass2026!'});
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('비밀번호를 변경했습니다.');
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith('/admin/');
    });

    it('[FAIL:validation] 새 비밀번호에 숫자가 없다 → 칸 옆 DTO 문구, 변경 0번', async () => {
        const container = await renderPassword(false);
        expect(screen.queryByText('처음 로그인했습니다. 새 비밀번호로 바꾼 뒤 콘솔을 쓰세요.')).toBeNull();

        await submitPassword('adminpass2026', 'adminadmin');

        expect((container.querySelector('[data-type="validation-alert"][data-id="new_password"]') as HTMLElement).innerText).toBe('비밀번호는 8~20자이며 영문과 숫자를 반드시 포함해야 합니다. (특수문자는 !@#$%^&* 만 허용)');
        expect(changeAdminPassword).not.toHaveBeenCalled();
        expect(showErrorPopup).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });
});
