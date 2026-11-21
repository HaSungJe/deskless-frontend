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
import { listNumber } from '@/shared/utils/util';
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
    const [page, setPage] = useState<number>(1);                                     // ⑤ 보는 쪽
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
            <div className={styles.cardBody}>
                <p className={styles.muted}>이용 시작 최신순 · 결제 대기 만료 제외</p>

                {/* 표 · 빈 이력 */}
                {result && result.list.length === 0 ? <EmptyState title="아직 예약이 없습니다." /> : null}
                {result && result.list.length > 0 ? (
                    <Table>
                        <thead><tr><th scope="col">번호</th><th scope="col">이용 기간</th><th scope="col">업체</th><th scope="col">객실 그룹 · 호실</th><th scope="col">상품</th><th scope="col">합계 금액</th><th scope="col">상태</th><th scope="col">취소</th><th scope="col">예약일시</th></tr></thead>
                        <tbody>
                            {result.list.map((item, index) => (
                                <tr key={item.reservation_id}>
                                    <td className={styles.mono}>{listNumber(result.pagination, index)}</td>
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
            </div>
        </Card>
    );
}
