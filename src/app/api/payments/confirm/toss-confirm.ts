/** 토스 결제 승인 API */
export const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

export const CONFIRM_FAIL_MESSAGE = '결제를 승인하지 못했습니다.';
export const CONFIRM_RETRY_MESSAGE = '결제 승인이 잠시 안 됩니다. 잠시 뒤 다시 시도해 주세요.';
export const CONFIRM_INVALID_MESSAGE = '결제 정보가 올바르지 않습니다.';
export const CONFIRM_LOGIN_MESSAGE = '로그인이 필요합니다.';
export const CONFIRM_CONFIG_MESSAGE = '결제 설정이 없습니다.';

/** 같은 결제를 이미 승인함(새로고침 · 다시 승인) — 성공으로 본다 */
const ALREADY_PROCESSED_CODE = 'ALREADY_PROCESSED_PAYMENT';

/** 같은 멱등 키의 승인이 아직 처리 중(409 — 두 탭 · 연달아 새로고침) — 잠시 뒤 다시 */
const IDEMPOTENT_PROCESSING_CODE = 'IDEMPOTENT_REQUEST_PROCESSING';

/** 우리 결제 ID(토스 orderId) — 32자 소문자 hex */
const PAYMENT_ID_PATTERN = /^[a-f0-9]{32}$/;

/** 토스 결제 키 — 영문 · 숫자 · _ · - 200자까지(헤더 Idempotency-Key 로도 보내므로 다른 글자는 받지 않는다) */
const PAYMENT_KEY_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

/** 토스 승인 호출 제한 시간 — 넘으면 잠시 뒤 다시(같은 멱등 키라 다시 승인해도 같은 응답) */
const CONFIRM_TIMEOUT_MS = 30 * 1000;

/** 성공 주소 query — 토스가 붙여 준 값 */
export type ConfirmRequestType = {
    paymentKey: string; // 토스 결제 키(200자까지)
    orderId: string;    // 우리 payment_id
    amount: number;     // 결제 금액(원)
};

/** 승인 결과 — ok / fail(다시 결제) / retry(잠시 뒤 다시 승인) */
export type ConfirmResultType =
    | {state: 'ok'}
    | {state: 'fail'; code?: string; message: string}
    | {state: 'retry'; message: string};

/**
 * 토스 승인 응답 정리 — 200 · 이미 처리됨은 성공, 같은 승인 처리 중(409) · 5xx · 응답 없음은 retry, 401 · 403(키 문제)은 일반 문구, 그 밖 4xx 는 토스 문구
 *
 * @param status 토스 응답 상태, 응답이 없으면 null
 * @param body 토스 응답 본문(JSON 이 아니면 null)
 */
export function toConfirmResult(status: number | null, body: unknown): ConfirmResultType {
    if (status === null || status >= 500) {
        return {state: 'retry', message: CONFIRM_RETRY_MESSAGE};
    }

    if (status >= 200 && status < 300) {
        return {state: 'ok'};
    }

    const fail = (typeof body === 'object' && body !== null ? body : {}) as {code?: unknown; message?: unknown};
    const code = typeof fail.code === 'string' ? fail.code : undefined;
    if (code === ALREADY_PROCESSED_CODE) {
        return {state: 'ok'};
    }

    if (code === IDEMPOTENT_PROCESSING_CODE) {
        return {state: 'retry', message: CONFIRM_RETRY_MESSAGE};
    }

    const message = status === 401 || status === 403 || typeof fail.message !== 'string' ? CONFIRM_FAIL_MESSAGE : fail.message;
    return code ? {state: 'fail', code, message} : {state: 'fail', message};
}

/**
 * 성공 주소 query 검사 — paymentKey 영문 · 숫자 · _ · - 1~200자 · orderId 32자 hex · amount 양의 정수
 *
 * @param body 요청 본문
 */
export function isConfirmRequest(body: Partial<ConfirmRequestType> | null): body is ConfirmRequestType {
    return typeof body?.paymentKey === 'string' && PAYMENT_KEY_PATTERN.test(body.paymentKey)
        && typeof body.orderId === 'string' && PAYMENT_ID_PATTERN.test(body.orderId)
        && Number.isInteger(body.amount) && body.amount > 0;
}

/**
 * 토스 결제 승인 — Basic base64(시크릿 키:), 같은 결제는 Idempotency-Key 로 같은 응답, 30초가 넘으면 retry
 *
 * @param confirm 성공 주소 query
 * @param secretKey 결제위젯 시크릿 키
 */
export async function confirmTossPayment(confirm: ConfirmRequestType, secretKey: string): Promise<ConfirmResultType> {
    const response = await fetch(TOSS_CONFIRM_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(`${secretKey}:`)}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': confirm.paymentKey,
        },
        body: JSON.stringify({paymentKey: confirm.paymentKey, orderId: confirm.orderId, amount: confirm.amount}),
        signal: AbortSignal.timeout(CONFIRM_TIMEOUT_MS),
    }).catch((error: unknown): null => {
        console.log('[toss] 승인 요청 실패 —', error instanceof Error ? error.message : error);
        return null;
    });

    if (!response) {
        return toConfirmResult(null, null);
    }

    const body: unknown = await response.json().catch((): null => null);
    const result = toConfirmResult(response.status, body);
    if (result.state !== 'ok') {
        console.log(`[toss] 승인 실패 ${response.status} —`, body);
    }

    return result;
}
