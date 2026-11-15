---
feature_goal: "이용자 · 매니저 · 관리자 토큰을 영역별 쿠키로 따로 두고, 401 이면 그 영역 재발급 한 번 · 재시도, 또 401 이면 그 영역 로그인 화면으로 — 오류는 전용 팝업으로"
domain: "auth"
roadmap_phase: 3
api_method: "ROUTE · MODULE"
api_path: "GET · POST · DELETE /api/cookie/[area] · POST /api/cookie/[area]/refresh · src/shared/api/auth.ts(withAuth) · src/shared/utils/area.ts · src/shared/components/AuthGuard.tsx · ErrorPopup"
affected_data: ["쿠키 <area>_access_token · <area>_refresh_token (httpOnly)"]
---

## Feature Description
이용자 · 매니저 · 관리자 토큰을 쿠키 이름으로 따로 저장하고, 주소로 영역을 알아 그 영역 토큰으로 API 를 부른다 — 401 이면 그 영역 재발급 한 번 · 재시도, 또 401 이면 그 영역 로그인 화면으로(돌아올 주소와 함께).
오류는 브라우저 alert 대신 오류 전용 팝업 하나로 보여 주고, fetch 실패를 `NetworkError` 로 나눠 코드 오류와 구분한다.
함께: 예전 아이디 로그인 · 단일 토큰 쿠키 삭제, 테스트 파일을 `src/test/` 로 모음, lint 오류 · 경고 0.

## 진입점
- Method: ROUTE(route handler) · MODULE(화면 · contracts 가 부르는 함수) · 공통 컴포넌트
- Path:
  - `GET /api/cookie/[area]` — 그 영역 access 토큰. 없거나 곧 만료면 refresh 쿠키로 재발급해 새 토큰
  - `POST /api/cookie/[area]` — 로그인 결과 토큰 4개(`access_token` · `refresh_token` · `access_token_expires_at` · `refresh_token_expires_at`) 저장
  - `DELETE /api/cookie/[area]` — 로그아웃(그 영역 두 쿠키만 삭제 — 로그아웃 API 는 없다)
  - `POST /api/cookie/[area]/refresh` — 401 뒤 강제 재발급
  - `src/app/api/cookie/token-cookie.ts` — 영역 확인 · 쿠키 이름 · 옵션 · 영역별 재발급(두 route handler 공용)
  - `src/contracts/{user,manager,admin}/dto/<영역>-token-refresh.dto.ts`(지침서 사본) · `src/contracts/{user,manager,admin}/api.ts`(`refreshUserToken` · `refreshManagerToken` · `refreshAdminToken`)
  - `src/shared/utils/area.ts` — `AreaType` · `areaOf(pathname)` · `loginUrl(area, returnPath?)` · `safeReturnPath(raw, area)`
  - `src/shared/api/cookie.ts` — `getAreaToken` · `saveAreaTokens` · `deleteAreaTokens` · `refreshAreaToken`(같은 영역 동시 재발급은 한 번) + SNS 2개 그대로
  - `src/shared/api/auth.ts` — `AuthType` · `withAuth(auth, call)` · `LoginRequiredError`
  - `src/shared/api/request.ts` · `queue.ts` — 응답 없는 실패를 `NetworkError` 로
  - `src/shared/api/error.ts` — `handleApiError` 가 alert 대신 오류 팝업
  - `src/shared/utils/error-popup.ts`(`showErrorPopup` 저장소) · `src/shared/components/ui/modal/ErrorPopup.tsx`(루트에 하나)
  - `src/shared/providers/RootLayoutProvider.tsx` — `RootLayoutLoadingContext` · `AuthContext`
  - `src/app/RootLayoutContent.tsx` — 주소마다 영역 판별 → 그 영역 토큰 확인 · 오류 팝업
  - `src/shared/components/AuthGuard.tsx` — 그 영역 로그인 주소로(돌아올 주소 포함)
- Request: 영역 `user` · `manager` · `admin` / 로그인 결과 토큰 / API 호출 함수 `(token) => request · callQueue`
- Response: route handler 는 200 + `{success, data?}`(`data` = access 토큰). `withAuth` 는 호출 결과 또는 `LoginRequiredError`

