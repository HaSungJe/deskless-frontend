// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { barGeometry, barLabel, reservationActions, roomChangeOptions } from '@/app/manager/(console)/reservations/reservation-board-format';
import { ReservationStoreItemResultDto, ReservationStoreRoomResultDto } from '@/contracts/reservation/dto/reservation-store.dto';

/** 고른 날짜(한국) */
const DATE = '2026-11-10';

/**
 * 한국 시각 → ISO(UTC)
 *
 * @param kst 'YYYY-MM-DD HH:mm'(한국)
 */
function iso(kst: string): string {
    return new Date(`${kst.replace(' ', 'T')}:00+09:00`).toISOString();
}

/**
 * 예약 — 바꿀 값만
 *
 * @param extra 바꿀 값
 */
function reservation(extra: Partial<ReservationStoreItemResultDto>): ReservationStoreItemResultDto {
    return {
        reservation_id: 'r'.repeat(32),
        reservation_state_id: 'CONFIRMED',
        reservation_state_name: '예약 확정',
        room_plan_type_id: 'HOURLY',
        room_plan_type_name: '시간 이용',
        start_at: iso('2026-11-10 10:00'),
        end_at: iso('2026-11-10 13:00'),
        blocked_until: iso('2026-11-10 13:30'),
        total_price: 18000,
        user_name: '최유나',
        user_phone: '01023456789',
        cancel_request_state_id: null,
        cancel_request_created_at: null,
        ...extra,
    };
}

/**
 * 호실
 *
 * @param room_id 호실 ID
 * @param room_name 호실명
 * @param room_group_id 그룹 ID
 * @param room_state_id 상태
 */
function room(room_id: string, room_name: string, room_group_id: string, room_state_id: string = 'AVAILABLE'): ReservationStoreRoomResultDto {
    return {room_id, room_name, floor: Number(room_name.slice(0, 1)), room_group_id, room_group_name: room_group_id === 'g2' ? '프리미엄 PC' : '스탠다드 더블', room_state_id, room_state_name: room_state_id === 'DISABLED' ? '사용중지' : '예약가능', reservations: []};
}

describe('barGeometry — 막대 위치와 길이', () => {
    it('[SUCCESS] 하루 안의 예약은 시각대로 놓고 정비 꼬리를 붙인다', () => {
        const geometry = barGeometry(reservation({}), DATE);

        expect(geometry.left).toBeCloseTo(41.667, 2);
        expect(geometry.width).toBeCloseTo(12.5, 2);
        expect(geometry.cutLeft).toBe(false);
        expect(geometry.cutRight).toBe(false);
        expect(geometry.tailLeft).toBeCloseTo(54.167, 2);
        expect(geometry.tailWidth).toBeCloseTo(2.083, 2);
    });

    it('[SUCCESS] 전날 시작한 예약은 0시부터로 자르고 왼쪽 잘림', () => {
        const geometry = barGeometry(reservation({start_at: iso('2026-11-09 21:00'), end_at: iso('2026-11-10 11:00'), blocked_until: iso('2026-11-10 11:30')}), DATE);

        expect(geometry.left).toBe(0);
        expect(geometry.width).toBeCloseTo(45.833, 2);
        expect(geometry.cutLeft).toBe(true);
        expect(geometry.cutRight).toBe(false);
    });

    it('[SUCCESS] 다음 날 끝나는 예약은 24시까지로 자르고 오른쪽 잘림', () => {
        const geometry = barGeometry(reservation({start_at: iso('2026-11-10 21:00'), end_at: iso('2026-11-11 11:00'), blocked_until: iso('2026-11-11 11:30')}), DATE);

        expect(geometry.left).toBeCloseTo(87.5, 2);
        expect(geometry.width).toBeCloseTo(12.5, 2);
        expect(geometry.cutRight).toBe(true);
        expect(geometry.tailWidth).toBe(0);
    });

    it('[SUCCESS] 정비 꼬리가 자정을 넘으면 24시까지만', () => {
        const geometry = barGeometry(reservation({start_at: iso('2026-11-10 22:00'), end_at: iso('2026-11-10 23:45'), blocked_until: iso('2026-11-11 00:15')}), DATE);

        expect(geometry.tailLeft).toBeCloseTo(98.958, 2);
        expect(geometry.tailWidth).toBeCloseTo(1.042, 2);
    });
});

