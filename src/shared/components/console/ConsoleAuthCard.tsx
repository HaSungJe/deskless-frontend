import styles from '@/shared/css/console/ConsoleAuthCard.module.css';

type ConsoleAuthCardProps = {
    caption?: string;              // 제목 위 작은 글자(업체명 · "업체 관리자 로그인")
    title?: string;                // 카드 제목(h1)
    description?: React.ReactNode; // 제목 아래 설명
    wide?: boolean;                // 460px(안내) — 기본 420px
    children: React.ReactNode;
};

/**
 * 로그인 계열 카드 — 제목 · 설명 · 내용(시안 `.auth-card`)
 *
 * @param param0
 * @returns
 */
export default function ConsoleAuthCard({caption, title, description, wide = false, children}: ConsoleAuthCardProps): React.ReactNode {
    return (
        // 카드
        <section className={wide ? `${styles.card} ${styles.wide}` : styles.card}>
            {/* 작은 글자 · 제목 · 설명 */}
            {title ? (
                <div>
                    {caption ? <p className={styles.caption}>{caption}</p> : null}
                    <h1 className={styles.title}>{title}</h1>
                    {description ? <div className={styles.description}>{description}</div> : null}
                </div>
            ) : null}

            {/* 내용 */}
            {children}
        </section>
    );
}
