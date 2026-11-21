'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { confirmPayment } from '@/contracts/reservation/api';
import { ReservationPaymentConfirmDto, ReservationPaymentConfirmResultDto } from '@/contracts/reservation/dto/reservation-payment-confirm.dto';
import { AuthType, LoginRequiredError } from '@/shared/api/auth';
import { NETWORK_ERROR_MESSAGE } from '@/shared/api/error';
import { requestTossConfirm, TossConfirmQueryType } from '@/shared/api/payment';
import { ApiError } from '@/shared/api/request';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { reservationStateTone } from '../../reservation/reservation-state';
import UserTopBar from '../../_components/UserTopBar';
import PaymentFailView from '../_components/PaymentFailView';
import { paymentReturnPath } from '../payment-result';
import styles from '@/app/css/user/UserPage.module.css';

type PaymentSuccessContentProps = {
    paymentKey: string | null; // 토스 결제 키
    orderId: string | null;    // 우리 결제 ID
    amount: string | null;     // 결제 금액(토스가 붙임)
    returnUrl: string | null;  // 다시 고르기 — 결제위젯이 붙인 return_url
};

/** 결과 화면 */
type ResultViewType =
    | {kind: 'checking'}
    | {kind: 'done'; reservationId: string; stateId: string}
    | {kind: 'fail'; message: string; code: string | null}
    | {kind: 'retry'; message: string}
    | {kind: 'late'};

/** 성공 주소에 결제 정보가 빠졌을 때 */
const PAYMENT_INVALID_MESSAGE = '결제 정보가 올바르지 않습니다.';

/** 결제 확인 큐가 결과 없이 끝났을 때 */
const PAYMENT_LATE_MESSAGE = '결제 확인이 늦어지고 있어요. 잠시 뒤 내 예약에서 확인해 주세요.';

/** 확인 · 확정 아이콘 — 시안 U4 */
const CHECK_ICON = <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const CLOCK_ICON = <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;

/**
 * U4 결제 성공 — 토스 승인(route) → 백엔드 결제 확인(큐)을 한 번만 하고 결과를 보여 준다
 *
 * @param param0
 * @returns
 */
export default function PaymentSuccessContent({paymentKey, orderId, amount, returnUrl}: PaymentSuccessContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                    // 결제 확인 API 토큰
    const valid = Boolean(paymentKey && orderId && amount);  // 성공 주소에 결제 정보가 다 있는지
    const query: TossConfirmQueryType = {paymentKey: paymentKey ?? '', orderId: orderId ?? '', amount: Number(amount)}; // 토스 승인에 넘길 값
    const startedRef = useRef<boolean>(false);               // 승인 · 확인을 시작했는지 — 효과가 두 번 돌아도 한 번만
    const loadView = useEffectEvent(() => confirmView(auth, query)); // 그때의 값으로 승인 · 확인(효과를 다시 걸지 않는다)

    // 상태
    const [view, setView] = useState<ResultViewType>(valid ? {kind: 'checking'} : {kind: 'fail', message: PAYMENT_INVALID_MESSAGE, code: null}); // 결과 화면

    // 계산 값
    const backPath = paymentReturnPath(returnUrl); // 다시 고르기

    // 효과
    useEffect(() => {
        // ① 들어오면 한 번 — 승인 · 확인
        if (!valid || startedRef.current) {
            return;
        }

        startedRef.current = true;
        loadView().then(setView);
    }, [valid]);

    // 함수
    function retry(): void {
        // 다시 확인 — 토스 · 백엔드 모두 같은 결제를 다시 확인해도 된다
        setView({kind: 'checking'});
        confirmView(auth, query).then(setView);
    }

    return (
        // 결제 결과
        <div className={styles.page}>
            {/* 머리 — 제목 · 홈으로 */}
            <UserTopBar title="결제 결과" />

            {/* 실패 — 사유 · 오류 코드 · 다시 고르기 */}
            {view.kind === 'fail' ? <PaymentFailView message={view.message} code={view.code} backPath={backPath} /> : null}

            {/* 확인 중 · 확정 · 다시 확인 · 늦어짐 */}
            {view.kind !== 'fail' ? (
                <>
                    <div className={styles.resultBody}>
                        <div className={styles.resultHero}>
                            <span className={[styles.icon, styles.icon64, view.kind === 'done' ? styles.ok : view.kind === 'checking' ? styles.neutral : styles.warn].join(' ')}>{view.kind === 'done' ? CHECK_ICON : CLOCK_ICON}</span>
                            <h2 className={styles.heroTitle}>{view.kind === 'done' ? '예약이 확정되었어요' : view.kind === 'checking' ? '결제를 확인하고 있어요' : view.kind === 'late' ? '처리가 늦어지고 있어요' : '결제를 확인하지 못했어요'}</h2>
                            <p className={styles.heroText}>
                                {view.kind === 'done' ? '결제가 확인되었어요. 이용 시작 시각부터 예약 화면에서 QR 을 볼 수 있어요.' : null}
                                {view.kind === 'checking' ? '잠시만 기다려 주세요.' : null}
                                {view.kind === 'late' ? PAYMENT_LATE_MESSAGE : null}
                                {view.kind === 'retry' ? view.message : null}
                            </p>
                        </div>

                        {/* 상태 — 예약 ID 는 보이지 않는다(예약 보기로) */}
                        {view.kind === 'done' ? (
                            <section className={`${styles.card} ${styles.stretch}`}>
                                <div className={styles.rowBetween}>
                                    <span className={styles.label}>상태</span>
                                    <Badge tone={reservationStateTone(view.stateId)}>{lookupName('reservation_state_id', view.stateId)}</Badge>
                                </div>
                            </section>
                        ) : null}
                    </div>

                    {/* 다음 */}
                    <div className={styles.footer}>
                        {view.kind === 'done' ? <Link href={`/reservation/${encodeURIComponent(view.reservationId)}/`} className={buttonClass({variant: 'primary', size: 'lg', full: true})}>예약 보기</Link> : null}
                        {view.kind === 'late' ? <Link href="/reservation/" className={buttonClass({variant: 'primary', size: 'lg', full: true})}>내 예약</Link> : null}
                        {view.kind === 'retry' ? <Button variant="primary" size="lg" full onClick={retry}>다시 확인</Button> : null}
                        {view.kind === 'checking' ? <Button variant="primary" size="lg" full disabled>확인하고 있어요</Button> : null}
                    </div>
                </>
            ) : null}
        </div>
    );
}

