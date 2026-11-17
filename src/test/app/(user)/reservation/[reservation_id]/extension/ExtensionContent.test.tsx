import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ExtensionContent from '@/app/(user)/reservation/[reservation_id]/extension/ExtensionContent';
import { ReservationExtendResultDto } from '@/contracts/reservation/dto/reservation-extend.dto';
import { TossPaymentType } from '@/shared/components/payment/TossPaymentWidget';
import RootLayoutProvider from '@/shared/providers/RootLayoutProvider';
import { fromNow, HOUR, NOW, RESERVATION_ID, reservationDetail, USER_AUTH } from '../../reservation-fixtures';

const {getReservation, getExtension, requestExtension, replace, showErrorPopup, widgetProps} = vi.hoisted(() => ({
    getReservation: vi.fn(),
    getExtension: vi.fn(),
    requestExtension: vi.fn(),
    replace: vi.fn(),
    showErrorPopup: vi.fn(),
    widgetProps: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/reservation/api', () => ({getReservation, getExtension, requestExtension}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));
vi.mock('@/shared/components/payment/TossPaymentWidget', () => ({
    default: (props: {payment: TossPaymentType; returnUrl?: string | null}) => {
        widgetProps(props);
        return <div data-testid="toss-widget" />;
    },
}));

beforeEach(() => {
    vi.useFakeTimers({now: new Date(NOW), toFake: ['Date']});
    getReservation.mockReset();
    getExtension.mockReset();
    requestExtension.mockReset();
    replace.mockClear();
    showErrorPopup.mockClear();
    widgetProps.mockClear();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('ExtensionContent', () => {
    it('[SUCCESS] 연장할 수 있어 연장 신청한다 → 연장 신청(큐) 1번 → 결제위젯(돌아올 곳 예약 1건)', async () => {
        const detail = reservationDetail('CHECKED_IN', fromNow(-HOUR));
        const extended: ReservationExtendResultDto = {
            reservation_id: RESERVATION_ID,
            reservation_detail_id: 'x'.repeat(32),
            payment_id: 'y'.repeat(32),
            order_name: '스테이 리프 강남역점 301호 연장',
            amount: 15000,
            expires_at: fromNow(5 * 60 * 1000),
            start_at: detail.end_at,
            end_at: new Date(Date.parse(detail.end_at) + 3 * HOUR).toISOString(),
        };
        getReservation.mockResolvedValue(detail);
        getExtension.mockResolvedValue({reservation_id: RESERVATION_ID, is_extendable: 1, reason: null, room_plan_type_id: 'HOURLY', start_at: extended.start_at, end_at: extended.end_at, amount: 15000});
        requestExtension.mockResolvedValue(extended);

        await act(async () => {
            render(
                <RootLayoutProvider rootLayoutLoading={false} auth={USER_AUTH}>
                    <ExtensionContent reservationId={RESERVATION_ID} />
                </RootLayoutProvider>,
            );
        });

        expect(getReservation).toHaveBeenCalledTimes(1);
        expect(getExtension).toHaveBeenCalledTimes(1);
        expect(getExtension.mock.calls[0][1]).toBe(RESERVATION_ID);
        expect(screen.getByText('3시간 더')).toBeTruthy();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '연장 신청'}));
        });

        expect(requestExtension).toHaveBeenCalledTimes(1);
        expect(requestExtension.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(requestExtension.mock.calls[0][1]).toBe(RESERVATION_ID);
        expect(screen.getByTestId('toss-widget')).toBeTruthy();
        expect(widgetProps).toHaveBeenLastCalledWith(expect.objectContaining({payment: extended, returnUrl: `/reservation/${RESERVATION_ID}/`}));
        expect(showErrorPopup).not.toHaveBeenCalled();
    });
});
