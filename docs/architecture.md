# Architecture

Node 24.22.3 (`.nvmrc` · `package.json` engines · `Dockerfile:7` — 로컬 · 운영 이미지가 같은 버전) · Next.js 16.4 App Router (`package.json:21`) · React 19.3 (`package.json:25`) + React Compiler (`next.config.ts:37`) · TypeScript 5 · fetch(HTTP 라이브러리 없음) · class-validator 0.14 (`package.json:19`) + class-transformer 0.5(`@Type` — `package.json:18`) · reflect-metadata 0.2(`@Type` 이 부르는 shim — `src/instrumentation.ts` · `instrumentation-client.ts` 가 먼저 불러옴, `package.json:30`) · next-auth 4 (`package.json:22`) · dayjs · nextjs-toploader · apexcharts / react-apexcharts · react-quill-new · react-spinners · swiper(객실 사진 · 그룹 넘기기) · qrcode.react(문 QR) · Vitest 5 + Testing Library + jsdom (선택: 사용자) · CSS Modules (선택: 사용자 · 아직 CSS 없음).

## Directory Layout

```
src/
├─ app/                              라우팅 + 화면 — 서버 컴포넌트 page · layout, 그 옆에 <화면>Content.tsx ('use client')
│  ├─ layout.tsx                     루트 html · metadata · 글꼴 · css/globals.css · RootLayoutContent · modal 슬롯
│  ├─ css/                           css 모음 (주소가 되지 않음 — page.tsx 없음)
│  │  ├─ globals.css                 디자인 토큰(색 한 벌 · 영역별 크기) · 기본 스타일
│  │  └─ <영역>/                      화면 css — <화면>Content.module.css (user · manager · admin · console(두 콘솔 공통 화면) · dev)
│  ├─ RootLayoutContent.tsx          ('use client') 영역 판별 · 그 영역 토큰 확인 + Provider + TopLoader + ErrorPopup
│  ├─ @modal/                        경로 모달 슬롯(루트 하나) — default · [...catchAll] · (.)<주소>/page.tsx
│  ├─ dev/ui/                        개발 전용 — /dev/ui 공통 UI 미리보기 · UiPreviewContent.tsx (운영 404)
│  ├─ (user)/                        이용자 `/` · 모바일 (괄호 폴더는 주소에 안 나옴)
│  │  ├─ layout.tsx · UserLayoutContent.tsx  이용자 틀(모바일 폭 · 하단 탭 · 내 정보 Context)
│  │  ├─ _components/                UserMeProvider · UserTopBar(이전 화면 · 바로방 · 지나온 화면 › 지금 화면) · UserBackButton · UserHistoryProvider(referrer · 이동 → canGoBack) · user-history.ts(UserHistoryContext · canGoHistoryBack) · UserTabBar · MemberStateBand
│  │  ├─ page.tsx · HomeContent.tsx  U1 `/`
│  │  ├─ login/ · signup/ · phone-verification/ · find-login-id/  U5
│  │  └─ inquiries/                 문의(screens.md 밖) — 내 문의 목록 · new/(문의하기 · _components/ StorePicker · StoreMapModal) · [inquiry_id]/ · inquiry-format.ts(주소 · 문의 대상 이름)
│  ├─ manager/                       업체 관리자 `/manager` · PC 콘솔 — layout.tsx(data-area="console") · manager-auth.ts(업체코드 쿠키 · 업체 로그인 주소 · 권한 배지)
│  │  ├─ [store_code]/login · find-login-id · password-reset   M1 업체별 로그인 · 아이디 찾기 · 비밀번호 초기화(로그인 전)
│  │  ├─ login/ · password/          M1 업체 로그인 주소 안내(서버가 업체코드 쿠키로 보냄) · 비밀번호 변경(AuthGuard)
│  │  └─ (console)/                  콘솔 layout + 매니저 AuthGuard · 메뉴 · 콘솔 Context(내 업체 · 계정) — M2 대시보드 ~ M8 · inquiries/(문의 — _console 한 벌에 scope="manager")
│  ├─ admin/                         관리자 `/admin` · PC 콘솔 — layout.tsx(data-area="console") · admin-auth.ts(로그인 뒤 주소 · 권한 배지) · login/ · (console)/(layout · 메뉴 · 첫 화면 대시보드 · password/ · store-applications/ · stores/ · managers/ · users/ · inquiries/(문의 — _console 한 벌에 scope="admin") · _components/(StoreFilesCard) · admin-paths.ts(관리자 화면 주소))
│  │  └─ (console)/                  콘솔 layout + 관리자 AuthGuard — A2~A6
│  ├─ _console/                      두 콘솔이 같이 쓰는 화면(밑줄 폴더 — 주소가 되지 않음) — inquiries/(InquiryManageList · InquiryManageDetail · inquiry-manage.ts 영역별 API · 주소 · 할 수 있는 일)
│  └─ api/                           route handler — cookie/[area] · cookie/[area]/refresh (영역 토큰 쿠키) · cookie/token-cookie.ts · auth/[...nextauth] (SNS OAuth) · cookie/[area]/account (기억한 계정 읽기) · user/sns-login · user/sign (이용자 로그인 · 가입 — 백엔드까지) · manager/login · admin/login (매니저 · 관리자 로그인 — 백엔드까지) · payments/confirm (토스 결제 승인) · route-util.ts(json · isSameSiteJson · 로그인 공통 backendLogin)
├─ contracts/                        백엔드 계약 — 지침서 frontend/dto/*.md 의 사본 (첫 API 를 만들 때 생김)
│  ├─ common/                        pagination.dto.ts · fail-result.dto.ts · roles.ts · sse.ts · reservation.constants.ts (지침서 사본) · lookup.ts · store.constants.ts · member.constants.ts (여러 영역이 쓰는 백엔드 값)
│  └─ <도메인>/                       user · manager · admin(재발급 — Phase 3) · discovery · reservation · store · room · stats · inquiry
│     ├─ dto/<파일>.dto.ts           지침서 파일 이름 그대로
│     └─ api.ts                      그 도메인 엔드포인트 함수
├─ shared/                           도메인을 모르는 공통
   ├─ api/                           request.ts(동기 · ApiError · NetworkError) · queue.ts(큐 SSE) · sse.ts · auth.ts(withAuth) · error.ts(handleApiError) · cookie.ts(영역 토큰 쿠키 route handler 부르기) · route.ts(가입 · 로그인 route 부르기 postRoute · routeFailure · loginFailureOf) · upload.ts(uploadFile) · payment.ts(requestTossConfirm)
   ├─ components/                    AuthGuard · Editor · Loading · Timer · Scripts · chart/ · console/(ConsoleShell · ConsoleAuthFrame · ConsoleAuthCard · console-menu.ts · 목록 거르기 ListFilter · FilterChips · FilterSelect) · 외부 연동 map/(StoreMap) · sms/(SmsVerification) · upload/(ImageUploader) · payment/(TossPaymentWidget) (docs/integrations.md)
   │  └─ ui/                         공통 UI 부품 — button/ · form/ · display/ · nav/(Tabs · Pagination) · modal/(… · ErrorPopup) (docs/conventions.md 스타일)
   ├─ css/                           공통 부품 css — components/ 와 같은 경로 (ui/form/Input.module.css · Loading.module.css)
   ├─ hooks/                         useInput · useInputNumber · useInputFloat · useInputDate · useInputTime · useCheckboxGroup · useMyLocation · useConsoleLogout
   ├─ providers/                     RootLayoutProvider (RootLayoutLoadingContext · AuthContext)
   ├─ types/                         pagination.ts · map.ts
   └─ utils/                         validation.ts · address.ts(우편번호 · 주소 → 좌표) · kakao-map.ts(카카오 SDK) · file.ts(사진 형식) · util.ts · site.ts(서비스 이름 SITE_NAME — 바로방) · format.ts(한국 시각 · 금액 · 요일) · area.ts(영역 · 로그인 주소) · error-popup.ts(오류 팝업 저장소)
└─ test/                             테스트 — src 와 같은 경로 (shared/api/request.test.ts …)
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
측정 근거: `src/app/dev/ui/page.tsx` + `src/app/dev/ui/UiPreviewContent.tsx` (page 는 Content 만 그림). CSS · contracts 는 선택 · 구조 결정이라 아직 실제 파일이 없다.

## Procedure for Adding a New Screen

1. `frontend/screens.md` 에서 화면 키(U · M · A)의 주소 · 구성 · 쓰는 API 를 읽고, 시안(`frontend/design/<영역>.html`)에서 같은 키의 화면을 찾는다.
2. 주소대로 `src/app/` 아래 page 를 만든다 — 이용자는 `(user)/`, 매니저 · 관리자 콘솔은 `manager/(console)/` · `admin/(console)/`. 두 콘솔이 부르는 경로만 다른 같은 화면이면 몸통을 `src/app/_console/<주소>/` 에 한 벌(`scope` 를 받는다) 두고 두 영역의 Content 가 `scope` 만 넘긴다(`src/app/_console/inquiries/`). `useSearchParams` 를 쓰면 page 에서 `<Suspense>` 로 감싼다.
3. 쓰는 API 의 DTO 를 `frontend/dto/<도메인>.md` 에서 `src/contracts/<도메인>/dto/` 로 옮기고, 엔드포인트 함수를 `contracts/<도메인>/api.ts` 에 만든다.
4. 그 `page.tsx` 옆에 `<화면>Content.tsx` 로 화면을 만든다.
5. 로그인이 필요한 영역이면 그 영역 layout 이 `<AuthGuard>` 로 감싸는지 확인한다(영역 로그인 주소는 주소로 안다).
6. 옆에 `*.test.tsx` 를 쓰고 `npx vitest run <이름>` 으로 확인한다.

## Key Patterns

### Entry Points
- **page / layout**: 서버 컴포넌트, `'use client'` 없음 (`src/app/(user)/page.tsx`, `src/app/(user)/login/page.tsx:5` — query 가 필요하면 async page 가 `searchParams` 를 읽어 넘긴다). 화면 컴포넌트에서 `'use client'` 를 선언한다 (`src/app/dev/ui/UiPreviewContent.tsx:1`).
- **route handler**: `src/app/api/**/route.ts` 에서 `GET` · `POST` · `DELETE` 를 export, 응답은 `new Response(JSON.stringify({success, data?}), {headers})` — 토큰 쿠키 · 결제 승인 route handler 는 `json({success, data?, retry?, message?, code?})` (`src/app/api/route-util.ts:18`). 동적 세그먼트 인자는 `RouteContext<'/api/cookie/[area]'>` (`src/app/api/cookie/[area]/route.ts:11`). route 파일은 Next.js 가 허용한 이름(`GET` · `POST` …)만 export 하므로 상수 · 함수는 옆 파일에 둔다(`src/app/api/payments/confirm/toss-confirm.ts`). `'use server'` 는 붙이지 않는다.

### Data Layer
→ [data-layer.md](data-layer.md)

### Boundary / Environment
- **서버 전용**: `cookies()` · `headers()`(`next/headers`), `getToken`(`next-auth/jwt` — SNS 세션), SNS · 결제 시크릿은 route handler 에서만 (`src/app/api/cookie/token-cookie.ts:1`, `src/app/api/auth/[...nextauth]/route.ts`). 클라이언트 코드는 `src/shared/api/cookie.ts` 로 route handler 를 거친다.
- **`NEXT_PUBLIC_*`(공개 값)는 실행 때 읽는다** (frontend/changes/2026-11-24-runtime-public-env.md): 읽기는 `getPublicEnv(key)`(`src/shared/utils/public-env.ts`) 한 곳 — 서버는 요청 때 `process.env[key]`(동적 키라 빌드가 바꿔 박지 않는다), 브라우저는 루트 layout 이 넘긴 값. 루트 layout(`src/app/layout.tsx`)은 `await connection()` 으로 요청 때 그리고(빌드 때 미리 그리면 빌드 값으로 굳는다), 허용 목록 `publicEnvValues()`(`NEXT_PUBLIC_*` 중 basePath 를 뺀 것 — 서버 전용 값은 이름이 달라 실리지 않는다)를 `RootLayoutContent` 의 `publicEnv` 로 넘기면, 처음 그릴 때(아래 화면보다 먼저) `applyPublicEnv` 가 브라우저에 둔다. 메타데이터(`metadataBase` · 애드센스)도 `generateMetadata` 로 요청 때. **정적 참조 `process.env.NEXT_PUBLIC_X` 는 쓰지 않는다** — `next build` 가 서버 · 클라이언트 번들 모두에서 빌드 값으로 바꾼다. 예외는 basePath(`NEXT_PUBLIC_LOCAL_SERVER_PREFIX` — next.config 가 빌드 때 정한다). 빌드에 남는 값은 basePath · 이미지 호스트(`NEXT_IMAGE_HOSTNAME` · `NEXT_IMAGE_PORT`)뿐. 시크릿(`NEXTAUTH_SECRET` · `TOSS_SECRET_KEY`)에는 `NEXT_PUBLIC_` 을 붙이지 않는다 — 붙이면 브라우저로 넘어간다.
- **환경 파일**: 로컬 개발 `.env.local`(`npm run dev`, 5000 포트 — `package.json:6`), 운영 이미지 빌드 `.env.production`(deskless 가 빌드 secret `dotenv` 로 넘긴다), 운영 실행 env 는 deskless 차트. 목록은 [.env.example](../.env.example) — 기능 단위 절(웹 서버 · 게이트웨이 · 로그인 · 결제 · 지도 · 이미지 · 화면 · 광고 · 분석)에 키 묶음마다 한 줄 주석(`[빌드]` 바꾸면 다시 빌드 · `[실행]` 다시 띄우기만, frontend/changes/2026-11-24-env-example-layout.md). 한 줄 주석으로 줄인 뜻은 아래 "환경 값 메모".
- **환경 값 메모** (`.env.example` 의 절 순서):
  - 웹 서버 — `NEXT_PUBLIC_SERVER_URL`(웹 주소 — `metadataBase` · OG · 업체 콘솔 로그인 주소). basePath `NEXT_PUBLIC_LOCAL_SERVER_PREFIX` 는 빌드 값(아래 "basePath"). 지표 · 헬스 체크 `METRICS_PORT` · `METRICS_HOST` — 비우면 `127.0.0.1:9468`, 쿠버네티스는 deskless 차트가 `9464` · `0.0.0.0`(클러스터 안에서만 닿는다 — 아래 "지표 · 헬스 체크").
  - 게이트웨이 — 브라우저는 `NEXT_PUBLIC_API_URL`(공개 주소), 서버(route handler · 서버 컴포넌트)는 `API_INTERNAL_URL` 이 있으면 그 주소, 비면 공개 주소(`apiBaseUrl()` — `src/shared/api/request.ts`). 쿠버네티스 웹 파드 안에서 `localhost` 는 파드 자신이라, 로그인 · 가입 · 토큰 재발급 route 가 게이트웨이에 닿게 deskless 차트가 `API_INTERNAL_URL=http://gateway:3000` 을 넣는다(로컬 `npm run dev` 는 비워 둔다 — frontend/changes/2026-11-24-api-internal-url.md). 서버 전용 값이라 브라우저로 넘기지 않는다(`publicEnvValues` 허용 목록 밖).
  - 로그인 — `NEXTAUTH_SECRET` 은 개발에서도 필요(SNS 로그인 세션을 암호화하고 `/api/user/*` route 가 `getToken` 으로 푼다). `NEXTAUTH_URL` 이 https 면 세션 쿠키 이름이 `__Secure-…` — 운영은 https 주소로. basePath 를 쓰면 `NEXTAUTH_URL` 도 경로까지(`https://example.com/deskless/api/auth` — next-auth 는 경로가 있으면 그것을 자기 주소로 쓴다). `SERVER_DOMAIN` 은 토큰 쿠키 도메인(localhost 면 비운다 — data-layer.md "토큰 쿠키"). 카카오 · 네이버 개발자 콘솔에 콜백 `<origin><basePath>/api/auth/callback/kakao` · `/naver` 를 등록한다(로컬 `http://localhost:5000/api/auth/callback/kakao`).
    - 카카오 로그인(카카오 디벨로퍼스 — 지도와 같은 앱, 키는 다르다): `KAKAO_LOGIN_CLIENT_ID` = **REST API 키**(지도는 JavaScript 키), `KAKAO_LOGIN_SECRET_ID` = `[앱] > [플랫폼 키] > [REST API 키] > [클라이언트 시크릿]` 코드(키를 만들 때 켜져 있다 — 켜 두고 코드를 넣는다). 같은 REST API 키의 **리다이렉트 URI** 에 웹 주소마다 콜백을 글자 그대로 등록(로컬 `http://localhost:5000/api/auth/callback/kakao`, 쿠버네티스 `http://localhost:15000/api/auth/callback/kakao`, 운영 도메인 — 끝에 `/` 없이, next-auth 가 보내는 값은 `/api/auth/providers` 의 `callbackUrl`). `[카카오 로그인] > [사용 설정]` 상태 ON(OFF 면 `KOE004`), 리다이렉트 URI 가 다르면 `KOE006`. JavaScript SDK 도메인 · 웹 도메인은 이 로그인과 상관없다(서버가 REST API 로 한다). 키가 비면 카카오 버튼을 눌렀을 때 `/login/?error=OAuthSignin`(서버 로그 `client_id is required`) — 쿠버네티스는 deskless 가 읽는 프론트 값 파일(`frontend/.env.production`)에 두 키를 넣고 다시 띄운다.
  - 결제 · 지도 · 이미지 · 화면 · 광고 — 토스 키 이름과 쓰는 곳은 [integrations.md](integrations.md) "결제", 지도 앱 키는 "지도 · 주소", 이미지 호스트 `NEXT_IMAGE_HOSTNAME` · `NEXT_IMAGE_PORT` 는 next.config 의 `remotePatterns`(빌드 값), `NEXT_PUBLIC_LOADING`(1 이면 로딩 표시), 애드센스 · GA4 는 `src/shared/components/Scripts.tsx` 주석을 풀면 쓴다.
