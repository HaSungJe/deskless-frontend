import Link from 'next/link';
import styles from '@/app/css/user/UserTopBar.module.css';

type UserTopBarProps = {
    title: string;    // 화면 제목
    backHref: string; // 뒤로 가기 주소
};

/**
 * 상단 바 — 하위 화면(뒤로 가기 + 제목)
 *
 * @param param0
 * @returns
 */
export default function UserTopBar({title, backHref}: UserTopBarProps): React.ReactNode {
    return (
        // 상단 바
        <header className={styles.bar}>
            {/* 뒤로 가기 */}
            <Link href={backHref} className={styles.back} aria-label="뒤로 가기">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            </Link>

            {/* 제목 */}
            <h1 className={styles.title}>{title}</h1>
        </header>
    );
}
