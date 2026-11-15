'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useContext, useEffect } from 'react';
import Loading from '@/shared/components/Loading';
import { AuthContext, RootLayoutLoadingContext } from '@/shared/providers/RootLayoutProvider';
import { isLoginPath, loginUrl } from '@/shared/utils/area';

type AuthGuardProps = {
    children: React.ReactNode;
};

/**
 * 로그인이 필요한 영역의 layout 에서 감싼다 — 로그인이 안 돼 있으면 그 영역 로그인 화면으로(돌아올 주소와 함께)
 * - 그 영역 로그인 화면 자신은 막지 않는다(로그인 화면을 감싸도 갇히지 않게)
 *
 * @param param0
 * @returns
 */
export default function AuthGuard({children}: AuthGuardProps): React.ReactNode {
    // 변수
    const router = useRouter();                                       // 로그인 화면으로 보낼 때
    const pathname = usePathname();                                   // 돌아올 주소
    const rootLayoutLoading: boolean = useContext(RootLayoutLoadingContext); // 로그인 상태 확인 중인지
    const auth = useContext(AuthContext);                             // 지금 영역 로그인 상태

    // 계산 값
    const onLoginPage = isLoginPath(pathname, auth.area);             // 그 영역 로그인 화면인지 — 막지 않는다
    const blocked = !onLoginPage && (rootLayoutLoading || !auth.isLogin); // 내용을 아직 보여 주지 않을지

    // 효과
    useEffect(() => {
        // 확인이 끝났는데 로그인이 안 돼 있으면 그 영역 로그인 화면으로
        if (!onLoginPage && !rootLayoutLoading && !auth.isLogin) {
            router.replace(loginUrl(auth.area, `${pathname}${window.location.search}`));
        }
    }, [onLoginPage, rootLayoutLoading, auth.isLogin, auth.area, pathname, router]);

    if (blocked) {
        return (
            // 확인 중 · 로그인 화면으로 가는 중
            <Loading />
        );
    }

    return (
        // 로그인한 화면
        <>{children}</>
    );
}
