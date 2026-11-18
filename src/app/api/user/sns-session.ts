import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/** 백엔드가 받는 SNS 계정 — UserLoginDto · UserSignDto 의 sns_id · sns_user_id */
export type SnsAccountType = {
    sns_id: 'KAKAO' | 'NAVER'; // SNS 유형
    sns_user_id: string;       // SNS 회원 번호
};

type CookieStoreType = Awaited<ReturnType<typeof cookies>>;

/** SNS 세션이 없음(만료 · 직접 들어옴) — 가입 화면이 로그인으로 돌린다 */
export const NO_SNS_CODE = 'NO_SNS';

/** next-auth 공급자 → 백엔드 SNS 유형 — 백엔드는 카카오 · 네이버만(Map 이라 'constructor' 같은 상속 이름에 속지 않는다) */
const SNS_PROVIDERS = new Map<string, SnsAccountType['sns_id']>([['kakao', 'KAKAO'], ['naver', 'NAVER']]);

/**
 * next-auth 공급자 · 계정 ID → 백엔드 SNS 계정 — 카카오 · 네이버이고 계정 ID 가 있을 때만
 * - 백엔드는 이 ID 를 다시 확인하지 않고 믿는다 — 빈 값 · 다른 공급자는 로그인시키지 않는다
 *
 * @param provider next-auth 공급자 id
 * @param providerAccountId 공급자의 회원 번호
 */
export function toSnsAccount(provider: string, providerAccountId: string | null | undefined): SnsAccountType | null {
    const sns_id = SNS_PROVIDERS.get(provider);
    return sns_id && providerAccountId ? {sns_id, sns_user_id: providerAccountId} : null;
}

/**
 * 요청의 next-auth 세션에서 SNS 계정 읽기 — 없거나 만료 · 모양이 다르면 null
 *
 * @param request route handler 요청
 */
export async function readSnsAccount(request: NextRequest): Promise<SnsAccountType | null> {
    const token = await getToken({req: request, secret: process.env.NEXTAUTH_SECRET});
    const sns_id = token?.sns_id;
    const sns_user_id = token?.sns_user_id;
    if ((sns_id === 'KAKAO' || sns_id === 'NAVER') && typeof sns_user_id === 'string' && sns_user_id) {
        return {sns_id, sns_user_id};
    }

    return null;
}

/**
 * next-auth 쿠키 모두 지우기 — 로그인 · 가입을 마치면 SNS 세션을 남기지 않는다
 * - https 에서 next-auth 쿠키 이름은 `__Secure-` · `__Host-` 로 시작 — 브라우저는 Secure 없이 온 같은 이름 쿠키를 받지 않아 secure 를 붙여 지운다
 *
 * @param cookieStore cookies()
 */
export function clearSnsSession(cookieStore: CookieStoreType): void {
    for (const cookie of cookieStore.getAll()) {
        if (cookie.name.includes('next-auth')) {
            cookieStore.delete({name: cookie.name, path: '/', secure: cookie.name.startsWith('__Secure-') || cookie.name.startsWith('__Host-')});
        }
    }
}
