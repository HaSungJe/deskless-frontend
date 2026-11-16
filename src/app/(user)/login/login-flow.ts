import { AREA_LOGIN_PATH, RETURN_URL_KEY, safeReturnPath, toSamePath } from '@/shared/utils/area';
import { withBasePath } from '@/shared/utils/base-path';

export const PHONE_VERIFICATION_PATH = '/phone-verification/';
export const SIGNUP_PATH = '/signup/';
export const FIND_LOGIN_ID_PATH = '/find-login-id/';

/** SNS 로그인이 끝나면 next-auth 가 돌아올 route — 서버가 백엔드 로그인 */
export const SNS_LOGIN_ROUTE = '/api/user/sns-login/';

/** 로그인 화면 오류 코드 — 로그인 route 가 붙인다(next-auth 오류 코드는 SNS 실패로 본다) */
export type LoginErrorCodeType = 'sns' | 'login' | 'retry';

const LOGIN_ERROR_MESSAGE: Record<LoginErrorCodeType, string> = {
    sns: 'SNS 로그인을 마치지 못했어요. 다시 시도해 주세요.',
    login: '로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.',
    retry: '서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.',
};

/** 가입 때 SNS 세션이 만료됐을 때 */
export const SNS_EXPIRED_MESSAGE = 'SNS 로그인 정보가 만료됐어요. 다시 로그인해 주세요.';

/**
 * 주소에 돌아갈 주소(같은 사이트일 때만)와 다른 query 를 붙인다
 *
 * @param path 주소
 * @param returnUrl 돌아갈 주소
 * @param extra 더 붙일 query
 */
export function withReturnUrl(path: string, returnUrl: string | null, extra: Record<string, string> = {}): string {
    const params = new URLSearchParams(extra);
    const samePath = toSamePath(returnUrl);
    if (samePath) {
        params.set(RETURN_URL_KEY, samePath);
    }

    const query = params.toString();
    return query ? `${path}?${query}` : path;
}

/**
 * 로그인 · 가입을 마친 뒤 갈 주소 — 휴대폰 인증 전이면 휴대폰 인증(돌아갈 주소를 들고), 인증했으면 돌아갈 주소 · 첫 화면
 *
 * @param isPhoneVerified 휴대폰 인증 여부(0 · 1)
 * @param returnUrl 돌아갈 주소
 */
export function afterLoginPath(isPhoneVerified: number, returnUrl: string | null): string {
    if (isPhoneVerified !== 1) {
        return withReturnUrl(PHONE_VERIFICATION_PATH, returnUrl);
    }

    return safeReturnPath(returnUrl, 'user');
}

/**
 * SNS 로그인 시작 때 next-auth 에 줄 callbackUrl — basePath + 로그인 route + 돌아갈 주소
 * - next-auth 는 '/' 로 시작하는 callbackUrl 을 origin 뒤에 그대로 붙여 basePath 를 직접 넣는다
 *
 * @param returnUrl 돌아갈 주소
 */
export function snsLoginCallbackUrl(returnUrl: string | null): string {
    return withBasePath(withReturnUrl(SNS_LOGIN_ROUTE, returnUrl));
}

/**
 * 로그인 화면 + 오류 코드
 *
 * @param code 오류 코드
 * @param returnUrl 돌아갈 주소
 */
export function loginErrorPath(code: LoginErrorCodeType, returnUrl: string | null): string {
    return withReturnUrl(AREA_LOGIN_PATH.user, returnUrl, {error: code});
}

/**
 * 오류 코드 → 안내 문구 — 모르는 코드(next-auth 의 OAuthCallback 등)는 SNS 실패
 *
 * @param code 주소의 error
 */
export function loginErrorMessage(code: string): string {
    // 'constructor' 같은 상속 이름에 속지 않게 자기 키만
    return Object.hasOwn(LOGIN_ERROR_MESSAGE, code) ? LOGIN_ERROR_MESSAGE[code as LoginErrorCodeType] : LOGIN_ERROR_MESSAGE.sns;
}
