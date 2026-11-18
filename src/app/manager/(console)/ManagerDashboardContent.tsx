'use client';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getMyStats } from '@/contracts/stats/api';
import { StatsMineDto, StatsMineResultDto, StatsMineSummaryResultDto } from '@/contracts/stats/dto/stats-mine.dto';
import { handleApiError } from '@/shared/api/error';
import BarChart from '@/shared/components/chart/BarChart';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import Table from '@/shared/components/ui/display/Table';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Segmented, { SegmentedOptionType } from '@/shared/components/ui/form/Segmented';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatManwon } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { ManagerConsoleContext } from './manager-console-context';
import styles from '@/app/css/manager/ManagerDashboardContent.module.css';

/** 결제 환경 */
type EnvironmentType = 'LIVE' | 'TEST';

/** 합계 · 월별 항목 — 카드 · 표 줄 순서(시안 M2) */
const SUMMARY_ITEMS: Array<{key: keyof StatsMineSummaryResultDto; label: string; unit: string}> = [
    {key: 'user_count', label: '이용자 수', unit: '명'},
    {key: 'completed_count', label: '이용 건수', unit: '건'},
    {key: 'paid_amount', label: '결제액', unit: '원'},
    {key: 'refund_amount', label: '환불액', unit: '원'},
    {key: 'profit', label: '수익', unit: '원'},
];

/** 결제 환경 고르기 */
const ENVIRONMENT_OPTIONS: Array<SegmentedOptionType<EnvironmentType>> = [{value: 'LIVE', label: '실결제'}, {value: 'TEST', label: '테스트 결제'}];

/** 영업중지 업체 상태 */
const STORE_SUSPENDED = 'SUSPEND';

/** 숫자 쉼표 */
const NUMBER_FORMAT = new Intl.NumberFormat('ko-KR');

/**
 * M2 대시보드 — 기간 · 결제 환경 → 내 업체 통계(합계 카드 · 월별 그래프 · 월별 표), 영업중지 띠
 * - 조회는 제출한 조건(query)이 바뀔 때만 — 칸을 고치는 동안은 부르지 않는다
 *
 * @returns
 */
export default function ManagerDashboardContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                            // 매니저 토큰
    const {store} = useContext(ManagerConsoleContext);                                                               // 내 업체 — 영업중지 띠
    const loadStats = useEffectEvent((query: StatsMineDto, signal: AbortSignal) => getMyStats(auth, query, signal)); // 그때의 auth 로

    // 상태
    const [startMonth, setStartMonth] = useState<string>('');                   // 시작 달 칸(YYYY-MM)
    const [endMonth, setEndMonth] = useState<string>('');                       // 끝 달 칸
    const [environment, setEnvironment] = useState<EnvironmentType>('LIVE');    // 결제 환경 칸
    const [query, setQuery] = useState<StatsMineDto>(() => new StatsMineDto()); // 제출한 조건 — 처음은 기간 비움 · 실결제
    const [stats, setStats] = useState<StatsMineResultDto | null>(null);        // 받은 통계

    // 계산 값
    const suspended = store?.store_state_id === STORE_SUSPENDED; // ④ 영업중지
    const months = stats?.monthly ?? [];                         // 월별(오래된 달부터)
    const chartSeries = [
        {name: '결제액', data: months.map((month) => month.paid_amount), colorVar: '--primary'},
        {name: '환불액', data: months.map((month) => month.refund_amount), colorVar: '--warn'},
    ];                                                           // ③ 월별 결제액 · 환불액 막대

    // 효과
    useEffect(() => {
        // ①② 제출한 조건으로 통계 — 받은 기간을 칸에 채운다(떠나거나 다시 조회하면 결과를 버린다)
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
        // ② 칸 값으로 다시 — 비운 달은 null(최근 3개월), 검사 뒤 제출
        const dto = new StatsMineDto({start_month: startMonth || null, end_month: endMonth || null, environment});
        if (!(await validateAction(dto))) {
            return;
        }

        setQuery(dto);
    }

    return (
        // 대시보드
        <div className={styles.page}>
            {/* 제목 */}
            <div>
                <h1 className={styles.title}>대시보드</h1>
                <p className={styles.subtitle}>내 업체의 이용 · 결제 통계(한국 달 기준)</p>
            </div>

            {/* ④ 영업중지 */}
            {suspended ? <Band tone="danger" title="영업중지된 업체입니다.">사유: {store?.suspend_comment ?? '-'}</Band> : null}

            {/* ② 기간 · 결제 환경 */}
            <div className={styles.filter}>
                <Field label="시작 달" name="start_month" htmlFor="dashboard-start">
                    <Input id="dashboard-start" type="month" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} />
                </Field>
                <span className={styles.tilde} aria-hidden="true">~</span>
                <Field label="끝 달" name="end_month" htmlFor="dashboard-end">
                    <Input id="dashboard-end" type="month" value={endMonth} onChange={(event) => setEndMonth(event.target.value)} />
                </Field>
                <Field label="결제 환경" name="environment" group>
                    <Segmented label="결제 환경" options={ENVIRONMENT_OPTIONS} value={environment} onChange={setEnvironment} />
                </Field>
                <Button variant="primary" onClick={search}>조회</Button>
                <p className={styles.filterNote}>비우면 최근 3개월 · 최대 12개월</p>
            </div>

            {stats ? (
                <>
                    {/* ③ 합계 카드 */}
                    <section className={styles.kpis} aria-label="합계">
                        {SUMMARY_ITEMS.map((item) => (
                            <div key={item.key} className={styles.kpi}>
                                <span className={styles.kpiLabel}>{item.label}</span>
                                <span className={item.key === 'profit' ? `${styles.kpiValue} ${styles.profit}` : styles.kpiValue}>{NUMBER_FORMAT.format(stats.total[item.key])}<small>{item.unit}</small></span>
                            </div>
                        ))}
                    </section>

                    {/* ③ 월별 결제액 · 환불액 */}
                    <Card title="월별 결제액 · 환불액">
                        <BarChart label={`${stats.period.start_month} ~ ${stats.period.end_month} 월별 결제액과 환불액`} categories={months.map((month) => month.month)} series={chartSeries} height={290} formatValue={formatManwon} />
                    </Card>

                    {/* ③ 월별 표 — 항목 5줄 × 달 + 합계 */}
                    <Card title="월별 통계">
                        <Table>
                            <thead>
                                <tr>
                                    <th scope="col">항목</th>
                                    {months.map((month) => <th key={month.month} scope="col" className={styles.number}>{month.month}</th>)}
                                    <th scope="col" className={styles.number}>합계</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SUMMARY_ITEMS.map((item) => (
                                    <tr key={item.key}>
                                        <th scope="row">{item.label}({item.unit})</th>
                                        {months.map((month) => <td key={month.month} className={styles.number}>{NUMBER_FORMAT.format(month[item.key])}</td>)}
                                        <td className={styles.number}><b>{NUMBER_FORMAT.format(stats.total[item.key])}</b></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        <p className={styles.tableNote}>이용자 수 · 이용 건수는 이용 끝이 그 달인 이용 완료 예약(합계 이용자 수는 기간 전체에서 중복 제거), 결제액은 승인 시각, 환불액은 환불 신청 시각 기준. 수익 = 결제액 − 환불액(음수일 수 있다).</p>
                    </Card>
                </>
            ) : null}
        </div>
    );
}
