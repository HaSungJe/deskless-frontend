# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **⚠️ 주의사항**: `npm run` 명령은 반드시 사용자가 직접 실행 (Claude 실행 금지)

## 커밋 메시지

형식 고정 — 첫 줄은 커밋한 날짜(`YYYY.MM.DD`), 한 줄 비우고 작업 내용을 `- ` 목록으로. 작업 내용은 간결하게 한 줄씩. 이 형식 밖의 줄(Co-Authored-By 같은 서명)은 붙이지 않는다.

```
2026.11.13

- 작업내용 1
- 작업내용 2
```

## 개발 지침서 — `frontend/`

백엔드가 넘겨준 인계 문서. 화면을 만들 때는 이 문서를 기준으로 한다.

- [frontend/README.md](frontend/README.md) — 읽는 순서 · 시안(아티팩트) 링크
- [frontend/screens.md](frontend/screens.md) — 화면 목록(키 U1~U11 · M1~M8 · A1~A6)과 주소, 화면마다 구성 · 쓰는 API
- [frontend/api.md](frontend/api.md) — API 목록과 호출 방식(영역별 로그인 토큰 · 동기 / 큐 SSE · 실패 · 목록 · 파일 올리기 · 결제)
- [frontend/dto/](frontend/dto/) — 요청 · 응답 DTO 사본(`class-validator`)
- [frontend/changes/](frontend/changes/README.md) — 이후 백엔드 수정 요청. 위에서부터 차례로 반영하고, 어디까지 반영했는지 이 저장소에 기록한다
- [frontend/design/](frontend/design/) — 시안 원본 HTML(색 · 간격 값)

⚠️ 지금 기초 소스의 인증(토큰 1벌 · `/api/v1/user/refresh`) · 오류(`validationErrors`) · 페이지네이션(camelCase) 은 예전 백엔드 기준이다. 지침서는 영역(이용자 `/` · 매니저 `/manager` · 관리자 `/admin`)마다 토큰이 따로고, 쓰기 API 는 SSE 큐, 응답 키는 snake_case — 개발 단계에서 지침서에 맞춰 바꾼다.

## 실행 환경

- **로컬 개발**: `npm run dev` → http://localhost:5000 (Turbopack). 환경변수는 `.env.local`.
- **Docker = 운영**: `docker compose up -d --build` → 5000 포트. 환경변수는 `.env.production` 하나로 관리한다.
  - `NEXT_PUBLIC_*` · `basePath` · 이미지 호스트는 `next build` 때 코드에 박힌다 — 바꾸면 이미지를 다시 빌드한다.
  - 빌드 때는 BuildKit secret 으로 `.env.production` 을 잠깐 붙이고, 실행 때는 `env_file` 로 넘긴다(이미지 안에 `.env` 파일은 남지 않는다).
  - `next.config.ts` 의 `output: "standalone"` 으로 `.next/standalone` 만 이미지에 담는다.
- 환경변수 목록과 설명은 [.env.example](.env.example).

## Architecture

Next.js 16 App Router (Korean UI) using React 19 with TypeScript. React Compiler is enabled (`reactCompiler: true` in `next.config.ts`). `trailingSlash: true` — 모든 URL은 `/`로 끝남 (링크 작성 시 주의).

### 디렉토리 구조

```
src/
├─ app/                      라우팅만 — page · layout 은 얇게(서버 컴포넌트), 화면 내용은 features 에서
│  ├─ (user)/                이용자 `/` · 모바일 (괄호 폴더는 주소에 안 나옴)
│  ├─ manager/               업체 관리자 `/manager` · PC 콘솔
│  │  ├─ [store_code]/…      M1 업체별 로그인 · 아이디 찾기 · 비밀번호 초기화
│  │  └─ (console)/          콘솔 layout + 매니저 인증 — M2~M8
│  ├─ admin/                 총관리자 · 관리자 `/admin` · PC 콘솔
│  │  └─ (console)/          콘솔 layout + 관리자 인증 — A2~A6
│  └─ api/                   route handler — 쿠키 · 결제 승인 · next-auth
├─ features/<영역>/<화면>/    화면 내용 ('use client') — <화면>Content.tsx. 영역은 user · manager · admin
├─ domains/<도메인>/          백엔드 계약 — frontend/dto/<도메인>.md 와 1:1 (api.ts 엔드포인트 함수 · dto.ts DTO 사본)
│                             도메인: common · user · discovery · reservation · store · manager · admin · room · stats
└─ shared/                   도메인을 모르는 공통 코드
   ├─ api/                   http 클라이언트 · 쿠키 · 실패 처리
   ├─ components/  hooks/  utils/  types/
   └─ providers/             전역 Context (RootLayoutProvider)
```

