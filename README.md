# deskless-frontend

무인 객실 대여 서비스 **바로방**의 화면. 이용자는 지도에서 업체를 찾아 객실을 예약 · 결제하고 QR 로 문을 연다. 업체 관리자는 콘솔에서 객실 · 예약을 운영하고, 관리자는 입점 · 업체 · 이용자를 관리한다.

Next.js 16 App Router 한 서버(포트 5000)에 세 영역이 같이 있다.

## 소개

| 영역 | 주소 | 하는 일 |
|---|---|---|
| **이용자** | `/` | 휴대폰 화면 — 지도에서 업체 찾기 · 업체 상세, 예약 · 결제(토스) · 연장 · 취소 · QR, SNS(카카오 · 네이버) 로그인 · 가입 · 휴대폰 인증, 내 정보 · 입점 신청 (화면 U1 ~ U11) |
| **업체 관리자** | `/manager` | PC 콘솔 — 업체코드 로그인, 대시보드 · 예약 현황 · 호실 · 객실 그룹 · 상품 설정 · 내 업체 설정 · 업체 관리자 (M1 ~ M8) |
| **관리자** | `/admin` | PC 콘솔 — 대시보드(전체 통계) · 입점 신청 · 업체 · 업체 관리자 · 이용자 (A1 ~ A6) |

- **요청 흐름** — 브라우저가 백엔드 게이트웨이(`/api/v1/<서비스>/<도메인>/…`)를 직접 부른다. 조회 · 로그인은 동기 JSON, 상태를 바꾸는 요청은 큐 SSE(`accepted` → `done` · `failed` · `pending`). 로그인 · 가입 · 토큰 재발급은 Next 서버(route handler)가 대신 부르고 토큰을 httpOnly 쿠키에 둔다.
- **영역마다 로그인 · 토큰이 따로** — 이용자(SNS · next-auth) · 업체 관리자(업체코드 + 아이디) · 관리자(아이디). 쿠키 이름으로 나눈다.
- **공개 값은 실행 때 읽는다** — `NEXT_PUBLIC_*` 를 빌드에 박지 않아 이미지 하나로 모든 환경을 띄운다(basePath · 이미지 호스트만 빌드 값).
- **외부 연동** — 카카오 지도 · 주소 검색, 인증번호(SMS), 사진 올리기(S3), 결제(토스 결제위젯) — 미리보기 `/dev/infra`(개발 전용).
- **지표 · 헬스 체크** — 전용 포트에 `/metrics` · `/health/live` · `/health/ready`(화면 주소로는 열지 않는다).
- **화면 · API 지침** — 백엔드가 넘겨준 인계 문서 [frontend/](frontend/README.md)(화면 목록 · API 108개 · DTO · 시안). 이후 수정 요청은 [frontend/changes/](frontend/changes/README.md).

