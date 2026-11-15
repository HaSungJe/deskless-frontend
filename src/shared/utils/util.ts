/**
 * QueryString 만들기 — null · undefined · 빈 문자열은 빼고, 키 · 값은 encodeURIComponent 로 바꾼다
 *
 * @param obj
 * @returns `?key=value&…` (남는 값이 없으면 빈 문자열)
 */
export function createQueryString(obj: Record<string, unknown>): string {
    const query = Object.entries(obj)
        .filter(([, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');

    return query ? `?${query}` : '';
}
