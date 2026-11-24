import { INQUIRY_STATE } from './inquiry.constants';

/** 상태 칩 순서 — 전체(null) · 접수 · 답변완료 · 블라인드(이용자 · 콘솔 목록) */
export const INQUIRY_STATE_FILTERS: ReadonlyArray<string | null> = [null, INQUIRY_STATE.RECEIVED, INQUIRY_STATE.ANSWERED, INQUIRY_STATE.BLIND];

/** 상태 배지 색 — 접수 warn(답변 기다림) · 답변완료 ok · 블라인드 neutral, Map 이라 상속 이름에 속지 않는다 */
const INQUIRY_STATE_TONE = new Map<string, 'warn' | 'ok' | 'neutral'>([
    [INQUIRY_STATE.RECEIVED, 'warn'],
    [INQUIRY_STATE.ANSWERED, 'ok'],
    [INQUIRY_STATE.BLIND, 'neutral'],
]);

/**
 * 문의 상태 배지 색
 *
 * @param stateId inquiry_state_id
 */
export function inquiryStateTone(stateId: string): 'warn' | 'ok' | 'neutral' {
    return INQUIRY_STATE_TONE.get(stateId) ?? 'neutral';
}
