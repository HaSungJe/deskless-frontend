# AGENTS.md

roomless 이용자 · 업체 관리자 · 관리자 화면. 규칙의 근거는 `경로:줄`(측정), `(선택: 사용자)`, `(표준: Next.js 권장)`, `(지침서: frontend/…)` 로 표시한다.

## ⚠️ 주의사항
- `npm run dev` · `npm run build` · `npm run start` · `npm run lint`, `docker compose` 는 **사용자만 실행** (Claude 실행 금지) (선택: 사용자).
- 테스트(`npx vitest run`, `/beaver:test`)와 타입 체크(`npx next typegen && npx tsc --noEmit`)는 Claude 가 실행해도 된다 (선택: 사용자).
- `.env*` 파일은 읽거나 커밋하지 않는다 — 변수 목록은 [.env.example](.env.example) (`.gitignore`).

## 커밋 메시지
형식 고정 — 첫 줄은 커밋한 날짜(`YYYY.MM.DD`), 한 줄 비우고 작업 내용을 `- ` 목록으로. 작업 내용은 간결하게 한 줄씩. 이 형식 밖의 줄(Co-Authored-By 같은 서명)은 붙이지 않는다 (선택: 사용자).

```
2026.11.13

- 작업내용 1
- 작업내용 2
```

## 개발 지침서 — `frontend/`
백엔드가 넘겨준 인계 문서. 화면 · API 는 이 문서가 기준이다.
- [frontend/README.md](frontend/README.md) — 읽는 순서 · 시안(아티팩트) 링크
- [frontend/screens.md](frontend/screens.md) — 화면 목록(키 U1~U11 · M1~M8 · A1~A6) · 주소 · 화면마다 구성과 쓰는 API
- [frontend/api.md](frontend/api.md) — API 108개와 호출 방식(영역별 토큰 · 동기 / 큐 SSE · 실패 · 목록 · 파일 올리기 · 결제)
- [frontend/dto/](frontend/dto/) — DTO 사본 → `src/contracts/` 로 옮겨 쓴다
- [frontend/changes/](frontend/changes/README.md) — 이후 백엔드 수정 요청. 위에서부터 차례로 반영하고 어디까지 반영했는지 이 저장소에 기록한다
- [frontend/design/](frontend/design/) — 시안 원본 HTML(색 토큰 · 간격 값)
⚠️ 매니저 M1(Phase 10) · 관리자 A1(Phase 15) 로그인 화면은 아직 없다 — 이용자 U5(카카오 · 네이버)는 `/login`(Phase 5). 새 코드는 지침서대로 — 영역마다 토큰이 따로, 쓰기 API 는 SSE 큐, 키는 snake_case.

## Architecture
Node 24.22.3 (`.nvmrc` · `package.json` engines · `Dockerfile:7`) · Next.js 16.4 App Router (`package.json:20`) · React 19.3 + React Compiler (`next.config.ts:37`) · TypeScript 5 · fetch(HTTP 라이브러리 없음) · class-validator · next-auth 4 · Vitest 5 + Testing Library (선택: 사용자) · CSS Modules (선택: 사용자).

```
src/
├─ app/          라우팅 + 화면 — (user)/ · manager/ · admin/ 영역, page.tsx 옆 <화면>Content.tsx ('use client'), api/ route handler, css/ 전역 토큰 · 화면 css
├─ contracts/    백엔드 계약 — <도메인>/dto/*.dto.ts(지침서 사본) · <도메인>/api.ts
├─ shared/       도메인을 모르는 공통 — api · components · hooks · utils · types · providers
└─ test/         테스트 — src 와 같은 경로에 <대상>.test.ts(x)
```
- import 방향은 `app → contracts → shared` 한쪽으로만. 거꾸로 가면 ESLint 오류 (`eslint.config.mjs:12`).
- `page.tsx` · `layout.tsx` 는 서버 컴포넌트로 얇게 두고 화면은 `<화면>Content` 를 그리기만 한다 (`src/app/(user)/login/page.tsx:5`).
- 화면 파일(`<화면>Content.tsx` · `dto.ts` · 테스트)은 그 주소의 `page.tsx` 옆에 둔다(css 는 `src/app/css/<영역>/`) — 주소가 되는 건 `page` · `route` 같은 특수 파일뿐이라 옆 파일은 노출되지 않는다. 별도 `features/` 층은 두지 않는다 (선택: 사용자 · 표준: Next.js project-structure "Colocation").
- 영역 폴더(`manager/` · `admin/` · `contracts/<도메인>`)는 그 화면 · API 를 만들 때 생긴다.

