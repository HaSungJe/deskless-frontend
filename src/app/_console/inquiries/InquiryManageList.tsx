'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { getInquiryCategories } from '@/contracts/inquiry/api';
import { InquiryCategoryItemResultDto } from '@/contracts/inquiry/dto/inquiry-category-list.dto';
import { InquiryManageListDto, InquiryManageListResultDto } from '@/contracts/inquiry/dto/inquiry-manage-list.dto';
import { INQUIRY_STATE_FILTERS, inquiryStateTone } from '@/contracts/inquiry/inquiry-state';
import { handleApiError } from '@/shared/api/error';
import { FilterOptionType } from '@/shared/components/console/FilterChips';
import FilterSelect from '@/shared/components/console/FilterSelect';
import ListFilter, { FIRST_LIST_QUERY, ListQueryType } from '@/shared/components/console/ListFilter';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { listNumber } from '@/shared/utils/util';
import { INQUIRY_MANAGE, inquiryManagePath, InquiryScopeType } from './inquiry-manage';
import styles from '@/app/css/console/InquiryManageList.module.css';

/** 문의 목록 거르기 — 상태 · 검색어 · 쪽 + 카테고리 */
type InquiryQueryType = ListQueryType & {
    category: string | null; // 카테고리(null 이 전체)
};

type InquiryManageListProps = {
    scope: InquiryScopeType; // 업체 관리자(/mine) · 관리자
};

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 상태 칩 — 전체 · 접수 · 답변완료 · 블라인드 */
const STATE_CHIPS: ReadonlyArray<FilterOptionType> = INQUIRY_STATE_FILTERS.map((value) => ({value, label: value ? lookupName('inquiry_state_id', value) : '전체'}));

/**
 * 문의 관리 목록 — 카테고리 · 상태 · 검색 · 표(문의일 최신순). 업체 관리자는 내 업체, 관리자는 바로방 문의
 * - 문의 · 회원 ID 는 보이지 않는다 — 줄 번호는 검색 결과 기준(listNumber)
 *
 * @param param0
 * @returns
 */
export default function InquiryManageList({scope}: InquiryManageListProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 그 영역 토큰
    const manage = INQUIRY_MANAGE[scope]; // 부를 API · 링크 · 안내
    const loadPage = useEffectEvent((query: InquiryQueryType, signal: AbortSignal) => manage.list(auth, new InquiryManageListDto({page: query.page, size: PAGE_SIZE, inquiry_category_id: query.category, inquiry_state_id: query.state, keyword: query.keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [query, setQuery] = useState<InquiryQueryType>({...FIRST_LIST_QUERY, category: null}); // ③④ 카테고리 · 상태 · 검색어 · 쪽
    const [categories, setCategories] = useState<Array<InquiryCategoryItemResultDto>>([]);        // ② 카테고리 고르기
    const [result, setResult] = useState<InquiryManageListResultDto | null>(null);                // ② 목록

    // 계산 값
    const categoryOptions: ReadonlyArray<FilterOptionType> = [{value: null, label: '전체 카테고리'}, ...categories.map((item) => ({value: item.inquiry_category_id, label: item.inquiry_category_name}))]; // ③ 카테고리 고르기

    // 효과
    useEffect(() => {
        // ② 카테고리 — 한 번(떠나면 결과를 버린다)
        const controller = new AbortController();
        getInquiryCategories(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setCategories(next?.list ?? []);
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
        // ②③④ 그 거르기 · 쪽 목록(떠나면 결과를 버린다)
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
        // 문의 목록
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <h1 className={styles.title}>문의</h1>
                <p className={styles.subtitle}>{manage.subtitle}</p>
            </div>

            {/* ③ 거르기 — 카테고리 · 상태 · 검색 */}
            <ListFilter
                stateLabel="문의 상태"
                states={STATE_CHIPS}
                placeholder="제목 · 내용"
                query={query}
                onChange={setQuery}
                leading={<FilterSelect id="inquiry-category" label="카테고리" options={categoryOptions} value={query.category} onPick={(category) => setQuery((prev) => ({...prev, category, page: 1}))} />}
            />

            {/* ② 표 · 빈 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="조건에 맞는 문의가 없습니다." description="거르기를 풀거나 검색어를 지워 보세요." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">번호</th><th scope="col">카테고리</th><th scope="col">제목</th><th scope="col">작성자</th><th scope="col">상태</th><th scope="col">답변일시</th><th scope="col">문의일시</th></tr></thead>
                    <tbody>
                        {result.list.map((item, index) => (
                            <tr key={item.inquiry_id}>
                                <td className={styles.number}>{listNumber(result.pagination, index)}</td>
                                <td>{item.inquiry_category_name}</td>
                                <td className={styles.titleCell}><Link href={inquiryManagePath(scope, item.inquiry_id)}>{item.title}</Link></td>
                                <td>{item.user_nickname}</td>
                                <td><Badge tone={inquiryStateTone(item.inquiry_state_id)}>{item.inquiry_state_name}</Badge></td>
                                <td className={styles.number}>{item.answered_at ? toKst(item.answered_at, 'YYYY-MM-DD HH:mm') : '—'}</td>
                                <td className={styles.number}>{toKst(item.created_at, 'YYYY-MM-DD HH:mm')}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}

            {/* ④ 페이지 */}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setQuery((prev) => ({...prev, page: Number(next)}))} label="문의 페이지" />
        </div>
    );
}
