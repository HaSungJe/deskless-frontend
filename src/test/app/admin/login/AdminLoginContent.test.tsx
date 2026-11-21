import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import AdminLoginContent from '@/app/admin/login/AdminLoginContent';
import { ApiError } from '@/shared/api/request';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {loginAdminByRoute, replace} = vi.hoisted(() => ({
    loginAdminByRoute: vi.fn(),
    replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/admin/api', () => ({loginAdminByRoute}));

/** 로그인 전 관리자 영역 */
const AUTH: AuthContextType = {area: 'admin', token: null, isLogin: false, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/**
 * 관리자 로그인 화면을 그린다
 *
 * @param returnUrl 돌아갈 주소
 */
async function renderLogin(returnUrl: string | null): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = render(
            <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                <AdminLoginContent returnUrl={returnUrl} />
            </RootLayoutProvider>,
        ).container;
    });
    return container;
}

/**
 * 아이디 · 비밀번호를 넣고 로그인을 누른다
 *
 * @param loginId 아이디
 * @param loginPw 비밀번호
 */
async function submitLogin(loginId: string, loginPw: string): Promise<void> {
    fireEvent.change(screen.getByLabelText('아이디'), {target: {value: loginId}});
    fireEvent.change(screen.getByLabelText('비밀번호'), {target: {value: loginPw}});
    await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: '로그인'}));
    });
}

beforeEach(() => {
    loginAdminByRoute.mockReset();
    replace.mockClear();
});

describe('AdminLoginContent', () => {
    it('[SUCCESS] 맞는 아이디 · 비밀번호로 로그인한다 → 로그인 처리 1번(앞뒤 빈칸을 뗀 아이디) → 돌아갈 주소', async () => {
        loginAdminByRoute.mockResolvedValue({is_password_change_required: 0});
        await renderLogin('/admin/stores/');
        expect(screen.getByRole('heading', {level: 1}).textContent).toBe('관리자 로그인');
        expect(screen.getByText('관리자 계정은 아이디 찾기 · 비밀번호 초기화를 제공하지 않습니다.')).toBeTruthy();

        await submitLogin(' admin ', 'adminpass2026');

        expect(loginAdminByRoute).toHaveBeenCalledTimes(1);
        expect({...loginAdminByRoute.mock.calls[0][0]}).toEqual({login_id: 'admin', login_pw: 'adminpass2026'});
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith('/admin/stores/');
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('[SUCCESS] 처음 로그인한 계정으로 로그인한다 → 비밀번호 변경 화면(처음 로그인 안내 띠)', async () => {
        loginAdminByRoute.mockResolvedValue({is_password_change_required: 1});
        await renderLogin('/admin/stores/');

        await submitLogin('admin', 'seedpass2026');

        expect(loginAdminByRoute).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith('/admin/password/?required=1');
    });

    it('[FAIL:login] 정지 계정으로 로그인한다 → 위험 띠(받은 문구 · "사유: …") · 비밀번호 칸 비움, 이동 0번', async () => {
        loginAdminByRoute.mockRejectedValue(new ApiError(400, {message: '이용이 제한된 계정입니다.', validation_errors: null, block_comment: '보안 점검으로 계정 사용을 잠시 멈췄습니다.'}));
        await renderLogin(null);

        await submitLogin('ops_kim', 'opspass2026');

        expect(loginAdminByRoute).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('alert').textContent).toBe('이용이 제한된 계정입니다.사유: 보안 점검으로 계정 사용을 잠시 멈췄습니다.');
        expect((screen.getByLabelText('비밀번호') as HTMLInputElement).value).toBe('');
        expect((screen.getByLabelText('아이디') as HTMLInputElement).value).toBe('ops_kim');
        expect(replace).not.toHaveBeenCalled();
        expect((screen.getByRole('button', {name: '로그인'}) as HTMLButtonElement).disabled).toBe(false);
    });

    it('[FAIL:validation] 아이디를 비우고 누른다 → 칸 옆 "아이디를 입력해주세요.", 로그인 처리 0번', async () => {
        const container = await renderLogin(null);

        await submitLogin('', 'adminpass2026');

        expect((container.querySelector('[data-type="validation-alert"][data-id="login_id"]') as HTMLElement).innerText).toBe('아이디를 입력해주세요.');
        expect(loginAdminByRoute).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });
});