→ 자세히: [docs/architecture.md](docs/architecture.md)

## Conventions
- 화면: `src/app/<영역 경로>/<주소>/<화면>Content.tsx`(page.tsx 옆), default export `<화면>Content` (`src/app/dev/ui/UiPreviewContent.tsx:63`). 영역 경로는 `(user)/` · `manager/(console)/` · `admin/(console)/`. 그 화면 전용 부품이 여럿이면 `_components/` 로 묶는다(밑줄 폴더는 주소가 되지 않는다).
- 주소: 정적 세그먼트 kebab-case, 동적 세그먼트 `[snake_case]` (지침서: frontend/screens.md — `/stores/[store_id]`). `trailingSlash: true` 라 링크는 `/` 로 끝난다 (`next.config.ts:36`).
- 훅 `use<Name>.ts` default export + 반환 타입 `Use<Name>Type` export (`src/shared/hooks/useInput.ts:3,11`). 컴포넌트 PascalCase 파일 · default export · props 는 `type <Name>Props` (`src/shared/components/map/StoreMap.tsx:20`).
- 타입은 `type` 별칭 + `Type` 접미사 (`src/shared/types/pagination.ts:11`), Context 는 `<Name>Context` (`src/shared/providers/RootLayoutProvider.tsx:17-18`), 상수는 UPPER_SNAKE (`src/shared/api/request.ts:5`).
- 백엔드와 주고받는 키는 snake_case 그대로 (`src/contracts/user/dto/user-token-refresh.dto.ts:6`).
- 스타일은 css 폴더에 모은다 — 전역 토큰 `src/app/css/globals.css`, 화면 `src/app/css/<영역>/<화면>Content.module.css`, 공통 부품 `src/shared/css/<components 아래와 같은 경로>/<Name>.module.css`(예 `shared/components/ui/form/Input.tsx` ↔ `shared/css/ui/form/Input.module.css`). 색 · 크기는 토큰 `var(--…)` 만 — 색은 한 벌, 크기는 영역별(기본 이용자, `data-area="console"` 콘솔) (선택: 사용자).
- 공통 부품은 `src/shared/components/ui/<종류>/` 를 먼저 쓴다 — `button/`(`Button` · `CopyButton`) · `form/`(`Input` · `Textarea` · `Field` · `Switch` · `Chip` · `Segmented`) · `display/`(`Badge` · `Band` · `Card` · `Table` · `EmptyState`) · `nav/`(`Tabs` · `Pagination`) · `modal/`(`Modal` · `ConfirmModal` · `ReasonModal` · `RouteModal` · `ErrorPopup` — 루트에 하나). 입력 칸은 `<Field name="<DTO 필드>">` — 오류 span 을 `Field` 가 그린다. 미리보기 `/dev/ui`(개발 전용). 지도 · 인증번호 · 사진 · 결제 부품은 "외부 연동"(`map/` · `sms/` · `upload/` · `payment/` — 미리보기 `/dev/infra`).
- 표시 형식은 `src/shared/utils/format.ts` — `toKst`(ISO → 한국 시각, `Asia/Seoul` 고정) · `todayKst` · `formatPrice`(`12,000원`) · `formatDays`(요일 비트합 → `월 · 수 · 금`, 3일 이상 이어지면 `일 ~ 목`, 127 → `매일`) · `formatDateTime`(`11월 12일(목) 19:00`) · `formatDateTimeRange`(이용 시간 — `11월 10일(화) 14:30 ~ 17:30`) · `formatTimeRange`(구간 — `20:00 ~ 다음 날 11:00`). 상태 이름은 응답 `*_name` 먼저, 없으면 `lookupName(필드, 값)` (`src/contracts/common/lookup.ts`).
- 컴포넌트 · 커스텀 훅 본문은 **변수 > 상태 > 계산 값 > 효과 > 함수 > JSX** — 영역 사이 빈 줄, 영역마다 한 줄 주석, 변수 · 상태 · 계산 값은 줄마다 오른쪽 역할 주석, JSX 는 덩어리마다 간략 주석. 새 코드와 고치는 파일부터 (선택: 사용자 2026-11-14) → [docs/conventions.md](docs/conventions.md) "컴포넌트 · 훅 안의 구조"

