import { cookies } from 'next/headers';
import { json, refreshAndStore, refreshResponse, toArea } from '../../token-cookie';

/**
 * 401 뒤 강제 재발급 — 새 access / 로그인이 끝났으면 두 쿠키를 지우고 {success: false} / 일시 실패면 {success: false, retry: true}
 *
 * @param _request
 * @param context [area]
 */
export async function POST(_request: Request, context: RouteContext<'/api/cookie/[area]/refresh'>): Promise<Response> {
    const area = toArea((await context.params).area);
    if (!area) {
        return json({success: false});
    }

    return refreshResponse(await refreshAndStore(await cookies(), area));
}
