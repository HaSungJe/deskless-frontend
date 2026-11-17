import { toKst } from '@/shared/utils/format';

/** 달력 날 하나 — past: 지난 날, not-open: 아직 예약이 안 열림, closed: 그 상품을 팔지 않는 요일, open: 고를 수 있음 */
export type DayStateType = 'past' | 'not-open' | 'closed' | 'open';

/** 달 이동 버튼을 누를 수 있는지 */
export type MonthNavType = {
    prev: boolean; // 이전 달
    next: boolean; // 다음 달
};

/** 1시간(ms) */
const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * 열리는 마지막 날 — 지금 + 예약 열림 시간의 한국 날짜
 *
 * @param nowIso 지금(ISO)
 * @param bookingOpenHours 업체 예약 가능 시작(시간)
 */
export function lastOpenDate(nowIso: string, bookingOpenHours: number): string {
    return toKst(new Date(Date.parse(nowIso) + bookingOpenHours * MS_PER_HOUR).toISOString(), 'YYYY-MM-DD');
}

/**
 * 'YYYY-MM' → 일요일부터 7칸 격자 — 앞 빈칸(null) + 'YYYY-MM-DD' 날짜들
 *
 * @param month 달
 */
export function buildMonthCells(month: string): Array<string | null> {
    const [year, monthNumber] = month.split('-').map(Number);
    const blanks = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
    const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    return [
        ...Array.from({length: blanks}, (): null => null),
        ...Array.from({length: dayCount}, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`),
    ];
}

/**
 * 달력 날 하나를 고를 수 있는지 — 지난 날 → 안 열린 날 → 팔지 않는 요일 순
 *
 * @param date 날짜
 * @param today 오늘(한국)
 * @param lastOpen 열리는 마지막 날
 * @param daysBits 상품 판매 요일 비트(일 1 · … · 토 64)
 */
export function dayState(date: string, today: string, lastOpen: string, daysBits: number): DayStateType {
    if (date < today) {
        return 'past';
    }

    if (date > lastOpen) {
        return 'not-open';
    }

    return (daysBits & (1 << weekdayOf(date))) === 0 ? 'closed' : 'open';
}

/**
 * 달 이동 — 오늘의 달보다 앞으로, 열리는 마지막 날의 달보다 뒤로는 못 감
 *
 * @param month 보이는 달
 * @param today 오늘
 * @param lastOpen 열리는 마지막 날
 */
export function monthNav(month: string, today: string, lastOpen: string): MonthNavType {
    return {prev: month > today.slice(0, 7), next: month < lastOpen.slice(0, 7)};
}

/**
 * 처음 고를 날 — 오늘이 열려 있으면 오늘, 아니면 열린 첫 날, 없으면 오늘
 *
 * @param today 오늘
 * @param lastOpen 열리는 마지막 날
 * @param daysBits 판매 요일 비트
 */
export function initialDate(today: string, lastOpen: string, daysBits: number): string {
    for (let date = today; date <= lastOpen; date = shiftDate(date, 1)) {
        if (dayState(date, today, lastOpen, daysBits) === 'open') {
            return date;
        }
    }

    return today;
}

/**
 * 'YYYY-MM' 달을 step 만큼 옮김
 *
 * @param month 달
 * @param step 옮길 달 수(앞 -1 · 뒤 1)
 */
export function shiftMonth(month: string, step: number): string {
    const [year, monthNumber] = month.split('-').map(Number);
    const moved = new Date(Date.UTC(year, monthNumber - 1 + step, 1));
    return `${moved.getUTCFullYear()}-${String(moved.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * 날짜의 요일(0 일 ~ 6 토)
 *
 * @param date 'YYYY-MM-DD'
 */
function weekdayOf(date: string): number {
    return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/**
 * 'YYYY-MM-DD' 를 days 만큼 옮김
 *
 * @param date 날짜
 * @param days 옮길 날 수
 */
function shiftDate(date: string, days: number): string {
    return new Date(Date.parse(`${date}T00:00:00Z`) + days * 24 * MS_PER_HOUR).toISOString().slice(0, 10);
}
