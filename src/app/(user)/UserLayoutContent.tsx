'use client';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import UserMeProvider from './_components/UserMeProvider';
import UserTabBar, { isMainTabPath } from './_components/UserTabBar';
import { UserHistoryContext } from './_components/user-history';
import styles from '@/app/css/user/UserLayoutContent.module.css';

type UserLayoutContentProps = {
    children: React.ReactNode;
};

/**
 * 이용자 틀 — 가운데 · 최대 480px, 주 탭 주소면 하단 탭, 내 정보 Context, 이동 Context(상단 바 이전 화면 버튼)
 *
 * @param param0
 * @returns
 */
export default function UserLayoutContent({children}: UserLayoutContentProps): React.ReactNode {
    // 변수
    const pathname = usePathname(); // 지금 주소 — 하단 탭 · 처음 화면에서 옮겼는지

    // 상태
    const [entryPath] = useState<string>(pathname); // 이 탭에서 처음 들어온 화면 — 여기서 브라우저 뒤로는 사이트 밖

    // 계산 값
    const showTabBar = isMainTabPath(pathname); // 주 탭 화면(지도 · 내 예약 · 내 정보)인지
    const moved = pathname !== entryPath;       // 처음 화면에서 옮겼는지 — 이전 화면 버튼이 브라우저 뒤로를 쓸지

    return (
        // 이용자 틀
        <UserMeProvider>
            <UserHistoryContext.Provider value={{moved}}>
                <div className={styles.frame}>
                    {/* 화면 */}
                    <div className={styles.body}>{children}</div>

                    {/* 하단 탭 — 주 탭 화면만 */}
                    {showTabBar ? <UserTabBar pathname={pathname} /> : null}
                </div>
            </UserHistoryContext.Provider>
        </UserMeProvider>
    );
}
