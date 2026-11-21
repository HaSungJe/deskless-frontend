'use client';
import { useContext, useState } from 'react';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { AREA_LOGIN_PATH } from '@/shared/utils/area';
import { replaceDocument } from '@/shared/utils/base-path';
import { showErrorPopup } from '@/shared/utils/error-popup';

/** 토큰 쿠키를 지우지 못함 */
const LOGOUT_FAILED_MESSAGE = '로그아웃하지 못했어요. 잠시 뒤 다시 시도해 주세요.';

export type UseConsoleLogoutType = {
    loggingOut: boolean;         // 로그아웃 중 — 두 번 누름 막기
    logout: () => Promise<void>; // 로그아웃
};

/**
 * 콘솔 로그아웃(업체 관리자 · 관리자 콘솔 틀) — 그 영역 토큰 · 계정 쿠키만 지우고(로그아웃 API 없음) 그 영역 로그인 주소 문서를 새로 연다
 * - 매니저는 업체 로그인 주소 안내 → 기억한 업체 로그인(업체코드 쿠키는 남는다), 관리자는 관리자 로그인
 *
 * @returns
 */
export default function useConsoleLogout(): UseConsoleLogoutType {
    // 변수
    const auth = useContext(AuthContext); // 그 영역 토큰 · 로그아웃

    // 상태
    const [loggingOut, setLoggingOut] = useState<boolean>(false); // 로그아웃 중

    // 함수
    async function logout(): Promise<void> {
        // 쿠키 삭제 → 못 지우면 안내, 지우면 로그인 주소 문서를 새로 연다
        setLoggingOut(true);
        const deleted = await auth.logout();
        if (!deleted) {
            setLoggingOut(false);
            showErrorPopup(LOGOUT_FAILED_MESSAGE);
            return;
        }

        replaceDocument(AREA_LOGIN_PATH[auth.area]);
    }

    return {loggingOut, logout};
}
