import { AuthType, withAuth } from '@/shared/api/auth';
import { callQueue } from '@/shared/api/queue';
import { request } from '@/shared/api/request';
import { postRoute, routeFailure } from '@/shared/api/route';
import { UserDetailResultDto } from './dto/user-detail.dto';
import { UserFindLoginIdConfirmDto, UserFindLoginIdConfirmResultDto } from './dto/user-find-login-id-confirm.dto';
import { UserFindLoginIdDto, UserFindLoginIdResultDto } from './dto/user-find-login-id.dto';
import { UserLeaveDto } from './dto/user-leave.dto';
import { UserListDto, UserListResultDto } from './dto/user-list.dto';
import { UserLoginDto, UserLoginResultDto } from './dto/user-login.dto';
import { UserMeResultDto } from './dto/user-me.dto';
import { UserPhoneVerificationConfirmDto } from './dto/user-phone-verification-confirm.dto';
import { UserPhoneVerificationDto, UserPhoneVerificationResultDto } from './dto/user-phone-verification.dto';
import { UserReservationListDto, UserReservationListResultDto } from './dto/user-reservation-list.dto';
import { UserSignDto, UserSignResultDto } from './dto/user-sign.dto';
import { UserStateDto } from './dto/user-state.dto';
import { UserTokenRefreshDto, UserTokenRefreshResultDto } from './dto/user-token-refresh.dto';

/** 가입 화면이 보내는 칸 — SNS 계정은 서버가 세션에서 붙인다 */
export type UserSignFormType = Pick<UserSignDto, 'gender' | 'birth' | 'nickname'>;

/** 가입 route 결과 — ok: 가입 · 로그인 완료 / no-sns: SNS 세션이 없거나 만료(다시 로그인) */
export type SignWithSnsResultType = {state: 'ok'; is_phone_verified: number} | {state: 'no-sns'};

/** 이용자 관리 경로 — 관리자 */
const ADMIN_USER_PATH = '/admin-service/user';

/**
 * 이용자 한 명의 경로(관리자)
 *
 * @param user_id 회원 ID
 */
function adminUserPath(user_id: string): string {
    return `${ADMIN_USER_PATH}/${encodeURIComponent(user_id)}`;
}

/** SNS 세션이 없음 — src/app/api/user/sns-session.ts NO_SNS_CODE 와 같은 값(contracts 는 app 을 가져오지 않는다) */
const NO_SNS_CODE = 'NO_SNS';

/**
 * 이용자 토큰 재발급 — 동기 · 공개 (POST /user-service/user/token-refresh)
 *
 * @param dto refresh_token
 */
export function refreshUserToken(dto: UserTokenRefreshDto): Promise<UserTokenRefreshResultDto | null> {
    return request<UserTokenRefreshResultDto>({method: 'POST', path: '/user-service/user/token-refresh', body: dto});
}

/**
 * 이용자 로그인 — 동기 · 공개 (POST /user-service/user/login). 서버 route(GET /api/user/sns-login)만 부른다
 *
 * @param dto sns_id · sns_user_id(next-auth 세션에서)
 */
export function loginUser(dto: UserLoginDto): Promise<UserLoginResultDto | null> {
    return request<UserLoginResultDto>({method: 'POST', path: '/user-service/user/login', body: dto});
}

/**
 * 이용자 가입 — 큐 · 공개 (POST /user-service/user/sign). 서버 route(POST /api/user/sign)만 부른다
 *
 * @param dto SNS 계정 + 성별 · 생년월일 · 닉네임
 */
export function signUser(dto: UserSignDto): Promise<UserSignResultDto | null> {
    return callQueue<UserSignResultDto>({method: 'POST', path: '/user-service/user/sign', body: dto});
}

/**
 * 내 정보 — 동기 · 이용자 (GET /user-service/user/me)
 *
 * @param auth AuthContext 값
 */
export function getMe(auth: AuthType): Promise<UserMeResultDto | null> {
    return withAuth(auth, (token) => request<UserMeResultDto>({path: '/user-service/user/me', token}));
}

/**
 * 휴대폰 인증번호 발송 — 큐 · 이용자 (POST /user-service/user/phone-verification)
 *
 * @param auth AuthContext 값
 * @param dto phone
 */
export function sendPhoneVerification(auth: AuthType, dto: UserPhoneVerificationDto): Promise<UserPhoneVerificationResultDto | null> {
    return withAuth(auth, (token) => callQueue<UserPhoneVerificationResultDto>({method: 'POST', path: '/user-service/user/phone-verification', body: dto, token}));
}

/**
 * 휴대폰 인증번호 확인 — 큐 · 이용자 (POST /user-service/user/phone-verification/confirm)
 * - 응답 DTO 가 null 이라 done · pending 이 같은 null — 화면은 내 정보를 다시 읽어 확인한다
 *
 * @param auth AuthContext 값
 * @param dto sms_verification_id · code
 */
export function confirmPhoneVerification(auth: AuthType, dto: UserPhoneVerificationConfirmDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'POST', path: '/user-service/user/phone-verification/confirm', body: dto, token}));
}

