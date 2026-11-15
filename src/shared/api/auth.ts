import { deleteAreaTokens, refreshAreaToken } from '@/shared/api/cookie';
import { ApiError } from '@/shared/api/request';
import { AreaType } from '@/shared/utils/area';

/** 로그인이 필요한 API 를 부를 때 넘기는 값 — 화면은 AuthContext 값을 그대로 넘긴다 */
export type AuthType = {
    area: AreaType;                           // 지금 영역
    token: string | null;                     // 그 영역 access 토큰
    setToken: (token: string | null) => void; // 재발급 · 만료 때 Context 를 바꾼다
    onExpired: () => void;                    // 재발급도 안 되면 — 그 영역 로그인 화면으로
};

/**
 * 로그인이 끝났다(재발급 실패) — 이미 로그인 화면으로 보냈으니 handleApiError 는 띄우지 않는다
 */
export class LoginRequiredError extends Error {
    constructor() {
        super('login required');
        this.name = 'LoginRequiredError';
    }
}

/**
 * 로그인이 필요한 API 부르기 — 401 이면 그 영역 재발급 한 번 · 재시도, 또 401 이면 그 영역 로그인 화면으로
 * - 401 이 아닌 실패(400 · NetworkError …)는 그대로 던진다
 * - 재발급이 일시 실패(네트워크 · 백엔드 5xx)면 refreshAreaToken 의 NetworkError 를 그대로 — 로그아웃하지 않는다
 *
 * @param auth AuthContext 값
 * @param call 토큰을 받아 request · callQueue 를 부르는 함수
 */
export async function withAuth<T>(auth: AuthType, call: (token: string | null) => Promise<T>): Promise<T> {
    try {
        return await call(auth.token);
    } catch (error) {
        if (!isUnauthorized(error)) {
            throw error;
        }
    }

    const token = await refreshAreaToken(auth.area);
    if (!token) {
        return expire(auth);
    }

    auth.setToken(token);
    try {
        return await call(token);
    } catch (error) {
        if (isUnauthorized(error)) {
            return expire(auth);
        }
        throw error;
    }
}

/**
 * 401 인지
 *
 * @param error catch 로 받은 값
 */
function isUnauthorized(error: unknown): boolean {
    return error instanceof ApiError && error.status === 401;
}

/**
 * 로그인 만료 — 그 영역 토큰을 지우고 로그인 화면으로 보낸 뒤 LoginRequiredError
 *
 * @param auth AuthContext 값
 */
async function expire(auth: AuthType): Promise<never> {
    await deleteAreaTokens(auth.area);
    auth.setToken(null);
    auth.onExpired();
    throw new LoginRequiredError();
}
