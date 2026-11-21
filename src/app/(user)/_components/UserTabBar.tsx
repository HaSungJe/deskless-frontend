import Link from 'next/link';
import styles from '@/app/css/user/UserTabBar.module.css';

type UserTabBarProps = {
    pathname: string; // 지금 주소 — 고른 탭 표시
};

/** 하단 탭 — 시안 화면 규칙(지도 · 내 예약 · 내 정보 — 시안의 "마이"를 사용자 2026-11-22 에 바꿈) */
const MAIN_TABS = [
    {href: '/', label: '지도', icon: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14" /><path d="M15 6v14" /></>},
    {href: '/reservation/', label: '내 예약', icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M8 3v4" /><path d="M16 3v4" /></>},
    {href: '/me/', label: '내 정보', icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>},
];

/**
 * 주 탭 화면인지 — 끝 / 상관없이
 *
 * @param pathname 주소
 */
export function isMainTabPath(pathname: string): boolean {
    return MAIN_TABS.some((tab) => trimSlash(tab.href) === trimSlash(pathname));
}

/**
 * 하단 탭 — 아이콘 + 이름(시안 user.html:274-279)
 *
 * @param param0
 * @returns
 */
export default function UserTabBar({pathname}: UserTabBarProps): React.ReactNode {
    return (
        // 하단 탭
        <nav className={styles.bar} aria-label="주 메뉴">
            {MAIN_TABS.map((tab) => {
                const active = trimSlash(tab.href) === trimSlash(pathname);
                return (
                    <Link key={tab.href} href={tab.href} className={active ? `${styles.tab} ${styles.active}` : styles.tab} aria-current={active ? 'page' : undefined}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{tab.icon}</svg>
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}

/**
 * 끝 / 떼기(루트는 그대로)
 *
 * @param path 주소
 */
function trimSlash(path: string): string {
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
}
