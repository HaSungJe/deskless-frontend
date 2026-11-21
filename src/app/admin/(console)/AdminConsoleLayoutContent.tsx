'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AreaAccountType, getAreaAccount } from '@/shared/api/cookie';
import ConsoleShell from '@/shared/components/console/ConsoleShell';
import { visibleMenu } from '@/shared/components/console/console-menu';
import Badge from '@/shared/components/ui/display/Badge';
import useConsoleLogout from '@/shared/hooks/useConsoleLogout';
import { ADMIN_AUTH_BADGE, ADMIN_PASSWORD_PATH } from '../admin-auth';
import { AdminConsoleContext } from './admin-console-context';
import { ADMIN_MENU } from './admin-menu';

type AdminConsoleLayoutContentProps = {
    children: React.ReactNode;
};

/**
 * 관리자 콘솔 틀 — 기억한 계정을 읽어 상단 바 · 메뉴를 그리고 Context 로 나눈다
 * - 업체 콘솔과 달리 읽을 업체가 없어 상단 바 왼쪽은 비운다(로고 · "관리자 콘솔"은 왼쪽 메뉴 위에 있다)
 *
 * @param param0
 * @returns
 */
export default function AdminConsoleLayoutContent({children}: AdminConsoleLayoutContentProps): React.ReactNode {
    // 변수
    const pathname = usePathname();                  // 지금 주소 — 메뉴 · 비밀번호 변경 강조
    const {loggingOut, logout} = useConsoleLogout(); // ⑤ 로그아웃 — 토큰 · 계정 쿠키 삭제 → 관리자 로그인 문서

    // 상태
    const [account, setAccount] = useState<AreaAccountType | null>(null); // 기억한 계정

    // 계산 값
    const menu = visibleMenu(ADMIN_MENU, account?.auth_id ?? null);            // ③ 메뉴 5개 — 권한이 정해진 메뉴가 없어 모두 보인다
    const badge = account ? ADMIN_AUTH_BADGE.get(account.auth_id) : undefined; // ② 권한 배지 글자 · 색

    // 효과
    useEffect(() => {
        // ② 들어오면 기억한 계정(아이디 · 권한)을 읽는다(떠나면 결과를 버린다)
        let active = true;
        getAreaAccount('admin').then((next) => {
            if (active) {
                setAccount(next);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    return (
        // 콘솔 Context + 틀
        <AdminConsoleContext.Provider value={{account}}>
            <ConsoleShell
                areaName="관리자 콘솔"
                menu={menu}
                pathname={pathname}
                heading={null}
                account={account ? <><span>{account.login_id}</span>{badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}</> : null}
                passwordHref={ADMIN_PASSWORD_PATH}
                loggingOut={loggingOut}
                onLogout={logout}
            >
                {children}
            </ConsoleShell>
        </AdminConsoleContext.Provider>
    );
}
