'use client';
import PaymentFailView from '../_components/PaymentFailView';
import { paymentReturnPath } from '../payment-result';
import styles from '@/app/css/user/UserPage.module.css';

type PaymentFailContentProps = {
    code: string | null;      // 토스 오류 코드(PAY_PROCESS_CANCELED — 사용자가 취소 등)
    message: string | null;   // 토스 오류 문구
    returnUrl: string | null; // 다시 고르기 — 결제위젯이 붙인 return_url
};

/** 토스 문구가 없을 때 */
const PAYMENT_FAIL_MESSAGE = '결제를 마치지 못했어요.';

/**
 * U4 결제 실패 — 토스가 돌려준 사유 · 코드와 다시 고르기
 *
 * @param param0
 * @returns
 */
export default function PaymentFailContent({code, message, returnUrl}: PaymentFailContentProps): React.ReactNode {
    return (
        // 결제 결과
        <div className={styles.page}>
            {/* 머리 */}
            <header className={styles.plainHeader}><h1 className={styles.plainTitle}>결제 결과</h1></header>

            {/* ① 사유 · 코드 · ② 다시 고르기 */}
            <PaymentFailView message={message || PAYMENT_FAIL_MESSAGE} code={code} backPath={paymentReturnPath(returnUrl)} />
        </div>
    );
}
