# Plan — API 기반 (Phase 2)

## Feature Summary
- **Feature**: 지침서 호출 방식(동기 JSON · 큐 SSE · 실패 본문)을 fetch 클라이언트로, 공통 계약 사본과 표시 형식 유틸을 코드로
- **Entry point**: `MODULE src/shared/api/{request,queue,sse,error}.ts · src/contracts/common/* · src/shared/utils/format.ts · src/shared/components/ui/nav/Pagination.tsx`
- **Domain**: api
- **Spec**: `.beaver/output/spec/api/api-foundation-spec.md` · roadmap Phase 2 (#3 백엔드 호출 클라이언트, #4 공통 계약, #5 표시 형식 유틸) · direct 모드(`main`)
- **규칙**: AGENTS.md — import 방향 `app → contracts → shared`, 컴포넌트 본문 구조(변수 > 상태 > 계산 값 > 효과 > 함수 > JSX · 주석), export 함수 한국어 JSDoc, 4칸 · 세미콜론, 공통 부품은 `ui/<종류>/` · css 는 `shared/css/` 같은 경로.

---

## File List

| File | Action |
|------|------|
| `src/shared/api/request.ts` | new — `request` · `ApiError` · `API_BASE_URL` · 주소 · 헤더 · 실패 본문 도우미 |
| `src/shared/api/sse.ts` | new — `takeSseEvents` |
| `src/shared/api/queue.ts` | new — `callQueue` |
| `src/shared/api/error.ts` | new — `handleApiError` · `NETWORK_ERROR_MESSAGE` |
| `src/shared/api/request.test.ts` · `sse.test.ts` · `queue.test.ts` · `error.test.ts` | new |
| `src/shared/api/axios.ts` | **deleted** — 호출처 0, fetch 로 통일 |
| `src/shared/api/axios-error.ts` | **deleted** — axios 제거(사용자 요청 2026-11-15) |
| `src/shared/api/cookie.ts` | modified — axios → fetch(`callCookieRoute`), 실패는 그대로 `null` · `false` |
| `src/app/api/cookie/access/route.ts` | modified — 재발급 `axios.post` → `fetch` |
| `src/app/(user)/login/LoginContent.tsx` | modified — `request` · `handleApiError`, 구조 규칙 |
| `package.json` · `package-lock.json` | modified — axios 제거 |
| `src/shared/utils/util.ts` | modified — `createQueryString` 빈 값 빼기 |
| `src/shared/utils/util.test.ts` | new |
| `src/shared/utils/format.ts` | new — `toKst` · `todayKst` · `formatPrice` · `daysToBits` · `bitsToDays` · `formatDays` |
| `src/contracts/common/pagination.dto.ts` · `fail-result.dto.ts` · `roles.ts` · `sse.ts` · `reservation.constants.ts` | new — 지침서 `frontend/dto/common.md` 사본 그대로 |
| `src/contracts/common/lookup.ts` | new — `LOOKUP` · `lookupName` (지침서 "룩업 값" 표) |
| `src/shared/types/pagination.ts` | modified — snake_case |
| `src/shared/components/Pagination.tsx` → `src/shared/components/ui/nav/Pagination.tsx` | moved + rewritten — 시안 `.pager` 모양 · snake_case · 구조 규칙 |
| `src/shared/components/Pagination.test.tsx` → `src/shared/components/ui/nav/Pagination.test.tsx` | moved + rewritten |
| `src/shared/css/ui/nav/Pagination.module.css` | new |
| `src/app/dev/ui/UiPreviewContent.tsx` | modified — 페이지 탭 미리보기 |
| `AGENTS.md` · `docs/data-layer.md` · `docs/error-handling.md` · `docs/architecture.md` · `docs/conventions.md` · `docs/testing.md` | modified — 새 호출 방식 · 실패 처리 · 형식 유틸 · 페이지 탭(초안 표시) |

---

## Design

### 호출 클라이언트 — 동기 (#3)

주소 · 헤더 · 실패 본문을 `request` 와 `callQueue` 가 같이 쓴다. `shared` 는 `contracts` 를 가져오지 않으므로 실패 본문은 `contracts/common/fail-result.dto.ts` 의 `ApiFailResultDto` 와 구조만 같은 타입으로 둔다. 401 은 던지기만 한다(재발급은 Phase 3 이 감싼다).

```ts
// src/shared/api/request.ts
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
 * - 네트워크 실패 · 취소는 fetch 의 오류(TypeError · AbortError)를 그대로 던진다
 *
 * @param options 메서드 · 경로 · query · 본문 · 토큰 · 취소 신호
 */
export async function request<T>({method = 'GET', path, query, body, token, signal}: RequestOptionsType): Promise<T | null> {
    const hasBody = body !== undefined && method !== 'GET';
    const response = await fetch(buildUrl(path, query), {
        method,
        headers: buildHeaders(token, hasBody),
        body: hasBody ? JSON.stringify(body) : undefined,
        signal,
    });

    const text = await response.text();
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
```

### 호출 클라이언트 — 큐(SSE) (#3)

지침서 `callQueue`(frontend/api.md:28-55)와 같은 흐름을 옵션 객체로 받는다. 결과는 지침서 그대로 `done` → data, `pending` → `null`(사용자 결정). 이벤트 자르기는 순수 함수 `takeSseEvents` 로 떼어 테스트한다. 끝난 줄이 `\r` 로 잘린 채 오면 다음 조각의 `\n` 과 합쳐 경계로 잘못 보지 않게 그 `\r` 은 꼬리에 남긴다.

```ts
// src/shared/api/sse.ts
/** SSE 이벤트 하나 */
export type SseEventType = {
    event: string; // 이벤트 이름 — event: 줄 (없으면 'message')
    data: string;  // data: 줄들을 \n 으로 이은 값 (없으면 '')
};

/** takeSseEvents 결과 */
export type SseTakeResultType = {
    events: Array<SseEventType>; // 끝까지 온 이벤트
    rest: string;                // 아직 끝나지 않은 꼬리 — 다음 조각을 이어 붙인다
};

/**
 * SSE 버퍼에서 끝난 이벤트를 꺼낸다 — 경계는 빈 줄(\n\n · CRLF 도 허용), ':' 로 시작하는 줄은 주석
 *
 * @param buffer 지금까지 받은 문자열(이전 rest + 새 조각)
 */
export function takeSseEvents(buffer: string): SseTakeResultType {
    const holdCr = buffer.endsWith('\r'); // \r\n 이 조각 사이에서 잘렸을 수 있다
    const normalized = (holdCr ? buffer.slice(0, -1) : buffer).replace(/\r\n?/g, '\n');
    const blocks = normalized.split('\n\n');
    const rest = (blocks.pop() ?? '') + (holdCr ? '\r' : '');

    const events: Array<SseEventType> = [];
    for (const block of blocks) {
        const event = parseSseBlock(block);
        if (event) {
            events.push(event);
        }
    }

    return {events, rest};
}

/**
 * 이벤트 블록 하나 읽기 — event · data 줄이 하나도 없으면 null(주석만 있는 블록)
 *
 * @param block 빈 줄로 나뉜 블록
 */
function parseSseBlock(block: string): SseEventType | null {
    let event = 'message';
    let hasField = false;
    const dataLines: Array<string> = [];

    for (const line of block.split('\n')) {
        if (line === '' || line.startsWith(':')) {
            continue;
        }

        const colon = line.indexOf(':');
        const field = colon === -1 ? line : line.slice(0, colon);
        const raw = colon === -1 ? '' : line.slice(colon + 1);
        const value = raw.startsWith(' ') ? raw.slice(1) : raw;

        if (field === 'event') {
            event = value;
            hasField = true;
        } else if (field === 'data') {
            dataLines.push(value);
            hasField = true;
        }
    }

    return hasField ? {event, data: dataLines.join('\n')} : null;
}
```

```ts
// src/shared/api/queue.ts
import { ApiError, buildHeaders, buildUrl, HttpMethodType, parseJson, toFailBody } from '@/shared/api/request';
import { takeSseEvents } from '@/shared/api/sse';

/** 큐 응답 이벤트 이름 — contracts/common/sse.ts COMMAND_STREAM_EVENT 와 같은 값 (shared 는 contracts 를 가져오지 않는다) */
const QUEUE_EVENT = {DONE: 'done', FAILED: 'failed', PENDING: 'pending'} as const;

/** 큐 요청 옵션 */
export type QueueOptionsType = {
    method: Exclude<HttpMethodType, 'GET'>; // 상태를 바꾸는 쓰기
    path: string;                           // /api/v1 뒤 경로
    body?: unknown;                         // JSON 본문
    token?: string | null;                  // 로그인 토큰
    signal?: AbortSignal;                   // 취소 신호
};

/**
 * 큐 API 호출 — 상태를 바꾸는 쓰기 (응답이 text/event-stream)
 * - done → data, pending · 결과 없이 끝남 → null (그 리소스를 다시 조회한다), failed → ApiError(status_code, data)
 * - 스트림 전 실패(입력 검증 400 · 로그인 401 · 권한 403)는 일반 JSON 실패 본문 → ApiError(status, 본문)
 * - 응답 DTO 가 null 인 API 는 done 과 pending 이 같은 null — 화면은 null 이면 다시 조회한다
 *
 * @param options 메서드 · 경로 · 본문 · 토큰 · 취소 신호
 */
export async function callQueue<T>({method, path, body, token, signal}: QueueOptionsType): Promise<T | null> {
    const hasBody = body !== undefined;
    const response = await fetch(buildUrl(path), {
        method,
        headers: buildHeaders(token, hasBody, 'text/event-stream'),
        body: hasBody ? JSON.stringify(body) : undefined,
        signal,
    });

    if (!response.ok) {
        throw new ApiError(response.status, toFailBody(parseJson(await response.text())));
    }

    if (!response.body) {
        return null;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        for (;;) {
            const {value, done} = await reader.read();
            if (done) {
                return null; // done · failed · pending 없이 끝났다 — 다시 조회
            }

            const taken = takeSseEvents(buffer + decoder.decode(value, {stream: true}));
            buffer = taken.rest;

            for (const event of taken.events) {
                const data = parseJson(event.data) ?? null;
                if (event.event === QUEUE_EVENT.DONE) {
                    return data as T;
                }

                if (event.event === QUEUE_EVENT.FAILED) {
                    const fail = toFailBody(data);
                    throw new ApiError(typeof fail.status_code === 'number' ? fail.status_code : 500, fail);
                }

                if (event.event === QUEUE_EVENT.PENDING) {
                    return null;
                }
            }
        }
    } finally {
        await reader.cancel().catch((): void => undefined); // 결과를 받았으면 스트림을 닫는다
    }
}
```

### 실패 처리 (#3)

형제 계약 `axiosErrorHandle`(`src/shared/api/axios-error.ts:10-28`)과 같은 분담 — 칸 오류는 `resetValidationError` → `showValidationErrors`(`src/shared/utils/validation.ts:31,49`), 칸이 없으면 `alert(message)`. 다른 점(사용자 결정): 응답이 없는 실패는 고정 문구 alert, 동기 함수.

```ts
// src/shared/api/error.ts
import { ApiError } from '@/shared/api/request';
import { resetValidationError, showValidationErrors } from '@/shared/utils/validation';

/** 응답이 없는 실패(네트워크 · 서버 꺼짐) 문구 */
export const NETWORK_ERROR_MESSAGE = '서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.';

/**
 * API 실패 보여 주기 — 화면은 catch 에서 handleApiError(error)
 * - validation_errors 는 칸 옆에(맞는 칸이 없으면 alert(message)), 없으면 alert(message)
 * - 응답이 없는 실패는 NETWORK_ERROR_MESSAGE, 취소(AbortError)는 보여 주지 않는다
 *
 * @param error catch 로 받은 값
 * @param isReset 전에 보여 준 칸 오류를 지울지
 */
export function handleApiError(error: unknown, isReset: boolean = true): void {
    if (isAbortError(error)) {
        return;
    }

    if (!(error instanceof ApiError)) {
        console.error(error);
        alert(NETWORK_ERROR_MESSAGE);
        return;
    }

    const {message, validation_errors} = error.body;
    if (validation_errors && validation_errors.length > 0) {
        if (isReset) {
            resetValidationError();
        }

        if (showValidationErrors(validation_errors) === 0) {
            alert(message);
        }
        return;
    }

    alert(message);
}

/**
 * 화면이 스스로 취소한 요청인지 — fetch 는 AbortError(DOMException)를 던진다
 *
 * @param error catch 로 받은 값
 */
function isAbortError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as {name?: unknown}).name === 'AbortError';
}
```

### query 문자열 (#3)

```ts
// src/shared/utils/util.ts — createQueryString 교체
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
```

### 공통 계약 사본 (#4)

지침서 `frontend/dto/common.md` 의 코드 블록을 그대로 옮긴다(따옴표 · 공백 · 주석 그대로). 도메인 DTO 의 `'../../common/pagination.dto'` 가 이 자리를 가리킨다.

```ts
// src/contracts/common/pagination.dto.ts — frontend/dto/common.md:9-78 그대로
import {IsOptional} from 'class-validator';

/** 페이지 기본값 */
export const PAGINATION_DEFAULTS = {all_search_yn: 'N', page: 1, size: 20, page_size: 10} as const;

/**
 * 목록 query 의 부모 — 목록 DTO 는 이것을 extends 하고 자기 필드만 더한다. 값은 query 문자열로 보낸다
 */
export class PaginationDto {
    /** 전체 조회 여부(Y/N) — Y 면 페이지 없이 전부. 기본값 N */
    @IsOptional()
    all_search_yn: string;

    /** 페이지. 기본값 1 */
    @IsOptional()
    page: number;

    /** 페이지당 개수. 기본값 20 */
    @IsOptional()
    size: number;

    /** 페이지 탭에 보일 페이지 수. 기본값 10 */
    @IsOptional()
    page_size: number;

    /**
     * @param data 요청 쿼리 — 빠진 값은 PAGINATION_DEFAULTS
     */
    constructor(data?: Partial<PaginationDto>) {
        this.all_search_yn = data?.all_search_yn ?? PAGINATION_DEFAULTS.all_search_yn;
        this.page = data?.page ?? PAGINATION_DEFAULTS.page;
        this.size = data?.size ?? PAGINATION_DEFAULTS.size;
        this.page_size = data?.page_size ?? PAGINATION_DEFAULTS.page_size;
    }
}

/** 페이지 탭에 보일 페이지 번호 범위 */
export class PageRangeResultDto {
    /** 시작 페이지 */
    start: number;

    /** 끝 페이지 */
    end: number;
}

/** 목록 응답 `{list, pagination}` 의 pagination */
export class PaginationResultDto {
    /** 전체 조회 여부(Y/N) */
    all_search_yn: 'Y' | 'N';

    /** 총 개수 */
    total_count: number;

    /** 현재 페이지 (범위를 벗어난 요청은 바로잡은 값) */
    page: number;

    /** 마지막 페이지 (0건이어도 1) */
    max_page: number;

    /** 페이지 탭에 보일 페이지 번호 범위 */
    page_range: PageRangeResultDto;

    /** 이 페이지 첫 항목의 번호 — 총 개수부터 내려간다 */
    content_start_number: number;

    /** 이 페이지 첫 항목의 번호 — 1부터 올라간다 */
    content_start_number_reverse: number;
}
```

```ts
// src/contracts/common/fail-result.dto.ts — frontend/dto/common.md:84-105 그대로
/** 입력 칸 오류 1건 — 그 칸 옆에 message 를 보여 준다 */
export class ValidationErrorResultDto {
    /** 오류가 난 입력 필드 이름(중첩은 점 경로 — hours.0.open_time) */
    property: string;

    /** 보여 줄 메시지 */
    message: string;
}

/** 모든 실패의 본문 */
export class ApiFailResultDto {
    /** 보여 줄 메시지 */
    message: string;

    /** 입력 칸 오류 목록 — 입력 칸 오류가 아니면 null */
    validation_errors: ValidationErrorResultDto[] | null;
}

/** 큐 응답의 failed 이벤트 data — 실패 본문 + 상태 코드 */
export type CommandFailedEventData = ApiFailResultDto & {status_code: number} & Record<string, unknown>;
```

```ts
// src/contracts/common/roles.ts — frontend/dto/common.md:111-120 그대로
/** 회원 권한 — 업체 총관리자(HEAD_MANAGER)만 업체 관리자 관리 · 문 시크릿 설정 */
export const AUTH_ID = {SUPER_ADMIN: 'SUPER_ADMIN', ADMIN: 'ADMIN', HEAD_MANAGER: 'HEAD_MANAGER', MANAGER: 'MANAGER', USER: 'USER'} as const;

/** 로그인 그룹 — 그룹마다 로그인 · 재발급 API 와 토큰이 따로다 */
export const LOGIN_SCOPE = {USER: 'USER', MANAGER: 'MANAGER', ADMIN: 'ADMIN'} as const;

/** 로그인 그룹 값 */
export type LoginScope = (typeof LOGIN_SCOPE)[keyof typeof LOGIN_SCOPE];
```

```ts
// src/contracts/common/sse.ts — frontend/dto/common.md:126-137 그대로
/** 큐 API 응답 이벤트 — accepted 뒤에 done · failed · pending 중 하나가 오고 스트림이 끝난다 */
export const COMMAND_STREAM_EVENT = {
    /** 접수됨 — data: `{request_id}` */
    ACCEPTED: 'accepted',
    /** 성공 — data: 그 API 의 응답 DTO (없으면 null) */
    DONE: 'done',
    /** 실패 — data: `{status_code, message, validation_errors, ...}` */
    FAILED: 'failed',
    /** 30초 안에 결과가 오지 않음 — data: `{request_id, message}`. 처리됐을 수 있으니 그 리소스를 다시 조회한다 */
    PENDING: 'pending',
} as const;
```

```ts
// src/contracts/common/reservation.constants.ts — frontend/dto/common.md:144-168 그대로
/** 예약 상태 — 예약 · 구간 */
export const RESERVATION_STATE = {PENDING: 'PENDING', CONFIRMED: 'CONFIRMED', CHECKED_IN: 'CHECKED_IN', COMPLETED: 'COMPLETED', CANCELED: 'CANCELED', EXPIRED: 'EXPIRED'} as const;

/** 예약 구간 종류 — 기본 · 연장 */
export const RESERVATION_DETAIL_TYPE = {BASE: 'BASE', EXTENSION: 'EXTENSION'} as const;

/** 결제 상태 */
export const PAYMENT_STATE = {READY: 'READY', DONE: 'DONE', FAILED: 'FAILED', EXPIRED: 'EXPIRED', REFUND_REQUESTED: 'REFUND_REQUESTED', REFUNDED: 'REFUNDED', REFUND_FAILED: 'REFUND_FAILED'} as const;

/** 취소 주체 — USER: 이용자, STORE: 업체 */
export const RESERVATION_CANCEL_ACTOR = {USER: 'USER', STORE: 'STORE'} as const;

/** 결제 대기 유지 시간(분) — 예약 · 연장 신청 뒤 이 시간 안에 결제가 확인되지 않으면 만료 */
export const RESERVATION_PAYMENT_PENDING_MINUTES = 5;

/** 결제 대기 만료 뒤 같은 이용자가 같은 호실을 다시 예약할 수 없는 시간(분) — 만료 시각부터 */
export const RESERVATION_REBOOK_BLOCK_MINUTES = 10;

/** 이용 중 취소 요청 상태 — 요청 중인데 만료 시각이 지나면 만료로 본다 */
export const RESERVATION_CANCEL_REQUEST_STATE = {REQUESTED: 'REQUESTED', APPROVED: 'APPROVED', REJECTED: 'REJECTED', EXPIRED: 'EXPIRED'} as const;

/** 이용 중 취소 요청 유효 시간(분) — 예약 끝이 먼저면 예약 끝까지 */
export const RESERVATION_CANCEL_REQUEST_MINUTES = 10;
```

### 상태 이름 룩업 (#4 · #5)

지침서 "룩업 값" 표(frontend/dto/common.md:174-193)를 응답 필드 이름으로 묶는다. 도메인 지식이라 `shared` 가 아니라 `contracts/common`. 괄호 안 설명은 빼고 이름만. 이용 중 취소 요청 상태는 응답 필드 `cancel_request_state_id`(frontend/dto/reservation.md:181).

```ts
// src/contracts/common/lookup.ts
/**
 * 룩업 값 — ID 만 오는 상태 · 종류 값의 한국어 이름 (지침서 frontend/dto/common.md "룩업 값")
 * - 응답에 *_name 이 함께 오면 그 이름을 먼저 쓴다
 */
export const LOOKUP = {
    auth_id: {SUPER_ADMIN: '총괄관리자', ADMIN: '관리자', HEAD_MANAGER: '총괄매니저', MANAGER: '매니저', USER: '이용자'},
    state_id: {ACTIVE: '정상', BLOCK: '정지', LEAVE_WAIT: '탈퇴 대기', LEAVE: '탈퇴'},
    sns_id: {GOOGLE: '구글', FACEBOOK: '페이스북', APPLE: '애플', KAKAO: '카카오', LINE: '라인', NAVER: '네이버'},
    gender: {M: '남', F: '여'},
    store_state_id: {ACTIVE: '활성', SUSPEND: '영업중지', LEAVE: '탈퇴'},
    store_application_state_id: {WAIT: '대기', APPROVED: '승인', REJECTED: '반려'},
    store_file_purpose_id: {BUSINESS_LICENSE: '사업자등록증', STORE_IMAGE: '업체 사진'},
    room_state_id: {AVAILABLE: '예약가능', RESERVED: '예약완료', IN_USE: '사용중', MAINTENANCE: '정비중', DISABLED: '사용중지'},
    door_state: {open: '열림', close: '닫힘'},
    room_plan_type_id: {HOURLY: '시간 이용', NIGHT: '1박', LONG: '연박'},
    reservation_state_id: {PENDING: '결제 대기', CONFIRMED: '예약 확정', CHECKED_IN: '이용 중', COMPLETED: '이용 완료', CANCELED: '취소', EXPIRED: '결제 대기 만료'},
    reservation_detail_type_id: {BASE: '기본', EXTENSION: '연장'},
    cancel_actor: {USER: '이용자', STORE: '업체'},
    cancel_request_state_id: {REQUESTED: '요청 중', APPROVED: '승인', REJECTED: '거절', EXPIRED: '만료'},
    payment_state_id: {READY: '결제 대기', DONE: '결제 완료', FAILED: '결제 실패', EXPIRED: '결제 만료', REFUND_REQUESTED: '환불 신청', REFUNDED: '환불 완료', REFUND_FAILED: '환불 실패'},
    environment: {LIVE: '실결제', TEST: '테스트 결제'},
} as const;

/** 룩업 구분 — 응답 필드 이름 */
export type LookupGroupType = keyof typeof LOOKUP;

/**
 * 상태 · 종류 값의 이름 — 모르는 값은 값 그대로, 빈 값은 ''
 *
 * @param group 응답 필드 이름 (reservation_state_id …)
 * @param value 응답 값 (CONFIRMED …)
 */
export function lookupName(group: LookupGroupType, value: string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const names: Record<string, string> = LOOKUP[group];
    return names[value] ?? value;
}
```

### 표시 형식 유틸 (#5)

dayjs `utc` · `timezone` 플러그인(dayjs 에 들어 있음 — 새 패키지 없음)으로 `Asia/Seoul` 고정(사용자 결정). 서버 렌더링(Docker UTC)에서도 같은 결과.

```ts
// src/shared/utils/format.ts
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

/** 화면에 보이는 시간대 — 서버 렌더링(Docker UTC)에서도 한국 시각으로 */
export const DISPLAY_TIMEZONE = 'Asia/Seoul';

/** 요일 이름 — 0 일 ~ 6 토 (day_of_week) */
export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 매일 — days_of_week 비트합 */
export const EVERY_DAY_BITS = 127;

/**
 * ISO 시각 → 한국 시각 문자열
 *
 * @param iso 서버 시각 (2026-11-10T09:30:00.000Z)
 * @param format dayjs 형식 (기본 'YYYY-MM-DD HH:mm')
 * @returns 한국 시각 문자열, 빈 값 · 읽을 수 없는 값은 ''
 */
export function toKst(iso: string | null | undefined, format: string = 'YYYY-MM-DD HH:mm'): string {
    if (!iso) {
        return '';
    }

    const time = dayjs(iso);
    return time.isValid() ? time.tz(DISPLAY_TIMEZONE).format(format) : '';
}

/**
 * 오늘 날짜(한국) — 날짜 입력 · 조회 조건의 기본값
 *
 * @returns 'YYYY-MM-DD'
 */
export function todayKst(): string {
    return dayjs().tz(DISPLAY_TIMEZONE).format('YYYY-MM-DD');
}

/**
 * 금액 — 원 단위 정수에 쉼표와 '원'
 *
 * @param amount 금액 (12000)
 * @returns '12,000원', 빈 값은 ''
 */
export function formatPrice(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
        return '';
    }

    return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * 요일 목록 → 비트합 (days_of_week 요청 값)
 *
 * @param days 요일 (0 일 ~ 6 토)
 */
export function daysToBits(days: Array<number>): number {
    return days.reduce((bits, day) => bits | (1 << day), 0);
}

/**
 * 비트합 → 요일 목록 (일 → 토 순서)
 *
 * @param bits days_of_week 응답 값
 */
export function bitsToDays(bits: number): Array<number> {
    return DAY_NAMES.map((_, day) => day).filter((day) => (bits & (1 << day)) !== 0);
}

/**
 * 비트합 → 요일 표시 — 127 은 '매일', 그 밖은 '월 · 수 · 금'
 *
 * @param bits days_of_week 응답 값
 */
export function formatDays(bits: number): string {
    if (bits === EVERY_DAY_BITS) {
        return '매일';
    }

    return bitsToDays(bits).map((day) => DAY_NAMES[day]).join(' · ');
}
```

### 페이지 타입 · 페이지 탭 (#4)

`shared/components/Pagination.tsx` 를 다른 공통 부품과 같이 `ui/nav/` 로 옮기고 시안(`frontend/design/manager.html` `.pager` · `admin.html` `.pg`)대로 `‹ 번호 ›` 로 바꾼다 — 처음 · 마지막 버튼은 없앤다. `movePage(page: string)` 는 그대로(목록 화면의 `setPage` 를 그대로 넘기는 패턴 — docs/data-layer.md "목록 페이지 패턴").

```ts
// src/shared/types/pagination.ts
/** 페이지 탭에 보일 번호 범위 */
type PageRangeType = {
    start: number;
    end: number;
};

/**
 * 목록 응답 {list, pagination} 의 pagination
 * - contracts/common/pagination.dto.ts 의 PaginationResultDto 와 같은 구조 (shared 는 contracts 를 가져오지 않는다)
 */
export type PaginationType = {
    all_search_yn: 'Y' | 'N';
    total_count: number;
    page: number;
    max_page: number;
    page_range: PageRangeType;
    content_start_number: number;
    content_start_number_reverse: number;
};
```

```tsx
// src/shared/components/ui/nav/Pagination.tsx
'use client';
import { PaginationType } from '@/shared/types/pagination';
import styles from '@/shared/css/ui/nav/Pagination.module.css';

type PaginationProps = {
    pagination: PaginationType | null; // 목록 응답의 pagination — 없으면 그리지 않는다
    movePage: (page: string) => void;  // 고른 페이지 번호(문자열) — 목록 화면의 setPage 를 그대로
    label?: string;                    // 탭 묶음 이름 (기본 '페이지')
};

/**
 * 페이지 탭 — ‹ 번호 › (시안 .pager)
 * - 현재 페이지는 aria-current 이고 눌러도 이동하지 않는다. 1쪽이면 이전, 마지막 쪽이면 다음이 막힌다
 *
 * @param param0
 * @returns
 */
export default function Pagination({pagination, movePage, label = '페이지'}: PaginationProps): React.ReactNode {
    // 변수
    const page = pagination?.page ?? 1;          // 현재 페이지
    const maxPage = pagination?.max_page ?? 1;   // 마지막 페이지
    const numbers = pageNumbers(pagination);     // 탭에 보일 번호들

    // 함수
    function movePrev(): void {
        if (page > 1) {
            movePage(String(page - 1));
        }
    }

    function moveNext(): void {
        if (page < maxPage) {
            movePage(String(page + 1));
        }
    }

    if (!pagination) {
        return null;
    }

    return (
        // 페이지 탭
        <nav className={styles.pager} aria-label={label}>
            {/* 이전 */}
            <button type="button" className={styles.item} aria-label="이전 페이지" disabled={page <= 1} onClick={movePrev}>‹</button>

            {/* 번호 — 현재 페이지는 이동하지 않는다 */}
            {numbers.map((number) => (
                number === page ? (
                    <button key={number} type="button" className={`${styles.item} ${styles.current}`} aria-current="page">{number}</button>
                ) : (
                    <button key={number} type="button" className={styles.item} onClick={() => movePage(String(number))}>{number}</button>
                )
            ))}

            {/* 다음 */}
            <button type="button" className={styles.item} aria-label="다음 페이지" disabled={page >= maxPage} onClick={moveNext}>›</button>
        </nav>
    );
}

/**
 * 탭에 보일 페이지 번호 — page_range.start ~ end
 *
 * @param pagination 목록 응답의 pagination
 */
function pageNumbers(pagination: PaginationType | null): Array<number> {
    const numbers: Array<number> = [];
    if (pagination) {
        for (let number = pagination.page_range.start; number <= pagination.page_range.end; number++) {
            numbers.push(number);
        }
    }

    return numbers;
}
```

```css
/* src/shared/css/ui/nav/Pagination.module.css — 시안 manager.html .pager */
.pager {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 4px;
}

.item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
}

.item:hover:not(:disabled):not(.current) {
    background: var(--surface-2);
}

.item:disabled {
    color: var(--faint);
    cursor: default;
}

.current {
    border-color: var(--primary);
    background: var(--primary);
    color: var(--on-primary);
    font-weight: 700;
    cursor: default;
}
```

### `/dev/ui` 페이지 탭 미리보기

```tsx
// src/app/dev/ui/UiPreviewContent.tsx — 바뀌는 곳
import Pagination from '@/shared/components/ui/nav/Pagination';
import { PaginationType } from '@/shared/types/pagination';

/**
 * 미리보기용 페이지 정보 — 5쪽짜리 목록(100건, 20건씩)
 *
 * @param page 현재 페이지
 */
function previewPagination(page: number): PaginationType {
    return {
        all_search_yn: 'N',
        total_count: 100,
        page,
        max_page: 5,
        page_range: {start: 1, end: 5},
        content_start_number: 100 - (page - 1) * 20,
        content_start_number_reverse: (page - 1) * 20 + 1,
    };
}

// Gallery — 상태 · 계산 값 영역에 더한다
    const [page, setPage] = useState<string>('2');                     // 페이지 탭 예시

    // 계산 값
    const pagination = previewPagination(Number(page));               // 페이지 탭 예시 값

// Gallery JSX — 탭 Section 아래
            {/* 페이지 탭 */}
            <Section title="페이지 탭">
                <Pagination pagination={pagination} movePage={setPage} label={`${title} 페이지 예시`} />
            </Section>
```

### 문서 (초안 — `<!-- beaver:draft based on planning · unconfirmed before ship -->`)

build 가 코드와 맞춰 쓰고, ship 이 확정한다.

```md
<!-- AGENTS.md -->
⚠️ 지금 코드의 인증(토큰 1벌 · `/api/v1/user/refresh` — `src/app/api/cookie/access/route.ts:48`)은 **예전 백엔드 기준**이다 — Phase 3 에서 영역별 토큰으로 바꾼다. 예전 아이디 로그인(`src/app/(user)/login/` · `src/shared/api/axios-error.ts`)은 Phase 5 에서 지운다.

## Data Layer
- 백엔드 호출은 fetch 하나 — 조회 · 로그인 같은 동기는 `request<T>({method, path, query, body, token})`, 상태를 바꾸는 쓰기는 큐 `callQueue<T>({method, path, body, token})` (`src/shared/api/request.ts` · `queue.ts`). 주소는 `${NEXT_PUBLIC_API_URL}/api/v1${path}` — 게이트웨이 하나만(…로컬 포트).
- 큐 결과는 `done` → data, `pending` · 결과 없이 끝남 → `null`(그 리소스를 다시 조회). 401 재발급은 Phase 3 이 감싼다.
- 화면은 `contracts/<도메인>/api.ts` 의 함수를 부르고, 그 함수가 `request` · `callQueue` 를 부른다.

## Error & Response
- API 호출 실패는 catch 에서 `handleApiError(error)` (`src/shared/api/error.ts`) — `validation_errors` 는 칸 옆에(맞는 칸이 없으면 `alert(message)`), 없으면 `alert(message)`, 응답이 없으면 고정 문구, 취소(AbortError)는 무시.

## Conventions (더함)
- 표시 형식은 `src/shared/utils/format.ts` — `toKst`(ISO → 한국 시각) · `formatPrice` · `formatDays`. 상태 이름은 응답 `*_name` 먼저, 없으면 `lookupName(필드, 값)` (`src/contracts/common/lookup.ts`).
- 공통 부품 `nav/`(`Tabs` · `Pagination`).

## Checklist
- [ ] API 호출 실패는 catch 에서 `handleApiError(error)`
```

```md
<!-- docs/data-layer.md — "백엔드 API 호출" 을 다시 쓴다 -->
### 호출 클라이언트 — `src/shared/api/`
| 함수 | 쓰는 곳 | 결과 |
|---|---|---|
| `request<T>({method?, path, query?, body?, token?, signal?})` | 동기 — 조회 · 로그인 · 재발급 · 업로드 주소 발급 | JSON(빈 본문 · 204 는 `null`), 2xx 아니면 `ApiError(status, 실패 본문)` |
| `callQueue<T>({method, path, body?, token?, signal?})` | 큐 — 상태를 바꾸는 쓰기(`text/event-stream`) | `done` → data, `pending` · 끝남 → `null`, `failed` → `ApiError(status_code, data)` |
| `handleApiError(error)` | catch | 칸 옆 · alert (error-handling.md) |
- `takeSseEvents(buffer)` (`sse.ts`) 가 이벤트를 자른다 — 빈 줄 경계, CRLF 허용, 여러 줄 data 는 `\n` 으로 잇는다.
- 응답 DTO 가 `null` 인 큐 API 는 `done` 과 `pending` 이 같은 `null` — 화면은 `null` 이면 다시 조회한다.
- axios 는 쓰지 않는다 — `axios.ts` · `axios-error.ts` 를 지웠고 `cookie.ts` · `access/route.ts` · 예전 로그인도 fetch.

### 계약 · 형식
- `src/contracts/common/` — `pagination.dto.ts` · `fail-result.dto.ts` · `roles.ts` · `sse.ts` · `reservation.constants.ts`(지침서 사본) · `lookup.ts`(`LOOKUP` · `lookupName`).
- `class-transformer` 는 첫 입력 DTO 를 옮기는 Phase 5 에서 넣는다(`validate(plainToInstance(XDto, 값))`).
- 표시 형식 `src/shared/utils/format.ts` — `toKst(iso, 'YYYY-MM-DD HH:mm')` · `todayKst()` · `formatPrice(12000)` → `12,000원` · `daysToBits` · `bitsToDays` · `formatDays(127)` → `매일`.

### Pagination
- `PaginationType`(`src/shared/types/pagination.ts`)은 snake_case — `PaginationResultDto` 와 같은 구조. `Pagination`(`src/shared/components/ui/nav/Pagination.tsx`) — `‹ 번호 ›`, props `pagination` · `movePage(page: string)` · `label?`.
```

```md
<!-- docs/error-handling.md — 화면 패턴 · 기준표를 handleApiError 로 -->
try {
    const store = await callQueue<StoreMineResultDto>({method: 'PATCH', path: '/admin-service/store/mine', body: dto, token});
    if (store === null) { await reload(); return; } // pending — 다시 조회
} catch (error) {
    handleApiError(error); // validation_errors 는 칸 옆, 없으면 alert(message), 응답 없으면 고정 문구, 취소는 무시
}
```

- `docs/architecture.md` 트리: `shared/api/` → `request.ts · queue.ts · sse.ts · error.ts · cookie.ts`, `shared/utils/` 에 `format.ts`, `shared/components/ui/nav/` 에 `Pagination`, `contracts/common/` 실제 파일 목록.
- `docs/conventions.md` "스타일" 부품 고유 치수 예외에 `페이지 탭 32×32(시안 .pager a)` 를 더한다. "공통 부품" `nav/` 에 `Pagination`.
- `docs/testing.md`: DOM 이 필요 없는 테스트는 파일 첫 줄 `// @vitest-environment node`, fetch 경계는 `vi.stubGlobal('fetch', vi.fn())` + `new Response(…)`(SSE 는 `ReadableStream` 조각), 테스트 뒤 `vi.unstubAllGlobals()`.

### axios 제거 (사용자 요청 2026-11-15 — build 중)

axios 를 쓰던 나머지 예전 코드도 fetch 로 바꾸고 `axios-error.ts` 와 `package.json` 의 axios 를 지운다. 동작은 그대로 — 쿠키 route handler 호출은 실패를 던지지 않고 `null` · `false`, 재발급 실패는 `{success: false}`.

```ts
// src/shared/api/cookie.ts
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
```

재발급(`src/app/api/cookie/access/route.ts`) — `axios.post(…, {httpsAgent: rejectUnauthorized false})` 를 `fetch` 로. 인증서 검사를 끄던 옵션은 없앤다(fetch 에는 없고, 로컬은 http · 운영은 정상 인증서).

```ts
// src/app/api/cookie/access/route.ts — GET 의 재발급 부분
    if (refreshToken) {
        try {
            const refresh_token: string = refreshToken.value;
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/refresh`;
            const response = await fetch(apiUrl, {method: 'POST', headers, body: JSON.stringify({refresh_token})});
            const data = await response.json().catch((): null => null);
            if (!response.ok || !data) {
                console.log(`-------------Refresh Error --- ${dayjs().format('YYYY-MM-DD HH:mm:ss')} --------------`);
                console.log('status:', response.status);
                console.log('data:', data);
                return new Response(JSON.stringify({ success: false }), { headers });
            }

            if (data.refresh_token) {
                cookieStore.set('refreshToken', data.refresh_token, {
                    path: "/",
                    domain: process.env.SERVER_DOMAIN ?? undefined,
                    httpOnly: true,
                    sameSite: process.env.SERVER_DOMAIN ? "lax" : "strict",
                    secure: process.env.NODE_ENV === 'development' ? false : isSecure,
                    expires: data.refresh_token_end_dt ? new Date(data.refresh_token_end_dt) : new Date(new Date().getTime() + (60 * 60 * 24 * 30 * 1000))
                });
            }

            // 유지시간보다 1분 빨리 끝나도록해서 가능한 재발급받도록
            const setTime = new Date(new Date(data.access_token_end_dt).getTime() - (5 * 1000));
            cookieStore.set('accessToken', data.access_token, {
                path: "/",
                domain: process.env.SERVER_DOMAIN ?? undefined,
                httpOnly: true,
                sameSite: process.env.SERVER_DOMAIN ? "lax" : "strict",
                secure: process.env.NODE_ENV === 'development' ? false : isSecure, 
                expires: setTime
            });

            if (option) {
                const result = jwt.verify(data.access_token, process.env.NEXT_PUBLIC_JWT_CODE as string);
                return new Response(JSON.stringify({ success: true, data: result }), { headers });
            } else {
                return new Response(JSON.stringify({ success: true, data: data.access_token }), { headers });
            }
        } catch (error: any) {
            console.log(`-------------Refresh Error --- ${dayjs().format('YYYY-MM-DD HH:mm:ss')} --------------`);
            console.log(error?.message ?? error); // 네트워크 실패 · 토큰 검증 실패
            return new Response(JSON.stringify({ success: false }), { headers });
        }