→ 자세히: [docs/conventions.md](docs/conventions.md)

## 화면 로직
별도 서비스 계층은 없다 — 이벤트 처리 · 제출 흐름은 `<화면>Content` 안의 함수로 둔다 (`src/app/dev/ui/UiPreviewContent.tsx:119`). 백엔드 호출은 `contracts/<도메인>/api.ts` 의 함수로 모으고, 그 함수가 `request` · `callQueue`(로그인이 필요하면 `withAuth`)를 부른다(`src/contracts/user/api.ts` — 화면에서 쓰는 건 Phase 4 · 5 부터). 판단 기준: "다른 화면에서도 부를 것인가?" → 예면 아래 계층(contracts · shared)으로.

## Shared Logic Separation
- `shared/utils` — 상태 없는 함수(DOM · 스크립트를 만져도 React 상태는 없음) (`src/shared/utils/util.ts`, `validation.ts`, `address.ts`). 예외: 오류 팝업 저장소(`error-popup.ts`)만 모듈 상태 — React 밖(`handleApiError` · `validateAction`)에서 띄우려고.
- `shared/hooks` — React 상태를 가진 입력 로직, `shared/components` — 여러 화면이 쓰는 UI, `shared/providers` — 전역 Context.
- `shared/api` — HTTP · 쿠키 · 실패 처리(도메인을 모름). 도메인별 엔드포인트는 `contracts/<도메인>/api.ts`.
- 한 화면에서만 쓰면 그 화면 폴더(`page.tsx` 옆)에 둔다. 두 곳 이상에서 쓰게 되면 그때 `contracts` · `shared` 로 옮긴다.

## Data Layer
- 백엔드 호출은 fetch 하나 — 조회 · 로그인 같은 동기는 `request<T>({method, path, query, body, token})`, 상태를 바꾸는 쓰기는 큐 `callQueue<T>({method, path, body, token})` (`src/shared/api/request.ts` · `queue.ts`). 주소는 `${NEXT_PUBLIC_API_URL}/api/v1${path}` — 게이트웨이 하나만 부른다(로컬 `http://localhost:3000` · Swagger `/swagger`, 내부 3010 · 3020 은 직접 부르지 않음 — docs/architecture.md "로컬 포트").
- 큐 결과는 `done` → data, `pending` · 결과 없이 끝남 → `null`(그 리소스를 다시 조회).
- 로그인이 필요한 API 는 `withAuth(auth, (token) => request · callQueue(…))` (`src/shared/api/auth.ts:31`) — 401 이면 그 영역 재발급 한 번 · 재시도, 또 401 이면 그 영역 로그인 화면. 재발급이 일시 실패(네트워크 · 백엔드 5xx)면 로그아웃하지 않고 `NetworkError`. 응답이 없는 실패는 `NetworkError`.
- 토큰은 영역마다 httpOnly 쿠키 `<area>_access_token` · `<area>_refresh_token` 으로 route handler(`src/app/api/cookie/[area]/` · `[area]/refresh/`)가 쓰고 읽는다 (`src/app/api/cookie/token-cookie.ts:88`). 저장(`POST`)은 같은 사이트 JSON 요청만 받는다(`isSameSiteJson` — 다른 사이트 form 이 토큰을 심는 것 막기). 클라이언트는 `src/shared/api/cookie.ts` 로만 접근한다.
- 전역 상태는 Context 만 쓴다 (`RootLayoutProvider.tsx:17-18`) — 상태 관리 라이브러리 없음.
- 목록 응답은 `{list, pagination}` — `pagination` 은 snake_case `PaginationType`(`src/shared/types/pagination.ts`)이고 `Pagination`(`src/shared/components/ui/nav/Pagination.tsx`)에 그대로 넘긴다. 공통 계약은 `src/contracts/common/`(지침서 사본).

