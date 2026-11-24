import { DiscoveryStoreDetailResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import { DiscoveryStoreSearchItemResultDto } from '@/contracts/discovery/dto/discovery-store-search.dto';
import { SITE_NAME } from '@/shared/utils/site';

/** 내 문의 목록 */
export const INQUIRY_LIST_PATH = '/inquiries/';

/** 문의하기 */
export const INQUIRY_NEW_PATH = '/inquiries/new/';

/**
 * 내 문의 상세
 *
 * @param inquiryId 문의 ID
 */
export function inquiryPath(inquiryId: string): string {
    return `${INQUIRY_LIST_PATH}${encodeURIComponent(inquiryId)}/`;
}

/**
 * 이 업체에 문의 — 업체 상세의 링크(그 업체가 골라진 채 문의하기)
 *
 * @param storeId 업체 ID
 */
export function storeInquiryPath(storeId: string): string {
    return `${INQUIRY_NEW_PATH}?store_id=${encodeURIComponent(storeId)}`;
}

/**
 * 문의 대상 이름 — 업체에 한 문의는 상호명, 업체가 없는 문의(바로방 문의)는 사이트 이름
 *
 * @param storeName 응답의 store_name (바로방 문의면 null)
 */
export function inquiryTargetName(storeName: string | null): string {
    return storeName ?? SITE_NAME;
}

/**
 * 업체 상세 → 고른 업체 — 검색 결과 한 줄과 같은 모양(대표 사진 첫 장 · 주소만)
 *
 * @param detail 업체 상세
 */
export function storeItemOf(detail: DiscoveryStoreDetailResultDto): DiscoveryStoreSearchItemResultDto {
    return {store_id: detail.store_id, store_name: detail.store_name, address: detail.address, latitude: detail.latitude, longitude: detail.longitude, image_url: detail.images[0]?.image_url ?? null};
}
