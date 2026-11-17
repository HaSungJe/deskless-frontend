// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { canAnswerCancelRequest, cancelResultMessage, extensionLengthLabel, refundGuide, reservationActions, screenSchedule } from '@/app/(user)/reservation/[reservation_id]/reservation-rules';

/** 지금 — 11월 12일(목) 한국 16:00 */
const NOW = '2026-11-12T07:00:00.000Z';

/** 1분 · 1시간(ms) */
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * 지금에서 ms 만큼 옮긴 ISO
 *
 * @param ms 옮길 시간(앞은 음수)
 */
function fromNow(ms: number): string {
    return new Date(Date.parse(NOW) + ms).toISOString();
}

/**
 * 버튼 계산용 예약 — 구간은 상태와 같은 구간 하나
 *
 * @param state 예약 상태
 * @param startAt 이용 시작
 * @param extra 바꿀 값
 */
function actionsDetail(state: string, startAt: string, extra: Partial<{is_room_disabled: number; expires_at: string | null}> = {}) {
    return {
        reservation_state_id: state,
        start_at: startAt,
        is_room_disabled: extra.is_room_disabled ?? 0,
        segments: [{reservation_state_id: state, expires_at: extra.expires_at ?? null}],
    };
}

/** 환불 안내용 예약 — 이용 시작 19:00 · 환불 마감 17:00 · 마감 뒤 30% · 합계 15,000원 */
const REFUND_BASE = {
    start_at: '2026-11-12T10:00:00.000Z',
    refund_deadline_at: '2026-11-12T08:00:00.000Z',
    late_refund_percent: 30,
    total_price: 15000,
    is_room_disabled: 0,
};

describe('reservationActions — 예약 화면의 버튼과 QR', () => {
    it('[SUCCESS] 결제 대기이고 결제 마감 전이면 취소와 결제하기가 보인다', () => {
        expect(reservationActions(actionsDetail('PENDING', fromNow(3 * HOUR), {expires_at: fromNow(10 * MINUTE)}), NOW)).toMatchObject({cancel: true, pay: true, qr: 'none'});
    });

    it('[SUCCESS] 확정 예약이 2시간 뒤 시작하면 취소할 수 있고 QR 은 잠겨 있다', () => {
        expect(reservationActions(actionsDetail('CONFIRMED', fromNow(2 * HOUR)), NOW)).toMatchObject({cancel: true, qr: 'locked', startsSoon: false});
    });

    it('[SUCCESS] 시작까지 1시간이 안 남으면 남은 시간을 보여 준다', () => {
        expect(reservationActions(actionsDetail('CONFIRMED', fromNow(30 * MINUTE)), NOW).startsSoon).toBe(true);
    });

    it('[FAIL:started] 시작 시각이 지나면 아직 확정 상태여도 취소할 수 없다', () => {
        expect(reservationActions(actionsDetail('CONFIRMED', fromNow(-MINUTE)), NOW).cancel).toBe(false);
    });

    it('[SUCCESS] 이용 중이면 QR 이 열리고 연장할 수 있지만 취소는 안 된다', () => {
        expect(reservationActions(actionsDetail('CHECKED_IN', fromNow(-HOUR)), NOW)).toMatchObject({cancel: false, qr: 'open', extend: true});
    });

    it('[SUCCESS] 예약한 호실이 사용중지되면 이용 중에도 취소할 수 있다', () => {
        expect(reservationActions(actionsDetail('CHECKED_IN', fromNow(-HOUR), {is_room_disabled: 1}), NOW).cancel).toBe(true);
    });
});

describe('refundGuide — 취소하면 돌려받는 금액 안내', () => {
    it('[SUCCESS] 결제 전에는 세 줄을 보여 주고, 마감 전 줄이 지금이며 금액은 붙지 않는다', () => {
        const guide = refundGuide({...REFUND_BASE, reservation_state_id: 'PENDING'}, NOW);

        expect(guide?.rows).toHaveLength(3);
        expect(guide?.rows).toMatchObject([
            {label: '11월 12일(목) 17:00 전 취소', value: '전액 환불', current: true, danger: false},
            {label: '11월 12일(목) 17:00 ~ 19:00 취소', value: '30% 환불', current: false, danger: false},
            {label: '11월 12일(목) 19:00 이용 시작 뒤', value: '취소할 수 없음', current: false, danger: true},
        ]);
    });

    it('[SUCCESS] 확정 예약을 마감과 시작 사이에 보면 비율 줄이 지금이고 받을 금액이 붙는다', () => {
        const guide = refundGuide({...REFUND_BASE, reservation_state_id: 'CONFIRMED'}, '2026-11-12T09:00:00.000Z');

        expect(guide?.rows[0]).toMatchObject({value: '전액 환불', current: false});
        expect(guide?.rows[1]).toMatchObject({value: '30% 환불 · 4,500원', current: true});
    });

    it('[SUCCESS] 마감 뒤에도 전액 환불이면 시작 전 · 시작 뒤 두 줄만 보여 준다', () => {
        const guide = refundGuide({...REFUND_BASE, reservation_state_id: 'CONFIRMED', late_refund_percent: 100}, NOW);

        expect(guide?.rows).toHaveLength(2);
        expect(guide?.rows).toMatchObject([
            {label: '11월 12일(목) 19:00 이용 시작 전 취소', value: '전액 환불 · 15,000원', current: true},
            {label: '11월 12일(목) 19:00 이용 시작 뒤', value: '취소할 수 없음', current: false, danger: true},
        ]);
    });

    it('[FAIL:checked-in] 이용 중에는 줄 없이 취소할 수 없다는 문구만 보여 준다', () => {
        const guide = refundGuide({...REFUND_BASE, reservation_state_id: 'CHECKED_IN'}, '2026-11-12T11:00:00.000Z');

        expect(guide?.rows).toEqual([]);
        expect(guide?.message).toBe('이용이 시작되어 취소할 수 없어요.');
    });
});

