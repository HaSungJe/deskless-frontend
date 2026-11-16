import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import UserMeProvider, { UserMeContext } from '@/app/(user)/_components/UserMeProvider';
import { API_BASE_URL } from '@/shared/api/request';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const fetchMock = vi.fn();

/**
 * 내 정보 닉네임을 그리는 소비자
 */
function MeNickname(): React.ReactNode {
    const {me} = useContext(UserMeContext);
    return <p>{me ? me.nickname : '-'}</p>;
}

/**
 * Provider 로 감싸 그린다
 *
 * @param isLogin 로그인했는지
 */
function renderMe(isLogin: boolean): void {
    const auth: AuthContextType = {area: 'user', token: isLogin ? 'tok' : null, isLogin, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};
    render(
        <RootLayoutProvider rootLayoutLoading={false} auth={auth}>
            <UserMeProvider>
                <MeNickname />
            </UserMeProvider>
        </RootLayoutProvider>,
    );
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('UserMeProvider', () => {
    it('[SUCCESS] 로그인했으면 user/me 를 한 번 읽어 나눠 준다', async () => {
        fetchMock.mockResolvedValue(new Response(JSON.stringify({nickname: '여행하는고양이', is_phone_verified: 1, state_id: 'ACTIVE'}), {status: 200}));

        renderMe(true);

        await waitFor(() => expect(screen.getByText('여행하는고양이')).toBeTruthy());
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/user-service/user/me`);
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    });

    it('[FAIL:logged-out] 로그인 안 했으면 부르지 않고 me 는 null', () => {
        renderMe(false);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(screen.getByText('-')).toBeTruthy();
    });
});
