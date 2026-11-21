'use client';
import Link from 'next/link';
import { useContext } from 'react';
import { UserHistoryContext } from './user-history';
import styles from '@/app/css/user/UserTopBar.module.css';

type UserBackButtonProps = {
    fallbackHref: string; // 돌아갈 이 사이트 화면이 없을 때(주소로 바로 들어옴) — 위 단계, 없으면 홈
};

/**
 * 이전 화면 버튼 — 들어온 곳으로 브라우저 뒤로, 돌아갈 곳이 사이트 밖이면 위 단계로(사용자 2026-11-22)
 * - 뒤로를 써도 되는지(referrer · 이 사이트 안 이동)는 이용자 틀의 UserHistoryProvider 가 판단해 넘긴다
 * - 위 단계로 갈 때는 보통 링크 이동(하위 경로 basePath 는 Link 가 붙인다), 브라우저 뒤로일 때만 링크 이동을 막는다
 *
 * @param param0
 * @returns
 */
export default function UserBackButton({fallbackHref}: UserBackButtonProps): React.ReactNode {
    // 변수
    const {canGoBack} = useContext(UserHistoryContext); // 브라우저 뒤로가 이 사이트 안인지

    // 함수
    function goBack(event: React.MouseEvent<HTMLAnchorElement>): void {
        // 이 사이트에서 온 화면이 있으면 브라우저 뒤로(그 화면 · 스크롤 그대로), 아니면 링크대로 위 단계
        if (canGoBack) {
            event.preventDefault();
            window.history.back();
        }
    }

    return (
        // 이전 화면
        <Link href={fallbackHref} className={styles.back} aria-label="이전 화면으로" onClick={goBack}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
    );
}
