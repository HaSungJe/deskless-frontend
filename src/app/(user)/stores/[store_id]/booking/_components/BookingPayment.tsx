import { RESERVATION_PAYMENT_PENDING_MINUTES, RESERVATION_REBOOK_BLOCK_MINUTES } from '@/contracts/common/reservation.constants';
import { ReservationResultDto } from '@/contracts/reservation/dto/reservation.dto';
import TossPaymentWidget from '@/shared/components/payment/TossPaymentWidget';
import { formatDateTimeRange, formatPrice, toKst } from '@/shared/utils/format';
import styles from '@/app/css/user/UserPage.module.css';

type BookingPaymentProps = {
    payment: ReservationResultDto; // 예약 생성 done — 결제 정보 · 이용 시간
    storeName: string;             // 업체
    roomLabel: string;             // "그룹 · 호실"
    planName: string;              // 상품 이름
    returnUrl: string;             // 결제 뒤 돌아갈 곳(이 예약 화면)
    onExpired: () => void;         // 결제 마감
};

/** 시계 — 시안 결제 대기 */
const CLOCK_ICON = <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;

/**
 * U3 결제 대기 — 결제 마감 안내 · 예약 내용 · 결제위젯(시안 user.html U3-payment, 남은 시간은 위젯 안 표시)
 *
 * @param param0
 * @returns
 */
export default function BookingPayment({payment, storeName, roomLabel, planName, returnUrl, onExpired}: BookingPaymentProps): React.ReactNode {
    return (
        // 결제 대기
        <div className={styles.body}>
            {/* 결제 마감 안내 */}
            <section className={`${styles.card} ${styles.hero}`}>
                <span className={`${styles.icon} ${styles.icon48} ${styles.warn}`}>{CLOCK_ICON}</span>
                <h2 className={styles.heroTitle}>결제를 기다리고 있어요</h2>
                <p className={styles.heroText}>결제 마감 {toKst(payment.expires_at, 'HH:mm')}</p>
                <p className={styles.note}>{RESERVATION_PAYMENT_PENDING_MINUTES}분 안에 결제하지 않으면 예약이 만료돼요.<br />만료 뒤 {RESERVATION_REBOOK_BLOCK_MINUTES}분 동안은 같은 호실을 다시 예약할 수 없어요.</p>
            </section>

            {/* 예약 내용 */}
            <section className={styles.card} aria-labelledby="booking-payment-summary">
                <h2 id="booking-payment-summary" className={styles.cardTitle}>예약 내용</h2>
                <dl className={styles.dl}>
                    <dt>업체</dt><dd>{storeName}</dd>
                    <dt>객실</dt><dd>{roomLabel}</dd>
                    <dt>상품</dt><dd>{planName}</dd>
                    <dt>이용</dt><dd>{formatDateTimeRange(payment.start_at, payment.end_at)}</dd>
                    <dt>주문명</dt><dd>{payment.order_name}</dd>
                </dl>
                <div className={styles.total}>
                    <span className={styles.totalLabel}>결제 금액</span>
                    <strong className={styles.totalValue}>{formatPrice(payment.amount)}</strong>
                </div>
            </section>

            {/* 결제위젯 — 남은 시간 · 결제수단 · 약관 · 결제하기 */}
            <section className={styles.card}>
                <TossPaymentWidget payment={payment} returnUrl={returnUrl} onExpired={onExpired} />
            </section>
        </div>
    );
}
