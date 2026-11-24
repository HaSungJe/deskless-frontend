'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { getInquiryCategories, getMyInquiries } from '@/contracts/inquiry/api';
import { InquiryCategoryItemResultDto } from '@/contracts/inquiry/dto/inquiry-category-list.dto';
import { InquiryListDto, InquiryListItemResultDto } from '@/contracts/inquiry/dto/inquiry-list.dto';
import { INQUIRY_STATE_FILTERS, inquiryStateTone } from '@/contracts/inquiry/inquiry-state';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Chip from '@/shared/components/ui/form/Chip';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { PaginationType } from '@/shared/types/pagination';
import { formatKoreanDate } from '@/shared/utils/format';
import UserTopBar from '../_components/UserTopBar';
import { INQUIRY_NEW_PATH, inquiryPath, inquiryTargetName } from './inquiry-format';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/InquiryListContent.module.css';

/** 한 쪽 문의 수 */
const PAGE_SIZE = 20;

/** 목록 거르기 · 쪽 */
type InquiryQueryType = {
    category: string | null; // 카테고리 칩(null 이 전체)
    state: string | null;    // 상태 칩(null 이 전체)
    page: number;            // 보는 쪽
};

/** 받은 한 쪽 — 응답에 data 가 없으면 빈 목록 */
type InquiryPageType = {
    list: Array<InquiryListItemResultDto>; // 문의(최신순)
    pagination: PaginationType | null;     // 페이지
};

/** 처음 거르기 — 전체 · 1쪽 */
const FIRST_QUERY: InquiryQueryType = {category: null, state: null, page: 1};

/**
 * 내 문의 목록 — 문의하기 · 카테고리 · 상태 칩 · 카드(번호 없음) · 페이지
 *
 * @returns
 */
export default function InquiryListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 이용자 토큰
    const loadPage = useEffectEvent((query: InquiryQueryType, signal: AbortSignal) => getMyInquiries(auth, new InquiryListDto({page: query.page, size: PAGE_SIZE, inquiry_category_id: query.category, inquiry_state_id: query.state}), signal)); // 그때의 auth 로

    // 상태
    const [query, setQuery] = useState<InquiryQueryType>(FIRST_QUERY);                   // ③④ 칩 · 쪽
    const [categories, setCategories] = useState<Array<InquiryCategoryItemResultDto>>([]); // ② 카테고리 칩
    const [result, setResult] = useState<InquiryPageType | null>(null);                  // ② 목록 — 불러오기 전 null

    // 계산 값
    const inquiries = result?.list ?? [];                             // 문의
    const filtered = query.category !== null || query.state !== null; // 거른 뒤 — 빈 안내 문구

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
        // ②③④ 그 칩 · 쪽 목록(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadPage(query, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult({list: next?.list ?? [], pagination: next?.pagination ?? null});
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
        // 내 문의 목록
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="문의" parents={[{label: '내 정보', href: '/me/'}]} />

            <div className={pageStyles.body}>
                {/* ⑤ 문의하기 */}
                <Link href={INQUIRY_NEW_PATH} className={buttonClass({variant: 'primary', full: true})}>문의하기</Link>

                {/* ③ 카테고리 · 상태 칩 — 전체는 값을 빼고 부른다 */}
                <div role="group" aria-label="카테고리" className={styles.chips}>
                    <Chip pressed={query.category === null} onClick={() => setQuery((prev) => ({...prev, category: null, page: 1}))}>전체</Chip>
                    {categories.map((item) => <Chip key={item.inquiry_category_id} pressed={query.category === item.inquiry_category_id} onClick={() => setQuery((prev) => ({...prev, category: item.inquiry_category_id, page: 1}))}>{item.inquiry_category_name}</Chip>)}
                </div>
                <div role="group" aria-label="문의 상태" className={styles.chips}>
                    {INQUIRY_STATE_FILTERS.map((value) => <Chip key={value ?? 'ALL'} pressed={query.state === value} onClick={() => setQuery((prev) => ({...prev, state: value, page: 1}))}>{value ? lookupName('inquiry_state_id', value) : '전체'}</Chip>)}
                </div>

                {/* ② 빈 목록 · 카드 */}
                {result && inquiries.length === 0 ? (filtered
                    ? <EmptyState title="조건에 맞는 문의가 없어요" description="다른 조건을 골라 보세요." />
                    : <EmptyState title="아직 문의가 없어요" description="위의 문의하기로 시작해요." />) : null}
                {inquiries.map((item) => (
                    <Link key={item.inquiry_id} href={inquiryPath(item.inquiry_id)} className={styles.card}>
                        <div className={styles.head}><strong className={styles.title}>{item.title}</strong><Badge tone={inquiryStateTone(item.inquiry_state_id)}>{item.inquiry_state_name}</Badge></div>
                        <span className={styles.meta}>{item.inquiry_category_name} · {inquiryTargetName(item.store_name)}</span>
                        <span className={styles.date}>문의 {formatKoreanDate(item.created_at)}{item.answered_at ? ` · 답변 ${formatKoreanDate(item.answered_at)}` : ''}</span>
                    </Link>
                ))}

                {/* ④ 페이지 — 항상 아래쪽 */}
                <div className={pageStyles.pager}><Pagination pagination={result?.pagination ?? null} movePage={(next) => setQuery((prev) => ({...prev, page: Number(next)}))} label="문의 페이지" /></div>
            </div>
        </div>
    );
}
