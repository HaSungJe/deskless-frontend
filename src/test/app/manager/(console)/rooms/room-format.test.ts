// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { floorLabel, formatOpenedAt, ROOM_STATE, roomStateActions } from '@/app/manager/(console)/rooms/room-format';

describe('formatOpenedAt — 마지막으로 연 시각 글자', () => {
    it('[SUCCESS] 시각 글자를 날짜 시각으로 바꾼다', () => {
        expect(formatOpenedAt('20261119143005')).toBe('2026-11-19 14:30');
    });

    it('[SUCCESS] 연 적이 없으면 줄표', () => {
        expect(formatOpenedAt(null)).toBe('-');
    });

    it('[FAIL:모양이 틀림] 모양이 틀린 글자면 줄표', () => {
        expect(formatOpenedAt('2026-11-19')).toBe('-');
    });
});

describe('floorLabel — 층 이름', () => {
    it('[SUCCESS] 지상 층은 "층"을 붙인다', () => {
        expect(floorLabel(3)).toBe('3층');
    });

    it('[SUCCESS] 지하 층은 B 를 붙인다', () => {
        expect(floorLabel(-1)).toBe('B1');
    });
});

describe('roomStateActions — 상태별 고를 수 있는 버튼', () => {
    it('[SUCCESS] 예약완료 호실은 사용중지만 고른다', () => {
        expect(roomStateActions(ROOM_STATE.RESERVED)).toEqual([{label: '사용중지', room_state_id: 'DISABLED'}]);
    });

    it('[SUCCESS] 정비중 호실은 정비 완료와 사용중지를 고른다', () => {
        expect(roomStateActions(ROOM_STATE.MAINTENANCE)).toEqual([{label: '정비 완료', room_state_id: 'AVAILABLE'}, {label: '사용중지', room_state_id: 'DISABLED'}]);
    });

    it('[SUCCESS] 사용중지 호실은 사용 재개만 고른다', () => {
        expect(roomStateActions(ROOM_STATE.DISABLED)).toEqual([{label: '사용 재개', room_state_id: 'AVAILABLE'}]);
    });
});
