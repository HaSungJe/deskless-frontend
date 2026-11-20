import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import RoomGroupPrices from '@/app/manager/(console)/room-groups/[room_group_id]/_components/RoomGroupPrices';
import { planPrices, ROOM_GROUP_ID, roomGroupDetail } from '../../../room-fixture';
import { renderWithManager } from '../../../store/store-fixture';

const {getRoomGroupPlanPrices, createRoomGroupPlanPrice, updateRoomGroupPlanPrice, deleteRoomGroupPlanPrice, onChanged} = vi.hoisted(() => ({
    getRoomGroupPlanPrices: vi.fn(),
    createRoomGroupPlanPrice: vi.fn(),
    updateRoomGroupPlanPrice: vi.fn(),
    deleteRoomGroupPlanPrice: vi.fn(),
    onChanged: vi.fn(),
}));

vi.mock('@/contracts/room/api', () => ({getRoomGroupPlanPrices, createRoomGroupPlanPrice, updateRoomGroupPlanPrice, deleteRoomGroupPlanPrice}));

/**
 * 1박 기간 가격 절을 그리고 첫 목록을 기다린다
 */
async function renderPrices(): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = renderWithManager(<RoomGroupPrices roomGroupId={ROOM_GROUP_ID} plans={roomGroupDetail().plans} type="NIGHT" onTypeChange={vi.fn()} onChanged={onChanged} />);
    });
    return container;
}

/**
 * 추가 대화상자를 열어 칸을 채운다
 *
 * @param price 요금 칸 글자
 */
function fillCreate(price: string): ReturnType<typeof within> {
    fireEvent.click(screen.getByRole('button', {name: '기간 가격 추가'}));
    const dialog = within(document.querySelector('dialog[open]') as HTMLElement);
    fireEvent.change(dialog.getByLabelText('시작 날짜'), {target: {value: '2026-12-30'}});
    fireEvent.change(dialog.getByLabelText('종료 날짜'), {target: {value: '2027-01-02'}});
    fireEvent.change(dialog.getByLabelText('요금'), {target: {value: price}});
    fireEvent.change(dialog.getByLabelText('메모(선택)'), {target: {value: ' 연말 연휴 '}});
    return dialog;
}

beforeEach(() => {
    getRoomGroupPlanPrices.mockReset().mockResolvedValue(planPrices());
    createRoomGroupPlanPrice.mockReset().mockResolvedValue({room_group_plan_price_id: 'n'.repeat(32)});
    updateRoomGroupPlanPrice.mockReset();
    deleteRoomGroupPlanPrice.mockReset();
    onChanged.mockReset();
});

describe('RoomGroupPrices', () => {
    it('[SUCCESS] 1박 기간 가격을 추가한다 → 등록(큐) 1번(그룹 · 1박 — 시작 · 종료 날짜 · 요금 · 메모) → 대화상자 닫힘 → 1박 목록 · 상세 다시', async () => {
        await renderPrices();
        expect(getRoomGroupPlanPrices).toHaveBeenCalledTimes(1);
        expect(getRoomGroupPlanPrices.mock.calls[0].slice(1, 3)).toEqual([ROOM_GROUP_ID, 'NIGHT']);
        expect(screen.getByText('성탄 연휴')).toBeTruthy();

        const dialog = fillCreate('95000');
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '추가'}));
        });

        expect(createRoomGroupPlanPrice).toHaveBeenCalledTimes(1);
        expect(createRoomGroupPlanPrice.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(createRoomGroupPlanPrice.mock.calls[0].slice(1, 3)).toEqual([ROOM_GROUP_ID, 'NIGHT']);
        expect(JSON.parse(JSON.stringify(createRoomGroupPlanPrice.mock.calls[0][3]))).toEqual({start_date: '2026-12-30', end_date: '2027-01-02', price: 95000, memo: '연말 연휴'});
        expect(document.querySelector('dialog[open]')).toBeNull();
        expect(getRoomGroupPlanPrices).toHaveBeenCalledTimes(2);
        expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it('[FAIL:validation] 요금을 0 으로 추가한다 → 칸 옆 "기간 요금은 1 ~ 10,000,000원 사이로 입력해주세요.", 등록 0번', async () => {
        const container = await renderPrices();

        const dialog = fillCreate('0');
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '추가'}));
        });

        expect((container.ownerDocument.querySelector('[data-type="validation-alert"][data-id="price"][data-key="plan_price"]') as HTMLElement).innerText).toBe('기간 요금은 1 ~ 10,000,000원 사이로 입력해주세요.');
        expect(createRoomGroupPlanPrice).not.toHaveBeenCalled();
        expect(onChanged).not.toHaveBeenCalled();
        expect(getRoomGroupPlanPrices).toHaveBeenCalledTimes(1);
    });
});
