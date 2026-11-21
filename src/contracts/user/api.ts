import { AuthType, withAuth } from '@/shared/api/auth';
import { callQueue } from '@/shared/api/queue';
import { request } from '@/shared/api/request';
import { postRoute, routeFailure } from '@/shared/api/route';
import { UserFindLoginIdConfirmDto, UserFindLoginIdConfirmResultDto } from './dto/user-find-login-id-confirm.dto';
import { UserFindLoginIdDto, UserFindLoginIdResultDto } from './dto/user-find-login-id.dto';
import { UserLeaveDto } from './dto/user-leave.dto';
import { UserLoginDto, UserLoginResultDto } from './dto/user-login.dto';
import { UserMeResultDto } from './dto/user-me.dto';
import { UserPhoneVerificationConfirmDto } from './dto/user-phone-verification-confirm.dto';
import { UserPhoneVerificationDto, UserPhoneVerificationResultDto } from './dto/user-phone-verification.dto';
import { UserSignDto, UserSignResultDto } from './dto/user-sign.dto';
import { UserTokenRefreshDto, UserTokenRefreshResultDto } from './dto/user-token-refresh.dto';

/** 가입 화면이 보내는 칸 — SNS 계정은 서버가 세션에서 붙인다 */
export type UserSignFormType = Pick<UserSignDto, 'gender' | 'birth' | 'nickname'>;

/** 가입 route 결과 — ok: 가입 · 로그인 완료 / no-sns: SNS 세션이 없거나 만료(다시 로그인) */
export type SignWithSnsResultType = {state: 'ok'; is_phone_verified: number} | {state: 'no-sns'};

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
