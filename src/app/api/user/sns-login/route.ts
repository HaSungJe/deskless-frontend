import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { afterLoginPath, loginErrorPath, SIGNUP_PATH, withReturnUrl } from '@/app/(user)/login/login-flow';
import { loginUser } from '@/contracts/user/api';
import { ApiError } from '@/shared/api/request';
import { RETURN_URL_KEY } from '@/shared/utils/area';
import { withBasePath } from '@/shared/utils/base-path';
import { setTokenCookies } from '../../cookie/token-cookie';
import { clearSnsSession, readSnsAccount } from '../sns-session';

/**
 * SNS 로그인 마무리 — next-auth 세션의 SNS 계정으로 백엔드 로그인 → 이용자 토큰 쿠키 → 다음 화면으로 303
 * - 가입 전(404)이면 가입 화면(SNS 세션은 둔다), 실패면 로그인 화면 + 오류 코드
 * - next-auth callbackUrl 로 받는 GET — 화면 효과로 부르면 개발 모드 두 번 실행에 로그인이 두 번 나간다
 *
 * @param request query return_url
 */
export async function GET(request: NextRequest): Promise<Response> {
    const returnUrl = request.nextUrl.searchParams.get(RETURN_URL_KEY);
    const account = await readSnsAccount(request);
    if (!account) {
        return redirect(loginErrorPath('sns', returnUrl));
    }

    try {
        const result = await loginUser(account);
        if (!result) {
            throw new Error('로그인 결과가 비어 있습니다.');
        }

        const cookieStore = await cookies();
        await setTokenCookies(cookieStore, 'user', result);
        clearSnsSession(cookieStore);
        return redirect(afterLoginPath(result.is_phone_verified, returnUrl));
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            return redirect(withReturnUrl(SIGNUP_PATH, returnUrl, {sns: account.sns_id}));
        }

        console.log('[sns-login] 로그인 실패 —', error instanceof Error ? error.message : error);
        return redirect(loginErrorPath(error instanceof ApiError && error.status < 500 ? 'login' : 'retry', returnUrl));
    }
}

/**
 * 303 상대 주소 리다이렉트(basePath 포함) — 프록시 뒤에서 request.url 의 호스트가 내부 주소일 수 있어 상대로
 *
 * @param path 앱 안 주소
 */
function redirect(path: string): Response {
    return new Response(null, {status: 303, headers: {Location: withBasePath(path)}});
}
