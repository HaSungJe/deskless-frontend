import styles from '@/shared/css/ui/display/Band.module.css';

type BandProps = {
    tone?: 'info' | 'warn' | 'danger' | 'ok'; // ok — 승인 · 완료(입점 승인)
    title?: string;
    role?: 'alert' | 'status';                // 화면 읽기 프로그램에 알릴 때 — 실패는 alert(로그인 실패)
    children?: React.ReactNode;
};

/**
 * 안내 띠 — 회원 상태(BLOCK · LEAVE_WAIT) · 업체 상태(SUSPEND) · 화면 안내
 *
 * @param param0
 * @returns
 */
export default function Band({tone = 'info', title, role, children}: BandProps): React.ReactNode {
    // 변수
    const classNames = `${styles.band} ${styles[tone]}`; // 띠 · 색

    return (
        // 안내 띠
        <div className={classNames} role={role}>
            {/* 제목 · 내용 묶음 */}
            <div className={styles.body}>
                {/* 제목 */}
                {title ? <strong className={styles.title}>{title}</strong> : null}

                {/* 내용 */}
                {children ? <div>{children}</div> : null}
            </div>
        </div>
    );
}
