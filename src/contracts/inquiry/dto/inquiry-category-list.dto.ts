/**
 * 문의 카테고리 1개 — 등록 화면의 고르기 · 목록 거르기 항목
 */
export class InquiryCategoryItemResultDto {
    // 카테고리 ID — 문의 등록 · 목록 거르기의 inquiry_category_id (예: RESERVATION)
    inquiry_category_id: string;

    // 카테고리 이름 (예: 예약 · 결제/환불)
    inquiry_category_name: string;
}

/**
 * 문의 카테고리 목록 — 보일 순서
 */
export class InquiryCategoryListResultDto {
    // 카테고리 (보일 순서)
    list: InquiryCategoryItemResultDto[];
}
