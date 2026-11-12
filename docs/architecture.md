# Architecture

Next.js 16.4 App Router (`package.json:17`) · React 19.3 (`package.json:20`) + React Compiler (`next.config.ts:37`) · TypeScript 5 · axios 1 (`package.json:13`) · class-validator 0.14 (`package.json:14`) · next-auth 4 (`package.json:18`) · dayjs · nextjs-toploader · apexcharts / react-apexcharts · react-quill-new · react-spinners · Vitest 5 + Testing Library + jsdom (선택: 사용자) · CSS Modules (선택: 사용자 · 아직 CSS 없음).

## Directory Layout

```
src/
├─ app/                              라우팅만 — 서버 컴포넌트 page · layout, 화면 내용은 features 에서
│  ├─ layout.tsx                     루트 html · metadata · RootLayoutContent
│  ├─ RootLayoutContent.tsx          ('use client') 로그인 상태 확인 + Provider + TopLoader
│  ├─ (user)/                        이용자 `/` · 모바일 (괄호 폴더는 주소에 안 나옴)
│  │  ├─ page.tsx                    U1 `/`
│  │  └─ login/page.tsx              U5 `/login`
│  ├─ manager/                       업체 관리자 `/manager` · PC 콘솔 (첫 화면을 만들 때 생김)
│  │  ├─ [store_code]/…              M1 업체별 로그인 · 아이디 찾기 · 비밀번호 초기화
│  │  └─ (console)/                  콘솔 layout + 매니저 AuthGuard — M2~M8
│  ├─ admin/                         관리자 `/admin` · PC 콘솔 (첫 화면을 만들 때 생김)
│  │  └─ (console)/                  콘솔 layout + 관리자 AuthGuard — A2~A6
│  └─ api/                           route handler — cookie/* (토큰 쿠키) · auth/[...nextauth] (SNS)
├─ features/<영역>/<화면>/            화면 내용 — <화면>Content.tsx ('use client') · 그 화면 전용 컴포넌트 · dto.ts
│                                    영역: user · manager · admin
├─ contracts/                        백엔드 계약 — 지침서 frontend/dto/*.md 의 사본 (첫 API 를 만들 때 생김)
│  ├─ common/                        pagination.dto.ts · 실패 DTO · 상태 상수
│  └─ <도메인>/                       user · discovery · reservation · store · manager · admin · room · stats
│     ├─ dto/<파일>.dto.ts           지침서 파일 이름 그대로
│     └─ api.ts                      그 도메인 엔드포인트 함수
└─ shared/                           도메인을 모르는 공통
   ├─ api/                           axios.ts(토큰 + 401 재시도) · axios-error.ts · cookie.ts
   ├─ components/                    AuthGuard · Pagination · Editor · KakaoMap · Loading · Timer · Scripts · chart/
   ├─ hooks/                         useInput · useInputNumber · useInputFloat · useInputDate · useInputTime · useCheckboxGroup
   ├─ providers/                     RootLayoutProvider (전역 Context)
   ├─ types/                         access.ts · pagination.ts
   └─ utils/                         validation.ts · address.ts · util.ts
```

- `contracts/` 는 지침서(frontend/dto/user.md:3 — "프론트에는 `contracts/user/dto/<파일>` 로 둔다")와 같은 자리다. DTO 끼리의 상대 import(`'../../common/pagination.dto'` — frontend/dto/manager.md:75)가 그대로 맞으려면 `contracts/<도메인>/dto/` · `contracts/common/` 깊이를 지킨다.
- 루트의 `frontend/` 는 코드가 아니라 지침서다(빌드 · Docker 이미지에서 제외 — `.dockerignore`).

## Layer Boundaries

| 계층 | 할 일 | 가져다 쓸 수 있는 것 |
|---|---|---|
| `app/` | 주소 · layout · route handler. page 는 `<화면>Content` 를 그리기만 | features · contracts · shared |
| `features/` | 화면 상태 · 이벤트 · 제출 흐름 | contracts · shared |
| `contracts/` | 백엔드 DTO · 엔드포인트 함수 | shared |
| `shared/` | 도메인을 모르는 공통 | (없음) |

ESLint `import/no-restricted-paths` 가 거꾸로 가는 import 를 오류로 막는다 (`eslint.config.mjs:12-35`). 여러 화면이 같이 쓰게 되면 아래 계층으로 옮긴다 — 예: 로그인 Context 는 features 와 shared 가 같이 써서 `shared/providers/` 에 있다 (`src/shared/providers/RootLayoutProvider.tsx`).

## Minimal File Structure for a New Screen

