import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { STORE_CODE_COOKIE, STORE_CODE_REMEMBER_DAYS } from '@/app/manager/manager-auth';
import { loginManager } from '@/contracts/manager/api';
import { ManagerLoginDto } from '@/contracts/manager/dto/manager-login.dto';
import { setAccountCookie, setRememberCookie, setTokenCookies } from '../../cookie/token-cookie';
import { backendLogin, json, textOf } from '../../route-util';

/**
 * 매니저 로그인 — Next 서버가 백엔드 manager/login(동기) → 토큰 · 계정 · 업체코드 쿠키
 * - 재발급도 Next 서버가 부르므로 로그인 IP 와 재발급 IP 가 같다(docs/data-layer.md "⚠️ 백엔드 재발급")
 * - 백엔드 4xx 는 message · validation_errors · block_comment 그대로, 쿠키는 쓰지 않는다. 네트워크 · 5xx 는 retry(backendLogin — 관리자 로그인과 같다)
 *
 * @param request 본문 {store_code, login_id, login_pw}
 */
export async function POST(request: NextRequest): Promise<Response> {
    // ①② 같은 사이트 JSON → 백엔드 로그인 — ④ 거절(4xx) · 다시 시도는 만든 응답 그대로(쿠키 없음)
    const login = await backendLogin(request, (form) => Object.assign(new ManagerLoginDto(), {store_code: textOf(form?.store_code), login_id: textOf(form?.login_id), login_pw: textOf(form?.login_pw)}), loginManager, 'manager-login');
    if ('response' in login) {
        return login.response;
    }

    // ③ 토큰 쿠키 2개 · 계정 쿠키(토큰과 같이 끝남) · 업체코드 쿠키(1년 — 로그아웃해도 남는다)
    const cookieStore = await cookies();
    await setTokenCookies(cookieStore, 'manager', login.result);
    await setAccountCookie(cookieStore, 'manager', {login_id: login.dto.login_id, auth_id: login.result.auth_id}, login.result.refresh_token_expires_at);
    await setRememberCookie(cookieStore, STORE_CODE_COOKIE, login.dto.store_code, STORE_CODE_REMEMBER_DAYS);
    return json({success: true, data: {is_password_change_required: login.result.is_password_change_required}});
}
