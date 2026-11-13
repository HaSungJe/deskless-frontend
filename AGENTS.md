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

⚠️ 지금 코드의 인증(토큰 1벌 · `/api/v1/user/refresh` — `src/app/api/cookie/access/route.ts:48`) · 실패 키(`validationErrors` — `src/shared/api/axios-error.ts:16`) · 페이지네이션(camelCase — `src/shared/types/pagination.ts:6`) 은 **예전 백엔드 기준**이다. 지침서는 영역마다 토큰이 따로고, 쓰기 API 는 SSE 큐, 키는 snake_case — 해당 화면을 만들 때 지침서에 맞춰 바꾼다.

## Architecture
Next.js 16.4 App Router (`package.json:17`) · React 19.3 + React Compiler (`next.config.ts:37`) · TypeScript 5 · axios · class-validator · next-auth 4 · Vitest 5 + Testing Library (선택: 사용자) · CSS Modules (선택: 사용자).

```
src/
├─ app/          라우팅 + 화면 — (user)/ · manager/ · admin/ 영역, page.tsx 옆 <화면>Content.tsx ('use client'), api/ route handler, css/ 전역 토큰 · 화면 css
├─ contracts/    백엔드 계약 — <도메인>/dto/*.dto.ts(지침서 사본) · <도메인>/api.ts
└─ shared/       도메인을 모르는 공통 — api · components · hooks · utils · types · providers
```
- import 방향은 `app → contracts → shared` 한쪽으로만. 거꾸로 가면 ESLint 오류 (`eslint.config.mjs:12`).
- `page.tsx` · `layout.tsx` 는 서버 컴포넌트로 얇게 두고 화면은 `<화면>Content` 를 그리기만 한다 (`src/app/(user)/login/page.tsx:3`).
- 화면 파일(`<화면>Content.tsx` · `dto.ts` · 테스트)은 그 주소의 `page.tsx` 옆에 둔다(css 는 `src/app/css/<영역>/`) — 주소가 되는 건 `page` · `route` 같은 특수 파일뿐이라 옆 파일은 노출되지 않는다. 별도 `features/` 층은 두지 않는다 (선택: 사용자 · 표준: Next.js project-structure "Colocation").
- 영역 폴더(`manager/` · `admin/` · `contracts/<도메인>`)는 그 화면 · API 를 만들 때 생긴다.

→ 자세히: [docs/architecture.md](docs/architecture.md)

## Conventions
- 화면: `src/app/<영역 경로>/<주소>/<화면>Content.tsx`(page.tsx 옆), default export `<화면>Content` (`src/app/(user)/login/LoginContent.tsx:13`). 영역 경로는 `(user)/` · `manager/(console)/` · `admin/(console)/`. 그 화면 전용 부품이 여럿이면 `_components/` 로 묶는다(밑줄 폴더는 주소가 되지 않는다).
- 주소: 정적 세그먼트 kebab-case, 동적 세그먼트 `[snake_case]` (지침서: frontend/screens.md — `/stores/[store_id]`). `trailingSlash: true` 라 링크는 `/` 로 끝난다 (`next.config.ts:36`).
- 훅 `use<Name>.ts` default export + 반환 타입 `Use<Name>Type` export (`src/shared/hooks/useInput.ts:3,11`). 컴포넌트 PascalCase 파일 · default export · props 는 `type <Name>Props` (`src/shared/components/KakaoMap.tsx:10`).
- 타입은 `type` 별칭 + `Type` 접미사 (`src/shared/types/pagination.ts:6`), Context 는 `<Name>Context` (`src/shared/providers/RootLayoutProvider.tsx:13-15`), 상수는 UPPER_SNAKE (`src/shared/api/axios.ts:12`).
- 백엔드와 주고받는 키는 snake_case 그대로 (`src/app/(user)/login/dto.ts:6,9`).
- 스타일은 css 폴더에 모은다 — 전역 토큰 `src/app/css/globals.css`, 화면 `src/app/css/<영역>/<화면>Content.module.css`, 공통 부품 `src/shared/css/<components 아래와 같은 경로>/<Name>.module.css`(예 `shared/components/ui/form/Input.tsx` ↔ `shared/css/ui/form/Input.module.css`). 색 · 크기는 토큰 `var(--…)` 만 — 색은 한 벌, 크기는 영역별(기본 이용자, `data-area="console"` 콘솔) (선택: 사용자).
- 공통 부품은 `src/shared/components/ui/<종류>/` 를 먼저 쓴다 — `button/`(`Button` · `CopyButton`) · `form/`(`Input` · `Textarea` · `Field` · `Switch` · `Chip` · `Segmented`) · `display/`(`Badge` · `Band` · `Card` · `Table` · `EmptyState`) · `nav/`(`Tabs`) · `modal/`(`Modal` · `ConfirmModal` · `ReasonModal` · `RouteModal`). 입력 칸은 `<Field name="<DTO 필드>">` — 오류 span 을 `Field` 가 그린다. 미리보기 `/dev/ui`(개발 전용).
- 컴포넌트 · 커스텀 훅 본문은 **변수 > 상태 > 계산 값 > 효과 > 함수 > JSX** — 영역 사이 빈 줄, 영역마다 한 줄 주석, 변수 · 상태 · 계산 값은 줄마다 오른쪽 역할 주석, JSX 는 덩어리마다 간략 주석. 새 코드와 고치는 파일부터 (선택: 사용자 2026-11-14) → [docs/conventions.md](docs/conventions.md) "컴포넌트 · 훅 안의 구조"

