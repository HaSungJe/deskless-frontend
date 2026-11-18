import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LoginContent from '@/app/(user)/login/LoginContent';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {replace, signIn, sessionProvider, showErrorPopup} = vi.hoisted(() => ({replace: vi.fn(), signIn: vi.fn(), sessionProvider: vi.fn(), showErrorPopup: vi.fn()}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('next-auth/react', () => ({
    signIn,
    SessionProvider: (props: {children: React.ReactNode}) => {
        sessionProvider(props);
        return props.children;
    },
}));
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
    sessionProvider.mockClear();
    showErrorPopup.mockClear();
});

afterEach(() => {
    vi.unstubAllEnvs();
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
        expect(sessionProvider).toHaveBeenLastCalledWith(expect.objectContaining({basePath: '/api/auth', session: null, refetchOnWindowFocus: false}));
    });

    it('[SUCCESS] basePath 로 띄우면 next-auth 주소 · callbackUrl 앞에 basePath', () => {
        vi.stubEnv('NEXT_PUBLIC_LOCAL_SERVER_PREFIX', '/roomless');
        renderLogin(null);

        fireEvent.click(screen.getByRole('button', {name: '카카오로 계속하기'}));

        expect(sessionProvider).toHaveBeenLastCalledWith(expect.objectContaining({basePath: '/roomless/api/auth'}));
        expect(signIn).toHaveBeenCalledTimes(1);
        expect(signIn).toHaveBeenCalledWith('kakao', {callbackUrl: '/roomless/api/user/sns-login/?return_url=%2Fstores%2F1%2F'});
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

    it('[SUCCESS] 개발 서버면 테스트 이용자 로그인 버튼이 돌아갈 주소를 들고 테스트 로그인 route 를 연다', () => {
        render(
            <RootLayoutProvider rootLayoutLoading={false} auth={userAuth(false)}>
                <LoginContent returnUrl="/stores/1/" error={null} testLogin />
            </RootLayoutProvider>,
        );

        expect(screen.getByRole('link', {name: '테스트 이용자로 로그인'}).getAttribute('href')).toBe('/api/user/test-login/?return_url=%2Fstores%2F1%2F');
        expect(signIn).not.toHaveBeenCalled();
    });

    it('[FAIL:disabled] 테스트 로그인을 쓸 수 없으면(운영 빌드) 버튼이 없다', () => {
        renderLogin(null);

        expect(screen.queryByRole('link', {name: '테스트 이용자로 로그인'})).toBeNull();
    });
});
