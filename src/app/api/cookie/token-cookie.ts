import { cookies, headers as nextHeaders } from 'next/headers';
import { refreshAdminToken } from '@/contracts/admin/api';
import { refreshManagerToken } from '@/contracts/manager/api';
import { refreshUserToken } from '@/contracts/user/api';
import { ApiError } from '@/shared/api/request';
import { AREAS, AreaType } from '@/shared/utils/area';

/** 토큰 4개 — 로그인 결과 · 재발급 결과(영역마다 같은 모양) */
export type TokenSetType = {
    access_token: string;
    refresh_token: string;
    access_token_expires_at: string;
    refresh_token_expires_at: string;
};

/** 재발급 API 결과 — ok: 새 토큰 / invalid: 로그인이 끝남 / retry: 일시 실패 */
export type RefreshResultType = {state: 'ok'; tokens: TokenSetType} | {state: 'invalid'} | {state: 'retry'};

/** 재발급 후 쿠키에 저장한 결과 */
export type StoredRefreshType = {state: 'ok'; accessToken: string} | {state: 'invalid'} | {state: 'retry'};

type CookieStoreType = Awaited<ReturnType<typeof cookies>>;

/** access 쿠키를 실제 만료보다 먼저 끝내는 시간 — 그 전에 GET 이 재발급하게 */
export const ACCESS_EARLY_EXPIRE_MS = 60 * 1000;

/** 영역별 재발급 API */
const REFRESHERS: Record<AreaType, (refreshToken: string) => Promise<TokenSetType | null>> = {
    user: (refresh_token) => refreshUserToken({refresh_token}),
    manager: (refresh_token) => refreshManagerToken({refresh_token}),
    admin: (refresh_token) => refreshAdminToken({refresh_token}),
};

/**
 * 주소의 영역 값 확인 — user · manager · admin 이 아니면 null
 *
 * @param value [area] 값
 */
export function toArea(value: string): AreaType | null {
    return (AREAS as Array<string>).includes(value) ? (value as AreaType) : null;
}

/**
 * access 토큰 쿠키 이름 — user_access_token
 *
 * @param area 영역
 */
export function accessCookieName(area: AreaType): string {
    return `${area}_access_token`;
}

/**
 * refresh 토큰 쿠키 이름 — user_refresh_token
 *
 * @param area 영역
 */
export function refreshCookieName(area: AreaType): string {
    return `${area}_refresh_token`;
}

/**
 * route handler 응답 — 항상 200 + {success, data?}
 *
 * @param body 응답 본문
 */
export function json(body: {success: boolean; data?: unknown; retry?: boolean}): Response {
    return new Response(JSON.stringify(body), {headers: {'Content-Type': 'application/json'}});
}

/**
 * 쿠키 옵션 — httpOnly · path / · SERVER_DOMAIN · https 면 secure
 *
 * @param expires 만료 시각
 */
async function cookieOptions(expires: Date): Promise<Parameters<CookieStoreType['set']>[2]> {
    const headerList = await nextHeaders();
    const isSecure = (headerList.get('x-forwarded-proto') || 'http') === 'https';

    return {
        path: '/',
        domain: process.env.SERVER_DOMAIN || undefined,
        httpOnly: true,
        sameSite: process.env.SERVER_DOMAIN ? 'lax' : 'strict',
        secure: process.env.NODE_ENV === 'development' ? false : isSecure,
        expires,
    };
}

/**
 * 토큰 쿠키 저장 — access 는 만료 60초 전에 끝나게
 *
 * @param cookieStore cookies()
 * @param area 영역
 * @param tokens 로그인 · 재발급 결과
 */
export async function setTokenCookies(cookieStore: CookieStoreType, area: AreaType, tokens: TokenSetType): Promise<void> {
    const accessExpires = new Date(new Date(tokens.access_token_expires_at).getTime() - ACCESS_EARLY_EXPIRE_MS);
    cookieStore.set(accessCookieName(area), tokens.access_token, await cookieOptions(accessExpires));
    cookieStore.set(refreshCookieName(area), tokens.refresh_token, await cookieOptions(new Date(tokens.refresh_token_expires_at)));
}