```

예전 로그인(`src/app/(user)/login/LoginContent.tsx`) — `axios.post` → `request`, `axiosErrorHandle` → `handleApiError`. 고치는 파일이라 구조 규칙(변수 > 상태 > 효과 > 함수 > JSX · 주석)도 맞춘다.

```tsx
// src/app/(user)/login/LoginContent.tsx
'use client';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAccessToken, setRefreshToken } from '@/shared/api/cookie';
import { handleApiError } from '@/shared/api/error';
import { request } from '@/shared/api/request';
import Loading from '@/shared/components/Loading';
import useInput, { UseInputType } from '@/shared/hooks/useInput';
import { IsLoginContext, RootLayoutLoadingContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import { LoginDto } from './dto';

/** 로그인 응답 — 예전 백엔드 기준 */
type LoginResultType = {
    access_token: string;
    access_token_end_dt: string;
    refresh_token: string;
    refresh_token_end_dt: string;
};

/**
 * 로그인 — 예전 백엔드(아이디 · 비밀번호) 기준. Phase 5 에서 지침서 U5(카카오 · 네이버)로 바뀐다
 *
 * @returns
 */
export default function LoginContent(): React.ReactNode {
    // 변수
    const router = useRouter();                                              // 로그인 뒤 첫 화면으로
    const rootLayoutLoading: boolean = useContext(RootLayoutLoadingContext); // 로그인 상태 확인 중인지
    const isLogin: boolean = useContext(IsLoginContext);                     // 이미 로그인했는지

    // 상태
    const [loading, setLoading] = useState<boolean>(true);    // 화면 준비 중(로그인 상태 확인 · 저장한 아이디 채우기)
    const [isSaveId, setIsSaveId] = useState<boolean>(false); // 아이디 저장 선택
    const loginId: UseInputType = useInput('');               // 아이디 칸
    const loginPw: UseInputType = useInput('');               // 비밀번호 칸

    // 효과
    useEffect(() => {
        // 이미 로그인했으면 첫 화면으로, 아니면 저장한 아이디를 채운다
        if (rootLayoutLoading) {
            setLoading(true);
        } else if (isLogin) {
            router.push('/');
        } else {
            const saveId: string = localStorage.getItem('saveId');
            if (saveId) {
                setIsSaveId(true);
                loginId.setValue(saveId);
            }
            setLoading(false);
        }
    }, [rootLayoutLoading, isLogin]);

    // 함수
    async function login(): Promise<void> {
        const dto = new LoginDto({login_id: loginId.value, login_pw: loginPw.value});
        if (!(await validateAction(dto))) {
            return;
        }

        try {
            const result = await request<LoginResultType>({method: 'POST', path: '/user/login', body: dto});
            if (!result) {
                return;
            }

            // 아이디 저장을 골랐으면 저장, 아니면 지운다
            if (isSaveId) {
                localStorage.setItem('saveId', loginId.value);
            } else {
                localStorage.removeItem('saveId');
            }

            // 토큰 쿠키 저장
            await setRefreshToken(result.refresh_token, result.refresh_token_end_dt);
            await setAccessToken(result.access_token, result.access_token_end_dt);
            router.push('/');
        } catch (error) {
            handleApiError(error);
        }
    }

    async function enterScope(event: React.KeyboardEvent<HTMLInputElement>): Promise<void> {
        if (event.key === 'Enter') {
            await login();
        }
    }

    function toggleSaveId(): void {
        setIsSaveId(!isSaveId);
    }

    if (loading) {
        return (
            // 로그인 상태 확인 중
            <Loading />
        );
    }

    return (
        // 로그인 폼
        <>
            <table>
                <colgroup>
                    <col style={{width: '20%'}} />
                    <col style={{width: '80%'}} />
                </colgroup>
                <tbody>
                    {/* 아이디 */}
                    <tr>
                        <th>아이디</th>
                        <td>
                            <input type="text" value={loginId.value} onChange={loginId.onChange} onKeyDown={enterScope} />
                            <span data-type="validation-alert" data-id="login_id" />
                        </td>
                    </tr>

                    {/* 비밀번호 */}
                    <tr>
                        <th>비밀번호</th>
                        <td>
                            <input type="password" value={loginPw.value} onChange={loginPw.onChange} onKeyDown={enterScope} />
                            <span data-type="validation-alert" data-id="login_pw" />
                        </td>
                    </tr>

                    {/* 아이디 저장 */}
                    <tr>
                        <th>아이디 저장</th>
                        <td>
                            <input type="checkbox" className="checkbox" id="save-id-checkbox" checked={isSaveId} onChange={toggleSaveId} />
                            <label htmlFor="save-id-checkbox">아이디 저장하기</label>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* 로그인 버튼 */}
            <button type="button" onClick={login}>로그인</button>
        </>
    );
}
```

- `src/shared/api/axios-error.ts` 삭제, `npm uninstall axios`.
- 문서의 `LoginContent.tsx` · `access/route.ts` · `cookie.ts` 줄 번호 근거를 새 줄로 옮긴다.

---

## Test Cases

테스트 파일 · 환경: `src/shared/api/sse.test.ts` · `queue.test.ts` · `request.test.ts` 는 `// @vitest-environment node`(DOM 불필요 · fetch 는 `vi.stubGlobal` mock — 실제 네트워크 없음), `src/shared/api/error.test.ts` 는 jsdom(칸 span · `vi.spyOn(window, 'alert')`), `src/shared/utils/util.test.ts`, `src/shared/components/ui/nav/Pagination.test.tsx`(Testing Library). 케이스 이름은 `[SUCCESS]`/`[FAIL:<이유>]` — `[CASES:*]` 는 결과에 따라 `[SUCCESS]` 또는 `[FAIL:*]` 로 쓴다. 호출 횟수 · 인자 · 실패 뒤 미호출을 검증한다.

