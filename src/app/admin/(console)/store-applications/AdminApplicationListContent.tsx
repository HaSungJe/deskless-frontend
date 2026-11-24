'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { applicationStateTone, STORE_APPLICATION_STATE } from '@/contracts/common/store.constants';
import { getStoreApplications } from '@/contracts/store/api';
import { StoreApplicationListDto, StoreApplicationListResultDto } from '@/contracts/store/dto/store-application-list.dto';
import { handleApiError } from '@/shared/api/error';
import ListFilter, { FIRST_LIST_QUERY, ListQueryType } from '@/shared/components/console/ListFilter';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatBusinessNumber, toKst } from '@/shared/utils/format';
import { listNumber } from '@/shared/utils/util';
import { applicationPath, storePath } from '../admin-paths';
import styles from '@/app/css/admin/AdminList.module.css';

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 상태 칩 — 시안 A3(전체 · 대기 · 승인 · 반려) */
const STATE_CHIPS: ReadonlyArray<{value: string | null; label: string}> = [
    {value: null, label: '전체'},
    {value: STORE_APPLICATION_STATE.WAIT, label: '대기'},
    {value: STORE_APPLICATION_STATE.APPROVED, label: '승인'},
    {value: STORE_APPLICATION_STATE.REJECTED, label: '반려'},
];

/**
 * A3 입점 신청 목록 — 상태 칩 · 검색 · 표(신청일 최신순)
 *
 * @returns
 */
export default function AdminApplicationListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰
    const loadPage = useEffectEvent((query: ListQueryType, signal: AbortSignal) => getStoreApplications(auth, new StoreApplicationListDto({page: query.page, size: PAGE_SIZE, store_application_state_id: query.state, keyword: query.keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [query, setQuery] = useState<ListQueryType>(FIRST_LIST_QUERY);              // ①②③ 상태 · 검색어 · 쪽
    const [result, setResult] = useState<StoreApplicationListResultDto | null>(null); // ① 목록

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
        // 입점 신청 목록
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <h1 className={styles.title}>입점 신청</h1>
                <p className={styles.subtitle}>이용자가 보낸 입점 신청을 보고 승인 · 반려합니다. 신청일 최신순.</p>
            </div>

            {/* ② 거르기 */}
            <ListFilter stateLabel="신청 상태" states={STATE_CHIPS} placeholder="상호명 · 사업자등록번호" query={query} onChange={setQuery} />

            {/* ① 표 · 빈 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="조건에 맞는 입점 신청이 없습니다." description='상태를 "전체" 로 바꾸거나 검색어를 지워 보세요.' /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">번호</th><th scope="col">상호명</th><th scope="col">사업자등록번호</th><th scope="col">대표자</th><th scope="col">상태</th><th scope="col">신청일시</th><th scope="col">처리일시</th><th scope="col">만든 업체</th></tr></thead>
                    <tbody>
                        {result.list.map((item, index) => (
                            <tr key={item.store_application_id}>
                                <td className={styles.number}>{listNumber(result.pagination, index)}</td>
                                <td><Link href={applicationPath(item.store_application_id)}>{item.store_name}</Link></td>
                                <td className={styles.number}>{formatBusinessNumber(item.business_number)}</td>
                                <td>{item.owner_name}</td>
                                <td><Badge tone={applicationStateTone(item.store_application_state_id)}>{lookupName('store_application_state_id', item.store_application_state_id)}</Badge></td>
                                <td className={styles.number}>{toKst(item.created_at, 'YYYY-MM-DD HH:mm')}</td>
                                <td className={styles.number}>{item.reviewed_at ? toKst(item.reviewed_at, 'YYYY-MM-DD HH:mm') : '—'}</td>
                                <td>{item.store_id ? <Link href={storePath(item.store_id)}>업체 보기</Link> : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}

            {/* ③ 페이지 */}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setQuery((prev) => ({...prev, page: Number(next)}))} label="입점 신청 페이지" />
        </div>
    );
}