/**
 * 회원 탈퇴 신청 — 큐 · 이용자 (DELETE /user-service/user/leave)
 * - 응답 DTO 가 null 이라 done · pending 이 같은 null — 화면은 내 정보를 다시 읽어 확인한다
 *
 * @param auth AuthContext 값
 * @param dto 탈퇴 사유(선택)
 */
export function leaveUser(auth: AuthType, dto: UserLeaveDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'DELETE', path: '/user-service/user/leave', body: dto, token}));
}

/**
 * 회원 탈퇴 철회 — 큐 · 이용자 (PATCH /user-service/user/leave)
 * - 응답 DTO 가 null — 화면은 내 정보를 다시 읽어 확인한다
 *
 * @param auth AuthContext 값
 */
export function cancelLeave(auth: AuthType): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: '/user-service/user/leave', token}));
}

/**
 * 아이디 찾기 인증번호 발송 — 큐 · 공개 (POST /user-service/user/find-login-id)
 *
 * @param dto phone
 */
export function sendFindLoginId(dto: UserFindLoginIdDto): Promise<UserFindLoginIdResultDto | null> {
    return callQueue<UserFindLoginIdResultDto>({method: 'POST', path: '/user-service/user/find-login-id', body: dto});
}

/**
 * 아이디 찾기 인증번호 확인 — 큐 · 공개 (POST /user-service/user/find-login-id/confirm)
 *
 * @param dto sms_verification_id · code
 */
export function confirmFindLoginId(dto: UserFindLoginIdConfirmDto): Promise<UserFindLoginIdConfirmResultDto | null> {
    return callQueue<UserFindLoginIdConfirmResultDto>({method: 'POST', path: '/user-service/user/find-login-id/confirm', body: dto});
}

/**
 * SNS 가입 — 프론트 route(POST /api/user/sign/)를 거친다(서버가 next-auth 세션의 SNS 계정을 붙여 user/sign)
 * - 백엔드 실패는 ApiError(validation_errors 포함 — 화면은 handleApiError), 처리 늦어짐 · 응답 없음은 ApiError(503, 문구)
 *
 * @param form 성별 · 생년월일 · 닉네임
 */
export async function signWithSns(form: UserSignFormType): Promise<SignWithSnsResultType> {
    const result = await postRoute<{is_phone_verified: number}>('/api/user/sign/', {gender: form.gender, birth: form.birth, nickname: form.nickname});
    if (result.success && result.data) {
        return {state: 'ok', is_phone_verified: result.data.is_phone_verified};
    }

    if (result.code === NO_SNS_CODE) {
        return {state: 'no-sns'};
    }

    throw routeFailure(result);
}

/**
 * 이용자 목록 — 동기 · 관리자 (GET /admin-service/user) — 가입 최신순
 *
 * @param auth AuthContext 값
 * @param query keyword · state_id · sns_id · page · size
 * @param signal 거르기를 바꾸거나 화면을 떠날 때 취소
 */
export function getUsers(auth: AuthType, query: UserListDto, signal?: AbortSignal): Promise<UserListResultDto | null> {
    return withAuth(auth, (token) => request<UserListResultDto>({path: ADMIN_USER_PATH, query: {keyword: query.keyword, state_id: query.state_id, sns_id: query.sns_id, page: query.page, size: query.size}, token, signal}));
}

/**
 * 이용자 상세 — 동기 · 관리자 (GET /admin-service/user/:user_id) — 예약 건수 요약 포함
 *
 * @param auth AuthContext 값
 * @param user_id 회원 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getUser(auth: AuthType, user_id: string, signal?: AbortSignal): Promise<UserDetailResultDto | null> {
    return withAuth(auth, (token) => request<UserDetailResultDto>({path: adminUserPath(user_id), token, signal}));
}

/**
 * 이용자 예약 이력 — 동기 · 관리자 (GET /admin-service/user/:user_id/reservation) — 이용 시작 최신순, 결제 대기 만료 제외
 *
 * @param auth AuthContext 값
 * @param user_id 회원 ID
 * @param query page · size
 * @param signal 쪽을 넘기거나 화면을 떠날 때 취소
 */
export function getUserReservations(auth: AuthType, user_id: string, query: UserReservationListDto, signal?: AbortSignal): Promise<UserReservationListResultDto | null> {
    return withAuth(auth, (token) => request<UserReservationListResultDto>({path: `${adminUserPath(user_id)}/reservation`, query: {page: query.page, size: query.size}, token, signal}));
}

/**
 * 이용자 이용 제한 · 해제 — 큐 · 관리자 (PATCH /admin-service/user/:user_id/state) — 그 사이 상태가 바뀌었으면 400, 결과 null
 *
 * @param auth AuthContext 값
 * @param user_id 회원 ID
 * @param dto state_id(BLOCK · ACTIVE) · block_comment
 */
export function updateUserState(auth: AuthType, user_id: string, dto: UserStateDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${adminUserPath(user_id)}/state`, body: dto, token}));
}
