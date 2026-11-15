# Plan — 영역별 로그인 기반 (Phase 3)

## Feature Summary
- **Feature**: 이용자 · 매니저 · 관리자 토큰을 영역별 쿠키로 따로 두고, 401 이면 그 영역 재발급 한 번 · 재시도, 또 401 이면 그 영역 로그인 화면으로 — 오류는 전용 팝업으로
- **Entry point**: `ROUTE · MODULE GET · POST · DELETE /api/cookie/[area] · POST /api/cookie/[area]/refresh · src/shared/api/auth.ts(withAuth) · src/shared/utils/area.ts · src/shared/components/AuthGuard.tsx · ErrorPopup`
- **Domain**: auth
- **Spec**: `.beaver/output/spec/auth/area-auth-spec.md` · roadmap Phase 3 (#6 영역별 토큰 저장 · 로그아웃, #7 401 재발급 · 로그인으로 보내기, #8 영역 판별 · 로그인 상태 · AuthGuard) · direct 모드(`main`)
- **함께 하는 일(사용자 요청)**: 오류 alert → 오류 전용 팝업, 테스트 파일 `src/test/` 로, lint 오류 · 경고 0
- **규칙**: AGENTS.md — import 방향 `app → contracts → shared`(테스트 `src/test/` 는 영역 밖), 컴포넌트 · 훅 본문 구조, export 함수 한국어 JSDoc, route handler 는 200 + `{success, data?}`, 공통 부품 `ui/<종류>/` · css `shared/css/` 같은 경로.

---

## File List

| File | Action |
|------|------|
| `src/shared/utils/area.ts` | new — `AreaType` · `AREAS` · `AREA_HOME` · `AREA_LOGIN_PATH` · `RETURN_URL_KEY` · `areaOf` · `loginUrl` · `safeReturnPath` |
| `src/shared/api/request.ts` | modified — `NetworkError` · `isAbortError` · `asNetworkError` · `sendRequest`, `request` 가 `sendRequest` |
| `src/shared/api/queue.ts` | modified — `sendRequest`, 스트림 읽기 실패 → `NetworkError` |
| `src/shared/api/auth.ts` | new — `AuthType` · `LoginRequiredError` · `withAuth` |
| `src/shared/api/cookie.ts` | rewritten — `getAreaToken` · `saveAreaTokens` · `deleteAreaTokens` · `refreshAreaToken`(동시 재발급 하나로) · SNS 2개(타입 붙임). 옛 함수 6개 삭제 |
| `src/shared/api/error.ts` | modified — 팝업, `NetworkError` · `LoginRequiredError` · 기타 오류 |
| `src/shared/utils/error-popup.ts` | new — `showErrorPopup` · `closeErrorPopup` · `subscribeErrorPopup` · `getErrorPopup` |
| `src/shared/components/ui/modal/ErrorPopup.tsx` | new — 루트 오류 팝업 |
| `src/shared/css/ui/modal/ErrorPopup.module.css` | new |
| `src/shared/utils/validation.ts` | modified — `alert` 2곳 → `showErrorPopup` |
| `src/shared/components/ui/button/CopyButton.tsx` | modified — `alert` → `showErrorPopup` |
| `src/shared/providers/RootLayoutProvider.tsx` | rewritten — `RootLayoutLoadingContext` · `AuthContext` · `AuthContextType` |
| `src/app/RootLayoutContent.tsx` | modified — 영역 판별 · 영역 토큰 · `AuthContext` · `ErrorPopup`, `sessionStorage.referer` 삭제 |
| `src/shared/components/AuthGuard.tsx` | rewritten — 영역 로그인 주소 · 돌아올 주소, `loginPath` 삭제, 구조 규칙 |
| `src/app/api/cookie/token-cookie.ts` | new — 영역 확인 · 쿠키 이름 · 옵션 · 저장 · 삭제 · 영역별 재발급 |
| `src/app/api/cookie/[area]/route.ts` | new — `GET` · `POST` · `DELETE` |
| `src/app/api/cookie/[area]/refresh/route.ts` | new — `POST` |
| `src/app/api/cookie/access/route.ts` · `refresh/route.ts` · `logout/route.ts` | **deleted** — `[area]` 로 |
| `src/app/api/cookie/sns/route.ts` | modified — lint(`catch` 변수) |
| `src/contracts/user/dto/user-token-refresh.dto.ts` · `src/contracts/manager/dto/manager-token-refresh.dto.ts` · `src/contracts/admin/dto/admin-token-refresh.dto.ts` | new — 지침서 사본 그대로 |
| `src/contracts/user/api.ts` · `src/contracts/manager/api.ts` · `src/contracts/admin/api.ts` | new — `refreshUserToken` · `refreshManagerToken` · `refreshAdminToken` |
| `src/shared/types/access.ts` | **deleted** |
| `src/app/(user)/login/LoginContent.tsx` · `dto.ts` · `dto.test.ts` | **deleted** — 예전 아이디 로그인 |
| `src/app/(user)/login/page.tsx` | modified — Phase 5 까지 자리 표시 |
| `src/app/dev/ui/UiPreviewContent.tsx` | modified — 오류 팝업 미리보기 버튼 |
| `src/shared/components/Editor.tsx` · `Timer.tsx` · `KakaoMap.tsx` | modified — lint |
| `src/shared/hooks/useCheckboxGroup.ts` · `useInput.ts` · `useInputDate.ts` · `useInputFloat.ts` · `useInputNumber.ts` · `useInputTime.ts` | modified — lint · 구조 규칙 |
| `src/shared/utils/address.ts` | modified — lint(외부 SDK `any` 주석) |
| `src/app/api/auth/[...nextauth]/route.ts` | modified — lint(`any` · `catch` 변수) |
| `src/shared/**/*.test.ts(x)` 8개 | moved → `src/test/<같은 경로>` — import 를 별칭으로 |
| `src/test/shared/utils/area.test.ts` · `src/test/shared/api/auth.test.ts` · `src/test/shared/api/cookie.test.ts` · `src/test/app/api/cookie/token-cookie.test.ts` · `src/test/shared/components/AuthGuard.test.tsx` · `src/test/shared/components/ui/modal/ErrorPopup.test.tsx` | new |
| `AGENTS.md` · `docs/architecture.md` · `docs/conventions.md` · `docs/data-layer.md` · `docs/error-handling.md` · `docs/testing.md` | modified — 초안 표시 |

---

## Design

### 영역 · 로그인 주소 (#8 · #7)

`shared` 에 둔다 — `RootLayoutContent`(app) · `AuthGuard`(shared) · `cookie.ts`(shared) 가 같이 쓴다. 영역은 백엔드 도메인이 아니라 화면 주소 구조다.

```ts
// src/shared/utils/area.ts
/** 화면 영역 — 이용자 / · 업체 관리자 /manager · 관리자 /admin. 영역마다 로그인 · 토큰이 따로다 */
export type AreaType = 'user' | 'manager' | 'admin';

/** 영역 목록 */
export const AREAS: Array<AreaType> = ['user', 'manager', 'admin'];

/** 영역 첫 화면 — 돌아올 주소가 맞지 않을 때 */
export const AREA_HOME: Record<AreaType, string> = {user: '/', manager: '/manager/', admin: '/admin/'};

/** 영역 로그인 화면 — 매니저는 기억한 업체코드로 보내는 안내 화면(Phase 10) */
export const AREA_LOGIN_PATH: Record<AreaType, string> = {user: '/login/', manager: '/manager/login/', admin: '/admin/login/'};

/** 로그인 뒤 돌아올 주소를 담는 query 이름 */
export const RETURN_URL_KEY = 'return_url';

/**
 * 주소로 영역 알기 — /manager · /manager/… 는 manager, /admin · /admin/… 는 admin, 그 밖은 user
 *
 * @param pathname 주소 path (usePathname)
 */
export function areaOf(pathname: string): AreaType {
    if (isUnder(pathname, '/manager')) {
        return 'manager';
    }

    if (isUnder(pathname, '/admin')) {
        return 'admin';
    }

    return 'user';
}

/**
 * 영역 로그인 주소 — 돌아올 주소(같은 사이트 path + query)를 return_url 로 붙인다
 * - 같은 사이트 주소가 아니거나 로그인 화면 자신이면 붙이지 않는다
 *
 * @param area 영역
 * @param returnPath 돌아올 주소 (/stores/1/?date=…)
 */
export function loginUrl(area: AreaType, returnPath?: string | null): string {
    const loginPath = AREA_LOGIN_PATH[area];
    if (!isSamePath(returnPath) || isLoginPath(returnPath, loginPath)) {
        return loginPath;
    }

    return `${loginPath}?${RETURN_URL_KEY}=${encodeURIComponent(returnPath)}`;
}

/**
 * 로그인 화면이 return_url 을 읽을 때 — 같은 사이트 주소만, 아니면 그 영역 첫 화면
 *
 * @param raw return_url 값
 * @param area 영역
 */
export function safeReturnPath(raw: string | null | undefined, area: AreaType): string {
    return isSamePath(raw) ? raw : AREA_HOME[area];
}

/**
 * base 와 같거나 그 아래 주소인지 — /managerX 는 /manager 아래가 아니다
 *
 * @param pathname 주소 path
 * @param base 영역 시작 path
 */
function isUnder(pathname: string, base: string): boolean {
    return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * 같은 사이트 주소인지 — '/' 로 시작하고 '//' · '/\' 로 시작하지 않는다(다른 사이트로 보내는 주소 막기)
 *
 * @param path 주소
 */
function isSamePath(path: string | null | undefined): boolean {
    return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}

/**
 * 로그인 화면 자신인지 — query 를 떼고 끝 '/' 가 있든 없든
 *
 * @param path 주소
 * @param loginPath 영역 로그인 path (끝 '/')
 */
function isLoginPath(path: string, loginPath: string): boolean {
    const pathOnly = path.split('?')[0];
    return pathOnly === loginPath || pathOnly === loginPath.slice(0, -1);
}
```

### 응답 없는 실패 — `NetworkError` (Phase 2 review #3)

```ts
// src/shared/api/request.ts — 더하는 것 (기존 ApiError 아래)
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
```

```ts
// src/shared/api/request.ts — request 안 (fetch → sendRequest, 본문 읽기 실패도 맞춘다)
    const response = await sendRequest(buildUrl(path, query), {
        method,
        headers: buildHeaders(token, hasBody),
        body: hasBody ? JSON.stringify(body) : undefined,
        signal,
    });

    const text = await response.text().catch((error: unknown) => {
        throw asNetworkError(error);
    });
```

```ts
// src/shared/api/queue.ts — 바뀌는 곳
import { ApiError, asNetworkError, buildHeaders, buildUrl, HttpMethodType, parseJson, sendRequest, toFailBody } from '@/shared/api/request';

    const response = await sendRequest(buildUrl(path), {
        method,
        headers: buildHeaders(token, hasBody, 'text/event-stream'),
        body: hasBody ? JSON.stringify(body) : undefined,
        signal,
    });

    // …

        for (;;) {
            const {value, done} = await reader.read().catch((error: unknown) => {
                throw asNetworkError(error); // 스트림을 읽다 끊겼다
            });
```

### 오류 팝업 (사용자 결정)

React 밖(`handleApiError` · `validateAction`)에서도 띄우려고 저장소를 모듈 상태로 두고, 루트의 `ErrorPopup` 이 `useSyncExternalStore` 로 읽는다. 열려 있을 때 새 오류가 오면 새 내용으로 바꾼다.

```ts
// src/shared/utils/error-popup.ts
/** 오류 팝업 내용 */
export type ErrorPopupType = {
    message: string; // 보여 줄 문구
    detail?: string; // 개발 때만 — 오류 원문
};

type ListenerType = () => void;

let current: ErrorPopupType | null = null;    // 지금 띄운 오류 — 없으면 null
const listeners = new Set<ListenerType>();    // ErrorPopup 이 붙인 알림 함수

/**
 * 바뀜 알리기
 */
function emit(): void {
    listeners.forEach((listener) => listener());
}

/**
 * 오류 팝업 띄우기 — 열려 있으면 새 내용으로 바꾼다
 *
 * @param message 보여 줄 문구
 * @param detail 개발 때만 보여 줄 오류 원문
 */
export function showErrorPopup(message: string, detail?: string): void {
    current = {message, detail};
    emit();
}

/**
 * 오류 팝업 닫기
 */
export function closeErrorPopup(): void {
    current = null;
    emit();
}

/**
 * 바뀜 구독 — useSyncExternalStore 용
 *
 * @param listener 알림 함수
 */
export function subscribeErrorPopup(listener: ListenerType): () => void {
    listeners.add(listener);
    return (): void => {
        listeners.delete(listener);
    };
}

/**
 * 지금 띄운 오류 — useSyncExternalStore 용
 */
export function getErrorPopup(): ErrorPopupType | null {
    return current;
}
```

```tsx
// src/shared/components/ui/modal/ErrorPopup.tsx
'use client';
import { useSyncExternalStore } from 'react';
import Button from '@/shared/components/ui/button/Button';
import Modal from './Modal';
import { closeErrorPopup, ErrorPopupType, getErrorPopup, subscribeErrorPopup } from '@/shared/utils/error-popup';
import styles from '@/shared/css/ui/modal/ErrorPopup.module.css';

/**
 * 서버 렌더링 때 오류 — 없음
 */
function getServerPopup(): ErrorPopupType | null {
    return null;
}

/**
 * 오류 팝업 — 루트(RootLayoutContent)에 하나. showErrorPopup(message, detail?) 로 연다
 *
 * @returns
 */
export default function ErrorPopup(): React.ReactNode {
    // 변수
    const popup = useSyncExternalStore(subscribeErrorPopup, getErrorPopup, getServerPopup); // 지금 띄울 오류 — 없으면 null

    return (
        // 오류 팝업 — 확인을 누르면 닫힌다
        <Modal open={popup !== null} title="알림" onClose={closeErrorPopup} footer={<Button variant="primary" onClick={closeErrorPopup}>확인</Button>}>
            {/* 문구 */}
            <p className={styles.message}>{popup?.message}</p>

            {/* 개발 때만 — 오류 원문 */}
            {popup?.detail ? <pre className={styles.detail}>{popup.detail}</pre> : null}
        </Modal>
    );
}
```

```css
/* src/shared/css/ui/modal/ErrorPopup.module.css */
.message {
    margin: 0;
    white-space: pre-line;
}

.detail {
    margin: 0;
    padding: 8px 12px;
    border-radius: var(--radius);
    background: var(--surface-2);
    color: var(--muted);
    font-family: var(--mono);
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
}
```

```ts
// src/shared/api/error.ts
import { LoginRequiredError } from '@/shared/api/auth';
import { ApiError, isAbortError, NetworkError } from '@/shared/api/request';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { resetValidationError, showValidationErrors } from '@/shared/utils/validation';

/** 응답이 없는 실패(네트워크 · 서버 꺼짐) 문구 */
export const NETWORK_ERROR_MESSAGE = '서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.';

/** 그 밖의 오류(코드 오류 등) 문구 */
export const UNKNOWN_ERROR_MESSAGE = '처리 중 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.';

/**
 * API 실패 보여 주기 — 화면은 catch 에서 handleApiError(error)
 * - validation_errors 는 칸 옆에(맞는 칸이 없으면 팝업), 없으면 message 를 오류 팝업으로
 * - NetworkError 는 NETWORK_ERROR_MESSAGE, 그 밖의 오류는 UNKNOWN_ERROR_MESSAGE(개발 때만 원문) + console.error
 * - 취소(AbortError) · 로그인 만료(LoginRequiredError — 이미 로그인 화면으로 보냈다)는 보여 주지 않는다
 *
 * @param error catch 로 받은 값
 * @param isReset 전에 보여 준 칸 오류를 지울지
 */
export function handleApiError(error: unknown, isReset: boolean = true): void {
    if (isAbortError(error) || error instanceof LoginRequiredError) {
        return;
    }

    if (error instanceof NetworkError) {
        showErrorPopup(NETWORK_ERROR_MESSAGE);
        return;
    }

    if (!(error instanceof ApiError)) {
        console.error(error);
        showErrorPopup(UNKNOWN_ERROR_MESSAGE, process.env.NODE_ENV === 'production' ? undefined : errorDetail(error));
        return;
    }

    const {message, validation_errors} = error.body;
    if (validation_errors && validation_errors.length > 0) {
        if (isReset) {
            resetValidationError();
        }

        if (showValidationErrors(validation_errors) === 0) {
            showErrorPopup(message);
        }
        return;
    }

    showErrorPopup(message);
}

/**
 * 오류 원문 — 개발 때 팝업 아래에 보인다
 *
 * @param error catch 로 받은 값
 */
function errorDetail(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
```

```ts
// src/shared/utils/validation.ts — validateAction · validateActionChildren 의 alert 2곳
import { showErrorPopup } from '@/shared/utils/error-popup';

        if (validationErrors.length > 0 && showValidationErrors(validationErrors) === 0) {
            showErrorPopup(validationErrors[0].message);
        }

        if (validationErrors.length > 0 && showValidationErrors(validationErrors, key) === 0) {
            showErrorPopup(validationErrors[0].message);
        }
```

```tsx
// src/shared/components/ui/button/CopyButton.tsx — catch
import { showErrorPopup } from '@/shared/utils/error-popup';

        } catch {
            // http 같은 비보안 주소에서는 navigator.clipboard 가 없다
            showErrorPopup('복사하지 못했습니다. 직접 선택해 복사해 주세요.');
        }
```

```tsx
// src/app/dev/ui/UiPreviewContent.tsx — Gallery 함수 · "모달" Section 버튼
import { showErrorPopup } from '@/shared/utils/error-popup';

    function openErrorPopup(): void {
        showErrorPopup('업체명을 입력해 주세요.', area === 'console' ? 'TypeError: 개발 때만 보이는 오류 원문 예시' : undefined);
    }

                    <Button onClick={openErrorPopup}>오류 팝업</Button>
```

### 영역 토큰 쿠키 — route handler (#6 · #7)

지금 `access/route.ts`(GET 재발급 · POST 저장) · `refresh/route.ts` · `logout/route.ts` 를 영역 하나 받는 route handler 둘로 합친다. 형제 계약 그대로 — 항상 200 + `{success, data?}`, 던지지 않는다. 쿠키 옵션도 지금과 같고, `SERVER_DOMAIN` 이 빈 문자열이면 domain 을 붙이지 않는다(`|| undefined`).

```ts
// src/app/api/cookie/token-cookie.ts
import { cookies, headers as nextHeaders } from 'next/headers';
import { refreshAdminToken } from '@/contracts/admin/api';
import { refreshManagerToken } from '@/contracts/manager/api';
import { refreshUserToken } from '@/contracts/user/api';
import { AREAS, AreaType } from '@/shared/utils/area';

/** 토큰 4개 — 로그인 결과 · 재발급 결과(영역마다 같은 모양) */
export type TokenSetType = {
    access_token: string;
    refresh_token: string;
    access_token_expires_at: string;
    refresh_token_expires_at: string;
};

type CookieStoreType = Awaited<ReturnType<typeof cookies>>;

/** access 쿠키를 실제 만료보다 먼저 끝내는 시간 — 그 전에 GET 이 재발급하게 */
export const ACCESS_EARLY_EXPIRE_MS = 60 * 1000;

/** 영역별 재발급 API */
const REFRESHERS: Record<AreaType, (refreshToken: string) => Promise<TokenSetType | null>> = {
    user: (refresh_token) => refreshUserToken({refresh_token}),
    manager: (refresh_token) => refreshManagerToken({refresh_token}),
    admin: (refresh_token) => refreshAdminToken({refresh_token}),
};

/**
 * 주소의 영역 값 확인 — user · manager · admin 이 아니면 null
 *
 * @param value [area] 값
 */
export function toArea(value: string): AreaType | null {
    return (AREAS as Array<string>).includes(value) ? (value as AreaType) : null;
}

/**
 * access 토큰 쿠키 이름 — user_access_token
 *
 * @param area 영역
 */
export function accessCookieName(area: AreaType): string {
    return `${area}_access_token`;
}

/**
 * refresh 토큰 쿠키 이름 — user_refresh_token
 *
 * @param area 영역
 */
export function refreshCookieName(area: AreaType): string {
    return `${area}_refresh_token`;
}

/**
 * route handler 응답 — 항상 200 + {success, data?}
 *
 * @param body 응답 본문
 */
export function json(body: {success: boolean; data?: unknown}): Response {
    return new Response(JSON.stringify(body), {headers: {'Content-Type': 'application/json'}});
}

/**
 * 쿠키 옵션 — httpOnly · path / · SERVER_DOMAIN · https 면 secure
 *
 * @param expires 만료 시각
 */
async function cookieOptions(expires: Date): Promise<Parameters<CookieStoreType['set']>[2]> {
    const headerList = await nextHeaders();
    const isSecure = (headerList.get('x-forwarded-proto') || 'http') === 'https';

    return {
        path: '/',
        domain: process.env.SERVER_DOMAIN || undefined,
        httpOnly: true,
        sameSite: process.env.SERVER_DOMAIN ? 'lax' : 'strict',
        secure: process.env.NODE_ENV === 'development' ? false : isSecure,
        expires,
    };
}

/**
 * 토큰 쿠키 저장 — access 는 만료 60초 전에 끝나게
 *
 * @param cookieStore cookies()
 * @param area 영역
 * @param tokens 로그인 · 재발급 결과
 */
export async function setTokenCookies(cookieStore: CookieStoreType, area: AreaType, tokens: TokenSetType): Promise<void> {
    const accessExpires = new Date(new Date(tokens.access_token_expires_at).getTime() - ACCESS_EARLY_EXPIRE_MS);
    cookieStore.set(accessCookieName(area), tokens.access_token, await cookieOptions(accessExpires));
    cookieStore.set(refreshCookieName(area), tokens.refresh_token, await cookieOptions(new Date(tokens.refresh_token_expires_at)));
}

/**
 * 토큰 쿠키 삭제 — 그 영역 두 쿠키만(다른 영역 로그인은 그대로)
 *
 * @param cookieStore cookies()
 * @param area 영역
 */
export async function clearTokenCookies(cookieStore: CookieStoreType, area: AreaType): Promise<void> {
    const options = {...(await cookieOptions(new Date(0))), maxAge: 0};
    cookieStore.set(accessCookieName(area), '', options);
    cookieStore.set(refreshCookieName(area), '', options);
}

/**
 * 그 영역 재발급 API — 실패(401 · 네트워크 등)면 null
 *
 * @param area 영역
 * @param refreshToken refresh 토큰
 */
export async function refreshTokens(area: AreaType, refreshToken: string): Promise<TokenSetType | null> {
    try {
        return await REFRESHERS[area](refreshToken);
    } catch (error) {
        console.log(`[token] ${area} 재발급 실패 —`, error instanceof Error ? error.message : error);
        return null;
    }
}

/**
 * refresh 쿠키로 재발급 → 두 쿠키 새로 저장 → 새 access. 실패하면 두 쿠키를 지우고 null
 *
 * @param cookieStore cookies()
 * @param area 영역
 */
export async function refreshAndStore(cookieStore: CookieStoreType, area: AreaType): Promise<string | null> {
    const refreshToken = cookieStore.get(refreshCookieName(area))?.value;
    if (!refreshToken) {
        return null;
    }

    const tokens = await refreshTokens(area, refreshToken);
    if (!tokens) {
        await clearTokenCookies(cookieStore, area);
        return null;
    }

    await setTokenCookies(cookieStore, area, tokens);
    return tokens.access_token;
}
```

```ts
// src/app/api/cookie/[area]/route.ts
import { cookies } from 'next/headers';
import { accessCookieName, clearTokenCookies, json, refreshAndStore, setTokenCookies, toArea, TokenSetType } from '../token-cookie';

/**
 * 그 영역 access 토큰 — 없거나 곧 만료면 refresh 쿠키로 재발급
 *
 * @param _request
 * @param context [area]
 */
export async function GET(_request: Request, context: RouteContext<'/api/cookie/[area]'>): Promise<Response> {
    const area = toArea((await context.params).area);
    if (!area) {
        return json({success: false});
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(accessCookieName(area))?.value;
    if (accessToken) {
        return json({success: true, data: accessToken});
    }

    const refreshed = await refreshAndStore(cookieStore, area);
    return refreshed ? json({success: true, data: refreshed}) : json({success: false});
}

/**
 * 로그인 결과 토큰 저장
 *
 * @param request 본문 — access_token · refresh_token · access_token_expires_at · refresh_token_expires_at
 * @param context [area]
 */
export async function POST(request: Request, context: RouteContext<'/api/cookie/[area]'>): Promise<Response> {
    const area = toArea((await context.params).area);
    if (!area) {
        return json({success: false});
    }

    try {
        const tokens = (await request.json()) as TokenSetType;
        if (!tokens?.access_token || !tokens?.refresh_token) {
            return json({success: false});
        }

        await setTokenCookies(await cookies(), area, tokens);
        return json({success: true});
    } catch {
        return json({success: false});
    }
}

/**
 * 로그아웃 — 그 영역 두 쿠키 삭제(로그아웃 API 는 없다)
 *
 * @param _request
 * @param context [area]
 */
export async function DELETE(_request: Request, context: RouteContext<'/api/cookie/[area]'>): Promise<Response> {
    const area = toArea((await context.params).area);
    if (!area) {
        return json({success: false});
    }

    await clearTokenCookies(await cookies(), area);
    return json({success: true});
}
```

```ts
// src/app/api/cookie/[area]/refresh/route.ts
import { cookies } from 'next/headers';
import { json, refreshAndStore, toArea } from '../../token-cookie';

/**
 * 401 뒤 강제 재발급 — 새 access, 실패하면 두 쿠키를 지우고 {success: false}
 *
 * @param _request
 * @param context [area]
 */
export async function POST(_request: Request, context: RouteContext<'/api/cookie/[area]/refresh'>): Promise<Response> {
    const area = toArea((await context.params).area);
    if (!area) {
        return json({success: false});
    }

    const accessToken = await refreshAndStore(await cookies(), area);
    return accessToken ? json({success: true, data: accessToken}) : json({success: false});
}
```

### 재발급 계약 (#7)

`frontend/dto/user.md:574` · `manager.md:662` · `admin.md:84` 코드 블록을 그대로 옮긴다(스크립트로 — Phase 2 `contracts/common` 과 같은 방법).

```ts
// src/contracts/user/api.ts
import { request } from '@/shared/api/request';
import { UserTokenRefreshDto, UserTokenRefreshResultDto } from './dto/user-token-refresh.dto';

/**
 * 이용자 토큰 재발급 — 동기 · 공개 (POST /user-service/user/token-refresh)
 *
 * @param dto refresh_token
 */
export function refreshUserToken(dto: UserTokenRefreshDto): Promise<UserTokenRefreshResultDto | null> {
    return request<UserTokenRefreshResultDto>({method: 'POST', path: '/user-service/user/token-refresh', body: dto});
}
```

```ts
// src/contracts/manager/api.ts
import { request } from '@/shared/api/request';
import { ManagerTokenRefreshDto, ManagerTokenRefreshResultDto } from './dto/manager-token-refresh.dto';

/**
 * 매니저 토큰 재발급 — 동기 · 공개 (POST /admin-service/manager/token-refresh)
 *
 * @param dto refresh_token
 */
export function refreshManagerToken(dto: ManagerTokenRefreshDto): Promise<ManagerTokenRefreshResultDto | null> {
    return request<ManagerTokenRefreshResultDto>({method: 'POST', path: '/admin-service/manager/token-refresh', body: dto});
}
```

```ts
// src/contracts/admin/api.ts
import { request } from '@/shared/api/request';
import { AdminTokenRefreshDto, AdminTokenRefreshResultDto } from './dto/admin-token-refresh.dto';

/**
 * 관리자 토큰 재발급 — 동기 · 공개 (POST /admin-service/admin/token-refresh)
 *
 * @param dto refresh_token
 */
export function refreshAdminToken(dto: AdminTokenRefreshDto): Promise<AdminTokenRefreshResultDto | null> {
    return request<AdminTokenRefreshResultDto>({method: 'POST', path: '/admin-service/admin/token-refresh', body: dto});
}
```

### 브라우저 쪽 쿠키 함수 (#6 · #7)

route handler 주소는 `trailingSlash` 에 맞춰 `/` 로 끝낸다(308 되돌림을 피한다). 같은 영역 재발급이 동시에 걸리면 진행 중인 하나를 나눈다(refresh 토큰이 재발급마다 바뀌어 두 번 부르면 하나가 깨진다).

```ts
// src/shared/api/cookie.ts
'use client';
import { AreaType } from '@/shared/utils/area';

/** route handler(src/app/api/cookie/*) 응답 — 항상 200 + {success, data?} */
type RouteResultType<T> = {
    success: boolean;
    data?: T;
};

/** 로그인 결과 토큰 — 영역마다 같은 모양(…LoginResultDto 의 앞 4개) */
export type AreaTokensType = {
    access_token: string;
    refresh_token: string;
    access_token_expires_at: string;
    refresh_token_expires_at: string;
};

/** SNS 로그인 정보 — next-auth signIn 이 sns 쿠키에 담은 값(src/app/api/auth/[...nextauth]/route.ts) */
export type SnsLoginType = {
    sns_code: string;
    sns_id: string;
    access_token: string;
    name: string;
};

/** 영역별 진행 중인 재발급 — 동시에 걸리면 하나를 나눈다 */
const refreshing = new Map<AreaType, Promise<string | null>>();

/**
 * 토큰 쿠키 route handler 부르기 — 실패(네트워크 · 2xx 아님 · JSON 아님)는 던지지 않고 null
 *
 * @param url route handler 주소 (/api/cookie/…/)
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
 * @returns 없으면 null
 */
export async function getSNSAccessToken(): Promise<SnsLoginType | null> {
    const result = await callCookieRoute<SnsLoginType>('/api/cookie/sns/');
    return result?.success ? result.data ?? null : null;
}

/**
 * 소셜 로그인 정보 삭제
 *
 * @returns
 */
export async function deleteSNSAccessToken(): Promise<boolean> {
    const result = await callCookieRoute('/api/cookie/sns/', 'DELETE');
    return result?.success === true;
}

/**
 * 그 영역 access 토큰 — 없거나 곧 만료면 route handler 가 refresh 쿠키로 재발급한다
 *
 * @param area 영역
 * @returns 로그인 안 돼 있으면 null
 */
export async function getAreaToken(area: AreaType): Promise<string | null> {
    const result = await callCookieRoute<string>(`/api/cookie/${area}/`);
    return result?.success ? result.data ?? null : null;
}

/**
 * 로그인 결과 토큰 저장 — 로그인 화면(Phase 5 · 10 · 15)이 부른다
 *
 * @param area 영역
 * @param tokens 로그인 결과의 토큰 4개
 */
export async function saveAreaTokens(area: AreaType, tokens: AreaTokensType): Promise<boolean> {
    const result = await callCookieRoute(`/api/cookie/${area}/`, 'POST', tokens);
    return result?.success === true;
}

/**
 * 그 영역 토큰 삭제 — 로그아웃(로그아웃 API 는 없다)
 *
 * @param area 영역
 */
export async function deleteAreaTokens(area: AreaType): Promise<boolean> {
    const result = await callCookieRoute(`/api/cookie/${area}/`, 'DELETE');
    return result?.success === true;
}

/**
 * 그 영역 재발급 — 401 뒤. 같은 영역이 동시에 부르면 하나를 나눈다
 *
 * @param area 영역
 * @returns 새 access 토큰, 실패하면 null
 */
export function refreshAreaToken(area: AreaType): Promise<string | null> {
    const running = refreshing.get(area);
    if (running) {
        return running;
    }

    const next = callCookieRoute<string>(`/api/cookie/${area}/refresh/`, 'POST')
        .then((result) => (result?.success ? result.data ?? null : null))
        .finally(() => {
            refreshing.delete(area);
        });

    refreshing.set(area, next);
    return next;
}
```

### 401 재발급 감싸기 (#7)

화면은 `AuthContext` 값을 그대로 contracts 함수에 넘기고, contracts 함수가 `withAuth(auth, (token) => request · callQueue(…))` 로 부른다(첫 사용은 Phase 4 · 5).

```ts
// src/shared/api/auth.ts
import { deleteAreaTokens, refreshAreaToken } from '@/shared/api/cookie';
import { ApiError } from '@/shared/api/request';
import { AreaType } from '@/shared/utils/area';

/** 로그인이 필요한 API 를 부를 때 넘기는 값 — 화면은 AuthContext 값을 그대로 넘긴다 */
export type AuthType = {
    area: AreaType;                           // 지금 영역
    token: string | null;                     // 그 영역 access 토큰
    setToken: (token: string | null) => void; // 재발급 · 만료 때 Context 를 바꾼다
    onExpired: () => void;                    // 재발급도 안 되면 — 그 영역 로그인 화면으로
};

/**
 * 로그인이 끝났다(재발급 실패) — 이미 로그인 화면으로 보냈으니 handleApiError 는 띄우지 않는다
 */
export class LoginRequiredError extends Error {
    constructor() {
        super('login required');
        this.name = 'LoginRequiredError';
    }
}

/**
 * 로그인이 필요한 API 부르기 — 401 이면 그 영역 재발급 한 번 · 재시도, 또 401 이면 그 영역 로그인 화면으로
 * - 401 이 아닌 실패(400 · NetworkError …)는 그대로 던진다
 *
 * @param auth AuthContext 값
 * @param call 토큰을 받아 request · callQueue 를 부르는 함수
 */
export async function withAuth<T>(auth: AuthType, call: (token: string | null) => Promise<T>): Promise<T> {
    try {
        return await call(auth.token);
    } catch (error) {
        if (!isUnauthorized(error)) {
            throw error;
        }
    }

    const token = await refreshAreaToken(auth.area);
    if (!token) {
        return expire(auth);
    }

    auth.setToken(token);
    try {
        return await call(token);
    } catch (error) {
        if (isUnauthorized(error)) {
            return expire(auth);
        }
        throw error;
    }
}

/**
 * 401 인지
 *
 * @param error catch 로 받은 값
 */
function isUnauthorized(error: unknown): boolean {
    return error instanceof ApiError && error.status === 401;
}

/**
 * 로그인 만료 — 그 영역 토큰을 지우고 로그인 화면으로 보낸 뒤 LoginRequiredError
 *
 * @param auth AuthContext 값
 */
async function expire(auth: AuthType): Promise<never> {
    await deleteAreaTokens(auth.area);
    auth.setToken(null);
    auth.onExpired();
    throw new LoginRequiredError();
}
```

### 로그인 상태 Context · RootLayoutContent (#8)

`AccessTokenContext` · `IsLoginContext` 를 `AuthContext` 하나로. 토큰은 `{area, token}` 으로 들고 있어 영역이 바뀐 직후(새 영역 토큰을 확인하기 전)에는 로그인 안 됨 + 확인 중으로 본다. 오류 팝업은 루트에 하나.

```tsx
// src/shared/providers/RootLayoutProvider.tsx
'use client';
import { createContext } from 'react';
import { AuthType } from '@/shared/api/auth';

/** 로그인 상태 — withAuth 에 넘기는 값 + 로그인 여부 · 로그아웃 */
export type AuthContextType = AuthType & {
    isLogin: boolean;            // 지금 영역에 로그인했는지
    logout: () => Promise<void>; // 지금 영역 토큰을 지운다
};

type RootLayoutProviderProps = {
    rootLayoutLoading: boolean;
    auth: AuthContextType;
    children: React.ReactNode;
};

export const RootLayoutLoadingContext = createContext<boolean>(false); // 로그인 상태 확인 중
export const AuthContext = createContext<AuthContextType>(null);       // 지금 영역의 로그인 상태

/**
 * 로그인 상태 Context — RootLayoutContent 가 채운다
 *
 * @param param0
 * @returns
 */
export default function RootLayoutProvider({rootLayoutLoading, auth, children}: RootLayoutProviderProps): React.ReactNode {
    return (
        // 확인 중 · 로그인 상태
        <RootLayoutLoadingContext.Provider value={rootLayoutLoading}>
            <AuthContext.Provider value={auth}>
                {children}
            </AuthContext.Provider>
        </RootLayoutLoadingContext.Provider>
    );
}
```

```tsx
// src/app/RootLayoutContent.tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NextTopLoader from 'nextjs-toploader';
import { deleteAreaTokens, getAreaToken } from '@/shared/api/cookie';
import Scripts from '@/shared/components/Scripts';
import ErrorPopup from '@/shared/components/ui/modal/ErrorPopup';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';
import { AreaType, areaOf, loginUrl } from '@/shared/utils/area';

type RootLayoutContentProps = {
    children: React.ReactNode;
    modal?: React.ReactNode; // 경로 모달 — Provider 안에서 그려 Context 를 쓸 수 있게
};

type AreaTokenType = {
    area: AreaType | null; // 이 토큰을 확인한 영역 — 처음엔 null
    token: string | null;  // 그 영역 access 토큰
};

/**
 * 루트 — 주소가 바뀔 때마다 그 영역 로그인 상태를 확인해 Context 로, 오류 팝업 하나
 *
 * @param param0
 * @returns
 */
export default function RootLayoutContent({children, modal}: RootLayoutContentProps): React.ReactNode {
    // 변수
    const pathname = usePathname(); // 지금 주소 — 바뀔 때마다 그 영역 토큰을 다시 확인
    const router = useRouter();     // 로그인 만료 때 이동
    const area = areaOf(pathname);  // 지금 영역

    // 상태
    const [areaToken, setAreaToken] = useState<AreaTokenType>({area: null, token: null}); // 확인한 영역 · 토큰

    // 계산 값
    const checked = areaToken.area === area;                  // 지금 영역 토큰을 확인했는지
    const token = checked ? areaToken.token : null;           // 지금 영역 토큰
    const auth: AuthContextType = {                           // AuthContext 값
        area,
        token,
        isLogin: Boolean(token),
        setToken: (next: string | null) => setAreaToken({area, token: next}),
        onExpired: () => router.replace(loginUrl(area, `${pathname}${window.location.search}`)),
        logout: async () => {
            await deleteAreaTokens(area);
            setAreaToken({area, token: null});
        },
    };

    // 효과
    useEffect(() => {
        // 주소가 바뀌면 그 영역 토큰 확인(없거나 곧 만료면 route handler 가 재발급)
        let active = true;
        getAreaToken(area).then((accessToken) => {
            if (active) {
                setAreaToken({area, token: accessToken});
            }
        });

        return () => {
            active = false;
        };
    }, [pathname, area]);

    return (
        // 루트 — 진행 막대 · 화면 · 오류 팝업
        <>
            {/* 상단 진행 막대 */}
            <NextTopLoader color="var(--primary)" showSpinner={false} />

            {/* 화면 */}
            <div id="wrap">
                {/* 외부 스크립트 */}
                <Scripts />

                {/* 로그인 상태 Context — 화면 · 경로 모달 */}
                <RootLayoutProvider rootLayoutLoading={!checked} auth={auth}>
                    {children}
                    {modal}
                </RootLayoutProvider>
            </div>

            {/* 오류 팝업 — 하나 */}
            <ErrorPopup />
        </>
    );
}
```

### AuthGuard (#8)

`loginPath` prop 을 없애고 주소로 영역 로그인 주소를 정한다. 고치는 파일이라 구조 규칙을 맞춘다.

```tsx
// src/shared/components/AuthGuard.tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useContext, useEffect } from 'react';
import Loading from '@/shared/components/Loading';
import { AuthContext, RootLayoutLoadingContext } from '@/shared/providers/RootLayoutProvider';
import { loginUrl } from '@/shared/utils/area';

type AuthGuardProps = {
    children: React.ReactNode;
};

/**
 * 로그인이 필요한 영역의 layout 에서 감싼다 — 로그인이 안 돼 있으면 그 영역 로그인 화면으로(돌아올 주소와 함께)
 *
 * @param param0
 * @returns
 */
export default function AuthGuard({children}: AuthGuardProps): React.ReactNode {
    // 변수
    const router = useRouter();                                       // 로그인 화면으로 보낼 때
    const pathname = usePathname();                                   // 돌아올 주소
    const rootLayoutLoading: boolean = useContext(RootLayoutLoadingContext); // 로그인 상태 확인 중인지
    const auth = useContext(AuthContext);                             // 지금 영역 로그인 상태

    // 계산 값
    const blocked = rootLayoutLoading || !auth.isLogin; // 내용을 아직 보여 주지 않을지

    // 효과
    useEffect(() => {
        // 확인이 끝났는데 로그인이 안 돼 있으면 그 영역 로그인 화면으로
        if (!rootLayoutLoading && !auth.isLogin) {
            router.replace(loginUrl(auth.area, `${pathname}${window.location.search}`));
        }
    }, [rootLayoutLoading, auth.isLogin, auth.area, pathname, router]);

    if (blocked) {
        return (
            // 확인 중 · 로그인 화면으로 가는 중
            <Loading />
        );
    }

    return (
        // 로그인한 화면
        <>{children}</>
    );
}
```

### 지우는 것 · 자리 표시

- `src/app/api/cookie/access/route.ts` · `refresh/route.ts` · `logout/route.ts` — `[area]` 로 옮겼다.
- `src/shared/types/access.ts` — `AccessTokenDecodeType`(예전 JWT 내용) · `AccessTokenContextType` 은 쓰는 곳이 없어진다.
- `src/app/(user)/login/LoginContent.tsx` · `dto.ts` · `dto.test.ts` — 예전 아이디 로그인(사용자 결정).

```tsx
// src/app/(user)/login/page.tsx
import EmptyState from '@/shared/components/ui/display/EmptyState';

// U5 로그인 — /login (카카오 · 네이버 로그인은 Phase 5 에서 만든다)
export default function Login(): React.ReactNode {
    return (
        // 자리 표시
        <EmptyState title="로그인 화면을 준비하고 있습니다" description="카카오 · 네이버 로그인으로 곧 열립니다." />
    );
}
```

### lint 정리 (사용자 lint 결과 — 동작은 그대로)

이 Phase 가 지우거나 다시 쓰는 파일(`LoginContent` · `dto.ts` · 쿠키 route 3개 · `cookie.ts`)의 오류는 그것으로 없어진다. 나머지:

```tsx
// src/shared/components/Editor.tsx — 값을 state 로 옮겨 두던 effect 2개(set-state-in-effect · exhaustive-deps)를 없애고 부모 값을 그대로
/**
 * 편집기 — 값은 부모가 들고, 바뀌면 setFunction(html)
 *
 * @param param0
 * @returns
 */
export function QuillEditor({value, maxHeight = 500, marginBottom = 50, setFunction}: QuillEditorProps): React.ReactNode {
    return (
        // 편집기
        <ReactQuill
            theme="snow"
            value={value}
            onChange={setFunction}
            modules={modules}
            formats={formats}
            style={{height: `${maxHeight}px`, marginBottom: `${marginBottom}px`}}
        />
    );
}
```

```tsx
// src/shared/components/Timer.tsx — 선언 전 사용(createText) · exhaustive-deps → 효과 안에서 interval 콜백으로
'use client';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

type TimerProps = {
    time: string;            // 끝나는 시각
    closeFunc?: () => void;  // 시간이 다 되면 호출
};

/**
 * 남은 시간(mm:ss) 표시
 *
 * @param param0
 * @returns
 */
export default function Timer({time, closeFunc}: TimerProps): React.ReactNode {
    // 상태
    const [text, setText] = useState<string>('00:00'); // 남은 시간 mm:ss

    // 효과
    useEffect(() => {
        // 0.3초마다 남은 시간을 다시 그리고, 다 되면 멈추고 closeFunc
        const interval = setInterval(() => {
            const remainSeconds = dayjs(time).diff(dayjs(), 'second');
            if (remainSeconds >= 0) {
                const minute = Math.floor(remainSeconds / 60).toString().padStart(2, '0');
                const second = Math.floor(remainSeconds % 60).toString().padStart(2, '0');
                setText(`${minute}:${second}`);
            } else {
                clearInterval(interval);
                closeFunc?.();
            }
        }, 300);

        return () => {
            clearInterval(interval);
        };
    }, [time, closeFunc]);

    return (
        // 남은 시간
        <span style={{padding: '5px'}}>{text}</span>
    );
}
```

```ts
// src/shared/hooks/useCheckboxGroup.ts — set-state-in-effect → 렌더 중에 목록 바뀜을 맞춘다, any → unknown, useCallback 제거(React Compiler)
'use client';
import { ChangeEvent, ChangeEventHandler, useState } from 'react';

type CheckboxValue = string | number;

export type UseCheckboxGroupType = {
    isAllSelected: boolean;
    selected: Array<CheckboxValue>;
    toggle: ChangeEventHandler<HTMLInputElement>;
    toggleAll: ChangeEventHandler<HTMLInputElement>;
};

/**
 * 체크박스 그룹 체크/체크해제
 * - 각 체크박스에 data-id={item[key]} 를 붙인다. data-id 는 문자열이라, 목록의 원래 값(숫자 등)으로 바꿔서 selected 에 담는다
 * - 목록이 바뀌면 선택을 비운다
 *
 * @param list 목록
 * @param key 목록 항목에서 값으로 쓸 키
 */
export default function useCheckboxGroup<T extends Record<string, unknown>>(list: Array<T>, key: keyof T & string): UseCheckboxGroupType {
    // 상태
    const [isAllSelected, setIsAllSelected] = useState<boolean>(false); // 전체 선택여부
    const [selected, setSelected] = useState<Array<CheckboxValue>>([]); // 선택된 값
    const [prevList, setPrevList] = useState<Array<T>>(list);           // 직전 목록 — 바뀌면 선택을 비운다

    // 목록이 바뀌면 선택 초기화 — 렌더 중에 맞춘다(effect 로 하면 한 번 더 그린다)
    if (list !== prevList) {
        setPrevList(list);
        setIsAllSelected(false);
        setSelected([]);
    }

    // 함수
    function toggle(event: ChangeEvent<HTMLInputElement>): void {
        const id = event.target.dataset.id;
        if (selected.some((value) => String(value) === id)) {
            setIsAllSelected(false);
            setSelected(selected.filter((value) => String(value) !== id));
        } else {
            const item = list.find((e) => String(e[key]) === id);
            const value = (item ? item[key] : id) as CheckboxValue;
            setIsAllSelected(list.length === selected.length + 1);
            setSelected([...selected, value]);
        }
    }

    function toggleAll(): void {
        if (isAllSelected) {
            setIsAllSelected(false);
            setSelected([]);
        } else {
            setIsAllSelected(true);
            setSelected(list.map((e) => e[key] as CheckboxValue));
        }
    }

    return {isAllSelected, selected, toggle, toggleAll};
}
```

`useInput` 계열 5개 — `useCallback` 의 빠진 의존성(exhaustive-deps) 경고: React Compiler 가 메모를 맡으므로 `useCallback` 을 걷어내고 보통 함수로(구조 규칙 — 상태 > 함수, 영역 주석). 바깥 모양(반환 타입 · 값)은 그대로.

```ts
// src/shared/hooks/useInput.ts
import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useState } from 'react';

export type UseInputType = {
    value: string;
    onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
    setValue: Dispatch<SetStateAction<string>>;
    resetValue: () => void;
};

/**
 * 글자 입력
 *
 * @param initValue 처음 값 · 초기화 값
 */
export default function useInput(initValue: string = ''): UseInputType {
    // 상태
    const [value, setValue] = useState<string>(initValue); // 입력 값

    // 함수
    function onChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void {
        setValue(event.target.value);
    }

    function resetValue(): void {
        setValue(initValue);
    }

    return {value, onChange, setValue, resetValue};
}
```

```ts
// src/shared/hooks/useInputDate.ts
import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useState } from 'react';

type DatePart = 'Y' | 'M' | 'D';

export type UseInputDateType = {
    value: string;
    filter: DatePart[];
    onChange: ChangeEventHandler<HTMLInputElement>;
    setValue: Dispatch<SetStateAction<string>>;
    resetValue: () => void;
};

/**
 * 날짜 입력 — 숫자만 받아 YYYYMMDD 를 dot 구분자로 잇는다. filter 로 쓸 자리(년 · 월 · 일)를 고른다
 *
 * @param dot 구분자
 * @param filter 쓸 자리
 * @param initValue 처음 값 · 초기화 값
 */
export default function useInputDate(dot: string, filter: DatePart[], initValue: string = ''): UseInputDateType {
    // 상태
    const [value, setValue] = useState<string>(initValue); // 입력 값

    // 함수
    function onCreate(changeValue: string): string {
        const digits = changeValue.toString().replace(/[^0-9]/g, '').substring(0, 8);
        const year = digits.substring(0, 4);
        const month = digits.substring(4, 6);
        const day = digits.substring(6, 8);

        const result: Array<string> = [];
        if (year && filter.includes('Y')) {
            result.push(year);
        }
        if (month && filter.includes('M')) {
            result.push(month);
        }
        if (day && filter.includes('D')) {
            result.push(day);
        }

        return result.join(dot);
    }

    function onChange(event: ChangeEvent<HTMLInputElement>): void {
        setValue(onCreate(event.target.value));
    }

    function resetValue(): void {
        setValue(onCreate(initValue));
    }

    return {value, filter, onChange, setValue, resetValue};
}
```

```ts
// src/shared/hooks/useInputFloat.ts
import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useState } from 'react';

export type UseInputFloatType = {
    value: string | number;
    onChange: ChangeEventHandler<HTMLInputElement>;
    setValue: Dispatch<SetStateAction<string | number>>;
    resetValue: () => void;
};

/**
 * 실수 입력 (숫자 · 소수점 하나만 허용)
 *
 * @param isNumberString 문자열로 들고 있을지
 * @param initValue 처음 값 · 초기화 값
 */
export default function useInputFloat(isNumberString: boolean, initValue: string | number = 0): UseInputFloatType {
    // 상태
    const [value, setValue] = useState<string | number>(initValue); // 입력 값

    // 함수
    function onCreate(changeValue: string | number): void {
        const text = changeValue.toString().replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        if (text === '' || text === '.') {
            setValue(0);
        } else if (isNumberString || /\.(\d*0)?$/.test(text)) {
            // 문자열로 받거나, 입력 중인 소수("1." · "1.0")는 숫자로 바꾸면 점 · 0 이 사라지므로 그대로 둔다
            setValue(text);
        } else {
            setValue(parseFloat(text));
        }
    }

    function onChange(event: ChangeEvent<HTMLInputElement>): void {
        onCreate(event.target.value);
    }

    function resetValue(): void {
        onCreate(initValue);
    }

    return {value, onChange, setValue, resetValue};
}
```

```ts
// src/shared/hooks/useInputNumber.ts
import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useState } from 'react';

export type UseInputNumberType = {
    value: string | number;
    onChange: ChangeEventHandler<HTMLInputElement>;
    setValue: Dispatch<SetStateAction<string | number>>;
    resetValue: () => void;
};

/**
 * 정수 입력 (숫자 외 문자는 지운다)
 *
 * @param isNumberString 문자열로 들고 있을지
 * @param initValue 처음 값 · 초기화 값
 */
export default function useInputNumber(isNumberString: boolean, initValue: string | number = 0): UseInputNumberType {
    // 상태
    const [value, setValue] = useState<string | number>(initValue); // 입력 값

    // 함수
    function onCreate(changeValue: string | number): void {
        const digits = changeValue.toString().replace(/[^0-9]/g, '');
        if (digits === '') {
            setValue(0);
        } else if (isNumberString) {
            setValue(digits);
        } else {
            setValue(parseInt(digits, 10));
        }
    }

    function onChange(event: ChangeEvent<HTMLInputElement>): void {
        onCreate(event.target.value);
    }

    function resetValue(): void {
        onCreate(initValue);
    }

    return {value, onChange, setValue, resetValue};
}
```

```ts
// src/shared/hooks/useInputTime.ts
import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useState } from 'react';

export type UseInputTimeType = {
    value: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
    setValue: Dispatch<SetStateAction<string>>;
    resetValue: () => void;
};

/**
 * 시간 입력 — 숫자만 받아 HH:mm:ss 로 잇는다. level 로 입력 자리수(시 · 분 · 초)를 정한다
 *
 * @param level 입력 자리
 * @param initValue 처음 값 · 초기화 값
 */
export default function useInputTime(level: 'HOUR' | 'MINUTE' | 'SECOND', initValue: string = ''): UseInputTimeType {
    // 변수
    const size: number = level === 'HOUR' ? 2 : (level === 'MINUTE' ? 4 : 6); // 받을 숫자 수

    // 상태
    const [value, setValue] = useState<string>(initValue); // 입력 값

    // 함수
    function onCreate(changeValue: string): string {
        const digits = changeValue.toString().replace(/[^0-9]/g, '').substring(0, size);
        const hour = digits.substring(0, 2);
        const minute = digits.substring(2, 4);
        const second = digits.substring(4, 6);

        const result: Array<string> = [];
        if (hour) {
            result.push(hour);
        }
        if (minute) {
            result.push(minute);
        }
        if (second) {
            result.push(second);
        }

        return result.join(':');
    }

    function onChange(event: ChangeEvent<HTMLInputElement>): void {
        setValue(onCreate(event.target.value));
    }

    function resetValue(): void {
        setValue(onCreate(initValue));
    }

    return {value, onChange, setValue, resetValue};
}
```

```ts
// src/shared/components/KakaoMap.tsx · src/shared/utils/address.ts — 외부 SDK 전역(타입 패키지 없음)만 any 허용
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 카카오 지도 SDK 전역(타입 패키지 없음)
        kakao: any;
    }
}

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 다음 우편번호 SDK 전역(타입 패키지 없음)
        daum: any;
    }
}
```

```ts
// src/app/api/auth/[...nextauth]/route.ts — profile any → 쓰는 필드만 타입, 쓰지 않는 catch 변수
            if (account.provider === 'naver') {
                const naverProfile = profile as {response?: {id?: string; name?: string}};

            } else if (account.provider === 'kakao') {
                const kakaoProfile = profile as {name?: string; kakao_account?: {profile?: {nickname?: string}}};

            } catch {
                return false; // 에러 시 명시적 반환 추가
            }
```

```ts
// src/app/api/cookie/sns/route.ts — 쓰지 않는 catch 변수 2곳
    } catch {
        return new Response(JSON.stringify({ success: false }), {headers});
    }
```

### 테스트 위치 (사용자 요청)

테스트는 `src/test/` 아래 src 와 같은 경로에 둔다. 대상은 별칭(`@/…`)으로 import — `src/test` 는 import 방향 규칙 밖이라 어느 계층이든 시험할 수 있다. vitest 수집 범위(`src/**/*.test.{ts,tsx}`)는 그대로.

| 지금 | 옮길 곳 |
|---|---|
| `src/shared/api/{error,queue,request,sse}.test.ts` | `src/test/shared/api/` |
| `src/shared/components/ui/modal/{ReasonModal,RouteModal}.test.tsx` | `src/test/shared/components/ui/modal/` |
| `src/shared/components/ui/nav/Pagination.test.tsx` | `src/test/shared/components/ui/nav/` |
| `src/shared/utils/util.test.ts` | `src/test/shared/utils/` |
| `src/app/(user)/login/dto.test.ts` | 삭제(예전 로그인) |

```ts
// 예 — src/test/shared/api/request.test.ts 머리
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, ApiError, NetworkError, request, UNREADABLE_FAIL_MESSAGE } from '@/shared/api/request';
```

### 문서 (초안 — `<!-- beaver:draft based on planning · unconfirmed before ship -->`)

```md
<!-- AGENTS.md -->
⚠️ 줄 — 예전 백엔드 인증(단일 토큰) 문구 삭제, "영역마다 토큰 따로" 는 코드에 반영됨으로.
## Auth
- 주소로 영역을 안다 — `areaOf(pathname)`(`src/shared/utils/area.ts`): `/manager…` manager · `/admin…` admin · 그 밖 user. 영역마다 토큰이 따로(쿠키 `<area>_access_token` · `<area>_refresh_token`, httpOnly).
- `RootLayoutContent` 가 주소가 바뀔 때마다 그 영역 토큰을 확인한다(`GET /api/cookie/<area>/` — 없거나 곧 만료면 재발급) → `RootLayoutLoadingContext` · `AuthContext`({area, token, isLogin, setToken, onExpired, logout}).
- 로그인이 필요한 API 는 contracts 함수가 `withAuth(auth, (token) => request · callQueue(…))` — 401 이면 재발급 한 번 · 재시도, 또 401 이면 그 영역 로그인 화면(`?return_url=`).
- 로그인 결과는 `saveAreaTokens(area, tokens)`, 로그아웃은 `auth.logout()`(로그아웃 API 없음). 로그인 화면은 `safeReturnPath(return_url, area)` 로 돌아갈 주소를 읽는다.
- 로그인이 필요한 영역 layout 은 `<AuthGuard>` 로 감싼다(영역 로그인 주소는 주소로 안다).
## Error & Response
- 오류는 브라우저 alert 대신 오류 팝업(`showErrorPopup` — `src/shared/utils/error-popup.ts`, 루트 `ErrorPopup` 하나). `handleApiError` — `validation_errors` 는 칸 옆(없으면 팝업), `NetworkError` 는 네트워크 문구, 그 밖은 일반 문구(개발 때만 원문), 취소 · 로그인 만료는 무시.
## Testing
- 테스트는 `src/test/<src 와 같은 경로>/<대상>.test.ts(x)`, 대상은 `@/…` 로 import.
## Checklist
- [ ] 로그인이 필요한 API 는 `withAuth(auth, …)` 로 부른다 · 로그인이 필요한 영역 layout 은 `<AuthGuard>`
- [ ] 오류는 `alert` 대신 `showErrorPopup` · `handleApiError`
- [ ] 테스트는 `src/test/` 아래 같은 경로
```

- `docs/data-layer.md` — "토큰 쿠키 — route handler" 표를 영역 쿠키 · `[area]` route 로, "전역 상태" 를 `AuthContext` 로, `localStorage.saveId` · `sessionStorage.referer` 줄 삭제.
- `docs/error-handling.md` — 화면 패턴 · 기준표의 alert → 오류 팝업, `NetworkError` · `LoginRequiredError` · 기타 오류, Phase 2 의 "주의"(코드 오류도 네트워크 문구) 삭제.
- `docs/testing.md` — 위치를 `src/test/`, 근거 경로 갱신, route handler 시험 방법(`vi.mock('next/headers')` · 가짜 cookieStore).
- `docs/architecture.md` — 트리(`src/test/` · `app/api/cookie/[area]` · `token-cookie.ts` · `contracts/{user,manager,admin}` · `shared/types/access.ts` 삭제), Auth 흐름.
- `docs/conventions.md` — `LoginContent` 를 근거로 든 곳을 다른 파일로(`UiPreviewContent` · `Field` · `contracts/*/dto` · `pagination.dto.ts`), 외부 SDK 전역 `any` 예외.

---

## Test Cases

테스트 위치: `src/test/<src 와 같은 경로>`. API · 영역 · 쿠키 · route handler 테스트는 `// @vitest-environment node`(fetch · `next/headers` mock — 실제 네트워크 · 쿠키 없음), 컴포넌트(`AuthGuard` · `ErrorPopup`)와 `handleApiError`(칸 span)는 jsdom. 오류 팝업은 `@/shared/utils/error-popup` 을 `vi.mock` 해 `showErrorPopup` 호출을 확인한다. 케이스 이름 `[SUCCESS]`/`[FAIL:<이유>]`, 호출 횟수 · 인자 · 실패 뒤 미호출을 확인한다.

```
[CASES:areaOf] '/' · '/stores/1/' → user
[CASES:areaOf] '/manager' · '/manager/abc/login/' → manager, '/admin/' → admin
[CASES:areaOf] '/managerX/' · '/administrator' → user
[CASES:loginUrl] ('user', '/stores/1/?date=2026-11-20') → '/login/?return_url=%2Fstores%2F1%2F%3Fdate%3D2026-11-20'
[CASES:loginUrl] ('manager', '/manager/rooms/') → '/manager/login/?return_url=%2Fmanager%2Frooms%2F'
[CASES:loginUrl] ('admin', null) → '/admin/login/', ('user', '/login/') → '/login/'(자기 자신은 넣지 않음)
[CASES:safeReturnPath] ('/stores/1/', 'user') → '/stores/1/'
[CASES:safeReturnPath] ('//evil.com/', 'user') → '/', ('https://evil.com/', 'manager') → '/manager/', ('/\\evil.com', 'admin') → '/admin/', (null, 'user') → '/'
[CASES:withAuth] 첫 호출 성공 → 결과 · call 1회 · 재발급 0회
[CASES:withAuth] 401 → 재발급 'new' → call 두 번째는 'new' 로 성공 · setToken('new') 1회
[CASES:withAuth] 401 → 재발급 실패 → onExpired 1회 · LoginRequiredError · call 1회(재시도 없음)
[CASES:withAuth] 401 → 재발급 → 재시도도 401 → 그 영역 쿠키 삭제 1회 · setToken(null) · onExpired 1회 · LoginRequiredError
[CASES:withAuth] 400 · NetworkError → 그대로 던짐 · 재발급 0회
[CASES:refreshAreaToken] 같은 영역 두 번이 동시에 → /api/cookie/<area>/refresh fetch 1회 · 둘 다 같은 토큰
[CASES:token-cookie] setTokenCookies('manager', 토큰) → manager_access_token 만료 = access_token_expires_at − 60초, manager_refresh_token 만료 = refresh_token_expires_at, httpOnly · path /
[CASES:token-cookie] refreshTokens('user' · 'manager' · 'admin', 'r') → 각 영역 token-refresh 주소로 POST 본문 {"refresh_token":"r"} 1회
[CASES:token-cookie] 재발급 401 → null
[CASES:token-cookie] GET /api/cookie/user — access 없음 · refresh 있음 → 재발급 → 두 쿠키 새로 · data 새 access
[CASES:token-cookie] GET — 두 쿠키 다 없음 → {success: false} · fetch 0회, 없는 영역 staff → {success: false}
[CASES:AuthGuard] 확인 중 → Loading · 이동 없음
[CASES:AuthGuard] 로그인 안 됨(/manager/rooms/) → router.replace('/manager/login/?return_url=%2Fmanager%2Frooms%2F') 1회 · 내용 안 그림
[CASES:AuthGuard] 로그인 → 내용 · 이동 없음
[FAIL:network] request — fetch TypeError → NetworkError, AbortError → 그대로
[FAIL:network] callQueue — 스트림을 읽다 끊김 → NetworkError
[FAIL:validation] handleApiError — validation_errors 칸 있음 → 칸에 메시지 · 팝업 없음 · 이전 칸 오류 지움
[FAIL:validation] handleApiError — 맞는 칸 없음 · validation_errors: null → showErrorPopup(message) 1회
[FAIL:network] handleApiError — NetworkError → 네트워크 문구 팝업 1회
[FAIL:unknown] handleApiError — 그 밖의 Error → 일반 문구 팝업(개발이면 원문 detail) 1회 · console.error
[FAIL:abort] handleApiError — AbortError · LoginRequiredError → 팝업 없음
[CASES:ErrorPopup] showErrorPopup('x') → 팝업에 x, 확인 → 닫힘, 열린 채 'y' → y 로 바뀜

테스트 생략(위임형): cookie.ts 의 나머지 함수(route handler 호출만) · contracts api 3개(token-cookie 테스트가 주소 · 본문 확인) · RootLayoutContent(Provider 배선) · lint 정리(동작 그대로) · /login 자리 표시
```

---

## Response Codes

| 결과 | 원인 |
|------|------|
| `GET /api/cookie/[area]` → `{success: true, data: access}` | access 쿠키 있음, 또는 refresh 쿠키로 재발급 성공(두 쿠키 새로 저장) |
| `GET /api/cookie/[area]` → `{success: false}` | 없는 영역 · 두 쿠키 없음 · 재발급 실패(두 쿠키 삭제) |
| `POST /api/cookie/[area]` → `{success: true}` / `{success: false}` | 토큰 저장 / 없는 영역 · 본문에 토큰 없음 · 본문이 JSON 아님 |
| `DELETE /api/cookie/[area]` → `{success: true}` / `{success: false}` | 그 영역 두 쿠키 삭제 / 없는 영역 |
| `POST /api/cookie/[area]/refresh` → `{success: true, data}` / `{success: false}` | 재발급 성공 / 없는 영역 · refresh 쿠키 없음 · 재발급 실패(두 쿠키 삭제) |
| `withAuth` → `T` | 첫 호출 성공, 또는 401 → 재발급 → 재시도 성공 |
| `withAuth` → `LoginRequiredError` | 재발급 실패, 또는 재시도도 401 — 그 영역 토큰 삭제 · `onExpired()`(로그인 화면) |
| `withAuth` → 그대로 던짐 | 401 이 아닌 실패(`ApiError` 400 · 403 · 404 · 500 · 503, `NetworkError`, `AbortError`) |
| `request` · `callQueue` → `NetworkError` | 응답 없는 실패 · 큐 스트림 끊김 |
| `handleApiError` | 칸 옆 표시 / 팝업(`message` · 네트워크 문구 · 일반 문구 + 개발 원문) / 아무것도 안 함(취소 · 로그인 만료) |
| `AuthGuard` | 확인 중 · 로그인 안 됨 → `Loading`(로그인 안 됨이면 `router.replace(loginUrl)` 1회) / 로그인 → 내용 |
