import { AUTH_ID } from '@/contracts/common/roles';
import { RETURN_URL_KEY, safeReturnPath, toSamePath } from '@/shared/utils/area';

/** 업체코드 쿠키 — 로그인 처리가 쓰고 업체 로그인 주소 안내가 읽는다(로그아웃해도 남는다) */
export const STORE_CODE_COOKIE = 'manager_store_code';

/** 업체코드 쿠키를 기억하는 날 수 */
export const STORE_CODE_REMEMBER_DAYS = 365;

/** 업체코드 모양 — 32자 영문 소문자 · 숫자(ManagerLoginDto) */
export const STORE_CODE_PATTERN = /^[a-f0-9]{32}$/;

/** 업체 로그인 주소 안내 — 기억한 업체로 보내지 않고 붙여 넣기 칸(없는 업체 안내에서 — 같은 업체로 되돌아가지 않게) */
export const MANAGER_GUIDE_MANUAL_PATH = '/manager/login/?manual=1';

/** 비밀번호 변경 — 임시 비밀번호로 로그인했을 때(안내 띠) */
const PASSWORD_REQUIRED_PATH = '/manager/password/?required=1';

/** 업체코드를 줄여 보일 앞 글자 수 */
const STORE_CODE_SHORT_LENGTH = 8;

/** 권한 배지 — 지침서 화면 문구(screens.md M1 · 시안 배지) */
export const MANAGER_AUTH_BADGE = new Map<string, {label: string; tone: 'primary' | 'neutral'}>([
    [AUTH_ID.HEAD_MANAGER, {label: '업체 총관리자', tone: 'primary'}],
    [AUTH_ID.MANAGER, {label: '업체 관리자', tone: 'neutral'}],
]);

/**
 * 업체코드 주소의 화면 — /manager/<업체코드>/<화면>/
 *
 * @param storeCode 업체코드(주소 값)
 * @param page login · find-login-id · password-reset
 */
export function managerStorePath(storeCode: string, page: 'login' | 'find-login-id' | 'password-reset'): string {
    return `/manager/${encodeURIComponent(storeCode)}/${page}/`;
}

/**
 * 업체 로그인 주소 — 업체코드 모양이 맞을 때만, 같은 사이트의 돌아갈 주소만 붙인다
 *
 * @param storeCode 업체코드(쿠키 · 붙여 넣은 값)
 * @param returnUrl 돌아갈 주소
 * @returns 업체 로그인 주소, 업체코드 모양이 아니면 null
 */
export function managerLoginPath(storeCode: string, returnUrl: string | null): string | null {
    if (!STORE_CODE_PATTERN.test(storeCode)) {
        return null;
    }

    const loginPath = managerStorePath(storeCode, 'login');
    const samePath = toSamePath(returnUrl);
    return samePath ? `${loginPath}?${RETURN_URL_KEY}=${encodeURIComponent(samePath)}` : loginPath;
}

/**
 * 로그인 뒤 갈 주소 — 임시 비밀번호면 비밀번호 변경, 아니면 돌아갈 주소(없으면 대시보드)
 *
 * @param isPasswordChangeRequired 로그인 결과 is_password_change_required
 * @param returnUrl 돌아갈 주소
 */
export function afterManagerLoginPath(isPasswordChangeRequired: number, returnUrl: string | null): string {
    return isPasswordChangeRequired === 1 ? PASSWORD_REQUIRED_PATH : safeReturnPath(returnUrl, 'manager');
}

/**
 * 업체코드 줄임 — 앞 8자 + 줄임표(상단 바)
 *
 * @param storeCode 업체코드
 */
export function shortStoreCode(storeCode: string): string {
    return storeCode.length > STORE_CODE_SHORT_LENGTH ? `${storeCode.slice(0, STORE_CODE_SHORT_LENGTH)}…` : storeCode;
}
