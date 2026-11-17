// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { slotLabel, toReservationDto } from '@/app/(user)/stores/[store_id]/booking/booking-flow';

describe('toReservationDto — 예약 요청에 담는 값', () => {
    it('[SUCCESS] 시간 이용은 고른 시간대의 시작을 한국 시각으로 보낸다', () => {
        const dto = toReservationDto({planType: 'HOURLY', date: '2026-11-10', nights: null, slot: {start_at: '2026-11-10T05:30:00.000Z', is_now: 0}, roomId: 'r1'});

        expect({...dto}).toEqual({room_id: 'r1', room_plan_type_id: 'HOURLY', date: '2026-11-10', start_time: '14:30'});
    });

    it('[SUCCESS] 지금 바로 칸을 고르면 시작 시각 대신 지금 바로를 보낸다', () => {
        const dto = toReservationDto({planType: 'HOURLY', date: '2026-11-10', nights: null, slot: {start_at: '2026-11-10T05:12:00.000Z', is_now: 1}, roomId: 'r1'});

        expect({...dto}).toEqual({room_id: 'r1', room_plan_type_id: 'HOURLY', date: '2026-11-10', is_now: 1});
        expect(dto.start_time).toBeUndefined();
    });

    it('[SUCCESS] 연박은 박수를 함께 보낸다', () => {
        const dto = toReservationDto({planType: 'LONG', date: '2026-11-10', nights: 3, slot: {start_at: '2026-11-10T11:00:00.000Z', is_now: 0}, roomId: 'r1'});

        expect({...dto}).toEqual({room_id: 'r1', room_plan_type_id: 'LONG', date: '2026-11-10', nights: 3});
    });
});

describe('slotLabel — 시간대 칩 글자', () => {
    it('[SUCCESS] 지금 바로 칸은 "지금 바로" 아래에 시작 ~ 끝을 쓴다', () => {
        expect(slotLabel({start_at: '2026-11-10T05:12:00.000Z', end_at: '2026-11-10T08:12:00.000Z', is_now: 1}, 'HOURLY')).toEqual({main: '지금 바로', sub: '14:12 ~ 17:12'});
    });

    it('[SUCCESS] 1박은 입실 시각과 다음 날 퇴실 날짜 · 시각을 쓴다', () => {
        expect(slotLabel({start_at: '2026-11-10T11:00:00.000Z', end_at: '2026-11-11T02:00:00.000Z', is_now: 0}, 'NIGHT')).toEqual({main: '20:00 입실', sub: '~ 11월 11일 11:00 퇴실'});
    });
});
