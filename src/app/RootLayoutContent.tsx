'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { deleteToken, getAccessToken } from '@/shared/api/cookie';
import NextTopLoader from 'nextjs-toploader';
import Scripts from '@/shared/components/Scripts';
import RootLayoutProvider from '@/shared/providers/RootLayoutProvider';

type RootLayoutContentProps = {
    children: React.ReactNode;
    modal?: React.ReactNode; // 경로 모달 — Provider 안에서 그려 Context 를 쓸 수 있게
};

export default function RootLayoutContent({ children, modal }: RootLayoutContentProps): React.ReactNode {
    // 변수
    const pathname = usePathname(); // 지금 주소 — 바뀔 때마다 로그인 상태를 다시 확인

    // 상태
    const [rootLayoutLoading, setRootLayoutLoading] = useState<boolean>(true); // 최상위 레이아웃 로딩여부
    const [accessToken, setAccessToken] = useState<string>(null);              // AccessToken

    // 효과
    useEffect(() => {
        // 이전페이지정보 저장.
        if (pathname.indexOf('/sign') === -1) {
            sessionStorage.setItem('referer', pathname);
        }

        getAccessToken().then(async (accessToken: string) => {
            if (accessToken) {
                setAccessToken(accessToken);
            } else {
                await deleteToken();
                setAccessToken(null);
            }

            // 레이아웃 로딩완료
            setRootLayoutLoading(false);
        });
    }, [pathname]);

    return (
        // 루트 — 진행 막대 · 화면
        <>
            {/* 상단 진행 막대 */}
            <NextTopLoader color="var(--primary)" showSpinner={false} />

            {/* 화면 */}
            <div id="wrap">
                {/* 외부 스크립트 */}
                <Scripts />

                {/* 로그인 상태 Context — 화면 · 경로 모달 */}
                <RootLayoutProvider
                    rootLayoutLoading={rootLayoutLoading}
                    accessTokenData={{accessToken, setAccessToken}}
                    isLogin={accessToken ? true : false}
                >
                    {children}
                    {modal}
                </RootLayoutProvider>
            </div>
        </>
    )
}
