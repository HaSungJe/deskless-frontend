'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { RESERVATION_STATE } from '@/contracts/common/reservation.constants';
import { cancelReservation, getReservation, getReservationQr } from '@/contracts/reservation/api';
import { ReservationCancelDto, ReservationCancelResultDto } from '@/contracts/reservation/dto/reservation-cancel.dto';
import { ReservationDetailResultDto } from '@/contracts/reservation/dto/reservation-detail.dto';
import { ReservationQrResultDto } from '@/contracts/reservation/dto/reservation-qr.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import { ApiError } from '@/shared/api/request';
import Timer from '@/shared/components/Timer';
import TossPaymentWidget from '@/shared/components/payment/TossPaymentWidget';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import ReasonModal from '@/shared/components/ui/modal/ReasonModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatDateTime, formatDateTimeRange, formatPrice, toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import UserTopBar from '../../_components/UserTopBar';
import { reservationStateTone } from '../reservation-state';
import QrLocked from './_components/QrLocked';
import RefundGuideCard from './_components/RefundGuideCard';
import ReservationQr from './_components/ReservationQr';
import ReservationSegments from './_components/ReservationSegments';
import { PENDING_EXPIRED_MESSAGE, RESERVATION_NOT_FOUND_MESSAGE, cancelResultMessage, pendingSegment, refundGuide, reservationActions, screenSchedule } from './reservation-rules';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/ReservationDetailContent.module.css';

type ReservationDetailContentProps = {
    reservationId: string; // 주소의 예약 ID
};

/**
 * U7 예약 1건 — 상태 띠 · QR · 예약 내용 · 결제 구간 · 환불 안내 · 취소 · 결제하기 · 연장으로
 *
 * @param param0
 * @returns
 */
