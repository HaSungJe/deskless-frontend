# Architecture

Next.js 16.4 App Router (`package.json:17`) · React 19.3 (`package.json:20`) + React Compiler (`next.config.ts:37`) · TypeScript 5 · fetch(HTTP 라이브러리 없음) · class-validator 0.14 (`package.json:14`) · next-auth 4 (`package.json:18`) · dayjs · nextjs-toploader · apexcharts / react-apexcharts · react-quill-new · react-spinners · Vitest 5 + Testing Library + jsdom (선택: 사용자) · CSS Modules (선택: 사용자 · 아직 CSS 없음).

## Directory Layout

```
src/
├─ app/                              라우팅 + 화면 — 서버 컴포넌트 page · layout, 그 옆에 <화면>Content.tsx ('use client')
│  ├─ layout.tsx                     루트 html · metadata · 글꼴 · css/globals.css · RootLayoutContent · modal 슬롯
│  ├─ css/                           css 모음 (주소가 되지 않음 — page.tsx 없음)
│  │  ├─ globals.css                 디자인 토큰(색 한 벌 · 영역별 크기) · 기본 스타일
│  │  └─ <영역>/                      화면 css — <화면>Content.module.css (user · manager · admin · dev)
│  ├─ RootLayoutContent.tsx          ('use client') 로그인 상태 확인 + Provider + TopLoader
│  ├─ @modal/                        경로 모달 슬롯(루트 하나) — default · [...catchAll] · (.)<주소>/page.tsx
│  ├─ dev/ui/                        개발 전용 — /dev/ui 공통 UI 미리보기 · UiPreviewContent.tsx (운영 404)
│  ├─ (user)/                        이용자 `/` · 모바일 (괄호 폴더는 주소에 안 나옴)
│  │  ├─ page.tsx · HomeContent.tsx  U1 `/`
│  │  └─ login/                      U5 `/login` — page.tsx · LoginContent.tsx · dto.ts · dto.test.ts
│  ├─ manager/                       업체 관리자 `/manager` · PC 콘솔 (첫 화면을 만들 때 생김)
│  │  ├─ [store_code]/…              M1 업체별 로그인 · 아이디 찾기 · 비밀번호 초기화
│  │  └─ (console)/                  콘솔 layout + 매니저 AuthGuard — M2~M8
│  ├─ admin/                         관리자 `/admin` · PC 콘솔 (첫 화면을 만들 때 생김)
│  │  └─ (console)/                  콘솔 layout + 관리자 AuthGuard — A2~A6
│  └─ api/                           route handler — cookie/* (토큰 쿠키) · auth/[...nextauth] (SNS)
├─ contracts/                        백엔드 계약 — 지침서 frontend/dto/*.md 의 사본 (첫 API 를 만들 때 생김)
│  ├─ common/                        pagination.dto.ts · fail-result.dto.ts · roles.ts · sse.ts · reservation.constants.ts (지침서 사본) · lookup.ts
│  └─ <도메인>/                       user · discovery · reservation · store · manager · admin · room · stats
│     ├─ dto/<파일>.dto.ts           지침서 파일 이름 그대로
│     └─ api.ts                      그 도메인 엔드포인트 함수
└─ shared/                           도메인을 모르는 공통
   ├─ api/                           request.ts(동기 · ApiError) · queue.ts(큐 SSE) · sse.ts · error.ts(handleApiError) · cookie.ts(토큰 쿠키 route handler 부르기)
   ├─ components/                    AuthGuard · Editor · KakaoMap · Loading · Timer · Scripts · chart/
   │  └─ ui/                         공통 UI 부품 — button/ · form/ · display/ · nav/(Tabs · Pagination) · modal/ (docs/conventions.md 스타일)
   ├─ css/                           공통 부품 css — components/ 와 같은 경로 (ui/form/Input.module.css · Loading.module.css)
   ├─ hooks/                         useInput · useInputNumber · useInputFloat · useInputDate · useInputTime · useCheckboxGroup
   ├─ providers/                     RootLayoutProvider (전역 Context)
   ├─ types/                         access.ts · pagination.ts
   └─ utils/                         validation.ts · address.ts · util.ts · format.ts(한국 시각 · 금액 · 요일)
```

- `contracts/` 는 지침서(frontend/dto/user.md:3 — "프론트에는 `contracts/user/dto/<파일>` 로 둔다")와 같은 자리다. DTO 끼리의 상대 import(`'../../common/pagination.dto'` — frontend/dto/manager.md:75)가 그대로 맞으려면 `contracts/<도메인>/dto/` · `contracts/common/` 깊이를 지킨다.
- 루트의 `frontend/` 는 코드가 아니라 지침서다(빌드 · Docker 이미지에서 제외 — `.dockerignore`).
- 화면 파일은 그 주소의 `page.tsx` 옆에 둔다(colocation). `app/` 안에서 주소가 되는 건 `page` · `route` · `layout` 같은 특수 파일뿐이라 `<화면>Content.tsx` · `dto.ts` · 테스트 · css 는 노출되지 않는다. 화면 전용 부품이 여럿이면 `_components/` — 밑줄 폴더는 라우팅에서 빠진다 (선택: 사용자 · 표준: Next.js project-structure "Colocation" · "Private folders"). 별도 `features/` 층은 두지 않는다 — 화면마다 app 경로를 1:1 로 따라가는 두 번째 트리만 생겨서다.

