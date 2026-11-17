import Timer from '@/shared/components/Timer';
import { toKst } from '@/shared/utils/format';
import pageStyles from '@/app/css/user/ReservationPage.module.css';
import styles from '@/app/css/user/ReservationDetailContent.module.css';

type QrLockedProps = {
    startAt: string;      // 이용 시작
    startsSoon: boolean;  // 1시간 안 — 남은 시간
};

/** 자물쇠 — 시안 U7-before */
const LOCK_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;

/**
 * 이용 전 QR 잠김 — 시작 1시간 안이면 남은 시간(시작 시각에 상세를 다시 부르는 것은 화면의 시각표 — screenSchedule)(시안 user.html U7-before)
 *
 * @param param0
 * @returns
 */
export default function QrLocked({startAt, startsSoon}: QrLockedProps): React.ReactNode {
    return (
        // QR 잠김
        <section className={`${pageStyles.card} ${pageStyles.hero}`}>
            <span className={`${pageStyles.icon} ${pageStyles.icon48} ${pageStyles.primary}`}>{LOCK_ICON}</span>
            <h2 className={styles.lockTitle}>시작 시각부터 QR 이 열립니다</h2>
            {startsSoon ? (
                <div className={styles.countdown}>
                    <span className={styles.countdownLabel}>이용 시작까지</span>
                    <strong className={styles.countdownTime}><Timer time={startAt} /></strong>
                </div>
            ) : null}
            <p className={pageStyles.note}>{toKst(startAt, 'HH:mm')}이 되면 이 화면에 QR 이 나타나요.</p>
        </section>
    );
}
