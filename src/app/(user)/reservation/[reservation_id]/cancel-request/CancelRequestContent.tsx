'use client';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { approveCancelRequest, getCancelRequest, rejectCancelRequest } from '@/contracts/reservation/api';
import { ReservationCancelRequestApproveResultDto } from '@/contracts/reservation/dto/reservation-cancel-request-approve.dto';
import { ReservationCancelRequestResultDto } from '@/contracts/reservation/dto/reservation-cancel-request.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import { ApiError } from '@/shared/api/request';
import Timer from '@/shared/components/Timer';
import Button from '@/shared/components/ui/button/Button';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatDateTime, formatPrice, toKst } from '@/shared/utils/format';
import UserTopBar from '../../../_components/UserTopBar';
import { canAnswerCancelRequest } from '../reservation-rules';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/CancelRequestContent.module.css';

type CancelRequestContentProps = {
    reservationId: string; // 주소의 예약 ID
};

/** 답할 수 없는 요청(처리됨 · 만료 · 없음) */
const CANCEL_REQUEST_CLOSED_MESSAGE = '이미 처리되었거나 만료된 요청이에요.';

/** 남은 시간이 다 됨 */
const CANCEL_REQUEST_EXPIRED_MESSAGE = '요청이 만료되었어요. 예약은 그대로 이어져요.';

/** 거절 뒤 */
const CANCEL_REQUEST_REJECTED_MESSAGE = '취소 요청을 거절했어요. 예약은 그대로 이어져요.';

/** 경고 — 시안 U8 */
const ALERT_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5" /><path d="M12 16.5v.01" /></svg>;

/**
 * U8 이용 중 취소 동의 — 업체 사유 · 환불 금액 · 남은 시간, 요청 중이고 만료 전일 때만 승인 · 거절
 *
 * @param param0
 * @returns
 */
export default function CancelRequestContent({reservationId}: CancelRequestContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                                                       // 답한 뒤 · 못 하면 U7
    const auth = useContext(AuthContext);                                             // 이용자 토큰
    const detailPath = `/reservation/${encodeURIComponent(reservationId)}/`;          // U7
    const loadRequest = useEffectEvent((signal: AbortSignal) => getCancelRequest(auth, reservationId, signal)); // 그때의 auth 로
    const leave = useEffectEvent((message: string): void => {
        showErrorPopup(message);
        router.replace(detailPath);
    });                                                                               // 안내 뒤 U7

    // 상태
    const [request, setRequest] = useState<ReservationCancelRequestResultDto | null>(null); // 답할 수 있는 요청
    const [busy, setBusy] = useState<boolean>(false);                                       // 승인 · 거절 중

    // 효과
    useEffect(() => {
        // ① · ② 요청 — 답할 수 없으면(처리됨 · 만료 · 없음) 안내 뒤 U7
        const controller = new AbortController();
        loadRequest(controller.signal).then((next) => {
            if (controller.signal.aborted) {
                return;
            }

            if (!next || !canAnswerCancelRequest(next, new Date().toISOString())) {
                leave(CANCEL_REQUEST_CLOSED_MESSAGE);
                return;
            }

            setRequest(next);
        }).catch((error: unknown) => {
            if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
                leave(CANCEL_REQUEST_CLOSED_MESSAGE);
                return;
            }

            handleApiError(error);
        });

        return () => {
            controller.abort();
        };
    }, [reservationId]);

    // 함수
    async function approve(): Promise<void> {
        // ③ 승인 — 큐 → 환불 금액 안내 → U7
        setBusy(true);
        let result: ReservationCancelRequestApproveResultDto | null;
        try {
            result = await approveCancelRequest(auth, reservationId);
        } catch (error) {
            setBusy(false);
            handleApiError(error);
            return;
        }

        showErrorPopup(result ? `취소를 승인했어요. ${formatPrice(result.refund_amount)}을 환불해 드려요.` : QUEUE_PENDING_MESSAGE);
        router.replace(detailPath);
    }

    async function reject(): Promise<void> {
        // ③ 거절 — 큐(결과 null — done · pending 같음) → U7
        setBusy(true);
        try {
            await rejectCancelRequest(auth, reservationId);
        } catch (error) {
            setBusy(false);
            handleApiError(error);
            return;
        }

        showErrorPopup(CANCEL_REQUEST_REJECTED_MESSAGE);
        router.replace(detailPath);
    }

    function expire(): void {
        // ④ 남은 시간이 다 됨 — 승인 · 거절 중이면 그 결과 안내 · 이동에 맡긴다
        if (busy) {
            return;
        }

        showErrorPopup(CANCEL_REQUEST_EXPIRED_MESSAGE);
        router.replace(detailPath);
    }

    return (
        // 취소 동의
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="취소 동의" backHref={detailPath} />

            {request ? (
                <>
                    <div className={pageStyles.body}>
                        {/* 요청 안내 · 남은 시간 */}
                        <section className={`${pageStyles.card} ${styles.lead}`}>
                            <span className={`${pageStyles.icon} ${pageStyles.icon44} ${pageStyles.warn}`}>{ALERT_ICON}</span>
                            <h2 className={styles.title}>업체가 예약 취소를 요청했어요</h2>
                            <p className={pageStyles.heroText}>승인하면 예약이 취소되고 결제 금액 전액을 돌려받아요. 거절하면 예약은 그대로 이어져요.</p>
                            <div className={styles.deadline}>
                                <span>{toKst(request.expires_at, 'HH:mm')}까지 답해 주세요</span>
                                <strong className={styles.deadlineTime}><Timer time={request.expires_at} closeFunc={expire} /> 남음</strong>
                            </div>
                        </section>

                        {/* 요청 내용 */}
                        <section className={pageStyles.card} aria-labelledby="cancel-request-title">
                            <h2 id="cancel-request-title" className={pageStyles.cardTitle}>요청 내용</h2>
                            <dl className={pageStyles.dl}>
                                <dt>업체</dt><dd>{request.store_name}</dd>
                                <dt>호실</dt><dd>{request.room_name}</dd>
                                <dt>요청 시각</dt><dd>{formatDateTime(request.created_at)}</dd>
                            </dl>
                            <div className={styles.reason}>
                                <span className={styles.reasonLabel}>업체가 적은 사유</span>
                                <p className={styles.reasonText}>{request.cancel_reason}</p>
                            </div>
                            <div className={pageStyles.total}>
                                <span className={pageStyles.totalLabel}>환불 금액 (전액)</span>
                                <strong className={pageStyles.totalValue}>{formatPrice(request.refund_amount)}</strong>
                            </div>
                        </section>

                        {/* 만료 안내 */}
                        <p className={pageStyles.note}>{toKst(request.expires_at, 'HH:mm')}가 지나면 요청이 만료되고 예약은 그대로 이어져요.</p>
                    </div>

                    {/* 거절 · 승인 */}
                    <div className={`${pageStyles.footer} ${pageStyles.footerHalf}`}>
                        <Button size="lg" full disabled={busy} onClick={reject}>거절</Button>
                        <Button variant="primary" size="lg" full disabled={busy} onClick={approve}>승인</Button>
                    </div>
                </>
            ) : null}
        </div>
    );
}
