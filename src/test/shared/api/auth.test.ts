// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthType, LoginRequiredError, withAuth } from '@/shared/api/auth';
import { ApiError, NetworkError } from '@/shared/api/request';

const {refreshAreaToken, deleteAreaTokens} = vi.hoisted(() => ({
    refreshAreaToken: vi.fn(),
    deleteAreaTokens: vi.fn(),
}));

vi.mock('@/shared/api/cookie', () => ({refreshAreaToken, deleteAreaTokens}));

/**
 * 매니저 영역 로그인 상태(토큰 'old')
 */
function managerAuth(): AuthType {
    return {area: 'manager', token: 'old', setToken: vi.fn(), onExpired: vi.fn()};
}

/**
 * 401 실패
 */
function unauthorized(): ApiError {
    return new ApiError(401, {message: '로그인이 필요합니다.', validation_errors: null});
}

beforeEach(() => {
    refreshAreaToken.mockReset();
    deleteAreaTokens.mockReset();
    deleteAreaTokens.mockResolvedValue(true);
});

describe('withAuth', () => {
    it('[SUCCESS] 첫 호출이 성공하면 그 결과 · 재발급 없음', async () => {
        const auth = managerAuth();
        const call = vi.fn().mockResolvedValue({room_id: 1});

        const result = await withAuth(auth, call);

        expect(result).toEqual({room_id: 1});
        expect(call).toHaveBeenCalledTimes(1);
        expect(call).toHaveBeenCalledWith('old');
        expect(refreshAreaToken).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 401 이면 재발급한 토큰으로 한 번 다시 부른다', async () => {
        const auth = managerAuth();
        const call = vi.fn().mockRejectedValueOnce(unauthorized()).mockResolvedValueOnce({room_id: 1});
        refreshAreaToken.mockResolvedValue('new');

        const result = await withAuth(auth, call);

        expect(result).toEqual({room_id: 1});
        expect(refreshAreaToken).toHaveBeenCalledTimes(1);
        expect(refreshAreaToken).toHaveBeenCalledWith('manager');
        expect(call).toHaveBeenCalledTimes(2);
        expect(call).toHaveBeenNthCalledWith(2, 'new');
        expect(auth.setToken).toHaveBeenCalledTimes(1);
        expect(auth.setToken).toHaveBeenCalledWith('new');
        expect(auth.onExpired).not.toHaveBeenCalled();
    });

    it('[FAIL:refresh] 재발급이 안 되면 로그인 화면으로 보내고 LoginRequiredError · 다시 부르지 않는다', async () => {
        const auth = managerAuth();
        const call = vi.fn().mockRejectedValue(unauthorized());
        refreshAreaToken.mockResolvedValue(null);

        const error = await withAuth(auth, call).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(LoginRequiredError);
        expect(call).toHaveBeenCalledTimes(1);
        expect(auth.onExpired).toHaveBeenCalledTimes(1);
        expect(auth.setToken).toHaveBeenCalledWith(null);
        expect(deleteAreaTokens).toHaveBeenCalledWith('manager');
    });

    it('[FAIL:retry] 재시도도 401 이면 그 영역 토큰을 지우고 로그인 화면으로', async () => {
        const auth = managerAuth();
        const call = vi.fn().mockRejectedValue(unauthorized());
        refreshAreaToken.mockResolvedValue('new');

        const error = await withAuth(auth, call).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(LoginRequiredError);
        expect(call).toHaveBeenCalledTimes(2);
        expect(deleteAreaTokens).toHaveBeenCalledTimes(1);
        expect(deleteAreaTokens).toHaveBeenCalledWith('manager');
        expect(auth.setToken).toHaveBeenLastCalledWith(null);
        expect(auth.onExpired).toHaveBeenCalledTimes(1);
    });

    it('[FAIL:retry] 재발급이 일시 실패(NetworkError)면 그대로 던지고 로그아웃하지 않는다', async () => {
        const auth = managerAuth();
        const network = new NetworkError(new Error('refresh retry'));
        refreshAreaToken.mockRejectedValue(network);

        const error = await withAuth(auth, vi.fn().mockRejectedValue(unauthorized())).catch((caught: unknown) => caught);

        expect(error).toBe(network);
        expect(deleteAreaTokens).not.toHaveBeenCalled();
        expect(auth.onExpired).not.toHaveBeenCalled();
        expect(auth.setToken).not.toHaveBeenCalled();
    });

    it('[FAIL:other] 401 이 아닌 실패는 그대로 던지고 재발급하지 않는다', async () => {
        const auth = managerAuth();
        const badRequest = new ApiError(400, {message: '호실 이름을 입력해 주세요.', validation_errors: null});
        const network = new NetworkError(new TypeError('Failed to fetch'));

        const first = await withAuth(auth, vi.fn().mockRejectedValue(badRequest)).catch((caught: unknown) => caught);
        const second = await withAuth(auth, vi.fn().mockRejectedValue(network)).catch((caught: unknown) => caught);

        expect(first).toBe(badRequest);
        expect(second).toBe(network);
        expect(refreshAreaToken).not.toHaveBeenCalled();
        expect(auth.onExpired).not.toHaveBeenCalled();
    });
});
