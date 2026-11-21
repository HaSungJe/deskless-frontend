'use client';
import { usePathname } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getMyStore } from '@/contracts/store/api';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { AreaAccountType, getAreaAccount } from '@/shared/api/cookie';
import { handleApiError } from '@/shared/api/error';
import ConsoleShell from '@/shared/components/console/ConsoleShell';
import { visibleMenu } from '@/shared/components/console/console-menu';
import Badge from '@/shared/components/ui/display/Badge';
import useConsoleLogout from '@/shared/hooks/useConsoleLogout';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { MANAGER_AUTH_BADGE } from '../manager-auth';
import { ManagerConsoleContext } from './manager-console-context';
import { MANAGER_MENU } from './manager-menu';
import styles from '@/app/css/manager/ManagerConsoleLayoutContent.module.css';

type ManagerConsoleLayoutContentProps = {
    children: React.ReactNode;
};

/** 비밀번호 변경 — 상단 바 링크(띠 없이) */
const PASSWORD_PATH = '/manager/password/';

/**
 * 업체 관리자 콘솔 틀 — 내 업체 · 계정을 읽어 상단 바 · 권한별 메뉴를 그리고 Context 로 나눈다
 *
 * @param param0
 * @returns
 */
export default function ManagerConsoleLayoutContent({children}: ManagerConsoleLayoutContentProps): React.ReactNode {
    // 변수
    const pathname = usePathname();                                                       // 지금 주소 — 메뉴 강조
    const auth = useContext(AuthContext);                                                 // 매니저 토큰
    const loadStore = useEffectEvent((signal: AbortSignal) => getMyStore(auth, signal)); // 그때의 auth 로 내 업체 상세
    const {loggingOut, logout} = useConsoleLogout();                                      // ⑤ 로그아웃 — 토큰 · 계정 쿠키만 지우고(업체코드 쿠키는 남는다) 업체 로그인 주소 안내 문서 → 기억한 업체 로그인

    // 상태
    const [store, setStore] = useState<StoreMineResultDto | null>(null);  // 내 업체 상세
    const [account, setAccount] = useState<AreaAccountType | null>(null); // 기억한 계정
    const [accountLoaded, setAccountLoaded] = useState<boolean>(false);   // 계정 쿠키를 다 읽었나 — 업체 총관리자 전용 화면이 기다린다

    // 계산 값
    const menu = visibleMenu(MANAGER_MENU, account?.auth_id ?? null);            // ④ 업체 관리자 메뉴는 업체 총관리자만
    const badge = account ? MANAGER_AUTH_BADGE.get(account.auth_id) : undefined; // 권한 배지 글자 · 색

    // 효과
    useEffect(() => {
        // ② 들어오면 내 업체 상세와 기억한 계정을 읽는다(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadStore(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setStore(next);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });
        getAreaAccount('manager').then((next) => {
            if (!controller.signal.aborted) {
                setAccount(next);
                setAccountLoaded(true);
            }
        });

        return () => {
            controller.abort();
        };
    }, []);

    // 함수
    async function reloadStore(): Promise<StoreMineResultDto | null> {
        // 내 업체 상세 다시 — 못 읽으면 이전 값을 두고 null
        const next = await getMyStore(auth).catch((): null => null);
        if (next) {
            setStore(next);
        }

        return next;
    }

    return (
        // 콘솔 Context + 틀
        <ManagerConsoleContext.Provider value={{store, account, accountLoaded, reloadStore}}>
            <ConsoleShell
                areaName="업체 관리자 콘솔"
                menu={menu}
                pathname={pathname}
                heading={store ? <b className={styles.storeName}>{store.store_name}</b> : null}
                account={account ? <><span>{account.login_id}</span>{badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}</> : null}
                passwordHref={PASSWORD_PATH}
                loggingOut={loggingOut}
                onLogout={logout}
            >
                {children}
            </ConsoleShell>
        </ManagerConsoleContext.Provider>
    );
}
