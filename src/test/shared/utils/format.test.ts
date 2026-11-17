// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatDays } from '@/shared/utils/format';

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
