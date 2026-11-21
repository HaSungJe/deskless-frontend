// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { describeBookingPolicy, describePlan, formatHourRange, formatPeriodPrice, planPriceLabel, roomOptionLabels } from '@/app/(user)/stores/[store_id]/store-detail-format';
import { DiscoveryStorePlanResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';

/** 판매 상품 설정 — 빠진 칸은 null · 0 */
const PLAN_BASE: DiscoveryStorePlanResultDto = {
    room_plan_type_id: 'HOURLY',
    room_plan_type_name: '시간 이용',
    days_of_week: 127,
    usage_hours: null,
    check_in_time: null,
    check_out_time: null,
    min_nights: null,
    max_nights: null,
    is_extendable: 0,
    max_extensions: 1,
};

/** 예약 · 환불 규정 기본(시안) */
const POLICY_BASE = {booking_open_hours: 72, refund_deadline_minutes: 60, late_refund_percent: 50};

describe('formatHourRange', () => {
    it('[SUCCESS] 같은 날 닫으면 시각 그대로', () => {
        expect(formatHourRange({is_closed: 0, open_time: '09:00', close_time: '21:00'})).toBe('09:00 ~ 21:00');
    });

    it('[SUCCESS] 닫는 시각이 이르거나 같으면 다음 날', () => {
        expect(formatHourRange({is_closed: 0, open_time: '09:00', close_time: '01:00'})).toBe('09:00 ~ 다음 날 01:00');
        expect(formatHourRange({is_closed: 0, open_time: '00:00', close_time: '00:00'})).toBe('00:00 ~ 다음 날 00:00');
    });

    it('[FAIL:closed] 휴무 · 시각이 빠지면 휴무', () => {
        expect(formatHourRange({is_closed: 1, open_time: null, close_time: null})).toBe('휴무');
        expect(formatHourRange({is_closed: 0, open_time: null, close_time: '21:00'})).toBe('휴무');
    });
});

describe('describePlan', () => {
    it('[SUCCESS] 시간 이용 — 이용 시간 · 요일 · 연장', () => {
        expect(describePlan({...PLAN_BASE, usage_hours: 3, is_extendable: 1, max_extensions: 2})).toBe('이용 3시간 · 매일 · 연장 최대 2회');
        expect(describePlan({...PLAN_BASE, usage_hours: 2, days_of_week: 62})).toBe('이용 2시간 · 월 ~ 금 · 연장 안 됨');
    });

    it('[SUCCESS] 1박 — 퇴실은 다음 날, 매일이 아니면 입실 요일', () => {
        const night = {...PLAN_BASE, room_plan_type_id: 'NIGHT', room_plan_type_name: '1박'};

        expect(describePlan({...night, check_in_time: '20:00', check_out_time: '11:00', is_extendable: 1, max_extensions: 1})).toBe('입실 20:00 · 퇴실 다음 날 11:00 · 매일 · 연장 최대 1회');
        expect(describePlan({...night, check_in_time: '21:00', check_out_time: '10:00', days_of_week: 96})).toBe('입실 21:00 · 퇴실 다음 날 10:00 · 금 · 토 입실 · 연장 안 됨');
    });

    it('[SUCCESS] 연박 — 박수 범위(같으면 하나) · 퇴실에 다음 날 없음', () => {
        const long = {...PLAN_BASE, room_plan_type_id: 'LONG', room_plan_type_name: '연박'};

        expect(describePlan({...long, min_nights: 2, max_nights: 7, check_in_time: '20:00', check_out_time: '11:00', days_of_week: 31})).toBe('2박 ~ 7박 · 입실 20:00 · 퇴실 11:00 · 일 ~ 목 입실 · 연장 안 됨');
        expect(describePlan({...long, min_nights: 3, max_nights: 3, check_in_time: '15:00', check_out_time: '11:00', is_extendable: 1, max_extensions: 3})).toBe('3박 · 입실 15:00 · 퇴실 11:00 · 매일 · 연장 최대 3회');
    });
});

describe('describeBookingPolicy', () => {
    it('[SUCCESS] 예약 시작 · 환불 비율 · 시작 뒤 취소 불가(60분은 1시간)', () => {
        expect(describeBookingPolicy(POLICY_BASE)).toEqual([
            '이용 시작 72시간 전부터 예약할 수 있어요.',
            '이용 시작 1시간 전까지 취소하면 전액, 그 뒤 시작 전까지는 50% 환불해요.',
            '이용이 시작되면 취소할 수 없어요.',
        ]);
    });

    it('[SUCCESS] 60으로 나누어떨어지지 않으면 분', () => {
        expect(describeBookingPolicy({...POLICY_BASE, refund_deadline_minutes: 90, late_refund_percent: 30})[1]).toBe('이용 시작 90분 전까지 취소하면 전액, 그 뒤 시작 전까지는 30% 환불해요.');
    });

    it('[FAIL:no-late-refund] 마감 뒤 0% 면 환불 없음', () => {
        expect(describeBookingPolicy({...POLICY_BASE, refund_deadline_minutes: 1440, late_refund_percent: 0})[1]).toBe('이용 시작 24시간 전까지 취소하면 전액 환불해요. 그 뒤에는 환불되지 않아요.');
    });

    it('[SUCCESS] 마감 뒤 100% · 마감 0분이면 시작 전까지 전액', () => {
        expect(describeBookingPolicy({...POLICY_BASE, late_refund_percent: 100})[1]).toBe('이용 시작 전까지 취소하면 전액 환불해요.');
        expect(describeBookingPolicy({...POLICY_BASE, refund_deadline_minutes: 0})[1]).toBe('이용 시작 전까지 취소하면 전액 환불해요.');
    });
});

describe('planPriceLabel', () => {
    it('[SUCCESS] 연박만 1박당, 그 밖은 종류명 그대로', () => {
        expect(planPriceLabel({room_plan_type_id: 'HOURLY', room_plan_type_name: '시간 이용'})).toBe('시간 이용');
        expect(planPriceLabel({room_plan_type_id: 'NIGHT', room_plan_type_name: '1박'})).toBe('1박');
        expect(planPriceLabel({room_plan_type_id: 'LONG', room_plan_type_name: '연박'})).toBe('연박 1박당');
    });
});

describe('formatPeriodPrice', () => {
    it('[SUCCESS] 기간 · 상품 · 가격 · 메모', () => {
        expect(formatPeriodPrice({start_date: '2026-12-24', end_date: '2026-12-25', price: 79000, memo: '성탄 연휴'}, '1박')).toBe('12월 24일 ~ 12월 25일 1박 79,000원 (성탄 연휴)');
    });

    it('[SUCCESS] 하루짜리 기간은 날짜 하나', () => {
        expect(formatPeriodPrice({start_date: '2026-12-24', end_date: '2026-12-24', price: 25000, memo: '성탄 전야'}, '시간 이용')).toBe('12월 24일 시간 이용 25,000원 (성탄 전야)');
    });

    it('[FAIL:no-memo] 메모가 없거나 비면 괄호 없음', () => {
        expect(formatPeriodPrice({start_date: '2026-08-01', end_date: '2026-08-31', price: 65000, memo: null}, '연박 1박당')).toBe('8월 1일 ~ 8월 31일 연박 1박당 65,000원');
        expect(formatPeriodPrice({start_date: '2026-08-01', end_date: '2026-08-31', price: 65000, memo: ''}, '1박')).toBe('8월 1일 ~ 8월 31일 1박 65,000원');
    });

    it('[SUCCESS] 해를 넘어도 달 · 일만', () => {
        expect(formatPeriodPrice({start_date: '2026-12-31', end_date: '2027-01-02', price: 89000, memo: '새해'}, '1박')).toBe('12월 31일 ~ 1월 2일 1박 89,000원 (새해)');
    });
});

describe('roomOptionLabels', () => {
    it('[SUCCESS] 있는 것만 방 · 샤워 · TV · PC 순서로', () => {
        expect(roomOptionLabels({room_count: 1, has_shower: 1, has_tv: 1, has_pc: 0})).toEqual(['방 1개', '샤워실', 'TV']);
        expect(roomOptionLabels({room_count: 2, has_shower: 1, has_tv: 1, has_pc: 1})).toEqual(['방 2개', '샤워실', 'TV', 'PC']);
    });

    it('[FAIL:none] 없으면 칩을 만들지 않음', () => {
        expect(roomOptionLabels({room_count: 0, has_shower: 0, has_tv: 0, has_pc: 0})).toEqual([]);
    });
});
