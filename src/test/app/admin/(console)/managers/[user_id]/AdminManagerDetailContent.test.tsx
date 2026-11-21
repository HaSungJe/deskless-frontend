import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import AdminManagerDetailContent from '@/app/admin/(console)/managers/[user_id]/AdminManagerDetailContent';
import { MANAGER_ID, managerDetail, renderWithAdmin } from '../../admin-fixture';

const api = vi.hoisted(() => ({getManagerAccount: vi.fn(), resetManagerAccountPassword: vi.fn()}));

vi.mock('@/contracts/manager/api', () => api);

beforeEach(() => {
    api.getManagerAccount.mockReset().mockResolvedValue(managerDetail());
    api.resetManagerAccountPassword.mockReset().mockResolvedValue(null);
});

describe('AdminManagerDetailContent', () => {
    it('[SUCCESS] 초기화를 누르고 확인한다 → 확인 창 문구 → 초기화(큐) 1번(그 계정) → 보낸 안내 띠 → 상세 다시', async () => {
        await act(async () => {
            renderWithAdmin(<AdminManagerDetailContent userId={MANAGER_ID} />);
        });
        expect(api.getManagerAccount).toHaveBeenCalledTimes(1);
        expect(api.getManagerAccount.mock.calls[0][1]).toBe(MANAGER_ID);

        fireEvent.click(screen.getByRole('button', {name: '비밀번호 초기화'}));
        expect(api.resetManagerAccountPassword).not.toHaveBeenCalled();
        const dialog = within(document.querySelector('dialog[open]') as HTMLElement);
        expect(dialog.getByText('이서연(gn_front01)의 임시 비밀번호를 만들어 010-4567-8901 로 SMS 를 보냅니다. 지금 비밀번호로는 더 이상 로그인할 수 없습니다.')).toBeTruthy();
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '비밀번호 초기화'}));
        });

        expect(api.resetManagerAccountPassword).toHaveBeenCalledTimes(1);
        expect(api.resetManagerAccountPassword.mock.calls[0][0]).toMatchObject({token: 'admin-token'});
        expect(api.resetManagerAccountPassword.mock.calls[0][1]).toBe(MANAGER_ID);
        expect(screen.getByRole('status').textContent).toBe('임시 비밀번호를 010-4567-8901 로 보냈습니다.');
        expect(api.getManagerAccount).toHaveBeenCalledTimes(2);
    });
});
