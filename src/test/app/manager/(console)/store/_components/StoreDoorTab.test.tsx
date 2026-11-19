import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import StoreDoorTab from '@/app/manager/(console)/store/_components/StoreDoorTab';
import { renderWithManager, storeMine } from '../store-fixture';

const {updateMyDoorSecret, showErrorPopup} = vi.hoisted(() => ({updateMyDoorSecret: vi.fn(), showErrorPopup: vi.fn()}));

vi.mock('@/contracts/store/api', () => ({updateMyDoorSecret}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

const onSaved = vi.fn();

beforeEach(() => {
    updateMyDoorSecret.mockReset().mockResolvedValue(null);
    showErrorPopup.mockClear();
    onSaved.mockReset().mockResolvedValue(undefined);
});

describe('StoreDoorTab', () => {
    it('[SUCCESS] 업체 총관리자가 새 시크릿을 정한다 → 시크릿 저장(큐) 1번 → 칸 비움 · 안내 → 다시 읽기', async () => {
        renderWithManager(<StoreDoorTab store={storeMine({is_door_secret_set: 0})} onSaved={onSaved} />);
        expect(screen.getByText('설정 안 함')).toBeTruthy();

        fireEvent.change(screen.getByLabelText('시크릿'), {target: {value: 'Lf7Qm2Xa9Rt4Wc8Zp3Kd'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '시크릿 정하기'}));
        });

        expect(updateMyDoorSecret).toHaveBeenCalledTimes(1);
        expect(updateMyDoorSecret.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect({...updateMyDoorSecret.mock.calls[0][1]}).toEqual({door_secret: 'Lf7Qm2Xa9Rt4Wc8Zp3Kd'});
        expect(showErrorPopup).toHaveBeenCalledWith('시크릿을 바꿨습니다. 문 쪽 프로그램에 새 시크릿을 넣어 다시 연결해주세요.');
        expect((screen.getByLabelText('시크릿') as HTMLInputElement).value).toBe('');
        expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it('[FAIL:validation] 시크릿이 15자다 → 칸 옆 "시크릿 코드는 영문 · 숫자 16 ~ 64자로 입력해주세요.", 저장 0번', async () => {
        const container = renderWithManager(<StoreDoorTab store={storeMine()} onSaved={onSaved} />);

        fireEvent.change(screen.getByLabelText('시크릿'), {target: {value: 'Lf7Qm2Xa9Rt4Wc8'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '시크릿 바꾸기'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="door_secret"]') as HTMLElement).innerText).toBe('시크릿 코드는 영문 · 숫자 16 ~ 64자로 입력해주세요.');
        expect(updateMyDoorSecret).not.toHaveBeenCalled();
        expect(onSaved).not.toHaveBeenCalled();
    });
});
