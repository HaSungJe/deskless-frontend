import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 업체의 객실 그룹 목록 path param
 */
export class DiscoveryRoomGroupListParamDto {
    /** 업체 ID */
    @Matches(/^[a-f0-9]{32}$/, {message: '업체 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '업체 ID를 입력해주세요.'})
    store_id: string;
}

/**
 * 객실 그룹 상세정보 (편의시설)
 */
export class DiscoveryRoomGroupDetailResultDto {
    /** 객실 안의 방 개수 */
    room_count: number;

    /** 샤워 시설 여부 (0 · 1) */
    has_shower: number;

    /** TV 여부 (0 · 1) */
    has_tv: number;

    /** PC 여부 (0 · 1) */
    has_pc: number;
}

/**
 * 객실 그룹 사진 1장
 */
export class DiscoveryRoomGroupImageResultDto {
    /** 사진 주소 (CloudFront) */
    image_url: string;

    /** 정렬 순서 (0 이 대표) */
    sort_order: number;
}

/**
 * 기간 가격 1개 — 그 기간의 날짜는 기본 요금 대신 이 요금
 */
export class DiscoveryRoomGroupPeriodPriceResultDto {
    /** 시작 날짜 (YYYY-MM-DD, 포함) */
    start_date: string;

    /** 끝 날짜 (YYYY-MM-DD, 포함) */
    end_date: string;

    /** 요금(원) */
    price: number;

    /** 메모 (예: 여름 성수기) */
    memo: string | null;
}

/**
 * 판매 중인 상품 1개
 */
export class DiscoveryRoomGroupPlanResultDto {
    /** 상품 종류 (HOURLY · NIGHT · LONG) */
    room_plan_type_id: string;

    /** 상품 종류명 */
    room_plan_type_name: string;

    /** 기본 요금(원) — 시간 이용 1회 · 1박 · 연박 1박당 */
    price: number;

    /** 기간 가격 (끝 날짜가 오늘 이후, 시작 날짜 순) */
    period_prices: DiscoveryRoomGroupPeriodPriceResultDto[];
}

/**
 * 객실 그룹 1개 — 예약 받을 호실 · 판매 중인 상품이 있는 그룹만
 */
export class DiscoveryRoomGroupItemResultDto {
    /** 객실 그룹 ID */
    room_group_id: string;

    /** 그룹명 */
    room_group_name: string;

    /** 설명 */
    description: string | null;

    /** 상세정보 (편의시설) */
    room_group_detail: DiscoveryRoomGroupDetailResultDto;

    /** 예약 받을 호실 수 (지워지지 않고 사용중지가 아닌 호실) */
    room_count: number;

    /** 사진 (정렬 순서) */
    images: DiscoveryRoomGroupImageResultDto[];

    /** 판매 중인 상품 (시간 이용 → 1박 → 연박) */
    plans: DiscoveryRoomGroupPlanResultDto[];
}

/**
 * 업체의 객실 그룹 목록 — 그룹명 순. 시간대별 예약 가능한 호수는 예약 가능 시간 API(그룹 필터)로 본다
 */
export class DiscoveryRoomGroupListResultDto {
    /** 객실 그룹 목록 (그룹명 순) */
    list: DiscoveryRoomGroupItemResultDto[];
}
