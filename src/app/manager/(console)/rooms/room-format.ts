import { ROOM_STATE } from '@/contracts/common/room.constants';

/** 상태 대화상자 버튼 하나 */
export type RoomStateActionType = {
    label: string;                                                           // 버튼 글자
    room_state_id: typeof ROOM_STATE.AVAILABLE | typeof ROOM_STATE.DISABLED; // 바꿀 상태 — RoomStateDto 가 받는 두 값
};

/**
 * 상태별 고를 수 있는 버튼 — 정비중 → 정비 완료 · 사용중지, 사용중지 → 사용 재개, 그 밖(예약가능 · 예약완료 · 사용중) → 사용중지
 * - 백엔드가 허락하는 전환만(RoomStateDto — 그 밖은 400)
 *
 * @param roomStateId 지금 상태
 */
export function roomStateActions(roomStateId: string): Array<RoomStateActionType> {
    if (roomStateId === ROOM_STATE.MAINTENANCE) {
        return [{label: '정비 완료', room_state_id: ROOM_STATE.AVAILABLE}, {label: '사용중지', room_state_id: ROOM_STATE.DISABLED}];
    }

    if (roomStateId === ROOM_STATE.DISABLED) {
        return [{label: '사용 재개', room_state_id: ROOM_STATE.AVAILABLE}];
    }

    return [{label: '사용중지', room_state_id: ROOM_STATE.DISABLED}];
}

/** 문을 마지막으로 연 시각 모양 — 한국 시각 yyyyMMddHHmmss */
const OPENED_AT_PATTERN = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})\d{2}$/;

/**
 * 마지막으로 연 시각 글자 — 'YYYY-MM-DD HH:mm'(이미 한국 시각이라 시간대를 바꾸지 않는다, 초는 뺀다), 없거나 모양이 틀리면 '-'
 * - toKst 는 ISO 를 받아 시간대를 바꾸는 함수라 쓰지 않는다
 *
 * @param value door_opened_at
 */
export function formatOpenedAt(value: string | null | undefined): string {
    const match = value ? OPENED_AT_PATTERN.exec(value) : null;
    if (!match) {
        return '-';
    }

    const [, year, month, day, hour, minute] = match;
    return `${year}-${month}-${day} ${hour}:${minute}`;
}
