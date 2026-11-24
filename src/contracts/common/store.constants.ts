/** 입점 신청 상태 — store_application_state_id(대기 · 승인 · 반려) — 이용자 입점 신청 · 관리자 입점 신청 관리 */
export const STORE_APPLICATION_STATE = {WAIT: 'WAIT', APPROVED: 'APPROVED', REJECTED: 'REJECTED'} as const;

/** 업체 정보 파일 용도 — store_file_purpose_id(사업자등록증 · 업체 사진) */
export const STORE_FILE_PURPOSE = {LICENSE: 'BUSINESS_LICENSE', IMAGE: 'STORE_IMAGE'} as const;

/** 업체 상태 — store_state_id(활성 · 영업중지 · 탈퇴) — 업체 관리자 콘솔 · 관리자 업체 관리 */
export const STORE_STATE = {ACTIVE: 'ACTIVE', SUSPEND: 'SUSPEND', LEAVE: 'LEAVE'} as const;

/** 입점 신청 상태 → 배지 색(시안: 대기 warn · 승인 ok · 반려 danger) */
const APPLICATION_STATE_TONE = new Map<string, 'warn' | 'ok' | 'danger'>([[STORE_APPLICATION_STATE.WAIT, 'warn'], [STORE_APPLICATION_STATE.APPROVED, 'ok'], [STORE_APPLICATION_STATE.REJECTED, 'danger']]);

/**
 * 입점 신청 상태 → 배지 색, 모르는 상태는 neutral
 *
 * @param stateId store_application_state_id
 */
export function applicationStateTone(stateId: string): 'warn' | 'ok' | 'danger' | 'neutral' {
    return APPLICATION_STATE_TONE.get(stateId) ?? 'neutral';
}

/**
 * 업체 편의시설 — store_detail 의 켜고 끄는 항목(0 · 1), 이 순서로 보인다 — 이용자 업체 상세 · 업체 관리자 편의시설 탭 · 관리자 업체 상세
 * - 백엔드가 항목을 더하면(frontend/changes) 여기 한 줄과 DTO 사본 네 곳(discovery-store-detail · store-mine · store-detail · store-mine-detail)에 필드를 더한다
 * - 지도 검색필터의 체크 항목은 이 표를 쓰지 않는다(받은 목록 그대로 — frontend/changes/2026-11-24-store-facility.md)
 */
export const STORE_FACILITY_OPTIONS = [
    {key: 'has_convenience_store', label: '편의점'},
    {key: 'has_cafe', label: '카페'},
    {key: 'has_hot_spring', label: '온천'},
    {key: 'is_pet_allowed', label: '반려동물 동반'},
    {key: 'has_meal', label: '식사 제공'},
    {key: 'is_delivery_allowed', label: '배달 음식'},
    {key: 'has_parking', label: '주차'},
] as const;

/** 편의시설 키 — store_detail 필드 이름 */
export type StoreFacilityKeyType = (typeof STORE_FACILITY_OPTIONS)[number]['key'];

/** 편의시설 값 — 응답 store_detail(세 DTO 의 편의시설 클래스가 같은 모양) */
export type StoreFacilityValuesType = Record<StoreFacilityKeyType, number>;

/**
 * 켜진 편의시설 이름 — STORE_FACILITY_OPTIONS 순서, 값이 1인 것만(업체 상세 칩 · 관리자 업체 상세)
 * - store_detail 이 없는 응답(백엔드 배포 전)은 빈 목록 — 칸을 숨긴다
 *
 * @param detail 응답의 store_detail
 */
export function storeFacilityLabels(detail: StoreFacilityValuesType | null | undefined): Array<string> {
    return STORE_FACILITY_OPTIONS.filter((option) => detail?.[option.key] === 1).map((option) => option.label);
}
