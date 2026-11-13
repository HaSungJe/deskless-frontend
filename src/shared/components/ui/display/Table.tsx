import styles from '@/shared/css/ui/display/Table.module.css';

type TableProps = {
    caption?: string;
    children: React.ReactNode; // <thead> · <tbody>
};

/**
 * 표 틀 — 가로로 넘치면 스크롤
 *
 * @param param0
 * @returns
 */
export default function Table({caption, children}: TableProps): React.ReactNode {
    return (
        // 가로 스크롤 틀
        <div className={styles.wrap}>
            {/* 표 */}
            <table className={styles.table}>
                {/* 표 제목 */}
                {caption ? <caption className={styles.caption}>{caption}</caption> : null}

                {/* thead · tbody */}
                {children}
            </table>
        </div>
    );
}