```
src/app/<영역 경로>/<주소>/page.tsx               서버 컴포넌트 — <화면>Content 만 그림
src/features/<영역>/<화면>/<화면>Content.tsx       'use client' 화면
src/features/<영역>/<화면>/<화면>Content.test.tsx  [SUCCESS]/[FAIL:*]
src/features/<영역>/<화면>/<화면>Content.module.css
src/contracts/<도메인>/dto/<파일>.dto.ts           (처음 쓰는 API 면) 지침서 사본
src/contracts/<도메인>/api.ts                      (처음 쓰는 API 면) 엔드포인트 함수
```
측정 근거: `src/app/(user)/login/page.tsx` + `src/features/user/login/LoginContent.tsx` (page 는 Content 만 그림). CSS · contracts 는 선택 · 구조 결정이라 아직 실제 파일이 없다.

## Procedure for Adding a New Screen

1. `frontend/screens.md` 에서 화면 키(U · M · A)의 주소 · 구성 · 쓰는 API 를 읽고, 시안(`frontend/design/<영역>.html`)에서 같은 키의 화면을 찾는다.
2. 주소대로 `src/app/` 아래 page 를 만든다 — 이용자는 `(user)/`, 매니저 · 관리자 콘솔은 `manager/(console)/` · `admin/(console)/`. `useSearchParams` 를 쓰면 page 에서 `<Suspense>` 로 감싼다.
3. 쓰는 API 의 DTO 를 `frontend/dto/<도메인>.md` 에서 `src/contracts/<도메인>/dto/` 로 옮기고, 엔드포인트 함수를 `contracts/<도메인>/api.ts` 에 만든다.
4. `src/features/<영역>/<화면>/<화면>Content.tsx` 에 화면을 만든다.
5. 로그인이 필요한 영역이면 그 영역 layout 이 `<AuthGuard loginPath="…">` 로 감싸는지 확인한다.
6. 옆에 `*.test.tsx` 를 쓰고 `npx vitest run <이름>` 으로 확인한다.

## Key Patterns

### Entry Points
- **page / layout**: 서버 컴포넌트, `'use client'` 없음 (`src/app/(user)/login/page.tsx:1-8`, `src/app/(user)/page.tsx`). 화면 컴포넌트에서 `'use client'` 를 선언한다 (`LoginContent.tsx:1`).
- **route handler**: `src/app/api/**/route.ts` 에서 `GET` · `POST` · `DELETE` 를 export, 응답은 `new Response(JSON.stringify({success, data?}), {headers})` (`src/app/api/cookie/access/route.ts:36`). `'use server'` 는 붙이지 않는다.

### Data Layer
→ [data-layer.md](data-layer.md)

### Boundary / Environment
- **서버 전용**: `cookies()` · `headers()`(`next/headers`), `jsonwebtoken`, SNS 시크릿은 route handler 에서만 (`access/route.ts:1-4`, `src/app/api/auth/[...nextauth]/route.ts`). 클라이언트 코드는 `src/shared/api/cookie.ts` 로 route handler 를 거친다.
- **`NEXT_PUBLIC_*`** 는 빌드할 때 서버 · 클라이언트 번들에 박힌다. 이름에 `NEXT_PUBLIC_` 이 붙은 시크릿(`NEXT_PUBLIC_JWT_CODE`)은 서버 코드에서만 참조한다 — 클라이언트 코드에서 쓰면 브라우저로 나간다.
- **환경 파일**: 로컬 개발 `.env.local`(`npm run dev`, 5000 포트 — `package.json:6`), Docker 운영 `.env.production`. 목록 · 빌드/실행 시점 구분은 [.env.example](../.env.example).
- **Docker = 운영**: `output: "standalone"` (`next.config.ts:34`). 빌드 때 BuildKit secret 으로 `.env.production` 을 붙이고(`Dockerfile:22`), 실행 때 `env_file` (`docker-compose.yml:9`). 이미지 안에 `.env` 는 남지 않는다.
- **basePath**: `NEXT_PUBLIC_LOCAL_SERVER_PREFIX` (`next.config.ts:41`) — Nginx 하위 경로 배포용.

### SSR 에서 뺄 라이브러리
`window` 를 쓰는 라이브러리는 `next/dynamic(() => import(...), { ssr: false })` 로 감싼 래퍼를 통해서만 쓴다 (`src/shared/components/Editor.tsx:7`, `src/shared/components/chart/Chart.tsx:5`).

### 외부 스크립트
`document.getElementById(<ID>)` 로 이미 붙었는지 보고, 없으면 한 번만 붙인 뒤 `load` 를 Promise 로 기다린다 (`src/shared/components/KakaoMap.tsx:26-45`, `src/shared/utils/address.ts:19-38`).

### Import Alias
`@/*` → `./src/*` 하나만 (`tsconfig.json:30`). 테스트도 같은 별칭 (`vitest.config.mts` 의 `resolve.tsconfigPaths`).