## Layer Boundaries

| 계층 | 할 일 | 가져다 쓸 수 있는 것 |
|---|---|---|
| `app/` | 주소 · layout · route handler. page 는 `<화면>Content` 를 그리기만, 화면 상태 · 이벤트 · 제출 흐름은 옆 `<화면>Content` 에서 | contracts · shared |
| `contracts/` | 백엔드 DTO · 엔드포인트 함수 | shared |
| `shared/` | 도메인을 모르는 공통 | (없음) |

ESLint `import/no-restricted-paths` 가 거꾸로 가는 import 를 오류로 막는다 (`eslint.config.mjs:12-28`). 여러 화면이 같이 쓰게 되면 아래 계층으로 옮긴다 — 예: 로그인 Context 는 화면과 `shared/components/AuthGuard` 가 같이 써서 `shared/providers/` 에 있다 (`src/shared/providers/RootLayoutProvider.tsx`). `app/` 안에서 다른 주소 폴더의 화면을 가져오는 것은 경로 모달의 가로채기 page 뿐이다(아래 "경로 모달").

## Minimal File Structure for a New Screen

```
src/app/<영역 경로>/<주소>/page.tsx               서버 컴포넌트 — <화면>Content 만 그림
src/app/<영역 경로>/<주소>/<화면>Content.tsx       'use client' 화면 (page.tsx 옆)
src/app/<영역 경로>/<주소>/<화면>Content.test.tsx  [SUCCESS]/[FAIL:*]
src/app/css/<영역>/<화면>Content.module.css      화면 css (영역 user · manager · admin)
src/app/<영역 경로>/<주소>/_components/            (전용 부품이 여럿이면) 밑줄 폴더 — 주소가 되지 않음
src/contracts/<도메인>/dto/<파일>.dto.ts           (처음 쓰는 API 면) 지침서 사본
src/contracts/<도메인>/api.ts                      (처음 쓰는 API 면) 엔드포인트 함수
```
측정 근거: `src/app/(user)/login/page.tsx` + `src/app/(user)/login/LoginContent.tsx` (page 는 Content 만 그림). CSS · contracts 는 선택 · 구조 결정이라 아직 실제 파일이 없다.

## Procedure for Adding a New Screen

1. `frontend/screens.md` 에서 화면 키(U · M · A)의 주소 · 구성 · 쓰는 API 를 읽고, 시안(`frontend/design/<영역>.html`)에서 같은 키의 화면을 찾는다.
2. 주소대로 `src/app/` 아래 page 를 만든다 — 이용자는 `(user)/`, 매니저 · 관리자 콘솔은 `manager/(console)/` · `admin/(console)/`. `useSearchParams` 를 쓰면 page 에서 `<Suspense>` 로 감싼다.
3. 쓰는 API 의 DTO 를 `frontend/dto/<도메인>.md` 에서 `src/contracts/<도메인>/dto/` 로 옮기고, 엔드포인트 함수를 `contracts/<도메인>/api.ts` 에 만든다.
4. 그 `page.tsx` 옆에 `<화면>Content.tsx` 로 화면을 만든다.
5. 로그인이 필요한 영역이면 그 영역 layout 이 `<AuthGuard loginPath="…">` 로 감싸는지 확인한다.
6. 옆에 `*.test.tsx` 를 쓰고 `npx vitest run <이름>` 으로 확인한다.

## Key Patterns

### Entry Points
- **page / layout**: 서버 컴포넌트, `'use client'` 없음 (`src/app/(user)/login/page.tsx:1-8`, `src/app/(user)/page.tsx`). 화면 컴포넌트에서 `'use client'` 를 선언한다 (`LoginContent.tsx:1`).
- **route handler**: `src/app/api/**/route.ts` 에서 `GET` · `POST` · `DELETE` 를 export, 응답은 `new Response(JSON.stringify({success, data?}), {headers})` (`src/app/api/cookie/access/route.ts:34`). `'use server'` 는 붙이지 않는다.

### Data Layer
→ [data-layer.md](data-layer.md)

