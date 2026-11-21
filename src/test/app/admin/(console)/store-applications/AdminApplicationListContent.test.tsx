import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import AdminApplicationListContent from '@/app/admin/(console)/store-applications/AdminApplicationListContent';
import { applicationList, renderWithAdmin, STORE_ID } from '../admin-fixture';

const {getStoreApplications} = vi.hoisted(() => ({getStoreApplications: vi.fn()}));

vi.mock('@/contracts/store/api', () => ({getStoreApplications}));

beforeEach(() => {
    getStoreApplications.mockReset().mockResolvedValue(applicationList());
});

describe('AdminApplicationListContent', () => {
    it('[SUCCESS] "대기"를 고르고 검색어로 조회한다 → 목록 다시(대기 · 검색어 · 1쪽) · 표(번호 · 사업자등록번호 · 업체 보기)', async () => {
        await act(async () => {
            renderWithAdmin(<AdminApplicationListContent />);
        });
        expect(getStoreApplications).toHaveBeenCalledTimes(1);
        expect(getStoreApplications.mock.calls[0][0]).toMatchObject({token: 'admin-token'});
        expect({...getStoreApplications.mock.calls[0][1]}).toMatchObject({page: 1, size: 20, store_application_state_id: null, keyword: null});

        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['14', '무인텔 온담 홍대점', '214-87-12345', '박진우', '대기', '2026-11-09 21:14', '—', '—']);
        expect(within(rows[2]).getByRole('link', {name: '업체 보기'}).getAttribute('href')).toBe(`/admin/stores/${STORE_ID}/`);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '대기'}));
        });
        fireEvent.change(screen.getByRole('searchbox', {name: '검색어'}), {target: {value: ' 온담 '}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '조회'}));
        });

        expect(getStoreApplications).toHaveBeenCalledTimes(3);
        expect({...getStoreApplications.mock.calls[1][1]}).toMatchObject({page: 1, store_application_state_id: 'WAIT', keyword: null});
        expect({...getStoreApplications.mock.calls[2][1]}).toMatchObject({page: 1, size: 20, store_application_state_id: 'WAIT', keyword: '온담'});
        expect(screen.getByRole('button', {name: '대기'}).getAttribute('aria-pressed')).toBe('true');
    });
});
