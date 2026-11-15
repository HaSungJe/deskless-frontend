# Error Handling

## Basic Principles

- 화면에서 API 를 부르는 곳은 `try/catch` 로 감싸고 catch 에서 `handleApiError(error)` (`src/shared/api/error.ts`). 예전 아이디 로그인도 같다 (`src/app/(user)/login/LoginContent.tsx:62-81`).
- 사용자에게는 칸 옆 오류(`<span data-type="validation-alert">`) 또는 `alert(message)` 로만 보여 준다. 따로 오류 화면 · error boundary · 토스트는 없다.
- 메시지는 백엔드 응답 `message` · 검증 메시지(DTO 의 한국어 `message`) 를 그대로 쓴다 — 프론트에 메시지 상수 · i18n 은 없다.
- route handler 와 쿠키 함수는 던지지 않는다 — 실패를 `{success: false}` · `null` · `false` 로 돌려준다.

## route handler (데이터 경계) 패턴

```ts
const headers = { 'Content-Type': 'application/json' };

export async function POST(request: Request): Promise<Response> {
    try {
        // … cookieStore.set(...)
        return new Response(JSON.stringify({ success: true }), { headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false }), { headers });
    }
}
```
근거: `src/app/api/cookie/access/route.ts:100-125`, `src/app/api/cookie/logout/route.ts`. 상태 코드는 항상 200, 성패는 본문 `success`. 데이터는 `data` 키 (`access/route.ts:34,37`).

클라이언트 쪽 짝 (`src/shared/api/cookie.ts:16-33`) — 실패(네트워크 · 2xx 아님 · JSON 아님)는 던지지 않고 `null`:
```ts
async function callCookieRoute<T>(url: string, method: string = 'GET', body?: unknown): Promise<RouteResultType<T> | null> {
    try {
        const response = await fetch(url, {method, headers: …, body: …});
        if (!response.ok) {
            return null;
        }
        return (await response.json()) as RouteResultType<T>;
    } catch {
        return null;
    }
}

// getAccessToken — result?.success ? result.data ?? null : null
```

## 화면 (Content) 패턴

```ts
const dto = plainToInstance(StoreMineUpdateDto, values); // (Phase 5 부터 class-transformer)
if (await validateAction(dto)) {                          // 1) 화면 검증 — 실패면 칸 옆에 표시하고 끝
    try {
        const store = await updateMyStore(dto, token);    // contracts/store/api.ts → callQueue
        if (store === null) {                             // pending(30초 초과) — 처리됐을 수 있으니 다시 조회
            await reload();
            return;
        }
        // …
    } catch (error) {
        handleApiError(error);                            // 2) 서버 실패 — validation_errors 는 칸 옆, 없으면 alert(message)
    }
}
```
`handleApiError(error, isReset = true)` (`src/shared/api/error.ts`) — 예전 `axiosErrorHandle`(삭제)과 같은 분담에 두 가지가 다르다(선택: 사용자 2026-11-15): 응답이 없는 실패(fetch `TypeError`)는 `alert("서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.")`(`NETWORK_ERROR_MESSAGE`), 화면이 취소한 요청(`AbortError`)은 보여 주지 않는다. `await` 하지 않는 동기 함수.
- 주의: `ApiError` 가 아닌 오류는 모두 고정 문구로 띄운다 — 요청이 성공한 뒤 같은 `try` 안에서 난 코드 오류도 "서버에 연결할 수 없습니다" 로 보인다(`console.error` 에는 원래 오류). Phase 3 에서 `request` · `callQueue` 를 감쌀 때 fetch 실패만 따로(`NetworkError`) 나눈다. 그때까지 요청 뒤 코드는 되도록 `try` 밖에 둔다.

## Criteria for Including validation_errors

| 경우 | 칸 옆 표시 | 근거 |
|---|---|---|
| 화면 DTO 검증 실패 (class-validator) | ✅ `validateAction` → 칸이 없으면 첫 메시지를 `alert` | `src/shared/utils/validation.ts:85-101` |
| 서버 입력 검증 실패 (`validation_errors` 있음) | ✅ `handleApiError` → 이전 칸 오류를 지우고 표시, 맞는 칸이 없으면 `alert(message)` | `src/shared/api/error.ts` |
| 업무 규칙 · 서버 오류 (`validation_errors: null`) | ❌ `alert(message)` | `src/shared/api/error.ts` |
| 응답이 없는 실패 · 본문이 JSON 이 아님 | ❌ 고정 문구 alert · `alert("서버 응답을 읽을 수 없습니다.")` | `error.ts` · `request.ts` |
| 칸 이름에 점 경로(`hours.0.open_time`) | ✅ 선택자 escape 로 그대로 찾는다 | `validation.ts:16-23` |

## Response Wrapper / Status Codes

- **route handler**: 200 + `{success: boolean, data?}` (위).
- **백엔드 — 지침서** (frontend/api.md "실패"): 동기 실패 본문과 큐 `failed` data 가 같은 모양 `{message, validation_errors, …}` (`ApiFailResultDto` — `src/contracts/common/fail-result.dto.ts`). `request` · `callQueue` 는 이것을 `ApiError(status, body)` 로 던진다 — 큐 `failed` 는 `status_code` 가 상태. `validation_errors` 는 `[{property, message}]`, `null` 이면 `message` 를 띄운다. 기능별 추가 필드(정지 계정 `block_comment`, 결제 실패 `payment_error_code`)는 `ApiError.body` 에 그대로 있다.

| 상태 | 뜻 (지침서) | 화면 처리 |
|---|---|---|
| 400 | 입력 · 규칙 위반 | 칸 옆 표시 또는 `alert(message)` |
| 401 | 로그인 필요 · 토큰 만료 | 그 영역 재발급 한 번 → 또 401 이면 그 영역 로그인 화면 (Phase 3 — 지금은 `ApiError(401)` → `alert(message)`) |
| 403 | 권한 · 정지 | `alert(message)` (정지면 `block_comment`) |
| 404 | 없음 | `alert(message)` |
| 503 | 외부 연동(문자 · 파일 · 결제 · 문) 잠시 안 됨 | 잠시 뒤 다시 |
| 500 | 서버 오류 | `alert(message)` |