→ 자세히: [docs/conventions.md](docs/conventions.md)

## 화면 로직
별도 서비스 계층은 없다 — 이벤트 처리 · 제출 흐름은 `<화면>Content` 안의 함수로 둔다 (`src/app/(user)/login/LoginContent.tsx:43-65`). 백엔드 호출은 `contracts/<도메인>/api.ts` 의 함수로 모은다(구조 결정 · 아직 미적용 — 지금 로그인은 axios 를 직접 부른다 `LoginContent.tsx:48`). 판단 기준: "다른 화면에서도 부를 것인가?" → 예면 아래 계층(contracts · shared)으로.

## Shared Logic Separation
- `shared/utils` — 상태 없는 함수(DOM · 스크립트를 만져도 React 상태는 없음) (`src/shared/utils/util.ts`, `validation.ts`, `address.ts`).
- `shared/hooks` — React 상태를 가진 입력 로직, `shared/components` — 여러 화면이 쓰는 UI, `shared/providers` — 전역 Context.
- `shared/api` — HTTP · 쿠키 · 실패 처리(도메인을 모름). 도메인별 엔드포인트는 `contracts/<도메인>/api.ts`.
- 한 화면에서만 쓰면 그 화면 폴더(`page.tsx` 옆)에 둔다. 두 곳 이상에서 쓰게 되면 그때 `contracts` · `shared` 로 옮긴다.

## Data Layer
- 백엔드 호출은 axios 로 `${NEXT_PUBLIC_API_URL}/api/v1/...` (`LoginContent.tsx:48`). 로그인 토큰이 필요한 호출은 `axiosGet/Post/Put/Patch/Delete(access, url, body?, headers?)` (`src/shared/api/axios.ts:56-106` · 아직 호출처 0 — 미적용).
- 토큰은 httpOnly 쿠키로 route handler(`src/app/api/cookie/*`)가 쓰고 읽는다 (`access/route.ts:52-71`). 클라이언트는 `src/shared/api/cookie.ts` 로만 접근한다.
- 전역 상태는 Context 만 쓴다 (`RootLayoutProvider.tsx:13-15`) — 상태 관리 라이브러리 없음.
- 지침서 호출 방식(동기 JSON / 큐 SSE `callQueue`, `{list, pagination}`)은 아직 코드에 없다 — `shared/api` 에 만든다.

→ 자세히: [docs/data-layer.md](docs/data-layer.md)

## Validation
- 입력 DTO 는 class-validator 데코레이터 + 한국어 `message` 필수 (`src/app/(user)/login/dto.ts:5,8`).
- 제출 전에 `validateAction(dto)` (`LoginContent.tsx:44-45`) → 오류는 칸 옆 `<span data-type="validation-alert" data-id="<필드>" />` 에 표시 (`LoginContent.tsx:96`). 중첩 DTO 는 `validateActionChildren(dto, key)` + `data-key` (`src/shared/utils/validation.ts:111` · 미적용).
- 지침서 DTO 사본은 `contracts/` 에 그대로 두고 화면 검증에도 그대로 쓴다 (지침서: frontend/api.md:62).

## Error & Response
- route handler 는 항상 200 + `{success: boolean, data?}` JSON (`src/app/api/cookie/access/route.ts:36,39,87`). 클라이언트 쿠키 함수는 실패를 삼키고 `null` · `false` 를 돌려준다 (`src/shared/api/cookie.ts:45-56`).
- API 호출 실패는 catch 에서 `axiosErrorHandle(error)` (`LoginContent.tsx:62`) — `validationErrors` 를 칸에 표시, 없으면 `alert(message)` (`src/shared/api/axios-error.ts:10-28`).

→ 자세히: [docs/error-handling.md](docs/error-handling.md)

## Auth
- 주소가 바뀔 때마다 `RootLayoutContent` 가 `/api/cookie/access` 로 로그인 상태를 확인한다 (`src/app/RootLayoutContent.tsx:17-34`) → `RootLayoutLoadingContext` · `AccessTokenContext` · `IsLoginContext`.
- 로그인이 필요한 영역은 layout 에서 `<AuthGuard loginPath="그 영역 로그인 주소">` 로 감싼다 (`src/shared/components/AuthGuard.tsx:19` · 지금 호출처 0 — 미적용).
- 클라이언트 코드는 쿠키 · 토큰을 직접 읽지 않는다. JWT 키(`NEXT_PUBLIC_JWT_CODE`)는 route handler 에서만 (`access/route.ts:33`).
- SNS 로그인은 next-auth (`src/app/api/auth/[...nextauth]/route.ts`).

