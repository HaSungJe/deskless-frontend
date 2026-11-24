import {IsNotEmpty, MaxLength} from 'class-validator';

/**
 * 업체 이름 검색 query (문의할 업체 고르기) — 상호명 부분 일치. 쿼리 값은 문자열이다.
 */
export class DiscoveryStoreSearchDto {
    // 검색어 — 상호명 부분 일치 (50자까지)
    @MaxLength(50, {message: '검색어는 50자 이내로 입력해주세요.'})
    @IsNotEmpty({message: '검색어를 입력해주세요.'})
    keyword: string;

    /**
     * @param data 요청 쿼리 — 빠진 검색어는 빈 문자열(검증에서 걸린다)
     */
    constructor(data?: Partial<DiscoveryStoreSearchDto>) {
        this.keyword = data?.keyword ?? '';
    }
}

/**
 * 업체 이름 검색 항목
 */
export class DiscoveryStoreSearchItemResultDto {
    // 업체 ID — 문의 등록의 store_id
    store_id: string;

    // 상호명
    store_name: string;

    // 주소
    address: string;

    // 위도 (WGS84) — 지도에서 위치 확인
    latitude: number;

    // 경도 (WGS84) — 지도에서 위치 확인
    longitude: number;

    // 대표 사진 주소 (업체 사진 첫 장 — 공개 주소), 없으면 null
    image_url: string | null;
}

/**
 * 업체 이름 검색 결과 — 영업 중 · 영업중지 업체, 상호명 순 최대 20건. 주소 · 위경도 · 대표 사진 1장 포함(사용자 결정 2026-11-24)
 */
export class DiscoveryStoreSearchResultDto {
    // 업체 (상호명 순, 최대 20건)
    list: DiscoveryStoreSearchItemResultDto[];
}
