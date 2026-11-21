/** 입점 신청 목록 */
export const APPLICATION_LIST_PATH = '/admin/store-applications/';

/** 업체 목록 */
export const STORE_LIST_PATH = '/admin/stores/';

/**
 * 입점 신청 상세
 *
 * @param storeApplicationId 입점 신청 ID
 */
export function applicationPath(storeApplicationId: string): string {
    return `${APPLICATION_LIST_PATH}${encodeURIComponent(storeApplicationId)}/`;
}

/**
 * 업체 상세
 *
 * @param storeId 업체 ID
 */
export function storePath(storeId: string): string {
    return `${STORE_LIST_PATH}${encodeURIComponent(storeId)}/`;
}

/**
 * 그 업체로 거른 업체 관리자 목록(A5 — Phase 17 에서 화면이 생긴다)
 *
 * @param storeId 업체 ID
 */
export function storeManagersPath(storeId: string): string {
    return `/admin/managers/?store_id=${encodeURIComponent(storeId)}`;
}

/**
 * 이용자 상세(A6 — Phase 17 에서 화면이 생긴다)
 *
 * @param userId 회원 ID
 */
export function userPath(userId: string): string {
    return `/admin/users/${encodeURIComponent(userId)}/`;
}
