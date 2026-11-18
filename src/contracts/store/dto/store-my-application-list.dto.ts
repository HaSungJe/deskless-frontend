import {PaginationDto, PaginationResultDto} from '../../common/pagination.dto';

/**
 * 내 입점 신청 목록 query — 페이지만. 대기 · 반려 · 승인 모두 나온다(승인 신청은 업체코드 포함).
 */
export class StoreMyApplicationListDto extends PaginationDto {
    /**
     * @param data 요청 쿼리 — 빠진 페이지 값은 PaginationDto 기본값
     */
    constructor(data?: Partial<StoreMyApplicationListDto>) {
        super(data);
    }
}

/**
 * 내 입점 신청 목록 항목
 */
export class StoreMyApplicationItemResultDto {
    /** 입점 신청 ID */
    store_application_id: string;

    /** 신청 상태 (WAIT: 대기, REJECTED: 반려) */
    store_application_state_id: string;

    /** 상호명 */
    store_name: string;

    /** 사업자등록번호 */
    business_number: string;

    /** 반려 사유 (반려가 아니면 null) */
    reject_comment: string | null;

    /** 처리일시 (ISO 8601, 대기면 null) */
    reviewed_at: string | null;

    /** 신청일시 (ISO 8601) */
    created_at: string;

    /** 업체코드 — 승인 신청이면 그 업체의 코드(매니저 로그인 · 매니저 화면 주소), 아니면 null */
    store_code: string | null;
}

/**
 * 내 입점 신청 목록
 */
export class StoreMyApplicationListResultDto {
    /** 목록 (신청일 최신순) */
    list: StoreMyApplicationItemResultDto[];

    /** 페이지 정보 */
    pagination: PaginationResultDto;
}
