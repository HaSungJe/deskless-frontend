import {IsOptional, MaxLength} from 'class-validator';
import {PaginationDto, PaginationResultDto} from '../../common/pagination.dto';

/**
 * 객실 그룹 목록 query — 검색어(그룹명 부분 일치). 지워지지 않은 그룹만, 등록일 최신순
 */
export class RoomGroupListDto extends PaginationDto {
    /** 검색어 — 그룹명 부분 일치 */
    @IsOptional()
    @MaxLength(100, {message: '검색어는 100자 이내로 입력해주세요.'})
    keyword: string | null;

    /**
     * @param data 요청 쿼리 — 빠진 페이지 값은 PaginationDto 기본값, 빠진 검색어는 null
     */
    constructor(data?: Partial<RoomGroupListDto>) {
        super(data);
        this.keyword = data?.keyword ?? null;
    }
}

/**
 * 객실 그룹 목록 항목
 */
export class RoomGroupListItemResultDto {
    /** 객실 그룹 ID */
    room_group_id: string;

    /** 그룹명 */
    room_group_name: string;

    /** 호실 수 (지워지지 않은 호실) */
    room_count: number;

    /** 대표 사진 열람 주소 (CDN — 순서가 가장 앞인 사진) — 사진이 없으면 null */
    image_url: string | null;

    /** 등록일시 (ISO 8601) */
    created_at: string;
}

/**
 * 객실 그룹 목록
 */
export class RoomGroupListResultDto {
    /** 목록 (등록일 최신순) */
    list: RoomGroupListItemResultDto[];

    /** 페이지 정보 */
    pagination: PaginationResultDto;
}
