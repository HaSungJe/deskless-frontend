import {IsIn, IsOptional} from 'class-validator';
import {PaginationDto, PaginationResultDto} from '../../common/pagination.dto';
import {INQUIRY_CATEGORY_IDS, INQUIRY_STATE_IDS} from '../inquiry.constants';

/**
 * 내 문의 목록 query (이용자) — 카테고리 · 상태 거르기(없으면 전체) · 페이지. 블라인드된 문의도 나온다.
 */
export class InquiryListDto extends PaginationDto {
    // 카테고리 ID — 없으면 전체 (항목은 GET /api/v1/user-service/inquiry/category)
    @IsOptional()
    @IsIn(INQUIRY_CATEGORY_IDS, {message: '카테고리가 올바르지 않습니다.'})
    inquiry_category_id: string | null;

    // 상태 (RECEIVED: 접수, ANSWERED: 답변완료, BLIND: 블라인드) — 없으면 전체
    @IsOptional()
    @IsIn(INQUIRY_STATE_IDS, {message: '상태가 올바르지 않습니다.'})
    inquiry_state_id: string | null;

    /**
     * @param data 요청 쿼리 — 빠진 페이지 값은 PaginationDto 기본값, 빠진 필터는 null(전체)
     */
    constructor(data?: Partial<InquiryListDto>) {
        super(data);
        this.inquiry_category_id = data?.inquiry_category_id ?? null;
        this.inquiry_state_id = data?.inquiry_state_id ?? null;
    }
}

/**
 * 내 문의 목록 항목
 */
export class InquiryListItemResultDto {
    // 문의 ID
    inquiry_id: string;

    // 문의한 업체 ID (바로방 문의면 null)
    store_id: string | null;

    // 문의한 업체 상호명 (바로방 문의면 null)
    store_name: string | null;

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
 * 내 문의 목록
 */
export class InquiryListResultDto {
    // 목록 (문의일 최신순)
    list: InquiryListItemResultDto[];

    // 페이지 정보
    pagination: PaginationResultDto;
}
