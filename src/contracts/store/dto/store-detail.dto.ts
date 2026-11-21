import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 업체 상세 path param (총관리자)
 */
export class StoreDetailParamDto {
    /** 업체 ID */
    @Matches(/^[a-f0-9]{32}$/, {message: '업체 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '업체 ID를 입력해주세요.'})
    store_id: string;
}

/**
 * 업체 정보 파일 (총관리자 — 사업자등록증 · 업체 사진)
 */
export class StoreDetailFileResultDto {
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

    /** 정렬 순서 (업체 사진은 0 이 대표) */
    sort_order: number;

    /** 등록일시 (ISO 8601) */
    created_at: string;
}

/**
 * 업체 상세 (총관리자)
 */
export class StoreDetailResultDto {
    /** 업체 ID */
    store_id: string;

    /** 업체코드 (매니저 로그인 · 매니저 화면 주소) */
    store_code: string;

    /** 업체 상태 (ACTIVE · SUSPEND · LEAVE) */
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

    /** 24시간 연중무휴 여부 (0 · 1) */
    is_always_open: number;

    /** 영업중 여부 (0: 영업중 아님 · 영업준비, 1: 영업중) */
    is_open: number;

    /** 정비시간(분) */
    maintenance_minutes: number;

    /** 예약 가능 시작(시간) — 이용 시작 n시간 전부터 예약 */
    booking_open_hours: number;

    /** 100% 환불 마감(분) — 이용 시작 n분 전까지 취소하면 100% 환불 */
    refund_deadline_minutes: number;

    /** 마감 뒤 환불 비율(%) — 환불 마감 뒤 ~ 이용 시작 전 취소 */
    late_refund_percent: number;

    /** 정지 사유 (영업중지일 때만) */
    suspend_comment: string | null;

    /** 등록일시 (ISO 8601) */
    created_at: string;

    /** 수정일시 (ISO 8601) */
    updated_at: string;

    /** 업체 정보 파일 (용도 · 정렬 순서) */
    files: StoreDetailFileResultDto[];
}
