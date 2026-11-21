// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { usagePeriodText } from '@/app/admin/(console)/users/user-format';

describe('usagePeriodText — 예약 이력의 이용 기간 글자', () => {
    it('[SUCCESS] 같은 날 끝나면 끝은 시각만 쓴다', () => {
        // 한국 시각 11월 14일 15:00 ~ 18:00
        expect(usagePeriodText('2026-11-14T06:00:00.000Z', '2026-11-14T09:00:00.000Z')).toBe('2026-11-14 15:00 ~ 18:00');
    });

    it('[SUCCESS] 다른 날 끝나면 끝에 월일을 붙인다', () => {
        // 한국 시각 11월 9일 15:00 ~ 11월 11일 11:00
        expect(usagePeriodText('2026-11-09T06:00:00.000Z', '2026-11-11T02:00:00.000Z')).toBe('2026-11-09 15:00 ~ 11-11 11:00');
    });

    it('[SUCCESS] 해가 바뀌면 끝에도 연도를 쓴다', () => {
        // 한국 시각 2026년 12월 31일 22:00 ~ 2027년 1월 1일 10:00
        expect(usagePeriodText('2026-12-31T13:00:00.000Z', '2027-01-01T01:00:00.000Z')).toBe('2026-12-31 22:00 ~ 2027-01-01 10:00');
    });
});
