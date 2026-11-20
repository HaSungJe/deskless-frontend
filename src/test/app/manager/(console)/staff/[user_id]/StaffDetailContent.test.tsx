import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import StaffDetailContent from '@/app/manager/(console)/staff/[user_id]/StaffDetailContent';
import { renderAsAccount, STAFF_ID, staffDetail } from '../../staff-fixture';

const api = vi.hoisted(() => ({
    getManagerStaff: vi.fn(),
    updateManagerStaff: vi.fn(),
    updateManagerStaffState: vi.fn(),
    resetManagerStaffPassword: vi.fn(),
    deleteManagerStaff: vi.fn(),
}));
const {push} = vi.hoisted(() => ({push: vi.fn()}));

vi.mock('@/contracts/manager/api', () => api);
vi.mock('next/navigation', () => ({useRouter: () => ({push})}));

/**
 * 업체 총관리자로 화면을 그리고 상세를 기다린다
 */
async function renderDetail(): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = renderAsAccount(<StaffDetailContent userId={STAFF_ID} />, 'HEAD_MANAGER');
    });
    return container;
}

/**
 * 열린 확인 창의 버튼을 누른다
 *
 * @param name 버튼 이름
 */
async function confirm(name: string): Promise<void> {
    const dialog = within(document.querySelector('dialog[open]') as HTMLElement);
    await act(async () => {
        fireEvent.click(dialog.getByRole('button', {name}));
    });
}

beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.getManagerStaff.mockResolvedValue(staffDetail());
    api.updateManagerStaff.mockResolvedValue(null);
    api.updateManagerStaffState.mockResolvedValue(null);
    api.resetManagerStaffPassword.mockResolvedValue(null);
    api.deleteManagerStaff.mockResolvedValue(null);
    push.mockClear();
});

describe('StaffDetailContent', () => {
    it('[SUCCESS] 이름 · 휴대폰을 고쳐 저장한다 → 수정(큐) 1번(그 회원 — 이름 · 숫자만 휴대폰 · 성별 · 생년월일) → 상세 다시', async () => {
        await renderDetail();
        expect(api.getManagerStaff).toHaveBeenCalledTimes(1);
        expect(api.getManagerStaff.mock.calls[0][1]).toBe(STAFF_ID);

        fireEvent.change(screen.getByLabelText(/이름/), {target: {value: ' 문태오B '}});
        fireEvent.change(screen.getByLabelText(/휴대폰 번호/), {target: {value: '010-9054-3318'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '저장'}));
        });

        expect(api.updateManagerStaff).toHaveBeenCalledTimes(1);
        expect(api.updateManagerStaff.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(api.updateManagerStaff.mock.calls[0][1]).toBe(STAFF_ID);
        expect(JSON.parse(JSON.stringify(api.updateManagerStaff.mock.calls[0][2]))).toEqual({name: '문태오B', phone: '01090543318', gender: 'M', birth: '1995-04-17'});
        expect(api.getManagerStaff).toHaveBeenCalledTimes(2);
    });

    it('[FAIL:validation] 휴대폰을 7자리로 저장한다 → 칸 옆 "휴대폰 번호를 숫자만 정확히 입력해주세요.", 수정 0번', async () => {
        const container = await renderDetail();

        fireEvent.change(screen.getByLabelText(/휴대폰 번호/), {target: {value: '0101234'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '저장'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="phone"]') as HTMLElement).innerText).toBe('휴대폰 번호를 숫자만 정확히 입력해주세요.');
        expect(api.updateManagerStaff).not.toHaveBeenCalled();
        expect(api.getManagerStaff).toHaveBeenCalledTimes(1);
    });

    it('[SUCCESS] 정지 사유를 넣고 정지한다 → 확인 뒤 상태(큐) 1번(그 회원 — BLOCK · 사유) → 상세 다시', async () => {
        await renderDetail();

        fireEvent.change(screen.getByLabelText(/정지 사유/), {target: {value: ' 근무 종료 '}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '정지'}));
        });
        expect(api.updateManagerStaffState).not.toHaveBeenCalled();
        await confirm('정지');

        expect(api.updateManagerStaffState).toHaveBeenCalledTimes(1);
        expect(api.updateManagerStaffState.mock.calls[0][1]).toBe(STAFF_ID);
        expect(JSON.parse(JSON.stringify(api.updateManagerStaffState.mock.calls[0][2]))).toEqual({state_id: 'BLOCK', block_comment: '근무 종료'});
        expect(api.getManagerStaff).toHaveBeenCalledTimes(2);
    });

    it('[SUCCESS] 비밀번호를 초기화한다 → 확인 뒤 초기화(큐) 1번(그 회원) → "임시 비밀번호를 보냈습니다." → 상세 다시', async () => {
        await renderDetail();

        fireEvent.click(screen.getByRole('button', {name: '비밀번호 초기화'}));
        expect(api.resetManagerStaffPassword).not.toHaveBeenCalled();
        await confirm('초기화');

        expect(api.resetManagerStaffPassword).toHaveBeenCalledTimes(1);
        expect(api.resetManagerStaffPassword.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(api.resetManagerStaffPassword.mock.calls[0][1]).toBe(STAFF_ID);
        expect(screen.getByText('임시 비밀번호를 보냈습니다.')).toBeTruthy();
        expect(api.getManagerStaff).toHaveBeenCalledTimes(2);
    });

    it('[SUCCESS] 계정을 지운다 → 확인 뒤 삭제(큐) 1번(그 회원) → 목록 주소로 이동', async () => {
        await renderDetail();

        fireEvent.click(screen.getByRole('button', {name: '삭제'}));
        await confirm('삭제');

        expect(api.deleteManagerStaff).toHaveBeenCalledTimes(1);
        expect(api.deleteManagerStaff.mock.calls[0][1]).toBe(STAFF_ID);
        expect(push).toHaveBeenCalledTimes(1);
        expect(push).toHaveBeenCalledWith('/manager/staff/');
    });
});