**관련 저장소**
- [deskless](https://github.com/HaSungJe/deskless) — 백엔드 · 프론트를 쿠버네티스(k3s · Helm)로 엮어 띄운다. 배포 · 인프라 · 지표 수집이 모두 거기 있다. 그쪽이 보내는 수정 요청은 [frontend/changes/](frontend/changes/README.md) 에 받는다.
- [deskless-backend](https://github.com/HaSungJe/deskless-backend) — NestJS 게이트웨이(3000) · 서비스. 프론트가 부르는 곳은 게이트웨이 하나, API 문서는 실행 중 Swagger `http://localhost:3000/swagger`.

스택: Node.js 24 · Next.js 16 (App Router) · React 19 + React Compiler · TypeScript 5 · fetch · class-validator · next-auth 4 · prom-client · CSS Modules · Vitest 5 + Testing Library

## 구조

```
src/
  app/             # 라우팅 + 화면 — (user)/ · manager/ · admin/ 영역, api/(route handler) · css/(전역 토큰 · 화면 css) · dev/(미리보기)
  contracts/       # 백엔드 계약 — <도메인>/dto(지침서 사본) · <도메인>/api.ts
  shared/          # 도메인을 모르는 공통 — api · components · hooks · utils · types · providers
  test/            # 테스트 — src 와 같은 경로
  instrumentation.ts · metrics-server.ts   # 서버가 뜰 때 — reflect-metadata · 지표 · 헬스 체크 서버
frontend/          # 백엔드 인계 지침 — 화면 · API · DTO · 시안, changes/(수정 요청)
docs/              # 규약 상세
Dockerfile         # 운영 이미지(standalone) — deskless 가 빌드한다
```

- 화면은 주소의 `page.tsx` 옆 `<화면>Content.tsx`, 백엔드 호출은 `contracts/<도메인>/api.ts` 함수로 모은다. import 는 `app → contracts → shared` 한쪽으로만.
- 규약 전체는 [AGENTS.md](AGENTS.md), 주제별 상세는 [docs/](docs/) — 구성 · 환경 [architecture](docs/architecture.md) · 코딩 [conventions](docs/conventions.md) · 데이터 · 토큰 [data-layer](docs/data-layer.md) · 오류 [error-handling](docs/error-handling.md) · 외부 연동 [integrations](docs/integrations.md) · 테스트 [testing](docs/testing.md).

## 설치 · 실행

### 1. 준비

```bash
node -v                       # v24.22.3 (.nvmrc — nvm 을 쓰면 nvm use)
npm install
cp .env.example .env.local    # 로컬 기본값 — 게이트웨이 http://localhost:3000
```

- 백엔드 게이트웨이(`http://localhost:3000`)가 떠 있어야 화면이 데이터를 읽는다 — 띄우는 법은 deskless · deskless-backend README.
- `NEXTAUTH_SECRET` 은 로컬에서도 채운다(SNS 로그인 세션 암호화). 키마다의 뜻은 [docs/architecture.md](docs/architecture.md) "환경 값 메모".

### 2. 로컬 실행

```bash
npm run dev                   # http://localhost:5000 — 이용자 / · 업체 관리자 /manager · 관리자 /admin
```

- 카카오 · 네이버 로그인 키가 없어도 로그인 화면의 "테스트 이용자로 로그인"(개발 서버에서만 보인다)으로 들어갈 수 있다. 업체 관리자 · 관리자 테스트 계정은 백엔드 테스트 데이터 문서.
- 지도는 카카오 지도 앱 키(`NEXT_PUBLIC_DAUM_MAP_API_KEY`), 결제는 토스 결제위젯 키를 넣어야 쓸 수 있다(토스 키가 없으면 결제 칸에 안내만). 공통 부품 미리보기 `/dev/ui`, 외부 연동 미리보기 `/dev/infra`(개발 전용).
- 지표 · 헬스 체크는 `http://127.0.0.1:9468/metrics` · `/health/live` · `/health/ready`.

### 3. 배포 · 운영

- 배포는 deskless(쿠버네티스)가 한다 — 이 저장소의 [Dockerfile](Dockerfile) 로 이미지를 빌드해 띄운다(이 저장소에는 compose 가 없다).
- 빌드: `.env.production` 을 빌드 secret `dotenv` 로 넘긴다 — 빌드 때 정해지는 값은 basePath · 이미지 호스트뿐이라 이미지 하나를 모든 환경이 같이 쓴다(빌드 인자 `DESKLESS_BUILD_ENV_HASH` — 빌드 값이 바뀌면 다시 빌드).
- 실행: 공개 값(`NEXT_PUBLIC_*`) · 서버 값(시크릿 · `API_INTERNAL_URL` · `METRICS_PORT` · `METRICS_HOST`)은 deskless 차트가 넣는다 — 값을 바꾸면 파드만 다시 띄운다. 앱 포트 5000, 지표 · 헬스 체크 9464(수집 · 프로브는 deskless).

## 명령

| 명령 | 내용 |
|---|---|
| `npm run dev` | 개발 서버(5000 포트) |
| `npm run build` · `npm run start` | 운영 빌드(standalone) · 빌드 산출물 실행 |
| `npm run lint` | ESLint |
| `npm test` · `npx vitest run` | 테스트(Vitest — watch · 한 번) |
| `npx next typegen && npx tsc --noEmit` | 타입 검사(라우트 타입을 먼저 만든다) |
