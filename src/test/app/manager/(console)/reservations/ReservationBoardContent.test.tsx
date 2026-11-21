import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import ReservationBoardContent from '@/app/manager/(console)/reservations/ReservationBoardContent';
import { ApiError } from '@/shared/api/request';
import { RESERVATION_202, RESERVATION_401, ROOM_303, storeBoard } from '../reservation-fixture';
import { renderWithManager } from '../store/store-fixture';

const api = vi.hoisted(() => ({
    getStoreReservations: vi.fn(),
    cancelStoreReservation: vi.fn(),
    changeReservationRoom: vi.fn(),
    requestUseCancel: vi.fn(),
}));
const {showErrorPopup} = vi.hoisted(() => ({showErrorPopup: vi.fn()}));

vi.mock('@/contracts/reservation/api', () => api);
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

/**
 * 화면을 그리고 첫 현황을 기다린다
 */
async function renderBoard(): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = renderWithManager(<ReservationBoardContent />);
    });
    return container;
}

/**
 * 지금 열린 대화상자
 */
function dialog(): ReturnType<typeof within> {
    return within(document.querySelector('dialog[open]') as HTMLElement);
}

/**
 * 막대를 눌러 대화상자를 열고 작업 버튼을 누른다
 *
 * @param bar 막대 이름(호실 · 시간)
 * @param action 작업 버튼 이름
 */
function openAction(bar: RegExp, action: string): void {
    fireEvent.click(screen.getByRole('button', {name: bar}));
    fireEvent.click(dialog().getByRole('button', {name: action}));
}

