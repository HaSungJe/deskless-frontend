'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { getStats } from '@/contracts/stats/api';
import { StatsDto, StatsResultDto } from '@/contracts/stats/dto/stats.dto';
import { STATS_SUMMARY_ITEMS } from '@/contracts/stats/stats.constants';
import { handleApiError } from '@/shared/api/error';
import BarChart from '@/shared/components/chart/BarChart';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Segmented, { SegmentedOptionType } from '@/shared/components/ui/form/Segmented';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatManwon } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { storePath } from './admin-paths';
import { STORE_STATE_TONE } from './stores/store-format';
import styles from '@/app/css/admin/AdminDashboardContent.module.css';

/** 결제 환경 */
type EnvironmentType = 'LIVE' | 'TEST';

/** 업체 범위 — 1 활동 업체만 · 0 모든 업체 */
type ActivityType = '1' | '0';

/** 결제 환경 고르기 */
const ENVIRONMENT_OPTIONS: Array<SegmentedOptionType<EnvironmentType>> = [{value: 'LIVE', label: '실결제'}, {value: 'TEST', label: '테스트 결제'}];

/** 업체 범위 고르기 — 업체별 표에만 쓰인다 */
const ACTIVITY_OPTIONS: Array<SegmentedOptionType<ActivityType>> = [{value: '1', label: '활동 업체만'}, {value: '0', label: '모든 업체'}];

/** 업체별 표 한 쪽 개수 */
const STORE_PAGE_SIZE = 20;

/** 숫자 쉼표 */
const NUMBER_FORMAT = new Intl.NumberFormat('ko-KR');

/**
 * 값 칸 클래스 — 음수(수익)는 위험색
 *
 * @param value 값
 * @param base 기본 클래스
 */
function amountClass(value: number, base: string): string {
    return value < 0 ? `${base} ${styles.negative}` : base;
}

/**
 * A2 대시보드 — 기간 · 결제 환경 · 업체 범위 → 전체 통계(합계 카드 · 월별 그래프 · 월별 표 · 업체별 표)
 * - 조회는 제출한 조건(query)이 바뀔 때만 — 칸을 고치는 동안은 부르지 않는다(업체 관리자 대시보드와 같다)
 * - 쪽 넘기기는 제출한 조건에 쪽만 바꾼 새 StatsDto — 칸에서 고치던 값이 섞이지 않는다
 *
 * @returns
 */
