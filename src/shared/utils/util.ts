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

/**
 * 숫자만 남기기 — 붙여 넣은 번호의 하이픈 · 공백을 빼고 max 자리까지
 *
 * @param value 입력한 글자
 * @param max 남길 자릿수
 */
export function digitsOnly(value: string, max: number): string {
    return value.replace(/\D/g, '').slice(0, max);
}

/**
 * 숫자 칸 값 → DTO 숫자 — 비었으면 undefined(IsNotEmpty 문구), 숫자가 아니면 NaN(IsInt 문구)
 *
 * @param value 칸 값
 */
export function numberOf(value: string): number | undefined {
    return value.trim() === '' ? undefined : Number(value);
}

/**
 * 목록 번호 — 검색 결과 기준으로 첫 쪽 맨 위가 총 개수, 마지막 쪽 맨 아래가 1(pagination.content_start_number 부터 한 줄씩 내려간다)
 * - 예: 한 쪽 10개 · 99개면 1쪽 99 ~ 90, 10쪽은 9 ~ 1
 *
 * @param pagination 목록 응답의 pagination — content_start_number
 * @param index 이 쪽에서의 줄 순서(0부터)
 */
export function listNumber(pagination: {content_start_number: number}, index: number): number {
    return pagination.content_start_number - index;
}
