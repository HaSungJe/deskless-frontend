'use client';
import { createContext } from 'react';

/** 이용자 영역 이동 — 이 탭에서 처음 들어온 화면에서 다른 화면으로 옮겼는지(상단 바 이전 화면 버튼) */
export type UserHistoryContextType = {
    moved: boolean; // 처음 들어온 화면과 지금 화면이 다르다 — 브라우저 뒤로가 이 사이트 안의 화면
};

export const UserHistoryContext = createContext<UserHistoryContextType>({moved: false});

/**
 * 브라우저 뒤로로 돌아가도 되는지 — 이 사이트 안에서 옮겨 왔거나, 직전 주소(referrer)가 같은 사이트면 된다
 * - 문자 링크 · 다른 사이트 · 새 탭으로 바로 들어온 화면이면 안 된다(뒤로가 사이트 밖이라 위 단계로 보낸다)
 *
 * @param moved 처음 들어온 화면에서 옮겼는지(UserHistoryContext)
 * @param referrer document.referrer — 없으면 ''
 * @param origin 이 사이트 origin(window.location.origin)
 */
export function canGoHistoryBack(moved: boolean, referrer: string, origin: string): boolean {
    if (moved) {
        return true;
    }

    return URL.canParse(referrer) && new URL(referrer).origin === origin;
}