→ 자세히: [docs/data-layer.md](docs/data-layer.md)

## Validation
- 입력 DTO 는 class-validator 데코레이터 + 한국어 `message` 필수 (`src/contracts/user/dto/user-token-refresh.dto.ts:5`).
- 제출 전에 `validateAction(dto)` (`src/shared/utils/validation.ts:86`) → 오류는 칸 옆 `<span data-type="validation-alert" data-id="<필드>" />` 에 표시 — `<Field name>` 이 그린다(`src/shared/components/ui/form/Field.tsx`), 칸을 못 찾으면 오류 팝업. 중첩 DTO 는 `validateActionChildren(dto, key)` + `data-key` (`src/shared/utils/validation.ts:112` · 미적용).
- 지침서 DTO 사본은 `contracts/` 에 그대로 두고 화면 검증에도 그대로 쓴다 (지침서: frontend/api.md:62).

## Error & Response
- route handler 는 항상 200 + `{success: boolean, data?}` JSON (`src/app/api/route-util.ts:18` · `src/app/api/cookie/[area]/route.ts:14,20`). 클라이언트 쿠키 함수는 실패를 삼키고 `null` · `false` 를 돌려준다 (`src/shared/api/cookie.ts:29-46`).
- API 호출 실패는 catch 에서 `handleApiError(error)` (`src/shared/api/error.ts:21`) — `validation_errors` 는 칸 옆에(맞는 칸이 없으면 오류 팝업), 없으면 `message` 를 오류 팝업으로, `NetworkError` 는 네트워크 문구, 그 밖의 오류는 일반 문구(개발 때만 원문), 취소(`AbortError`) · 로그인 만료(`LoginRequiredError`)는 무시. axios 는 쓰지 않는다(사용자 2026-11-15).
- 오류는 브라우저 alert 대신 오류 팝업 하나 — `showErrorPopup(message, detail?)` (`src/shared/utils/error-popup.ts:25`), 루트의 `ErrorPopup`(`src/shared/components/ui/modal/ErrorPopup.tsx`)이 띄운다(사용자 2026-11-15).

→ 자세히: [docs/error-handling.md](docs/error-handling.md)

## Auth
- 영역은 주소로 안다 — `areaOf(pathname)` (`src/shared/utils/area.ts:21`): `/manager…` manager · `/admin…` admin · 그 밖 user. 영역마다 토큰이 따로다(쿠키 이름으로 나눔 — 사용자 2026-11-15).
- 주소가 바뀔 때마다 `RootLayoutContent` 가 그 영역 토큰을 확인한다(`GET /api/cookie/<area>/` — 없거나 곧 만료면 refresh 쿠키로 재발급, 로그인 안 된 상태는 주소마다 다시 확인) (`src/app/RootLayoutContent.tsx:54-66`) → `RootLayoutLoadingContext` · `AuthContext`(`{area, token, isLogin, setToken, onExpired, logout}`).
- 브라우저가 백엔드를 직접 부른다(사용자 2026-11-15). 로그인이 필요한 API 는 contracts 함수가 `withAuth(auth, …)` — 401 이면 재발급 한 번 · 재시도, 또 401 이면 그 영역 로그인 화면(`loginUrl(area, 지금 주소)` → `?return_url=`). 로그인 결과 토큰은 이용자는 서버 route 가 `setTokenCookies`(아래 SNS 로그인), 매니저 · 관리자는 화면이 `saveAreaTokens(area, tokens)`, 로그아웃은 `auth.logout()`(로그아웃 API 없음). 로그인 화면은 `safeReturnPath(return_url, area)` 로 돌아갈 주소를 읽는다(URL 로 읽어 같은 사이트 주소만 — 탭 · 줄바꿈을 끼운 주소도 막는다).
- 로그인이 필요한 영역은 layout 에서 `<AuthGuard>` 로 감싼다 — 영역 로그인 주소는 주소로 알고, 그 영역 로그인 화면 자신은 막지 않는다 (`src/shared/components/AuthGuard.tsx:19`). 이용자 영역은 지도 · 업체 보기가 로그인 없이 되므로 로그인이 필요한 화면의 page 만 감싼다 (`src/app/(user)/phone-verification/page.tsx` — 사용자 2026-11-16).
- 클라이언트 코드는 쿠키를 직접 읽지 않는다(`src/shared/api/cookie.ts` 로만). 토큰은 JWT 복호화하지 않는다(만료는 응답의 `*_expires_at`).
- SNS 로그인(이용자 — 사용자 2026-11-16): next-auth(카카오 · 네이버, `src/app/api/auth/[...nextauth]/route.ts`)가 OAuth 를 하고, 검증된 SNS 계정(`sns_id` · `sns_user_id`)은 next-auth 세션(httpOnly · 10분)에만 둔다 — 백엔드가 `sns_user_id` 를 다시 확인하지 않으므로 브라우저에 내보내지 않는다. `GET /api/user/sns-login/`(next-auth callbackUrl)이 `getToken` 으로 읽어 백엔드 로그인 → 이용자 토큰 쿠키 · SNS 세션 삭제 → 휴대폰 인증 · 돌아갈 주소(가입 전이면 `/signup/`), 가입은 `POST /api/user/sign/` (`src/app/api/user/`). 로그인도 Next 서버가 부르므로 로그인 IP 와 재발급 IP 가 같다.

