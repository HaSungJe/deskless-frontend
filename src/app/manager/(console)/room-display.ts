import { ROOM_STATE } from '@/contracts/common/room.constants';

/** 호실 상태 배지 색 — 시안 M4 · M3(예약가능 ok · 예약완료 pri · 사용중 use · 정비중 warn · 사용중지 err) — 호실 · 예약 현황 */
export const ROOM_STATE_TONE: Record<string, 'ok' | 'primary' | 'inuse' | 'warn' | 'danger'> = {
    [ROOM_STATE.AVAILABLE]: 'ok',
    [ROOM_STATE.RESERVED]: 'primary',
    [ROOM_STATE.IN_USE]: 'inuse',
    [ROOM_STATE.MAINTENANCE]: 'warn',
    [ROOM_STATE.DISABLED]: 'danger',
};

/**
 * 층 이름 — 지상 '3층', 지하 'B1' — 호실 · 예약 현황
 *
 * @param floor 층(지하는 음수)
 */
export function floorLabel(floor: number): string {
    return floor < 0 ? `B${Math.abs(floor)}` : `${floor}층`;
}