```
[CASES:takeSseEvents] "event: done\ndata: {\"id\":1}\n\n" → 이벤트 [{event: "done", data: "{\"id\":1}"}], rest ""
[CASES:takeSseEvents] accepted · done 두 이벤트가 한 버퍼에 → 두 개를 순서대로, rest ""
[CASES:takeSseEvents] "event: accepted\ndata: {}\n\nevent: do" → 이벤트 1개(accepted), rest "event: do"
[CASES:takeSseEvents] CRLF "event: done\r\ndata: null\r\n\r\n" → [{event: "done", data: "null"}]
[CASES:takeSseEvents] data: 두 줄 → data 를 \n 으로 이어 한 값
[CASES:takeSseEvents] 주석만 ": ping\n\n" → 이벤트 0개, rest ""
[CASES:takeSseEvents] data 없는 "event: pending\n\n" → [{event: "pending", data: ""}]
[CASES:callQueue] accepted → done {"store_id":1} → {store_id: 1} · fetch 1회 · method · Accept: text/event-stream · Content-Type: application/json · Authorization: Bearer t · 본문 JSON
[CASES:callQueue] done null → null
[CASES:callQueue] failed {status_code: 400, message, validation_errors} → ApiError(status 400, body 그대로) throw
[CASES:callQueue] pending {request_id, message} → null
[CASES:callQueue] 한 이벤트가 두 조각으로 나뉘어 와도 → done data
[CASES:callQueue] 스트림 전 401 JSON → ApiError(401) throw, 스트림을 읽지 않음
[CASES:callQueue] done · failed · pending 없이 스트림이 끝남 → null
[CASES:callQueue] token null → Authorization 헤더 없음
[CASES:request] GET query: {page: 1, keyword: undefined} → <API>/api/v1<path>?page=1, 본문 없음, JSON 반환
[CASES:request] POST body: {login_id: "a"} → Content-Type: application/json, 본문 {"login_id":"a"}
[CASES:request] token "t" → Authorization: Bearer t
[CASES:request] 400 실패 본문 → ApiError(400, 본문) throw
[CASES:request] 204 · 빈 본문 → null
[CASES:request] 502 HTML 본문 → ApiError(502, {message: "서버 응답을 읽을 수 없습니다.", validation_errors: null})
[CASES:createQueryString] {page: 1, keyword: "강남 역"} → "?page=1&keyword=%EA%B0%95%EB%82%A8%20%EC%97%AD"
[CASES:createQueryString] {page: 1, a: null, b: undefined, c: ""} → "?page=1"
[CASES:createQueryString] {a: null} · {} → ""
[CASES:Pagination] 4 버튼 → movePage("4") 1회
[CASES:Pagination] 2쪽에서 이전 · 다음 → movePage("1") · movePage("3")
[CASES:Pagination] 현재 페이지 버튼 → movePage 미호출
[CASES:Pagination] 1쪽 → 이전 버튼 막힘, 눌러도 미호출
[CASES:Pagination] 마지막 쪽 → 다음 버튼 막힘, 눌러도 미호출
[FAIL:validation] ApiError(400) + validation_errors 칸 있음 → 그 칸에 메시지, alert 미호출, 이전 칸 오류는 지움
[FAIL:validation] validation_errors 는 있는데 맞는 칸 없음 → alert(message) 1회
[FAIL:validation] validation_errors: null → alert(message) 1회
[FAIL:network] ApiError 가 아닌 오류(fetch TypeError) → 고정 문구 alert 1회
[FAIL:abort] AbortError → alert 미호출

테스트 생략(사용자 결정 · 위임형): format.ts · lookupName(사용자가 TDD 제외) · contracts/common 사본(지침서 그대로) · /dev/ui 페이지 미리보기
```

