import { AUTH_ID } from '@/contracts/common/roles';
import { safeReturnPath } from '@/shared/utils/area';

/** 비밀번호 변경 — 상단 바 링크(띠 없이) */
export const ADMIN_PASSWORD_PATH = '/admin/password/';

/** 비밀번호 변경 — 처음 로그인했을 때(안내 띠) */
const PASSWORD_REQUIRED_PATH = '/admin/password/?required=1';

/** 권한 배지 — 시안 글자(frontend/design/admin.html:348) */
export const ADMIN_AUTH_BADGE = new Map<string, {label: string; tone: 'primary' | 'neutral'}>([
    [AUTH_ID.SUPER_ADMIN, {label: '총괄관리자', tone: 'primary'}],
    [AUTH_ID.ADMIN, {label: '관리자', tone: 'neutral'}],
]);

/**
 * 로그인 뒤 갈 주소 — 처음 로그인(비밀번호 변경 필요)이면 비밀번호 변경, 아니면 돌아갈 주소(없으면 첫 화면)
 *
 * @param isPasswordChangeRequired 로그인 결과 is_password_change_required
 * @param returnUrl 돌아갈 주소
 */
export function afterAdminLoginPath(isPasswordChangeRequired: number, returnUrl: string | null): string {
    return isPasswordChangeRequired === 1 ? PASSWORD_REQUIRED_PATH : safeReturnPath(returnUrl, 'admin');
}
