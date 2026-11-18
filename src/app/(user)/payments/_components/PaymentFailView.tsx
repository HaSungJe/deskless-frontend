import Link from 'next/link';
import { buttonClass } from '@/shared/components/ui/button/Button';
import styles from '@/app/css/user/UserPage.module.css';

type PaymentFailViewProps = {
    message: string;     // 사유
    code: string | null; // 토스 · 결제 오류 코드
    backPath: string;    // 돌아갈 곳 — 결제한 예약 1건(없으면 첫 화면)
};

/** 돌아갈 곳이 없을 때(첫 화면) */
const HOME_PATH = '/';

/** X — 시안 U4 실패 */
const X_ICON = <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7l10 10" /><path d="M17 7L7 17" /></svg>;

/**
 * 결제 실패 화면 — 사유 · 오류 코드 · 예약으로 돌아가기(시안 user.html U4-fail) — 오류 팝업은 띄우지 않는다
 * - 돌아갈 곳은 결제한 예약 1건(U7) — 결제 마감 전이면 거기서 다시 결제하거나 취소한다
 *
 * @param param0
 * @returns
 */
export default function PaymentFailView({message, code, backPath}: PaymentFailViewProps): React.ReactNode {
    // 계산 값
    const backLabel = backPath === HOME_PATH ? '처음으로' : '예약으로 돌아가기'; // 돌아가기 버튼 글자

    return (
        // 결제 실패
        <>
            <div className={styles.resultBody}>
                {/* 안내 */}
                <div className={styles.resultHero}>
                    <span className={`${styles.icon} ${styles.icon64} ${styles.danger}`}>{X_ICON}</span>
                    <h2 className={styles.heroTitle}>결제하지 못했어요</h2>
                    <p className={styles.heroText}>결제 마감 전이면 예약에서 다시 결제할 수 있어요.<br />마감이 지났으면 시간대와 호수를 다시 골라 주세요.</p>
                </div>

                {/* 사유 · 오류 코드 */}
                <section className={`${styles.card} ${styles.stretch}`}>
                    <div className={styles.stack}>
                        <span className={styles.label}>사유</span>
                        <strong className={styles.dangerText}>{message}</strong>
                    </div>
                    {code ? (
                        <div className={styles.stack}>
                            <span className={styles.label}>오류 코드</span>
                            <span className={styles.mono}>{code}</span>
                        </div>
                    ) : null}
                </section>
            </div>

            {/* 예약으로 돌아가기 */}
            <div className={styles.footer}>
                <Link href={backPath} className={buttonClass({variant: 'primary', size: 'lg', full: true})}>{backLabel}</Link>
            </div>
        </>
    );
}
