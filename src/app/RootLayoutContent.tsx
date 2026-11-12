'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { deleteToken, getAccessToken } from '@/shared/api/cookie';
import NextTopLoader from 'nextjs-toploader';
import Scripts from '@/shared/components/Scripts';
import RootLayoutProvider from '@/shared/providers/RootLayoutProvider';

export default function RootLayoutContent({ children }: { children: React.ReactNode }): React.ReactNode {
    const pathname = usePathname();

    // 기본정보
    const [rootLayoutLoading, setRootLayoutLoading] = useState<boolean>(true); // 최상위 레이아웃 로딩여부
    const [accessToken, setAccessToken] = useState<string>(null); // AccessToken

    // 페이지 변경
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
        <>
            <NextTopLoader showSpinner={false} />
            <div id="wrap">
                <Scripts />
                <RootLayoutProvider
                    rootLayoutLoading={rootLayoutLoading}
                    accessTokenData={{accessToken, setAccessToken}}
                    isLogin={accessToken ? true : false}
                >
                    {children}
                </RootLayoutProvider>
            </div>
        </>
    )
}
