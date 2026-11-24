'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { MEMBER_STATE, memberStateTone } from '@/contracts/common/member.constants';
import { AUTH_ID } from '@/contracts/common/roles';
import { STORE_STATE } from '@/contracts/common/store.constants';
import { getManagerAccounts } from '@/contracts/manager/api';
import { ManagerAccountListDto, ManagerAccountListResultDto } from '@/contracts/manager/dto/manager-account-list.dto';
import { getStores } from '@/contracts/store/api';
import { StoreListDto } from '@/contracts/store/dto/store-list.dto';
import { handleApiError } from '@/shared/api/error';
import FilterChips, { FilterOptionType } from '@/shared/components/console/FilterChips';
import ListFilter, { FIRST_LIST_QUERY, ListQueryType } from '@/shared/components/console/ListFilter';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import SearchSelect, { SearchSelectOptionType } from '@/shared/components/ui/form/SearchSelect';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone, toKst } from '@/shared/utils/format';
import { listNumber } from '@/shared/utils/util';
import { managerPath } from '../admin-paths';
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
 * - 업체 고르기는 업체 목록 전부(페이지 없이)로 채우고, 칸에 쳐서 거른다(검색 고르기 — 사용자 2026-11-22, 앞 글자 없이)
 *
 * @param param0
 * @returns
 */
export default function AdminManagerListContent({storeId}: AdminManagerListContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                       // 관리자 토큰
    const loadStores = useEffectEvent((signal: AbortSignal) => getStores(auth, new StoreListDto({all_search_yn: 'Y'}), signal)); // 그때의 auth 로
    const loadPage = useEffectEvent((query: ManagerQueryType, signal: AbortSignal) => getManagerAccounts(auth, new ManagerAccountListDto({page: query.page, size: PAGE_SIZE, store_id: query.store, auth_id: query.auth, state_id: query.state, keyword: query.keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [query, setQuery] = useState<ManagerQueryType>({...FIRST_LIST_QUERY, store: storeId, auth: null}); // ①②③ 업체 · 권한 · 상태 · 검색어 · 쪽 — 처음 업체는 주소 값
    const [stores, setStores] = useState<Array<SearchSelectOptionType>>([]);                                  // ① 업체 고르기(받은 업체)
    const [result, setResult] = useState<ManagerAccountListResultDto | null>(null);                           // ① 목록

    // 계산 값
    const storeOptions: Array<SearchSelectOptionType> = [{value: '', label: '전체 업체'}, ...stores]; // 업체 고르기 — 맨 앞이 전체(빈 값)

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
                        <SearchSelect id="manager-store" label="업체" options={storeOptions} value={query.store ?? ''} placeholder="업체 검색" onChange={(store) => pick({store: store || null})} />
                        <FilterChips label="권한" groupLabel="권한" options={AUTH_CHIPS} value={query.auth} onPick={(auth) => pick({auth})} />
                    </>
                )}
            />

            {/* ① 표 · 빈 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="조건에 맞는 업체 관리자가 없습니다." description="거르기를 풀거나 검색어를 지워 보세요." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">번호</th><th scope="col">업체</th><th scope="col">아이디</th><th scope="col">이름</th><th scope="col">휴대폰</th><th scope="col">권한</th><th scope="col">상태</th><th scope="col">등록일시</th></tr></thead>
                    <tbody>
                        {result.list.map((account, index) => (
                            <tr key={account.user_id}>
                                <td className={styles.number}>{listNumber(result.pagination, index)}</td>
                                <td><span className={styles.cell}>{account.store_name}{account.store_state_id !== STORE_STATE.ACTIVE ? <Badge tone={STORE_STATE_TONE[account.store_state_id] ?? 'neutral'}>{lookupName('store_state_id', account.store_state_id)}</Badge> : null}</span></td>
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
