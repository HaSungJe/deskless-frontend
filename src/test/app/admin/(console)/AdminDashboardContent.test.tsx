import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import AdminDashboardContent from '@/app/admin/(console)/AdminDashboardContent';
import { renderWithAdmin, STORE_ID, statsResult } from './admin-fixture';

const {getStats} = vi.hoisted(() => ({getStats: vi.fn()}));

vi.mock('@/contracts/stats/api', () => ({getStats}));
vi.mock('@/shared/components/chart/BarChart', () => ({default: ({label}: {label: string}) => <div role="img" aria-label={label} />}));

/**
 * 대시보드를 그리고 처음 통계를 기다린다
 */
async function renderDashboard(): Promise<void> {
    await act(async () => {
        renderWithAdmin(<AdminDashboardContent />);
    });
}

beforeEach(() => {
    getStats.mockReset().mockResolvedValue(statsResult());
});

describe('AdminDashboardContent', () => {
    it('[SUCCESS] 처음 들어온 뒤 기간 · 테스트 결제 · 모든 업체를 골라 조회한다 → 처음 1번(기간 없음 · 실결제 · 활동 업체만 · 1쪽) · 조회 1번(고른 조건 · 1쪽) · 합계 · 월별 표 · 업체별 표', async () => {
        await renderDashboard();

        expect(getStats).toHaveBeenCalledTimes(1);
        expect(getStats.mock.calls[0][0]).toMatchObject({token: 'admin-token'});
        expect({...getStats.mock.calls[0][1]}).toMatchObject({start_month: null, end_month: null, environment: 'LIVE', has_activity: '1', page: 1, size: 20});
        expect((screen.getByLabelText('시작 달') as HTMLInputElement).value).toBe('2026-09');
        expect((screen.getByLabelText('끝 달') as HTMLInputElement).value).toBe('2026-11');

        fireEvent.change(screen.getByLabelText('시작 달'), {target: {value: '2026-06'}});
        fireEvent.click(within(screen.getByRole('radiogroup', {name: '결제 환경'})).getByRole('radio', {name: '테스트 결제'}));
        fireEvent.click(within(screen.getByRole('radiogroup', {name: '업체 범위'})).getByRole('radio', {name: '모든 업체'}));
        expect(getStats).toHaveBeenCalledTimes(1);
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '조회'}));
        });

        expect(getStats).toHaveBeenCalledTimes(2);
        expect({...getStats.mock.calls[1][1]}).toMatchObject({start_month: '2026-06', end_month: '2026-11', environment: 'TEST', has_activity: '0', page: 1, size: 20});

        // 합계 카드
        const kpis = within(screen.getByRole('region', {name: '합계'}));
        expect(kpis.getByText('이용자 수').nextElementSibling?.textContent).toBe('302명');
        expect(kpis.getByText('수익').nextElementSibling?.textContent).toBe('29,000,000원');
        expect(screen.getByRole('img', {name: '2026-09 ~ 2026-11 월별 결제액과 환불액'})).toBeTruthy();

        // 월별 표 — 달마다 한 줄 + 합계 줄
        const [monthTable, storeTable] = screen.getAllByRole('table');
        expect(within(monthTable).getAllByRole('rowheader').map((cell) => cell.textContent)).toEqual(['2026-09', '2026-10', '2026-11', '합계']);
        const totalRow = within(monthTable).getByRole('row', {name: /합계/});
        expect(within(totalRow).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['302', '450', '30,500,000', '1,500,000', '29,000,000']);

        // 업체별 표 — 상호명 → 업체 상세, 음수 수익
        const storeRows = within(storeTable).getAllByRole('row');
        expect(within(storeRows[1]).getByRole('link', {name: '스테이 리프 강남역점'}).getAttribute('href')).toBe(`/admin/stores/${STORE_ID}/`);
        expect(within(storeRows[2]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['무인텔 하루 대전역점', '영업중지', '3', '3', '60,000', '380,000', '-320,000']);
    });

    it('[SUCCESS] 업체별 표를 2쪽으로 넘긴다 → 마지막으로 조회한 조건 그대로 2쪽(칸만 고친 값은 쓰지 않는다)', async () => {
        await renderDashboard();

        fireEvent.change(screen.getByLabelText('시작 달'), {target: {value: '2026-01'}});
        fireEvent.click(within(screen.getByRole('radiogroup', {name: '결제 환경'})).getByRole('radio', {name: '테스트 결제'}));
        await act(async () => {
            fireEvent.click(within(screen.getByRole('navigation', {name: '업체별 통계 페이지'})).getByRole('button', {name: '2'}));
        });

        expect(getStats).toHaveBeenCalledTimes(2);
        expect({...getStats.mock.calls[1][1]}).toMatchObject({start_month: null, end_month: null, environment: 'LIVE', has_activity: '1', page: 2, size: 20});
    });
});
