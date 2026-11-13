import styles from '@/shared/css/ui/display/Card.module.css';

type CardProps = {
    title?: string;
    actions?: React.ReactNode; // 제목 오른쪽 버튼들
    children: React.ReactNode;
};

/**
 * 카드 — 흰 바탕 묶음, 제목 · 오른쪽 버튼 줄(선택)
 *
 * @param param0
 * @returns
 */
export default function Card({title, actions, children}: CardProps): React.ReactNode {
    // 변수
    const hasHeader = Boolean(title || actions); // 머리 줄을 그릴지

    return (
        // 카드
        <section className={styles.card}>
            {/* 머리 — 제목 · 오른쪽 버튼 */}
            {hasHeader ? (
                <header className={styles.header}>
                    {title ? <h2 className={styles.title}>{title}</h2> : null}
                    {actions ? <div className={styles.actions}>{actions}</div> : null}
                </header>
            ) : null}

            {/* 내용 */}
            {children}
        </section>
    );
}
