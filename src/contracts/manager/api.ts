import { AuthType, withAuth } from '@/shared/api/auth';
import { callQueue } from '@/shared/api/queue';
import { ApiError, NetworkError, request, sendRequest } from '@/shared/api/request';
import { withBasePath } from '@/shared/utils/base-path';
import { ValidationErrorType } from '@/shared/utils/validation';
import { ManagerFindLoginIdConfirmDto, ManagerFindLoginIdConfirmResultDto } from './dto/manager-find-login-id-confirm.dto';
import { ManagerFindLoginIdDto, ManagerFindLoginIdResultDto } from './dto/manager-find-login-id.dto';
import { ManagerLoginDto, ManagerLoginResultDto } from './dto/manager-login.dto';
import { ManagerPasswordResetConfirmDto } from './dto/manager-password-reset-confirm.dto';
import { ManagerPasswordResetDto, ManagerPasswordResetResultDto } from './dto/manager-password-reset.dto';
import { ManagerPasswordDto } from './dto/manager-password.dto';
import { ManagerStaffDetailResultDto } from './dto/manager-staff-detail.dto';
import { ManagerStaffListDto, ManagerStaffListResultDto } from './dto/manager-staff-list.dto';
import { ManagerStaffStateDto } from './dto/manager-staff-state.dto';
import { ManagerStaffUpdateDto } from './dto/manager-staff-update.dto';
import { ManagerStaffDto, ManagerStaffResultDto } from './dto/manager-staff.dto';
import { ManagerTokenRefreshDto, ManagerTokenRefreshResultDto } from './dto/manager-token-refresh.dto';

/** 업체 관리자(직원) 경로 — 업체 총관리자만(아니면 403) */
const STAFF_PATH = '/admin-service/manager/staff';

/**
 * 업체 관리자 한 명의 경로
 *
 * @param user_id 회원 ID
 */
function staffPath(user_id: string): string {
    return `${STAFF_PATH}/${encodeURIComponent(user_id)}`;
}

/** 로그인 처리 route 결과 */
export type ManagerLoginRouteResultType = {
    is_password_change_required: number; // 1 이면 비밀번호 변경으로
};

/** 로그인 처리 route 본문(src/app/api/manager/login/route.ts) */
type ManagerLoginRouteBodyType = {
    success: boolean;
    data?: ManagerLoginRouteResultType;
    message?: string;
    validation_errors?: Array<ValidationErrorType> | null;
    block_comment?: string | null;
    retry?: boolean;
};

/**
 * 매니저 토큰 재발급 — 동기 · 공개 (POST /admin-service/manager/token-refresh)
 *
 * @param dto refresh_token
 */
export function refreshManagerToken(dto: ManagerTokenRefreshDto): Promise<ManagerTokenRefreshResultDto | null> {
    return request<ManagerTokenRefreshResultDto>({method: 'POST', path: '/admin-service/manager/token-refresh', body: dto});
}

/**
 * 매니저 로그인 — 동기 · 공개 (POST /admin-service/manager/login) — 서버(로그인 처리 route)만 부른다(로그인 IP = 재발급 IP)
 *
 * @param dto 업체코드 · 아이디 · 비밀번호
 */
export function loginManager(dto: ManagerLoginDto): Promise<ManagerLoginResultDto | null> {
    return request<ManagerLoginResultDto>({method: 'POST', path: '/admin-service/manager/login', body: dto});
}

/**
 * 매니저 로그인 — 프론트 route(POST /api/manager/login/)를 거친다(서버가 백엔드 로그인 · 쿠키)
 * - 거절은 ApiError(문구 · 칸 오류 · block_comment 그대로), 다시 시도는 ApiError(503), 응답 없음은 NetworkError — signWithSns 와 같다
 *
 * @param dto 업체코드 · 아이디 · 비밀번호
 */
export async function loginManagerByRoute(dto: ManagerLoginDto): Promise<ManagerLoginRouteResultType> {
    const response = await sendRequest(withBasePath('/api/manager/login/'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({store_code: dto.store_code, login_id: dto.login_id, login_pw: dto.login_pw}),
    });
    if (!response.ok) {
        throw new NetworkError(new Error(`manager login route ${response.status}`));
    }

    const result = (await response.json().catch((): null => null)) as ManagerLoginRouteBodyType | null;
    if (!result) {
        throw new NetworkError(new Error('manager login route body'));
    }

    if (result.success && result.data) {
        return result.data;
    }

    throw new ApiError(result.retry ? 503 : 400, {message: result.message ?? '', validation_errors: result.validation_errors ?? null, block_comment: result.block_comment ?? null});
}

/**
 * 아이디 찾기 인증번호 발송 — 큐 · 공개 (POST /admin-service/manager/find-login-id)
 *
 * @param dto 업체코드(주소 값) · 휴대폰 번호
 */
export function sendManagerFindLoginId(dto: ManagerFindLoginIdDto): Promise<ManagerFindLoginIdResultDto | null> {
    return callQueue<ManagerFindLoginIdResultDto>({method: 'POST', path: '/admin-service/manager/find-login-id', body: dto});
}

/**
 * 아이디 찾기 인증번호 확인 — 큐 · 공개 (POST /admin-service/manager/find-login-id/confirm)
 *
 * @param dto sms_verification_id · code
 */
