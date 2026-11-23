# frontend 요청 — 공개 값(NEXT_PUBLIC_*)을 실행 때 읽기 · 이미지 하나로 모든 환경

- 보낸 곳: deskless (2026-11-24)
- 받는 곳: [deskless-frontend](https://github.com/HaSungJe/deskless-frontend)
- 기준 커밋: `7dd9da9` — 지우는 파일 없음
- 공개 API · 사용자 동작(화면) 변화: 없음 — 같은 값을 읽는 때(빌드 → 실행)만 바뀐다
- 같이 볼 요청: [서버 쪽 게이트웨이 주소 API_INTERNAL_URL](2026-11-24-api-internal-url.md) — 같은 자리(`src/shared/api/request.ts:4-5`)를 고친다. 함께 반영한다

## 왜

deskless 가 운영 배포를 **GHCR 이미지**로 바꿨다(사용자 결정 2026-11-24). PC(또는 서버)에서 `deskless push web` 으로 `ghcr.io/<계정>/deskless-web:<frontend 커밋>` 을 올리고, 운영 서버는 그 이미지를 받아 파드를 한 대씩 바꾼다.

- 지금은 `NEXT_PUBLIC_*` 가 `next build` 때 코드에 박힌다(`.env.example:5` `[빌드]`). 그래서 **이미지 안에 올린 쪽의 주소 · 키가 들어간다** — PC 에서 올리면 `http://localhost:15000` · `http://localhost:13000` 이 박힌 이미지가 운영에서 돈다. 환경마다(로컬 · 운영) 다시 빌드해야 하고, 주소 · 키 하나를 바꿔도 빌드부터 다시 한다.
- 실행 때 읽으면 **같은 이미지를 로컬 · 운영이 같이 쓰고**, 값을 바꾸면 파드만 다시 띄운다(deskless `restart web`). 이미지 태그가 frontend 커밋 하나로 정해져 올린 쪽 · 받는 쪽이 같은 태그를 찾는다.

### 정해진 것 (사용자 결정 2026-11-24 — 방안 b)
- 공개 값은 **실행 때 읽는다. 이름은 그대로 `NEXT_PUBLIC_*`** — 로컬 `npm run dev` 의 `.env.local` 도 그대로 쓴다.
- deskless 차트가 웹 파드 env(ConfigMap)로 넣는다(이미 반영됨):
  - `NEXT_PUBLIC_API_URL` · `NEXT_PUBLIC_SERVER_URL` — deskless `.env` 의 공개 주소(로컬 `http://localhost:<LOCAL_*_PORT>` · 운영 도메인)
  - 프론트 값 파일의 나머지 `NEXT_PUBLIC_*` — `NEXT_PUBLIC_LOADING` · `NEXT_PUBLIC_DAUM_MAP_API_KEY` · `NEXT_PUBLIC_TOSS_CLIENT_KEY` · `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` · `NEXT_PUBLIC_GA4_ID`(앞으로 더하는 `NEXT_PUBLIC_*` 도 같은 규칙으로 자동으로 넘어간다)
- **빌드에 남는 것** — next.config 가 빌드 때 정하는 값이라 실행 값으로 넘기지 않는다: basePath `NEXT_PUBLIC_LOCAL_SERVER_PREFIX`(`next.config.ts:41-46`) · 이미지 호스트 `NEXT_IMAGE_HOSTNAME` · `NEXT_IMAGE_PORT`.
- deskless 는 빌드 값(dotenv secret)과 함께 빌드 인자 `DESKLESS_BUILD_ENV_HASH`(빌드 값 해시)를 넘긴다 — 3절 `Dockerfile`.

## 1. 지우는 것

없음.

## 2. 더하는 것

| 대상 | 계약 |
|---|---|
| 공개 값 읽기 한 곳 | 예: `src/shared/utils/public-env.ts` 의 `getPublicEnv(key)`. 서버 = 요청 때 `process.env` 에서, 브라우저 = 서버가 페이지에 실어 보낸 값에서. **정적 참조 `process.env.NEXT_PUBLIC_X` 를 쓰지 않는다** — `next build` 가 서버 · 클라이언트 번들 모두에서 그 자리를 빌드 값으로 바꿔 박는다(동적 키 조회는 바꾸지 않는다) |
| 페이지에 실어 보내기 | 루트 레이아웃(서버 컴포넌트)이 요청마다 공개 값을 브라우저로 넘긴다(인라인 스크립트 · 컨텍스트 등 — 방식은 프론트 규약대로). **허용 목록**(`NEXT_PUBLIC_` 로 시작하는 키 중 basePath 제외)만 — `NEXTAUTH_SECRET` · `TOSS_SECRET_KEY` · `API_INTERNAL_URL` 같은 서버 전용 값이 새지 않게 |
| 요청 때 렌더 | 값을 실어 보내는 레이아웃이 빌드 때 미리 렌더되면 빌드 값으로 굳는다 — 요청 때 렌더되게 한다(Next 16 의 동적 렌더 방식, 예: `await connection()`) |

구현 메모:
- 바꿀 곳은 모두 "읽기 한 곳" 을 지나게 한다 — 3절 표가 지금 정적 참조가 있는 곳 전부(deskless 가 `git grep` 으로 찾은 것).
- `API_BASE_URL`(상수)은 모듈을 읽을 때 정해지므로 실행 값을 읽는 함수(예: `getApiBaseUrl()`)로 바꾼다 — API_INTERNAL_URL 요청의 "서버면 내부 주소" 고르기도 같은 함수에 둔다.

## 3. 고치는 것

| 파일 | 고칠 것 |
|---|---|
| `src/shared/api/request.ts:4-5` · `:98-104` | `API_BASE_URL` 상수 → 실행 때 읽기(`buildUrl` 이 부른다). 주석의 "`${NEXT_PUBLIC_API_URL}/api/v1`" 은 그대로 뜻 |
| `src/app/layout.tsx:15-16` · `metadata`(`:26-`) | `metadataBase`(`NEXT_PUBLIC_SERVER_URL`) · 애드센스 ID — 실행 값. 정적 `metadata` 는 빌드 때 정해지므로 `generateMetadata` 로. 공개 값 실어 보내기도 여기 |
| `src/app/manager/login/ManagerLoginGuideContent.tsx:19` | `NEXT_PUBLIC_SERVER_URL` → 실행 값(basePath 는 빌드 값 그대로) |
| `src/app/manager/manager-auth.ts:74-79` | 같음 + 주석 "빌드 때 박히는 NEXT_PUBLIC_SERVER_URL" 고침 |
| `src/shared/components/Loading.tsx:10` · `:17` | `NEXT_PUBLIC_LOADING` → 실행 값 |
| `src/shared/components/payment/TossPaymentWidget.tsx:29-30` | 클라이언트 키 → 실행 값, 주석 "(빌드 때 박힌다)" 고침 |
| `src/shared/utils/kakao-map.ts:26` | 지도 앱 키 → 실행 값 |
| `src/shared/components/Scripts.tsx:10` · `:16` | 주석 처리된 코드 — 살릴 때 실행 값을 쓰게 주석 안 코드도 맞춘다 |
| `.env.example:5-6` · 각 줄 표시 | `NEXT_PUBLIC_*` 를 `[실행]` 으로(`NEXT_PUBLIC_LOCAL_SERVER_PREFIX` · `NEXT_IMAGE_*` 는 `[빌드]` 그대로). `:3` 의 운영 빌드 설명도 — 빌드 값은 basePath · 이미지 호스트만 의미가 있다 |
| `.env.example:11` | `NEXT_PUBLIC_API_URL` 주석 — 브라우저 주소(서버 쪽은 API_INTERNAL_URL 요청) |
| `Dockerfile:4-5` · build `RUN`(`:22`) 앞 | 주석의 "NEXT_PUBLIC_* 는 빌드할 때 박힌다" 고침 + **`ARG DESKLESS_BUILD_ENV_HASH`** 를 build `RUN` 앞에 선언 — BuildKit secret 내용은 빌드 캐시 키에 들어가지 않아, 빌드 값(basePath · 이미지 호스트)만 바뀌면 옛 빌드 층을 그대로 쓴다. deskless 가 빌드 값 해시를 넘긴다(선언 전에는 경고만 나고 빌드는 된다) |

## 4. 그대로 두는 것

- 키 이름(`NEXT_PUBLIC_*`) · 로컬 `npm run dev` 사용법 · basePath · 이미지 호스트(빌드 값).
- 서버 전용 값(`NEXTAUTH_*` · `TOSS_SECRET_KEY` · SNS 시크릿 · `SERVER_DOMAIN`)의 읽는 방식.
- 백엔드 공개 API · 화면 동작.

## 5. 영향 전수 확인 · 정리 (이 요청에 포함)

- 찾는 법: `git grep -n -I -E 'NEXT_PUBLIC_|API_BASE_URL|빌드 때 박|빌드할 때 (코드에 )?박|\[빌드\]' -- . ':!.beaver/output' ':!package-lock.json'` — 나온 줄마다 고침 · 지움 · 그대로(이유).
- 범위: 코드 · 주석 · `AGENTS.md`(구조 · 각 절 · 체크리스트) · `README.md` · `docs/**` · `.env.example` · `Dockerfile` · 테스트 · `.beaver/memory/` · 작업 세션의 Claude 프로젝트 메모리.
- 미리 찾은 곳(deskless 가 `C:\workspace\deskless-frontend` 에서 검색 — 3절 코드 외):

| 위치 | 지금 | 고칠 방향 |
|---|---|---|
| `AGENTS.md:114` | `NEXT_PUBLIC_*` · `basePath` 는 빌드할 때 박힌다 | 공개 값은 실행 때(읽기 한 곳), basePath · 이미지 호스트만 빌드 |
| `README.md:21` | 빌드 secret — `NEXT_PUBLIC_*` · basePath · 이미지 호스트가 빌드할 때 박히므로 환경마다… | 이미지 하나를 모든 환경에 — 빌드 값은 basePath · 이미지 호스트 |
| `docs/architecture.md:93` | `NEXT_PUBLIC_*` 는 빌드할 때 서버 · 클라이언트 번들에 박힌다 | 실행 때 읽기 규약(정적 참조 금지 · 허용 목록 · 요청 때 렌더) |
| 테스트 8개 — `API_BASE_URL` import | `src/test/app/(user)/_components/UserMeProvider.test.tsx:6` · `src/test/app/api/admin/login.test.ts:5` · `…/cookie/token-cookie.test.ts:5` · `…/manager/login.test.ts:5` · `…/user/sign.test.ts:5` · `…/user/sns-login.test.ts:5` · `src/test/shared/api/queue.test.ts:4` · `…/request.test.ts:3` | 바뀐 읽기 함수로 |

- 테스트: 읽기 한 곳(서버 → `process.env` · 브라우저 → 실어 보낸 값 · 허용 목록 밖 키는 실어 보내지 않음)을 프론트 테스트 규약대로.

## 6. 끝난 상태

- [ ] `git grep -n 'process.env.NEXT_PUBLIC_'` 가 basePath(`NEXT_PUBLIC_LOCAL_SERVER_PREFIX`) 외에 없다
- [ ] 한 번 빌드한 이미지에 실행 env 만 바꿔(`NEXT_PUBLIC_API_URL` 등) 띄우면 서버 · 브라우저 모두 새 값을 쓴다 — 빌드 값(`.env.production`)에 다른 값을 넣고 빌드해 확인
- [ ] 서버 전용 값이 페이지 HTML · 클라이언트 번들에 실리지 않는다
- [ ] `Dockerfile` 에 `ARG DESKLESS_BUILD_ENV_HASH`(build `RUN` 앞)
- [ ] 5절 검색 결과가 모두 고쳐졌거나 그대로 둔 이유가 있고, 규약끼리 어긋나지 않는다 — 결과 요약을 deskless 에 전달

## 반영 전 deskless 쪽 영향

- 반영 전에는 웹 이미지에 **올린 쪽의 공개 주소가 박힌다** — 운영용 web 이미지는 운영 `.env` 가 있는 서버에서 올린다(`./deskless-server.sh push web`) 또는 PC `.env` 의 `GATEWAY_PUBLIC_URL` · `WEB_PUBLIC_URL` 을 운영 주소로 잠깐 바꿔 올린다. 백엔드 이미지는 상관없다.
- 반영 뒤에는 어디서 올려도 같다 — deskless 쪽 추가 작업 없음(ConfigMap 이 이미 공개 값을 넣는다).
