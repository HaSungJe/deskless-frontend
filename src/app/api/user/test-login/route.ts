import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { afterLoginPath, loginErrorPath } from '@/app/(user)/login/login-flow';
import { isTestLoginEnabled, TEST_USER_ACCOUNT } from '@/app/(user)/login/test-login';
import { loginUser } from '@/contracts/user/api';
import { ApiError } from '@/shared/api/request';
import { RETURN_URL_KEY } from '@/shared/utils/area';
import { withBasePath } from '@/shared/utils/base-path';
import { setTokenCookies } from '../../cookie/token-cookie';

/**
 * 개발용 테스트 로그인 — 개발 서버에서만, 테스트 이용자로 백엔드 로그인 → 이용자 토큰 쿠키 → 다음 화면으로 303
 * - 운영 빌드에서는 404 — 로그인 화면의 버튼도 같은 판단으로 숨는다
 * - 다음 화면은 SNS 로그인과 같다(휴대폰 인증 전이면 휴대폰 인증, 아니면 돌아갈 주소)
 *
 * @param request query return_url
 */
export async function GET(request: NextRequest): Promise<Response> {
    if (!isTestLoginEnabled()) {
        return new Response(null, {status: 404});
    }

    const returnUrl = request.nextUrl.searchParams.get(RETURN_URL_KEY);
    try {
        const result = await loginUser({...TEST_USER_ACCOUNT});
        if (!result) {
            throw new Error('로그인 결과가 비어 있습니다.');
        }

        const cookieStore = await cookies();
        await setTokenCookies(cookieStore, 'user', result);
        return redirect(afterLoginPath(result.is_phone_verified, returnUrl));
    } catch (error) {
        console.log('[test-login] 테스트 이용자 로그인 실패 —', error instanceof Error ? error.message : error);
        return redirect(loginErrorPath(error instanceof ApiError && error.status < 500 ? 'login' : 'retry', returnUrl));
    }
}

/**
 * 303 상대 주소 리다이렉트(basePath 포함) — SNS 로그인 route 와 같다(route 파일은 처리 함수만 내보낼 수 있어 나눠 두지 못한다)
 *
 * @param path 앱 안 주소
 */
function redirect(path: string): Response {
    return new Response(null, {status: 303, headers: {Location: withBasePath(path)}});
}
