/** route handler 응답 본문 — 항상 200 */
export type RouteBodyType = {
    success: boolean;
    data?: unknown;
    retry?: boolean;  // 일시 실패 — 쿠키 · 결제를 그대로 두고 다시 시도
    message?: string; // 화면에 보일 실패 문구(결제 승인)
    code?: string;    // 외부 오류 코드(토스)
};

/**
 * route handler 응답 — 항상 200 + JSON
 *
 * @param body 응답 본문
 */
export function json(body: RouteBodyType): Response {
    return new Response(JSON.stringify(body), {headers: {'Content-Type': 'application/json'}});
}

/**
 * 같은 사이트의 JSON 요청인지 — 다른 사이트 form 이 토큰을 심거나 결제 승인을 부르는 것(CSRF) 막기
 *
 * @param request route handler 요청
 */
export function isSameSiteJson(request: Request): boolean {
    const contentType = request.headers.get('content-type') ?? '';
    const fetchSite = request.headers.get('sec-fetch-site');
    return contentType.includes('application/json') && (fetchSite === null || fetchSite === 'same-origin');
}
