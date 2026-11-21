'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { shortStoreCode } from '@/app/manager/manager-auth';
import { lookupName } from '@/contracts/common/lookup';
import { STORE_STATE } from '@/contracts/common/store.constants';
import { getStores } from '@/contracts/store/api';
import { StoreListDto, StoreListResultDto } from '@/contracts/store/dto/store-list.dto';
import { handleApiError } from '@/shared/api/error';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone } from '@/shared/utils/format';
import { storePath } from '../admin-paths';
import ListFilter, { FIRST_LIST_QUERY, ListQueryType } from '../_components/ListFilter';
import { businessNumberText, OPEN_BADGE, STORE_STATE_TONE } from './store-format';
import styles from '@/app/css/admin/AdminList.module.css';

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 상태 칩 — 시안 A4(전체 · 활성 · 영업중지 · 탈퇴) */
const STATE_CHIPS: ReadonlyArray<{value: string | null; label: string}> = [
    {value: null, label: '전체'},
    {value: STORE_STATE.ACTIVE, label: '활성'},
    {value: STORE_STATE.SUSPEND, label: '영업중지'},
    {value: STORE_STATE.LEAVE, label: '탈퇴'},
];

/**
 * A4 업체 목록 — 상태 칩 · 검색 · 표(등록일 최신순)
 *
 * @returns
 */
export default function AdminStoreListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰
    const loadPage = useEffectEvent((query: ListQueryType, signal: AbortSignal) => getStores(auth, new StoreListDto({page: query.page, size: PAGE_SIZE, store_state_id: query.state, keyword: query.keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [query, setQuery] = useState<ListQueryType>(FIRST_LIST_QUERY);   // ①②③ 상태 · 검색어 · 쪽
    const [result, setResult] = useState<StoreListResultDto | null>(null); // ① 목록

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
        // 업체 목록
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <h1 className={styles.title}>업체</h1>
                <p className={styles.subtitle}>입점 승인으로 만들어진 업체입니다. 등록일 최신순. 영업중지 · 탈퇴 업체는 이용자 지도에 나오지 않습니다.</p>
            </div>

            {/* ② 거르기 */}
            <ListFilter stateLabel="업체 상태" states={STATE_CHIPS} placeholder="상호명 · 사업자등록번호 · 대표자명" query={query} onChange={setQuery} />

            {/* ① 표 · 빈 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="조건에 맞는 업체가 없습니다." description='상태를 "전체" 로 바꾸거나 검색어를 지워 보세요.' /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">업체코드</th><th scope="col">상호명</th><th scope="col">사업자등록번호</th><th scope="col">대표자</th><th scope="col">전화</th><th scope="col">주소</th><th scope="col">영업중</th><th scope="col">상태</th></tr></thead>
                    <tbody>
                        {result.list.map((store) => {
                            const open = OPEN_BADGE[store.is_open === 1 ? 'open' : 'closed'];
                            const business = businessNumberText(store.business_number);
                            return (
                                <tr key={store.store_id}>
                                    <td className={styles.mono} title={store.store_code}>{shortStoreCode(store.store_code)}</td>
                                    <td><Link href={storePath(store.store_id)}>{store.store_name}</Link></td>
                                    <td className={business.left ? `${styles.mono} ${styles.muted}` : styles.number} title={store.business_number}>{business.text}</td>
                                    <td>{store.owner_name}</td>
                                    <td className={styles.number}>{formatPhone(store.phone)}</td>
                                    <td>{store.address}</td>
                                    <td><Badge tone={open.tone}>{open.label}</Badge></td>
                                    <td><Badge tone={STORE_STATE_TONE[store.store_state_id] ?? 'neutral'}>{lookupName('store_state_id', store.store_state_id)}</Badge></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            ) : null}

            {/* ③ 페이지 */}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setQuery((prev) => ({...prev, page: Number(next)}))} label="업체 페이지" />
        </div>
    );
}
