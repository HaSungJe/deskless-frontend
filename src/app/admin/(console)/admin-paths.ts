/** 입점 신청 목록 */
export const APPLICATION_LIST_PATH = '/admin/store-applications/';

/** 업체 목록 */
export const STORE_LIST_PATH = '/admin/stores/';

/** 업체 관리자 목록 */
export const MANAGER_LIST_PATH = '/admin/managers/';

/** 이용자 목록 */
export const USER_LIST_PATH = '/admin/users/';

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
 * 업체 관리자 상세
 *
 * @param userId 회원 ID
 */
export function managerPath(userId: string): string {
    return `${MANAGER_LIST_PATH}${encodeURIComponent(userId)}/`;
}

/**
 * 그 업체로 거른 업체 관리자 목록 — 업체 상세의 "이 업체의 업체 관리자"
 *
 * @param storeId 업체 ID
 */
export function storeManagersPath(storeId: string): string {
    return `${MANAGER_LIST_PATH}?store_id=${encodeURIComponent(storeId)}`;
}

/**
 * 이용자 상세 — 입점 신청 상세의 "이용자 상세 보기"
 *
 * @param userId 회원 ID
 */
export function userPath(userId: string): string {
    return `${USER_LIST_PATH}${encodeURIComponent(userId)}/`;
}
