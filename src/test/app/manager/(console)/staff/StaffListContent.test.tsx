import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import StaffListContent from '@/app/manager/(console)/staff/StaffListContent';
import { renderAsAccount, staffList } from '../staff-fixture';

const {getManagerStaffs, createManagerStaff, push} = vi.hoisted(() => ({
    getManagerStaffs: vi.fn(),
    createManagerStaff: vi.fn(),
    push: vi.fn(),
}));

vi.mock('@/contracts/manager/api', () => ({getManagerStaffs, createManagerStaff}));
vi.mock('next/navigation', () => ({useRouter: () => ({push})}));

/** 등록된 회원 ID */
const CREATED_ID = 'c'.repeat(32);

/**
 * 화면을 그리고 첫 목록을 기다린다
 *
 * @param authId 로그인 때 기억한 권한 — null 이면 계정 쿠키를 아직 읽는 중
 */
async function renderList(authId: string | null = 'HEAD_MANAGER'): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = renderAsAccount(<StaffListContent />, authId);
    });
    return container;
}

/**
 * 등록 대화상자를 열어 칸을 채운다
 *
 * @param loginId 아이디 칸 글자
 */
function fillCreate(loginId: string): ReturnType<typeof within> {
    fireEvent.click(screen.getByRole('button', {name: '업체 관리자 등록'}));
    const dialog = within(document.querySelector('dialog[open]') as HTMLElement);
    fireEvent.change(dialog.getByLabelText(/아이디/), {target: {value: loginId}});
    fireEvent.change(dialog.getByLabelText(/이름/), {target: {value: ' 한도윤 '}});
    fireEvent.change(dialog.getByLabelText(/휴대폰 번호/), {target: {value: '010-5530-1942'}});
    fireEvent.click(dialog.getByRole('radio', {name: '여'}));
    fireEvent.change(dialog.getByLabelText(/생년월일/), {target: {value: '1998-09-03'}});
    return dialog;
}

beforeEach(() => {
    getManagerStaffs.mockReset().mockResolvedValue(staffList());
    createManagerStaff.mockReset().mockResolvedValue({user_id: CREATED_ID});
    push.mockClear();
});

describe('StaffListContent', () => {
    it('[SUCCESS] 업체 관리자를 등록한다 → 등록(큐) 1번(아이디 · 이름 · 숫자만 휴대폰 · 성별 · 생년월일) → 받은 회원 상세 주소로 이동', async () => {
        await renderList();
        expect(getManagerStaffs).toHaveBeenCalledTimes(1);
        expect(screen.getByText('leaf_gangnam').closest('a')).toBeNull();
        expect(screen.getByRole('link', {name: 'leaf_front01'}).getAttribute('href')).toContain('/manager/staff/');

        const dialog = fillCreate('leaf_front05');
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '등록'}));
        });

        expect(createManagerStaff).toHaveBeenCalledTimes(1);
        expect(createManagerStaff.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(JSON.parse(JSON.stringify(createManagerStaff.mock.calls[0][1]))).toEqual({login_id: 'leaf_front05', name: '한도윤', phone: '01055301942', gender: 'F', birth: '1998-09-03'});
        expect(push).toHaveBeenCalledTimes(1);
        expect(push).toHaveBeenCalledWith(`/manager/staff/${CREATED_ID}/`);
    });

    it('[FAIL:validation] 아이디를 3자로 등록한다 → 칸 옆 "아이디는 영문 · 숫자 · _ 4~30자로 입력해주세요.", 등록 0번', async () => {
        const container = await renderList();

        const dialog = fillCreate('abc');
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '등록'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="login_id"]') as HTMLElement).innerText).toBe('아이디는 영문 · 숫자 · _ 4~30자로 입력해주세요.');
        expect(createManagerStaff).not.toHaveBeenCalled();
        expect(push).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 업체 관리자 계정으로 연다 → 안내만, 목록 0번', async () => {
        await renderList('MANAGER');

        expect(screen.getByText('업체 총관리자만 볼 수 있는 화면입니다.')).toBeTruthy();
        expect(screen.queryByRole('button', {name: '업체 관리자 등록'})).toBeNull();
        expect(getManagerStaffs).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 계정 쿠키를 아직 읽는 중이다 → 안내도 목록도 그리지 않고, 목록 0번', async () => {
        await renderList(null);

        expect(screen.queryByText('업체 총관리자만 볼 수 있는 화면입니다.')).toBeNull();
        expect(screen.queryByRole('button', {name: '업체 관리자 등록'})).toBeNull();
        expect(getManagerStaffs).not.toHaveBeenCalled();
    });
});
