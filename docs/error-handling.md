# Error Handling

## Basic Principles

- 화면에서 API 를 부르는 곳은 `try/catch` 로 감싸고 catch 에서 `await axiosErrorHandle(error)` (`src/features/user/login/LoginContent.tsx:47-63`).
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
근거: `src/app/api/cookie/access/route.ts:100-125`, `src/app/api/cookie/logout/route.ts`. 상태 코드는 항상 200, 성패는 본문 `success`. 데이터는 `data` 키 (`access/route.ts:36,39`).

클라이언트 쪽 짝 (`src/shared/api/cookie.ts:45-56`):
```ts
try {
    const response = await axios.get(`/api/cookie/access`);
    return response.data.success ? response.data.data : null;
} catch (error) {
    return null;
}
```

## 화면 (Content) 패턴

```ts
const dto = new LoginDto({login_id: loginId.value, login_pw: loginPw.value});
if (await validateAction(dto)) {          // 1) 화면 검증 — 실패면 칸 옆에 표시하고 끝
    try {
        const response = await axios.post(url, dto);
        // …
    } catch (error) {
        await axiosErrorHandle(error);    // 2) 서버 실패 — validationErrors 는 칸 옆, 없으면 alert(message)
    }
}
```
근거: `LoginContent.tsx:44-63`. `axiosErrorHandle(error, isReset = true)` — `error.status` 가 없으면(네트워크 오류 등) 아무것도 하지 않는다 (`src/shared/api/axios-error.ts:10-13`).

## Criteria for Including validationErrors

| 경우 | 칸 옆 표시 | 근거 |
|---|---|---|
| 화면 DTO 검증 실패 (class-validator) | ✅ `validateAction` → 칸이 없으면 첫 메시지를 `alert` | `src/shared/utils/validation.ts:85-101` |
| 서버 입력 검증 실패 (응답에 검증 목록) | ✅ `axiosErrorHandle` → 칸이 없고 `message` 가 있으면 `alert` | `src/shared/api/axios-error.ts:16-24` |
| 업무 규칙 · 서버 오류 (검증 목록 없음) | ❌ `alert(message)` | `axios-error.ts:25-26` |
| 칸 이름에 점 경로(`hours.0.open_time`) | ✅ 선택자 escape 로 그대로 찾는다 | `validation.ts:16-23` |

## Response Wrapper / Status Codes

- **route handler**: 200 + `{success: boolean, data?}` (위).
- **백엔드 — 지금 코드**: 실패 본문의 `message` · `validationErrors`(camelCase), 401 판단은 본문 `statusCode` (`src/shared/api/axios.ts:29`, `axios-error.ts:15-16`).
- **백엔드 — 지침서** (frontend/api.md "실패"): 동기 실패 본문과 큐 `failed` data 가 같은 모양 `{message, validation_errors, …}` (`ApiFailResultDto` — frontend/dto/common.md:95). `validation_errors` 는 `[{property, message}]`, `null` 이면 `message` 를 띄운다. 기능별 추가 필드: 정지 계정 `block_comment`, 결제 실패 `payment_error_code`. <!-- TODO: axios-error 를 snake_case · 큐 failed 에 맞춘다 -->

| 상태 | 뜻 (지침서) | 화면 처리 |
|---|---|---|
| 400 | 입력 · 규칙 위반 | 칸 옆 표시 또는 `alert(message)` |
| 401 | 로그인 필요 · 토큰 만료 | 그 영역 재발급 한 번 → 또 401 이면 그 영역 로그인 화면 |
| 403 | 권한 · 정지 | `alert(message)` (정지면 `block_comment`) |
| 404 | 없음 | `alert(message)` |
| 503 | 외부 연동(문자 · 파일 · 결제 · 문) 잠시 안 됨 | 잠시 뒤 다시 |
| 500 | 서버 오류 | `alert(message)` |
