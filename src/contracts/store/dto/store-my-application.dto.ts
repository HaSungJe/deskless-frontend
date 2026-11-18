import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 내 입점 신청 상세 path param
 */
export class StoreMyApplicationParamDto {
    /** 입점 신청 ID */
    @Matches(/^[a-f0-9]{32}$/, {message: '입점 신청 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '입점 신청 ID를 입력해주세요.'})
    store_application_id: string;
}

/**
 * 내 입점 신청의 업체 정보 파일
 */
export class StoreMyApplicationFileResultDto {
    /** 업체 정보 파일 ID */
    store_file_id: string;

    /** 용도 (BUSINESS_LICENSE: 사업자등록증, STORE_IMAGE: 업체 사진) */
    store_file_purpose_id: string;

    /** 원본 파일명 */
    file_name: string;

    /** MIME 타입 */
    content_type: string;

    /** 비공개 여부 (1: 서명된 열람 주소 · 10분 유효, 0: CDN 공개 주소) */
    is_private: number;

    /** 열람 주소 */
    file_url: string;

    /** 등록일시 (ISO 8601) */
    created_at: string;
}

/**
 * 내 입점 신청 상세 — 모든 상태(승인 신청은 업체코드 포함), 남의 신청은 404
 */
export class StoreMyApplicationResultDto {
    /** 입점 신청 ID */
    store_application_id: string;

    /** 신청 상태 (WAIT · REJECTED) */
    store_application_state_id: string;

    /** 상호명 */
    store_name: string;

    /** 사업자등록번호 */
    business_number: string;

    /** 대표자명 */
    owner_name: string;

    /** 대표자 휴대폰 번호 — 업체 총관리자 계정 */
    owner_phone: string;

    /** 업체 총관리자 아이디 */
    head_manager_login_id: string;

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

    /** 신청 메모 */
    application_comment: string | null;

    /** 반려 사유 */
    reject_comment: string | null;

    /** 처리일시 (ISO 8601) */
    reviewed_at: string | null;

    /** 신청일시 (ISO 8601) */
    created_at: string;

    /** 업체코드 — 승인 신청이면 그 업체의 코드, 아니면 null */
    store_code: string | null;

    /** 업체 정보 파일 (용도 · 정렬 순서) */
    files: StoreMyApplicationFileResultDto[];
}
