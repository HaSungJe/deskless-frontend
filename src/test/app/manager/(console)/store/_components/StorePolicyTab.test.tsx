import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import StorePolicyTab from '@/app/manager/(console)/store/_components/StorePolicyTab';
import { renderWithManager, storeMine } from '../store-fixture';

const {updateMyStoreOpen, updateMyStoreMaintenance, updateMyStorePolicy} = vi.hoisted(() => ({
    updateMyStoreOpen: vi.fn(),
    updateMyStoreMaintenance: vi.fn(),
    updateMyStorePolicy: vi.fn(),
}));

vi.mock('@/contracts/store/api', () => ({updateMyStoreOpen, updateMyStoreMaintenance, updateMyStorePolicy}));

const onSaved = vi.fn();

beforeEach(() => {
    updateMyStoreOpen.mockReset().mockResolvedValue(null);
    updateMyStoreMaintenance.mockReset().mockResolvedValue(null);
    updateMyStorePolicy.mockReset().mockResolvedValue(null);
    onSaved.mockReset().mockResolvedValue(undefined);
});

describe('StorePolicyTab', () => {
    it('[SUCCESS] 영업중 스위치를 끈다 → 영업중 저장(큐) 1번(is_open 0) → 다시 읽기', async () => {
        renderWithManager(<StorePolicyTab store={storeMine()} onSaved={onSaved} />);
        expect(screen.getByText(/지금 규정: 이용 시작 720시간\(30일\) 전부터/)).toBeTruthy();

        await act(async () => {
            fireEvent.click(screen.getByRole('switch', {name: '영업중'}));
        });

        expect(updateMyStoreOpen).toHaveBeenCalledTimes(1);
        expect(updateMyStoreOpen.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect({...updateMyStoreOpen.mock.calls[0][1]}).toEqual({is_open: 0});
        expect(onSaved).toHaveBeenCalledTimes(1);
        expect(updateMyStorePolicy).not.toHaveBeenCalled();
    });

    it('[FAIL:validation] 마감 뒤 환불 비율이 120 이다 → 칸 옆 "마감 뒤 환불 비율은 0 ~ 100% 사이로 입력해주세요.", 저장 0번', async () => {
        const container = renderWithManager(<StorePolicyTab store={storeMine()} onSaved={onSaved} />);

        fireEvent.change(screen.getByLabelText('마감 뒤 환불 비율'), {target: {value: '120'}});
        await act(async () => {
            fireEvent.click(screen.getAllByRole('button', {name: '저장'})[1]);
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="late_refund_percent"]') as HTMLElement).innerText).toBe('마감 뒤 환불 비율은 0 ~ 100% 사이로 입력해주세요.');
        expect(updateMyStorePolicy).not.toHaveBeenCalled();
        expect(onSaved).not.toHaveBeenCalled();
    });
});
