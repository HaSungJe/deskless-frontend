/** 입점 신청 상태 — store_application_state_id(대기 · 승인 · 반려) — 이용자 입점 신청 · 관리자 입점 신청 관리 */
export const STORE_APPLICATION_STATE = {WAIT: 'WAIT', APPROVED: 'APPROVED', REJECTED: 'REJECTED'} as const;

/** 업체 정보 파일 용도 — store_file_purpose_id(사업자등록증 · 업체 사진) */
export const STORE_FILE_PURPOSE = {LICENSE: 'BUSINESS_LICENSE', IMAGE: 'STORE_IMAGE'} as const;

/** 업체 상태 — store_state_id(활성 · 영업중지 · 탈퇴) — 업체 관리자 콘솔 · 관리자 업체 관리 */
export const STORE_STATE = {ACTIVE: 'ACTIVE', SUSPEND: 'SUSPEND', LEAVE: 'LEAVE'} as const;

/** 입점 신청 상태 → 배지 색(시안: 대기 warn · 승인 ok · 반려 danger) */
const APPLICATION_STATE_TONE = new Map<string, 'warn' | 'ok' | 'danger'>([[STORE_APPLICATION_STATE.WAIT, 'warn'], [STORE_APPLICATION_STATE.APPROVED, 'ok'], [STORE_APPLICATION_STATE.REJECTED, 'danger']]);

/**
 * 입점 신청 상태 → 배지 색, 모르는 상태는 neutral
 *
 * @param stateId store_application_state_id
 */
export function applicationStateTone(stateId: string): 'warn' | 'ok' | 'danger' | 'neutral' {
    return APPLICATION_STATE_TONE.get(stateId) ?? 'neutral';
}
