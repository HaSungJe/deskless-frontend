'use client';
import { NetworkError, sendRequest } from '@/shared/api/request';
import { AreaType } from '@/shared/utils/area';
import { withBasePath } from '@/shared/utils/base-path';

/** route handler(src/app/api/cookie/*) 응답 — 항상 200 + {success, data?} */
type RouteResultType<T> = {
    success: boolean;
    data?: T;
};

/** 로그인 결과 토큰 — 영역마다 같은 모양(…LoginResultDto 의 앞 4개) */
export type AreaTokensType = {
    access_token: string;
    refresh_token: string;
    access_token_expires_at: string;
    refresh_token_expires_at: string;
};

/** 영역별 진행 중인 재발급 — 동시에 걸리면 하나를 나눈다 */
const refreshing = new Map<AreaType, Promise<string | null>>();

/**
 * 토큰 쿠키 route handler 부르기 — 실패(네트워크 · 2xx 아님 · JSON 아님)는 던지지 않고 null
 *
 * @param url route handler 주소 (/api/cookie/…/)
 * @param method HTTP 메서드
 * @param body JSON 본문
 */
async function callCookieRoute<T>(url: string, method: string = 'GET', body?: unknown): Promise<RouteResultType<T> | null> {
    try {
        const hasBody = body !== undefined;
        const response = await fetch(url, {
            method,
            headers: hasBody ? {'Content-Type': 'application/json'} : undefined,
            body: hasBody ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            return null;
        }

        return (await response.json()) as RouteResultType<T>;
    } catch {
        return null;
    }
}

/**
 * 그 영역 access 토큰 — 없거나 곧 만료면 route handler 가 refresh 쿠키로 재발급한다
 *
 * @param area 영역
 * @returns 로그인 안 돼 있으면 null
 */
export async function getAreaToken(area: AreaType): Promise<string | null> {
    const result = await callCookieRoute<string>(withBasePath(`/api/cookie/${area}/`));
    return result?.success ? result.data ?? null : null;
}

/**
 * 로그인 결과 토큰 저장 — 로그인 화면(Phase 5 · 10 · 15)이 부른다
 *
 * @param area 영역
 * @param tokens 로그인 결과의 토큰 4개
 */
export async function saveAreaTokens(area: AreaType, tokens: AreaTokensType): Promise<boolean> {
    const result = await callCookieRoute(withBasePath(`/api/cookie/${area}/`), 'POST', tokens);
    return result?.success === true;
}

/**
 * 그 영역 토큰 삭제 — 로그아웃(로그아웃 API 는 없다)
 *
 * @param area 영역
 */
export async function deleteAreaTokens(area: AreaType): Promise<boolean> {
    const result = await callCookieRoute(withBasePath(`/api/cookie/${area}/`), 'DELETE');
    return result?.success === true;
}

/**
 * 그 영역 재발급 — 401 뒤. 같은 영역이 동시에 부르면 하나를 나눈다
 * - 로그인이 끝났으면 null, 일시 실패(네트워크 · 백엔드 5xx — route handler 의 retry)면 NetworkError 를 던진다(로그아웃하지 않게)
 *
 * @param area 영역
 * @returns 새 access 토큰, 로그인이 끝났으면 null
 */
export function refreshAreaToken(area: AreaType): Promise<string | null> {
    const running = refreshing.get(area);
    if (running) {
        return running;
    }

    const next = requestRefresh(area).finally(() => {
        refreshing.delete(area);
    });

    refreshing.set(area, next);
    return next;
}

/**
 * 재발급 route handler 부르기 — 응답을 못 받거나 retry 면 NetworkError
 *
 * @param area 영역
 */
async function requestRefresh(area: AreaType): Promise<string | null> {
    const response = await sendRequest(withBasePath(`/api/cookie/${area}/refresh/`), {method: 'POST'});
    if (!response.ok) {
        throw new NetworkError(new Error(`refresh route ${response.status}`));
    }

    const result = (await response.json().catch((): null => null)) as (RouteResultType<string> & {retry?: boolean}) | null;
    if (!result || result.retry) {
        throw new NetworkError(new Error('refresh retry'));
    }

    return result.success ? result.data ?? null : null;
}
