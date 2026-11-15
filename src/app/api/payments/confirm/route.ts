import { cookies } from 'next/headers';
import { isSameSiteJson, json } from '../../route-util';
import { refreshCookieName } from '../../cookie/token-cookie';
import { CONFIRM_CONFIG_MESSAGE, CONFIRM_INVALID_MESSAGE, CONFIRM_LOGIN_MESSAGE, confirmTossPayment, ConfirmRequestType, isConfirmRequest } from './toss-confirm';

/**
 * 토스 결제 승인 중계 — 성공 주소 query(paymentKey · orderId · amount)로 시크릿 키 승인
 * - 같은 사이트 JSON · 이용자 로그인(refresh 쿠키) · 값 검사 · 시크릿 키가 있을 때만 토스를 부른다
 * - 금액 대조 · 예약 확정은 그 뒤 화면이 부르는 백엔드 payment-confirm 이 한다
 *
 * @param request 본문 {paymentKey, orderId, amount}
 */
export async function POST(request: Request): Promise<Response> {
    if (!isSameSiteJson(request)) {
        return json({success: false, message: CONFIRM_INVALID_MESSAGE});
    }

    const cookieStore = await cookies();
    if (!cookieStore.get(refreshCookieName('user'))?.value) {
        return json({success: false, message: CONFIRM_LOGIN_MESSAGE});
    }

    const body = (await request.json().catch((): null => null)) as Partial<ConfirmRequestType> | null;
    if (!isConfirmRequest(body)) {
        return json({success: false, message: CONFIRM_INVALID_MESSAGE});
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
        console.error('[toss] TOSS_SECRET_KEY 가 없습니다.');
        return json({success: false, message: CONFIRM_CONFIG_MESSAGE});
    }

    const result = await confirmTossPayment(body, secretKey);
    if (result.state === 'ok') {
        return json({success: true});
    }

    return result.state === 'retry'
        ? json({success: false, message: result.message, retry: true})
        : json({success: false, message: result.message, code: result.code});
}
