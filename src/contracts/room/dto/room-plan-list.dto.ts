/**
 * 업체 상품 설정 1개 — 업체 × 상품 종류. 이용 시간은 시간 이용만, 입실 · 퇴실 시각은 1박 · 연박만 값이 있다
 */
export class RoomPlanItemResultDto {
    /** 상품 종류 ID (HOURLY: 시간 이용, NIGHT: 1박, LONG: 연박) */
    room_plan_type_id: string;

    /** 상품 종류명 */
    room_plan_type_name: string;

    /** 사용 여부 (0: 팔지 않음, 1: 판매) */
    is_used: number;

    /** 예약 가능 요일 (비트 — 일 1 · 월 2 · 화 4 · 수 8 · 목 16 · 금 32 · 토 64, 매일 127) */
    days_of_week: number;

    /** 이용 시간(시간) — 시간 이용만, 1박 · 연박은 null */
    usage_hours: number | null;

    /** 입실 시각 (HH:mm, 한국 시각) — 1박 · 연박(첫날)만, 시간 이용은 null */
    check_in_time: string | null;

    /** 퇴실 시각 (HH:mm, 한국 시각 — 1박은 항상 다음 날, 연박은 마지막 날) — 시간 이용은 null */
    check_out_time: string | null;

    /** 최소 박수 — 연박만, 시간 이용 · 1박은 null */
    min_nights: number | null;

    /** 최대 박수 — 연박만, 시간 이용 · 1박은 null */
    max_nights: number | null;

    /** 연장 가능 여부 (0 · 1) */
    is_extendable: number;

    /** 최대 연장 횟수 (1 ~ 10) */
    max_extensions: number;
}

/**
 * 업체 상품 설정 목록 — 상품 종류마다 1개(3개)
 */
export class RoomPlanListResultDto {
    /** 목록 (HOURLY · NIGHT · LONG 순) */
    list: RoomPlanItemResultDto[];
}
