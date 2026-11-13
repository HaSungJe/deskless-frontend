import styles from '@/shared/css/ui/display/Badge.module.css';

type BadgeProps = {
    tone?: 'neutral' | 'ok' | 'primary' | 'inuse' | 'warn' | 'danger';
    children: React.ReactNode;
};

/**
 * 상태 배지
 *
 * @param param0
 * @returns
 */
export default function Badge({tone = 'neutral', children}: BadgeProps): React.ReactNode {
    // 변수
    const classNames = `${styles.badge} ${styles[tone]}`; // 배지 · 색

    return (
        // 배지
        <span className={classNames}>{children}</span>
    );
}
