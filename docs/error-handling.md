# Error Handling

## Basic Principles

- 화면에서 API 를 부르는 곳은 `try/catch` 로 감싸고 catch 에서 `handleApiError(error)` (`src/shared/api/error.ts`).
- 사용자에게는 칸 옆 오류(`<span data-type="validation-alert">`) 또는 오류 팝업(`showErrorPopup` — 루트 `ErrorPopup` 하나, 제목 "알림" · 확인)으로만 보여 준다. 브라우저 `alert` 는 쓰지 않는다(사용자 2026-11-15). 따로 오류 화면 · error boundary · 토스트는 없다.
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
근거: `src/app/api/cookie/[area]/route.ts:32-49`, `src/app/api/route-util.ts:15`(`json`). 상태 코드는 항상 200, 성패는 본문 `success`. 데이터는 `data` 키 (`[area]/route.ts:20`). 결제 승인(`src/app/api/payments/confirm/route.ts`)은 실패 문구를 `message`, 토스 오류 코드를 `code`, 잠시 뒤 다시면 `retry: true` 로 준다.

클라이언트 쪽 짝 (`src/shared/api/cookie.ts:37-54`) — 실패(네트워크 · 2xx 아님 · JSON 아님)는 던지지 않고 `null`:
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

// getAreaToken — result?.success ? result.data ?? null : null
```

## 화면 (Content) 패턴

```ts
const dto = plainToInstance(StoreMineUpdateDto, values); // (Phase 5 부터 class-transformer)
if (await validateAction(dto)) {                          // 1) 화면 검증 — 실패면 칸 옆에 표시하고 끝
    try {
        const store = await updateMyStore(auth, dto);     // contracts/store/api.ts → withAuth(auth, (token) => callQueue(…))
        if (store === null) {                             // pending(30초 초과) — 처리됐을 수 있으니 다시 조회
            await reload();
            return;
        }
        // …
    } catch (error) {
        handleApiError(error);                            // 2) 서버 실패 — validation_errors 는 칸 옆, 없으면 오류 팝업
    }
}
```
`handleApiError(error, isReset = true)` (`src/shared/api/error.ts:21`) — `await` 하지 않는 동기 함수(선택: 사용자 2026-11-15).

| 받은 오류 | 보여 주는 것 |
|---|---|
| `ApiError` + `validation_errors` | 이전 칸 오류를 지우고 칸 옆에, 맞는 칸이 없으면 `message` 팝업 |
| `ApiError` (`validation_errors: null`) | `message` 팝업 |
| `NetworkError`(응답 없는 실패 · 큐 스트림 끊김 · 401 뒤 재발급의 일시 실패 — 로그인은 그대로) | "서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요." 팝업(`NETWORK_ERROR_MESSAGE`) |
| 그 밖의 오류(코드 오류 등) | "처리 중 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요."(`UNKNOWN_ERROR_MESSAGE`) + 개발 환경에서만 원문 · `console.error` |
| `AbortError` · `LoginRequiredError` | 아무것도(화면이 취소 · 이미 로그인 화면으로 보냄) |

## Criteria for Including validation_errors

| 경우 | 칸 옆 표시 | 근거 |
|---|---|---|
| 화면 DTO 검증 실패 (class-validator) | ✅ `validateAction` → 칸이 없으면 첫 메시지를 오류 팝업 | `src/shared/utils/validation.ts:86-102` |
| 서버 입력 검증 실패 (`validation_errors` 있음) | ✅ `handleApiError` → 이전 칸 오류를 지우고 표시, 맞는 칸이 없으면 `message` 팝업 | `src/shared/api/error.ts` |
| 업무 규칙 · 서버 오류 (`validation_errors: null`) | ❌ `message` 팝업 | `src/shared/api/error.ts` |
| 응답이 없는 실패 · 본문이 JSON 이 아님 | ❌ 네트워크 문구 팝업 · "서버 응답을 읽을 수 없습니다." 팝업 | `error.ts` · `request.ts` |
| 칸 이름에 점 경로(`hours.0.open_time`) | ✅ 선택자 escape 로 그대로 찾는다 | `validation.ts:17-24` |

## Response Wrapper / Status Codes

- **route handler**: 200 + `{success: boolean, data?}` (위).
- **백엔드 — 지침서** (frontend/api.md "실패"): 동기 실패 본문과 큐 `failed` data 가 같은 모양 `{message, validation_errors, …}` (`ApiFailResultDto` — `src/contracts/common/fail-result.dto.ts`). `request` · `callQueue` 는 이것을 `ApiError(status, body)` 로 던진다 — 큐 `failed` 는 `status_code` 가 상태. `validation_errors` 는 `[{property, message}]`, `null` 이면 `message` 를 띄운다. 기능별 추가 필드(정지 계정 `block_comment`, 결제 실패 `payment_error_code`)는 `ApiError.body` 에 그대로 있다.

| 상태 | 뜻 (지침서) | 화면 처리 |
|---|---|---|
| 400 | 입력 · 규칙 위반 | 칸 옆 표시 또는 `message` 팝업 |
| 401 | 로그인 필요 · 토큰 만료 | `withAuth` 가 그 영역 재발급 한 번 → 재시도, 또 401 이면 그 영역 로그인 화면(팝업 없음 — `LoginRequiredError`) |
| 403 | 권한 · 정지 | `message` 팝업 (정지면 `block_comment`) |
| 404 | 없음 | `message` 팝업 |
| 503 | 외부 연동(문자 · 파일 · 결제 · 문) 잠시 안 됨 | 잠시 뒤 다시 |
| 500 | 서버 오류 | `message` 팝업 |
