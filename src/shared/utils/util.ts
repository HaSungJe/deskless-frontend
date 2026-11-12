/**
 * QueryString 만들기 — 키 · 값은 encodeURIComponent 로 바꾼다
 *
 * @param obj
 * @returns `?key=value&…` (값이 없으면 빈 문자열)
 */
export function createQueryString(obj: Record<string, unknown>): string {
    const query = Object.entries(obj)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');

    return query ? `?${query}` : '';
}
