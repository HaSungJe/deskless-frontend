import styles from '@/shared/css/ui/display/EmptyState.module.css';

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: React.ReactNode;
};

/**
 * 빈 상태 — 목록이 비었을 때
 *
 * @param param0
 * @returns
 */
export default function EmptyState({title, description, action}: EmptyStateProps): React.ReactNode {
    return (
        // 빈 상태
        <div className={styles.empty}>
            {/* 제목 */}
            <p className={styles.title}>{title}</p>

            {/* 설명 */}
            {description ? <p className={styles.description}>{description}</p> : null}

            {/* 다음 행동 버튼 */}
            {action ? <div className={styles.action}>{action}</div> : null}
        </div>
    );
}