## Key Patterns
- `window` 를 쓰는 라이브러리는 `next/dynamic` + `ssr: false` 로 감싼다 (`src/shared/components/Editor.tsx:7`, `chart/Chart.tsx:5`).
- 외부 스크립트는 id 로 한 번만 붙이고 Promise 로 로드를 기다린다 (`KakaoMap.tsx:26`, `src/shared/utils/address.ts:19`).
- `NEXT_PUBLIC_*` · `basePath` 는 빌드할 때 박힌다. Docker 운영 이미지는 `output: "standalone"` (`next.config.ts:34`) + `.env.production` 하나로 빌드 · 실행.
- 주소가 있어야 하는 팝업은 경로 모달 — 루트 슬롯 `src/app/@modal/(.)<주소>/page.tsx` 에서 `<RouteModal>` 로 감싸고, 같은 주소의 보통 페이지도 둔다. 화면 내용은 보통 페이지 폴더에 두고 가로채기 page 가 `@/app/<영역 경로>/<주소>/<화면>Content` 로 가져온다. 주소가 필요 없는 확인 · 사유 입력은 `ConfirmModal` · `ReasonModal`. → [docs/architecture.md](docs/architecture.md) "경로 모달"

## Testing
Vitest 5 + Testing Library + jsdom (`vitest.config.mts`) (선택: 사용자). 테스트는 대상 옆 `*.test.ts(x)`. HTTP · 라우터 · 쿠키 경계는 mock — 실제 네트워크 금지. 케이스는 `[SUCCESS]` / `[FAIL:<이유>]`, 호출 횟수 · 인자 · 실패 뒤 미호출까지 검증. 실행 `npx vitest run`, 하나만 `npx vitest run <이름>`.

→ 자세히: [docs/testing.md](docs/testing.md)

## Checklist
- [ ] `page.tsx` 는 `'use client'` 없이 `<화면>Content` 만 그린다
- [ ] 화면은 그 주소 `page.tsx` 옆 `<화면>Content.tsx` (`'use client'`, default export)
- [ ] import 가 `app → contracts → shared` 방향을 거스르지 않는다
- [ ] 백엔드 DTO 는 `src/contracts/<도메인>/dto/<파일>.dto.ts` 에 지침서 사본 그대로(파일 이름 · 상대 import 유지)
- [ ] 입력 DTO 필드마다 class-validator 데코레이터 + 한국어 `message`
- [ ] 제출 전 `validateAction(dto)`, 입력 칸마다 `<span data-type="validation-alert" data-id="<필드>">`
- [ ] API 호출 실패는 catch 에서 `axiosErrorHandle(error)`
- [ ] 클라이언트에서 쿠키 · 토큰을 직접 읽지 않고 `shared/api/cookie.ts` 를 쓴다
- [ ] 로그인이 필요한 영역 layout 은 `<AuthGuard loginPath="…">` 로 감싼다
- [ ] `window` 를 쓰는 라이브러리는 `next/dynamic` + `ssr: false`
- [ ] 시크릿은 서버 코드(route handler)에서만 — 클라이언트 코드에 `NEXT_PUBLIC_JWT_CODE` 금지
- [ ] 내부 링크는 `/` 로 끝난다 (`trailingSlash`)
- [ ] 스타일은 `<Name>.module.css` 를 css 폴더에(화면 `src/app/css/<영역>/`, 공통 부품 `src/shared/css/…`), 색 · 크기는 `globals.css` 토큰 `var(--…)` 만 (값 직접 쓰지 않음 — 부품 고유 치수 · 간격 · 글자 크기 예외는 docs/conventions.md "스타일")
- [ ] 공통 부품(`src/shared/components/ui/<종류>/`)이 있으면 새로 만들지 않고 쓴다 — 입력 칸은 `<Field name>`
- [ ] 주소가 있는 팝업은 `@modal/(.)<주소>` + `RouteModal`, 같은 주소의 보통 페이지도 둔다
- [ ] 컴포넌트 · 훅 본문이 변수 > 상태 > 계산 값 > 효과 > 함수 > JSX 순서 · 영역 빈 줄 · 영역 주석 · 변수/상태/계산 값 오른쪽 주석 · JSX 덩어리 주석을 지킨다
- [ ] 새 코드 옆에 `*.test.ts(x)` — `[SUCCESS]`/`[FAIL:*]`, 호출 횟수 · 인자 · 미호출 검증
- [ ] 커밋 메시지는 `YYYY.MM.DD` + `- 작업내용` 형식
