import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { STORE_CODE_COOKIE, STORE_CODE_REMEMBER_DAYS } from '@/app/manager/manager-auth';
import { loginManager } from '@/contracts/manager/api';
import { ManagerLoginDto, ManagerLoginResultDto } from '@/contracts/manager/dto/manager-login.dto';
import { NETWORK_ERROR_MESSAGE } from '@/shared/api/error';
import { ApiError } from '@/shared/api/request';
import { setAccountCookie, setRememberCookie, setTokenCookies } from '../../cookie/token-cookie';
import { INVALID_REQUEST_MESSAGE, isSameSiteJson, json } from '../../route-util';

/**
 * 매니저 로그인 — Next 서버가 백엔드 manager/login(동기) → 토큰 · 계정 · 업체코드 쿠키
 * - 재발급도 Next 서버가 부르므로 로그인 IP 와 재발급 IP 가 같다(docs/data-layer.md "⚠️ 백엔드 재발급")
 * - 백엔드 4xx 는 message · validation_errors · block_comment 그대로, 쿠키는 쓰지 않는다. 네트워크 · 5xx 는 retry
 *
 * @param request 본문 {store_code, login_id, login_pw}
 */
export async function POST(request: NextRequest): Promise<Response> {
    // ① 같은 사이트 JSON 만
    if (!isSameSiteJson(request)) {
        return json({success: false, message: INVALID_REQUEST_MESSAGE});
    }

    const form = (await request.json().catch((): null => null)) as Record<string, unknown> | null;
    const dto = Object.assign(new ManagerLoginDto(), {
        store_code: textOf(form?.store_code),
        login_id: textOf(form?.login_id),
        login_pw: textOf(form?.login_pw),
    });

    // ② 백엔드 로그인 — 거절(4xx)은 받은 본문 그대로
    let result: ManagerLoginResultDto | null = null;
    try {
        result = await loginManager(dto);
    } catch (error) {
        if (error instanceof ApiError && error.status < 500) {
            const blockComment = typeof error.body.block_comment === 'string' ? error.body.block_comment : null;
            return json({success: false, message: error.body.message, validation_errors: error.body.validation_errors, block_comment: blockComment});
        }

        console.log('[manager-login] 로그인 결과를 받지 못함 —', error instanceof Error ? error.message : error);
    }
    if (!result) {
        return json({success: false, message: NETWORK_ERROR_MESSAGE, retry: true});
    }

    // ③ 토큰 쿠키 2개 · 계정 쿠키(토큰과 같이 끝남) · 업체코드 쿠키(1년 — 로그아웃해도 남는다)
    const cookieStore = await cookies();
    await setTokenCookies(cookieStore, 'manager', result);
    await setAccountCookie(cookieStore, 'manager', {login_id: dto.login_id, auth_id: result.auth_id}, result.refresh_token_expires_at);
    await setRememberCookie(cookieStore, STORE_CODE_COOKIE, dto.store_code, STORE_CODE_REMEMBER_DAYS);
    return json({success: true, data: {is_password_change_required: result.is_password_change_required}});
}

/**
 * 본문 값 → 글자(아니면 빈 글자 — 백엔드 검증이 칸 오류로 돌려준다). 가입 route 와 같다(route 파일은 처리 함수만 내보낸다)
 *
 * @param value 본문 값
 */
function textOf(value: unknown): string {
    return typeof value === 'string' ? value : '';
}
