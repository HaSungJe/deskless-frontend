'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import NextTopLoader from 'nextjs-toploader';
import { deleteAreaTokens, getAreaToken } from '@/shared/api/cookie';
import Scripts from '@/shared/components/Scripts';
import ErrorPopup from '@/shared/components/ui/modal/ErrorPopup';
import RootLayoutProvider from '@/shared/providers/RootLayoutProvider';
import { AreaType, areaOf, loginUrl } from '@/shared/utils/area';
import { applyPublicEnv, PublicEnvType } from '@/shared/utils/public-env';

type RootLayoutContentProps = {
    children: React.ReactNode;
    modal?: React.ReactNode;    // 경로 모달 — Provider 안에서 그려 Context 를 쓸 수 있게
    publicEnv: PublicEnvType;   // 공개 값 — 루트 layout 이 요청 때 읽어 넘긴다(getPublicEnv 가 브라우저에서 읽는다)
};

type AreaTokenType = {
    area: AreaType | null; // 이 토큰을 확인한 영역 — 처음엔 null
    path: string | null;   // 확인한 주소 — 로그인 안 된 상태는 주소마다 다시 확인한다
    token: string | null;  // 그 영역 access 토큰
};

type CurrentType = {
    area: AreaType;   // 지금 영역
    pathname: string; // 지금 주소
};

/**
 * 루트 — 주소가 바뀔 때마다 그 영역 로그인 상태를 확인해 Context 로, 오류 팝업 하나
 * - 공개 값은 처음 그릴 때(아래 화면이 그리기 전) 브라우저에 둔다 — 화면 · 연동 부품이 getPublicEnv 로 읽는다
 *
 * @param param0
 * @returns
 */
export default function RootLayoutContent({children, modal, publicEnv}: RootLayoutContentProps): React.ReactNode {
    // 변수
    const pathname = usePathname();                                  // 지금 주소 — 바뀔 때마다 그 영역 토큰을 다시 확인
    const router = useRouter();                                      // 로그인 만료 때 이동
    const area = areaOf(pathname);                                   // 지금 영역
    const currentRef = useRef<CurrentType>({area, pathname});        // 지금 영역 · 주소 — 늦게 끝난 재발급 · 만료 처리가 옛 영역에 쓰지 않게

    // 상태
    useState<void>(() => applyPublicEnv(publicEnv));                                                  // 공개 값 — 처음 그릴 때 한 번(아래 화면보다 먼저)
    const [areaToken, setAreaToken] = useState<AreaTokenType>({area: null, path: null, token: null}); // 확인한 영역 · 주소 · 토큰

    // 계산 값
    const sameArea = areaToken.area === area;                                              // 지금 영역 토큰을 확인했는지
    const token = sameArea ? areaToken.token : null;                                       // 지금 영역 토큰
    const checked = sameArea && (Boolean(token) || areaToken.path === pathname);           // 로그인했으면 영역만, 안 했으면 이 주소까지 확인했는지

    // 효과
    useEffect(() => {
        // 지금 영역 · 주소 기억 — 콜백(재발급 · 만료)이 옛 영역에 쓰지 않게
        currentRef.current = {area, pathname};
    }, [area, pathname]);

    useEffect(() => {
        // 주소가 바뀌면 그 영역 토큰 확인(없거나 곧 만료면 route handler 가 재발급)
        let active = true;
        getAreaToken(area).then((accessToken) => {
            if (active) {
                setAreaToken({area, path: pathname, token: accessToken});
            }
        });

        return () => {
            active = false;
        };
    }, [pathname, area]);

    // 함수
    function changeToken(next: string | null): void {
        // 재발급 · 만료로 토큰이 바뀜 — 그 사이 다른 영역을 확인했으면 무시
        setAreaToken((prev) => (prev.area === area ? {...prev, token: next} : prev));
    }

    function expire(): void {
        // 로그인 만료 — 그 사이 영역을 옮겼으면 보내지 않는다
        if (currentRef.current.area !== area) {
            return;
        }

        router.replace(loginUrl(area, `${currentRef.current.pathname}${window.location.search}`));
    }

    function logout(): Promise<boolean> {
        // 로그아웃 — 토큰 쿠키만 지운다. 로그인 상태를 바꾸면 로그인 가드가 먼저 로그인 화면으로 보내므로, 부른 화면이 문서를 새로 연다
        return deleteAreaTokens(area);
    }

    return (
        // 루트 — 진행 막대 · 화면 · 오류 팝업
        <>
            {/* 상단 진행 막대 */}
            <NextTopLoader color="var(--primary)" showSpinner={false} />

            {/* 화면 */}
            <div id="wrap">
                {/* 외부 스크립트 */}
                <Scripts />

                {/* 로그인 상태 Context — 화면 · 경로 모달 */}
                <RootLayoutProvider
                    rootLayoutLoading={!checked}
                    auth={{area, token, isLogin: Boolean(token), setToken: changeToken, onExpired: expire, logout}}
                >
                    {children}
                    {modal}
                </RootLayoutProvider>
            </div>

            {/* 오류 팝업 — 하나 */}
            <ErrorPopup />
        </>
    );
}
