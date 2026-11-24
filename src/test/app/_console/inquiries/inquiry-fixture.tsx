import { InquiryScopeType } from '@/app/_console/inquiries/inquiry-manage';
import { PaginationResultDto } from '@/contracts/common/pagination.dto';
import { InquiryCategoryListResultDto } from '@/contracts/inquiry/dto/inquiry-category-list.dto';
import { InquiryManageDetailResultDto } from '@/contracts/inquiry/dto/inquiry-manage-detail.dto';
import { InquiryManageListResultDto } from '@/contracts/inquiry/dto/inquiry-manage-list.dto';
import { renderWithAdmin } from '../../admin/(console)/admin-fixture';
import { renderWithManager } from '../../manager/(console)/store/store-fixture';

/** 문의 ID · 작성 이용자 ID */
export const INQUIRY_ID = '5e2a9c7b1d3f4a6e8c0b2d4f6a8c0e1b';
export const WRITER_ID = 'u'.repeat(32);

/** 한 쪽 — 14건 중 1쪽(번호 14 부터 내려간다) */
const FIRST_PAGE: PaginationResultDto = {all_search_yn: 'N', total_count: 14, page: 1, max_page: 1, page_range: {start: 1, end: 1}, content_start_number: 14, content_start_number_reverse: 1};

/**
 * 그 영역의 토큰 Context 로 그린다 — 업체 관리자 · 관리자
 *
 * @param scope 영역
 * @param node 화면
 */
export function renderInScope(scope: InquiryScopeType, node: React.ReactNode): HTMLElement {
    return scope === 'manager' ? renderWithManager(node) : renderWithAdmin(node);
}

/**
 * 문의 카테고리 — 예약 · 결제/환불
 */
export function inquiryCategories(): InquiryCategoryListResultDto {
    return {list: [{inquiry_category_id: 'RESERVATION', inquiry_category_name: '예약'}, {inquiry_category_id: 'PAYMENT', inquiry_category_name: '결제/환불'}]};
}

/**
 * 문의 관리 목록 — 접수 1건 · 답변완료 1건
 */
export function manageList(): InquiryManageListResultDto {
    return {
        list: [
            {inquiry_id: INQUIRY_ID, user_id: WRITER_ID, user_nickname: '여행하는고양이', inquiry_category_id: 'PAYMENT', inquiry_category_name: '결제/환불', title: '환불은 언제 되나요?', inquiry_state_id: 'RECEIVED', inquiry_state_name: '접수', answered_at: null, created_at: '2026-11-20T03:00:00.000Z'},
            {inquiry_id: 'c'.repeat(32), user_id: WRITER_ID, user_nickname: '새벽기차', inquiry_category_id: 'RESERVATION', inquiry_category_name: '예약', title: '연장은 어떻게 하나요?', inquiry_state_id: 'ANSWERED', inquiry_state_name: '답변완료', answered_at: '2026-11-19T09:30:00.000Z', created_at: '2026-11-19T01:00:00.000Z'},
        ],
        pagination: FIRST_PAGE,
    };
}

/**
 * 문의 관리 상세 — 기본은 답변 전 접수
 *
 * @param extra 바꿀 값
 */
export function manageDetail(extra: Partial<InquiryManageDetailResultDto> = {}): InquiryManageDetailResultDto {
    return {
        inquiry_id: INQUIRY_ID,
        user_id: WRITER_ID,
        user_nickname: '여행하는고양이',
        store_id: null,
        inquiry_category_id: 'PAYMENT',
        inquiry_category_name: '결제/환불',
        title: '환불은 언제 되나요?',
        content: '어제 취소한 예약의 환불 날짜가 궁금해요.',
        inquiry_state_id: 'RECEIVED',
        inquiry_state_name: '접수',
        answer_content: null,
        answer_user_name: null,
        answered_at: null,
        blinded_at: null,
        created_at: '2026-11-20T03:00:00.000Z',
        ...extra,
    };
}