beforeEach(() => {
    // 시계 — 2026-11-10 14:30(한국). 타이머는 진짜(큐 · act 그대로), Date 만 고정
    vi.useFakeTimers({toFake: ['Date']});
    vi.setSystemTime(new Date('2026-11-10T05:30:00.000Z'));
    Object.values(api).forEach((fn) => fn.mockReset());
    api.getStoreReservations.mockResolvedValue(storeBoard());
    api.cancelStoreReservation.mockResolvedValue(null);
    api.changeReservationRoom.mockResolvedValue(null);
    api.requestUseCancel.mockResolvedValue({reservation_cancel_request_id: 'q'.repeat(32), expires_at: '2026-11-10T05:40:00.000Z'});
    showErrorPopup.mockClear();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('ReservationBoardContent', () => {
    it('[SUCCESS] 다음 날로 넘긴다 → 현황 1번 더(그다음 날짜)', async () => {
        await renderBoard();
        expect(api.getStoreReservations).toHaveBeenCalledTimes(1);
        expect({...api.getStoreReservations.mock.calls[0][1]}).toEqual({date: '2026-11-10'});
        expect(screen.getByText('지금 14:30')).toBeTruthy();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '다음 날'}));
        });

        expect(api.getStoreReservations).toHaveBeenCalledTimes(2);
        expect({...api.getStoreReservations.mock.calls[1][1]}).toEqual({date: '2026-11-11'});
    });

    it('[FAIL:load] 다음 날 현황을 못 읽는다 → 받은 문구 팝업 1번 · "예약 현황을 불러오지 못했어요" · 전날 막대는 그리지 않는다', async () => {
        await renderBoard();
        expect(screen.getByRole('button', {name: /401호 17:00~20:00/})).toBeTruthy();
        api.getStoreReservations.mockRejectedValueOnce(new ApiError(500, {message: '잠시 뒤 다시 시도해 주세요.', validation_errors: null}));

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '다음 날'}));
        });

        expect(api.getStoreReservations).toHaveBeenCalledTimes(2);
        expect({...api.getStoreReservations.mock.calls[1][1]}).toEqual({date: '2026-11-11'});
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('잠시 뒤 다시 시도해 주세요.');
        expect(screen.getByText('예약 현황을 불러오지 못했어요')).toBeTruthy();
        expect(screen.queryByRole('button', {name: /401호 17:00~20:00/})).toBeNull();
    });

    it('[SUCCESS] 사유를 넣고 업체 취소한다 → 업체 취소(큐) 1번(그 예약 — 다듬은 사유) → 닫힘 → 현황 다시', async () => {
        await renderBoard();

        openAction(/401호 17:00~20:00/, '업체 취소');
        fireEvent.change(dialog().getByLabelText(/취소 사유/), {target: {value: ' 객실 설비 점검 '}});
        await act(async () => {
            fireEvent.click(dialog().getByRole('button', {name: '업체 취소'}));
        });

        expect(api.cancelStoreReservation).toHaveBeenCalledTimes(1);
        expect(api.cancelStoreReservation.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(api.cancelStoreReservation.mock.calls[0][1]).toBe(RESERVATION_401);
        expect({...api.cancelStoreReservation.mock.calls[0][2]}).toEqual({cancel_reason: '객실 설비 점검'});
        expect(document.querySelector('dialog[open]')).toBeNull();
        expect(api.getStoreReservations).toHaveBeenCalledTimes(2);
    });

    it('[FAIL:validation] 사유를 비우고 업체 취소한다 → 칸 옆 "취소 사유를 입력해주세요.", 취소 0번', async () => {
        const container = await renderBoard();

        openAction(/401호 17:00~20:00/, '업체 취소');
        await act(async () => {
            fireEvent.click(dialog().getByRole('button', {name: '업체 취소'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="cancel_reason"]') as HTMLElement).innerText).toBe('취소 사유를 입력해주세요.');
        expect(api.cancelStoreReservation).not.toHaveBeenCalled();
        expect(api.getStoreReservations).toHaveBeenCalledTimes(1);
    });

    it('[SUCCESS] 303호를 골라 옮긴다 → 호실 이동(큐) 1번(그 예약 — 303호) → 닫힘 → 현황 다시', async () => {
        await renderBoard();

        openAction(/401호 17:00~20:00/, '호실 이동');
        expect(dialog().getByRole('radio', {name: /402호/}).hasAttribute('disabled')).toBe(true);
        fireEvent.click(dialog().getByRole('radio', {name: /303호/}));
        await act(async () => {
            fireEvent.click(dialog().getByRole('button', {name: '호실 이동'}));
        });

        expect(api.changeReservationRoom).toHaveBeenCalledTimes(1);
        expect(api.changeReservationRoom.mock.calls[0][1]).toBe(RESERVATION_401);
        expect({...api.changeReservationRoom.mock.calls[0][2]}).toEqual({room_id: ROOM_303});
        expect(document.querySelector('dialog[open]')).toBeNull();
        expect(api.getStoreReservations).toHaveBeenCalledTimes(2);
    });

    it('[SUCCESS] 사유를 넣고 이용 중 취소 요청을 보낸다 → 요청(큐) 1번(그 예약 — 다듬은 사유) → 닫힘 → "14:40까지" 띠 → 현황 다시', async () => {
        await renderBoard();

        openAction(/202호 13:00~16:00/, '이용 중 취소 요청');
        fireEvent.change(dialog().getByLabelText(/취소 사유/), {target: {value: ' 온수 설비 고장 '}});
        await act(async () => {
            fireEvent.click(dialog().getByRole('button', {name: '요청 보내기'}));
        });

        expect(api.requestUseCancel).toHaveBeenCalledTimes(1);
        expect(api.requestUseCancel.mock.calls[0][1]).toBe(RESERVATION_202);
        expect({...api.requestUseCancel.mock.calls[0][2]}).toEqual({cancel_reason: '온수 설비 고장'});
        expect(document.querySelector('dialog[open]')).toBeNull();
        expect(screen.getByText('취소 요청을 보냈습니다. 14:40까지 예약자 동의를 기다립니다.')).toBeTruthy();
        expect(api.getStoreReservations).toHaveBeenCalledTimes(2);
    });
});