## 외부 연동
- 지도 · 주소 · 인증번호 · 파일 · 결제는 `shared` 의 연동 부품을 쓴다 — `map/StoreMap` · `useMyLocation` · `searchAddressWithCoords` · `sms/SmsVerification` · `uploadFile` + `upload/ImageUploader` · `payment/TossPaymentWidget` + `requestTossConfirm`. 부품은 도메인 API 를 모르고, 화면이 그 화면의 contracts 함수(검증 · 실패 안내 포함)를 감싸 넘긴다. 미리보기 `/dev/infra`(개발 전용).
- 파일은 업로드 주소 발급 → S3 PUT → 등록(큐) 3단계를 `uploadFile(file, {issue, register})` 하나로. 결제는 토스 결제위젯(사용자 2026-11-16) → `/payments/success/` → route handler `POST /api/payments/confirm/`(시크릿 키 `TOSS_SECRET_KEY` — 여기서만) → 백엔드 payment-confirm(큐).

→ 자세히: [docs/integrations.md](docs/integrations.md)

## Key Patterns
- `window` 를 쓰는 라이브러리는 `next/dynamic` + `ssr: false` 로 감싼다 (`src/shared/components/Editor.tsx:6`, `chart/Chart.tsx:5`).
- 외부 스크립트는 id 로 한 번만 붙이고 Promise 로 로드를 기다린다 (`src/shared/utils/kakao-map.ts:15`, `src/shared/utils/address.ts:35`). npm 으로 들인 SDK(토스)는 효과 안에서 `import()` (`src/shared/components/payment/TossPaymentWidget.tsx`).
- `NEXT_PUBLIC_*` · `basePath` 는 빌드할 때 박힌다. Docker 운영 이미지는 `output: "standalone"` (`next.config.ts:34`) + `.env.production` 하나로 빌드 · 실행.
- basePath(하위 경로 배포)는 `<Link>` · router · `redirect()` 만 Next 가 붙인다 — route handler `fetch` · next-auth 주소(callbackUrl · `pages` · 로그인 화면 `SessionProvider basePath`) · 메타데이터 주소 · 직접 만든 `Location` · 밖에서 돌아올 주소는 `withBasePath(path)` (`src/shared/utils/base-path.ts`). basePath 를 쓰면 `NEXTAUTH_URL` 도 `<origin><basePath>/api/auth` 까지(.env.example).
- 주소가 있어야 하는 팝업은 경로 모달 — 루트 슬롯 `src/app/@modal/(.)<주소>/page.tsx` 에서 `<RouteModal>` 로 감싸고, 같은 주소의 보통 페이지도 둔다. 화면 내용은 보통 페이지 폴더에 두고 가로채기 page 가 `@/app/<영역 경로>/<주소>/<화면>Content` 로 가져온다. 주소가 필요 없는 확인 · 사유 입력은 `ConfirmModal` · `ReasonModal`. → [docs/architecture.md](docs/architecture.md) "경로 모달"

