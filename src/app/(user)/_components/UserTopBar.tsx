import Link from 'next/link';
import { SITE_NAME } from '@/shared/utils/site';
import UserBackButton from './UserBackButton';
import styles from '@/app/css/user/UserTopBar.module.css';

/** 지나온 화면 하나 — 이름 · 주소 */
export type UserTrailType = {
    label: string; // 화면 이름 — "내 예약"
    href: string;  // 그 화면 주소
};

type UserTopBarProps = {
    title: string;                          // 지금 화면 이름(h1)
    parents?: ReadonlyArray<UserTrailType>; // 지나온 화면(위 단계부터) — 누르면 그 화면으로, 없으면 지금 화면 이름만
};

/** 홈(지도) 주소 */
const HOME_PATH = '/';

/**
 * 이용자 상단 바 — 왼쪽 이전 화면 버튼 · 서비스 이름(누르면 홈), 오른쪽 "지나온 화면 › 지금 화면"(사용자 2026-11-22)
 * - 이전 화면 버튼은 들어온 곳으로(브라우저 뒤로), 앞 단계 이름은 화면 구조상 위 단계로
 * - 홈(지도) 화면은 자기 머리(서비스 이름 · 로그인)를 쓴다 — 이전 화면 버튼도 없다
 *
 * @param param0
 * @returns
 */
export default function UserTopBar({title, parents = []}: UserTopBarProps): React.ReactNode {
    // 계산 값
    const fallbackHref = parents.at(-1)?.href ?? HOME_PATH; // 이전 화면 버튼이 돌아갈 이 사이트 화면이 없을 때 — 바로 위 단계, 없으면 홈

    return (
        // 상단 바
        <header className={styles.bar}>
            {/* 이전 화면 · 서비스 이름(홈으로) — 바로방 위치는 홈 머리와 같다(HomeContent .header 왼쪽 여백) */}
            <div className={styles.lead}>
                <UserBackButton fallbackHref={fallbackHref} />
                <Link href={HOME_PATH} className={styles.brand}>{SITE_NAME}</Link>
            </div>

            {/* 지나온 화면 › 지금 화면 */}
            <nav aria-label="현재 위치" className={styles.trail}>
                <ol className={styles.list}>
                    {parents.map((parent) => (
                        <li key={parent.href} className={styles.parent}>
                            <Link href={parent.href} className={styles.parentLink}>{parent.label}</Link>
                            <span className={styles.sep} aria-hidden="true">›</span>
                        </li>
                    ))}
                    <li className={styles.current} aria-current="page"><h1 className={styles.title}>{title}</h1></li>
                </ol>
            </nav>
        </header>
    );
}
