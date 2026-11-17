import { vi } from 'vitest';
import { ReservationDetailResultDto } from '@/contracts/reservation/dto/reservation-detail.dto';
import { AuthContextType } from '@/shared/providers/RootLayoutProvider';

/** 지금 — 11월 12일(목) 한국 16:00 */
export const NOW = '2026-11-12T07:00:00.000Z';

/** 예약 ID */
export const RESERVATION_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

/** 1시간(ms) */
export const HOUR = 60 * 60 * 1000;

/** 로그인한 이용자 */
export const USER_AUTH: AuthContextType = {area: 'user', token: 'user-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/**
 * 지금에서 ms 만큼 옮긴 ISO
 *
 * @param ms 옮길 시간(앞은 음수)
 */
export function fromNow(ms: number): string {
    return new Date(Date.parse(NOW) + ms).toISOString();
}

/**
 * 예약 상세 — 시간 이용 3시간 · 15,000원 · 결제 완료 구간 하나
 *
 * @param state 예약 상태
 * @param startAt 이용 시작
 * @param extra 바꿀 값
 */
export function reservationDetail(state: string, startAt: string, extra: Partial<ReservationDetailResultDto> = {}): ReservationDetailResultDto {
    const endAt = new Date(Date.parse(startAt) + 3 * HOUR).toISOString();
    return {
        reservation_id: RESERVATION_ID,
        store_id: 'b'.repeat(32),
        store_name: '스테이 리프 강남역점',
        room_id: 'c'.repeat(32),
        room_name: '301호',
        room_group_name: '스탠다드 더블',
        room_plan_type_id: 'HOURLY',
        room_plan_type_name: '시간 이용',
        reservation_state_id: state,
        reservation_state_name: state,
        start_at: startAt,
        end_at: endAt,
        total_price: 15000,
        refund_deadline_at: new Date(Date.parse(startAt) - HOUR).toISOString(),
        is_room_disabled: 0,
        late_refund_percent: 30,
        canceled_at: null,
        cancel_actor: null,
        cancel_reason: null,
        created_at: fromNow(-24 * HOUR),
        segments: [{
            reservation_detail_id: 'd'.repeat(32),
            reservation_detail_type_id: 'BASE',
            reservation_detail_type_name: '기본',
            reservation_state_id: state,
            start_at: startAt,
            end_at: endAt,
            price: 15000,
            expires_at: null,
            payment: {payment_id: 'e'.repeat(32), payment_state_id: 'DONE', payment_state_name: '결제 완료', amount: 15000, method: '카드', approved_at: fromNow(-24 * HOUR), receipt_url: null, refund_amount: null, refunded_at: null},
        }],
        ...extra,
    };
}
