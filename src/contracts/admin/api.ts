import { request } from '@/shared/api/request';
import { AdminTokenRefreshDto, AdminTokenRefreshResultDto } from './dto/admin-token-refresh.dto';

/**
 * 관리자 토큰 재발급 — 동기 · 공개 (POST /admin-service/admin/token-refresh)
 *
 * @param dto refresh_token
 */
export function refreshAdminToken(dto: AdminTokenRefreshDto): Promise<AdminTokenRefreshResultDto | null> {
    return request<AdminTokenRefreshResultDto>({method: 'POST', path: '/admin-service/admin/token-refresh', body: dto});
}
