import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ManagerLoginContent from '@/app/manager/[store_code]/login/ManagerLoginContent';
import { ApiError } from '@/shared/api/request';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {loginManagerByRoute, getLoginStore, replace} = vi.hoisted(() => ({
    loginManagerByRoute: vi.fn(),
    getLoginStore: vi.fn(),
    replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/manager/api', () => ({loginManagerByRoute}));
vi.mock('@/contracts/store/api', () => ({getLoginStore}));

/** 로그인 전 매니저 영역 */
const AUTH: AuthContextType = {area: 'manager', token: null, isLogin: false, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/** 주소의 업체코드 */
const STORE_CODE = '3f9a2c7e5b1d4a8e9c0f6b2d7e4a1c21';

/**
 * 업체 로그인 화면을 그리고 업체 확인을 기다린다
 *
 * @param returnUrl 돌아갈 주소
 */
async function renderLogin(returnUrl: string | null): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = render(
            <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                <ManagerLoginContent storeCode={STORE_CODE} returnUrl={returnUrl} />
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
    loginManagerByRoute.mockReset();
    getLoginStore.mockReset().mockResolvedValue({store_id: 's'.repeat(32), store_code: STORE_CODE, store_name: '스테이 리프 강남역점'});
    replace.mockClear();
});

describe('ManagerLoginContent', () => {
    it('[SUCCESS] 맞는 아이디 · 비밀번호로 로그인한다 → 업체 확인 1번(제목에 업체명) → 로그인 처리 1번(주소의 업체코드 그대로) → 돌아갈 주소', async () => {
        loginManagerByRoute.mockResolvedValue({is_password_change_required: 0});
        await renderLogin('/manager/rooms/');

        expect(getLoginStore).toHaveBeenCalledTimes(1);
        expect(getLoginStore.mock.calls[0][0]).toBe(STORE_CODE);
        expect(screen.getByRole('heading', {level: 1}).textContent).toBe('스테이 리프 강남역점');
        expect(screen.getByText('업체 관리자 로그인')).toBeTruthy();

        await submitLogin('leaf_gangnam', 'leafpass2026');

        expect(loginManagerByRoute).toHaveBeenCalledTimes(1);
        expect({...loginManagerByRoute.mock.calls[0][0]}).toEqual({store_code: STORE_CODE, login_id: 'leaf_gangnam', login_pw: 'leafpass2026'});
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith('/manager/rooms/');
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('[FAIL:login] 정지 계정으로 로그인한다 → 받은 문구 · 정지 사유 띠(alert), 이동 0번 · 다시 누를 수 있다', async () => {
        loginManagerByRoute.mockRejectedValue(new ApiError(400, {message: '이용이 제한된 계정입니다.', validation_errors: null, block_comment: '근무 종료'}));
        await renderLogin(null);

        await submitLogin('leaf_front01', 'leafpass2026');

        expect(loginManagerByRoute).toHaveBeenCalledTimes(1);
        const band = screen.getByRole('alert');
        expect(band.textContent).toBe('이용이 제한된 계정입니다.정지 사유: 근무 종료');
        expect(replace).not.toHaveBeenCalled();
        expect((screen.getByRole('button', {name: '로그인'}) as HTMLButtonElement).disabled).toBe(false);
    });

    it('[SUCCESS] 임시 비밀번호로 로그인한다 → 비밀번호 변경 화면(임시 비밀번호 안내 띠)', async () => {
        loginManagerByRoute.mockResolvedValue({is_password_change_required: 1});
        await renderLogin('/manager/rooms/');

        await submitLogin('leaf_front01', 'Tmp4k82q9z');

        expect(loginManagerByRoute).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith('/manager/password/?required=1');
    });

    it('[FAIL:validation] 아이디를 비우고 누른다 → 칸 옆 "아이디를 입력해주세요.", 로그인 처리 0번', async () => {
        const container = await renderLogin(null);

        await submitLogin('', 'leafpass2026');

        expect((container.querySelector('[data-type="validation-alert"][data-id="login_id"]') as HTMLElement).innerText).toBe('아이디를 입력해주세요.');
        expect(loginManagerByRoute).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });

    it('[FAIL:not-found] 없는 업체코드(업체 ID 등)로 들어온다 → "업체 로그인 주소를 확인해 주세요" · 다시 입력 링크, 로그인 칸 없음 · 로그인 처리 0번', async () => {
        getLoginStore.mockRejectedValue(new ApiError(404, {message: '업체를 찾을 수 없습니다.', validation_errors: null}));
        await renderLogin(null);

        expect(getLoginStore).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('heading', {name: '업체 로그인 주소를 확인해 주세요'})).toBeTruthy();
        expect(screen.getByRole('link', {name: '업체코드 다시 입력'}).getAttribute('href')).toBe('/manager/login/?manual=1');
        expect(screen.queryByLabelText('아이디')).toBeNull();
        expect(screen.queryByRole('button', {name: '로그인'})).toBeNull();
        expect(loginManagerByRoute).not.toHaveBeenCalled();
    });
});
