'use client';
import { createContext, useContext, useEffect, useEffectEvent, useState } from 'react';
import { getMe } from '@/contracts/user/api';
import { UserMeResultDto } from '@/contracts/user/dto/user-me.dto';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';

export type UserMeContextType = {
    me: UserMeResultDto | null;                      // 내 정보 — 로그인 안 했거나 못 읽었으면 null
    reloadMe: () => Promise<UserMeResultDto | null>; // 다시 읽기(휴대폰 인증 · 탈퇴 신청 뒤) — 못 읽으면 null(이전 값은 그대로)
};

type UserMeProviderProps = {
    children: React.ReactNode;
};

export const UserMeContext = createContext<UserMeContextType>({me: null, reloadMe: async () => null});

/**
 * 내 정보 — 로그인했으면 user/me 를 읽어 이용자 화면들에 나눠 준다(앱을 열 때 · 로그인 상태가 바뀔 때)
 * - 실패는 조용히(me null) — 화면이 필요하면 reloadMe
 *
 * @param param0
 * @returns
 */
export default function UserMeProvider({children}: UserMeProviderProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);             // 이용자 로그인 상태
    const loadMe = useEffectEvent(() => getMe(auth)); // 그때의 auth 로 내 정보 읽기(효과를 다시 걸지 않는다)

    // 상태
    const [loadedMe, setLoadedMe] = useState<UserMeResultDto | null>(null); // 마지막으로 읽은 내 정보

    // 계산 값
    const me = auth.isLogin ? loadedMe : null; // 로그아웃하면 바로 null

    // 효과
    useEffect(() => {
        // 로그인하면 내 정보를 읽는다(사라지면 결과를 버린다)
        if (!auth.isLogin) {
            return;
        }

        let active = true;
        loadMe().then((next) => {
            if (active) {
                setLoadedMe(next);
            }
        }).catch(() => {
            if (active) {
                setLoadedMe(null);
            }
        });

        return () => {
            active = false;
        };
    }, [auth.isLogin]);

    // 함수
    async function reloadMe(): Promise<UserMeResultDto | null> {
        // 다시 읽기 — 못 읽으면 이미 읽은 내 정보는 두고 null(화면 · 회원 상태 띠가 사라지지 않게)
        const next = await getMe(auth).catch((): null => null);
        if (next) {
            setLoadedMe(next);
        }

        return next;
    }

    return (
        // 내 정보 Context
        <UserMeContext.Provider value={{me, reloadMe}}>{children}</UserMeContext.Provider>
    );
}
