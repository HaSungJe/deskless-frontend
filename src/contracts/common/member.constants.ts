/** 회원 상태 — state_id(이용자 ACTIVE · BLOCK · LEAVE_WAIT · LEAVE, 업체 관리자 ACTIVE · BLOCK) */
export const MEMBER_STATE = {ACTIVE: 'ACTIVE', BLOCK: 'BLOCK', LEAVE_WAIT: 'LEAVE_WAIT', LEAVE: 'LEAVE'} as const;

/** 새 예약 · 연장이 막히는 이용자 상태 — 이용 제한 · 탈퇴 대기 */
export const BOOKING_BLOCKED_STATES: ReadonlyArray<string> = [MEMBER_STATE.BLOCK, MEMBER_STATE.LEAVE_WAIT];

/** 회원 상태 배지 색 — 시안(정상 ok · 정지 danger · 탈퇴 대기 warn · 탈퇴 neutral), Map 이라 상속 이름에 속지 않는다 */
const MEMBER_STATE_TONE = new Map<string, 'ok' | 'danger' | 'warn' | 'neutral'>([
    [MEMBER_STATE.ACTIVE, 'ok'],
    [MEMBER_STATE.BLOCK, 'danger'],
    [MEMBER_STATE.LEAVE_WAIT, 'warn'],
    [MEMBER_STATE.LEAVE, 'neutral'],
]);

/**
 * 회원 상태 배지 색
 *
 * @param stateId state_id
 */
export function memberStateTone(stateId: string): 'ok' | 'danger' | 'warn' | 'neutral' {
    return MEMBER_STATE_TONE.get(stateId) ?? 'neutral';
}