- **import 방향은 한쪽으로만**: `app → features → domains → shared`. 아래 계층이 위 계층을 가져오면 ESLint(`import/no-restricted-paths`) 오류. 여러 곳에서 쓰게 되면 아래 계층으로 옮긴다.
- 영역 폴더(`manager/` · `admin/` · `domains/`)는 그 화면을 만들 때 생긴다.
- 한 화면에서만 쓰는 컴포넌트 · DTO 는 그 `features/<영역>/<화면>/` 안에 둔다(colocation). 백엔드 DTO 는 `domains/` 에만 둔다.

### Auth Flow

Auth is JWT-based with httpOnly cookies managed through Next.js API routes (`src/app/api/cookie/`):

- On every route change, `RootLayoutContent` calls `/api/cookie/access` to check auth state
- The server-side API route reads httpOnly cookies and auto-refreshes the access token using the refresh token if near expiry (within 60s)
- Auth state flows down via three React contexts exported from `src/shared/providers/RootLayoutProvider.tsx`:
  - `RootLayoutLoadingContext` — whether auth check is still in progress
  - `AccessTokenContext` — `{ accessToken, setAccessToken }`
  - `IsLoginContext` — boolean login state
- 로그인이 필요한 영역은 layout 에서 `<AuthGuard loginPath="그 영역 로그인 주소">` 로 감싼다(`src/shared/components/AuthGuard.tsx`, 기본 `/login`) — 확인 중이면 `Loading`, 로그인이 안 돼 있으면 `loginPath` 로 이동
- SNS 로그인은 next-auth(`src/app/api/auth/[...nextauth]/route.ts`)

### Key Patterns

**Validation** (`src/shared/utils/validation.ts`): Form Dtos use `class-validator` decorators. Validation errors are surfaced to the UI via `<span data-type="validation-alert" data-id="fieldName">` elements. Call `validateAction(dto)` before submitting. For nested DTOs use `validateActionChildren(dto, key)` where `key` matches `data-key` on the span. Call `resetValidationError()` to clear all validation error spans. `showValidationErrors(errors, key?)` 는 오류 목록을 span 에 표시하고 표시한 개수를 돌려준다(칸 이름은 escape 하므로 `hours.0.open_time` 같은 점 경로도 된다).

**Axios wrappers** (`src/shared/api/axios.ts`): exports `axiosGet/Post/Put/Patch/Delete` — these accept an `AccessType` object `{ accessToken, setAccessToken }` and auto-retry up to 5 times on 401 by refreshing the token. 모두 `(access, url, body?, headers?)` 순서이고 `axiosGet` 만 body 가 없다(`axiosDelete` 도 body 를 세 번째 인자로 넘긴다).

**Axios error handler** (`src/shared/api/axios-error.ts`): `axiosErrorHandle(error, isReset?)` — call in catch blocks to handle API error responses. Displays `validationErrors` array from response to matching `<span data-type="validation-alert">` elements, or falls back to `alert(message)`.

**Cookie utilities** (`src/shared/api/cookie.ts`): (client-side) proxies through Next.js API routes to read/write httpOnly cookies. Never access cookies directly from client components. Exports: `getAccessToken`, `getAccessTokenData`, `checkAuth`, `setAccessToken`, `setRefreshToken`, `deleteToken`, `getSNSAccessToken`, `deleteSNSAccessToken`.

**Query helpers** (`src/shared/utils/util.ts`): `createQueryString(obj)` builds a `?key=val&…` string (키 · 값은 `encodeURIComponent`). Use instead of `URLSearchParams` since `useSearchParams` is unavailable in some script contexts.

**주소 검색** (`src/shared/utils/address.ts`): `searchAddress(zip?, addr1?)` — 다음 우편번호 팝업을 열어 선택 시 `zip(zonecode)`, `addr1(address)` 콜백을 호출. 스크립트는 처음 한 번만 붙인다. 주소 검색 화면은 처음 그릴 때 `loadAddressSearchScript()` 로 미리 불러 두면 첫 클릭이 빠르다.

**Hooks** (`src/shared/hooks/`): 입력 훅은 모두 `{ value, onChange, setValue, resetValue }` 반환.
- `useInput(initValue?)` — 문자열 입력
- `useInputNumber(isNumberString, initValue?)` — 정수 입력(숫자 외 문자는 지운다). `isNumberString=true`면 string 타입으로 저장
- `useInputFloat(isNumberString, initValue?)` — 실수 입력 (소수점 하나 허용, 입력 중인 `1.` · `1.0` 은 문자열로 둔다)
- `useInputDate(dot, filter, initValue?)` — 날짜 입력. `dot`은 구분자 (예: `'.'`, `'-'`), `filter` 는 쓸 자리(`['Y', 'M', 'D']`), YYYYMMDD 자동 포맷. `filter` 도 함께 반환
- `useInputTime(level, initValue?)` — 시간 입력. `level: 'HOUR' | 'MINUTE' | 'SECOND'` (입력 자리수 제어)
- `useCheckboxGroup(list, key)` — 체크박스 그룹. 체크박스에 `data-id={item[key]}` 를 붙인다. `{ isAllSelected, selected, toggle, toggleAll }` 반환(`selected` 는 목록의 원래 값 타입)