describe('cancelResultMessage — 취소 뒤 안내 문구', () => {
    it('[SUCCESS] 결제 전에 취소하면 취소됐다고만 알린다', () => {
        expect(cancelResultMessage(null)).toBe('예약을 취소했어요.');
    });

    it('[SUCCESS] 돌려받을 돈이 0원이면 환불이 없다고 알린다', () => {
        expect(cancelResultMessage(0)).toBe('예약을 취소했어요. 환불할 금액은 없어요.');
    });

    it('[SUCCESS] 돌려받을 돈이 있으면 금액을 알린다', () => {
        expect(cancelResultMessage(9000)).toBe('예약을 취소했어요. 9,000원을 환불해 드려요.');
    });
});

describe('canAnswerCancelRequest — 취소 요청에 답할 수 있는지', () => {
    it('[SUCCESS] 요청 중이고 만료 5분 전이면 답할 수 있다', () => {
        expect(canAnswerCancelRequest({reservation_cancel_request_state_id: 'REQUESTED', expires_at: fromNow(5 * MINUTE)}, NOW)).toBe(true);
    });

    it('[FAIL:expired] 만료 시각이 되면 요청 중이어도 답할 수 없다', () => {
        expect(canAnswerCancelRequest({reservation_cancel_request_state_id: 'REQUESTED', expires_at: NOW}, NOW)).toBe(false);
    });
});

describe('extensionLengthLabel — 연장 길이 글자', () => {
    it('[SUCCESS] 하루를 연장하면 "1일 더"로 쓴다', () => {
        expect(extensionLengthLabel('2026-11-13T02:00:00.000Z', '2026-11-14T02:00:00.000Z')).toBe('1일 더');
    });

    it('[SUCCESS] 1시간 30분이면 시간과 분을 함께 쓴다', () => {
        expect(extensionLengthLabel('2026-11-10T05:30:00.000Z', '2026-11-10T07:00:00.000Z')).toBe('1시간 30분 더');
    });
});

describe('screenSchedule — 화면을 다시 맞출 시각(리뷰 P8-2 · P8-3)', () => {
    /**
     * 시간 이용 3시간 예약 — 환불 마감은 시작 2시간 전
     *
     * @param state 예약 상태
     * @param start 이용 시작(ms)
     */
    function scheduleDetail(state: string, start: number) {
        return {reservation_state_id: state, start_at: new Date(start).toISOString(), end_at: new Date(start + 3 * HOUR).toISOString(), refund_deadline_at: new Date(start - 2 * HOUR).toISOString()};
    }

    it('[SUCCESS] 확정 예약을 마감 전에 열면 환불 마감 · 시작 1시간 전에 기준 시각을 새로 하고, 시작 · 끝에 상세를 다시 부른다', () => {
        const start = Date.parse(NOW) + 3 * HOUR;

        expect(screenSchedule(scheduleDetail('CONFIRMED', start), Date.parse(NOW))).toEqual({refreshAt: [start - 2 * HOUR, start - HOUR], reloadAt: [start, start + 3 * HOUR]});
    });

    it('[SUCCESS] 이용 중이면 끝에만 상세를 다시 부른다', () => {
        const start = Date.parse(NOW) - HOUR;

        expect(screenSchedule(scheduleDetail('CHECKED_IN', start), Date.parse(NOW))).toEqual({refreshAt: [], reloadAt: [start + 3 * HOUR]});
    });

    it('[FAIL:late-state] 시작이 지났는데 아직 확정이면 10초 뒤 다시 부르고, 5분이 지나면 그만둔다', () => {
        const start = Date.parse(NOW) - MINUTE;

        expect(screenSchedule(scheduleDetail('CONFIRMED', start), Date.parse(NOW)).reloadAt).toEqual([Date.parse(NOW) + 10 * 1000, start + 3 * HOUR]);
        expect(screenSchedule(scheduleDetail('CONFIRMED', start), start + 6 * MINUTE).reloadAt).toEqual([start + 3 * HOUR]);
    });
});
