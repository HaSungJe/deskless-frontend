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

/** 범위로 묶는 최소 날 수 — 이보다 짧게 이어지면 나열 */
const DAY_RANGE_MIN = 3;

/** 하루(ms) */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
 * 비트합 → 요일 표시 — 127 은 '매일', 3일 이상 이어지면 '일 ~ 목'(토 → 일로 주를 넘어도), 그 밖은 '월 · 수 · 금'
 * - 묶음은 시작 요일 순
 *
 * @param bits days_of_week 응답 값
 */
export function formatDays(bits: number): string {
    if (bits === EVERY_DAY_BITS) {
        return '매일';
    }

    // 이어진 묶음 — 일 → 토 순서로 자른다
    const runs: Array<Array<number>> = [];
    for (const day of bitsToDays(bits)) {
        const last = runs[runs.length - 1];
        if (last && last[last.length - 1] === day - 1) {
            last.push(day);
        } else {
            runs.push([day]);
        }
    }

    // 토 다음은 일 — 첫 묶음이 일로 시작하고 마지막 묶음이 토로 끝나면 이어 붙인다
    const lastRun = runs[runs.length - 1];
    if (runs.length > 1 && runs[0][0] === 0 && lastRun[lastRun.length - 1] === 6) {
        lastRun.push(...runs[0]);
        runs.shift();
    }

    return runs
        .sort((a, b) => a[0] - b[0])
        .map((run) => (run.length >= DAY_RANGE_MIN ? `${DAY_NAMES[run[0]]} ~ ${DAY_NAMES[run[run.length - 1]]}` : run.map((day) => DAY_NAMES[day]).join(' · ')))
        .join(' · ');
}

/**
 * 'YYYY-MM-DD' → 'M월 D일(요일)' — 날짜 문자열을 시간대 없이 그대로 읽는다
 *
 * @param date 날짜
 */
export function formatMonthDayWeek(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return `${month}월 ${day}일(${DAY_NAMES[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]})`;
}

/**
 * ISO 시각 → 'M월 D일(요일) HH:mm'(한국 시각), 읽을 수 없으면 ''
 *
 * @param iso ISO 시각
 */
export function formatDateTime(iso: string | null | undefined): string {
    const date = toKst(iso, 'YYYY-MM-DD');
    return date ? `${formatMonthDayWeek(date)} ${toKst(iso, 'HH:mm')}` : '';
}

/**
 * 이용 시작 ~ 끝 → '11월 10일(화) 14:30 ~ 17:30', 한국 날짜가 다르면 '11월 14일(토) 20:00 ~ 11월 15일(일) 11:00'
 *
 * @param startIso 시작(ISO)
 * @param endIso 끝(ISO)
 */
export function formatDateTimeRange(startIso: string | null | undefined, endIso: string | null | undefined): string {
    const startDate = toKst(startIso, 'YYYY-MM-DD');
    const endDate = toKst(endIso, 'YYYY-MM-DD');
    if (!startDate || !endDate) {
        return '';
    }

    return `${formatDateTime(startIso)} ~ ${startDate === endDate ? toKst(endIso, 'HH:mm') : formatDateTime(endIso)}`;
}

/**
 * 구간 시작 ~ 끝 → '14:30 ~ 17:30', 다음 날이면 '20:00 ~ 다음 날 11:00', 그 뒤면 '20:00 ~ 11월 13일 11:00'
 *
 * @param startIso 시작(ISO)
 * @param endIso 끝(ISO)
 */
export function formatTimeRange(startIso: string | null | undefined, endIso: string | null | undefined): string {
    const startDate = toKst(startIso, 'YYYY-MM-DD');
    const endDate = toKst(endIso, 'YYYY-MM-DD');
    if (!startDate || !endDate) {
        return '';
    }

    const endTime = toKst(endIso, 'HH:mm');
    const days = Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / MS_PER_DAY);
    const end = days === 0 ? endTime : days === 1 ? `다음 날 ${endTime}` : `${toKst(endIso, 'M월 D일')} ${endTime}`;
    return `${toKst(startIso, 'HH:mm')} ~ ${end}`;
}

/**
 * 전화번호 — 숫자만 있는 번호를 하이픈으로 나눈다(휴대폰 3-4-4 · 서울 02 · 지역 3자리 · 8자리 대표번호), 모양이 다르면 그대로
 *
 * @param value 숫자만 있는 번호(01012345678)
 */
export function formatPhone(value: string | null | undefined): string {
    const digits = value ?? '';
    if (!/^\d+$/.test(digits)) {
        return digits;
    }

    if (digits.length === 8) {
        return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }

    if (digits.startsWith('02') && (digits.length === 9 || digits.length === 10)) {
        return `02-${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
    }

    if (digits.length === 10 || digits.length === 11) {
        return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(-4)}`;
    }

    return digits;
}

/**
 * 사업자등록번호 — 10자리 숫자는 3-2-5, 모양이 다르면 그대로
 *
 * @param value 숫자 10자리(1234567890)
 */
export function formatBusinessNumber(value: string | null | undefined): string {
    const digits = value ?? '';
    return /^\d{10}$/.test(digits) ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}` : digits;
}

/**
 * 날짜 → 'YYYY년 M월 D일' — 'YYYY-MM-DD'(이미 한국 날짜)는 그대로 읽고, ISO 시각은 한국 시각으로, 읽을 수 없으면 ''
 *
 * @param value 'YYYY-MM-DD' 또는 ISO 시각
 */
export function formatKoreanDate(value: string | null | undefined): string {
    const ymd = /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? (value ?? '') : toKst(value, 'YYYY-MM-DD');
    if (!ymd) {
        return '';
    }

    const [year, month, day] = ymd.split('-').map(Number);
    return `${year}년 ${month}월 ${day}일`;
}

/** 만 원 */
const MANWON = 10000;

/**
 * 금액 "만" 글자 — 그래프 막대 값 · 눈금(342만). 만 아래 자리는 반올림, 1만 원 미만은 쉼표 숫자 그대로
 *
 * @param amount 원
 */
export function formatManwon(amount: number): string {
    if (Math.abs(amount) < MANWON) {
        return amount.toLocaleString('ko-KR');
    }

    return `${Math.round(amount / MANWON).toLocaleString('ko-KR')}만`;
}
