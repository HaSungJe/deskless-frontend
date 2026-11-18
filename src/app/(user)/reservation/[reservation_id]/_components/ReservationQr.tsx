import { QRCodeSVG } from 'qrcode.react';
import { ReservationQrResultDto } from '@/contracts/reservation/dto/reservation-qr.dto';
import { formatDateTime } from '@/shared/utils/format';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/ReservationDetailContent.module.css';

type ReservationQrProps = {
    qr: ReservationQrResultDto; // QR(32자) · 유효 끝
    roomName: string;           // 호실
};

/** QR 크기 — 시안 200px */
const QR_SIZE = 200;

/** 시계 — 유효 끝 */
const CLOCK_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;

/**
 * 이용 중 QR — 문 옆 리더기에 대는 QR · 유효 끝(시안 user.html U7-in-use)
 *
 * @param param0
 * @returns
 */
export default function ReservationQr({qr, roomName}: ReservationQrProps): React.ReactNode {
    return (
        // QR
        <section className={`${pageStyles.card} ${pageStyles.hero} ${styles.qrCard}`} aria-labelledby="reservation-qr-title">
            <h2 id="reservation-qr-title" className={pageStyles.cardTitle}>{roomName} 문 QR</h2>
            <div className={styles.qrBox}>
                <QRCodeSVG value={qr.qr} size={QR_SIZE} title={`${roomName} 문 QR`} />
            </div>
            <p className={styles.qrText}>문 옆 리더기에 QR 을 대 주세요</p>
            <span className={styles.qrEnds}>{CLOCK_ICON}QR 유효 끝 {formatDateTime(qr.qr_ends_at)}</span>
        </section>
    );
}