describe('barLabel — 막대 시간 글자', () => {
    it('[SUCCESS] 하루 안이면 시작~끝 시각', () => {
        expect(barLabel(reservation({}), DATE)).toBe('10:00~13:00');
    });

    it('[SUCCESS] 전날 시작이면 ‹ 와 시작 날짜', () => {
        expect(barLabel(reservation({start_at: iso('2026-11-09 21:00'), end_at: iso('2026-11-10 11:00')}), DATE)).toBe('‹ 11-09 21:00 ~ 11:00');
    });

    it('[SUCCESS] 다음 날 끝이면 다음 날과 ›', () => {
        expect(barLabel(reservation({start_at: iso('2026-11-10 21:00'), end_at: iso('2026-11-11 11:00')}), DATE)).toBe('21:00 ~ 다음 날 11:00 ›');
    });
});

describe('reservationActions — 작업 버튼 켜짐', () => {
    /** 판단 시각 — 11-10 14:30(한국) */
    const NOW = Date.parse(iso('2026-11-10 14:30'));

    it('[SUCCESS] 시작 전 확정 예약은 업체 취소 · 호실 이동', () => {
        const actions = reservationActions(reservation({start_at: iso('2026-11-10 15:30'), end_at: iso('2026-11-10 18:30')}), NOW);

        expect(actions).toEqual({storeCancel: true, roomChange: true, useCancelRequest: false});
    });

    it('[SUCCESS] 이용 중 예약은 취소 요청만', () => {
        const actions = reservationActions(reservation({reservation_state_id: 'CHECKED_IN', start_at: iso('2026-11-10 13:00'), end_at: iso('2026-11-10 16:00')}), NOW);

        expect(actions).toEqual({storeCancel: false, roomChange: false, useCancelRequest: true});
    });

    it('[FAIL:휴대폰 없음] 예약자 휴대폰이 없으면 취소 요청을 못 한다', () => {
        const actions = reservationActions(reservation({reservation_state_id: 'CHECKED_IN', start_at: iso('2026-11-10 13:00'), user_phone: null}), NOW);

        expect(actions).toEqual({storeCancel: false, roomChange: false, useCancelRequest: false});
    });

    it('[FAIL:요청 중] 이미 요청 중이면 다시 요청하지 않는다', () => {
        const actions = reservationActions(reservation({reservation_state_id: 'CHECKED_IN', start_at: iso('2026-11-10 13:00'), cancel_request_state_id: 'REQUESTED'}), NOW);

        expect(actions).toEqual({storeCancel: false, roomChange: false, useCancelRequest: false});
    });
});

describe('roomChangeOptions — 옮길 호실 목록', () => {
    /** 현황 호실 — 202호만 다른 그룹, 402호 사용중지, 지금 401호 */
    const ROOMS = [room('a202', '202호', 'g1'), room('a303', '303호', 'g2'), room('a401', '401호', 'g2'), room('a402', '402호', 'g2', 'DISABLED')];
    const CURRENT = ROOMS[2];

    it('[SUCCESS] 같은 그룹 호실만 고른다', () => {
        expect(roomChangeOptions(ROOMS, CURRENT).map((option) => option.room_id)).not.toContain('a202');
    });

    it('[SUCCESS] 지금 호실은 뺀다', () => {
        expect(roomChangeOptions(ROOMS, CURRENT).map((option) => option.room_name)).toEqual(['303호', '402호']);
    });

    it('[FAIL:사용중지] 사용중지 호실은 고를 수 없다', () => {
        const options = roomChangeOptions(ROOMS, CURRENT);

        expect(options.find((option) => option.room_name === '402호')?.disabled).toBe(true);
        expect(options.find((option) => option.room_name === '303호')?.disabled).toBe(false);
    });
});