export default function AdminDashboardContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                      // 관리자 토큰
    const loadStats = useEffectEvent((query: StatsDto, signal: AbortSignal) => getStats(auth, query, signal)); // 그때의 auth 로

    // 상태
    const [startMonth, setStartMonth] = useState<string>('');                                  // 시작 달 칸(YYYY-MM)
    const [endMonth, setEndMonth] = useState<string>('');                                      // 끝 달 칸
    const [environment, setEnvironment] = useState<EnvironmentType>('LIVE');                   // 결제 환경 칸
    const [activity, setActivity] = useState<ActivityType>('1');                               // 업체 범위 칸
    const [query, setQuery] = useState<StatsDto>(() => new StatsDto({size: STORE_PAGE_SIZE})); // 제출한 조건 · 업체별 쪽 — 처음은 기간 비움 · 실결제 · 활동 업체만 · 1쪽
    const [stats, setStats] = useState<StatsResultDto | null>(null);                           // 받은 통계

    // 계산 값
    const months = stats?.monthly ?? [];     // 월별(오래된 달부터)
    const stores = stats?.stores.list ?? []; // 업체별(수익 많은 순)
    const chartSeries = [
        {name: '결제액', data: months.map((month) => month.paid_amount), colorVar: '--primary'},
        {name: '환불액', data: months.map((month) => month.refund_amount), colorVar: '--warn'},
    ];                                       // ④ 월별 결제액 · 환불액 막대(사용자 결정 — M2 와 같이 나란히)

    // 효과
    useEffect(() => {
        // ①③⑤ 제출한 조건으로 통계 — 받은 기간을 달 칸에 채운다(떠나거나 다시 조회하면 결과를 버린다)
        const controller = new AbortController();
        loadStats(query, controller.signal).then((next) => {
            if (controller.signal.aborted || !next) {
                return;
            }

            setStats(next);
            setStartMonth(next.period.start_month);
            setEndMonth(next.period.end_month);
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [query]);

    // 함수
    async function search(): Promise<void> {
        // ③ 칸 값 · 1쪽으로 다시 — 비운 달은 null(최근 3개월), 검사 뒤 제출
        const dto = new StatsDto({start_month: startMonth || null, end_month: endMonth || null, environment, has_activity: activity, size: STORE_PAGE_SIZE});
        if (!(await validateAction(dto))) {
            return;
        }

        setQuery(dto);
    }

    function movePage(page: number): void {
        // ⑤ 마지막으로 조회한 조건 그대로 다른 쪽
        setQuery((prev) => new StatsDto({...prev, page}));
    }

    return (
        // 대시보드
        <div className={styles.page}>
            {/* 제목 — 받은 기간 · 결제 환경 */}
            <div>
                <h1 className={styles.title}>대시보드</h1>
                <p className={styles.subtitle}>{stats ? `${stats.period.start_month} ~ ${stats.period.end_month} · ${lookupName('environment', stats.period.environment)} · ` : ''}한국 시각 달 기준 전체 업체 통계</p>
            </div>

            {/* ②③ 조회 조건 */}
            <div className={styles.filter}>
                <Field label="시작 달" name="start_month" htmlFor="admin-dashboard-start">
                    <Input id="admin-dashboard-start" type="month" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} />
                </Field>
                <span className={styles.tilde} aria-hidden="true">~</span>
                <Field label="끝 달" name="end_month" htmlFor="admin-dashboard-end">
                    <Input id="admin-dashboard-end" type="month" value={endMonth} onChange={(event) => setEndMonth(event.target.value)} />
                </Field>
                <Field label="결제 환경" name="environment" group>
                    <Segmented label="결제 환경" options={ENVIRONMENT_OPTIONS} value={environment} onChange={setEnvironment} />
                </Field>
                <Field label="업체 범위" name="has_activity" group>
                    <Segmented label="업체 범위" options={ACTIVITY_OPTIONS} value={activity} onChange={setActivity} />
                </Field>
                <Button variant="primary" onClick={search}>조회</Button>
                <p className={styles.filterNote}>기간을 비우면 최근 3개월, 한 번에 최대 12개월. 업체 범위는 아래 업체별 표에만 적용됩니다.</p>
            </div>

            {stats ? (
                <>
                    {/* ④ 합계 카드 */}
                    <section className={styles.kpis} aria-label="합계">
                        {STATS_SUMMARY_ITEMS.map((item) => (
                            <div key={item.key} className={styles.kpi}>
                                <span className={styles.kpiLabel}>{item.label}</span>
                                <span className={amountClass(stats.total[item.key], item.key === 'profit' ? `${styles.kpiValue} ${styles.profit}` : styles.kpiValue)}>{NUMBER_FORMAT.format(stats.total[item.key])}<small>{item.unit}</small></span>
                            </div>
                        ))}
                    </section>

                    {/* ④ 월별 결제액 · 환불액 */}
                    <Card title="월별 결제액 · 환불액">
                        <BarChart label={`${stats.period.start_month} ~ ${stats.period.end_month} 월별 결제액과 환불액`} categories={months.map((month) => month.month)} series={chartSeries} height={290} formatValue={formatManwon} />
                    </Card>

                    {/* ④ 월별 표 — 달마다 한 줄 + 합계 줄(시안 A2) */}
                    <Card title="월별 통계">
                        <Table>
                            <thead>
                                <tr>
                                    <th scope="col">달</th>
                                    {STATS_SUMMARY_ITEMS.map((item) => <th key={item.key} scope="col" className={styles.number}>{item.label}({item.unit})</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {months.map((month) => (
                                    <tr key={month.month}>
                                        <th scope="row">{month.month}</th>
                                        {STATS_SUMMARY_ITEMS.map((item) => <td key={item.key} className={amountClass(month[item.key], styles.number)}>{NUMBER_FORMAT.format(month[item.key])}</td>)}
                                    </tr>
                                ))}
                                <tr>
                                    <th scope="row">합계</th>
                                    {STATS_SUMMARY_ITEMS.map((item) => <td key={item.key} className={amountClass(stats.total[item.key], styles.number)}><b>{NUMBER_FORMAT.format(stats.total[item.key])}</b></td>)}
                                </tr>
                            </tbody>
                        </Table>
                        <p className={styles.tableNote}>합계의 이용자 수는 기간 전체에서 겹치는 이용자를 한 번만 세어 달별 합과 다릅니다. 이용자 수 · 이용 건수는 이용 끝이 그 달인 이용 완료 예약, 결제액은 승인 시각, 환불액은 환불 신청 시각 기준. 수익 = 결제액 − 환불액(음수일 수 있다).</p>
                    </Card>

                    {/* ④⑤⑥ 업체별 표 */}
                    <Card title="업체별 통계">
                        {stores.length === 0 ? <EmptyState title="기간 안에 활동한 업체가 없습니다." /> : (
                            <Table>
                                <thead>
                                    <tr>
                                        <th scope="col">업체</th>
                                        <th scope="col">상태</th>
                                        {STATS_SUMMARY_ITEMS.map((item) => <th key={item.key} scope="col" className={styles.number}>{item.label}({item.unit})</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {stores.map((store) => (
                                        <tr key={store.store_id}>
                                            <td><Link href={storePath(store.store_id)}>{store.store_name}</Link></td>
                                            <td><Badge tone={STORE_STATE_TONE[store.store_state_id] ?? 'neutral'}>{lookupName('store_state_id', store.store_state_id)}</Badge></td>
                                            {STATS_SUMMARY_ITEMS.map((item) => <td key={item.key} className={amountClass(store[item.key], styles.number)}>{NUMBER_FORMAT.format(store[item.key])}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                        <Pagination pagination={stats.stores.pagination} movePage={(next) => movePage(Number(next))} label="업체별 통계 페이지" />
                    </Card>
                </>
            ) : null}
        </div>
    );
}