**Shared components** (`src/shared/components/`): `AuthGuard`, `Pagination`, `Editor` (`QuillEditor`, react-quill-new), `KakaoMap`, `Loading` (react-spinners, `NEXT_PUBLIC_LOADING=1` 일 때만), `Timer`, `Scripts` (external script loader), and chart wrappers (`BarChart`, `LineChart`, `DonutChart`) using ApexCharts. 여러 영역 · 화면에서 재사용되는 컴포넌트만 이 폴더에 배치.
- quill · apexcharts 는 `window` 를 써서 `next/dynamic` 의 `ssr: false` 로 불러온다(`Editor.tsx`, `chart/Chart.tsx`). 이런 라이브러리를 새로 쓸 때도 같은 방식으로.
- `DonutChart` 의 `series` 는 `labels` 순서대로 숫자 배열.

**화면 컴포넌트** (`src/features/<영역>/<화면>/`): 파일 이름은 `<화면>Content.tsx` (예: `features/user/login/LoginContent.tsx`). `app/` 의 `page.tsx` 는 이 컴포넌트를 그리기만 한다.

**목록 페이지 패턴** (`src/features/**/list/`): 검색+정렬+페이지네이션이 있는 목록 페이지의 표준 구현 패턴. `queryString` state를 중간 매개로 사용해 검색 트리거를 통일한다.

```
// 1. 초기값은 URL searchParams에서 읽어 뒤로가기 시 상태 복원
const searchParams = useSearchParams();
const [page, setPage] = useState<string>(searchParams.get('page') ?? '1');
const searchType = useInput(searchParams.get('search_type') ?? 'ALL');

// 2. queryString state — 모든 검색 조건을 하나로 통합
const [queryString, setQueryString] = useState<string>(createQueryString({ page, ... }));

// 3. useEffect 체인
useEffect(() => { search(); }, []);                        // ① 페이지 시작 시 초기 조회
useEffect(() => { setQueryString(createQueryString({...})); }, [page]);        // ② 페이지 변경 → queryString 갱신
useEffect(() => { setQueryString(createQueryString({...})); }, [sort1, sort2]); // ③ 정렬 변경 → queryString 갱신 (정렬 있을 때만)
useEffect(() => { search(); }, [queryString]);              // ④ queryString 변경 → 실제 API 호출

// 4. 검색 버튼 클릭 — page를 1로 초기화하여 queryString 갱신 → ④가 search() 트리거
function action() {
    setQueryString(createQueryString({ page: 1, ...searchConditions }));
}

// 5. 페이지네이션 — movePage에 setPage 직접 전달
<Pagination pagination={pagination} movePage={setPage} />
```

`useSearchParams` 를 쓰는 화면은 `page.tsx` 에서 `<Suspense>` 로 감싼다.

**Types** (`src/shared/types/`):
- `access.ts` — `AccessTokenContextType`, `AccessTokenDecodeType`
- `pagination.ts` — `PaginationType` (백엔드 페이지네이션 응답 형식)

Import these instead of redefining locally.

### Path Aliases

| Alias | Resolves to |
|-------|-------------|
| `@/*` | `./src/*` |

### Environment Variables

전체 목록 · 빌드 시점/실행 시점 구분은 [.env.example](.env.example).

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SERVER_URL` | Next.js server URL (default: `http://localhost:5000`) |
| `NEXT_PUBLIC_SERVER_NAME` | 브라우저 탭 타이틀 및 OG 메타 제목 |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_JWT_CODE` | JWT 검증 키 — 서버 route handler 에서만 쓴다(클라이언트 코드에서 쓰면 브라우저 번들에 들어간다) |
| `NEXT_PUBLIC_LOCAL_SERVER_PREFIX` | Base path prefix for Nginx reverse proxy |
| `NEXT_PUBLIC_LOADING` | Show/hide loading indicator (`1` 이면 표시) |
| `NEXT_PUBLIC_DAUM_MAP_API_KEY` | 카카오 지도 앱 키 |
| `SERVER_DOMAIN` | Cookie domain (leave unset for localhost) |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | next-auth (운영에서 `NEXTAUTH_SECRET` 필수) |
| `KAKAO_LOGIN_*` / `NAVER_LOGIN_*` / … | SNS 로그인 클라이언트 ID · 시크릿 |
| `NEXT_IMAGE_HOSTNAME` / `NEXT_IMAGE_PORT` | Allowed remote image host for `next/image` |

### TypeScript Config Notes

- `experimentalDecorators` and `emitDecoratorMetadata` are enabled (required for `class-validator`)
- `strictNullChecks` is disabled — avoid relying on null-safety checks
- `strictPropertyInitialization` is disabled
