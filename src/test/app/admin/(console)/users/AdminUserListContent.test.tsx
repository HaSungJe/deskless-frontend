import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import AdminUserListContent from '@/app/admin/(console)/users/AdminUserListContent';
import { renderWithAdmin, USER_ID, userList } from '../admin-fixture';

const {getUsers} = vi.hoisted(() => ({getUsers: vi.fn()}));

vi.mock('@/contracts/user/api', () => ({getUsers}));

beforeEach(() => {
    getUsers.mockReset().mockResolvedValue(userList());
});

describe('AdminUserListContent', () => {
    it('[SUCCESS] 정지 · 카카오를 고르고 검색어로 조회한다 → 목록 다시(정지 · 카카오 · 검색어 · 1쪽) · 표 글자(번호 · 검색 코드 없음 · 미인증 · 탈퇴 —)', async () => {
        await act(async () => {
            renderWithAdmin(<AdminUserListContent />);
        });

        expect(getUsers).toHaveBeenCalledTimes(1);
        expect(getUsers.mock.calls[0][0]).toMatchObject({token: 'admin-token'});
        expect({...getUsers.mock.calls[0][1]}).toMatchObject({page: 1, size: 20, state_id: null, sns_id: null, keyword: null});
        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['14', '새벽기차', '정민지', '미인증', '카카오', '정상', '2026-11-10 08:12']);
        expect(within(rows[2]).getByRole('link', {name: '여행하는고양이'}).getAttribute('href')).toBe(`/admin/users/${USER_ID}/`);
        expect(within(rows[2]).getAllByRole('cell')[3].textContent).toBe('010-1234-5678');
        expect(within(rows[3]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['12', '느린걸음', '장예린', '—', '카카오', '탈퇴', '2026-06-11 12:20']);

        await act(async () => {
            fireEvent.click(within(screen.getByRole('group', {name: '회원 상태'})).getByRole('button', {name: '정지'}));
        });
        await act(async () => {
            fireEvent.change(screen.getByLabelText('SNS'), {target: {value: 'KAKAO'}});
        });
        fireEvent.change(screen.getByRole('searchbox', {name: '검색어'}), {target: {value: '하늘 '}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '조회'}));
        });

        expect(getUsers).toHaveBeenCalledTimes(4);
        expect({...getUsers.mock.calls[3][1]}).toMatchObject({page: 1, size: 20, state_id: 'BLOCK', sns_id: 'KAKAO', keyword: '하늘'});
    });
});
