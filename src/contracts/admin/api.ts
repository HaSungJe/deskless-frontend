import { AuthType, withAuth } from '@/shared/api/auth';
import { callQueue } from '@/shared/api/queue';
import { request } from '@/shared/api/request';
import { postRoute, routeFailure } from '@/shared/api/route';
import { AdminLoginDto, AdminLoginResultDto } from './dto/admin-login.dto';
import { AdminPasswordDto } from './dto/admin-password.dto';
import { AdminTokenRefreshDto, AdminTokenRefreshResultDto } from './dto/admin-token-refresh.dto';

/** 로그인 처리 route 결과 */
export type AdminLoginRouteResultType = {
    is_password_change_required: number; // 1 이면 비밀번호 변경으로
};

/**
 * 관리자 토큰 재발급 — 동기 · 공개 (POST /admin-service/admin/token-refresh)
 *
 * @param dto refresh_token
 */
export function refreshAdminToken(dto: AdminTokenRefreshDto): Promise<AdminTokenRefreshResultDto | null> {
    return request<AdminTokenRefreshResultDto>({method: 'POST', path: '/admin-service/admin/token-refresh', body: dto});
}

/**
 * 관리자 로그인 — 동기 · 공개 (POST /admin-service/admin/login) — 서버(로그인 처리 route)만 부른다(로그인 IP = 재발급 IP)
 *
 * @param dto 아이디 · 비밀번호
 */
export function loginAdmin(dto: AdminLoginDto): Promise<AdminLoginResultDto | null> {
    return request<AdminLoginResultDto>({method: 'POST', path: '/admin-service/admin/login', body: dto});
}

/**
 * 관리자 로그인 — 프론트 route(POST /api/admin/login/)를 거친다(서버가 백엔드 로그인 · 쿠키)
 * - 거절은 ApiError(문구 · 칸 오류 · block_comment 그대로), 다시 시도는 ApiError(503), 응답 없음은 NetworkError — loginManagerByRoute 와 같다
 *
 * @param dto 아이디 · 비밀번호
 */
export async function loginAdminByRoute(dto: AdminLoginDto): Promise<AdminLoginRouteResultType> {
    const result = await postRoute<AdminLoginRouteResultType>('/api/admin/login/', {login_id: dto.login_id, login_pw: dto.login_pw});
    if (result.success && result.data) {
        return result.data;
    }

    throw routeFailure(result, true);
}

/**
 * 비밀번호 변경 — 큐 · 관리자 (PATCH /admin-service/admin/password) — 결과 null
 *
 * @param auth AuthContext 값
 * @param dto 현재 · 새 비밀번호
 */
export function changeAdminPassword(auth: AuthType, dto: AdminPasswordDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: '/admin-service/admin/password', body: dto, token}));
}
