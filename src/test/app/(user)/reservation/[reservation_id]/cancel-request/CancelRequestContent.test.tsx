import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import CancelRequestContent from '@/app/(user)/reservation/[reservation_id]/cancel-request/CancelRequestContent';
import { ReservationCancelRequestResultDto } from '@/contracts/reservation/dto/reservation-cancel-request.dto';
import RootLayoutProvider from '@/shared/providers/RootLayoutProvider';
import { fromNow, NOW, RESERVATION_ID, USER_AUTH } from '../../reservation-fixtures';

const {getCancelRequest, approveCancelRequest, rejectCancelRequest, replace, showErrorPopup} = vi.hoisted(() => ({
    getCancelRequest: vi.fn(),
    approveCancelRequest: vi.fn(),
    rejectCancelRequest: vi.fn(),
    replace: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/reservation/api', () => ({getCancelRequest, approveCancelRequest, rejectCancelRequest}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

/** 예약 1건 주소 */
const DETAIL_PATH = `/reservation/${RESERVATION_ID}/`;

/**
 * 업체의 이용 중 취소 요청 — 만료 8분 전
 *
 * @param state 요청 상태
 */
function cancelRequest(state: string): ReservationCancelRequestResultDto {
    return {
        reservation_cancel_request_id: 'f'.repeat(32),
        reservation_cancel_request_state_id: state,
        store_name: '스테이 리프 강남역점',
        room_name: '301호',
        cancel_reason: '객실 설비 고장으로 이용이 어렵습니다.',
        refund_amount: 45000,
        expires_at: fromNow(8 * 60 * 1000),
        created_at: fromNow(-2 * 60 * 1000),
    };
}

/**
 * 취소 동의 화면을 그리고 조회를 기다린다
 */
async function renderCancelRequest(): Promise<void> {
    await act(async () => {
        render(
            <RootLayoutProvider rootLayoutLoading={false} auth={USER_AUTH}>
                <CancelRequestContent reservationId={RESERVATION_ID} />
            </RootLayoutProvider>,
        );
    });
}

beforeEach(() => {
    vi.useFakeTimers({now: new Date(NOW), toFake: ['Date']});
    getCancelRequest.mockReset();
    approveCancelRequest.mockReset();
    rejectCancelRequest.mockReset();
    replace.mockClear();
    showErrorPopup.mockClear();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('CancelRequestContent', () => {
    it('[SUCCESS] 기한 안에 승인한다 → 승인(큐) 1번 → 환불 금액 안내 → 예약 1건', async () => {
        getCancelRequest.mockResolvedValue(cancelRequest('REQUESTED'));
        approveCancelRequest.mockResolvedValue({refund_amount: 45000});

        await renderCancelRequest();

        expect(getCancelRequest).toHaveBeenCalledTimes(1);
        expect(getCancelRequest.mock.calls[0][1]).toBe(RESERVATION_ID);
        expect(screen.getByText('객실 설비 고장으로 이용이 어렵습니다.')).toBeTruthy();
        expect(screen.getByText('45,000원')).toBeTruthy();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '승인'}));
        });

        expect(approveCancelRequest).toHaveBeenCalledTimes(1);
        expect(approveCancelRequest.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(approveCancelRequest.mock.calls[0][1]).toBe(RESERVATION_ID);
        expect(rejectCancelRequest).not.toHaveBeenCalled();
        expect(showErrorPopup).toHaveBeenCalledWith('취소를 승인했어요. 45,000원을 환불해 드려요.');
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith(DETAIL_PATH);
    });

    it('[FAIL:closed] 이미 처리됐거나 만료된 요청을 연다 → 승인 · 거절 없이 안내 → 예약 1건', async () => {
        getCancelRequest.mockResolvedValue(cancelRequest('APPROVED'));

        await renderCancelRequest();

        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('이미 처리되었거나 만료된 요청이에요.');
        expect(replace).toHaveBeenCalledWith(DETAIL_PATH);
        expect(screen.queryByRole('button', {name: '승인'})).toBeNull();
        expect(screen.queryByRole('button', {name: '거절'})).toBeNull();
        expect(approveCancelRequest).not.toHaveBeenCalled();
        expect(rejectCancelRequest).not.toHaveBeenCalled();
    });
});