## Business Rules
- 영역: 주소가 `/manager` · `/manager/…` 면 manager, `/admin` · `/admin/…` 면 admin, 그 밖은 user (`/managerX` 는 user).
- 쿠키 이름은 `<area>_access_token` · `<area>_refresh_token`(사용자 결정 — 이름으로 나눔). 옵션은 지금 그대로(httpOnly · path `/` · domain `SERVER_DOMAIN` · sameSite · https 면 secure). access 쿠키는 `access_token_expires_at` 60초 전에, refresh 쿠키는 `refresh_token_expires_at` 에 만료.
- `GET`: access 쿠키가 있으면 그 값. 없고 refresh 쿠키가 있으면 그 영역 token-refresh(이용자 `/user-service/user/token-refresh` · 매니저 `/admin-service/manager/token-refresh` · 관리자 `/admin-service/admin/token-refresh`, 본문 `{refresh_token}`) → 두 쿠키 새로 저장 → 새 access. 재발급이 실패하면 그 영역 두 쿠키를 지우고 `{success: false}`. 없는 영역은 `{success: false}`.
- 브라우저가 백엔드를 직접 부른다(사용자 결정 A). 화면은 `AuthContext` 의 auth 를 contracts 함수에 넘기고, 그 함수가 `withAuth(auth, (token) => request · callQueue(…))`.
- `withAuth`: 401 → `refreshAreaToken(area)` 한 번 → 새 토큰으로 한 번 재시도. 재발급 실패 또는 재시도도 401 → 그 영역 쿠키 지움 · `setToken(null)` · `onExpired()`(그 영역 로그인 주소로) · `LoginRequiredError` throw(팝업 없음). 401 이 아닌 실패는 그대로 던진다. 같은 영역 재발급이 동시에 걸리면 한 번만 부르고 결과를 나눈다.
- 로그인 주소: 이용자 `/login/` · 매니저 `/manager/login/`(기억한 업체코드로 보내는 안내 화면 — Phase 10) · 관리자 `/admin/login/`. 돌아올 주소는 query `return_url`(지금 path + query). 돌아올 주소는 `/` 로 시작하고 `//` · `/\` 로 시작하지 않는 같은 사이트 주소만 — 아니면 그 영역 첫 화면(`/` · `/manager/` · `/admin/`). 로그인 화면 자신은 넣지 않는다.
- `AuthGuard`: 확인 중이면 Loading, 로그인 안 됐으면 `router.replace(loginUrl(area, 지금 주소))` 한 번, 로그인했으면 내용. `loginPath` prop 은 없앤다(주소로 영역을 안다).
- 오류 팝업(사용자 결정): 오류 alert 전부를 팝업 하나로 — `handleApiError`(API `message` · 네트워크 · 기타), `validateAction`(칸을 못 찾은 검증 메시지), `CopyButton`(복사 실패). 루트에 하나, 제목 "알림" · 확인 버튼, 열려 있을 때 새 오류가 오면 새 메시지로 바꾼다.
- 기타 오류(API · 네트워크 · 취소 · 로그인 만료가 아닌 것)는 "처리 중 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요." + 개발 환경(`NODE_ENV !== 'production'`)에서만 원문(`error.message`) + `console.error`(사용자 결정).
- `NetworkError`: fetch 가 응답 없이 실패하거나 큐 스트림을 읽다 끊기면. `AbortError` 는 그대로 던진다(화면이 취소한 것 — 팝업 없음).
- 지우는 것: `src/app/api/cookie/access|refresh|logout/route.ts`(→ `[area]`), `src/shared/types/access.ts`, `AccessTokenContext` · `IsLoginContext`, `sessionStorage.referer`(읽는 곳 없음 → `return_url`), `cookie.ts` 옛 함수 6개, 예전 아이디 로그인 `LoginContent.tsx` · `dto.ts` · `dto.test.ts`(사용자 결정 — `/login` 은 Phase 5 까지 자리 표시 화면). 토큰 JWT 복호화는 하지 않는다(만료는 응답의 `*_expires_at`) — `NEXT_PUBLIC_JWT_CODE` 는 SNS 쿠키(`/api/cookie/sns`)에만 남는다.
- 테스트 위치(사용자 요청): `src/test/` 아래 src 와 같은 경로(`src/test/shared/api/request.test.ts`), 대상은 별칭 `@/…` 로 import. 기존 테스트도 옮긴다.
- lint(사용자 실행 결과 오류 16 · 경고 22)를 0 으로: 이 Phase 가 지우거나 다시 쓰는 파일 외에 `Editor` · `Timer` · `useCheckboxGroup` · `useInput` · `useInputDate` · `useInputFloat` · `useInputNumber` · `useInputTime` · `KakaoMap` · `address` · next-auth route · sns route 를 고친다(동작은 그대로). 외부 SDK 전역(`window.kakao` · `window.daum`)의 `any` 는 이유를 단 주석으로 허용.

## TDD Cases
- [CASES:areaOf] `'/'` · `'/stores/1/'` → `user`
- [CASES:areaOf] `'/manager'` · `'/manager/abc/login/'` → `manager`, `'/admin/'` → `admin`
- [CASES:areaOf] `'/managerX/'` · `'/administrator'` → `user`
- [CASES:loginUrl] `('user', '/stores/1/?date=2026-11-20')` → `'/login/?return_url=%2Fstores%2F1%2F%3Fdate%3D2026-11-20'`
- [CASES:loginUrl] `('manager', '/manager/rooms/')` → `'/manager/login/?return_url=%2Fmanager%2Frooms%2F'`
- [CASES:loginUrl] `('admin', null)` → `'/admin/login/'`, `('user', '/login/')` → `'/login/'`(자기 자신은 넣지 않음)
- [CASES:safeReturnPath] `('/stores/1/', 'user')` → `'/stores/1/'`
- [CASES:safeReturnPath] `('//evil.com/', 'user')` → `'/'`, `('https://evil.com/', 'manager')` → `'/manager/'`, `('/\\evil.com', 'admin')` → `'/admin/'`, `(null, 'user')` → `'/'`
- [CASES:withAuth] 첫 호출 성공 → 결과 · call 1회 · 재발급 0회
- [CASES:withAuth] 401 → 재발급 `'new'` → call 두 번째는 `'new'` 로 성공 · `setToken('new')` 1회
- [CASES:withAuth] 401 → 재발급 실패 → `onExpired` 1회 · `LoginRequiredError` · call 1회(재시도 없음)
- [CASES:withAuth] 401 → 재발급 → 재시도도 401 → 그 영역 쿠키 삭제 1회 · `setToken(null)` · `onExpired` 1회 · `LoginRequiredError`
- [CASES:withAuth] 400 · `NetworkError` → 그대로 던짐 · 재발급 0회
- [CASES:refreshAreaToken] 같은 영역 두 번이 동시에 → `/api/cookie/<area>/refresh` fetch 1회 · 둘 다 같은 토큰
- [CASES:token-cookie] `setTokenCookies('manager', 토큰)` → `manager_access_token` 만료 = `access_token_expires_at` − 60초, `manager_refresh_token` 만료 = `refresh_token_expires_at`, httpOnly · path `/`
- [CASES:token-cookie] `refreshTokens('user' · 'manager' · 'admin', 'r')` → 각 영역 token-refresh 주소로 POST 본문 `{"refresh_token":"r"}` 1회
- [CASES:token-cookie] 재발급 401 → `null`
- [CASES:token-cookie] `GET /api/cookie/user` — access 없음 · refresh 있음 → 재발급 → 두 쿠키 새로 · `data` 새 access
- [CASES:token-cookie] `GET` — 두 쿠키 다 없음 → `{success: false}` · fetch 0회, 없는 영역 `staff` → `{success: false}`
- [CASES:AuthGuard] 확인 중 → Loading · 이동 없음
- [CASES:AuthGuard] 로그인 안 됨(`/manager/rooms/`) → `router.replace('/manager/login/?return_url=%2Fmanager%2Frooms%2F')` 1회 · 내용 안 그림
- [CASES:AuthGuard] 로그인 → 내용 · 이동 없음
- [FAIL:network] `request` — fetch `TypeError` → `NetworkError`, `AbortError` → 그대로
- [FAIL:network] `callQueue` — 스트림을 읽다 끊김 → `NetworkError`
- [FAIL:validation] `handleApiError` — `validation_errors` 칸 있음 → 칸에 메시지 · 팝업 없음 · 이전 칸 오류 지움
- [FAIL:validation] `handleApiError` — 맞는 칸 없음 · `validation_errors: null` → `showErrorPopup(message)` 1회
- [FAIL:network] `handleApiError` — `NetworkError` → 네트워크 문구 팝업 1회
- [FAIL:unknown] `handleApiError` — 그 밖의 `Error` → 일반 문구 팝업(개발이면 원문 detail) 1회 · `console.error`
- [FAIL:abort] `handleApiError` — `AbortError` · `LoginRequiredError` → 팝업 없음
- [CASES:ErrorPopup] `showErrorPopup('x')` → 팝업에 `x`, 확인 → 닫힘, 열린 채 `'y'` → `y` 로 바뀜
- 테스트 생략(위임형): `cookie.ts` 의 나머지 함수(route handler 호출만) · contracts api 3개(token-cookie 테스트가 주소 · 본문 확인) · `RootLayoutContent`(Provider 배선) · lint 정리(동작 그대로) · `/login` 자리 표시

## Notes
- 지침서: `frontend/api.md:12-16`(로그인 그룹 셋 · Bearer · 401 재발급 한 번), `frontend/screens.md:39-41`(영역마다 토큰 · 로그아웃 API 없음), `frontend/screens.md:178-182`(매니저 로그인 · 업체코드 기억 — Phase 10), DTO `frontend/dto/user.md:574` · `manager.md:662` · `admin.md:84`.
- 바꾸는 기존 코드: `src/app/api/cookie/access/route.ts`(GET 재발급 · POST 저장 → `[area]` 로 일반화), `refresh/route.ts` · `logout/route.ts`(→ `[area]` POST · DELETE), `src/shared/api/cookie.ts`, `src/app/RootLayoutContent.tsx:17-40`, `src/shared/providers/RootLayoutProvider.tsx`, `src/shared/components/AuthGuard.tsx:19-36`, `src/shared/api/error.ts`, `src/shared/utils/validation.ts:96,118`, `src/shared/components/ui/button/CopyButton.tsx:47`.
- 형제 계약(§1.8): 새 route handler 는 지금 쿠키 route handler 와 같은 분담 — 항상 200 + `{success, data?}`, 던지지 않는다(`access/route.ts:34,37,87`). 클라이언트 쿠키 함수는 실패를 `null` · `false` 로(`cookie.ts:16-33`).
- 로그인 결과의 `auth_id` · `store_id` · `state_id` · `is_phone_verified` · 업체코드 기억은 각 로그인 화면(Phase 5 · 10 · 15)에서.
- `NetworkError` 나누기는 Phase 2 review #3 에서 넘겨받은 일.
- 문서: AGENTS.md(Auth · Data Layer · Error & Response · Testing · Checklist, `LoginContent` 를 근거로 든 곳), docs/data-layer.md(토큰 쿠키 · 전역 상태), error-handling.md(오류 팝업), testing.md(위치), conventions.md(근거 · 외부 SDK `any`).

## Proposals (Codebase-Based)
- [x] `/dev/ui` 에 오류 팝업 미리보기 버튼 — 모양 확인용(`src/app/dev/ui/UiPreviewContent.tsx`)

## Decisions
- [x] 토큰 쿠키는 이름으로 영역을 나눈다 (사용자 2026-11-15)
- [x] 재발급 A — 브라우저가 백엔드를 직접 부르고, 401 이면 route handler 로 재발급 후 한 번 재시도 (사용자 2026-11-15)
- [x] 예전 아이디 로그인은 지금 지운다 — `/login` 은 Phase 5 까지 자리 표시 (사용자 2026-11-15)
- [x] 오류 alert 전부를 오류 전용 팝업으로, 기타 오류는 일반 문구 + 개발 때만 원문 (사용자 2026-11-15)
- [x] TDD — 영역 · 로그인 주소 · 401 재발급 감싸기 · 토큰 쿠키 route handler · AuthGuard + 바뀌는 실패 처리 (사용자 2026-11-15)
- [x] 테스트 파일은 `src/test/` 로 모은다 (사용자 요청 2026-11-15) — 그 아래는 src 와 같은 경로(기본값, css 폴더와 같은 방식)
- [x] lint 오류 · 경고 0 을 이 Phase 에 넣는다 (사용자 lint 결과 2026-11-15 — 기본값)
- [x] 매니저 로그인 이동은 `/manager/login/` — 기억한 업체코드로 보내는 건 그 화면(Phase 10) (기본값)
- [x] 돌아올 주소 query 이름 `return_url` (기본값 — query 키 snake_case)
