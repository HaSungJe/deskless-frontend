import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/ReservationDetailContent.module.css';
import { RefundGuideType } from '../reservation-rules';

type RefundGuideCardProps = {
    guide: RefundGuideType; // 줄 또는 문구 + 설명
};

/**
 * 환불 안내 — 지금 해당하는 줄 강조 · 시작 뒤 불가는 빨강(시안 user.html U7)
 *
 * @param param0
 * @returns
 */
export default function RefundGuideCard({guide}: RefundGuideCardProps): React.ReactNode {
    return (
        // 환불 안내
        <section className={pageStyles.card} aria-labelledby="reservation-refund-title">
            <h2 id="reservation-refund-title" className={pageStyles.cardTitle}>환불 안내</h2>

            {/* 줄 — 마감 전 · 마감 뒤 · 시작 뒤 */}
            {guide.rows.length > 0 ? (
                <div className={styles.refundRows}>
                    {guide.rows.map((row) => (
                        <div key={row.label} className={row.current ? `${styles.refundRow} ${styles.refundCurrent}` : styles.refundRow}>
                            <span>{row.label}{row.current ? ' · 지금' : ''}</span>
                            <span className={row.danger ? styles.refundDanger : styles.refundValue}>{row.value}</span>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* 문구 · 설명 */}
            {guide.message ? <p className={styles.refundMessage}>{guide.message}</p> : null}
            {guide.note ? <p className={pageStyles.note}>{guide.note}</p> : null}
        </section>
    );
}
