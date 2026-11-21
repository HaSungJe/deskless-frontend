import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { loginAdmin } from '@/contracts/admin/api';
import { AdminLoginDto } from '@/contracts/admin/dto/admin-login.dto';
import { setAccountCookie, setTokenCookies } from '../../cookie/token-cookie';
import { backendLogin, json, textOf } from '../../route-util';

/**
 * 관리자 로그인 — Next 서버가 백엔드 admin/login(동기) → 토큰 · 계정 쿠키(매니저 로그인과 같은 모양 — 업체코드 쿠키만 없다)
 * - 재발급도 Next 서버가 부르므로 로그인 IP 와 재발급 IP 가 같다(docs/data-layer.md "⚠️ 백엔드 재발급")
 *
 * @param request 본문 {login_id, login_pw}
 */
export async function POST(request: NextRequest): Promise<Response> {
    // ①② 같은 사이트 JSON → 백엔드 로그인 — ④ 거절(4xx) · 다시 시도는 만든 응답 그대로(쿠키 없음)
    const login = await backendLogin(request, (form) => Object.assign(new AdminLoginDto(), {login_id: textOf(form?.login_id), login_pw: textOf(form?.login_pw)}), loginAdmin, 'admin-login');
    if ('response' in login) {
        return login.response;
    }

    // ③ 토큰 쿠키 2개 · 계정 쿠키(토큰과 같이 끝남)
    const cookieStore = await cookies();
    await setTokenCookies(cookieStore, 'admin', login.result);
    await setAccountCookie(cookieStore, 'admin', {login_id: login.dto.login_id, auth_id: login.result.auth_id}, login.result.refresh_token_expires_at);
    return json({success: true, data: {is_password_change_required: login.result.is_password_change_required}});
}
