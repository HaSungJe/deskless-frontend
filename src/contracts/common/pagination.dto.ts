import {IsOptional} from 'class-validator';

/** 페이지 기본값 */
export const PAGINATION_DEFAULTS = {all_search_yn: 'N', page: 1, size: 20, page_size: 10} as const;

/**
 * 목록 query 의 부모 — 목록 DTO 는 이것을 extends 하고 자기 필드만 더한다. 값은 query 문자열로 보낸다
 */
export class PaginationDto {
    /** 전체 조회 여부(Y/N) — Y 면 페이지 없이 전부. 기본값 N */
    @IsOptional()
    all_search_yn: string;

    /** 페이지. 기본값 1 */
    @IsOptional()
    page: number;

    /** 페이지당 개수. 기본값 20 */
    @IsOptional()
    size: number;

    /** 페이지 탭에 보일 페이지 수. 기본값 10 */
    @IsOptional()
    page_size: number;

    /**
     * @param data 요청 쿼리 — 빠진 값은 PAGINATION_DEFAULTS
     */
    constructor(data?: Partial<PaginationDto>) {
        this.all_search_yn = data?.all_search_yn ?? PAGINATION_DEFAULTS.all_search_yn;
        this.page = data?.page ?? PAGINATION_DEFAULTS.page;
        this.size = data?.size ?? PAGINATION_DEFAULTS.size;
        this.page_size = data?.page_size ?? PAGINATION_DEFAULTS.page_size;
    }
}

/** 페이지 탭에 보일 페이지 번호 범위 */
export class PageRangeResultDto {
    /** 시작 페이지 */
    start: number;

    /** 끝 페이지 */
    end: number;
}

/** 목록 응답 `{list, pagination}` 의 pagination */
export class PaginationResultDto {
    /** 전체 조회 여부(Y/N) */
    all_search_yn: 'Y' | 'N';

    /** 총 개수 */
    total_count: number;

    /** 현재 페이지 (범위를 벗어난 요청은 바로잡은 값) */
    page: number;

    /** 마지막 페이지 (0건이어도 1) */
    max_page: number;

    /** 페이지 탭에 보일 페이지 번호 범위 */
    page_range: PageRangeResultDto;

    /** 이 페이지 첫 항목의 번호 — 총 개수부터 내려간다 */
    content_start_number: number;

    /** 이 페이지 첫 항목의 번호 — 1부터 올라간다 */
    content_start_number_reverse: number;
}
