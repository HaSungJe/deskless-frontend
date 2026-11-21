'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { RESERVATION_STATE } from '@/contracts/common/reservation.constants';
import { getMyReservations } from '@/contracts/reservation/api';
import { ReservationListDto, ReservationListItemResultDto } from '@/contracts/reservation/dto/reservation-list.dto';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { PaginationType } from '@/shared/types/pagination';
import { formatDateTimeRange, formatPrice } from '@/shared/utils/format';
import { reservationStateTone } from './reservation-state';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/MyReservationContent.module.css';

/** 한 쪽 예약 수 */
const PAGE_SIZE = 20;

/** 받은 한 쪽 — 응답에 data 가 없으면 빈 목록 */
type ReservationPageType = {
    list: Array<ReservationListItemResultDto>; // 예약(입실 최근순)
    pagination: PaginationType | null;          // 페이지
};

/** 경고 아이콘 — 시안 U6 사용중지 */
const ALERT_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5" /><path d="M12 16.5v.01" /></svg>;

/**
 * U6 내 예약 목록 — 카드 · 페이지, 비면 지도로
 *
 * @returns
 */
export default function MyReservationContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 이용자 토큰
    const loadPage = useEffectEvent((page: number, signal: AbortSignal) => getMyReservations(auth, new ReservationListDto({page, size: PAGE_SIZE}), signal)); // 그때의 auth 로(효과를 다시 걸지 않는다)

    // 상태
    const [page, setPage] = useState<number>(1);                                  // 보는 쪽
    const [result, setResult] = useState<ReservationPageType | null>(null);         // 목록 — 불러오기 전 null

    // 계산 값
    const reservations = result?.list ?? []; // 예약(입실 최근순)

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
        // 내 예약
        <div className={pageStyles.page}>
            {/* 머리 */}
            <header className={pageStyles.plainHeader}><h1 className={pageStyles.plainTitle}>내 예약</h1></header>

            <div className={pageStyles.body}>
                {/* ④ 빈 목록 */}
                {result && reservations.length === 0 ? (
                    <EmptyState title="아직 예약이 없어요" description="지도에서 가까운 무인 객실을 찾아 보세요." action={<Link href="/" className={buttonClass({variant: 'primary'})}>지도에서 찾기</Link>} />
                ) : null}

                {/* ② · ③ 예약 카드 · 사용중지 경고 */}
                {reservations.map((item) => (
                    <Link key={item.reservation_id} href={`/reservation/${encodeURIComponent(item.reservation_id)}/`} className={styles.card}>
                        <div className={styles.head}>
                            <strong className={styles.store}>{item.store_name}</strong>
                            <Badge tone={reservationStateTone(item.reservation_state_id)}>{item.reservation_state_name}</Badge>
                        </div>
                        <span className={styles.meta}>{item.room_group_name} · {item.room_name} · {item.room_plan_type_name}</span>
                        <span className={styles.date}>{formatDateTimeRange(item.start_at, item.end_at)}</span>
                        <div className={styles.total}>
                            <span className={styles.meta}>합계</span>
                            <strong className={styles.price}>{formatPrice(item.total_price)}</strong>
                        </div>
                        {item.is_room_disabled === 1 && (item.reservation_state_id === RESERVATION_STATE.CONFIRMED || item.reservation_state_id === RESERVATION_STATE.CHECKED_IN) ? (
                            <span className={styles.alert}>{ALERT_ICON}예약한 호실이 사용중지되어 전액 환불로 취소할 수 있어요</span>
                        ) : null}
                    </Link>
                ))}

                {/* ④ 페이지 — 항상 아래쪽 */}
                <div className={pageStyles.pager}><Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="내 예약 페이지" /></div>
            </div>
        </div>
    );
}
