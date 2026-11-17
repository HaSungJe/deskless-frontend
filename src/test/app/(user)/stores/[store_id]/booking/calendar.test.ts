// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildMonthCells, dayState, initialDate, lastOpenDate, monthNav } from '@/app/(user)/stores/[store_id]/booking/calendar';

/** 판매 요일 비트 — 매일 · 일요일만 · 수요일만 */
const EVERY_DAY = 127;
const SUNDAY_ONLY = 1;
const WEDNESDAY_ONLY = 8;

describe('lastOpenDate — 예약할 수 있는 마지막 날', () => {
    it('[SUCCESS] 10일 오후 2시에 72시간 열림이면 13일까지 고를 수 있다', () => {
        expect(lastOpenDate('2026-11-10T05:00:00.000Z', 72)).toBe('2026-11-13');
    });

    it('[SUCCESS] 밤 11시 30분에 1시간 열림이면 자정을 넘겨 다음 날까지 열린다', () => {
        expect(lastOpenDate('2026-11-10T14:30:00.000Z', 1)).toBe('2026-11-11');
    });
});

describe('buildMonthCells — 달력 칸 배치', () => {
    it('[SUCCESS] 2028년 2월은 화요일에 시작하는 윤년이라 빈칸 두 개 뒤 29일까지 채운다', () => {
        const cells = buildMonthCells('2028-02');

        expect(cells).toHaveLength(2 + 29);
        expect(cells.slice(0, 2)).toEqual([null, null]);
        expect(cells[2]).toBe('2028-02-01');
        expect(cells[cells.length - 1]).toBe('2028-02-29');
    });
});

describe('dayState — 날짜를 고를 수 있는지', () => {
    it('[FAIL:past] 어제는 지난 날이라 고를 수 없다', () => {
        expect(dayState('2026-11-09', '2026-11-10', '2026-11-13', EVERY_DAY)).toBe('past');
    });

    it('[SUCCESS] 예약이 열린 마지막 날까지는 고를 수 있다', () => {
        expect(dayState('2026-11-13', '2026-11-10', '2026-11-13', EVERY_DAY)).toBe('open');
    });

    it('[FAIL:not-open] 마지막 날 다음 날은 아직 예약이 안 열렸다', () => {
        expect(dayState('2026-11-14', '2026-11-10', '2026-11-13', EVERY_DAY)).toBe('not-open');
    });

    it('[FAIL:closed] 그 상품을 팔지 않는 요일은 고를 수 없다', () => {
        expect(dayState('2026-11-11', '2026-11-10', '2026-11-13', SUNDAY_ONLY)).toBe('closed');
    });
});

describe('monthNav — 달 넘기기', () => {
    it('[SUCCESS] 열린 날이 다음 달까지 이어지면 이번 달에서는 다음 달로만 넘길 수 있다', () => {
        expect(monthNav('2026-11', '2026-11-30', '2026-12-03')).toEqual({prev: false, next: true});
    });
});

describe('initialDate — 처음 고르는 날짜', () => {
    it('[SUCCESS] 오늘 고를 수 있으면 오늘로 시작한다', () => {
        expect(initialDate('2026-11-10', '2026-11-13', EVERY_DAY)).toBe('2026-11-10');
    });

    it('[SUCCESS] 오늘 팔지 않으면 열린 날 가운데 가장 이른 날로 시작한다', () => {
        expect(initialDate('2026-11-10', '2026-11-13', WEDNESDAY_ONLY)).toBe('2026-11-11');
    });
});