/**
 * 토큰 쿠키 삭제 — 그 영역 두 쿠키만(다른 영역 로그인은 그대로)
 *
 * @param cookieStore cookies()
 * @param area 영역
 */
export async function clearTokenCookies(cookieStore: CookieStoreType, area: AreaType): Promise<void> {
    const options = {...(await cookieOptions(new Date(0))), maxAge: 0};
    cookieStore.set(accessCookieName(area), '', options);
    cookieStore.set(refreshCookieName(area), '', options);
}

/**
 * 그 영역 재발급 API
 * - ok: 새 토큰 / invalid: 로그인이 끝남(4xx — 쿠키를 지운다) / retry: 일시 실패(네트워크 · 5xx — 쿠키를 둔다)
 *
 * @param area 영역
 * @param refreshToken refresh 토큰
 */
export async function refreshTokens(area: AreaType, refreshToken: string): Promise<RefreshResultType> {
    try {
        const tokens = await REFRESHERS[area](refreshToken);
        return tokens ? {state: 'ok', tokens} : {state: 'invalid'};
    } catch (error) {
        console.log(`[token] ${area} 재발급 실패 —`, error instanceof Error ? error.message : error);
        return error instanceof ApiError && error.status < 500 ? {state: 'invalid'} : {state: 'retry'};
    }
}

/**
 * refresh 쿠키로 재발급 → 두 쿠키 새로 저장 → 새 access
 * - 로그인이 끝났으면(invalid) 두 쿠키를 지우고, 일시 실패(retry)면 쿠키를 그대로 둔다
 *
 * @param cookieStore cookies()
 * @param area 영역
 */
export async function refreshAndStore(cookieStore: CookieStoreType, area: AreaType): Promise<StoredRefreshType> {
    const refreshToken = cookieStore.get(refreshCookieName(area))?.value;
    if (!refreshToken) {
        return {state: 'invalid'};
    }

    const result = await refreshTokens(area, refreshToken);
    if (result.state === 'retry') {
        return result;
    }

    if (result.state === 'invalid') {
        await clearTokenCookies(cookieStore, area);
        return result;
    }

    await setTokenCookies(cookieStore, area, result.tokens);
    return {state: 'ok', accessToken: result.tokens.access_token};
}

/**
 * 재발급 결과를 route handler 응답으로 — ok: {success, data}, invalid: {success: false}, retry: {success: false, retry: true}
 *
 * @param result refreshAndStore 결과
 */
export function refreshResponse(result: StoredRefreshType): Response {
    if (result.state === 'ok') {
        return json({success: true, data: result.accessToken});
    }

    return result.state === 'retry' ? json({success: false, retry: true}) : json({success: false});
}

/**
 * 토큰 저장 요청이 같은 사이트의 JSON 요청인지 — 다른 사이트 form 이 토큰을 심는 것(login CSRF) 막기
 *
 * @param request route handler 요청
 */
export function isSameSiteJson(request: Request): boolean {
    const contentType = request.headers.get('content-type') ?? '';
    const fetchSite = request.headers.get('sec-fetch-site');
    return contentType.includes('application/json') && (fetchSite === null || fetchSite === 'same-origin');
}

/**
 * 토큰 4개가 다 있고 만료 시각을 읽을 수 있는지
 *
 * @param tokens 요청 본문
 */
export function isTokenSet(tokens: Partial<TokenSetType> | null): tokens is TokenSetType {
    return Boolean(tokens?.access_token && tokens?.refresh_token)
        && !Number.isNaN(new Date(tokens.access_token_expires_at).getTime())
        && !Number.isNaN(new Date(tokens.refresh_token_expires_at).getTime());
}
