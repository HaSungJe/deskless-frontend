import {IsIn, IsOptional, Matches, MaxLength} from 'class-validator';
import {PaginationDto, PaginationResultDto} from '../../common/pagination.dto';

/**
 * 업체 관리자 목록 query (총관리자 · 관리자 — 전체 업체) — 검색어(상호명 · 업체코드 · 아이디 · 이름 · 휴대폰 번호 부분 일치) · 업체 · 권한 · 상태
 */
export class ManagerAccountListDto extends PaginationDto {
    /** 검색어 — 상호명 · 업체코드 · 아이디 · 이름 · 휴대폰 번호 부분 일치 */
    @IsOptional()
    @MaxLength(100, {message: '검색어는 100자 이내로 입력해주세요.'})
    keyword: string | null;

    /** 업체 ID — 없으면 전체 업체 */
    @IsOptional()
    @Matches(/^[a-f0-9]{32}$/, {message: '업체 ID가 올바르지 않습니다.'})
    store_id: string | null;

    /** 권한 (HEAD_MANAGER: 업체 총관리자, MANAGER: 업체 관리자) — 없으면 전체 */
    @IsOptional()
    @IsIn(['HEAD_MANAGER', 'MANAGER'], {message: '권한이 올바르지 않습니다.'})
    auth_id: string | null;

    /** 상태 (ACTIVE: 정상, BLOCK: 정지) — 없으면 전체 */
    @IsOptional()
    @IsIn(['ACTIVE', 'BLOCK'], {message: '상태가 올바르지 않습니다.'})
    state_id: string | null;

    /**
     * @param data 요청 쿼리 — 빠진 페이지 값은 PaginationDto 기본값, 빠진 필터는 null
     */
    constructor(data?: Partial<ManagerAccountListDto>) {
        super(data);
        this.keyword = data?.keyword ?? null;
        this.store_id = data?.store_id ?? null;
        this.auth_id = data?.auth_id ?? null;
        this.state_id = data?.state_id ?? null;
    }
}

/**
 * 업체 관리자 목록 항목 — 업체(상호명 · 업체코드 · 업체 상태)와 함께
 */
export class ManagerAccountListItemResultDto {
    /** 회원 ID */
    user_id: string;

    /** 업체 ID */
    store_id: string;

    /** 상호명 */
    store_name: string;

    /** 업체코드 */
    store_code: string;

    /** 업체 상태 (ACTIVE · SUSPEND · LEAVE) */
    store_state_id: string;

    /** 로그인 아이디 */
    login_id: string;

    /** 이름 */
    name: string;

    /** 휴대폰 번호 (없으면 null) */
    phone: string | null;

    /** 권한 (HEAD_MANAGER: 업체 총관리자, MANAGER: 업체 관리자) */
    auth_id: string;

    /** 상태 (ACTIVE: 정상, BLOCK: 정지) */
    state_id: string;

    /** 비밀번호 변경 필요 여부(0: 불필요, 1: 필요 — 임시 비밀번호) */
    is_password_change_required: number;

    /** 등록일시 (ISO 8601) */
    created_at: string;
}

/**
 * 업체 관리자 목록
 */
export class ManagerAccountListResultDto {
    /** 목록 (등록 최신순) */
    list: ManagerAccountListItemResultDto[];

    /** 페이지 정보 */
    pagination: PaginationResultDto;
}
