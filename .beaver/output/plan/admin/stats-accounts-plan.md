# Plan — 통계 · 계정 · 이용자 — 대시보드와 회원 관리

> 무엇을·왜는 [spec](../../spec/admin/stats-accounts-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 진입점마다 비즈니스 로직 전체 ② 계산 함수 ③ 규약만으로 예측할 수 없는 데이터 규칙
> **싣지 않는 것** page 껍데기, DTO 사본, 형제와 같은 contracts 함수 — 따르는 패턴을 표 한 줄로 가리킨다

로드맵 Phase 17(#57 ~ #61)을 이 plan 하나로 만든다. 대시보드는 업체 관리자 대시보드(`src/app/manager/(console)/ManagerDashboardContent.tsx`), 목록은 업체 목록(`src/app/admin/(console)/stores/AdminStoreListContent.tsx`), 상세는 업체 상세(`stores/[store_id]/AdminStoreDetailContent.tsx`) · 업체 관리자 계정 관리 카드(`src/app/manager/(console)/staff/[user_id]/_components/StaffAccountCard.tsx`)와 같은 모양이다.

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/contracts/stats/dto/stats.dto.ts` · `src/contracts/manager/dto/manager-account-list` · `-detail` · `-password-reset.dto.ts` · `src/contracts/user/dto/user-list` · `user-detail` · `user-reservation-list` · `user-state.dto.ts` | 신규 | 지침서 사본(`frontend/dto/stats.md` · `manager.md` · `user.md`) | 생략 |
| `src/contracts/stats/api.ts` · `src/contracts/manager/api.ts` · `src/contracts/user/api.ts` | 수정 | 관리자 API 8개(통계 1 · 업체 관리자 3 · 이용자 4) | 생략 (아래 4) |
| `src/contracts/store/api.ts` | 수정 | `getStores` 가 `all_search_yn` 도 보낸다 | 아래 3-3 |
| `src/contracts/common/member.constants.ts` | 신규 | 회원 상태 값 · 새 예약이 막히는 상태 · 상태 배지 색 | 아래 3-1 |
| `src/app/(user)/me/MyPageContent.tsx` · `_components/MemberStateBand.tsx` · `stores/[store_id]/booking/BookingContent.tsx` · `reservation/[reservation_id]/extension/ExtensionContent.tsx` · `src/app/manager/(console)/staff/staff-format.ts` 와 그 3곳 | 수정 | 옮긴 회원 상태 값을 쓰고 자기 사본을 지운다 | 아래 3-1 |
| `src/contracts/stats/stats.constants.ts` · `src/app/manager/(console)/ManagerDashboardContent.tsx` | 신규 · 수정 | 합계 항목(이름 · 단위) — 두 대시보드 | 아래 3-2 |
| `src/app/admin/(console)/admin-paths.ts` | 수정 | 업체 관리자 · 이용자 목록 · 상세 주소 | 아래 3-4 |
| `src/app/admin/(console)/_components/ListFilter.tsx` · `FilterChips.tsx` · `FilterSelect.tsx` | 수정 · 신규 | 거르기 앞뒤 자리 · 칩 묶음 · 고르기 상자(세 목록) | 아래 1-2 |
| `src/app/admin/(console)/AdminDashboardContent.tsx` · `page.tsx` | 수정 | A2 대시보드(준비 중 안내를 바꾼다) | 아래 1-1 |
| `src/app/admin/(console)/managers/page.tsx` · `AdminManagerListContent.tsx` · `manager-format.ts` | 신규 | A5 업체 관리자 목록 · 주소의 업체 · 초기화 판단 | 아래 1-2 · 2-1 · 3-5 |
| `src/app/admin/(console)/managers/[user_id]/page.tsx` · `AdminManagerDetailContent.tsx` · `_components/ManagerPasswordCard.tsx` | 신규 | A5 업체 관리자 상세 · 비밀번호 초기화 | 아래 1-3 |
| `src/app/admin/(console)/users/page.tsx` · `AdminUserListContent.tsx` · `user-format.ts` | 신규 | A6 이용자 목록 · 이용 기간 글자 | 아래 1-4 · 2-2 |
| `src/app/admin/(console)/users/[user_id]/page.tsx` · `AdminUserDetailContent.tsx` · `_components/UserStateCard.tsx` · `UserReservationsCard.tsx` | 신규 | A6 이용자 상세 · 이용 제한 · 해제 · 예약 이력 | 아래 1-5 |
| `src/app/css/admin/AdminDashboardContent.module.css` · `AdminList.module.css` · `AdminDetail.module.css` · `ListFilter.module.css` | 수정 | 시안 값(`frontend/design/admin.html` A2 · A5 · A6) | 아래 5 |
| 테스트 6파일 + 픽스처 | 신규 · 수정 | spec 14건 | 아래 테스트 |
| `AGENTS.md` · `docs/architecture.md` | 수정 | 관리자 A2 · A5 · A6 생김, 회원 상태 값 · 통계 항목 공통 | 만드는 순서 9 |

---

## 1. 비즈니스 로직 — 화면별 코드

### 1-1. 대시보드 — `AdminDashboardContent`

업체 관리자 대시보드와 같이 칸 값(달 · 결제 환경 · 업체 범위)과 제출한 조건(`query`)을 나눠, 조회 · 쪽 넘기기만 다시 읽는다. 쪽 넘기기는 제출한 조건에 쪽만 바꾼 새 `StatsDto` 라 칸에서 고치던 값이 섞이지 않는다.

```tsx
// src/app/admin/(console)/AdminDashboardContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { shortStoreCode } from '@/app/manager/manager-auth';
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
 *
 * @returns
 */
export default function AdminDashboardContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                    // 관리자 토큰
    const loadStats = useEffectEvent((query: StatsDto, signal: AbortSignal) => getStats(auth, query, signal)); // 그때의 auth 로

    // 상태
    const [startMonth, setStartMonth] = useState<string>('');                                       // 시작 달 칸(YYYY-MM)
    const [endMonth, setEndMonth] = useState<string>('');                                           // 끝 달 칸
    const [environment, setEnvironment] = useState<EnvironmentType>('LIVE');                        // 결제 환경 칸
    const [activity, setActivity] = useState<ActivityType>('1');                                    // 업체 범위 칸
    const [query, setQuery] = useState<StatsDto>(() => new StatsDto({size: STORE_PAGE_SIZE}));      // 제출한 조건 · 업체별 쪽 — 처음은 기간 비움 · 실결제 · 활동 업체만 · 1쪽
    const [stats, setStats] = useState<StatsResultDto | null>(null);                                // 받은 통계

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
                                        <th scope="col">업체코드</th>
                                        <th scope="col">상태</th>
                                        {STATS_SUMMARY_ITEMS.map((item) => <th key={item.key} scope="col" className={styles.number}>{item.label}({item.unit})</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {stores.map((store) => (
                                        <tr key={store.store_id}>
                                            <td><Link href={storePath(store.store_id)}>{store.store_name}</Link></td>
                                            <td className={styles.mono} title={store.store_code}>{shortStoreCode(store.store_code)}</td>
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
```

`page.tsx` 는 주석만 바꾼다("Phase 17 전까지 준비 중 안내" → "전체 통계").

### 1-2. 업체 관리자 목록 — `AdminManagerListContent` · `ListFilter` · `FilterChips` · `FilterSelect`

목록 거르기 부품은 상태 칩 하나 · 검색어만 받았다. 세 목록이 쓰도록 ① 화면이 거르기 값을 더한 상태(`ListQueryType` 를 넓힌 타입)를 그대로 넘기고 돌려받게 제네릭으로, ② 상태 칩 앞뒤에 화면의 거르기(업체 · 권한 / SNS)를 끼울 자리를 둔다. 칩 묶음 · 고르기 상자는 화면도 쓰므로 부품 둘로 나눈다(입점 신청 · 업체 목록은 그대로 — 넘기는 값이 같다).

```tsx
// src/app/admin/(console)/_components/FilterChips.tsx
'use client';
import Chip from '@/shared/components/ui/form/Chip';
import styles from '@/app/css/admin/ListFilter.module.css';

/** 거르기 값 하나 — 값(null 이 전체) · 이름 */
export type FilterOptionType = {
    value: string | null; // 보낼 값 — null 이면 보내지 않는다(전체)
    label: string;        // 칩 · 고르기 글자
};

type FilterChipsProps = {
    label: string;                            // 칩 앞 글자 — "상태"
    groupLabel: string;                       // 칩 묶음 이름(aria-label) — "회원 상태"
    options: ReadonlyArray<FilterOptionType>; // 칩(null 이 전체)
    value: string | null;                     // 고른 값
    onPick: (value: string | null) => void;   // 고름
};

/**
 * 관리자 목록 칩 묶음 — 앞 글자 · 칩(시안 목록 위 줄)
 *
 * @param param0
 * @returns
 */
export default function FilterChips({label, groupLabel, options, value, onPick}: FilterChipsProps): React.ReactNode {
    return (
        // 칩 묶음
        <div role="group" aria-label={groupLabel} className={styles.chips}>
            <span className={styles.label}>{label}</span>
            {options.map((option) => <Chip key={option.label} pressed={value === option.value} onClick={() => onPick(option.value)}>{option.label}</Chip>)}
        </div>
    );
}
```

```tsx
// src/app/admin/(console)/_components/FilterSelect.tsx
'use client';
import Select from '@/shared/components/ui/form/Select';
import { FilterOptionType } from './FilterChips';
import styles from '@/app/css/admin/ListFilter.module.css';

type FilterSelectProps = {
    id: string;                               // 고르기 상자 id — 앞 글자가 가리킨다
    label: string;                            // 앞 글자 — "업체"
    options: ReadonlyArray<FilterOptionType>; // 고를 것(null 이 전체 — 맨 앞)
    value: string | null;                     // 고른 값
    onPick: (value: string | null) => void;   // 고름
};

/**
 * 관리자 목록 고르기 상자 — 앞 글자 · 고르기(업체 · SNS). 전체는 빈 값 option
 *
 * @param param0
 * @returns
 */
export default function FilterSelect({id, label, options, value, onPick}: FilterSelectProps): React.ReactNode {
    return (
        // 고르기
        <div className={styles.select}>
            <label htmlFor={id} className={styles.label}>{label}</label>
            <Select id={id} value={value ?? ''} onChange={(event) => onPick(event.target.value || null)}>
                {options.map((option) => <option key={option.value ?? ''} value={option.value ?? ''}>{option.label}</option>)}
            </Select>
        </div>
    );
}
```

```tsx
// src/app/admin/(console)/_components/ListFilter.tsx — 바뀐 부분(타입 · 상수 ListQueryType · FIRST_LIST_QUERY 는 그대로)
'use client';
import { useState } from 'react';
import Button from '@/shared/components/ui/button/Button';
import Input from '@/shared/components/ui/form/Input';
import FilterChips, { FilterOptionType } from './FilterChips';
import styles from '@/app/css/admin/ListFilter.module.css';

/** 검색어 최대 글자 수 — 목록 DTO 의 keyword(입점 신청 · 업체 · 업체 관리자 · 이용자) */
const KEYWORD_MAX = 100;

type ListFilterProps<T extends ListQueryType> = {
    stateLabel: string;                      // 상태 칩 묶음 이름 — "신청 상태"
    states: ReadonlyArray<FilterOptionType>; // 상태 칩(null 이 전체)
    placeholder: string;                     // 검색 칸 안내 — "상호명 · 사업자등록번호"
    query: T;                                // 지금 거르기 — 화면이 더한 값(업체 · 권한 · SNS)도 함께
    onChange: (next: T) => void;             // 바뀐 거르기 — 쪽은 1로
    leading?: React.ReactNode;               // 상태 칩 앞 거르기 — 업체 · 권한(A5)
    trailing?: React.ReactNode;              // 상태 칩 뒤 거르기 — SNS(A6)
};

/**
 * 관리자 목록 거르기 — (앞 거르기) · 상태 칩 · (뒤 거르기) · 검색어(시안 A3 · A4 · A5 · A6 목록 위 줄)
 *
 * @param param0
 * @returns
 */
export default function ListFilter<T extends ListQueryType>({stateLabel, states, placeholder, query, onChange, leading, trailing}: ListFilterProps<T>): React.ReactNode {
    // 상태
    const [keywordInput, setKeywordInput] = useState<string>(query.keyword); // 검색 칸

    // 함수
    function pickState(state: string | null): void {
        // ② 상태 칩 → 1쪽부터
        onChange({...query, state, page: 1});
    }

    function search(event: React.FormEvent<HTMLFormElement>): void {
        // ② 검색어 → 1쪽부터
        event.preventDefault();
        onChange({...query, keyword: keywordInput.trim(), page: 1});
    }

    return (
        // 거르기 줄
        <div className={styles.bar}>
            {/* 거르기 — 앞 · 상태 칩 · 뒤 */}
            <div className={styles.filters}>
                {leading}
                <FilterChips label="상태" groupLabel={stateLabel} options={states} value={query.state} onPick={pickState} />
                {trailing}
            </div>

            {/* 검색 */}
            <form role="search" className={styles.search} onSubmit={search}>
                <Input type="search" aria-label="검색어" placeholder={placeholder} maxLength={KEYWORD_MAX} value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} />
                <Button type="submit">조회</Button>
            </form>
        </div>
    );
}
```

```tsx
// src/app/admin/(console)/managers/AdminManagerListContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { shortStoreCode } from '@/app/manager/manager-auth';
import { lookupName } from '@/contracts/common/lookup';
import { MEMBER_STATE, memberStateTone } from '@/contracts/common/member.constants';
import { AUTH_ID } from '@/contracts/common/roles';
import { STORE_STATE } from '@/contracts/common/store.constants';
import { getManagerAccounts } from '@/contracts/manager/api';
import { ManagerAccountListDto, ManagerAccountListResultDto } from '@/contracts/manager/dto/manager-account-list.dto';
import { getStores } from '@/contracts/store/api';
import { StoreListDto } from '@/contracts/store/dto/store-list.dto';
import { handleApiError } from '@/shared/api/error';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone, toKst } from '@/shared/utils/format';
import { managerPath } from '../admin-paths';
import FilterChips, { FilterOptionType } from '../_components/FilterChips';
import FilterSelect from '../_components/FilterSelect';
import ListFilter, { FIRST_LIST_QUERY, ListQueryType } from '../_components/ListFilter';
import { STORE_STATE_TONE } from '../stores/store-format';
import { managerAuthTone } from './manager-format';
import styles from '@/app/css/admin/AdminList.module.css';

type AdminManagerListContentProps = {
    storeId: string | null; // 주소 ?store_id= — 업체 상세에서 온 업체(없으면 전체 업체)
};

/** 업체 관리자 목록 거르기 — 상태 · 검색어 · 쪽 + 업체 · 권한 */
type ManagerQueryType = ListQueryType & {
    store: string | null; // 업체 ID(null 이 전체 업체)
    auth: string | null;  // 권한(null 이 전체)
};

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 상태 칩 — 시안 A5(전체 · 정상 · 정지) */
const STATE_CHIPS: ReadonlyArray<FilterOptionType> = [
    {value: null, label: '전체'},
    {value: MEMBER_STATE.ACTIVE, label: '정상'},
    {value: MEMBER_STATE.BLOCK, label: '정지'},
];

/** 권한 칩 — 시안 A5(전체 · 총괄매니저 · 매니저) */
const AUTH_CHIPS: ReadonlyArray<FilterOptionType> = [
    {value: null, label: '전체'},
    {value: AUTH_ID.HEAD_MANAGER, label: '총괄매니저'},
    {value: AUTH_ID.MANAGER, label: '매니저'},
];

/**
 * A5 업체 관리자 목록 — 업체 · 권한 · 상태 · 검색 · 표(등록 최신순)
 * - 업체 고르기는 업체 목록 전부(페이지 없이)로 채운다(시안)
 *
 * @param param0
 * @returns
 */
export default function AdminManagerListContent({storeId}: AdminManagerListContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                            // 관리자 토큰
    const loadStores = useEffectEvent((signal: AbortSignal) => getStores(auth, new StoreListDto({all_search_yn: 'Y'}), signal));      // 그때의 auth 로
    const loadPage = useEffectEvent((query: ManagerQueryType, signal: AbortSignal) => getManagerAccounts(auth, new ManagerAccountListDto({page: query.page, size: PAGE_SIZE, store_id: query.store, auth_id: query.auth, state_id: query.state, keyword: query.keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [query, setQuery] = useState<ManagerQueryType>({...FIRST_LIST_QUERY, store: storeId, auth: null}); // ①②③ 업체 · 권한 · 상태 · 검색어 · 쪽 — 처음 업체는 주소 값
    const [stores, setStores] = useState<Array<FilterOptionType>>([]);                                        // ① 업체 고르기(받은 업체)
    const [result, setResult] = useState<ManagerAccountListResultDto | null>(null);                           // ① 목록

    // 계산 값
    const storeOptions: Array<FilterOptionType> = [{value: null, label: '전체 업체'}, ...stores]; // 업체 고르기 — 맨 앞이 전체

    // 효과
    useEffect(() => {
        // ① 업체 고르기를 채울 업체 전부 — 들어올 때 한 번(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadStores(controller.signal).then((next) => {
            if (!controller.signal.aborted && next) {
                setStores(next.list.map((store) => ({value: store.store_id, label: store.store_name})));
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        // ①②③ 그 거르기 · 쪽 목록(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadPage(query, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult(next);
            }
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
    function pick(next: Partial<ManagerQueryType>): void {
        // ② 업체 · 권한 → 1쪽부터
        setQuery((prev) => ({...prev, ...next, page: 1}));
    }

    return (
        // 업체 관리자 목록
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <h1 className={styles.title}>업체 관리자</h1>
                <p className={styles.subtitle}>모든 업체의 업체 총관리자(총괄매니저) · 업체 관리자(매니저) 계정입니다. 등록 최신순.</p>
            </div>

            {/* ② 거르기 — 업체 · 권한 · 상태 · 검색 */}
            <ListFilter
                stateLabel="계정 상태"
                states={STATE_CHIPS}
                placeholder="상호명 · 업체코드 · 아이디 · 이름 · 휴대폰"
                query={query}
                onChange={setQuery}
                leading={(
                    <>
                        <FilterSelect id="manager-store" label="업체" options={storeOptions} value={query.store} onPick={(store) => pick({store})} />
                        <FilterChips label="권한" groupLabel="권한" options={AUTH_CHIPS} value={query.auth} onPick={(auth) => pick({auth})} />
                    </>
                )}
            />

            {/* ① 표 · 빈 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="조건에 맞는 업체 관리자가 없습니다." description="거르기를 풀거나 검색어를 지워 보세요." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">업체</th><th scope="col">업체코드</th><th scope="col">아이디</th><th scope="col">이름</th><th scope="col">휴대폰</th><th scope="col">권한</th><th scope="col">상태</th><th scope="col">등록일시</th></tr></thead>
                    <tbody>
                        {result.list.map((account) => (
                            <tr key={account.user_id}>
                                <td><span className={styles.cell}>{account.store_name}{account.store_state_id !== STORE_STATE.ACTIVE ? <Badge tone={STORE_STATE_TONE[account.store_state_id] ?? 'neutral'}>{lookupName('store_state_id', account.store_state_id)}</Badge> : null}</span></td>
                                <td className={styles.mono} title={account.store_code}>{shortStoreCode(account.store_code)}</td>
                                <td className={styles.mono}>{account.login_id}</td>
                                <td><Link href={managerPath(account.user_id)}>{account.name}</Link></td>
                                <td className={styles.number}>{account.phone ? formatPhone(account.phone) : '—'}</td>
                                <td><Badge tone={managerAuthTone(account.auth_id)}>{lookupName('auth_id', account.auth_id)}</Badge></td>
                                <td><span className={styles.cell}><Badge tone={memberStateTone(account.state_id)}>{lookupName('state_id', account.state_id)}</Badge>{account.is_password_change_required === 1 ? <Badge tone="warn">임시 비밀번호</Badge> : null}</span></td>
                                <td className={styles.number}>{toKst(account.created_at, 'YYYY-MM-DD HH:mm')}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}

            {/* ③ 페이지 */}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setQuery((prev) => ({...prev, page: Number(next)}))} label="업체 관리자 페이지" />
        </div>
    );
}
```

```tsx
// src/app/admin/(console)/managers/page.tsx
import AdminManagerListContent from './AdminManagerListContent';
import { storeIdOf } from './manager-format';

// A5 업체 관리자 목록 — /admin/managers (?store_id= — 업체 상세의 "이 업체의 업체 관리자", 콘솔 틀 · 관리자 로그인 필요 — layout 이 감싼다)
export default async function AdminManagerList({searchParams}: PageProps<'/admin/managers'>): Promise<React.ReactNode> {
    const {store_id} = await searchParams;
    const storeId = storeIdOf(store_id);

    return (
        // 업체 관리자 목록 — 주소의 업체가 바뀌면(메뉴로 다시 오면) 거르기를 처음부터
        <AdminManagerListContent key={storeId ?? 'all'} storeId={storeId} />
    );
}
```

### 1-3. 업체 관리자 상세 — `AdminManagerDetailContent` · `ManagerPasswordCard`

초기화 카드는 key 없이 두어, 초기화 뒤 상세를 다시 읽어도 보낸 안내 띠가 남는다(상세는 새 값이 올 때까지 이전 값을 그대로 그린다).

```tsx
// src/app/admin/(console)/managers/[user_id]/AdminManagerDetailContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { MANAGER_AUTH_BADGE } from '@/app/manager/manager-auth';
import { lookupName } from '@/contracts/common/lookup';
import { memberStateTone } from '@/contracts/common/member.constants';
import { STORE_STATE } from '@/contracts/common/store.constants';
import { getManagerAccount } from '@/contracts/manager/api';
import { ManagerAccountDetailResultDto } from '@/contracts/manager/dto/manager-account-detail.dto';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import CopyButton from '@/shared/components/ui/button/CopyButton';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone, toKst } from '@/shared/utils/format';
import { MANAGER_LIST_PATH, storePath } from '../../admin-paths';
import { STORE_STATE_TONE } from '../../stores/store-format';
import { managerAuthTone } from '../manager-format';
import ManagerPasswordCard from './_components/ManagerPasswordCard';
import styles from '@/app/css/admin/AdminDetail.module.css';

type AdminManagerDetailContentProps = {
    userId: string; // 주소의 업체 관리자 회원 ID
};

/**
 * A5 업체 관리자 상세 — 계정 정보(보기만) · 비밀번호 초기화
 *
 * @param param0
 * @returns
 */
export default function AdminManagerDetailContent({userId}: AdminManagerDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                               // 관리자 토큰
    const loadAccount = useEffectEvent((signal: AbortSignal) => getManagerAccount(auth, userId, signal)); // 그때의 auth · 계정으로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                               // ④ 다시 읽기
    const [account, setAccount] = useState<ManagerAccountDetailResultDto | null>(null); // ① 상세
    const [failed, setFailed] = useState<boolean>(false);                                // ① 못 읽음

    // 계산 값
    const authBadge = account ? MANAGER_AUTH_BADGE.get(account.auth_id) : undefined; // 권한 설명 — "업체 관리자"

    // 효과
    useEffect(() => {
        // ① 상세(계정이 바뀌거나 다시 읽을 때 · 떠나면 결과를 버린다)
        const controller = new AbortController();
        loadAccount(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setAccount(next);
                setFailed(next === null);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setFailed(true);
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [userId, reloadKey]);

    // 함수
    function reload(): void {
        // ④ 상세 다시
        setReloadKey((key) => key + 1);
    }

    if (!account) {
        return failed ? (
            // ① 못 읽음
            <EmptyState title="업체 관리자를 불러오지 못했어요" description="없는 계정이거나 잠시 연결이 안 됩니다." action={<Link href={MANAGER_LIST_PATH} className={buttonClass({size: 'sm'})}>업체 관리자 목록</Link>} />
        ) : null;
    }

    return (
        // 업체 관리자 상세
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <p className={styles.crumb}><Link href={MANAGER_LIST_PATH}>업체 관리자 목록</Link></p>
                <h1 className={styles.title}>{account.name}<Badge tone={managerAuthTone(account.auth_id)}>{lookupName('auth_id', account.auth_id)}</Badge><Badge tone={memberStateTone(account.state_id)}>{lookupName('state_id', account.state_id)}</Badge></h1>
                <p className={styles.sub}>아이디 {account.login_id} · {account.store_name}</p>
            </div>

            <div className={styles.cols}>
                {/* ① 계정 정보 */}
                <Card title="계정 정보">
                    <dl className={styles.dl}>
                        <dt>업체</dt>
                        <dd><span className={styles.copyRow}><Link href={storePath(account.store_id)}>{account.store_name}</Link><Badge tone={STORE_STATE_TONE[account.store_state_id] ?? 'neutral'}>{lookupName('store_state_id', account.store_state_id)}</Badge></span></dd>
                        <dt>업체코드</dt>
                        <dd><span className={styles.copyRow}><code className={styles.mono}>{account.store_code}</code><CopyButton text={account.store_code} size="sm" /></span></dd>
                        <dt>아이디</dt><dd className={styles.mono}>{account.login_id}</dd>
                        <dt>이름</dt><dd>{account.name}</dd>
                        <dt>휴대폰</dt><dd>{account.phone ? formatPhone(account.phone) : '—'}</dd>
                        <dt>성별</dt><dd>{lookupName('gender', account.gender) || '—'}</dd>
                        <dt>생년월일</dt><dd>{account.birth || '—'}</dd>
                        <dt>권한</dt><dd>{lookupName('auth_id', account.auth_id)}{authBadge ? `(${authBadge.label})` : ''}</dd>
                        <dt>상태</dt><dd><Badge tone={memberStateTone(account.state_id)}>{lookupName('state_id', account.state_id)}</Badge></dd>
                        <dt>정지 사유</dt><dd>{account.block_comment ?? '—'}</dd>
                        <dt>비밀번호 변경 필요</dt><dd>{account.is_password_change_required === 1 ? <span className={styles.copyRow}>예<Badge tone="warn">임시 비밀번호</Badge></span> : '아니오'}</dd>
                        <dt>등록일시</dt><dd className={styles.mono}>{toKst(account.created_at, 'YYYY-MM-DD HH:mm')}</dd>
                    </dl>
                    {account.store_state_id === STORE_STATE.LEAVE ? <p className={styles.muted}>탈퇴한 업체의 계정입니다.</p> : null}
                </Card>

                {/* ②③④ 비밀번호 초기화 */}
                <ManagerPasswordCard account={account} onReset={reload} />
            </div>
        </div>
    );
}
```

```tsx
// src/app/admin/(console)/managers/[user_id]/_components/ManagerPasswordCard.tsx
'use client';
import { useContext, useState } from 'react';
import { resetManagerAccountPassword } from '@/contracts/manager/api';
import { ManagerAccountDetailResultDto } from '@/contracts/manager/dto/manager-account-detail.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone } from '@/shared/utils/format';
import { passwordResetOf } from '../../manager-format';
import styles from '@/app/css/admin/AdminDetail.module.css';

type ManagerPasswordCardProps = {
    account: ManagerAccountDetailResultDto; // 상세 — 이름 · 아이디 · 휴대폰 · 업체 상태
    onReset: () => void;                    // ④ 초기화 뒤 상세 다시
};

/**
 * 비밀번호 초기화 카드 — 초기화 판단(휴대폰 · 탈퇴 업체) · 확인 창 · 초기화(큐) · 보낸 안내
 *
 * @param param0
 * @returns
 */
export default function ManagerPasswordCard({account, onReset}: ManagerPasswordCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰

    // 상태
    const [confirming, setConfirming] = useState<boolean>(false); // ③ 확인 창
    const [busy, setBusy] = useState<boolean>(false);             // 보내는 중
    const [notice, setNotice] = useState<string | null>(null);    // ④ 보낸 안내

    // 계산 값
    const reset = passwordResetOf(account);                            // ② 초기화할 수 있는지 · 막는 이유
    const phoneText = account.phone ? formatPhone(account.phone) : ''; // 문자가 갈 휴대폰

    // 함수
    async function confirmReset(): Promise<void> {
        // ④ 초기화(큐) → 보낸 안내 · 상세 다시
        if (busy) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await resetManagerAccountPassword(auth, account.user_id);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setConfirming(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        setNotice(`임시 비밀번호를 ${phoneText} 로 보냈습니다.`);
        onReset();
    }

    return (
        // 비밀번호 초기화
        <Card title="비밀번호 초기화">
            <div className={styles.stack}>
                {/* 안내 · ④ 보낸 안내 */}
                <p className={styles.muted}>임시 비밀번호를 만들어 {phoneText ? `${phoneText} 로` : '등록된 휴대폰으로'} 문자를 보냅니다. 업체 관리자는 로그인한 뒤 비밀번호를 바꾸게 됩니다.</p>
                {notice ? <Band tone="ok" role="status">{notice}</Band> : null}

                {/* ②③ 버튼 · 막는 이유 */}
                <div><Button variant="primary" disabled={!reset.allowed || busy} onClick={() => setConfirming(true)}>비밀번호 초기화</Button></div>
                {reset.reason ? <p className={styles.muted}>{reset.reason}</p> : null}

                {/* 참고 */}
                <ul className={styles.notes}>
                    <li>휴대폰 번호가 없는 계정 · 탈퇴한 업체의 계정은 초기화할 수 없습니다.</li>
                    <li>정지된 계정도 초기화할 수 있습니다.</li>
                    <li>계정 정보 수정 · 정지는 그 업체의 업체 총관리자가 업체 관리자 콘솔에서 합니다.</li>
                </ul>
            </div>

            {/* ③ 확인 창 */}
            <ConfirmModal open={confirming} title="비밀번호를 초기화할까요?" message={`${account.name}(${account.login_id})의 임시 비밀번호를 만들어 ${phoneText} 로 SMS 를 보냅니다. 지금 비밀번호로는 더 이상 로그인할 수 없습니다.`} confirmLabel="비밀번호 초기화" danger busy={busy} onConfirm={confirmReset} onClose={() => setConfirming(false)} />
        </Card>
    );
}
```

### 1-4. 이용자 목록 — `AdminUserListContent`

```tsx
// src/app/admin/(console)/users/AdminUserListContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { shortStoreCode } from '@/app/manager/manager-auth';
import { lookupName } from '@/contracts/common/lookup';
import { MEMBER_STATE, memberStateTone } from '@/contracts/common/member.constants';
import { getUsers } from '@/contracts/user/api';
import { UserListDto, UserListResultDto } from '@/contracts/user/dto/user-list.dto';
import { handleApiError } from '@/shared/api/error';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone, toKst } from '@/shared/utils/format';
import { userPath } from '../admin-paths';
import { FilterOptionType } from '../_components/FilterChips';
import FilterSelect from '../_components/FilterSelect';
import ListFilter, { FIRST_LIST_QUERY, ListQueryType } from '../_components/ListFilter';
import styles from '@/app/css/admin/AdminList.module.css';

/** 이용자 목록 거르기 — 상태 · 검색어 · 쪽 + SNS */
type UserQueryType = ListQueryType & {
    sns: string | null; // 가입 SNS(null 이 전체)
};

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 상태 칩 — 시안 A6(전체 · 정상 · 정지 · 탈퇴 대기 · 탈퇴) */
const STATE_CHIPS: ReadonlyArray<FilterOptionType> = [
    {value: null, label: '전체'},
    {value: MEMBER_STATE.ACTIVE, label: '정상'},
    {value: MEMBER_STATE.BLOCK, label: '정지'},
    {value: MEMBER_STATE.LEAVE_WAIT, label: '탈퇴 대기'},
    {value: MEMBER_STATE.LEAVE, label: '탈퇴'},
];

/** SNS 고르기 — 시안 A6 순서(지금 가입은 카카오 · 네이버만, 고르기는 6종) */
const SNS_OPTIONS: ReadonlyArray<FilterOptionType> = [
    {value: null, label: '전체 SNS'},
    ...['KAKAO', 'NAVER', 'GOOGLE', 'APPLE', 'FACEBOOK', 'LINE'].map((snsId) => ({value: snsId, label: lookupName('sns_id', snsId)})),
];

/**
 * A6 이용자 목록 — 상태 · SNS · 검색 · 표(가입 최신순)
 *
 * @returns
 */
export default function AdminUserListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰
    const loadPage = useEffectEvent((query: UserQueryType, signal: AbortSignal) => getUsers(auth, new UserListDto({page: query.page, size: PAGE_SIZE, state_id: query.state, sns_id: query.sns, keyword: query.keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [query, setQuery] = useState<UserQueryType>({...FIRST_LIST_QUERY, sns: null}); // ①②③ 상태 · SNS · 검색어 · 쪽
    const [result, setResult] = useState<UserListResultDto | null>(null);                 // ① 목록

    // 효과
    useEffect(() => {
        // ①②③ 그 거르기 · 쪽 목록(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadPage(query, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult(next);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [query]);

    return (
        // 이용자 목록
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <h1 className={styles.title}>이용자</h1>
                <p className={styles.subtitle}>SNS 로 가입한 이용자입니다. 가입 최신순.</p>
            </div>

            {/* ② 거르기 — 상태 · SNS · 검색 */}
            <ListFilter
                stateLabel="회원 상태"
                states={STATE_CHIPS}
                placeholder="이름 · 닉네임 · 휴대폰 · 검색 코드"
                query={query}
                onChange={setQuery}
                trailing={<FilterSelect id="user-sns" label="SNS" options={SNS_OPTIONS} value={query.sns} onPick={(sns) => setQuery((prev) => ({...prev, sns, page: 1}))} />}
            />

            {/* ① 표 · 빈 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="조건에 맞는 이용자가 없습니다." description="거르기를 풀거나 검색어를 지워 보세요." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">검색 코드</th><th scope="col">닉네임</th><th scope="col">이름</th><th scope="col">휴대폰</th><th scope="col">SNS</th><th scope="col">상태</th><th scope="col">가입일시</th></tr></thead>
                    <tbody>
                        {result.list.map((user) => {
                            const unverified = !user.phone && user.state_id !== MEMBER_STATE.LEAVE && user.is_phone_verified === 0; // 휴대폰 미인증 — 탈퇴는 "—"
                            return (
                                <tr key={user.user_id}>
                                    <td className={styles.mono} title={user.user_search_code}>{shortStoreCode(user.user_search_code)}</td>
                                    <td><Link href={userPath(user.user_id)}>{user.nickname}</Link></td>
                                    <td>{user.name}</td>
                                    <td className={styles.number}>{user.phone ? formatPhone(user.phone) : unverified ? <Badge>미인증</Badge> : '—'}</td>
                                    <td>{lookupName('sns_id', user.sns_id) || '—'}</td>
                                    <td><Badge tone={memberStateTone(user.state_id)}>{lookupName('state_id', user.state_id)}</Badge></td>
                                    <td className={styles.number}>{toKst(user.created_at, 'YYYY-MM-DD HH:mm')}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            ) : null}

            {/* ③ 페이지 */}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setQuery((prev) => ({...prev, page: Number(next)}))} label="이용자 페이지" />
        </div>
    );
}
```

검색 코드 줄임은 업체코드와 같은 규칙(앞 8자 + `…`)이라 `shortStoreCode` 를 그대로 쓴다 — 이름이 업체코드용이지만 글자 규칙만 같다(새 함수를 만들지 않는다).

### 1-5. 이용자 상세 — `AdminUserDetailContent` · `UserStateCard` · `UserReservationsCard`

예약 이력은 상태 변경과 상관없이 따로 쪽을 넘기므로 카드 안에서 따로 읽는다(상세를 다시 읽어도 이력 쪽이 그대로). 상태 카드는 key 없이 두어 제한 안내 띠가 다시 읽은 뒤에도 남고, 성공하면 사유 칸만 비운다.

```tsx
// src/app/admin/(console)/users/[user_id]/AdminUserDetailContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { MEMBER_STATE, memberStateTone } from '@/contracts/common/member.constants';
import { getUser } from '@/contracts/user/api';
import { UserDetailResultDto } from '@/contracts/user/dto/user-detail.dto';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import CopyButton from '@/shared/components/ui/button/CopyButton';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone, toKst } from '@/shared/utils/format';
import { USER_LIST_PATH } from '../../admin-paths';
import UserReservationsCard from './_components/UserReservationsCard';
import UserStateCard from './_components/UserStateCard';
import styles from '@/app/css/admin/AdminDetail.module.css';

type AdminUserDetailContentProps = {
    userId: string; // 주소의 이용자 회원 ID
};

/**
 * A6 이용자 상세 — 회원 정보 · 이용 제한 · 해제 · 예약 요약 · 예약 이력
 *
 * @param param0
 * @returns
 */
export default function AdminUserDetailContent({userId}: AdminUserDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                    // 관리자 토큰
    const loadUser = useEffectEvent((signal: AbortSignal) => getUser(auth, userId, signal)); // 그때의 auth · 이용자로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);             // ③④ 다시 읽기
    const [user, setUser] = useState<UserDetailResultDto | null>(null); // ① 상세
    const [failed, setFailed] = useState<boolean>(false);               // ① 못 읽음

    // 계산 값
    const snsText = lookupName('sns_id', user?.sns_id) || '—'; // 가입 SNS

    // 효과
    useEffect(() => {
        // ① 상세(이용자가 바뀌거나 다시 읽을 때 · 떠나면 결과를 버린다)
        const controller = new AbortController();
        loadUser(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setUser(next);
                setFailed(next === null);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setFailed(true);
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [userId, reloadKey]);

    // 함수
    function reload(): void {
        // ③④ 상세 다시
        setReloadKey((key) => key + 1);
    }

    if (!user) {
        return failed ? (
            // ① 못 읽음
            <EmptyState title="이용자를 불러오지 못했어요" description="없는 이용자이거나 잠시 연결이 안 됩니다." action={<Link href={USER_LIST_PATH} className={buttonClass({size: 'sm'})}>이용자 목록</Link>} />
        ) : null;
    }

    return (
        // 이용자 상세
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <p className={styles.crumb}><Link href={USER_LIST_PATH}>이용자 목록</Link></p>
                <h1 className={styles.title}>{user.nickname}<Badge tone={memberStateTone(user.state_id)}>{lookupName('state_id', user.state_id)}</Badge></h1>
                <p className={styles.sub}>{user.name} · {snsText} 가입 · {toKst(user.created_at, 'YYYY-MM-DD HH:mm')}</p>
            </div>

            <div className={styles.cols}>
                {/* ① 회원 정보 */}
                <Card title="회원 정보">
                    <dl className={styles.dl}>
                        <dt>검색 코드</dt>
                        <dd><span className={styles.copyRow}><code className={styles.mono}>{user.user_search_code}</code><CopyButton text={user.user_search_code} size="sm" /></span></dd>
                        <dt>닉네임</dt><dd>{user.nickname}</dd>
                        <dt>이름</dt><dd>{user.name}</dd>
                        <dt>성별</dt><dd>{lookupName('gender', user.gender) || '—'}</dd>
                        <dt>생년월일</dt><dd>{user.birth || '—'}</dd>
                        <dt>휴대폰</dt>
                        <dd>{user.phone ? <>{formatPhone(user.phone)}{user.phone_verified_at ? <span className={styles.muted}> · 인증 {toKst(user.phone_verified_at, 'YYYY-MM-DD HH:mm')}</span> : null}</> : user.state_id === MEMBER_STATE.LEAVE ? '—' : <Badge>미인증</Badge>}</dd>
                        <dt>가입 SNS</dt><dd>{snsText}</dd>
                        <dt>상태</dt><dd><Badge tone={memberStateTone(user.state_id)}>{lookupName('state_id', user.state_id)}</Badge></dd>
                        <dt>이용 제한 사유</dt><dd>{user.block_comment ?? '—'}</dd>
                        <dt>탈퇴 예정</dt><dd className={styles.mono}>{user.leave_reserved_at ?? '—'}</dd>
                        <dt>가입일시</dt><dd className={styles.mono}>{toKst(user.created_at, 'YYYY-MM-DD HH:mm')}</dd>
                    </dl>
                </Card>

                {/* ②③④ 이용 제한 · 해제 */}
                <UserStateCard user={user} onChanged={reload} />
            </div>

            {/* ① 예약 요약 — 결제 대기 만료는 세지 않는다 */}
            <Card title="예약 요약">
                <div className={styles.tiles}>
                    <div className={styles.tile}><span className={styles.muted}>전체</span><b className={styles.tileValue}>{user.reservation_summary.total}<small> 건</small></b></div>
                    <div className={styles.tile}><span className={styles.muted}>진행 중</span><b className={styles.tileValue}>{user.reservation_summary.in_progress}<small> 건</small></b><span className={styles.tileNote}>결제 대기 · 예약 확정 · 이용 중</span></div>
                    <div className={styles.tile}><span className={styles.muted}>이용 완료</span><b className={styles.tileValue}>{user.reservation_summary.completed}<small> 건</small></b></div>
                    <div className={styles.tile}><span className={styles.muted}>취소</span><b className={styles.tileValue}>{user.reservation_summary.canceled}<small> 건</small></b></div>
                </div>
                <p className={styles.muted}>결제 대기 만료는 세지 않습니다.</p>
            </Card>

            {/* ⑤⑥ 예약 이력 */}
            <UserReservationsCard userId={user.user_id} />
        </div>
    );
}
```

```tsx
// src/app/admin/(console)/users/[user_id]/_components/UserStateCard.tsx
'use client';
import { useContext, useState } from 'react';
import { MEMBER_STATE } from '@/contracts/common/member.constants';
import { updateUserState } from '@/contracts/user/api';
import { UserDetailResultDto } from '@/contracts/user/dto/user-detail.dto';
import { UserStateDto } from '@/contracts/user/dto/user-state.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import Field from '@/shared/components/ui/form/Field';
import Textarea from '@/shared/components/ui/form/Textarea';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import styles from '@/app/css/admin/AdminDetail.module.css';

type UserStateCardProps = {
    user: UserDetailResultDto; // 상세 — 닉네임 · 상태 · 이용 제한 사유
    onChanged: () => void;     // ③④ 바꾼 뒤 상세 다시
};

/** 이용 제한 사유 최대 글자 수 — UserStateDto */
const BLOCK_COMMENT_MAX = 255;

/**
 * 이용 제한 카드 — 정상이면 사유 칸 · 이용 제한(확인 창 — 사용자 결정), 정지면 사유 · 제한 해제(바로), 탈퇴 대기 · 탈퇴면 바꿀 수 없음
 *
 * @param param0
 * @returns
 */
export default function UserStateCard({user, onChanged}: UserStateCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰

    // 상태
    const [blockComment, setBlockComment] = useState<string>(''); // 이용 제한 사유 칸
    const [confirming, setConfirming] = useState<boolean>(false); // ③ 확인 창
    const [busy, setBusy] = useState<boolean>(false);             // 보내는 중
    const [notice, setNotice] = useState<string | null>(null);    // ③ 제한 안내

    // 계산 값
    const blocked = user.state_id === MEMBER_STATE.BLOCK;                                                    // ② 정지 — 해제 버튼
    const locked = user.state_id === MEMBER_STATE.LEAVE_WAIT || user.state_id === MEMBER_STATE.LEAVE;        // ② 탈퇴 대기 · 탈퇴 — 바꿀 수 없음

    // 함수
    function blockDto(): UserStateDto {
        // 이용 제한 값 — 사유는 다듬고 비면 보내지 않는다
        return Object.assign(new UserStateDto(), {state_id: MEMBER_STATE.BLOCK, block_comment: blockComment.trim() || undefined});
    }

    async function send(dto: UserStateDto): Promise<boolean> {
        // 상태 변경(큐) — 실패는 받은 문구(칸 오류는 칸 옆), 성공이면 true
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateUserState(auth, user.user_id, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error);
            return false;
        }

        return true;
    }

    async function askBlock(): Promise<void> {
        // ③ 이용 제한 — 사유 검사 뒤 확인 창
        if (await validateAction(blockDto())) {
            setConfirming(true);
        }
    }

    async function confirmBlock(): Promise<void> {
        // ③ 확인 → 상태 변경(정지 · 사유) → 안내 · 상세 다시
        if (busy) {
            return;
        }

        const done = await send(blockDto());
        setConfirming(false);
        if (!done) {
            return;
        }

        setBlockComment('');
        setNotice('이용을 제한했습니다. 이 이용자는 새 예약 · 연장을 할 수 없습니다.');
        onChanged();
    }

    async function unblock(): Promise<void> {
        // ④ 제한 해제 — 확인 없이 바로(정상) → 상세 다시(사유는 백엔드가 지운다)
        if (busy) {
            return;
        }

        if (await send(Object.assign(new UserStateDto(), {state_id: MEMBER_STATE.ACTIVE}))) {
            setNotice(null);
            onChanged();
        }
    }

    return (
        // 이용 제한
        <Card title="이용 제한">
            <div className={styles.stack}>
                {/* 안내 · ③ 제한 안내 */}
                <p className={styles.muted}>이용을 제한하면 로그인과 이미 한 예약의 이용은 되고, <strong>새 예약 · 연장만</strong> 막힙니다. 제한 사유는 이용자 화면에 보입니다.</p>
                {notice ? <Band tone="ok" role="status">{notice}</Band> : null}

                {locked ? (
                    // ② 탈퇴 대기 · 탈퇴 — 바꿀 수 없음
                    <>
                        <Band tone="warn">탈퇴 대기 · 탈퇴 회원은 상태를 바꿀 수 없습니다.</Band>
                        <div><Button variant="danger" disabled>이용 제한</Button></div>
                    </>
                ) : blocked ? (
                    // ② 정지 — 사유 · ④ 해제
                    <>
                        <Band tone="danger" title="이용 제한 사유">{user.block_comment ?? '—'}</Band>
                        <p className={styles.muted}>해제하면 사유는 지워집니다.</p>
                        <div><Button variant="primary" disabled={busy} onClick={unblock}>제한 해제</Button></div>
                    </>
                ) : (
                    // ② 정상 — 사유 칸 · ③ 이용 제한
                    <>
                        <Field label="이용 제한 사유" name="block_comment" htmlFor="user-block-comment" hint={<span>{blockComment.length} / {BLOCK_COMMENT_MAX}</span>}>
                            <Textarea id="user-block-comment" placeholder="이용자에게 보일 사유(선택)" maxLength={BLOCK_COMMENT_MAX} value={blockComment} onChange={(event) => setBlockComment(event.target.value)} />
                        </Field>
                        <div><Button variant="danger" disabled={busy} onClick={askBlock}>이용 제한</Button></div>
                    </>
                )}
            </div>

            {/* ③ 확인 창 */}
            <ConfirmModal open={confirming} title="이용 제한" message={`${user.nickname} 님의 이용을 제한할까요? 새 예약 · 연장이 막힙니다.`} confirmLabel="이용 제한" danger busy={busy} onConfirm={confirmBlock} onClose={() => setConfirming(false)} />
        </Card>
    );
}
```

```tsx
// src/app/admin/(console)/users/[user_id]/_components/UserReservationsCard.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { reservationStateTone } from '@/app/(user)/reservation/reservation-state';
import { lookupName } from '@/contracts/common/lookup';
import { getUserReservations } from '@/contracts/user/api';
import { UserReservationListDto, UserReservationListResultDto } from '@/contracts/user/dto/user-reservation-list.dto';
import { handleApiError } from '@/shared/api/error';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPrice, toKst } from '@/shared/utils/format';
import { storePath } from '../../../admin-paths';
import { usagePeriodText } from '../../user-format';
import styles from '@/app/css/admin/AdminDetail.module.css';

type UserReservationsCardProps = {
    userId: string; // 이용자 회원 ID
};

/** 한 쪽 개수 — 시안(23건 · 3쪽) */
const PAGE_SIZE = 10;

/**
 * 예약 이력 카드 — 이용 시작 최신순(결제 대기 만료 제외) · 쪽 넘기기
 *
 * @param param0
 * @returns
 */
export default function UserReservationsCard({userId}: UserReservationsCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰
    const loadPage = useEffectEvent((page: number, signal: AbortSignal) => getUserReservations(auth, userId, new UserReservationListDto({page, size: PAGE_SIZE}), signal)); // 그때의 auth 로

    // 상태
    const [page, setPage] = useState<number>(1);                                       // ⑤ 보는 쪽
    const [result, setResult] = useState<UserReservationListResultDto | null>(null); // ① 이력

    // 효과
    useEffect(() => {
        // ①⑤ 그 쪽 이력(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadPage(page, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult(next);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [userId, page]);

    return (
        // 예약 이력
        <Card title="예약 이력">
            <p className={styles.muted}>이용 시작 최신순 · 결제 대기 만료 제외</p>

            {/* 표 · 빈 이력 */}
            {result && result.list.length === 0 ? <EmptyState title="아직 예약이 없습니다." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">이용 기간</th><th scope="col">업체</th><th scope="col">객실 그룹 · 호실</th><th scope="col">상품</th><th scope="col">합계 금액</th><th scope="col">상태</th><th scope="col">취소</th><th scope="col">예약일시</th></tr></thead>
                    <tbody>
                        {result.list.map((item) => (
                            <tr key={item.reservation_id}>
                                <td className={styles.mono}>{usagePeriodText(item.start_at, item.end_at)}</td>
                                <td><Link href={storePath(item.store_id)}>{item.store_name}</Link></td>
                                <td>{item.room_group_name} · {item.room_name}</td>
                                <td>{item.room_plan_type_name || lookupName('room_plan_type_id', item.room_plan_type_id)}</td>
                                <td className={styles.mono}>{formatPrice(item.total_price)}</td>
                                <td><Badge tone={reservationStateTone(item.reservation_state_id)}>{item.reservation_state_name || lookupName('reservation_state_id', item.reservation_state_id)}</Badge></td>
                                <td>{item.canceled_at ? `${lookupName('cancel_actor', item.cancel_actor)} · ${toKst(item.canceled_at, 'YYYY-MM-DD HH:mm')}` : '—'}</td>
                                <td className={styles.mono}>{toKst(item.created_at, 'YYYY-MM-DD HH:mm')}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}

            {/* ⑤ 페이지 */}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="예약 이력 페이지" />
        </Card>
    );
}
```

---

## 2. 계산 함수

### 2-1. 비밀번호를 초기화할 수 있는지 — `src/app/admin/(console)/managers/manager-format.ts` `passwordResetOf`

탈퇴 업체를 먼저 본다 — 탈퇴 업체 계정은 휴대폰이 있어도 백엔드가 400 이라, 휴대폰 이유보다 탈퇴 이유가 맞다.

```ts
// src/app/admin/(console)/managers/manager-format.ts
import { MANAGER_AUTH_BADGE } from '@/app/manager/manager-auth';
import { STORE_STATE } from '@/contracts/common/store.constants';
import { ManagerAccountDetailResultDto } from '@/contracts/manager/dto/manager-account-detail.dto';

/** 비밀번호 초기화 판단 — 켤지 · 막는 이유 */
export type PasswordResetType = {
    allowed: boolean;      // 초기화 버튼 켬
    reason: string | null; // 막는 이유(켜면 null)
};

/**
 * 비밀번호를 초기화할 수 있는지 — 탈퇴 업체 계정 · 휴대폰 없는 계정은 막고 이유(정지 계정은 된다 — 지침서 A5)
 *
 * @param account 업체 관리자 상세 — 휴대폰 · 업체 상태
 */
export function passwordResetOf(account: Pick<ManagerAccountDetailResultDto, 'phone' | 'store_state_id'>): PasswordResetType {
    if (account.store_state_id === STORE_STATE.LEAVE) {
        return {allowed: false, reason: '탈퇴한 업체의 계정이라 초기화할 수 없습니다.'};
    }

    if (!account.phone) {
        return {allowed: false, reason: '휴대폰 번호가 등록되지 않은 계정입니다. 그 업체의 업체 총관리자가 휴대폰 번호를 넣은 뒤 초기화할 수 있습니다.'};
    }

    return {allowed: true, reason: null};
}

/**
 * 권한 배지 색 — 업체 콘솔과 같은 색(총괄매니저 primary · 매니저 neutral)
 *
 * @param authId auth_id
 */
export function managerAuthTone(authId: string): 'primary' | 'neutral' {
    return MANAGER_AUTH_BADGE.get(authId)?.tone ?? 'neutral';
}
```

### 2-2. 예약 이력의 이용 기간 글자 — `src/app/admin/(console)/users/user-format.ts` `usagePeriodText`

```ts
// src/app/admin/(console)/users/user-format.ts
import { toKst } from '@/shared/utils/format';

/** 시각 글자 모양 — 연-월-일 시:분(한국 시각) */
const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm';

/** 'YYYY-MM-DD HH:mm' 에서 연도 끝 · 날짜 끝 · 월 시작 · 시각 시작 자리 */
const YEAR_END = 4;
const DATE_END = 10;
const MONTH_START = 5;
const TIME_START = 11;

/**
 * 이용 기간 글자 — 시작은 연월일 · 시각을 모두, 끝은 시작과 달라진 부분부터(같은 날 시각만 · 다른 날 월일부터 · 해가 바뀌면 연도부터)
 *
 * @param startIso 이용 시작(ISO 8601)
 * @param endIso 이용 끝(ISO 8601)
 */
export function usagePeriodText(startIso: string, endIso: string): string {
    const start = toKst(startIso, DATE_TIME_FORMAT);
    const end = toKst(endIso, DATE_TIME_FORMAT);
    if (start.slice(0, YEAR_END) !== end.slice(0, YEAR_END)) {
        return `${start} ~ ${end}`;
    }

    if (start.slice(0, DATE_END) !== end.slice(0, DATE_END)) {
        return `${start} ~ ${end.slice(MONTH_START)}`;
    }

    return `${start} ~ ${end.slice(TIME_START)}`;
}
```

---

## 3. 데이터 규칙 — 규약만으로 예측할 수 없는 부분

### 3-1. 회원 상태 값을 함께 쓰는 곳으로 — `src/contracts/common/member.constants.ts`

회원 상태(`state_id`) 값 · 배지 색이 이용자 화면 4곳(글자 그대로 `'BLOCK'` · `'LEAVE_WAIT'`)과 업체 관리자 콘솔(`STAFF_STATE` · `STAFF_STATE_TONE`)에 따로 있고, 관리자 A5 · A6 가 네 값 모두와 탈퇴 색까지 쓴다 — 세 영역이 쓰는 백엔드 값이라 업체 · 입점 신청 상태(`store.constants.ts`)처럼 contracts 공통으로 옮기고 사본을 지운다.

```ts
// src/contracts/common/member.constants.ts
/** 회원 상태 — state_id(이용자 ACTIVE · BLOCK · LEAVE_WAIT · LEAVE, 업체 관리자 ACTIVE · BLOCK) */
export const MEMBER_STATE = {ACTIVE: 'ACTIVE', BLOCK: 'BLOCK', LEAVE_WAIT: 'LEAVE_WAIT', LEAVE: 'LEAVE'} as const;

/** 새 예약 · 연장이 막히는 이용자 상태 — 이용 제한 · 탈퇴 대기 */
export const BOOKING_BLOCKED_STATES: ReadonlyArray<string> = [MEMBER_STATE.BLOCK, MEMBER_STATE.LEAVE_WAIT];

/** 회원 상태 배지 색 — 시안(정상 ok · 정지 danger · 탈퇴 대기 warn · 탈퇴 neutral), Map 이라 상속 이름에 속지 않는다 */
const MEMBER_STATE_TONE = new Map<string, 'ok' | 'danger' | 'warn' | 'neutral'>([
    [MEMBER_STATE.ACTIVE, 'ok'],
    [MEMBER_STATE.BLOCK, 'danger'],
    [MEMBER_STATE.LEAVE_WAIT, 'warn'],
    [MEMBER_STATE.LEAVE, 'neutral'],
]);

/**
 * 회원 상태 배지 색
 *
 * @param stateId state_id
 */
export function memberStateTone(stateId: string): 'ok' | 'danger' | 'warn' | 'neutral' {
    return MEMBER_STATE_TONE.get(stateId) ?? 'neutral';
}
```

사본을 지우는 곳(동작은 그대로):

| 파일 | 지우는 것 | 바꾸는 것 |
|---|---|---|
| `src/app/(user)/me/MyPageContent.tsx` | `MEMBER_TONE` · `LEAVE_WAIT` | `memberStateTone(me.state_id)` · `MEMBER_STATE.LEAVE_WAIT` |
| `src/app/(user)/_components/MemberStateBand.tsx` | `'BLOCK'` · `'LEAVE_WAIT'` 글자 | `MEMBER_STATE.BLOCK` · `MEMBER_STATE.LEAVE_WAIT` |
| `src/app/(user)/stores/[store_id]/booking/BookingContent.tsx` · `reservation/[reservation_id]/extension/ExtensionContent.tsx` | `BLOCKED_MEMBER_STATES` | `BOOKING_BLOCKED_STATES.includes(me?.state_id ?? '')` |
| `src/app/manager/(console)/staff/staff-format.ts` | `STAFF_STATE` · `STAFF_STATE_TONE` | — |
| `staff/StaffListContent.tsx` · `staff/[user_id]/StaffDetailContent.tsx` | `STAFF_STATE_TONE[…] ?? 'neutral'` | `memberStateTone(…)` |
| `staff/[user_id]/_components/StaffAccountCard.tsx` | `STAFF_STATE` | `MEMBER_STATE.BLOCK` · `MEMBER_STATE.ACTIVE` |

### 3-2. 통계 합계 항목을 두 대시보드가 함께 — `src/contracts/stats/stats.constants.ts`

업체 관리자 대시보드의 `SUMMARY_ITEMS`(이름 · 단위 · 순서)를 관리자 대시보드도 그대로 쓴다 — 두 응답(`StatsMineSummaryResultDto` · `StatsSummaryResultDto`)이 같은 다섯 값이라 키를 글자 합으로 둔다(어느 쪽 응답에도 꽂힌다). `ManagerDashboardContent.tsx` 는 자기 `SUMMARY_ITEMS` 를 지우고 이것을 쓴다.

```ts
// src/contracts/stats/stats.constants.ts
/** 통계 값 이름 — 전체 통계 · 내 업체 통계가 같은 다섯 값 */
export type StatsSummaryKeyType = 'user_count' | 'completed_count' | 'paid_amount' | 'refund_amount' | 'profit';

/** 합계 · 월별 항목 — 카드 · 표 순서(시안 M2 · A2) */
export const STATS_SUMMARY_ITEMS: ReadonlyArray<{key: StatsSummaryKeyType; label: string; unit: string}> = [
    {key: 'user_count', label: '이용자 수', unit: '명'},
    {key: 'completed_count', label: '이용 건수', unit: '건'},
    {key: 'paid_amount', label: '결제액', unit: '원'},
    {key: 'refund_amount', label: '환불액', unit: '원'},
    {key: 'profit', label: '수익', unit: '원'},
];
```

### 3-3. 업체 전부 읽기 — `src/contracts/store/api.ts` `getStores`

`getStores` 는 `all_search_yn` 을 보내지 않아 `new StoreListDto({all_search_yn: 'Y'})` 를 넘겨도 한 쪽(20건)만 온다 — query 에 `all_search_yn: query.all_search_yn` 을 더한다(업체 목록 A4 는 기본 `N` 그대로).

```ts
// src/contracts/store/api.ts — getStores 의 query
query: {all_search_yn: query.all_search_yn, store_state_id: query.store_state_id, keyword: query.keyword, page: query.page, size: query.size},
```

### 3-4. 관리자 화면 주소 — `src/app/admin/(console)/admin-paths.ts`

Phase 16 이 걸어 둔 `storeManagersPath` · `userPath` 는 그대로 두고 목록 주소 상수 · 업체 관리자 상세를 더한다(주석의 "Phase 17 에서 화면이 생긴다"는 지운다).

```ts
/** 업체 관리자 목록 */
export const MANAGER_LIST_PATH = '/admin/managers/';

/** 이용자 목록 */
export const USER_LIST_PATH = '/admin/users/';

/**
 * 업체 관리자 상세
 *
 * @param userId 회원 ID
 */
export function managerPath(userId: string): string {
    return `${MANAGER_LIST_PATH}${encodeURIComponent(userId)}/`;
}

/**
 * 그 업체로 거른 업체 관리자 목록 — 업체 상세의 "이 업체의 업체 관리자"
 *
 * @param storeId 업체 ID
 */
export function storeManagersPath(storeId: string): string {
    return `${MANAGER_LIST_PATH}?store_id=${encodeURIComponent(storeId)}`;
}

/**
 * 이용자 상세 — 입점 신청 상세의 "이용자 상세 보기"
 *
 * @param userId 회원 ID
 */
export function userPath(userId: string): string {
    return `${USER_LIST_PATH}${encodeURIComponent(userId)}/`;
}
```

### 3-5. 주소의 업체 — `managers/manager-format.ts` `storeIdOf`

`?store_id=` 는 누구나 고쳐 칠 수 있다 — 모양이 틀린 값을 그대로 보내면 백엔드 400 오류 팝업이 뜨므로, DTO 와 같은 모양(32자 16진수)만 받고 아니면 전체 업체로 연다. page 는 이 값을 key 로도 넘겨, 메뉴로 다시 와 주소의 업체가 없어지면 거르기를 처음부터 다시 만든다(Content 상태는 처음 값만 읽는다).

```ts
// src/app/admin/(console)/managers/manager-format.ts
/** 업체 ID 모양 — ManagerAccountListDto store_id(32자 소문자 16진수) */
const STORE_ID_PATTERN = /^[a-f0-9]{32}$/;

/**
 * 주소의 업체 ID — 업체 상세의 "이 업체의 업체 관리자"(?store_id=), 없거나 모양이 틀리면 null(전체 업체)
 *
 * @param value searchParams.store_id
 */
export function storeIdOf(value: string | Array<string> | undefined): string | null {
    return typeof value === 'string' && STORE_ID_PATTERN.test(value) ? value : null;
}
```

---

## 4. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| DTO 사본 8개 | 지침서 사본 그대로(`frontend/dto/stats.md` · `manager.md` · `user.md`, 파일 이름 · 상대 import 유지) | `src/contracts/stats/dto/stats-mine.dto.ts` · `src/contracts/manager/dto/manager-staff-list.dto.ts` |
| `getStats` | 동기 · 관리자 — `withAuth` + `request` GET `/admin-service/stats`, query `start_month` · `end_month` · `environment` · `has_activity` · `page` · `size`(빈 달은 `request` 가 뺀다) | `src/contracts/stats/api.ts:12-14` `getMyStats` |
| `getManagerAccounts` · `getUsers` | 동기 · 관리자 — GET `/admin-service/manager/account` · `/admin-service/user`, query 는 DTO 값 그대로(`keyword` · `store_id` · `auth_id` · `state_id` / `keyword` · `state_id` · `sns_id` · `page` · `size`) | `src/contracts/manager/api.ts:123-125` `getManagerStaffs` |
| `getManagerAccount` · `getUser` · `getUserReservations` | 동기 · 관리자 — 경로 값 `encodeURIComponent`, `signal`, 이력은 query `page` · `size` | `src/contracts/manager/api.ts:144` `getManagerStaff` |
| `resetManagerAccountPassword` · `updateUserState` | 큐 · 관리자 — `withAuth` + `callQueue<null>` PATCH `/admin-service/manager/account/:user_id/password-reset`(본문 없음) · `/admin-service/user/:user_id/state`(본문 `UserStateDto`) | `src/contracts/manager/api.ts:175` `resetManagerStaffPassword` · `:186` `updateManagerStaffState` |
| page 4개(`managers/[user_id]` · `users` · `users/[user_id]` — 목록 page 는 1-2) | Content 만 그린다(동적 주소는 `await params`) | `src/app/admin/(console)/stores/[store_id]/page.tsx` |
| 상세 효과 · 다시 읽기 · 못 읽음 | `useEffectEvent` + `AbortController`, `reloadKey`, 못 읽으면 `EmptyState` + 목록 링크 | `src/app/admin/(console)/stores/[store_id]/AdminStoreDetailContent.tsx` |
| 확인 창 · 큐 실패 처리 | `ConfirmModal`(`danger` · `busy`), try 안은 await 만 · 실패는 `failure` 로 받아 밖에서 `handleApiError` | `src/app/manager/(console)/staff/[user_id]/_components/StaffAccountCard.tsx:72-110` |
| 업체코드 줄임 · 업체 상태 배지 색 · 예약 상태 배지 색 | `shortStoreCode` · `STORE_STATE_TONE` · `reservationStateTone`(다른 영역 것을 가져다 쓴다 — 관리자 업체 화면이 이미 `shortStoreCode` 를 그렇게 쓴다) | `src/app/manager/manager-auth.ts:70` · `src/app/admin/(console)/stores/store-format.ts:8` · `src/app/(user)/reservation/reservation-state.ts:15` |

## 5. 스타일 — 시안 값

| 파일 | 내용 | 근거 |
|---|---|---|
| `src/app/css/admin/AdminDashboardContent.module.css` | 준비 중 자리를 바꾼다 — `.page` · `.title` · `.subtitle` · `.filter` · `.tilde` · `.filterNote` · `.kpis` · `.kpi` · `.kpiLabel` · `.kpiValue` · `.profit` · `.negative`(`--danger`) · `.number` · `.mono` · `.tableNote` | 시안 A2 · `src/app/css/manager/ManagerDashboardContent.module.css` |
| `src/app/css/admin/AdminList.module.css` | `.cell`(글자 + 배지 한 줄 · 간격 6px) 더함 | 시안 A5 표 `.cell-2` |
| `src/app/css/admin/AdminDetail.module.css` | `.notes`(참고 목록 · 작은 글자) · `.tiles`(4칸 · 좁으면 2칸) · `.tile` · `.tileValue` · `.tileNote` 더함 | 시안 A5 초기화 카드 · A6 예약 요약 |
| `src/app/css/admin/ListFilter.module.css` | `.filters`(거르기 묶음 줄 — 감싸기 · 간격 12px 20px) · `.select`(앞 글자 + 고르기 한 줄, 고르기 최소 180px) 더함 | 시안 A5 · A6 목록 위 줄 |

## 테스트

spec 의 "결과" 표에서 ✓ 표시된 8건과 "계산 규칙" 표 6건(비밀번호를 초기화할 수 있는지 3 · 이용 기간 글자 3 — 먼저 쓴다)을 그대로 테스트로 옮긴다. 여기에는 추가분만 적는다.

| 종류 | 대상 | 이유 |
|---|---|---|
| 회귀(새 테스트 없음) | `src/test/app/(user)/**` · `src/test/app/manager/(console)/**` · `src/test/app/admin/(console)/**` | 3-1 · 3-2 에서 옮긴 값(회원 상태 · 합계 항목)을 이용자 화면 · 업체 관리자 콘솔 · M2 가, 바꾼 `ListFilter` 를 입점 신청 · 업체 목록이 그대로 쓰는지 — 기존 테스트가 그대로 통과해야 한다 |

테스트 모양 — 파일은 `src/test/app/admin/(console)/AdminDashboardContent.test.tsx`(2) · `managers/manager-format.test.ts`(계산 3) · `managers/AdminManagerListContent.test.tsx`(2) · `managers/[user_id]/AdminManagerDetailContent.test.tsx`(1) · `users/user-format.test.ts`(계산 3) · `users/AdminUserListContent.test.tsx`(1) · `users/[user_id]/AdminUserDetailContent.test.tsx`(2), 픽스처 `admin-fixture.tsx` 에 통계 · 업체 관리자 목록 · 상세 · 이용자 목록 · 상세 · 예약 이력 응답을 더한다. contracts api 는 mock, 그래프는 M2 테스트처럼 `BarChart` 를 mock.
- 대시보드 — 처음 1번 인자(`start_month` · `end_month` null · `LIVE` · `'1'` · 1쪽 · 20건) → 달 칸에 받은 기간 → 달 바꿈 · 테스트 결제 · 모든 업체 · 조회 → 2번째 인자(`TEST` · `'0'` · 1쪽) · 합계 카드 · 월별 표(달 줄 + 합계 줄) · 업체 링크 주소 / 2쪽 → 3번째 인자가 2번째와 같고 쪽만 2(칸만 고친 달은 섞이지 않는다).
- 업체 관리자 목록 — 업체 목록 1번(`all_search_yn: 'Y'`) · 업체 고름 · 총괄매니저 · 정지 · 검색어 → 마지막 인자(`{store_id, auth_id: 'HEAD_MANAGER', state_id: 'BLOCK', keyword, page: 1}`) · 표 글자(영업중지 배지 · 업체코드 앞 8자 · 임시 비밀번호 배지 · 휴대폰 없음 "—") / `storeId` 를 넘겨 그리면 첫 부름부터 그 업체 · 업체 칸 값.
- 업체 관리자 상세 — 초기화 → 확인 창 문구 → 초기화 1번(그 계정) → 띠 글자 · 상세 2번.
- 이용자 목록 — 정지 칩 · 카카오 · 검색어 → 마지막 인자(`{state_id: 'BLOCK', sns_id: 'KAKAO', keyword, page: 1}`) · 표 글자(검색 코드 앞 8자 · 미인증 배지 · 탈퇴 "—").
- 이용자 상세 — 사유(앞뒤 빈칸) → 이용 제한 → 확인 창 → 상태 변경 1번(`{state_id: 'BLOCK', block_comment: 다듬은 사유}`) → 띠 · 상세 2번 / 정지 이용자 → 제한 해제 → 확인 창 없이 1번(`{state_id: 'ACTIVE'}`, 사유 없음) · 상세 2번.

## 만드는 순서

1. DTO 사본 8개 → contracts api 8개 · `getStores` 의 `all_search_yn`(3-3).
2. `member.constants.ts` → 이용자 화면 · 업체 관리자 콘솔 사본 지움(3-1), `stats.constants.ts` → M2 가 쓰게(3-2).
3. 계산 테스트 6건 → `manager-format.ts`(`passwordResetOf` · `managerAuthTone` · `storeIdOf`) · `user-format.ts`(`usagePeriodText`).
4. `admin-paths.ts`(3-4) · `FilterChips` · `FilterSelect` · `ListFilter`(1-2) · css 4개.
5. A2 대시보드(`AdminDashboardContent` · page 주석).
6. A5 목록 · 상세(page · Content · `ManagerPasswordCard`).
7. A6 목록 · 상세(page · Content · `UserStateCard` · `UserReservationsCard`).
8. 화면 테스트 5파일(8건) + 픽스처 → 타입 검사 · 테스트(전체 — 회귀 포함).
9. 문서 — `AGENTS.md`(로그인 화면 줄의 관리자 콘솔 범위 → A2 · A5 · A6 생김, 회원 상태 값 `member.constants.ts`), `docs/architecture.md`(admin 폴더 줄 · `managers/` · `users/`).