- **로컬 포트** (백엔드 안내 2026-11-15):
  - 프론트 `http://localhost:5000` — 이용자 `/` · 업체 관리자 `/manager` · 관리자 `/admin` 이 한 서버.
  - 백엔드 게이트웨이 `http://localhost:3000` — **프론트는 이 주소만 부른다**(`NEXT_PUBLIC_API_URL` — 서버 쪽은 `API_INTERNAL_URL` 이 있으면 그 주소, 위 "환경 값 메모"). API `/api/v1/...`, 문서 Swagger `/swagger`, 사진 `/sample/...`(테스트 데이터) · `/files/...`(S3 없는 서버에 올린 사진).
  - 이용자 서비스 3010 · 관리자 서비스 3020 은 백엔드 내부용 — 프론트가 직접 부르지 않는다.
  - 백엔드 CORS 는 `http://localhost:5000` 을 허용하도록 맞춰져 있다 — 프론트를 다른 포트로 띄우면 브라우저 호출이 막힐 수 있다.
  - `next/image` 는 `localhost:3000` 사진을 허용해 둔다(`next.config.ts:11-16`, 포트는 `NEXT_IMAGE_PORT`).
- **Docker 이미지 = 운영**: `output: "standalone"` (`next.config.ts:34`). 빌드 때 BuildKit secret(`dotenv`)으로 `.env.production` 을 붙이고(빌드 값이 바뀌면 빌드 인자 `DESKLESS_BUILD_ENV_HASH` 로 다시 빌드 — `Dockerfile`), 실행 env(공개 값 포함)는 deskless 차트(ConfigMap · Secret)가 넣는다 — 이미지 하나로 모든 환경. 이미지 안에 `.env` 는 남지 않는다. 이미지 빌드 · 배포(인스턴스 수 · 포트 노출 · 네트워크 · 지표 수집 · 프로브)는 deskless 저장소(쿠버네티스 — k3s · Helm)가 맡는다 — 이 저장소에는 compose 가 없다 (지침서: frontend/changes/2026-11-23-k8s-cleanup.md).
- **지표 · 헬스 체크**: 서버가 뜰 때 `src/instrumentation.ts` 가 Node 런타임에서만 `src/metrics-server.ts` 의 전용 포트 서버(쿠버네티스 9464 · 로컬 9468)를 연다 — `GET /metrics`(prom-client 기본 지표 + `nodejs_eventloop_time_seconds{state}`, 모든 지표에 `service="web"` — deskless 의 수집 대상 이름) · `GET /health/live`(늘 200) · `GET /health/ready`(`register()` 가 끝난 뒤 200, 그 전 503 — 백엔드 API 는 보지 않는다, 종료 때 503 전환은 두지 않고 종료 전 대기는 deskless 차트). Next.js 라우트로 열지 않는다(공개 주소에 노출). 수집 · 프로브는 deskless (지침서: frontend/changes/2026-11-22-monitoring-web.md · 2026-11-23-k8s-cleanup.md).
- **basePath**: `NEXT_PUBLIC_LOCAL_SERVER_PREFIX` (`next.config.ts:41`) — 하위 경로 배포용(deskless Ingress). Next 가 붙이는 곳은 `<Link>` · router · `redirect()` 뿐이고, 나머지 앱 안 주소는 `withBasePath` (`src/shared/utils/base-path.ts`)로 붙인다:
  - route handler `fetch` — `src/shared/api/cookie.ts` · `payment.ts`, `src/contracts/user/api.ts`(`signWithSns`).
  - next-auth — callbackUrl(`src/app/(user)/login/login-flow.ts` `snsLoginCallbackUrl`), `pages.signIn` · `pages.error`(`src/app/api/auth/[...nextauth]/route.ts`), 클라이언트 `signIn` 의 API 주소(로그인 화면 `SessionProvider basePath` — `session={null}` 이라 세션은 부르지 않는다). 서버 쪽은 `NEXTAUTH_URL` 을 `<origin><basePath>/api/auth` 까지 적는다.
  - 메타데이터 주소(`src/app/layout.tsx` 아이콘 · og 이미지), 직접 만든 `Location`(`src/app/api/user/sns-login/route.ts`), 토스 결제창이 돌아올 주소(`TossPaymentWidget`).

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
`window` 를 쓰는 라이브러리는 `next/dynamic(() => import(...), { ssr: false })` 로 감싼 래퍼를 통해서만 쓴다 (`src/shared/components/Editor.tsx:6`, `src/shared/components/chart/Chart.tsx:5`).

### 외부 스크립트
`document.getElementById(<ID>)` 로 이미 붙었는지 보고, 없으면 한 번만 붙인 뒤 `load` 를 Promise 로 기다린다 (`src/shared/utils/kakao-map.ts:15-38`, `src/shared/utils/address.ts:35-58`). npm 으로 들인 SDK(토스 `@tosspayments/tosspayments-sdk`)는 효과 안에서 `import()` 로 불러 서버 렌더에 넣지 않는다 (`src/shared/components/payment/TossPaymentWidget.tsx`).

### Import Alias
`@/*` → `./src/*` 하나만 (`tsconfig.json:30`). 테스트도 같은 별칭 (`vitest.config.mts` 의 `resolve.tsconfigPaths`).
