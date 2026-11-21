'use client';
import { createContext } from 'react';

/** 이용자 영역 이동 — 이전 화면 버튼이 브라우저 뒤로를 써도 되는지(UserHistoryProvider 가 판단해 넘긴다) */
export type UserHistoryContextType = {
    canGoBack: boolean; // 브라우저 뒤로가 이 사이트 안의 화면 — 아니면 위 단계로
};

export const UserHistoryContext = createContext<UserHistoryContextType>({canGoBack: false});

/**
 * 브라우저 뒤로로 돌아가도 되는지 — 이 사이트 안에서 옮겨 왔거나, 처음 들어올 때의 직전 주소(referrer)가 같은 사이트면 된다
 * - 문자 링크 · 다른 사이트 · 새 탭으로 바로 들어온 화면이면 안 된다(뒤로가 사이트 밖이라 위 단계로 보낸다)
 *
 * @param moved 처음 들어온 화면에서 옮겼는지
 * @param referrer 처음 들어올 때의 document.referrer — 없으면 ''
 * @param origin 이 사이트 origin(window.location.origin)
 */
export function canGoHistoryBack(moved: boolean, referrer: string, origin: string): boolean {
    if (moved) {
        return true;
    }

    return URL.canParse(referrer) && new URL(referrer).origin === origin;
}
