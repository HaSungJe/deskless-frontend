import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import AdminManagerListContent from '@/app/admin/(console)/managers/AdminManagerListContent';
import { MANAGER_ID, managerList, renderWithAdmin, STORE_ID, storeList } from '../admin-fixture';

const {getManagerAccounts, getStores} = vi.hoisted(() => ({getManagerAccounts: vi.fn(), getStores: vi.fn()}));

vi.mock('@/contracts/manager/api', () => ({getManagerAccounts}));
vi.mock('@/contracts/store/api', () => ({getStores}));

/**
 * 목록을 그리고 처음 목록 · 업체 고르기를 기다린다
 *
 * @param storeId 주소의 업체
 */
async function renderList(storeId: string | null): Promise<void> {
    await act(async () => {
        renderWithAdmin(<AdminManagerListContent storeId={storeId} />);
    });
}

beforeEach(() => {
    getManagerAccounts.mockReset().mockResolvedValue(managerList());
    getStores.mockReset().mockResolvedValue(storeList());
});

describe('AdminManagerListContent', () => {
    it('[SUCCESS] 업체(쳐서 검색) · 총괄매니저 · 정지를 고르고 검색어로 조회한다 → 업체 전부 1번 · 목록 다시(그 업체 · 권한 · 상태 · 검색어 · 1쪽) · 표 글자', async () => {
        await renderList(null);

        // 업체 고르기 — 업체 전부(페이지 없이)
        expect(getStores).toHaveBeenCalledTimes(1);
        expect(getStores.mock.calls[0][0]).toMatchObject({token: 'admin-token'});
        expect({...getStores.mock.calls[0][1]}).toMatchObject({all_search_yn: 'Y'});
        const storeBox = screen.getByRole('combobox', {name: '업체'}) as HTMLInputElement;
        expect(storeBox.value).toBe('전체 업체');

        // 처음 목록 · 표
        expect(getManagerAccounts).toHaveBeenCalledTimes(1);
        expect({...getManagerAccounts.mock.calls[0][1]}).toMatchObject({page: 1, size: 20, store_id: null, auth_id: null, state_id: null, keyword: null});
        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['14', '무인텔 하루 대전역점영업중지', 'haru_daejeon', '한지호', '010-6789-0123', '총괄매니저', '정지임시 비밀번호', '2026-10-20 12:00']);
        expect(within(rows[1]).getByRole('link', {name: '한지호'}).getAttribute('href')).toBe(`/admin/managers/${MANAGER_ID}/`);
        expect(within(rows[2]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['13', '스테이 리프 강남역점', 'sm_night', '박재훈', '—', '매니저', '정상', '2026-11-01 18:44']);

        // 업체(쳐서 거른 뒤 고름) → 권한 → 상태 → 검색어
        fireEvent.click(storeBox);
        expect(within(screen.getByRole('listbox', {name: '업체'})).getAllByRole('option').map((option) => option.textContent)).toEqual(['전체 업체', '스테이 리프 강남역점', '리프룸 광안리점']);
        fireEvent.change(storeBox, {target: {value: '강남'}});
        expect(within(screen.getByRole('listbox', {name: '업체'})).getAllByRole('option').map((option) => option.textContent)).toEqual(['스테이 리프 강남역점']);
        await act(async () => {
            fireEvent.click(screen.getByRole('option', {name: '스테이 리프 강남역점'}));
        });
        expect(getManagerAccounts).toHaveBeenCalledTimes(2);
        expect({...getManagerAccounts.mock.calls[1][1]}).toMatchObject({page: 1, store_id: STORE_ID});
        await act(async () => {
            fireEvent.click(within(screen.getByRole('group', {name: '권한'})).getByRole('button', {name: '총괄매니저'}));
        });
        await act(async () => {
            fireEvent.click(within(screen.getByRole('group', {name: '계정 상태'})).getByRole('button', {name: '정지'}));
        });
        fireEvent.change(screen.getByRole('searchbox', {name: '검색어'}), {target: {value: ' 하루 '}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '조회'}));
        });

        expect(getManagerAccounts).toHaveBeenCalledTimes(5);
        expect({...getManagerAccounts.mock.calls[4][1]}).toMatchObject({page: 1, size: 20, store_id: STORE_ID, auth_id: 'HEAD_MANAGER', state_id: 'BLOCK', keyword: '하루'});
        expect(getStores).toHaveBeenCalledTimes(1);
    });

    it('[SUCCESS] 업체 상세에서 "이 업체의 업체 관리자"로 들어온다 → 업체 칸에 그 업체 · 첫 목록부터 그 업체 · 1쪽', async () => {
        await renderList(STORE_ID);

        expect(getManagerAccounts).toHaveBeenCalledTimes(1);
        expect({...getManagerAccounts.mock.calls[0][1]}).toMatchObject({page: 1, store_id: STORE_ID, auth_id: null, state_id: null, keyword: null});
        expect((screen.getByRole('combobox', {name: '업체'}) as HTMLInputElement).value).toBe('스테이 리프 강남역점');
    });
});
