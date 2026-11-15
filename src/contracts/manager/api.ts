import { request } from '@/shared/api/request';
import { ManagerTokenRefreshDto, ManagerTokenRefreshResultDto } from './dto/manager-token-refresh.dto';

/**
 * 매니저 토큰 재발급 — 동기 · 공개 (POST /admin-service/manager/token-refresh)
 *
 * @param dto refresh_token
 */
export function refreshManagerToken(dto: ManagerTokenRefreshDto): Promise<ManagerTokenRefreshResultDto | null> {
    return request<ManagerTokenRefreshResultDto>({method: 'POST', path: '/admin-service/manager/token-refresh', body: dto});
}