## Testing
Vitest 5 + Testing Library + jsdom (`vitest.config.mts`) (선택: 사용자). 테스트는 `src/test/` 아래 src 와 같은 경로에 `<대상>.test.ts(x)`, 대상은 `@/…` 로 import(사용자 2026-11-15). HTTP · 라우터 · 쿠키 경계는 mock — 실제 네트워크 금지. 케이스는 `[SUCCESS]` / `[FAIL:<이유>]`, 호출 횟수 · 인자 · 실패 뒤 미호출까지 검증. 실행 `npx vitest run`, 하나만 `npx vitest run <이름>`.

→ 자세히: [docs/testing.md](docs/testing.md)

## Checklist
- [ ] `page.tsx` 는 `'use client'` 없이 `<화면>Content` 만 그린다
- [ ] 화면은 그 주소 `page.tsx` 옆 `<화면>Content.tsx` (`'use client'`, default export)
- [ ] import 가 `app → contracts → shared` 방향을 거스르지 않는다
- [ ] 백엔드 DTO 는 `src/contracts/<도메인>/dto/<파일>.dto.ts` 에 지침서 사본 그대로(파일 이름 · 상대 import 유지)
- [ ] 입력 DTO 필드마다 class-validator 데코레이터 + 한국어 `message`
- [ ] 제출 전 `validateAction(dto)`, 입력 칸마다 `<span data-type="validation-alert" data-id="<필드>">`
- [ ] API 호출 실패는 catch 에서 `handleApiError(error)` — 오류는 `alert` 대신 오류 팝업(`showErrorPopup`)
- [ ] 클라이언트에서 쿠키 · 토큰을 직접 읽지 않고 `shared/api/cookie.ts` 를 쓴다
- [ ] 로그인이 필요한 영역 layout(이용자는 그 화면 page)은 `<AuthGuard>` 로 감싸고, 로그인이 필요한 API 는 `withAuth(auth, …)` 로 부른다
- [ ] `window` 를 쓰는 라이브러리는 `next/dynamic` + `ssr: false`
- [ ] 시크릿(`NEXTAUTH_SECRET` · `TOSS_SECRET_KEY`)은 서버 코드(route handler)에서만 — `NEXT_PUBLIC_` 을 붙이지 않는다, SNS 계정은 브라우저에 내보내지 않는다
- [ ] 지도 · 주소 · 인증번호 · 파일 · 결제는 `shared` 연동 부품에 화면의 contracts 함수만 넘긴다 — 토스 시크릿 키는 결제 승인 route handler 에서만 (docs/integrations.md)
- [ ] 내부 링크는 `/` 로 끝난다 (`trailingSlash`)
- [ ] 스타일은 `<Name>.module.css` 를 css 폴더에(화면 `src/app/css/<영역>/`, 공통 부품 `src/shared/css/…`), 색 · 크기는 `globals.css` 토큰 `var(--…)` 만 (값 직접 쓰지 않음 — 부품 고유 치수 · 간격 · 글자 크기 예외는 docs/conventions.md "스타일")
- [ ] 공통 부품(`src/shared/components/ui/<종류>/`)이 있으면 새로 만들지 않고 쓴다 — 입력 칸은 `<Field name>`
- [ ] 주소가 있는 팝업은 `@modal/(.)<주소>` + `RouteModal`, 같은 주소의 보통 페이지도 둔다
- [ ] 컴포넌트 · 훅 본문이 변수 > 상태 > 계산 값 > 효과 > 함수 > JSX 순서 · 영역 빈 줄 · 영역 주석 · 변수/상태/계산 값 오른쪽 주석 · JSX 덩어리 주석을 지킨다
- [ ] 새 코드의 테스트는 `src/test/<같은 경로>/*.test.ts(x)` — `[SUCCESS]`/`[FAIL:*]`, 호출 횟수 · 인자 · 미호출 검증
- [ ] 커밋 메시지는 `YYYY.MM.DD` + `- 작업내용` 형식
