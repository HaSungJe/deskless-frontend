import {IsIn, IsOptional, MaxLength} from 'class-validator';
import {PaginationDto, PaginationResultDto} from '../../common/pagination.dto';

/**
 * 업체 목록 query (총관리자) — 상태 · 검색어(상호명 · 사업자등록번호 · 대표자명 부분 일치)
 */
export class StoreListDto extends PaginationDto {
    /** 업체 상태 (ACTIVE · SUSPEND · LEAVE) — 없으면 전체 */
    @IsOptional()
    @IsIn(['ACTIVE', 'SUSPEND', 'LEAVE'], {message: '업체 상태가 올바르지 않습니다.'})
    store_state_id: string | null;

    /** 검색어 — 상호명 · 사업자등록번호 · 대표자명 부분 일치 */
    @IsOptional()
    @MaxLength(100, {message: '검색어는 100자 이내로 입력해주세요.'})
    keyword: string | null;

    /**
     * @param data 요청 쿼리 — 빠진 페이지 값은 PaginationDto 기본값, 빠진 필터는 null
     */
    constructor(data?: Partial<StoreListDto>) {
        super(data);
        this.store_state_id = data?.store_state_id ?? null;
        this.keyword = data?.keyword ?? null;
    }
}

/**
 * 업체 목록 항목
 */
export class StoreListItemResultDto {
    /** 업체 ID */
    store_id: string;

    /** 업체코드 (매니저 로그인 · 매니저 화면 주소) */
    store_code: string;

    /** 업체 상태 (ACTIVE · SUSPEND · LEAVE) */
    store_state_id: string;

    /** 상호명 */
    store_name: string;

    /** 사업자등록번호 (탈퇴 업체는 DELETE_<store_id>) */
    business_number: string;

    /** 대표자명 */
    owner_name: string;

    /** 업체 연락처 */
    phone: string;

    /** 주소 */
    address: string;

    /** 영업중 여부 (0: 영업중 아님 · 영업준비, 1: 영업중) */
    is_open: number;

    /** 등록일시 (ISO 8601) */
    created_at: string;
}

/**
 * 업체 목록
 */
export class StoreListResultDto {
    /** 목록 (등록일 최신순) */
    list: StoreListItemResultDto[];

    /** 페이지 정보 */
    pagination: PaginationResultDto;
}
