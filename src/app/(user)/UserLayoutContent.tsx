'use client';
import { usePathname } from 'next/navigation';
import UserMeProvider from './_components/UserMeProvider';
import UserTabBar, { isMainTabPath } from './_components/UserTabBar';
import styles from '@/app/css/user/UserLayoutContent.module.css';

type UserLayoutContentProps = {
    children: React.ReactNode;
};

/**
 * 이용자 틀 — 가운데 · 최대 480px, 주 탭 주소면 하단 탭, 내 정보 Context
 *
 * @param param0
 * @returns
 */
export default function UserLayoutContent({children}: UserLayoutContentProps): React.ReactNode {
    // 변수
    const pathname = usePathname(); // 지금 주소 — 하단 탭을 보일지

    // 계산 값
    const showTabBar = isMainTabPath(pathname); // 주 탭 화면(지도 · 내 예약 · 내 정보)인지

    return (
        // 이용자 틀
        <UserMeProvider>
            <div className={styles.frame}>
                {/* 화면 */}
                <div className={styles.body}>{children}</div>

                {/* 하단 탭 — 주 탭 화면만 */}
                {showTabBar ? <UserTabBar pathname={pathname} /> : null}
            </div>
        </UserMeProvider>
    );
}
