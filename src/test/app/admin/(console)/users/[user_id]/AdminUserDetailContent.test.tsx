import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import AdminUserDetailContent from '@/app/admin/(console)/users/[user_id]/AdminUserDetailContent';
import { renderWithAdmin, USER_ID, userDetail, userReservations } from '../../admin-fixture';

const api = vi.hoisted(() => ({getUser: vi.fn(), getUserReservations: vi.fn(), updateUserState: vi.fn()}));

vi.mock('@/contracts/user/api', () => api);

/**
 * 상세를 그리고 상세 · 예약 이력을 기다린다
 */
async function renderDetail(): Promise<void> {
    await act(async () => {
        renderWithAdmin(<AdminUserDetailContent userId={USER_ID} />);
    });
}

beforeEach(() => {
    api.getUser.mockReset().mockResolvedValue(userDetail());
    api.getUserReservations.mockReset().mockResolvedValue(userReservations());
    api.updateUserState.mockReset().mockResolvedValue(null);
});

describe('AdminUserDetailContent', () => {
    it('[SUCCESS] 사유를 넣고 이용 제한을 확인한다 → 확인 창 → 상태 변경(큐) 1번(정지 · 다듬은 사유) → 제한 안내 띠 → 상세 다시', async () => {
        await renderDetail();
        expect(api.getUser).toHaveBeenCalledTimes(1);
        expect(api.getUserReservations).toHaveBeenCalledTimes(1);
        expect(api.getUserReservations.mock.calls[0][1]).toBe(USER_ID);
        expect({...api.getUserReservations.mock.calls[0][2]}).toMatchObject({page: 1, size: 10});

        fireEvent.change(screen.getByLabelText('이용 제한 사유'), {target: {value: '  객실 비품 파손이 되풀이되어 새 예약을 막았습니다.  '}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '이용 제한'}));
        });
        expect(api.updateUserState).not.toHaveBeenCalled();
        const dialog = within(document.querySelector('dialog[open]') as HTMLElement);
        expect(dialog.getByText('여행하는고양이 님의 이용을 제한할까요? 새 예약 · 연장이 막힙니다.')).toBeTruthy();
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '이용 제한'}));
        });

        expect(api.updateUserState).toHaveBeenCalledTimes(1);
        expect(api.updateUserState.mock.calls[0][0]).toMatchObject({token: 'admin-token'});
        expect(api.updateUserState.mock.calls[0][1]).toBe(USER_ID);
        expect({...api.updateUserState.mock.calls[0][2]}).toEqual({state_id: 'BLOCK', block_comment: '객실 비품 파손이 되풀이되어 새 예약을 막았습니다.'});
        expect(screen.getByRole('status').textContent).toBe('이용을 제한했습니다. 이 이용자는 새 예약 · 연장을 할 수 없습니다.');
        expect(api.getUser).toHaveBeenCalledTimes(2);
    });

    it('[SUCCESS] 정지된 이용자의 제한을 해제한다 → 확인 창 없이 상태 변경(큐) 1번(정상 · 사유 없음) → 상세 다시', async () => {
        api.getUser.mockResolvedValue(userDetail({state_id: 'BLOCK', block_comment: '객실 비품 파손이 되풀이되어 새 예약을 막았습니다.'}));
        await renderDetail();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '제한 해제'}));
        });

        expect(document.querySelector('dialog[open]')).toBeNull();
        expect(api.updateUserState).toHaveBeenCalledTimes(1);
        expect(api.updateUserState.mock.calls[0][1]).toBe(USER_ID);
        expect({...api.updateUserState.mock.calls[0][2]}).toEqual({state_id: 'ACTIVE'});
        expect(api.getUser).toHaveBeenCalledTimes(2);
    });
});
