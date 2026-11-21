/** 상품 종류 — room_plan_type_id (시간 이용 · 1박 · 연박) — 상품 설정 · 그룹 상품 · 기간 가격 */
export const ROOM_PLAN_TYPE = {HOURLY: 'HOURLY', NIGHT: 'NIGHT', LONG: 'LONG'} as const;

/** 호실 상태 — room_state_id — 호실 · 예약 현황 */
export const ROOM_STATE = {AVAILABLE: 'AVAILABLE', RESERVED: 'RESERVED', IN_USE: 'IN_USE', MAINTENANCE: 'MAINTENANCE', DISABLED: 'DISABLED'} as const;
