import { createQueryString } from '@/shared/utils/util';
import { ValidationErrorType } from '@/shared/utils/validation';

/** 게이트웨이 API 주소 — `${NEXT_PUBLIC_API_URL}/api/v1` (로컬 http://localhost:3000, 내부 3010 · 3020 은 부르지 않는다) */
export const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1`;

/** 실패 본문을 읽지 못했을 때(JSON 이 아님) 보여 줄 문구 */
export const UNREADABLE_FAIL_MESSAGE = '서버 응답을 읽을 수 없습니다.';

/**
 * 실패 본문 — 동기 응답 본문 · 큐 failed data 가 같은 모양
 * - contracts/common/fail-result.dto.ts 의 ApiFailResultDto 와 같은 구조 (shared 는 contracts 를 가져오지 않는다)
 */
export type ApiFailBodyType = {
    message: string;
    validation_errors: Array<ValidationErrorType> | null;
    [key: string]: unknown; // 기능별 추가 필드 — block_comment · payment_error_code · status_code …
};

/** HTTP 메서드 */
export type HttpMethodType = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** 동기 요청 옵션 */
export type RequestOptionsType = {
    method?: HttpMethodType;         // 기본 GET
    path: string;                    // /api/v1 뒤 — '/user-service/discovery/stores'
    query?: Record<string, unknown>; // query 문자열 — null · undefined · 빈 문자열은 뺀다
    body?: unknown;                  // JSON 본문 (GET 이 아닐 때)
    token?: string | null;           // 로그인 토큰 — Authorization: Bearer
    signal?: AbortSignal;            // 화면을 떠날 때 취소
};

/**
 * API 실패 — 상태 코드와 실패 본문. 화면은 catch 에서 handleApiError(error) 로 넘긴다
 */
export class ApiError extends Error {
    status: number;
    body: ApiFailBodyType;

    /**
     * @param status HTTP 상태 코드 (큐 failed 는 data 의 status_code)
     * @param body 실패 본문
     */
    constructor(status: number, body: ApiFailBodyType) {
        super(body.message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

/**
 * 응답 없는 실패 — 네트워크 끊김 · 서버 꺼짐 · 큐 스트림 끊김. 원래 오류는 cause
 */
export class NetworkError extends Error {
    /**
     * @param cause fetch · 스트림이 던진 오류
     */
    constructor(cause: unknown) {
        super('network error', {cause});
        this.name = 'NetworkError';
    }
}

/**
 * 화면이 스스로 취소한 요청인지 — fetch 는 AbortError(DOMException)를 던진다
 *
 * @param error catch 로 받은 값
 */
export function isAbortError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as {name?: unknown}).name === 'AbortError';
}

/**
 * fetch · 스트림 오류 맞추기 — 취소는 그대로, 그 밖은 NetworkError
 *
 * @param error fetch · reader.read 가 던진 오류
 */
export function asNetworkError(error: unknown): unknown {
    return isAbortError(error) ? error : new NetworkError(error);
}

/**
 * fetch — 응답 없는 실패는 NetworkError, 취소는 그대로 던진다
 *
 * @param url 주소
 * @param init fetch 옵션
 */
export async function sendRequest(url: string, init: RequestInit): Promise<Response> {
    try {
        return await fetch(url, init);
    } catch (error) {
        throw asNetworkError(error);
    }
}

/**
 * 요청 주소 — API_BASE_URL + path + query
 *
 * @param path /api/v1 뒤 경로 ('/' 로 시작). 경로 값은 부르는 쪽이 encodeURIComponent 한다
 * @param query query 값
 */
export function buildUrl(path: string, query?: Record<string, unknown>): string {
    return `${API_BASE_URL}${path}${query ? createQueryString(query) : ''}`;
}

/**
 * 요청 헤더 — 받을 형식 · JSON 본문 · 토큰
 *
 * @param token 로그인 토큰 (없으면 Authorization 을 붙이지 않는다)
 * @param hasBody JSON 본문이 있는지
 * @param accept 받을 형식 (큐는 text/event-stream)
 */
export function buildHeaders(token: string | null | undefined, hasBody: boolean, accept: string = 'application/json'): Record<string, string> {
    const headers: Record<string, string> = {Accept: accept};
    if (hasBody) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

/**
 * JSON 문자열 읽기 — 비었거나 JSON 이 아니면 undefined
 *
 * @param text 응답 본문 · 이벤트 data
 */
export function parseJson(text: string): unknown {
    if (!text) {
        return undefined;
    }

    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
}

/**
 * 실패 본문 맞추기 — message 가 없으면(JSON 이 아님 · 비었음) UNREADABLE_FAIL_MESSAGE
 *
 * @param data 읽은 실패 본문 · 큐 failed data
 */
export function toFailBody(data: unknown): ApiFailBodyType {
    if (data && typeof data === 'object' && typeof (data as {message?: unknown}).message === 'string') {
        const body = data as ApiFailBodyType;
        return {...body, validation_errors: body.validation_errors ?? null};
    }

    return {message: UNREADABLE_FAIL_MESSAGE, validation_errors: null};
}

/**
 * 동기 API 호출 — 조회 · 로그인 · 재발급 · 업로드 주소 발급
 * - 2xx 는 JSON 본문(빈 본문 · 204 는 null), 그 밖은 ApiError(status, 실패 본문)
 * - 응답 없는 실패는 NetworkError, 취소는 AbortError 그대로
 *
 * @param options 메서드 · 경로 · query · 본문 · 토큰 · 취소 신호
 */
export async function request<T>({method = 'GET', path, query, body, token, signal}: RequestOptionsType): Promise<T | null> {
    const hasBody = body !== undefined && method !== 'GET';
    const response = await sendRequest(buildUrl(path, query), {
        method,
        headers: buildHeaders(token, hasBody),
        body: hasBody ? JSON.stringify(body) : undefined,
        signal,
    });

    const text = await response.text().catch((error: unknown) => {
        throw asNetworkError(error);
    });
    if (!response.ok) {
        throw new ApiError(response.status, toFailBody(parseJson(text)));
    }

    if (!text) {
        return null;
    }

    const data = parseJson(text);
    if (data === undefined) {
        throw new ApiError(response.status, toFailBody(undefined));
    }

    return data as T;
}
