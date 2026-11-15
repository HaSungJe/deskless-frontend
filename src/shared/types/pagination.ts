/** 페이지 탭에 보일 번호 범위 */
type PageRangeType = {
    start: number;
    end: number;
};

/**
 * 목록 응답 {list, pagination} 의 pagination
 * - contracts/common/pagination.dto.ts 의 PaginationResultDto 와 같은 구조 (shared 는 contracts 를 가져오지 않는다)
 */
export type PaginationType = {
    all_search_yn: 'Y' | 'N';
    total_count: number;
    page: number;
    max_page: number;
    page_range: PageRangeType;
    content_start_number: number;
    content_start_number_reverse: number;
};
