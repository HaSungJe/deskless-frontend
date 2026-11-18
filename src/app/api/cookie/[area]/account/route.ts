import { cookies } from 'next/headers';
import { json } from '../../../route-util';
import { readAccountCookie, toArea } from '../../token-cookie';

/**
 * 로그인 때 기억한 계정(아이디 · 권한) — 없으면 {success: false}
 * - 읽기만 — 쓰기는 로그인 처리 route 가 서버에서 한다(브라우저가 계정을 심을 길을 열지 않는다)
 *
 * @param _request
 * @param context [area]
 */
export async function GET(_request: Request, context: RouteContext<'/api/cookie/[area]/account'>): Promise<Response> {
    const area = toArea((await context.params).area);
    if (!area) {
        return json({success: false});
    }

    const account = readAccountCookie(await cookies(), area);
    return account ? json({success: true, data: account}) : json({success: false});
}
