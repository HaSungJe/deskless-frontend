import { AuthType, withAuth } from '@/shared/api/auth';
import { request } from '@/shared/api/request';
import { StatsMineDto, StatsMineResultDto } from './dto/stats-mine.dto';
import { StatsDto, StatsResultDto } from './dto/stats.dto';

/**
 * 내 업체 통계 — 동기 · 매니저 (GET /admin-service/stats/mine) — 빈 달은 보내지 않는다(백엔드가 최근 3개월)
 *
 * @param auth AuthContext 값
 * @param query 시작 달 · 끝 달 · 결제 환경
 * @param signal 화면을 떠나거나 다시 조회할 때 취소
 */
export function getMyStats(auth: AuthType, query: StatsMineDto, signal?: AbortSignal): Promise<StatsMineResultDto | null> {
    return withAuth(auth, (token) => request<StatsMineResultDto>({path: '/admin-service/stats/mine', query: {start_month: query.start_month, end_month: query.end_month, environment: query.environment}, token, signal}));
}

/**
 * 전체 통계 — 동기 · 관리자 (GET /admin-service/stats) — 빈 달은 보내지 않는다(백엔드가 최근 3개월), 업체 범위는 업체별 목록에만
 *
 * @param auth AuthContext 값
 * @param query 시작 달 · 끝 달 · 결제 환경 · 업체 범위 · 업체별 쪽
 * @param signal 화면을 떠나거나 다시 조회할 때 취소
 */
export function getStats(auth: AuthType, query: StatsDto, signal?: AbortSignal): Promise<StatsResultDto | null> {
    return withAuth(auth, (token) => request<StatsResultDto>({path: '/admin-service/stats', query: {start_month: query.start_month, end_month: query.end_month, environment: query.environment, has_activity: query.has_activity, page: query.page, size: query.size}, token, signal}));
}
