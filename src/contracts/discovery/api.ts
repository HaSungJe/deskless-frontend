import { request } from '@/shared/api/request';
import { DiscoveryRoomGroupListResultDto } from './dto/discovery-room-group-list.dto';
import { DiscoveryStoreDetailResultDto } from './dto/discovery-store-detail.dto';
import { DiscoveryStoreListDto, DiscoveryStoreListResultDto } from './dto/discovery-store-list.dto';

/**
 * 반경 업체 조회 — 동기 · 공개 (GET /user-service/discovery/store)
 *
 * @param query 중심 위경도 · 반경(문자열)
 * @param signal 다음 조회를 시작하거나 화면을 떠날 때 취소
 */
export function getNearbyStores(query: DiscoveryStoreListDto, signal?: AbortSignal): Promise<DiscoveryStoreListResultDto | null> {
    return request<DiscoveryStoreListResultDto>({
        path: '/user-service/discovery/store',
        query: {latitude: query.latitude, longitude: query.longitude, radius_km: query.radius_km},
        signal,
    });
}

/**
 * 업체 상세 — 동기 · 공개 (GET /user-service/discovery/store/:store_id)
 *
 * @param store_id 업체 ID(주소에서 — 경로에 넣을 때 encode)
 * @param signal 화면을 떠날 때 취소
 */
export function getStoreDetail(store_id: string, signal?: AbortSignal): Promise<DiscoveryStoreDetailResultDto | null> {
    return request<DiscoveryStoreDetailResultDto>({path: `/user-service/discovery/store/${encodeURIComponent(store_id)}`, signal});
}

/**
 * 업체의 객실 그룹 목록 — 동기 · 공개 (GET /user-service/discovery/store/:store_id/room-group)
 *
 * @param store_id 업체 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getStoreRoomGroups(store_id: string, signal?: AbortSignal): Promise<DiscoveryRoomGroupListResultDto | null> {
    return request<DiscoveryRoomGroupListResultDto>({path: `/user-service/discovery/store/${encodeURIComponent(store_id)}/room-group`, signal});
}
