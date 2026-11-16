'use client';
import { useEffect, useRef, useState } from 'react';
import type { TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';
import Timer from '@/shared/components/Timer';
import Button from '@/shared/components/ui/button/Button';
import { withBasePath } from '@/shared/utils/base-path';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatPrice } from '@/shared/utils/format';
import styles from '@/shared/css/payment/TossPaymentWidget.module.css';

/** 그린 위젯(결제수단 · 약관) — destroy() 로 지운다 */
type TossRenderedType = {destroy: () => Promise<void>};

/** 결제 정보 — 예약 생성 · 연장 신청 done(ReservationResultDto · ReservationExtendResultDto) */
export type TossPaymentType = {
    payment_id: string; // 결제 ID — 토스 orderId
    order_name: string; // 주문명 — 토스 orderName
    amount: number;     // 결제 금액(원)
    expires_at: string; // 결제 마감(ISO 8601 — 5분)
};

type TossPaymentWidgetProps = {
    payment: TossPaymentType; // 결제 정보
    onExpired?: () => void;   // 결제 마감이 지나면
};

/** 결제위젯 연동 클라이언트 키(빌드 때 박힌다) */
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? '';

/** 사용자가 결제창을 닫음 — 조용히 */
const USER_CANCEL_CODE = 'USER_CANCEL';

export const PAYMENT_EXPIRED_MESSAGE = '결제 시간이 지났습니다. 다시 예약해 주세요.';
export const PAYMENT_CONFIG_MESSAGE = '결제 설정이 없습니다.';
const PAYMENT_LOAD_FAIL_MESSAGE = '결제 화면을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
const PAYMENT_REQUEST_FAIL_MESSAGE = '결제를 시작하지 못했습니다. 잠시 뒤 다시 시도해 주세요.';

/**
 * 토스 결제위젯 — 결제 마감 남은 시간 · 결제수단 · 약관 · "결제하기"
 * - 결제창 성공 · 실패는 /payments/success/ · /payments/fail/ 로 돌아온다(basePath 포함)
 * - SDK 는 효과 안에서 import() — 서버 렌더에 들어가지 않는다
 *
 * @param param0
 * @returns
 */
