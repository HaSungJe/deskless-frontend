// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { HourRowType, overnightLabel, policySummary, toHoursDto, toPeriodText } from '@/app/manager/(console)/store/store-settings-format';

/**
 * 일 ~ 토 7줄 — 모두 같은 시각 영업
 *
 * @param open 여는 시각
 * @param close 닫는 시각
 */
function weekRows(open: string, close: string): Array<HourRowType> {
    return [0, 1, 2, 3, 4, 5, 6].map((day) => ({day_of_week: day, is_closed: false, open_time: open, close_time: close}));
}

describe('toHoursDto — 영업시간 보낼 값', () => {
    it('[SUCCESS] 24시간이면 요일 목록을 비운다', () => {
        const dto = toHoursDto(true, weekRows('10:00', '23:00'));

        expect({...dto}).toEqual({is_always_open: 1, hours: []});
    });

    it('[SUCCESS] 요일별이면 일 ~ 토 7개를 차례로 보낸다', () => {
        const rows = weekRows('10:00', '23:00').reverse();

        const dto = toHoursDto(false, rows);

        expect(dto.is_always_open).toBe(0);
        expect(dto.hours.map((hour) => ({...hour}))).toEqual([0, 1, 2, 3, 4, 5, 6].map((day) => ({day_of_week: day, is_closed: 0, open_time: '10:00', close_time: '23:00'})));
    });

    it('[SUCCESS] 휴무 요일은 시각 없이 보낸다', () => {
        const rows = weekRows('10:00', '23:00').map((row) => (row.day_of_week === 1 ? {...row, is_closed: true} : row));

        const dto = toHoursDto(false, rows);

        expect({...dto.hours[1]}).toEqual({day_of_week: 1, is_closed: 1});
        expect({...dto.hours[2]}).toEqual({day_of_week: 2, is_closed: 0, open_time: '10:00', close_time: '23:00'});
    });
});

describe('overnightLabel — 다음 날 표시', () => {
    it('[SUCCESS] 닫는 시각이 이르면 다음 날까지', () => {
        expect(overnightLabel('10:00', '02:00')).toBe('다음 날 02:00까지');
    });

    it('[SUCCESS] 닫는 시각이 늦으면 표시하지 않는다', () => {
        expect(overnightLabel('10:00', '23:00')).toBe('');
    });

    it('[SUCCESS] 같은 시각이면 다음 날 같은 시각까지', () => {
        expect(overnightLabel('10:00', '10:00')).toBe('다음 날 10:00까지');
    });
});

describe('toPeriodText — 일시 예약불가 일시 글자', () => {
    it('[SUCCESS] 달력 칸 값을 날짜 시각 모양으로 바꾼다', () => {
        expect(toPeriodText('2026-11-20T09:00')).toBe('2026-11-20 09:00');
    });

    it('[FAIL:empty] 빈 값은 빈 글자', () => {
        expect(toPeriodText('')).toBe('');
    });
});

describe('policySummary — 규정 요약 문장', () => {
    it('[SUCCESS] 하루 단위 시간에는 일수를 덧붙인다', () => {
        expect(policySummary(720, 60, 50)).toBe('이용 시작 720시간(30일) 전부터 예약을 받고, 시작 60분 전까지 취소하면 전액, 그 뒤 시작 전까지 취소하면 50%를 환불합니다.');
    });

    it('[SUCCESS] 하루 단위가 아니면 시간만 쓴다', () => {
        expect(policySummary(36, 60, 50)).toBe('이용 시작 36시간 전부터 예약을 받고, 시작 60분 전까지 취소하면 전액, 그 뒤 시작 전까지 취소하면 50%를 환불합니다.');
    });

    it('[SUCCESS] 비율이 0 이면 환불 없이 취소된다고 쓴다', () => {
        expect(policySummary(720, 60, 0)).toBe('이용 시작 720시간(30일) 전부터 예약을 받고, 시작 60분 전까지 취소하면 전액, 그 뒤 시작 전까지 취소하면 환불 없이 취소됩니다.');
    });
});
