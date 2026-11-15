import { request } from '@/shared/api/request';
import { UserTokenRefreshDto, UserTokenRefreshResultDto } from './dto/user-token-refresh.dto';

/**
 * 이용자 토큰 재발급 — 동기 · 공개 (POST /user-service/user/token-refresh)
 *
 * @param dto refresh_token
 */
export function refreshUserToken(dto: UserTokenRefreshDto): Promise<UserTokenRefreshResultDto | null> {
    return request<UserTokenRefreshResultDto>({method: 'POST', path: '/user-service/user/token-refresh', body: dto});
}
