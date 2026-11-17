import { ApiError } from '@/shared/api/request';

/** 없는 업체 · 잘못된 업체 ID */
export const STORE_NOT_FOUND_MESSAGE = '업체를 찾을 수 없습니다.';

/**
 * 없는 업체인지 — 업체 · 객실 그룹 조회가 404(없음) · 400(ID 모양)
 *
 * @param error 잡은 오류
 */
export function isStoreNotFound(error: unknown): boolean {
    return error instanceof ApiError && (error.status === 404 || error.status === 400);
}
