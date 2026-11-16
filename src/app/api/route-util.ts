import { ValidationErrorType } from '@/shared/utils/validation';

/** route handler 응답 본문 — 항상 200 */
export type RouteBodyType = {
    success: boolean;
    data?: unknown;
    retry?: boolean;                                       // 일시 실패 — 쿠키 · 결제를 그대로 두고 다시 시도
    message?: string;                                      // 화면에 보일 실패 문구
    code?: string;                                         // 외부 오류 코드(토스) · 화면이 갈래를 나눌 코드(NO_SNS)
    validation_errors?: Array<ValidationErrorType> | null; // 백엔드 칸 오류 그대로(가입)
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
 * 같은 사이트의 JSON 요청인지 — 다른 사이트 form 이 토큰을 심거나 결제 승인 · 가입을 부르는 것(CSRF) 막기
 *
 * @param request route handler 요청
 */
export function isSameSiteJson(request: Request): boolean {
    const mimeType = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase(); // 'text/plain; application/json' 같은 단순 요청을 JSON 으로 보지 않게 앞쪽만
    const fetchSite = request.headers.get('sec-fetch-site');
    return mimeType === 'application/json' && (fetchSite === null || fetchSite === 'same-origin');
}