export default function TossPaymentWidget({payment, onExpired}: TossPaymentWidgetProps): React.ReactNode {
    // 변수
    const methodsRef = useRef<HTMLDivElement>(null);             // 결제수단 위젯 자리
    const agreementRef = useRef<HTMLDivElement>(null);           // 약관 위젯 자리
    const widgetsRef = useRef<TossPaymentsWidgets | null>(null); // 그린 결제위젯 — "결제하기" 가 쓴다

    // 상태
    const [ready, setReady] = useState<boolean>(false);                     // 결제수단 · 약관을 다 그렸는지
    const [expired, setExpired] = useState<boolean>(false);                 // 결제 마감이 지났는지
    const [requesting, setRequesting] = useState<boolean>(false);           // 결제창을 여는 중
    const [prevPayment, setPrevPayment] = useState<TossPaymentType>(payment); // 직전 결제 정보 — 바뀌면 마감 · 준비 상태를 맞춘다

    // 결제 정보가 바뀌면 — 새 결제(마감)면 만료를 풀고, 금액이 바뀌면 다시 그릴 때까지 "결제하기"를 막는다(렌더 중에 맞춘다)
    if (payment !== prevPayment) {
        setPrevPayment(payment);
        if (payment.payment_id !== prevPayment.payment_id || payment.expires_at !== prevPayment.expires_at) {
            setExpired(false);
        }
        if (payment.amount !== prevPayment.amount) {
            setReady(false);
        }
    }

    // 계산 값
    const canPay = ready && !expired && !requesting; // "결제하기" 를 누를 수 있는지

    // 효과
    useEffect(() => {
        // 결제위젯을 불러와 금액 · 결제수단 · 약관을 그린다 — 효과마다 새 자리에 그리고(개발 모드 두 번 실행에도 겹치지 않게), 사라지면 지운다
        const methodsBox = methodsRef.current;
        const agreementBox = agreementRef.current;
        if (!TOSS_CLIENT_KEY || !methodsBox || !agreementBox) {
            return;
        }

        let cancelled = false;
        const methodsTarget = appendWidgetTarget(methodsBox, 'toss-methods');
        const agreementTarget = appendWidgetTarget(agreementBox, 'toss-agreement');
        const rendered: Array<TossRenderedType> = [];
        const task = renderWidgets(payment.amount, methodsTarget.id, agreementTarget.id, rendered);

        task.then((widgets) => {
            if (!cancelled) {
                widgetsRef.current = widgets;
                setReady(true);
            }
        }).catch((error: unknown) => {
            if (!cancelled) {
                console.error(error);
                showErrorPopup(PAYMENT_LOAD_FAIL_MESSAGE);
            }
        });

        return () => {
            cancelled = true;
            widgetsRef.current = null;
            task.catch((): null => null)
                .then(() => Promise.all(rendered.map((widget) => widget.destroy())))
                .catch((): null => null)
                .finally(() => {
                    methodsTarget.remove();
                    agreementTarget.remove();
                });
        };
    }, [payment.amount]);

    // 함수
    async function pay(): Promise<void> {
        // 결제창 열기 — 창을 닫은 것(USER_CANCEL)은 조용히, 그 밖은 오류 팝업
        const widgets = widgetsRef.current;
        if (!widgets || !canPay) {
            return;
        }

        setRequesting(true);
        try {
            await widgets.requestPayment({
                orderId: payment.payment_id,
                orderName: payment.order_name,
                successUrl: paymentResultUrl('success'),
                failUrl: paymentResultUrl('fail'),
            });
        } catch (error) {
            if (errorField(error, 'code') !== USER_CANCEL_CODE) {
                showErrorPopup(errorField(error, 'message') ?? PAYMENT_REQUEST_FAIL_MESSAGE);
            }
        } finally {
            setRequesting(false);
        }
    }

    function expire(): void {
        // 결제 마감 — "결제하기" 를 막고 화면에 알린다
        setExpired(true);
        onExpired?.();
    }

    if (!TOSS_CLIENT_KEY) {
        return (
            // 결제 설정 없음
            <p className={styles.notice} role="alert">{PAYMENT_CONFIG_MESSAGE}</p>
        );
    }

    return (
        // 결제위젯
        <div className={styles.widget}>
            {/* 결제 마감 남은 시간 */}
            <p className={styles.deadline}>
                결제 마감까지 <strong className={styles.time}><Timer time={payment.expires_at} closeFunc={expire} /></strong>
            </p>

            {/* 결제수단 · 약관 — 토스가 그린다 */}
            <div ref={methodsRef} />
            <div ref={agreementRef} />

            {/* 마감 안내 */}
            {expired ? <p className={styles.notice} role="alert">{PAYMENT_EXPIRED_MESSAGE}</p> : null}

            {/* 결제하기 */}
            <Button variant="primary" size="lg" full onClick={pay} disabled={!canPay}>
                {formatPrice(payment.amount)} 결제하기
            </Button>
        </div>
    );
}

/**
 * 결제위젯 불러와 그리기 — 그린 위젯은 rendered 에 담는다(지울 때 쓴다)
 *
 * @param amount 결제 금액
 * @param methodsId 결제수단 자리 id
 * @param agreementId 약관 자리 id
 * @param rendered 그린 위젯을 담을 배열
 */
async function renderWidgets(amount: number, methodsId: string, agreementId: string, rendered: Array<TossRenderedType>): Promise<TossPaymentsWidgets> {
    const {ANONYMOUS, loadTossPayments} = await import('@tosspayments/tosspayments-sdk');
    const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
    const widgets = tossPayments.widgets({customerKey: ANONYMOUS});

    await widgets.setAmount({currency: 'KRW', value: amount});
    rendered.push(await widgets.renderPaymentMethods({selector: `#${methodsId}`, variantKey: 'DEFAULT'}));
    rendered.push(await widgets.renderAgreement({selector: `#${agreementId}`, variantKey: 'AGREEMENT'}));
    return widgets;
}

/**
 * 위젯을 그릴 빈 자리 — 효과마다 새 id
 *
 * @param box 자리를 넣을 요소
 * @param prefix id 앞부분
 */
function appendWidgetTarget(box: HTMLElement, prefix: string): HTMLDivElement {
    const target = document.createElement('div');
    target.id = `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
    box.appendChild(target);
    return target;
}

/**
 * 결제창이 돌아올 주소 — origin + basePath + /payments/<결과>/
 *
 * @param result success · fail
 */
function paymentResultUrl(result: 'success' | 'fail'): string {
    return `${window.location.origin}${withBasePath(`/payments/${result}/`)}`;
}

/**
 * 토스 SDK 오류의 code · message
 *
 * @param error catch 로 받은 값
 * @param key code · message
 */
function errorField(error: unknown, key: 'code' | 'message'): string | null {
    const value = typeof error === 'object' && error !== null ? (error as Record<string, unknown>)[key] : null;
    return typeof value === 'string' ? value : null;
}
