import {IsIn, IsLatitude, IsLongitude, IsNotEmpty, IsOptional, Matches, MaxLength} from 'class-validator';

/**
 * 반경 업체 조회 query — 지도 중심(처음엔 내 위치) 위경도 + 반경(ALL — 거리 제한 없음) + 추가정보 필터(선택). 쿼리 값은 문자열이다.
 */
export class DiscoveryStoreListDto {
    // 중심 위도 (WGS84 — 지도 중심 · 내 위치)
    @IsLatitude({message: '위도가 올바르지 않습니다.'})
    @IsNotEmpty({message: '위도를 입력해주세요.'})
    latitude: string;

    // 중심 경도 (WGS84)
    @IsLongitude({message: '경도가 올바르지 않습니다.'})
    @IsNotEmpty({message: '경도를 입력해주세요.'})
    longitude: string;

    // 반경(km) — 5 · 10 · 20 · 50, ALL: 거리 제한 없음(가까운 순 300개)
    @IsIn(['5', '10', '20', '50', 'ALL'], {message: '반경은 5 · 10 · 20 · 50km · 제한 없음(ALL) 중에서 골라주세요.'})
    @IsNotEmpty({message: '반경을 입력해주세요.'})
    radius_km: string;

    // 추가정보 필터 — 항목 키를 쉼표로(항목은 GET /api/v1/user-service/discovery/detail-filter). 객실 항목은 고른 조건을 모두 갖춘 객실 그룹이 있는 업체만, 업체 편의시설 항목은 그 시설이 있는 업체만
    @IsOptional()
    @Matches(/^[a-z_]+(,[a-z_]+)*$/, {message: '추가정보 필터가 올바르지 않습니다.'})
    @MaxLength(200, {message: '추가정보 필터가 올바르지 않습니다.'})
    detail_filter: string | null;

    /**
     * @param data 요청 쿼리 — 빠진 필수 값은 빈 문자열(검증에서 걸린다), 빠진 필터는 null
     */
    constructor(data?: Partial<DiscoveryStoreListDto>) {
        this.latitude = data?.latitude ?? '';
        this.longitude = data?.longitude ?? '';
        this.radius_km = data?.radius_km ?? '';
        this.detail_filter = data?.detail_filter ?? null;
    }
}

/**
 * 반경 업체 1개 — 지도 마커 · 목록 카드 공용
 */
export class DiscoveryStoreItemResultDto {
    /** 업체 ID */
    store_id: string;

    /** 상호명 */
    store_name: string;

    /** 주소 */
    address: string;

    /** 위도 (WGS84) */
    latitude: number;

    /** 경도 (WGS84) */
    longitude: number;

    /** 중심에서 거리(m, 반올림 — 대원 거리) */
    distance_m: number;

    /** 대표 사진 주소 (업체 사진 첫 장 — CloudFront), 없으면 null */
    image_url: string | null;

    /** 영업중 여부 (0: 지금 영업하지 않음 — 예약 불가, 1: 영업중) */
    is_open: number;

    /** 24시간 연중무휴 여부 (0: 요일별 영업시간, 1: 24시간) */
    is_always_open: number;

    /** 시간 이용 최저가(원) — 판매 중인 그룹 상품의 기본 요금 중 가장 낮은 값, 팔지 않으면 null */
    min_hourly_price: number | null;

    /** 1박 최저가(원) — 판매 중인 그룹 상품의 기본 요금 중 가장 낮은 값, 팔지 않으면 null */
    min_night_price: number | null;
}

/**
 * 반경 업체 조회 결과 — 가까운 순, 최대 300개
 */
export class DiscoveryStoreListResultDto {
    /** 업체 목록 (가까운 순) */
    list: DiscoveryStoreItemResultDto[];

    /** 300개를 넘어 잘렸는지 (0: 아님, 1: 잘림 — 반경을 줄여 다시 조회) */
    is_truncated: number;
}
