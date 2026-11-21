import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import AdminStoreListContent from '@/app/admin/(console)/stores/AdminStoreListContent';
import { renderWithAdmin, STORE_ID, storeList } from '../admin-fixture';

const {getStores} = vi.hoisted(() => ({getStores: vi.fn()}));

vi.mock('@/contracts/store/api', () => ({getStores}));

beforeEach(() => {
    getStores.mockReset().mockResolvedValue(storeList());
});

describe('AdminStoreListContent', () => {
    it('[SUCCESS] "영업중지"를 고르고 검색어로 조회한다 → 목록 다시(영업중지 · 검색어 · 1쪽) · 표(업체코드 앞 8자 · 탈퇴 업체 DELETE_ 줄임)', async () => {
        await act(async () => {
            renderWithAdmin(<AdminStoreListContent />);
        });
        expect(getStores).toHaveBeenCalledTimes(1);
        expect(getStores.mock.calls[0][0]).toMatchObject({token: 'admin-token'});
        expect({...getStores.mock.calls[0][1]}).toMatchObject({page: 1, size: 20, store_state_id: null, keyword: null});

        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['7a4c9e2b…', '스테이 리프 강남역점', '120-88-45678', '김현석', '02-555-0123', '서울특별시 강남구 강남대로 123', '영업중', '활성']);
        expect(within(rows[1]).getByRole('link', {name: '스테이 리프 강남역점'}).getAttribute('href')).toBe(`/admin/stores/${STORE_ID}/`);
        expect(within(rows[2]).getAllByRole('cell')[2].textContent).toBe('DELETE_eeeeeeee…');

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '영업중지'}));
        });
        fireEvent.change(screen.getByRole('searchbox', {name: '검색어'}), {target: {value: '리프'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '조회'}));
        });

        expect(getStores).toHaveBeenCalledTimes(3);
        expect({...getStores.mock.calls[2][1]}).toMatchObject({page: 1, size: 20, store_state_id: 'SUSPEND', keyword: '리프'});
    });
});
