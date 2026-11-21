'use client';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { canGoHistoryBack, UserHistoryContext } from './user-history';

type UserHistoryProviderProps = {
    children: React.ReactNode;
};

/** 처음 들어온 화면 — 주소 · 그때의 referrer · 이 사이트 origin */
type UserEntryType = {
    path: string;     // 처음 들어온 주소 — 여기서 브라우저 뒤로는 사이트 밖
    referrer: string; // 처음 들어올 때의 document.referrer(서버에서는 '')
    origin: string;   // 이 사이트 origin(서버에서는 '')
};

/**
 * 이용자 이동 Context — 이용자 틀(layout)에서 한 번만 referrer · 이동을 보고, 상단 바 이전 화면 버튼이 쓸 canGoBack 을 넘긴다
 * - referrer 는 처음 들어올 때 한 번만 읽는다(이 사이트 안 화면 이동은 주소가 바뀌어 moved 로 안다)
 * - 서버 그리기에서는 document 가 없어 false — 버튼 모양은 같고 누를 때만 쓰는 값이라 화면이 어긋나지 않는다
 *
 * @param param0
 * @returns
 */
export default function UserHistoryProvider({children}: UserHistoryProviderProps): React.ReactNode {
    // 변수
    const pathname = usePathname(); // 지금 주소

    // 상태
    const [entry] = useState<UserEntryType>(() => ({
        path: pathname,
        referrer: typeof document === 'undefined' ? '' : document.referrer,
        origin: typeof window === 'undefined' ? '' : window.location.origin,
    })); // 처음 들어온 화면 — 한 번만

    // 계산 값
    const canGoBack = canGoHistoryBack(pathname !== entry.path, entry.referrer, entry.origin); // 브라우저 뒤로가 이 사이트 안인지

    return (
        // 이동 Context
        <UserHistoryContext.Provider value={{canGoBack}}>
            {children}
        </UserHistoryContext.Provider>
    );
}
