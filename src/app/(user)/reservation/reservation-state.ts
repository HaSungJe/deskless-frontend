/** 상태 배지 · 띠 색 — Badge tone 과 같은 이름 */
export type StateToneType = 'primary' | 'warn' | 'ok' | 'danger' | 'neutral';

/** 예약 상태 → 색(시안 U6 · U7) — Map 이라 'constructor' 같은 상속 이름에 속지 않는다 */
const RESERVATION_STATE_TONE = new Map<string, StateToneType>([['PENDING', 'warn'], ['CONFIRMED', 'primary'], ['CHECKED_IN', 'ok'], ['COMPLETED', 'neutral'], ['CANCELED', 'danger'], ['EXPIRED', 'neutral']]);

/** 결제 상태 → 색(시안 U7 결제 구간) */
const PAYMENT_STATE_TONE = new Map<string, StateToneType>([['READY', 'warn'], ['DONE', 'ok'], ['FAILED', 'danger'], ['EXPIRED', 'neutral'], ['REFUND_REQUESTED', 'warn'], ['REFUNDED', 'neutral'], ['REFUND_FAILED', 'danger']]);

/**
 * 예약 상태 색
 *
 * @param stateId reservation_state_id
 */
export function reservationStateTone(stateId: string): StateToneType {
    return RESERVATION_STATE_TONE.get(stateId) ?? 'neutral';
}

/**
 * 결제 상태 색
 *
 * @param stateId payment_state_id
 */
export function paymentStateTone(stateId: string): StateToneType {
    return PAYMENT_STATE_TONE.get(stateId) ?? 'neutral';
}
