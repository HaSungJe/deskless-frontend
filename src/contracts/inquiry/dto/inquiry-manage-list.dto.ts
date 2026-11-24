import {IsIn, IsOptional, MaxLength} from 'class-validator';
import {PaginationDto, PaginationResultDto} from '../../common/pagination.dto';
import {INQUIRY_CATEGORY_IDS, INQUIRY_STATE_IDS} from '../inquiry.constants';

/**
 * 문의 관리 목록 query (업체 관리자 — 소속 업체 문의, 관리자 — 바로방 문의) — 카테고리 · 상태(없으면 전체) · 검색어(제목 · 내용) · 페이지
 */
export class InquiryManageListDto extends PaginationDto {
    // 카테고리 ID — 없으면 전체 (항목은 GET /api/v1/user-service/inquiry/category)
    @IsOptional()
    @IsIn(INQUIRY_CATEGORY_IDS, {message: '카테고리가 올바르지 않습니다.'})
    inquiry_category_id: string | null;

    // 상태 (RECEIVED: 접수, ANSWERED: 답변완료, BLIND: 블라인드) — 없으면 전체
    @IsOptional()
    @IsIn(INQUIRY_STATE_IDS, {message: '상태가 올바르지 않습니다.'})
    inquiry_state_id: string | null;

    // 검색어 — 제목 · 내용 부분 일치
    @IsOptional()
    @MaxLength(100, {message: '검색어는 100자 이내로 입력해주세요.'})
    keyword: string | null;

    /**
     * @param data 요청 쿼리 — 빠진 페이지 값은 PaginationDto 기본값, 빠진 필터는 null(전체)
     */
    constructor(data?: Partial<InquiryManageListDto>) {
        super(data);
        this.inquiry_category_id = data?.inquiry_category_id ?? null;
        this.inquiry_state_id = data?.inquiry_state_id ?? null;
        this.keyword = data?.keyword ?? null;
    }
}

/**
 * 문의 관리 목록 항목
 */
export class InquiryManageItemResultDto {
    // 문의 ID
    inquiry_id: string;

    // 작성 이용자 ID
    user_id: string;

    // 작성 이용자 닉네임
    user_nickname: string;

    // 카테고리 ID
    inquiry_category_id: string;

    // 카테고리 이름
    inquiry_category_name: string;

    // 제목
    title: string;

    // 상태 (RECEIVED: 접수, ANSWERED: 답변완료, BLIND: 블라인드)
    inquiry_state_id: string;

    // 상태 이름
    inquiry_state_name: string;

    // 마지막으로 답변(수정)한 일시 (ISO 8601, 답변 전 null)
    answered_at: string | null;

    // 문의일시 (ISO 8601)
    created_at: string;
}

/**
 * 문의 관리 목록
 */
export class InquiryManageListResultDto {
    // 목록 (문의일 최신순)
    list: InquiryManageItemResultDto[];

    // 페이지 정보
    pagination: PaginationResultDto;
}
