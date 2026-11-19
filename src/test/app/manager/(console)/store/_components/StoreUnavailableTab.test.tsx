import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import StoreUnavailableTab from '@/app/manager/(console)/store/_components/StoreUnavailableTab';
import { renderWithManager } from '../store-fixture';

const {getMyUnavailablePeriods, createMyUnavailablePeriod, deleteMyUnavailablePeriod} = vi.hoisted(() => ({
    getMyUnavailablePeriods: vi.fn(),
    createMyUnavailablePeriod: vi.fn(),
    deleteMyUnavailablePeriod: vi.fn(),
}));

vi.mock('@/contracts/store/api', () => ({getMyUnavailablePeriods, createMyUnavailablePeriod, deleteMyUnavailablePeriod}));

/** 목록 한 쪽 — 1개 */
const LIST = {
    list: [{store_unavailable_period_id: 'u'.repeat(32), starts_at: '2026-11-18T01:00:00.000Z', ends_at: '2026-11-18T07:00:00.000Z', memo: '소방 점검', created_at: '2026-11-05T03:00:00.000Z'}],
    pagination: {total_count: 1, page: 1, size: 20, max_page: 1, page_range: {start: 1, end: 1}},
};

/**
 * 탭을 그리고 첫 목록을 기다린다
 */
async function renderTab(): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = renderWithManager(<StoreUnavailableTab />);
    });
    return container;
}

beforeEach(() => {
    getMyUnavailablePeriods.mockReset().mockResolvedValue(LIST);
    createMyUnavailablePeriod.mockReset().mockResolvedValue({store_unavailable_period_id: 'n'.repeat(32)});
    deleteMyUnavailablePeriod.mockReset();
});

describe('StoreUnavailableTab', () => {
    it('[SUCCESS] 기간을 추가한다 → 목록 1번 → 등록(큐) 1번(날짜 시각 모양 · 메모) → 목록 다시 · 칸 비움', async () => {
        await renderTab();
        expect(getMyUnavailablePeriods).toHaveBeenCalledTimes(1);
        expect({...getMyUnavailablePeriods.mock.calls[0][1]}).toMatchObject({page: 1, size: 20});
        expect(screen.getByText('소방 점검')).toBeTruthy();

        fireEvent.change(screen.getByLabelText('시작 일시'), {target: {value: '2026-11-20T09:00'}});
        fireEvent.change(screen.getByLabelText('종료 일시'), {target: {value: '2026-11-20T18:00'}});
        fireEvent.change(screen.getByLabelText('메모(선택 · 30자)'), {target: {value: ' 배관 공사 '}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '추가'}));
        });

        expect(createMyUnavailablePeriod).toHaveBeenCalledTimes(1);
        expect(createMyUnavailablePeriod.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect({...createMyUnavailablePeriod.mock.calls[0][1]}).toEqual({starts_at: '2026-11-20 09:00', ends_at: '2026-11-20 18:00', memo: '배관 공사'});
        expect(getMyUnavailablePeriods).toHaveBeenCalledTimes(2);
        expect((screen.getByLabelText('시작 일시') as HTMLInputElement).value).toBe('');
    });

    it('[FAIL:validation] 시작 일시를 비우고 추가한다 → 칸 옆 "시작 일시를 입력해주세요.", 등록 0번', async () => {
        const container = await renderTab();

        fireEvent.change(screen.getByLabelText('종료 일시'), {target: {value: '2026-11-20T18:00'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '추가'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="starts_at"]') as HTMLElement).innerText).toBe('시작 일시를 입력해주세요.');
        expect(createMyUnavailablePeriod).not.toHaveBeenCalled();
        expect(getMyUnavailablePeriods).toHaveBeenCalledTimes(1);
    });
});
