'use client';
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { IsLoginContext, RootLayoutLoadingContext } from "@/shared/providers/RootLayoutProvider";
import Loading from "@/shared/components/Loading";

type AuthGuardProps = {
    loginPath?: string; // 로그인이 안 돼 있을 때 보낼 그 영역의 로그인 주소
    children: React.ReactNode;
}

/**
 * 로그인이 필요한 영역의 layout 에서 감싼다.
 * - 로그인 확인 중이거나 로그인이 안 돼 있으면 Loading 을 보여 주고, 로그인이 안 돼 있으면 loginPath 로 이동
 *
 * @param param0
 * @returns
 */
export default function AuthGuard({loginPath = '/login', children}: AuthGuardProps): React.ReactNode {
    const router = useRouter();
    const rootLayoutLoading: boolean = useContext(RootLayoutLoadingContext);
    const isLogin: boolean = useContext(IsLoginContext);

    // 로그인이 되어있지 않은 경우, 로그인 페이지로 이동
    useEffect(() => {
        if (!rootLayoutLoading && !isLogin) {
            router.push(loginPath);
        }
    }, [rootLayoutLoading, isLogin, loginPath, router]);

    if (rootLayoutLoading || !isLogin) {
        return <Loading />;
    }

    return <>{children}</>;
}
