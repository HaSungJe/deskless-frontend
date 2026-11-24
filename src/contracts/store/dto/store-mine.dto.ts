/**
 * 내 업체의 업체 정보 파일 (사업자등록증 · 업체 사진)
 */
export class StoreMineFileItemResultDto {
    /** 업체 정보 파일 ID */
    store_file_id: string;

    /** 용도 (BUSINESS_LICENSE · STORE_IMAGE) */
    store_file_purpose_id: string;

    /** 원본 파일명 */
    file_name: string;

    /** MIME 타입 */
    content_type: string;

    /** 비공개 여부 (1: 서명된 열람 주소 · 10분 유효, 0: CDN 공개 주소) */
    is_private: number;

    /** 열람 주소 */
    file_url: string;

    /** 정렬 순서 (업체 사진은 가장 앞이 대표) */
    sort_order: number;

    /** 등록일시 (ISO 8601) */
    created_at: string;
}

/**
 * 내 업체의 요일 영업시간
 */
export class StoreMineHourItemResultDto {
    /** 요일 (0: 일 ~ 6: 토) */
    day_of_week: number;

    /** 휴무 여부 (0: 영업, 1: 휴무) */
    is_closed: number;

    /** 영업 시작 시각 (HH:mm, 한국 시각) — 휴무면 null */
    open_time: string | null;

    /** 영업 마감 시각 (HH:mm — 시작보다 이르면 다음 날) — 휴무면 null */
    close_time: string | null;
}

/**
 * 내 업체의 브레이크타임 (매일)
 */
export class StoreMineBreakItemResultDto {
    /** 브레이크타임 ID */
    store_break_id: string;

    /** 시작 시각 (HH:mm, 한국 시각) */
    start_time: string;

    /** 마감 시각 (HH:mm — 시작보다 이르면 다음 날) */
    end_time: string;
}

/**
 * 내 업체 상세 (업체 관리자)
 */
export class StoreMineResultDto {
    /** 업체 ID */
    store_id: string;

    /** 업체코드 (매니저 로그인 · 매니저 화면 주소) */
    store_code: string;

    /** 업체 상태 (ACTIVE · SUSPEND) */
    store_state_id: string;

    /** 상호명 */
    store_name: string;

    /** 사업자등록번호 */
    business_number: string;

    /** 대표자명 */
    owner_name: string;

    /** 업체 연락처 */
    phone: string;

    /** 주소 */
    address: string;

    /** 상세주소 */
    address_detail: string | null;

    /** 위도 */
    latitude: number;

    /** 경도 */
    longitude: number;

    /** 업체 소개 */
    introduction: string | null;

    /** 편의시설 (편의점 · 카페 · 온천 · 반려동물 동반 · 식사 제공 · 배달 음식 · 주차 — 0: 없음, 1: 있음) */
    store_detail: StoreMineFacilityResultDto;

    /** 24시간 연중무휴 여부 (0 · 1 — 1 이면 요일별 영업시간이 비어 있다) */
    is_always_open: number;

    /** 영업중 여부 (0: 영업중 아님, 1: 영업중) */
    is_open: number;

    /** 정비시간(분) */
    maintenance_minutes: number;

    /** 예약 가능 시작(시간) — 이용 시작 n시간 전부터 예약 */
    booking_open_hours: number;

    /** 100% 환불 마감(분) — 이용 시작 n분 전까지 취소하면 100% 환불 */
    refund_deadline_minutes: number;

    /** 마감 뒤 환불 비율(%) — 환불 마감 뒤 ~ 이용 시작 전 취소 */
    late_refund_percent: number;

    /** 문 소켓 시크릿 코드 설정 여부 (0: 안 함 — 문 쪽 프로그램이 소켓에 붙을 수 없다, 1: 설정함 — 원문은 볼 수 없다) */
    is_door_secret_set: number;

    /** 정지 사유 (영업중지일 때만) */
    suspend_comment: string | null;

    /** 요일별 영업시간 (일 ~ 토 순) */
    hours: StoreMineHourItemResultDto[];

    /** 브레이크타임 (매일 · 시작 시각 순) */
    breaks: StoreMineBreakItemResultDto[];

    /** 업체 정보 파일 (용도 · 정렬 순서) */
    files: StoreMineFileItemResultDto[];

    /** 수정일시 (ISO 8601) */
    updated_at: string;
}

/**
 * 업체 편의시설 (업체 관리자 내 업체) — 7개 항목(저장 안 된 항목은 없음 0)
 */
export class StoreMineFacilityResultDto {
    /** 편의점 (0: 없음, 1: 있음) */
    has_convenience_store: number;

    /** 카페 (0: 없음, 1: 있음) */
    has_cafe: number;

    /** 온천 (0: 없음, 1: 있음) */
    has_hot_spring: number;

    /** 반려동물 동반 가능 (0: 없음, 1: 있음) */
    is_pet_allowed: number;

    /** 식사 제공 (0: 없음, 1: 있음) */
    has_meal: number;

    /** 배달 음식 가능 (0: 없음, 1: 있음) */
    is_delivery_allowed: number;

    /** 주차 가능 (0: 없음, 1: 있음) */
    has_parking: number;
}
