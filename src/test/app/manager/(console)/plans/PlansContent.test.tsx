import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import PlansContent from '@/app/manager/(console)/plans/PlansContent';
import { roomPlans } from '../room-fixture';
import { renderWithManager } from '../store/store-fixture';

const {getRoomPlans, updateRoomPlan} = vi.hoisted(() => ({
    getRoomPlans: vi.fn(),
    updateRoomPlan: vi.fn(),
}));

vi.mock('@/contracts/room/api', () => ({getRoomPlans, updateRoomPlan}));

/**
 * 화면을 그리고 상품 3개를 기다린다
 */
async function renderPlans(): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = renderWithManager(<PlansContent />);
    });
    return container;
}

/**
 * 상품 카드 — 제목으로 찾는다
 *
 * @param title 상품 이름
 */
function card(title: string): HTMLElement {
    return screen.getByRole('heading', {name: title}).closest('section') as HTMLElement;
}

beforeEach(() => {
    getRoomPlans.mockReset().mockResolvedValue(roomPlans());
    updateRoomPlan.mockReset().mockResolvedValue(null);
});

describe('PlansContent', () => {
    it('[FAIL:validation] 1박 카드의 판매 요일을 모두 끄고 저장한다 → 1박 카드 칸 옆 "예약 가능 요일은 1 ~ 127 사이로 입력해주세요.", 다른 카드 칸은 비어 있음, 저장 0번', async () => {
        const container = await renderPlans();
        expect(getRoomPlans).toHaveBeenCalledTimes(1);

        const night = card('1박');
        for (const day of ['일', '월', '화', '수', '목', '금', '토']) {
            fireEvent.click(within(night).getByRole('button', {name: day}));
        }
        expect(within(night).getByText('판매 요일 · 고른 요일 없음')).toBeTruthy();
        await act(async () => {
            fireEvent.click(within(night).getByRole('button', {name: '저장'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="days_of_week"][data-key="NIGHT"]') as HTMLElement).innerText).toBe('예약 가능 요일은 1 ~ 127 사이로 입력해주세요.');
        expect((container.querySelector('[data-type="validation-alert"][data-id="days_of_week"][data-key="HOURLY"]') as HTMLElement).innerText ?? '').toBe('');
        expect(updateRoomPlan).not.toHaveBeenCalled();
        expect(getRoomPlans).toHaveBeenCalledTimes(1);
    });
});
