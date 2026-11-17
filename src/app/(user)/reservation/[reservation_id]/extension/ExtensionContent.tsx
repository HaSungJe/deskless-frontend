'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { RESERVATION_PAYMENT_PENDING_MINUTES } from '@/contracts/common/reservation.constants';
import { getExtension, getReservation, requestExtension } from '@/contracts/reservation/api';
import { ReservationDetailResultDto } from '@/contracts/reservation/dto/reservation-detail.dto';
import { ReservationExtendResultDto } from '@/contracts/reservation/dto/reservation-extend.dto';
import { ReservationExtensionResultDto } from '@/contracts/reservation/dto/reservation-extension.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import { ApiError } from '@/shared/api/request';
import TossPaymentWidget from '@/shared/components/payment/TossPaymentWidget';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatDateTime, formatMonthDayWeek, formatPrice, formatTimeRange, toKst } from '@/shared/utils/format';
import MemberStateBand from '../../../_components/MemberStateBand';
import { UserMeContext } from '../../../_components/UserMeProvider';
import UserTopBar from '../../../_components/UserTopBar';
import { RESERVATION_NOT_FOUND_MESSAGE, extensionLengthLabel } from '../reservation-rules';
import pageStyles from '@/app/css/user/ReservationPage.module.css';
import styles from '@/app/css/user/ExtensionContent.module.css';

type ExtensionContentProps = {
    reservationId: string; // 주소의 예약 ID
};

/** 연장을 막는 회원 상태 — 이용 제한 · 탈퇴 대기(서버도 400) */
const BLOCKED_MEMBER_STATES = ['BLOCK', 'LEAVE_WAIT'];

/** 요금 상품 → 글자(DTO — HOURLY 시간 이용 요금, NIGHT 1박 요금) */
const RATE_LABEL = new Map<string, string>([['HOURLY', '시간 이용 요금'], ['NIGHT', '1박 요금']]);

/** 아이콘 — 시안 U9 */
const ARROW_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>;
const CLOCK_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
const INFO_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5v.01" /></svg>;

/**
 * U9 연장 — 가능하면 새 끝 · 추가 금액 · 연장 신청(큐) → 결제위젯, 불가면 사유
 *
 * @param param0
 * @returns
 */
