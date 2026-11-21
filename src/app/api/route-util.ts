import { NETWORK_ERROR_MESSAGE } from '@/shared/api/error';
import { ApiError } from '@/shared/api/request';
import { ValidationErrorType } from '@/shared/utils/validation';

/** 같은 사이트 JSON 이 아닌 요청 — 가입 · 매니저 · 관리자 로그인 route */
export const INVALID_REQUEST_MESSAGE = '잘못된 요청입니다.';

/** route handler 응답 본문 — 항상 200 */
export type RouteBodyType = {
    success: boolean;
    data?: unknown;
    retry?: boolean;                                       // 일시 실패 — 쿠키 · 결제를 그대로 두고 다시 시도
    message?: string;                                      // 화면에 보일 실패 문구
    code?: string;                                         // 외부 오류 코드(토스) · 화면이 갈래를 나눌 코드(NO_SNS)
    validation_errors?: Array<ValidationErrorType> | null; // 백엔드 칸 오류 그대로(가입 · 매니저 · 관리자 로그인)
    block_comment?: string | null;                         // 정지 계정 로그인 — 정지 사유(매니저 · 관리자 로그인)
};

/** 로그인 처리 route 의 백엔드 로그인 — 되면 보낸 DTO · 백엔드 결과, 안 되면 route 가 그대로 돌려줄 응답 */
export type BackendLoginType<D, R> = {dto: D; result: R} | {response: Response};

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

/**
 * 로그인 처리 route 공통(매니저 · 관리자) — ① 같은 사이트 JSON 만 ② 본문 → DTO → 백엔드 로그인(동기)
 * - 백엔드 4xx 는 message · validation_errors · block_comment 그대로, 네트워크 · 5xx 는 retry — 어느 쪽이든 쿠키는 쓰지 않는다
 * - 서버가 부르므로 로그인 IP 와 재발급 IP 가 같다(docs/data-layer.md "⚠️ 백엔드 재발급")
 *
 * @param request 요청
 * @param toDto 본문 → 로그인 DTO(글자가 아닌 값은 textOf 로 빈 글자 — 백엔드 검증이 칸 오류로 돌려준다)
 * @param login 백엔드 로그인(contracts 의 서버용 함수)
 * @param tag 로그 머리('manager-login' · 'admin-login')
 */
export async function backendLogin<D, R>(request: Request, toDto: (form: Record<string, unknown> | null) => D, login: (dto: D) => Promise<R | null>, tag: string): Promise<BackendLoginType<D, R>> {
    if (!isSameSiteJson(request)) {
        return {response: json({success: false, message: INVALID_REQUEST_MESSAGE})};
    }

    const form = (await request.json().catch((): null => null)) as Record<string, unknown> | null;
    const dto = toDto(form);
    let result: R | null = null;
    try {
        result = await login(dto);
    } catch (error) {
        if (error instanceof ApiError && error.status < 500) {
            const blockComment = typeof error.body.block_comment === 'string' ? error.body.block_comment : null;
            return {response: json({success: false, message: error.body.message, validation_errors: error.body.validation_errors, block_comment: blockComment})};
        }

        console.log(`[${tag}] 로그인 결과를 받지 못함 —`, error instanceof Error ? error.message : error);
    }

    return result ? {dto, result} : {response: json({success: false, message: NETWORK_ERROR_MESSAGE, retry: true})};
}

/**
 * 본문 값 → 글자(아니면 빈 글자 — 백엔드 검증이 칸 오류로 돌려준다) — 가입 · 로그인 route
 *
 * @param value 본문 값
 */
export function textOf(value: unknown): string {
    return typeof value === 'string' ? value : '';
}
