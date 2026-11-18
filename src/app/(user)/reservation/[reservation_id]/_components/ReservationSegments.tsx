import { PAYMENT_STATE } from '@/contracts/common/reservation.constants';
import { ReservationSegmentResultDto } from '@/contracts/reservation/dto/reservation-detail.dto';
import Badge from '@/shared/components/ui/display/Badge';
import { formatPrice, formatTimeRange, toKst } from '@/shared/utils/format';
import { paymentStateTone } from '../../reservation-state';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/ReservationDetailContent.module.css';

type ReservationSegmentsProps = {
    segments: Array<ReservationSegmentResultDto>; // 구간(시작 순)
};

/** 바깥 링크 — 영수증 */
const EXTERNAL_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;

/**
 * 결제 구간 — 구간마다 종류 · 시간 · 금액 · 결제 상태 · 영수증 · 결제 / 환불 정보(시안 user.html U7)
 *
 * @param param0
 * @returns
 */
export default function ReservationSegments({segments}: ReservationSegmentsProps): React.ReactNode {
    return (
        // 결제 구간
        <section className={pageStyles.card} aria-labelledby="reservation-segments-title">
            <h2 id="reservation-segments-title" className={pageStyles.cardTitle}>결제 구간</h2>
            {segments.map((segment) => (
                <div key={segment.reservation_detail_id} className={styles.segment}>
                    {/* 종류 · 시간 · 금액 */}
                    <div className={styles.segmentRow}>
                        <span className={styles.segmentName}><strong>{segment.reservation_detail_type_name}</strong> <span className={styles.muted}>{formatTimeRange(segment.start_at, segment.end_at)}</span></span>
                        <strong className={styles.segmentPrice}>{formatPrice(segment.price)}</strong>
                    </div>

                    {/* 결제 상태 · 영수증 · 결제 마감 */}
                    <div className={styles.segmentRowCenter}>
                        <Badge tone={paymentStateTone(segment.payment.payment_state_id)}>{segment.payment.payment_state_name}</Badge>
                        {segment.payment.receipt_url && segment.payment.receipt_url.startsWith('https://') ? (
                            <a className={styles.receipt} href={segment.payment.receipt_url} target="_blank" rel="noopener noreferrer">영수증 보기{EXTERNAL_ICON}</a>
                        ) : null}
                        {!segment.payment.receipt_url && segment.payment.payment_state_id === PAYMENT_STATE.READY && segment.expires_at ? (
                            <span className={styles.muted}>결제 마감 {toKst(segment.expires_at, 'HH:mm')}</span>
                        ) : null}
                    </div>

                    {/* 결제 · 환불 정보 */}
                    {segmentNote(segment) ? <span className={styles.muted}>{segmentNote(segment)}</span> : null}
                </div>
            ))}
        </section>
    );
}

/**
 * 구간 아래 줄 — 환불이면 '환불 65,000원 · 11월 9일 18:24 환불 완료', 결제 완료면 '카드 · 11월 10일 14:13 결제'
 *
 * @param segment 구간
 */
function segmentNote(segment: ReservationSegmentResultDto): string {
    const {payment} = segment;
    if (payment.refund_amount !== null) {
        return `환불 ${formatPrice(payment.refund_amount)}${payment.refunded_at ? ` · ${toKst(payment.refunded_at, 'M월 D일 HH:mm')} 환불 완료` : ''}`;
    }

    if (payment.approved_at) {
        return `${payment.method ?? '결제'} · ${toKst(payment.approved_at, 'M월 D일 HH:mm')} 결제`;
    }

    return '';
}
