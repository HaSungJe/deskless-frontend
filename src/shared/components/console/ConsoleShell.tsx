import Link from 'next/link';
import Button from '@/shared/components/ui/button/Button';
import { SITE_NAME } from '@/shared/utils/site';
import { activeMenuHref, ConsoleMenuItemType, isCurrentPath } from './console-menu';
import styles from '@/shared/css/console/ConsoleShell.module.css';

type ConsoleShellProps = {
    areaName: string;                 // 로고 아래 글자 — "업체 관리자 콘솔"
    menu: Array<ConsoleMenuItemType>; // 보일 메뉴(권한으로 거른 것)
    pathname: string;                 // 지금 주소 — 강조할 메뉴
    heading: React.ReactNode;         // 상단 바 왼쪽(업체 이름 · 업체코드) — 아직 없으면 null
    account: React.ReactNode;         // 상단 바 오른쪽 계정(아이디 · 배지) — 없으면 null
    passwordHref: string;             // 비밀번호 변경
    loggingOut: boolean;              // 로그아웃 중
    onLogout: () => void;             // 로그아웃
    children: React.ReactNode;        // 화면
};

/** 로고 — 시안 manager.html `#i-logo` */
const LOGO = <svg className={styles.mark} viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="7" fill="var(--primary)" /><path d="M10 21V8h8v13M8 21h12" fill="none" stroke="var(--on-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="15.5" cy="14.5" r="1.2" fill="var(--on-primary)" /></svg>;

/**
 * 콘솔 틀 — 왼쪽 메뉴 232px · 상단 바(왼쪽 heading, 오른쪽 계정 · 비밀번호 변경 · 로그아웃) · 본문
 * - 본문은 메뉴 옆 flex-wrap 줄이라 좁으면 메뉴가 위로 쌓인다(시안 콘솔 틀)
 * - 도메인을 모른다 — 메뉴 · 글자는 영역 layout 이 넘긴다(업체 관리자 · 관리자)
 *
 * @param param0
 * @returns
 */
export default function ConsoleShell({areaName, menu, pathname, heading, account, passwordHref, loggingOut, onLogout, children}: ConsoleShellProps): React.ReactNode {
    // 계산 값
    const activeHref = activeMenuHref(pathname, menu);        // 강조할 메뉴
    const onPassword = isCurrentPath(pathname, passwordHref); // 비밀번호 변경 화면 — 상단 바 링크 강조(관리자는 콘솔 안)

    return (
        // 콘솔
        <div className={styles.console}>
            {/* 왼쪽 메뉴 */}
            <aside className={styles.side} aria-label="메뉴">
                <div className={styles.logo}>{LOGO}<div><b>{SITE_NAME}</b><small>{areaName}</small></div></div>
                <nav className={styles.nav} aria-label={`${areaName} 메뉴`}>
                    {menu.map((item) => (
                        <Link key={item.href} href={item.href} aria-current={item.href === activeHref ? 'page' : undefined}>
                            <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg>
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            <div className={styles.main}>
                {/* 상단 바 */}
                <header className={styles.top}>
                    <div className={styles.topLeft}>{heading}</div>
                    <div className={styles.topRight}>
                        {account}
                        <Link href={passwordHref} className={styles.passwordLink} aria-current={onPassword ? 'page' : undefined}>비밀번호 변경</Link>
                        <Button size="sm" disabled={loggingOut} onClick={onLogout}>로그아웃</Button>
                    </div>
                </header>

                {/* 화면 */}
                <main className={styles.page}>{children}</main>
            </div>
        </div>
    );
}
