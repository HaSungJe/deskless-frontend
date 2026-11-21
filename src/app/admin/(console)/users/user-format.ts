import { toKst } from '@/shared/utils/format';

/** 시각 글자 모양 — 연-월-일 시:분(한국 시각) */
const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm';

/** 'YYYY-MM-DD HH:mm' 에서 연도 끝 자리 */
const YEAR_END = 4;

/** 'YYYY-MM-DD HH:mm' 에서 날짜 끝 자리 */
const DATE_END = 10;

/** 'YYYY-MM-DD HH:mm' 에서 월 시작 자리 */
const MONTH_START = 5;

/** 'YYYY-MM-DD HH:mm' 에서 시각 시작 자리 */
const TIME_START = 11;

/**
 * 이용 기간 글자 — 시작은 연월일 · 시각을 모두, 끝은 시작과 달라진 부분부터(같은 날 시각만 · 다른 날 월일부터 · 해가 바뀌면 연도부터)
 *
 * @param startIso 이용 시작(ISO 8601)
 * @param endIso 이용 끝(ISO 8601)
 */
export function usagePeriodText(startIso: string, endIso: string): string {
    const start = toKst(startIso, DATE_TIME_FORMAT);
    const end = toKst(endIso, DATE_TIME_FORMAT);
    if (start.slice(0, YEAR_END) !== end.slice(0, YEAR_END)) {
        return `${start} ~ ${end}`;
    }

    if (start.slice(0, DATE_END) !== end.slice(0, DATE_END)) {
        return `${start} ~ ${end.slice(MONTH_START)}`;
    }

    return `${start} ~ ${end.slice(TIME_START)}`;
}
