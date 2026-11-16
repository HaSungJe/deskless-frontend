'use client';
import Link from 'next/link';
import { useContext } from 'react';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { loginUrl } from '@/shared/utils/area';
import styles from '@/app/css/user/HomeContent.module.css';

/**
 * U1 지도 · 주변 업체 — frontend/screens.md 참고(지도 · 업체 목록은 Phase 6). 지금은 머리만
 *
 * @returns
 */
export default function HomeContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 로그인했으면 "내 예약", 아니면 "로그인"

    return (
        // 지도 · 주변 업체
        <div className={styles.home}>
            {/* 머리 — roomless · 로그인 / 내 예약 */}
            <header className={styles.header}>
                <strong className={styles.brand}>roomless</strong>
                {auth.isLogin
                    ? <Link href="/reservation/" className={styles.headerLink}>내 예약</Link>
                    : <Link href={loginUrl('user', '/')} className={styles.headerLink}>로그인</Link>}
            </header>

            {/* 지도 자리 — Phase 6 */}
            <div className={styles.placeholder}>지도 · 주변 업체</div>
        </div>
    );
}
