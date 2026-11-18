// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatBusinessNumber, formatDateTimeRange, formatDays, formatPhone, formatTimeRange } from '@/shared/utils/format';

describe('formatDays', () => {
    it('[SUCCESS] 모든 요일은 매일, 요일이 없으면 빈 글자', () => {
        expect(formatDays(127)).toBe('매일');
        expect(formatDays(0)).toBe('');
    });

    it('[SUCCESS] 이어지지 않거나 이틀만 이어진 요일은 나열', () => {
        expect(formatDays(42)).toBe('월 · 수 · 금');
        expect(formatDays(6)).toBe('월 · 화');
    });

    it('[SUCCESS] 3일 이상 이어지면 범위', () => {
        expect(formatDays(31)).toBe('일 ~ 목');
        expect(formatDays(62)).toBe('월 ~ 금');
    });

    it('[SUCCESS] 토 다음은 일 — 주를 넘어 이어지면 시작 요일부터', () => {
        expect(formatDays(97)).toBe('금 ~ 일');
        expect(formatDays(65)).toBe('토 · 일');
        expect(formatDays(125)).toBe('화 ~ 일');
    });

    it('[SUCCESS] 따로 떨어진 하루와 이어진 사흘이 섞이면 시작 요일 순', () => {
        expect(formatDays(29)).toBe('일 · 화 ~ 목');
    });
});

describe('formatDateTimeRange — 이용 시간 글자', () => {
    it('[SUCCESS] 한국 날짜가 같으면 끝은 시각만 쓴다(UTC 로는 전날이어도)', () => {
        expect(formatDateTimeRange('2026-11-10T15:30:00.000Z', '2026-11-10T18:30:00.000Z')).toBe('11월 11일(수) 00:30 ~ 03:30');
    });

    it('[SUCCESS] 1박처럼 날이 바뀌면 끝에도 날짜와 요일을 쓴다', () => {
        expect(formatDateTimeRange('2026-11-14T11:00:00.000Z', '2026-11-15T02:00:00.000Z')).toBe('11월 14일(토) 20:00 ~ 11월 15일(일) 11:00');
    });
});

describe('formatTimeRange — 구간 시간 글자', () => {
    it('[SUCCESS] 끝이 다음 날이면 "다음 날"을 붙인다', () => {
        expect(formatTimeRange('2026-11-09T11:00:00.000Z', '2026-11-10T02:00:00.000Z')).toBe('20:00 ~ 다음 날 11:00');
    });

    it('[SUCCESS] 이틀 넘게 뒤면 끝에 날짜를 쓴다', () => {
        expect(formatTimeRange('2026-11-10T11:00:00.000Z', '2026-11-13T02:00:00.000Z')).toBe('20:00 ~ 11월 13일 11:00');
    });
});

describe('formatPhone — 전화번호 글자', () => {
    it('[SUCCESS] 휴대폰 11자리는 3 · 4 · 4로 나눈다', () => {
        expect(formatPhone('01012345678')).toBe('010-1234-5678');
    });

    it('[SUCCESS] 서울 02 번호는 앞 두 자리를 지역번호로 둔다', () => {
        expect(formatPhone('0212345678')).toBe('02-1234-5678');
    });

    it('[SUCCESS] 지역번호 3자리 10자리 번호는 3 · 3 · 4로 나눈다', () => {
        expect(formatPhone('0311234567')).toBe('031-123-4567');
    });

    it('[SUCCESS] 8자리 대표번호는 4 · 4로 나눈다', () => {
        expect(formatPhone('15771234')).toBe('1577-1234');
    });
});

describe('formatBusinessNumber — 사업자등록번호 글자', () => {
    it('[SUCCESS] 10자리 숫자는 3 · 2 · 5로 나눈다', () => {
        expect(formatBusinessNumber('1234567890')).toBe('123-45-67890');
    });

    it('[FAIL:shape] 10자리가 아니면 받은 그대로 보여 준다', () => {
        expect(formatBusinessNumber('12345')).toBe('12345');
    });
});
