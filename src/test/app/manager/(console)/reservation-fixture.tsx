import { ReservationStoreItemResultDto, ReservationStoreResultDto } from '@/contracts/reservation/dto/reservation-store.dto';

/** 예약 ID — 202호 이용 중 · 401호 확정 */
export const RESERVATION_202 = '2'.repeat(32);
export const RESERVATION_401 = '4'.repeat(32);

/** 호실 ID */
export const ROOM_202 = 'a'.repeat(32);
export const ROOM_303 = 'b'.repeat(32);
export const ROOM_401 = 'c'.repeat(32);
export const ROOM_402 = 'd'.repeat(32);

/**
 * 한국 시각 → ISO(UTC)
 *
 * @param kst 'YYYY-MM-DD HH:mm'(한국)
 */
export function iso(kst: string): string {
    return new Date(`${kst.replace(' ', 'T')}:00+09:00`).toISOString();
}

/**
 * 예약 하나
 *
 * @param extra 바꿀 값
 */
function reservation(extra: Partial<ReservationStoreItemResultDto>): ReservationStoreItemResultDto {
    return {
        reservation_id: RESERVATION_401,
        reservation_state_id: 'CONFIRMED',
        reservation_state_name: '예약 확정',
        room_plan_type_id: 'HOURLY',
        room_plan_type_name: '시간 이용',
        start_at: iso('2026-11-10 17:00'),
        end_at: iso('2026-11-10 20:00'),
        blocked_until: iso('2026-11-10 20:30'),
        total_price: 18000,
        user_name: '최유나',
        user_phone: '01023456789',
        cancel_request_state_id: null,
        cancel_request_created_at: null,
        ...extra,
    };
}

/**
 * 11-10 현황 — 202호 이용 중(휴대폰 · 지난 요청 거절, 스탠다드 더블) / 303호 예약 없음 · 401호 확정 17:00 · 402호 사용중지(프리미엄 PC)
 */
export function storeBoard(): ReservationStoreResultDto {
    return {
        date: '2026-11-10',
        list: [
            {room_id: ROOM_202, room_name: '202호', floor: 2, room_group_id: 'e'.repeat(32), room_group_name: '스탠다드 더블', room_state_id: 'IN_USE', room_state_name: '사용중', reservations: [
                reservation({reservation_id: RESERVATION_202, reservation_state_id: 'CHECKED_IN', reservation_state_name: '이용 중', start_at: iso('2026-11-10 13:00'), end_at: iso('2026-11-10 16:00'), blocked_until: iso('2026-11-10 16:30'), user_name: '박지우', user_phone: '01034567890', cancel_request_state_id: 'REJECTED', cancel_request_created_at: iso('2026-11-10 14:00')}),
            ]},
            {room_id: ROOM_303, room_name: '303호', floor: 3, room_group_id: 'f'.repeat(32), room_group_name: '프리미엄 PC', room_state_id: 'AVAILABLE', room_state_name: '예약가능', reservations: []},
            {room_id: ROOM_401, room_name: '401호', floor: 4, room_group_id: 'f'.repeat(32), room_group_name: '프리미엄 PC', room_state_id: 'RESERVED', room_state_name: '예약완료', reservations: [reservation({})]},
            {room_id: ROOM_402, room_name: '402호', floor: 4, room_group_id: 'f'.repeat(32), room_group_name: '프리미엄 PC', room_state_id: 'DISABLED', room_state_name: '사용중지', reservations: []},
        ],
    };
}
