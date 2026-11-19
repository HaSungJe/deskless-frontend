import {PaginationDto, PaginationResultDto} from '../../common/pagination.dto';

/**
 * 내 업체 일시 예약불가 목록 query — 페이지만. 끝나지 않은 것(종료 일시가 지금 이후)만, 시작 순
 */
export class StoreMineUnavailablePeriodListDto extends PaginationDto {
    /**
     * @param data 요청 쿼리 — 빠진 페이지 값은 PaginationDto 기본값
     */
    constructor(data?: Partial<StoreMineUnavailablePeriodListDto>) {
        super(data);
    }
}

/**
 * 일시 예약불가 목록 항목
 */
export class StoreMineUnavailablePeriodItemResultDto {
    /** 일시 예약불가 ID */
    store_unavailable_period_id: string;

    /** 시작 일시 (ISO 8601) */
    starts_at: string;

    /** 종료 일시 (ISO 8601 — 이 시각부터 다시 예약을 받는다) */
    ends_at: string;

    /** 메모 (간단한 사유) */
    memo: string | null;

    /** 등록일시 (ISO 8601) */
    created_at: string;
}

/**
 * 일시 예약불가 목록
 */
export class StoreMineUnavailablePeriodListResultDto {
    /** 목록 (시작 순) */
    list: StoreMineUnavailablePeriodItemResultDto[];

    /** 페이지 정보 */
    pagination: PaginationResultDto;
}
