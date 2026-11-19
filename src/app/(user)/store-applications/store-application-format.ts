/** 입점 신청 상태 — 대기만 파일을 바꾸고 취소한다 */
export const APPLICATION_STATE = {WAIT: 'WAIT', APPROVED: 'APPROVED', REJECTED: 'REJECTED'} as const;

/** 업체 정보 파일 용도 */
export const FILE_PURPOSE = {LICENSE: 'BUSINESS_LICENSE', IMAGE: 'STORE_IMAGE'} as const;

/** 용도별 최대 장수 — StoreApplicationFileUploadUrlDto(사업자등록증 1장 · 업체 사진 5장) */
export const FILE_MAX = {BUSINESS_LICENSE: 1, STORE_IMAGE: 5} as const;

/** 신청 상태 → 배지 색(시안: 대기 warn · 승인 ok · 반려 danger) */
const STATE_TONE = new Map<string, 'warn' | 'ok' | 'danger'>([[APPLICATION_STATE.WAIT, 'warn'], [APPLICATION_STATE.APPROVED, 'ok'], [APPLICATION_STATE.REJECTED, 'danger']]);

/**
 * 신청 상태 → 배지 색, 모르는 상태는 neutral
 *
 * @param stateId store_application_state_id
 */
export function applicationStateTone(stateId: string): 'warn' | 'ok' | 'danger' | 'neutral' {
    return STATE_TONE.get(stateId) ?? 'neutral';
}
