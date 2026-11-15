'use client';

/** route handler(src/app/api/cookie/*) 응답 — 항상 200 + {success, data?} */
type RouteResultType<T> = {
    success: boolean;
    data?: T;
};

/**
 * 토큰 쿠키 route handler 부르기 — 실패(네트워크 · 2xx 아님 · JSON 아님)는 던지지 않고 null
 *
 * @param url route handler 주소 (/api/cookie/…)
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
 * 소셜 로그인 정보 얻기
 *
 * @returns
 */
export async function getSNSAccessToken(): Promise<any> {
    const result = await callCookieRoute<any>('/api/cookie/sns');
    return result?.success ? result.data : null;
}

/**
 * 소셜 로그인 정보 삭제
 *
 * @returns
 */
export async function deleteSNSAccessToken(): Promise<boolean> {
    const result = await callCookieRoute('/api/cookie/sns', 'DELETE');
    return result?.success === true;
}

/**
 * AccessToken 얻기
 *
 * @returns
 */
export async function getAccessToken(): Promise<string | null> {
    const result = await callCookieRoute<string>('/api/cookie/access');
    return result?.success ? result.data ?? null : null;
}

/**
 * AccessToken를 복호화해서 얻기
 *
 * @returns
 */
export async function getAccessTokenData(): Promise<any> {
    const result = await callCookieRoute<any>('/api/cookie/access?option=1');
    return result?.success ? result.data : null;
}

/**
 * AccessToken 존재여부 확인
 *
 * @returns
 */
export async function checkAuth(): Promise<boolean> {
    const result = await callCookieRoute('/api/cookie/access');
    return result?.success === true;
}

/**
 * RefreshToken 저장
 *
 * @param refreshToken
 * @param setTime
 * @return
 */
export async function setRefreshToken(refreshToken: string, setTime: string): Promise<boolean> {
    const result = await callCookieRoute('/api/cookie/refresh', 'POST', {setTime, data: refreshToken});
    return result?.success === true;
}

/**
 * AccessToken 저장
 *
 * @param accessToken
 * @param setTime
 * @returns
 */
export async function setAccessToken(accessToken: string, setTime: string): Promise<boolean> {
    const result = await callCookieRoute('/api/cookie/access', 'POST', {setTime, data: accessToken});
    return result?.success === true;
}

/**
 * 토큰 삭제
 *
 * @returns
 */
export async function deleteToken(): Promise<boolean> {
    const result = await callCookieRoute('/api/cookie/logout', 'POST', {});
    return result?.success === true;
}
