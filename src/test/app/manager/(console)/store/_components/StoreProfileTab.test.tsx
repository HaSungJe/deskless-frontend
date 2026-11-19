import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import StoreProfileTab from '@/app/manager/(console)/store/_components/StoreProfileTab';
import { renderWithManager, storeMine } from '../store-fixture';

const {updateMyStoreProfile} = vi.hoisted(() => ({updateMyStoreProfile: vi.fn()}));

vi.mock('@/contracts/store/api', () => ({updateMyStoreProfile}));

const onSaved = vi.fn();

beforeEach(() => {
    updateMyStoreProfile.mockReset().mockResolvedValue(null);
    onSaved.mockReset().mockResolvedValue(undefined);
});

describe('StoreProfileTab', () => {
    it('[SUCCESS] 소개 · 연락처를 고쳐 저장한다 → 저장(큐) 1번(소개 · 숫자만 연락처) → 내 업체 다시 읽기 1번', async () => {
        renderWithManager(<StoreProfileTab store={storeMine()} onSaved={onSaved} />);

        fireEvent.change(screen.getByLabelText('업체 소개(선택)'), {target: {value: '  무인 체크인으로 바로 들어갑니다. '}});
        fireEvent.change(screen.getByLabelText('업체 연락처'), {target: {value: '02-9876-5432'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '저장'}));
        });

        expect(updateMyStoreProfile).toHaveBeenCalledTimes(1);
        expect(updateMyStoreProfile.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect({...updateMyStoreProfile.mock.calls[0][1]}).toEqual({introduction: '무인 체크인으로 바로 들어갑니다.', phone: '0298765432'});
        expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it('[FAIL:validation] 연락처가 7자리다 → 칸 옆 "업체 연락처를 숫자만 정확히 입력해주세요.", 저장 0번', async () => {
        const container = renderWithManager(<StoreProfileTab store={storeMine()} onSaved={onSaved} />);

        fireEvent.change(screen.getByLabelText('업체 연락처'), {target: {value: '1234567'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '저장'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="phone"]') as HTMLElement).innerText).toBe('업체 연락처를 숫자만 정확히 입력해주세요.');
        expect(updateMyStoreProfile).not.toHaveBeenCalled();
        expect(onSaved).not.toHaveBeenCalled();
    });
});