/**
 * ① 토스 승인 → ② 결제 확인 → ③ · ④ 결과 화면 값 — setState 없이 값만 돌려준다(들어올 때의 효과 · "다시 확인"이 같이 쓴다)
 *
 * @param auth AuthContext 값
 * @param query 토스가 붙여 준 결제 키 · 주문 번호 · 금액
 */
async function confirmView(auth: AuthType, query: TossConfirmQueryType): Promise<ResultViewType> {
    const toss = await requestTossConfirm(query).catch((): null => null);
    if (!toss) { // ④ 토스 쪽 장애 · 응답 없음 — 다시 확인
        return {kind: 'retry', message: NETWORK_ERROR_MESSAGE};
    }

    if (!toss.success) { // ③ 거절 — 결제 확인을 부르지 않는다 / ④ 장애
        return toss.retry ? {kind: 'retry', message: toss.message ?? NETWORK_ERROR_MESSAGE} : {kind: 'fail', message: toss.message ?? PAYMENT_INVALID_MESSAGE, code: toss.code ?? null};
    }

    // ② 승인되면 결제 확인(큐)
    const dto = Object.assign(new ReservationPaymentConfirmDto(), {payment_id: query.orderId, payment_key: query.paymentKey});
    let result: ReservationPaymentConfirmResultDto | null;
    try {
        result = await confirmPayment(auth, dto);
    } catch (error) {
        return failView(error);
    }

    // ③ 확정 · ④ 늦어짐
    return result ? {kind: 'done', reservationId: result.reservation_id, stateId: result.reservation_state_id} : {kind: 'late'};
}

/**
 * 결제 확인 실패 → 화면 — 백엔드 실패는 사유 · 결제 오류 코드, 응답 없음은 다시 확인, 로그인 만료는 로그인 화면으로 가는 중
 *
 * @param error 잡은 오류
 */
function failView(error: unknown): ResultViewType {
    if (error instanceof ApiError) {
        const code = (error.body as {payment_error_code?: unknown}).payment_error_code;
        return {kind: 'fail', message: error.body.message, code: typeof code === 'string' ? code : null};
    }

    if (error instanceof LoginRequiredError) {
        return {kind: 'checking'};
    }

    return {kind: 'retry', message: NETWORK_ERROR_MESSAGE};
}
