import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ManagerPasswordContent from '@/app/manager/password/ManagerPasswordContent';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {changeManagerPassword, getAreaAccount, replace, showErrorPopup} = vi.hoisted(() => ({
    changeManagerPassword: vi.fn(),
    getAreaAccount: vi.fn(),
    replace: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/manager/api', () => ({changeManagerPassword}));
vi.mock('@/shared/api/cookie', async (importOriginal) => ({...(await importOriginal<typeof import('@/shared/api/cookie')>()), getAreaAccount}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

/** 로그인한 매니저 */
const AUTH: AuthContextType = {area: 'manager', token: 'manager-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/**
 * 비밀번호 변경 화면을 그리고 계정 읽기를 기다린다
 *
 * @param required 임시 비밀번호로 로그인해서 왔는지
 */
async function renderPassword(required: boolean): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = render(
            <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                <ManagerPasswordContent required={required} />
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
    changeManagerPassword.mockReset().mockResolvedValue(null);
    getAreaAccount.mockReset().mockResolvedValue({login_id: 'leaf_front01', auth_id: 'MANAGER'});
    replace.mockClear();
    showErrorPopup.mockClear();
});

describe('ManagerPasswordContent', () => {
    it('[SUCCESS] 맞는 현재 비밀번호와 규칙에 맞는 새 비밀번호로 바꾼다 → 변경(큐) 1번 → "비밀번호를 바꿨습니다." → 대시보드', async () => {
        await renderPassword(true);
        expect(screen.getByText('leaf_front01')).toBeTruthy();
        expect(screen.getByText('업체 관리자')).toBeTruthy();
        expect(screen.getByText('임시 비밀번호로 로그인했습니다. 새 비밀번호로 바꿔 주세요.')).toBeTruthy();

        await submitPassword('Tmp4k82q9z', 'leafpass2026!');

        expect(changeManagerPassword).toHaveBeenCalledTimes(1);
        expect(changeManagerPassword.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect({...changeManagerPassword.mock.calls[0][1]}).toEqual({current_password: 'Tmp4k82q9z', new_password: 'leafpass2026!'});
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('비밀번호를 바꿨습니다.');
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith('/manager/');
    });

    it('[FAIL:validation] 새 비밀번호에 숫자가 없다 → 칸 옆 DTO 문구, 변경 0번', async () => {
        const container = await renderPassword(false);
        expect(screen.queryByText('임시 비밀번호로 로그인했습니다. 새 비밀번호로 바꿔 주세요.')).toBeNull();

        await submitPassword('leafpass2026', 'leafleafleaf');

        expect((container.querySelector('[data-type="validation-alert"][data-id="new_password"]') as HTMLElement).innerText).toBe('비밀번호는 8~20자이며 영문과 숫자를 반드시 포함해야 합니다. (특수문자는 !@#$%^&* 만 허용)');
        expect(changeManagerPassword).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });
});
