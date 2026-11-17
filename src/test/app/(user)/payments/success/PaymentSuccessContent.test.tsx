import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import PaymentSuccessContent from '@/app/(user)/payments/success/PaymentSuccessContent';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {requestTossConfirm, confirmPayment} = vi.hoisted(() => ({
    requestTossConfirm: vi.fn(),
    confirmPayment: vi.fn(),
}));

vi.mock('@/shared/api/payment', () => ({requestTossConfirm}));
vi.mock('@/contracts/reservation/api', () => ({confirmPayment}));

const PAYMENT_ID = 'p'.repeat(32);
const RESERVATION_ID = 'r'.repeat(32);
const DETAIL_PATH = `/reservation/${RESERVATION_ID}/`;

/** 로그인한 이용자 */
const AUTH: AuthContextType = {area: 'user', token: 'user-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/**
 * 결제 성공 화면을 그리고 승인 · 확인을 기다린다
 */
async function renderSuccess(): Promise<void> {
    await act(async () => {
        render(
            <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                <PaymentSuccessContent paymentKey="toss-payment-key" orderId={PAYMENT_ID} amount="15000" returnUrl={DETAIL_PATH} />
            </RootLayoutProvider>,
        );
    });
}

beforeEach(() => {
    requestTossConfirm.mockReset();
    confirmPayment.mockReset();
});

describe('PaymentSuccessContent', () => {
    it('[SUCCESS] 토스가 승인하고 결제 확인이 된다 → "예약이 확정되었어요" · 상태 배지 · 예약 보기', async () => {
        requestTossConfirm.mockResolvedValue({success: true});
        confirmPayment.mockResolvedValue({reservation_id: RESERVATION_ID, reservation_state_id: 'CONFIRMED'});

        await renderSuccess();

        expect(requestTossConfirm).toHaveBeenCalledTimes(1);
        expect(requestTossConfirm).toHaveBeenCalledWith({paymentKey: 'toss-payment-key', orderId: PAYMENT_ID, amount: 15000});
        expect(confirmPayment).toHaveBeenCalledTimes(1);
        expect(confirmPayment.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect({...confirmPayment.mock.calls[0][1]}).toEqual({payment_id: PAYMENT_ID, payment_key: 'toss-payment-key'});

        expect(screen.getByText('예약이 확정되었어요')).toBeTruthy();
        expect(screen.getByText('예약 확정')).toBeTruthy();
        expect(screen.getByText(RESERVATION_ID)).toBeTruthy();
        expect(screen.getByRole('link', {name: '예약 보기'}).getAttribute('href')).toBe(`/reservation/${RESERVATION_ID}/`);
    });

    it('[FAIL:toss] 토스가 승인을 거절한다 → 사유 · 예약으로 돌아가기(돌아갈 주소), 결제 확인을 부르지 않음', async () => {
        requestTossConfirm.mockResolvedValue({success: false, message: '카드사에서 결제를 거절했어요.', code: 'REJECT_CARD_COMPANY'});

        await renderSuccess();

        expect(requestTossConfirm).toHaveBeenCalledTimes(1);
        expect(confirmPayment).not.toHaveBeenCalled();
        expect(screen.getByText('카드사에서 결제를 거절했어요.')).toBeTruthy();
        expect(screen.getByText(/REJECT_CARD_COMPANY/)).toBeTruthy();
        expect(screen.getByRole('link', {name: '예약으로 돌아가기'}).getAttribute('href')).toBe(DETAIL_PATH);
        expect(screen.queryByRole('link', {name: '예약 보기'})).toBeNull();
    });
});
