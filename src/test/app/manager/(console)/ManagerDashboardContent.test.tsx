import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import ManagerDashboardContent from '@/app/manager/(console)/ManagerDashboardContent';
import { ManagerConsoleContext } from '@/app/manager/(console)/manager-console-context';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {getMyStats} = vi.hoisted(() => ({getMyStats: vi.fn()}));

vi.mock('@/contracts/stats/api', () => ({getMyStats}));
vi.mock('@/shared/components/chart/BarChart', () => ({default: ({label}: {label: string}) => <div role="img" aria-label={label} />}));

/** 로그인한 매니저 */
const AUTH: AuthContextType = {area: 'manager', token: 'manager-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/** 콘솔 틀이 읽은 내 업체 — 영업 중 */
const ACTIVE_STORE = {store_id: 's'.repeat(32), store_code: 'c'.repeat(32), store_name: '스테이 리프 강남역점', store_state_id: 'ACTIVE', suspend_comment: null} as unknown as StoreMineResultDto;

/**
 * 한 달 통계
 *
 * @param month YYYY-MM
 * @param paid 결제액
 * @param refund 환불액
 */
function month(month: string, paid: number, refund: number): Record<string, unknown> {
    return {month, user_count: 10, completed_count: 12, paid_amount: paid, refund_amount: refund, profit: paid - refund};
}

/** 받은 통계 — 최근 3개월 · 실결제 */
const STATS = {
    period: {start_month: '2026-09', end_month: '2026-11', environment: 'LIVE'},
    store: {store_id: 's'.repeat(32), store_name: '스테이 리프 강남역점'},
    total: {user_count: 28, completed_count: 36, paid_amount: 12370000, refund_amount: 474000, profit: 11896000},
    monthly: [month('2026-09', 3870000, 141000), month('2026-10', 4350000, 189000), month('2026-11', 4150000, 144000)],
};

beforeEach(() => {
    getMyStats.mockReset().mockResolvedValue(STATS);
});

describe('ManagerDashboardContent', () => {
    it('[SUCCESS] 영업 중인 업체로 들어온다 → 통계 1번(기간 비움 · 실결제) → 받은 기간을 칸에 · 합계 카드 · 월별 표(합계 칸), 영업중지 띠 없음', async () => {
        await act(async () => {
            render(
                <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                    <ManagerConsoleContext.Provider value={{store: ACTIVE_STORE, account: null, accountLoaded: true, reloadStore: vi.fn()}}>
                        <ManagerDashboardContent />
                    </ManagerConsoleContext.Provider>
                </RootLayoutProvider>,
            );
        });

        expect(getMyStats).toHaveBeenCalledTimes(1);
        expect(getMyStats.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect({...getMyStats.mock.calls[0][1]}).toEqual({start_month: null, end_month: null, environment: 'LIVE'});
        expect((screen.getByLabelText('시작 달') as HTMLInputElement).value).toBe('2026-09');
        expect((screen.getByLabelText('끝 달') as HTMLInputElement).value).toBe('2026-11');
        const kpis = within(screen.getByRole('region', {name: '합계'}));
        expect(kpis.getByText('결제액').nextElementSibling?.textContent).toBe('12,370,000원');
        expect(kpis.getByText('수익').nextElementSibling?.textContent).toBe('11,896,000원');
        expect(screen.getByRole('img', {name: '2026-09 ~ 2026-11 월별 결제액과 환불액'})).toBeTruthy();
        const table = screen.getByRole('table');
        expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['항목', '2026-09', '2026-10', '2026-11', '합계']);
        const paidRow = within(table).getByRole('row', {name: /결제액\(원\)/});
        expect(within(paidRow).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['3,870,000', '4,350,000', '4,150,000', '12,370,000']);
        expect(screen.queryByText('영업중지된 업체입니다.')).toBeNull();
    });
});
