import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LoginContent from '@/app/(user)/login/LoginContent';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {replace, signIn, showErrorPopup} = vi.hoisted(() => ({replace: vi.fn(), signIn: vi.fn(), showErrorPopup: vi.fn()}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('next-auth/react', () => ({signIn}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

/**
 * 이용자 로그인 상태
 *
 * @param isLogin 로그인했는지
 */
function userAuth(isLogin: boolean): AuthContextType {
    return {area: 'user', token: isLogin ? 'token' : null, isLogin, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};
}

/**
 * Provider 로 감싸 그린다
 *
 * @param error 주소의 error
 * @param isLogin 로그인했는지
 */
function renderLogin(error: string | null, isLogin: boolean = false): void {
    render(
        <RootLayoutProvider rootLayoutLoading={false} auth={userAuth(isLogin)}>
            <LoginContent returnUrl="/stores/1/" error={error} />
        </RootLayoutProvider>,
    );
}

beforeEach(() => {
    replace.mockClear();
    signIn.mockClear();
    showErrorPopup.mockClear();
});

describe('LoginContent', () => {
    it('[SUCCESS] 카카오 · 네이버 버튼은 돌아갈 주소를 로그인 route 까지 들고 next-auth 를 시작한다', () => {
        renderLogin(null);

        fireEvent.click(screen.getByRole('button', {name: '카카오로 계속하기'}));
        fireEvent.click(screen.getByRole('button', {name: '네이버로 계속하기'}));

        expect(signIn).toHaveBeenCalledTimes(2);
        expect(signIn).toHaveBeenNthCalledWith(1, 'kakao', {callbackUrl: '/api/user/sns-login/?return_url=%2Fstores%2F1%2F'});
        expect(signIn).toHaveBeenNthCalledWith(2, 'naver', {callbackUrl: '/api/user/sns-login/?return_url=%2Fstores%2F1%2F'});
        expect(showErrorPopup).not.toHaveBeenCalled();
        expect(screen.getByRole('link', {name: '아이디 찾기'}).getAttribute('href')).toBe('/find-login-id/');
    });

    it('[FAIL:error] error 가 있으면 한 번 안내하고 주소에서 error 를 지운다', () => {
        renderLogin('retry');

        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.');
        expect(replace).toHaveBeenCalledWith('/login/?return_url=%2Fstores%2F1%2F');
        expect(signIn).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 이미 로그인했으면 돌아갈 주소로', () => {
        renderLogin(null, true);

        expect(replace).toHaveBeenCalledWith('/stores/1/');
    });
});