export default function ReservationDetailContent({reservationId}: ReservationDetailContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                                                          // 없는 예약이면 목록으로
    const auth = useContext(AuthContext);                                                // 이용자 토큰
    const detailPath = `/reservation/${encodeURIComponent(reservationId)}/`;             // 이 화면 — 결제 뒤 돌아올 곳
    const loadDetail = useEffectEvent((signal: AbortSignal) => getReservation(auth, reservationId, signal)); // 그때의 auth 로 상세
    const loadQr = useEffectEvent((signal: AbortSignal) => getReservationQr(auth, reservationId, signal));   // 그때의 auth 로 QR
    const leaveNotFound = useEffectEvent((): void => {
        showErrorPopup(RESERVATION_NOT_FOUND_MESSAGE);
        router.replace('/reservation/');
    });                                                                                  // 없는 예약 — 안내 뒤 목록
    const expiredRef = useRef<boolean>(false);                                           // 결제 대기 만료를 알렸는지 — 띠 · 결제위젯이 함께 알려도 한 번만

    // 상태
    const [detail, setDetail] = useState<ReservationDetailResultDto | null>(null); // 예약 상세
    const [checkedAt, setCheckedAt] = useState<string>(() => new Date().toISOString()); // 버튼 · 환불 안내 기준 시각 — 상세를 받을 때 · 경계 시각 · 취소 창을 열 때 새로
    const [reloadKey, setReloadKey] = useState<number>(0);                          // 다시 불러오기(취소 · 마감 · 시작)
    const [qr, setQr] = useState<ReservationQrResultDto | null>(null);              // 이용 중 QR
    const [cancelOpen, setCancelOpen] = useState<boolean>(false);                   // 취소 사유 창
    const [canceling, setCanceling] = useState<boolean>(false);                     // 취소 요청 중
    const [paying, setPaying] = useState<boolean>(false);                           // 결제 칸을 열었는지

    // 계산 값
    const actions = detail ? reservationActions(detail, checkedAt) : null;          // 버튼 · QR
    const guide = detail ? refundGuide(detail, checkedAt) : null;                   // 환불 안내
    const pending = detail ? pendingSegment(detail, checkedAt) : null;              // 결제하기 구간
    const qrOpen = actions?.qr === 'open';                                          // QR 을 부를지
    const currentRefund = guide?.rows.find((row) => row.current)?.value ?? guide?.message ?? ''; // 지금 취소하면 받을 것
    const cancelNotice = detail?.reservation_state_id === RESERVATION_STATE.PENDING ? (guide?.note ?? '') : (currentRefund && `지금 취소하면 ${currentRefund}`); // 취소 창 안내 — 결제 전이면 금액 없이
    const refundTotal = detail ? detail.segments.reduce((sum, segment) => sum + (segment.payment.refund_amount ?? 0), 0) : 0; // 취소 내용 환불 금액

    // 효과
    useEffect(() => {
        // ① 상세 — 받은 시각을 기준으로, 없는 예약이면 목록으로(떠나면 취소)
        const controller = new AbortController();
        loadDetail(controller.signal).then((next) => {
            if (controller.signal.aborted) {
                return;
            }

            if (!next) {
                leaveNotFound();
                return;
            }

            setCheckedAt(new Date().toISOString());
            setDetail(next);
        }).catch((error: unknown) => {
            if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
                leaveNotFound();
                return;
            }

            handleApiError(error);
        });

        return () => {
            controller.abort();
        };
    }, [reservationId, reloadKey]);

    useEffect(() => {
        // ③ 이용 중이면 QR — 이용 전 · 끝난 뒤에는 부르지 않는다(시작 전은 400)
        if (!qrOpen) {
            return;
        }

        const controller = new AbortController();
        loadQr(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setQr(next);
            }
        }).catch((error: unknown) => handleApiError(error));

        return () => {
            controller.abort();
        };
    }, [qrOpen, detail]);

    useEffect(() => {
        // ③ 경계 시각 — 환불 마감 · 시작 1시간 전은 기준 시각만 새로, 시작 · 끝은 상세를 다시(상세가 바뀌거나 떠나면 취소)
        if (!detail) {
            return;
        }

        const now = Date.now();
        const schedule = screenSchedule(detail, now);
        const timers = [
            ...schedule.refreshAt.map((at) => window.setTimeout(() => setCheckedAt(new Date().toISOString()), at - now)),
            ...schedule.reloadAt.map((at) => window.setTimeout(() => {
                setPaying(false);
                setReloadKey((key) => key + 1);
            }, at - now)),
        ];

        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, [detail]);

    // 함수
    function reload(): void {
        // 다시 — 결제 칸을 닫는다
        setPaying(false);
        setReloadKey((key) => key + 1);
    }

    function openCancel(): void {
        // 취소 창 — 기준 시각을 새로 해 지금의 환불 안내로
        setCheckedAt(new Date().toISOString());
        setCancelOpen(true);
    }

    function expirePending(): void {
        // 결제 대기 마감 — 만료된 예약은 다시 부르면 404 라 만료 안내 뒤 목록(한 번만)
        if (expiredRef.current) {
            return;
        }

        expiredRef.current = true;
        showErrorPopup(PENDING_EXPIRED_MESSAGE);
        router.replace('/reservation/');
    }

    async function cancel(reason: string): Promise<void> {
        // ④ 취소 — DTO 검증 → 큐 → 환불 문구 → 상세 다시
        const dto = Object.assign(new ReservationCancelDto(), {cancel_reason: reason});
        if (!(await validateAction(dto))) {
            return;
        }

        setCanceling(true);
        let result: ReservationCancelResultDto | null = null; // 취소 결과
        let failure: {error: unknown} | null = null;        // 실패 — 처리는 try 밖에서(React Compiler)
        try {
            result = await cancelReservation(auth, reservationId, dto);
        } catch (error) {
            failure = {error};
        }

        setCanceling(false);
        if (failure) {
            // 칸 옆 오류면 창을 두고, 그 밖(시작이 지남 · 이미 취소됨 …)은 닫고 다시 불러온다
            handleApiError(failure.error);
            if (!hasFieldErrors(failure.error)) {
                setCancelOpen(false);
                reload();
            }
            return;
        }

        setCancelOpen(false);
        showErrorPopup(result ? cancelResultMessage(result.refund_amount) : QUEUE_PENDING_MESSAGE);
        reload();
    }

    return (
        // 예약 상세
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="예약 상세" parents={[{label: '내 예약', href: '/reservation/'}]} />

            {detail && actions ? (
                <>
                    <div className={styles.content}>
                        {/* ② 상태 띠 */}
                        <div className={`${styles.band} ${pageStyles[reservationStateTone(detail.reservation_state_id)]}`}>
                            <strong className={styles.bandTitle}>{detail.reservation_state_name}</strong>
                            <span className={styles.bandText}>
                                {detail.reservation_state_id === RESERVATION_STATE.PENDING && pending?.expires_at ? (
                                    <>{toKst(pending.expires_at, 'HH:mm')}까지 결제하지 않으면 예약이 만료돼요 · 남은 시간 <strong className={styles.bandTime}><Timer time={pending.expires_at} closeFunc={expirePending} /></strong></>
                                ) : bandText(detail)}
                            </span>
                        </div>

                        <div className={pageStyles.body}>
                            {/* ③ QR — 이용 중 · 잠김 */}
                            {qrOpen && qr ? <ReservationQr qr={qr} roomName={detail.room_name} /> : null}
                            {actions.qr === 'locked' ? <QrLocked startAt={detail.start_at} startsSoon={actions.startsSoon} /> : null}

                            {/* 취소 내용 */}
                            {detail.reservation_state_id === RESERVATION_STATE.CANCELED ? (
                                <section className={pageStyles.card} aria-labelledby="reservation-cancel-title">
                                    <h2 id="reservation-cancel-title" className={pageStyles.cardTitle}>취소 내용</h2>
                                    <dl className={`${pageStyles.dl} ${styles.relaxed}`}>
                                        <dt>취소 시각</dt><dd>{formatDateTime(detail.canceled_at)}</dd>
                                        <dt>취소한 쪽</dt><dd>{detail.cancel_actor ? lookupName('cancel_actor', detail.cancel_actor) : '-'}</dd>
                                        <dt>사유</dt><dd>{detail.cancel_reason ?? '-'}</dd>
                                        <dt>환불 금액</dt><dd className={pageStyles.strong}>{formatPrice(refundTotal)}</dd>
                                    </dl>
                                </section>
                            ) : null}

                            {/* ② 예약 내용 */}
                            <section className={pageStyles.card} aria-labelledby="reservation-store-title">
                                <h2 id="reservation-store-title" className={pageStyles.cardTitle}>{detail.store_name}</h2>
                                <dl className={`${pageStyles.dl} ${pageStyles.dl64}`}>
                                    <dt>객실</dt><dd>{detail.room_group_name} · {detail.room_name}</dd>
                                    <dt>상품</dt><dd>{detail.room_plan_type_name}</dd>
                                    <dt>이용</dt><dd>{formatDateTimeRange(detail.start_at, detail.end_at)}</dd>
                                    <dt>합계</dt><dd className={pageStyles.strong}>{formatPrice(detail.total_price)}</dd>
                                </dl>
                            </section>

                            {/* ② 결제 구간 */}
                            <ReservationSegments segments={detail.segments} />

                            {/* ② 환불 안내 */}
                            {guide ? <RefundGuideCard guide={guide} /> : null}

                            {/* ⑤ 결제하기 — 결제 대기 구간 */}
                            {paying && pending && pending.expires_at ? (
                                <section className={pageStyles.card}>
                                    <TossPaymentWidget payment={{payment_id: pending.payment.payment_id, order_name: `${detail.store_name} ${detail.room_name}`, amount: pending.payment.amount, expires_at: pending.expires_at}} returnUrl={detailPath} onExpired={detail.reservation_state_id === RESERVATION_STATE.PENDING ? expirePending : reload} />
                                </section>
                            ) : null}
                        </div>
                    </div>

                    {/* ④ · ⑤ 아래 버튼 — 취소 · 결제하기 · QR 확인 · 연장하기 */}
                    {actions.cancel || actions.pay || actions.extend || actions.qr === 'locked' ? (
                        <div className={`${pageStyles.footer} ${actions.cancel ? pageStyles.footerSplit : ''}`}>
                            {actions.cancel ? <Button variant="danger" size="lg" full onClick={openCancel}>취소</Button> : null}
                            {actions.pay ? <Button variant="primary" size="lg" full onClick={() => setPaying(true)} disabled={paying}>결제하기</Button> : null}
                            {!actions.pay && actions.qr === 'locked' ? <Button size="lg" full disabled>QR 확인 ({toKst(detail.start_at, 'HH:mm')}부터)</Button> : null}
                            {!actions.pay && actions.extend ? <Link href={`${detailPath}extension/`} className={buttonClass({variant: 'primary', size: 'lg', full: true})}>연장하기</Link> : null}
                        </div>
                    ) : null}

                    {/* 취소 사유 */}
                    <ReasonModal open={cancelOpen} title="예약 취소" description={cancelNotice || undefined} label="취소 사유" name="cancel_reason" maxLength={255} confirmLabel="취소하기" danger busy={canceling} onConfirm={cancel} onClose={() => setCancelOpen(false)} />
                </>
            ) : null}
        </div>
    );
}

