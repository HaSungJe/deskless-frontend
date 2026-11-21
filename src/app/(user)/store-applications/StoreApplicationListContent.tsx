'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getMyStoreApplications } from '@/contracts/store/api';
import { StoreMyApplicationItemResultDto, StoreMyApplicationListDto } from '@/contracts/store/dto/store-my-application-list.dto';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { PaginationType } from '@/shared/types/pagination';
import UserTopBar from '../_components/UserTopBar';
import ApplicationCard from './_components/ApplicationCard';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/StoreApplicationListContent.module.css';

/** 한 쪽 신청 수 */
const PAGE_SIZE = 20;

/** 받은 한 쪽 — 응답에 data 가 없으면 빈 목록 */
type ApplicationPageType = {
    list: Array<StoreMyApplicationItemResultDto>; // 신청(신청일 최신순)
    pagination: PaginationType | null;            // 페이지
};

/** 더하기 — 시안 U11 새 입점 신청 */
const PLUS_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>;

/**
 * U11 입점 신청 목록 — 새 입점 신청 · 내 신청 카드 · 페이지
 *
 * @returns
 */
export default function StoreApplicationListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 이용자 토큰
    const loadPage = useEffectEvent((page: number, signal: AbortSignal) => getMyStoreApplications(auth, new StoreMyApplicationListDto({page, size: PAGE_SIZE}), signal)); // 그때의 auth 로

    // 상태
    const [page, setPage] = useState<number>(1);                               // 보는 쪽
    const [result, setResult] = useState<ApplicationPageType | null>(null);    // 목록 — 불러오기 전 null

    // 계산 값
    const applications = result?.list ?? []; // 신청

    // 효과
    useEffect(() => {
        // ① · ④ 쪽이 바뀌면 그 쪽 — 떠나면 취소
        const controller = new AbortController();
        loadPage(page, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult({list: next?.list ?? [], pagination: next?.pagination ?? null});
            }
        }).catch((error: unknown) => handleApiError(error));

        return () => {
            controller.abort();
        };
    }, [page]);

    return (
        // 입점 신청 목록
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="입점 신청" backHref="/me/" />

            <div className={pageStyles.body}>
                {/* ② 새 입점 신청 */}
                <section className={pageStyles.card}>
                    <h2 className={pageStyles.cardTitle}>무인 객실 업체를 운영하나요?</h2>
                    <p className={styles.introText}>입점 신청을 보내면 관리자가 확인한 뒤 업체 콘솔을 열어 드려요.</p>
                    <Link href="/store-applications/new/" className={buttonClass({variant: 'primary', full: true})}>{PLUS_ICON}새 입점 신청</Link>
                </section>

                {/* ② · ③ 내 신청 */}
                <h2 className={styles.sectionTitle}>내 신청</h2>
                {result && applications.length === 0 ? <EmptyState title="아직 보낸 입점 신청이 없어요" description="위의 새 입점 신청으로 시작해요." /> : null}
                {applications.map((item) => <ApplicationCard key={item.store_application_id} item={item} />)}

                {/* ④ 페이지 — 항상 아래쪽 */}
                <div className={pageStyles.pager}><Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="입점 신청 페이지" /></div>
            </div>
        </div>
    );
}
