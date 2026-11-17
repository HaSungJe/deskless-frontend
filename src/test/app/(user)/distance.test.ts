// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatDistance } from '@/app/(user)/distance';

describe('formatDistance', () => {
    it('[SUCCESS] 1km 아래는 m 정수', () => {
        expect(formatDistance(420)).toBe('420m');
        expect(formatDistance(0)).toBe('0m');
        expect(formatDistance(999)).toBe('999m');
    });

    it('[SUCCESS] 1km 부터는 km 소수 한 자리 — 딱 떨어져도 .0', () => {
        expect(formatDistance(1000)).toBe('1.0km');
        expect(formatDistance(11300)).toBe('11.3km');
        expect(formatDistance(12000)).toBe('12.0km');
    });

    it('[SUCCESS] 100m 단위 반올림 — 내림 · 올림 · 자리 올라감', () => {
        expect(formatDistance(1049)).toBe('1.0km');
        expect(formatDistance(1050)).toBe('1.1km');
        expect(formatDistance(49960)).toBe('50.0km');
    });
});
