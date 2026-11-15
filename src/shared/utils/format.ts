import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

/** 화면에 보이는 시간대 — 서버 렌더링(Docker UTC)에서도 한국 시각으로 */
export const DISPLAY_TIMEZONE = 'Asia/Seoul';

/** 요일 이름 — 0 일 ~ 6 토 (day_of_week) */
export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 매일 — days_of_week 비트합 */
export const EVERY_DAY_BITS = 127;

/**
 * ISO 시각 → 한국 시각 문자열
 * - Z · 오프셋이 붙은 시각(…T09:30:00.000Z)만 넘긴다. 날짜 'YYYY-MM-DD' · 달 'YYYY-MM' · 'HH:mm' 은 이미 한국 기준이라 그대로 보여 준다
 *   (오프셋 없는 문자열은 dayjs 가 실행 환경 시간대로 읽어 서버(UTC)와 브라우저 결과가 달라진다)
 *
 * @param iso 서버 시각 (2026-11-10T09:30:00.000Z)
 * @param format dayjs 형식 (기본 'YYYY-MM-DD HH:mm')
 * @returns 한국 시각 문자열, 빈 값 · 읽을 수 없는 값은 ''
 */
export function toKst(iso: string | null | undefined, format: string = 'YYYY-MM-DD HH:mm'): string {
    if (!iso) {
        return '';
    }

    const time = dayjs(iso);
    return time.isValid() ? time.tz(DISPLAY_TIMEZONE).format(format) : '';
}

/**
 * 오늘 날짜(한국) — 날짜 입력 · 조회 조건의 기본값
 *
 * @returns 'YYYY-MM-DD'
 */
export function todayKst(): string {
    return dayjs().tz(DISPLAY_TIMEZONE).format('YYYY-MM-DD');
}

/**
 * 금액 — 원 단위 정수에 쉼표와 '원'
 *
 * @param amount 금액 (12000)
 * @returns '12,000원', 빈 값은 ''
 */
export function formatPrice(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
        return '';
    }

    return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 요일 목록 → 비트합 (days_of_week 요청 값)
 *
 * @param days 요일 (0 일 ~ 6 토)
 */
export function daysToBits(days: Array<number>): number {
    return days.reduce((bits, day) => bits | (1 << day), 0);
}

/**
 * 비트합 → 요일 목록 (일 → 토 순서)
 *
 * @param bits days_of_week 응답 값
 */
export function bitsToDays(bits: number): Array<number> {
    return DAY_NAMES.map((_, day) => day).filter((day) => (bits & (1 << day)) !== 0);
}

/**
 * 비트합 → 요일 표시 — 127 은 '매일', 그 밖은 '월 · 수 · 금'
 *
 * @param bits days_of_week 응답 값
 */
export function formatDays(bits: number): string {
    if (bits === EVERY_DAY_BITS) {
        return '매일';
    }

    return bitsToDays(bits).map((day) => DAY_NAMES[day]).join(' · ');
}
