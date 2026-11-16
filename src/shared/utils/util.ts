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

/**
 * query 값 하나 — 같은 이름이 여럿이면 첫 값, 없거나 빈 값이면 null (page 의 searchParams)
 *
 * @param value searchParams 의 값
 */
export function firstQueryValue(value: string | Array<string> | undefined): string | null {
    const first = Array.isArray(value) ? value[0] : value;
    return first ? first : null;
}