/**
 * 칸 옆에 보일 검증 오류가 있는지 — 있으면 취소 창을 그대로 둔다
 *
 * @param error 잡은 오류
 */
function hasFieldErrors(error: unknown): boolean {
    return error instanceof ApiError && Array.isArray(error.body.validation_errors) && error.body.validation_errors.length > 0;
}

/**
 * 상태 띠 한 줄 — 확정 · 이용 중은 시각, 취소는 취소한 쪽(결제 대기의 마감 · 남은 시간은 화면이 그린다 — 만료 처리가 ref 를 써서 render 중 함수에 넘기면 React Compiler 가 건너뛴다)
 *
 * @param detail 예약 상세
 */
function bandText(detail: ReservationDetailResultDto): React.ReactNode {
    switch (detail.reservation_state_id) {
        case RESERVATION_STATE.PENDING:
            return '결제 시간이 지났어요.';
        case RESERVATION_STATE.CONFIRMED:
            return `${formatDateTime(detail.start_at)}부터 이용할 수 있어요`;
        case RESERVATION_STATE.CHECKED_IN:
            return `${formatDateTime(detail.end_at)}까지 이용할 수 있어요`;
        case RESERVATION_STATE.COMPLETED:
            return '이용이 끝난 예약이에요';
        case RESERVATION_STATE.CANCELED:
            return `${detail.cancel_actor ? lookupName('cancel_actor', detail.cancel_actor) : ''}가 취소한 예약이에요`;
        default:
            return '결제 시간이 지나 만료된 예약이에요';
    }
}