export default function ExtensionContent({reservationId}: ExtensionContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                                                                  // 없는 예약이면 목록
    const auth = useContext(AuthContext);                                                        // 이용자 토큰
    const {me} = useContext(UserMeContext);                                                      // 회원 상태
    const detailPath = `/reservation/${encodeURIComponent(reservationId)}/`;                     // U7 — 결제 뒤 돌아올 곳(결제 대기 연장 구간을 거기서 다시 결제)
    const load = useEffectEvent((signal: AbortSignal) => Promise.allSettled([getReservation(auth, reservationId, signal), getExtension(auth, reservationId, signal)])); // 상세 · 연장 조회
    const leaveNotFound = useEffectEvent((): void => {
        showErrorPopup(RESERVATION_NOT_FOUND_MESSAGE);
        router.replace('/reservation/');
    });                                                                                          // 없는 예약

    // 상태
    const [detail, setDetail] = useState<ReservationDetailResultDto | null>(null);           // 예약 — 업체 · 객실 · 지금 끝
    const [extension, setExtension] = useState<ReservationExtensionResultDto | null>(null);  // 연장 조회
    const [extensionFailed, setExtensionFailed] = useState<boolean>(false);                   // 연장 조회를 못 함 — 다시 불러오기
    const [reloadKey, setReloadKey] = useState<number>(0);                                    // 다시 조회
    const [submitting, setSubmitting] = useState<boolean>(false);                             // 연장 신청 중
    const [payment, setPayment] = useState<ReservationExtendResultDto | null>(null);          // 연장 결제 — 있으면 결제 칸

    // 계산 값
    const blocked = BLOCKED_MEMBER_STATES.includes(me?.state_id ?? '');                       // 이용 제한 · 탈퇴 대기
    const available = extension?.is_extendable === 1;                                         // 연장할 수 있는지
    const startDate = extension?.start_at ? toKst(extension.start_at, 'YYYY-MM-DD') : '';     // 지금 끝 날짜

    // 효과
    useEffect(() => {
        // ① 상세 · 연장 조회를 함께 — 없는 예약이면 목록, 연장 조회 실패는 안내만(떠나면 취소)
        const controller = new AbortController();
        load(controller.signal).then(([nextDetail, nextExtension]) => {
            if (controller.signal.aborted) {
                return;
            }

            if (nextDetail.status === 'rejected' || !nextDetail.value) {
                if (nextDetail.status === 'fulfilled' || (nextDetail.reason instanceof ApiError && (nextDetail.reason.status === 404 || nextDetail.reason.status === 400))) {
                    leaveNotFound();
                } else {
                    handleApiError(nextDetail.reason);
                }
                return;
            }

            setDetail(nextDetail.value);
            setExtensionFailed(nextExtension.status === 'rejected');
            if (nextExtension.status === 'fulfilled') {
                setExtension(nextExtension.value);
            } else {
                setExtension(null); // 옛 연장 정보(금액)를 남기지 않는다
                handleApiError(nextExtension.reason);
            }
        });

        return () => {
            controller.abort();
        };
    }, [reservationId, reloadKey]);

    // 함수
    async function submit(): Promise<void> {
        // ③ 연장 신청 — 큐 → 결제 칸. 실패 · 늦어짐이면 다시 조회
        if (!available || blocked || submitting) {
            return;
        }

        setSubmitting(true);
        let result: ReservationExtendResultDto | null;
        try {
            result = await requestExtension(auth, reservationId);
        } catch (error) {
            setSubmitting(false);
            handleApiError(error);
            setReloadKey((key) => key + 1);
            return;
        }

        setSubmitting(false);
        if (!result) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
            setReloadKey((key) => key + 1);
            return;
        }

        setPayment(result);
    }

    function reload(): void {
        // 다시 조회
        setReloadKey((key) => key + 1);
    }

    function expirePayment(): void {
        // 결제 마감 — 다시 조회(그 예약은 다시 연장할 수 없다 — 서버가 사유로 알려 준다)
        setPayment(null);
        setReloadKey((key) => key + 1);
    }

    return (
        // 연장
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="연장" backHref={detailPath} />

            {/* 연장 조회 실패 */}
            {detail && !extension && extensionFailed ? (
                <div className={pageStyles.body}>
                    <section className={`${pageStyles.card} ${styles.lead}`}>
                        <h2 className={styles.title}>연장 정보를 불러오지 못했어요</h2>
                        <p className={pageStyles.note}>잠시 뒤 다시 불러와 주세요.</p>
                        <Button size="lg" full onClick={reload}>다시 불러오기</Button>
                    </section>
                </div>
            ) : null}

            {detail && extension ? (
                <>
                    <div className={pageStyles.body}>
                        {/* ② 가능 — 지금 끝 → 연장 뒤 끝 · 추가 금액 */}
                        {available && !payment ? (
                            <section className={`${pageStyles.card} ${styles.wide}`}>
                                <div className={styles.titleBlock}>
                                    <h2 className={pageStyles.cardTitle}>{detail.store_name}</h2>
                                    <span className={styles.muted}>{detail.room_group_name} · {detail.room_name} · {detail.room_plan_type_name}</span>
                                </div>
                                <div className={styles.compare}>
                                    <div className={styles.box}>
                                        <span className={styles.boxLabel}>지금 이용 끝</span>
                                        <strong className={styles.boxTime}>{toKst(extension.start_at, 'HH:mm')}</strong>
                                        <span className={styles.boxSub}>{startDate ? formatMonthDayWeek(startDate) : ''}</span>
                                    </div>
                                    <span className={styles.arrow}>{ARROW_ICON}</span>
                                    <div className={`${styles.box} ${styles.boxNext}`}>
                                        <span className={styles.boxLabel}>연장 뒤 끝</span>
                                        <strong className={styles.boxTime}>{toKst(extension.end_at, 'HH:mm')}</strong>
                                        <span className={styles.boxSub}>{extensionLengthLabel(extension.start_at, extension.end_at)}</span>
                                    </div>
                                </div>
                                <div className={pageStyles.total}>
                                    <span className={styles.totalLabel}>추가 금액 <span className={styles.muted}>{RATE_LABEL.get(extension.room_plan_type_id ?? '') ?? ''}</span></span>
                                    <strong className={pageStyles.totalValue}>{formatPrice(extension.amount)}</strong>
                                </div>
                            </section>
                        ) : null}
                        {available && !payment ? (
                            <p className={styles.warnBox}>{CLOCK_ICON}<span>연장 신청 뒤 {RESERVATION_PAYMENT_PENDING_MINUTES}분 안에 결제해 주세요. 결제하지 않고 {RESERVATION_PAYMENT_PENDING_MINUTES}분이 지나면 이 예약은 다시 연장할 수 없어요.</span></p>
                        ) : null}

                        {/* ③ 연장 결제 */}
                        {payment ? (
                            <section className={pageStyles.card} aria-labelledby="extension-payment-title">
                                <h2 id="extension-payment-title" className={pageStyles.cardTitle}>연장 결제</h2>
                                <dl className={pageStyles.dl}>
                                    <dt>연장</dt><dd>{formatTimeRange(payment.start_at, payment.end_at)}</dd>
                                    <dt>주문명</dt><dd>{payment.order_name}</dd>
                                </dl>
                                <TossPaymentWidget payment={payment} returnUrl={detailPath} onExpired={expirePayment} />
                            </section>
                        ) : null}

                        {/* ④ 불가 — 사유 */}
                        {!available ? (
                            <section className={`${pageStyles.card} ${styles.lead}`}>
                                <span className={`${pageStyles.icon} ${pageStyles.icon44} ${pageStyles.neutral}`}>{INFO_ICON}</span>
                                <h2 className={styles.title}>연장할 수 없어요</h2>
                                <p className={styles.reason}>{extension.reason ?? '지금은 연장할 수 없어요.'}</p>
                                <div className={styles.endRow}>
                                    <span className={styles.muted}>지금 이용 끝</span>
                                    <strong className={styles.endTime}>{formatDateTime(detail.end_at)}</strong>
                                </div>
                            </section>
                        ) : null}
                        {!available ? <p className={pageStyles.note}>연장은 이용 중에만, 같은 호실의 바로 다음 시간이 비어 있을 때 할 수 있어요.</p> : null}

                        {/* ④ 회원 상태 */}
                        <MemberStateBand me={me} />
                    </div>

                    {/* 아래 — 가능: 결제 금액 · 연장 신청 / 불가: 예약으로 · 막힌 연장 신청 */}
                    {available && !payment ? (
                        <div className={`${pageStyles.footer} ${pageStyles.footerCol}`}>
                            <div className={styles.amountRow}>
                                <span className={styles.amountLabel}>결제 금액</span>
                                <strong className={styles.amount}>{formatPrice(extension.amount)}</strong>
                            </div>
                            <Button variant="primary" size="lg" full disabled={blocked || submitting} onClick={submit}>연장 신청</Button>
                        </div>
                    ) : null}
                    {!available ? (
                        <div className={`${pageStyles.footer} ${pageStyles.footerSplit}`}>
                            <Link href={detailPath} className={buttonClass({size: 'lg', full: true})}>예약으로</Link>
                            <Button size="lg" full disabled>연장 신청</Button>
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}
