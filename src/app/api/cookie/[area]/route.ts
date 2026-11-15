import { cookies } from 'next/headers';
import { isSameSiteJson, json } from '../../route-util';
import { accessCookieName, clearTokenCookies, isTokenSet, refreshAndStore, refreshResponse, setTokenCookies, toArea, TokenSetType } from '../token-cookie';

/**
 * 그 영역 access 토큰 — 없거나 곧 만료면 refresh 쿠키로 재발급
 *
 * @param _request
 * @param context [area]
 */
export async function GET(_request: Request, context: RouteContext<'/api/cookie/[area]'>): Promise<Response> {
    const area = toArea((await context.params).area);
    if (!area) {
        return json({success: false});
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(accessCookieName(area))?.value;
    if (accessToken) {
        return json({success: true, data: accessToken});
    }

    return refreshResponse(await refreshAndStore(cookieStore, area));
}

/**
 * 로그인 결과 토큰 저장 — 같은 사이트의 JSON 요청만(다른 사이트 form 이 토큰을 심는 것 막기)
 *
 * @param request 본문 — access_token · refresh_token · access_token_expires_at · refresh_token_expires_at
 * @param context [area]
 */
export async function POST(request: Request, context: RouteContext<'/api/cookie/[area]'>): Promise<Response> {
    const area = toArea((await context.params).area);
    if (!area || !isSameSiteJson(request)) {
        return json({success: false});
    }

    try {
        const tokens = (await request.json()) as Partial<TokenSetType>;
        if (!isTokenSet(tokens)) {
            return json({success: false});
        }

        await setTokenCookies(await cookies(), area, tokens);
        return json({success: true});
    } catch {
        return json({success: false});
    }
}

/**
 * 로그아웃 — 그 영역 두 쿠키 삭제(로그아웃 API 는 없다)
 *
 * @param _request
 * @param context [area]
 */
export async function DELETE(_request: Request, context: RouteContext<'/api/cookie/[area]'>): Promise<Response> {
    const area = toArea((await context.params).area);
    if (!area) {
        return json({success: false});
    }

    await clearTokenCookies(await cookies(), area);
    return json({success: true});
}
