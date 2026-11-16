import { NetworkError, sendRequest } from '@/shared/api/request';
import { withBasePath } from '@/shared/utils/base-path';

/** 결제 성공 주소 query — 토스가 붙여 준 값 그대로 */
export type TossConfirmQueryType = {
    paymentKey: string; // 토스 결제 키
    orderId: string;    // 우리 payment_id
    amount: number;     // 결제 금액(원)
};

/** 승인 route 결과 */
export type TossConfirmResultType = {
    success: boolean;
    message?: string; // 실패 문구 — 그대로 보여 준다
    code?: string;    // 토스 오류 코드
    retry?: boolean;  // 잠시 뒤 다시 승인
};

/**
 * 토스 결제 승인(route handler) — 결과 화면(U4)이 부르고, success 면 백엔드 payment-confirm 으로
 * - route 에 닿지 못하거나 본문을 못 읽으면 NetworkError
 *
 * @param query 성공 주소 query
 */
export async function requestTossConfirm(query: TossConfirmQueryType): Promise<TossConfirmResultType> {
    const response = await sendRequest(withBasePath('/api/payments/confirm/'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(query),
    });
    if (!response.ok) {
        throw new NetworkError(new Error(`payment confirm route ${response.status}`));
    }

    const result = (await response.json().catch((): null => null)) as TossConfirmResultType | null;
    if (!result) {
        throw new NetworkError(new Error('payment confirm route body'));
    }

    return result;
}
