import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ReservationDetailContent from '@/app/(user)/reservation/[reservation_id]/ReservationDetailContent';
import RootLayoutProvider from '@/shared/providers/RootLayoutProvider';
import { fromNow, HOUR, NOW, RESERVATION_ID, reservationDetail, USER_AUTH } from '../reservation-fixtures';

const {getReservation, getReservationQr, cancelReservation, replace, showErrorPopup} = vi.hoisted(() => ({
    getReservation: vi.fn(),
    getReservationQr: vi.fn(),
    cancelReservation: vi.fn(),
    replace: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/reservation/api', () => ({getReservation, getReservationQr, cancelReservation}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));
vi.mock('@/shared/components/payment/TossPaymentWidget', () => ({default: () => <div data-testid="toss-widget" />}));

/**
 * 예약 1건을 그리고 조회를 기다린다
 */
async function renderDetail(): Promise<void> {
    await act(async () => {
        render(
            <RootLayoutProvider rootLayoutLoading={false} auth={USER_AUTH}>
                <ReservationDetailContent reservationId={RESERVATION_ID} />
            </RootLayoutProvider>,
        );
    });
}

beforeEach(() => {
    vi.useFakeTimers({now: new Date(NOW), toFake: ['Date']});
    getReservation.mockReset();
    getReservationQr.mockReset();
    cancelReservation.mockReset();
    replace.mockClear();
    showErrorPopup.mockClear();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('ReservationDetailContent', () => {
    it('[SUCCESS] 이용 중인 예약을 연다 → 문 QR · QR 유효 끝 · 연장하기', async () => {
        const detail = reservationDetail('CHECKED_IN', fromNow(-HOUR));
        getReservation.mockResolvedValue(detail);
        getReservationQr.mockResolvedValue({reservation_id: RESERVATION_ID, room_id: detail.room_id, qr: 'Q'.repeat(32), qr_starts_at: detail.start_at, qr_ends_at: detail.end_at});

        await renderDetail();

        expect(getReservation).toHaveBeenCalledTimes(1);
        expect(getReservation.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(getReservation.mock.calls[0][1]).toBe(RESERVATION_ID);
        expect(getReservationQr).toHaveBeenCalledTimes(1);
        expect(getReservationQr.mock.calls[0][1]).toBe(RESERVATION_ID);

        expect(screen.getByTitle('301호 문 QR')).toBeTruthy();
        expect(screen.getByText('QR 유효 끝 11월 12일(목) 18:00')).toBeTruthy();
        expect(screen.getByRole('link', {name: '연장하기'}).getAttribute('href')).toBe(`/reservation/${RESERVATION_ID}/extension/`);
        expect(screen.queryByRole('button', {name: '취소'})).toBeNull();
    });

    it('[SUCCESS] 이용 전 확정 예약을 연다 → QR 을 부르지 않고 "시작 시각부터 QR 이 열립니다"', async () => {
        getReservation.mockResolvedValue(reservationDetail('CONFIRMED', fromNow(2 * HOUR)));

        await renderDetail();

        expect(getReservation).toHaveBeenCalledTimes(1);
        expect(getReservationQr).not.toHaveBeenCalled();
        expect(screen.getByText('시작 시각부터 QR 이 열립니다')).toBeTruthy();
        expect(screen.queryByTitle('301호 문 QR')).toBeNull();
        expect((screen.getByRole('button', {name: 'QR 확인 (18:00부터)'}) as HTMLButtonElement).disabled).toBe(true);
    });

    it('[SUCCESS] 사유를 적고 취소한다 → 취소(큐) 1번 → 돌려받는 금액 팝업 → 다시 불러온다', async () => {
        getReservation.mockResolvedValue(reservationDetail('CONFIRMED', fromNow(2 * HOUR)));
        cancelReservation.mockResolvedValue({refund_amount: 15000});

        await renderDetail();
        fireEvent.click(screen.getByRole('button', {name: '취소'}));
        fireEvent.change(screen.getByRole('textbox', {name: /취소 사유/}), {target: {value: '  일정이 바뀌었어요  '}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '취소하기'}));
        });

        expect(cancelReservation).toHaveBeenCalledTimes(1);
        expect(cancelReservation.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(cancelReservation.mock.calls[0][1]).toBe(RESERVATION_ID);
        expect({...cancelReservation.mock.calls[0][2]}).toEqual({cancel_reason: '일정이 바뀌었어요'});
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('예약을 취소했어요. 15,000원을 환불해 드려요.');
        expect(getReservation).toHaveBeenCalledTimes(2);
    });

    it('[FAIL:qr-after-cancel] 이용 중 사용중지 호실을 취소하면 다시 불러온 뒤 QR 을 또 부르지 않는다(리뷰 P8-1)', async () => {
        const inUse = reservationDetail('CHECKED_IN', fromNow(-HOUR), {is_room_disabled: 1});
        getReservation.mockResolvedValueOnce(inUse).mockResolvedValueOnce({...inUse, reservation_state_id: 'CANCELED', reservation_state_name: '취소', cancel_actor: 'USER', canceled_at: NOW, cancel_reason: '호실 고장'});
        getReservationQr.mockResolvedValue({reservation_id: RESERVATION_ID, room_id: inUse.room_id, qr: 'Q'.repeat(32), qr_starts_at: inUse.start_at, qr_ends_at: inUse.end_at});
        cancelReservation.mockResolvedValue({refund_amount: 15000});

        await renderDetail();
        fireEvent.click(screen.getByRole('button', {name: '취소'}));
        fireEvent.change(screen.getByRole('textbox', {name: /취소 사유/}), {target: {value: '호실 고장'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '취소하기'}));
        });

        expect(getReservation).toHaveBeenCalledTimes(2);
        expect(getReservationQr).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('예약을 취소했어요. 15,000원을 환불해 드려요.');
        expect(screen.queryByTitle('301호 문 QR')).toBeNull();
    });
});