export function confirmManagerFindLoginId(dto: ManagerFindLoginIdConfirmDto): Promise<ManagerFindLoginIdConfirmResultDto | null> {
    return callQueue<ManagerFindLoginIdConfirmResultDto>({method: 'POST', path: '/admin-service/manager/find-login-id/confirm', body: dto});
}

/**
 * 비밀번호 초기화 인증번호 발송 — 큐 · 공개 (POST /admin-service/manager/password-reset)
 *
 * @param dto 업체코드(주소 값) · 아이디 · 휴대폰 번호
 */
export function sendManagerPasswordReset(dto: ManagerPasswordResetDto): Promise<ManagerPasswordResetResultDto | null> {
    return callQueue<ManagerPasswordResetResultDto>({method: 'POST', path: '/admin-service/manager/password-reset', body: dto});
}

/**
 * 비밀번호 초기화 인증번호 확인 — 큐 · 공개 (POST /admin-service/manager/password-reset/confirm) — 결과 null(임시 비밀번호는 문자로)
 *
 * @param dto sms_verification_id · code
 */
export function confirmManagerPasswordReset(dto: ManagerPasswordResetConfirmDto): Promise<null> {
    return callQueue<null>({method: 'POST', path: '/admin-service/manager/password-reset/confirm', body: dto});
}

/**
 * 비밀번호 변경 — 큐 · 매니저 (PATCH /admin-service/manager/password) — 결과 null
 *
 * @param auth AuthContext 값
 * @param dto 현재 · 새 비밀번호
 */
export function changeManagerPassword(auth: AuthType, dto: ManagerPasswordDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: '/admin-service/manager/password', body: dto, token}));
}

// ── 업체 관리자 관리 (M8 — 업체 총관리자) ──

/**
 * 업체 관리자 목록 — 동기 · 업체 총관리자 (GET /admin-service/manager/staff) — 업체 총관리자가 위, 등록일 최신순
 *
 * @param auth AuthContext 값
 * @param query keyword · page · size
 * @param signal 화면을 떠날 때 취소
 */
export function getManagerStaffs(auth: AuthType, query: ManagerStaffListDto, signal?: AbortSignal): Promise<ManagerStaffListResultDto | null> {
    return withAuth(auth, (token) => request<ManagerStaffListResultDto>({path: STAFF_PATH, query: {keyword: query.keyword, page: query.page, size: query.size}, token, signal}));
}

/**
 * 업체 관리자 등록 — 큐 · 업체 총관리자 (POST /admin-service/manager/staff) — 임시 비밀번호 SMS, 아이디 · 휴대폰 겹치면 400
 *
 * @param auth AuthContext 값
 * @param dto login_id · name · phone · gender · birth
 */
export function createManagerStaff(auth: AuthType, dto: ManagerStaffDto): Promise<ManagerStaffResultDto | null> {
    return withAuth(auth, (token) => callQueue<ManagerStaffResultDto>({method: 'POST', path: STAFF_PATH, body: dto, token}));
}

/**
 * 업체 관리자 상세 — 동기 · 업체 총관리자 (GET /admin-service/manager/staff/:user_id)
 *
 * @param auth AuthContext 값
 * @param user_id 회원 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getManagerStaff(auth: AuthType, user_id: string, signal?: AbortSignal): Promise<ManagerStaffDetailResultDto | null> {
    return withAuth(auth, (token) => request<ManagerStaffDetailResultDto>({path: staffPath(user_id), token, signal}));
}

/**
 * 업체 관리자 수정 — 큐 · 업체 총관리자 (PATCH /admin-service/manager/staff/:user_id) — 통째로, 결과 null
 *
 * @param auth AuthContext 값
 * @param user_id 회원 ID
 * @param dto name · phone · gender · birth
 */
export function updateManagerStaff(auth: AuthType, user_id: string, dto: ManagerStaffUpdateDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: staffPath(user_id), body: dto, token}));
}

/**
 * 업체 관리자 삭제 — 큐 · 업체 총관리자 (DELETE /admin-service/manager/staff/:user_id) — 탈퇴 처리, 결과 null
 *
 * @param auth AuthContext 값
 * @param user_id 회원 ID
 */
export function deleteManagerStaff(auth: AuthType, user_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'DELETE', path: staffPath(user_id), token}));
}

/**
 * 업체 관리자 비밀번호 초기화 — 큐 · 업체 총관리자 (PATCH /admin-service/manager/staff/:user_id/password-reset) — 임시 비밀번호 SMS, 결과 null
 *
 * @param auth AuthContext 값
 * @param user_id 회원 ID
 */
export function resetManagerStaffPassword(auth: AuthType, user_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${staffPath(user_id)}/password-reset`, token}));
}

/**
 * 업체 관리자 정지 · 해제 — 큐 · 업체 총관리자 (PATCH /admin-service/manager/staff/:user_id/state) — 결과 null
 *
 * @param auth AuthContext 값
 * @param user_id 회원 ID
 * @param dto state_id(BLOCK · ACTIVE) · block_comment
 */
export function updateManagerStaffState(auth: AuthType, user_id: string, dto: ManagerStaffStateDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${staffPath(user_id)}/state`, body: dto, token}));
}