### Boundary / Environment
- **서버 전용**: `cookies()` · `headers()`(`next/headers`), `jsonwebtoken`, SNS 시크릿은 route handler 에서만 (`access/route.ts:1-4`, `src/app/api/auth/[...nextauth]/route.ts`). 클라이언트 코드는 `src/shared/api/cookie.ts` 로 route handler 를 거친다.
- **`NEXT_PUBLIC_*`** 는 빌드할 때 서버 · 클라이언트 번들에 박힌다. 이름에 `NEXT_PUBLIC_` 이 붙은 시크릿(`NEXT_PUBLIC_JWT_CODE`)은 서버 코드에서만 참조한다 — 클라이언트 코드에서 쓰면 브라우저로 나간다.
- **환경 파일**: 로컬 개발 `.env.local`(`npm run dev`, 5000 포트 — `package.json:6`), Docker 운영 `.env.production`. 목록 · 빌드/실행 시점 구분은 [.env.example](../.env.example).
- **로컬 포트** (백엔드 안내 2026-11-15):
  - 프론트 `http://localhost:5000` — 이용자 `/` · 업체 관리자 `/manager` · 관리자 `/admin` 이 한 서버.
  - 백엔드 게이트웨이 `http://localhost:3000` — **프론트는 이 주소만 부른다**(`NEXT_PUBLIC_API_URL`). API `/api/v1/...`, 문서 Swagger `/swagger`, 사진 `/sample/...`(테스트 데이터) · `/files/...`(S3 없는 서버에 올린 사진).
  - 이용자 서비스 3010 · 관리자 서비스 3020 은 백엔드 내부용 — 프론트가 직접 부르지 않는다.
  - 백엔드 CORS 는 `http://localhost:5000` 을 허용하도록 맞춰져 있다 — 프론트를 다른 포트로 띄우면 브라우저 호출이 막힐 수 있다.
  - `next/image` 는 `localhost:3000` 사진을 허용해 둔다(`next.config.ts:11-16`, 포트는 `NEXT_IMAGE_PORT`).
- **Docker = 운영**: `output: "standalone"` (`next.config.ts:34`). 빌드 때 BuildKit secret 으로 `.env.production` 을 붙이고(`Dockerfile:22`), 실행 때 `env_file` (`docker-compose.yml:9`). 이미지 안에 `.env` 는 남지 않는다.
- **basePath**: `NEXT_PUBLIC_LOCAL_SERVER_PREFIX` (`next.config.ts:41`) — Nginx 하위 경로 배포용.

### 경로 모달
주소가 있어야 하는 팝업(목록에서 열면 팝업, 새로고침 · 직접 접속이면 보통 페이지)은 Next.js Parallel Routes + Intercepting Routes 로 만든다 (선택: 사용자 · 표준: Next.js 문서 parallel-routes "Modals").
- 슬롯은 루트 하나 — `src/app/@modal/`. 루트 layout 이 `modal` prop 으로 받아 `RootLayoutContent` 의 Provider 안에서 그린다.
- 가로채는 팝업: `src/app/@modal/(.)<주소>/page.tsx` 에서 `<RouteModal title="…">` 로 화면 내용을 감싼다. `(.)` 는 루트 기준(괄호 폴더 · 슬롯은 주소에 안 나옴) — 예 `@modal/(.)stores/[store_id]/page.tsx` 가 `/stores/[store_id]` 를 가로챈다.
- 같은 주소의 보통 페이지(`src/app/<주소>/page.tsx`)를 반드시 같이 둔다 — 새로고침 · 직접 접속 · 공유 링크용.
- 화면 내용(`<화면>Content.tsx`)은 보통 페이지 폴더에 두고, 가로채기 page 가 `@/app/<영역 경로>/<주소>/<화면>Content` 로 가져온다 — 두 page 가 같은 Content 를 그린다.
- `@modal/default.tsx`(null) · `@modal/[...catchAll]/page.tsx`(null) 는 지우지 않는다 — 팝업을 연 채 다른 주소로 가면 이것이 슬롯을 비운다.
- 미적용: `[...catchAll]` 은 `/` 에 맞지 않아, 팝업 안 링크로 홈(`/`)에 가면 팝업이 남을 수 있다(코드상 추론 · 미확인). 실제 경로 모달을 처음 만들 때 `@modal/page.tsx`(null) 를 같이 추가한다.
- 닫기는 `RouteModal` 이 `router.back()`. 주소가 필요 없는 확인 · 사유 입력은 경로 모달이 아니라 `ConfirmModal` · `ReasonModal`.
- 예시: `/dev/ui` → "경로 모달 열기"(`src/app/@modal/(.)dev/ui/modal-demo/page.tsx` 가 `src/app/dev/ui/modal-demo/ModalDemoContent.tsx` 를 가져온다 · 보통 페이지 `src/app/dev/ui/modal-demo/page.tsx`).

### SSR 에서 뺄 라이브러리
`window` 를 쓰는 라이브러리는 `next/dynamic(() => import(...), { ssr: false })` 로 감싼 래퍼를 통해서만 쓴다 (`src/shared/components/Editor.tsx:7`, `src/shared/components/chart/Chart.tsx:5`).

### 외부 스크립트
`document.getElementById(<ID>)` 로 이미 붙었는지 보고, 없으면 한 번만 붙인 뒤 `load` 를 Promise 로 기다린다 (`src/shared/components/KakaoMap.tsx:26-45`, `src/shared/utils/address.ts:19-38`).

### Import Alias
`@/*` → `./src/*` 하나만 (`tsconfig.json:30`). 테스트도 같은 별칭 (`vitest.config.mts` 의 `resolve.tsconfigPaths`).
