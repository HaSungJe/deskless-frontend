'use client';
import { createContext } from 'react';
import { AuthType } from '@/shared/api/auth';

/** 로그인 상태 — withAuth 에 넘기는 값 + 로그인 여부 · 로그아웃 */
export type AuthContextType = AuthType & {
    isLogin: boolean;               // 지금 영역에 로그인했는지
    logout: () => Promise<boolean>; // 지금 영역 토큰 쿠키를 지운다(지웠으면 true) — 로그인 상태는 그대로, 부른 화면이 replaceDocument 로 문서를 새로 연다
};

type RootLayoutProviderProps = {
    rootLayoutLoading: boolean;
    auth: AuthContextType;
    children: React.ReactNode;
};

export const RootLayoutLoadingContext = createContext<boolean>(false); // 로그인 상태 확인 중
export const AuthContext = createContext<AuthContextType>(null);       // 지금 영역의 로그인 상태

/**
 * 로그인 상태 Context — RootLayoutContent 가 채운다
 *
 * @param param0
 * @returns
 */
export default function RootLayoutProvider({rootLayoutLoading, auth, children}: RootLayoutProviderProps): React.ReactNode {
    return (
        // 확인 중 · 로그인 상태
        <RootLayoutLoadingContext.Provider value={rootLayoutLoading}>
            <AuthContext.Provider value={auth}>
                {children}
            </AuthContext.Provider>
        </RootLayoutLoadingContext.Provider>
    );
}
