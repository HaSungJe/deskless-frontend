import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthGuard from '@/shared/components/AuthGuard';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {replace, pathname} = vi.hoisted(() => ({replace: vi.fn(), pathname: {value: '/manager/rooms/'}}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({replace}),
    usePathname: () => pathname.value,
}));

/**
 * 매니저 영역 로그인 상태
 *
 * @param isLogin 로그인했는지
 */
function managerAuth(isLogin: boolean): AuthContextType {
    return {
        area: 'manager',
        token: isLogin ? 'token' : null,
        isLogin,
        setToken: vi.fn(),
        onExpired: vi.fn(),
        logout: vi.fn(),
    };
}

/**
 * Provider 로 감싸 그린다
 *
 * @param loading 로그인 상태 확인 중인지
 * @param isLogin 로그인했는지
 */
function renderGuard(loading: boolean, isLogin: boolean): void {
    render(
        <RootLayoutProvider rootLayoutLoading={loading} auth={managerAuth(isLogin)}>
            <AuthGuard>
                <p>호실 목록</p>
            </AuthGuard>
        </RootLayoutProvider>,
    );
}

beforeEach(() => {
    replace.mockClear();
    pathname.value = '/manager/rooms/';
});

describe('AuthGuard', () => {
    it('[SUCCESS] 확인 중이면 내용을 그리지 않고 이동하지 않는다', () => {
        renderGuard(true, false);

        expect(screen.queryByText('호실 목록')).toBeNull();
        expect(replace).not.toHaveBeenCalled();
    });

    it('[FAIL:login] 로그인이 안 돼 있으면 그 영역 로그인 화면으로 돌아올 주소와 함께 한 번 보낸다', () => {
        renderGuard(false, false);

        expect(screen.queryByText('호실 목록')).toBeNull();
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith('/manager/login/?return_url=%2Fmanager%2Frooms%2F');
    });

    it('[SUCCESS] 로그인했으면 내용을 그리고 이동하지 않는다', () => {
        renderGuard(false, true);

        expect(screen.getByText('호실 목록')).toBeTruthy();
        expect(replace).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 그 영역 로그인 화면은 로그인 안 돼 있어도 막지 않는다', () => {
        pathname.value = '/manager/login/';

        renderGuard(false, false);

        expect(screen.getByText('호실 목록')).toBeTruthy();
        expect(replace).not.toHaveBeenCalled();
    });
});