---

## Response Codes

| 결과 | 원인 |
|------|------|
| `request` → `T` | 2xx JSON 본문 |
| `request` → `null` | 204 · 빈 본문 |
| `request` → `ApiError(status, 본문)` | 2xx 아님 — 400 입력 · 규칙 위반 / 401 로그인 필요 · 토큰 만료 / 403 권한 · 정지 / 404 없음 / 503 외부 연동 잠시 안 됨 / 500 |
| `request` → `ApiError(status, {message: "서버 응답을 읽을 수 없습니다.", validation_errors: null})` | 본문이 JSON 이 아님(게이트웨이 HTML 오류 등) |
| `callQueue` → `T` | `done` (응답 DTO) |
| `callQueue` → `null` | `pending`(30초 초과 — 다시 조회) · `done` 의 data 가 null · 결과 이벤트 없이 끝남 |
| `callQueue` → `ApiError(status_code, data)` | `failed` |
| `callQueue` → `ApiError(status, 본문)` | 스트림 전 실패 — 400 · 401 · 403 |
| `TypeError` · `AbortError` (그대로 던짐) | 네트워크 실패 · 화면이 취소 — `handleApiError` 가 고정 문구 alert · 무시 |
| `handleApiError` | 칸 옆 표시 / `alert(message)` / `alert(NETWORK_ERROR_MESSAGE)` / 아무것도 안 함(취소) |
