/** 상품 종류 — room_plan_type_id (시간 이용 · 1박 · 연박) — 상품 설정 · 그룹 상품 · 기간 가격 */
export const ROOM_PLAN_TYPE = {HOURLY: 'HOURLY', NIGHT: 'NIGHT', LONG: 'LONG'} as const;

/** 호실 상태 — room_state_id — 호실 · 예약 현황 */
export const ROOM_STATE = {AVAILABLE: 'AVAILABLE', RESERVED: 'RESERVED', IN_USE: 'IN_USE', MAINTENANCE: 'MAINTENANCE', DISABLED: 'DISABLED'} as const;

/**
 * 객실 옵션 — 객실 그룹 상세정보(room_group_detail)의 켜고 끄는 항목(0 · 1), 이 순서로 보인다 — 업체 관리자 그룹 칸 · 이용자 업체 상세
 * - 백엔드가 항목을 더하면(frontend/changes — 반려동물 동반 · 배달 가능 등) 여기 한 줄과 DTO 사본에 필드를 더한다
 */
export const ROOM_GROUP_OPTIONS = [
    {key: 'has_shower', label: '샤워실'},
    {key: 'has_tv', label: 'TV'},
    {key: 'has_pc', label: 'PC'},
] as const;

/** 객실 옵션 키 — room_group_detail 필드 이름 */
export type RoomGroupOptionKeyType = (typeof ROOM_GROUP_OPTIONS)[number]['key'];
