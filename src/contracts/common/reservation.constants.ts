/** 예약 상태 — 예약 · 구간 */
export const RESERVATION_STATE = {PENDING: 'PENDING', CONFIRMED: 'CONFIRMED', CHECKED_IN: 'CHECKED_IN', COMPLETED: 'COMPLETED', CANCELED: 'CANCELED', EXPIRED: 'EXPIRED'} as const;

/** 예약 구간 종류 — 기본 · 연장 */
export const RESERVATION_DETAIL_TYPE = {BASE: 'BASE', EXTENSION: 'EXTENSION'} as const;

/** 결제 상태 */
export const PAYMENT_STATE = {READY: 'READY', DONE: 'DONE', FAILED: 'FAILED', EXPIRED: 'EXPIRED', REFUND_REQUESTED: 'REFUND_REQUESTED', REFUNDED: 'REFUNDED', REFUND_FAILED: 'REFUND_FAILED'} as const;

/** 취소 주체 — USER: 이용자, STORE: 업체 */
export const RESERVATION_CANCEL_ACTOR = {USER: 'USER', STORE: 'STORE'} as const;

/** 결제 대기 유지 시간(분) — 예약 · 연장 신청 뒤 이 시간 안에 결제가 확인되지 않으면 만료 */
export const RESERVATION_PAYMENT_PENDING_MINUTES = 5;

/** 결제 대기 만료 뒤 같은 이용자가 같은 호실을 다시 예약할 수 없는 시간(분) — 만료 시각부터 */
export const RESERVATION_REBOOK_BLOCK_MINUTES = 10;

/** 이용 중 취소 요청 상태 — 요청 중인데 만료 시각이 지나면 만료로 본다 */
export const RESERVATION_CANCEL_REQUEST_STATE = {REQUESTED: 'REQUESTED', APPROVED: 'APPROVED', REJECTED: 'REJECTED', EXPIRED: 'EXPIRED'} as const;

/** 이용 중 취소 요청 유효 시간(분) — 예약 끝이 먼저면 예약 끝까지 */
export const RESERVATION_CANCEL_REQUEST_MINUTES = 10;
