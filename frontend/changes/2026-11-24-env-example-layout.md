# frontend 요청 — `.env.example` 을 기능 단위로 묶고 주석 줄이기

- 보낸 곳: deskless (2026-11-24)
- 받는 곳: [deskless-frontend](https://github.com/HaSungJe/deskless-frontend)
- 기준 커밋: `7dd9da9`
- 공개 API · 사용자 동작 · 코드 변화: 없음 — `.env.example` 의 줄 순서 · 절 · 주석만. **키 이름 · 기본값은 그대로**(deskless 는 키 이름으로 읽는다 — 순서와 무관)
- 같이 볼 요청: [API_INTERNAL_URL](2026-11-24-api-internal-url.md) · [공개 값 실행 때 읽기](2026-11-24-runtime-public-env.md) — 셋 다 `.env.example` 을 고친다. **함께 반영**하고, `[빌드]` · `[실행]` 표시는 "공개 값 실행 때 읽기" 요청서 기준(공개 값은 `[실행]`, basePath · 이미지 호스트만 `[빌드]`)

## 왜

deskless 의 `.env.example` 을 앱 · 기능 단위로 다시 묶었다(사용자 결정 2026-11-24). 지금 프론트 `.env.example` 은 "서버 · 화면" · "인증" · "이미지 · 외부 연동" 처럼 성격별이라 한 기능의 값이 흩어져 있다.

- 토스 결제 — 클라이언트 키(`.env.example:40`)와 시크릿 키(`:42`)는 붙어 있지만 "이미지 · 외부 연동" 절에 이미지 호스트 · 지도 키와 섞여 있다.
- 쿠키 도메인 `SERVER_DOMAIN`(`:21`) · next-auth · SNS 로그인이 "인증" 에 있고, 로그인 콜백 주소 설명은 `NEXTAUTH_URL` 주석(`:22-24` · 키 `:25`)에 길게 있다.
- 주석이 길다(여러 줄 설명) — 자세한 뜻은 `docs/architecture.md` 가 맡고, 예시 파일은 키 묶음당 한 줄로.

### 정해진 것 (사용자 결정 2026-11-24)
- **절은 기능 단위** — 그 기능의 주소 · 키 · 비밀값 · 포트를 한 절에.
- **주석은 키 묶음당 한 줄**(필요하면 두 줄) — `[빌드]`/`[실행]` · `(필수)` · 비우면 어떻게 되는지 정도만. 긴 설명은 `docs/architecture.md` 로 옮긴다(이미 있으면 지운다).
- 키 이름 · 기본값은 바꾸지 않는다.

## 1. 지우는 것

없음(키는 그대로 — 긴 주석 줄만 줄인다).

## 2. 더하는 것

없음(`API_INTERNAL_URL` 은 같은 날 요청서가 더한다 — 아래 "게이트웨이" 절에 둔다).

## 3. 고치는 것 — `.env.example` 절 구성(제안)

| 절 | 키(이 순서) | 한 줄 주석 방향 |
|---|---|---|
| 머리 | — | 3줄 이내: 로컬 `.env.local` · 운영 빌드 `.env.production`(deskless 가 넘긴다) · `[빌드]` = 바꾸면 다시 빌드 / `[실행]` = 다시 띄우기만 |
| 웹 서버 | `NEXT_PUBLIC_SERVER_URL` · `NEXT_PUBLIC_LOCAL_SERVER_PREFIX` · `METRICS_PORT` · `METRICS_HOST` | 웹 주소(metadataBase · OG) / basePath `[빌드]` / 지표 · 헬스 체크 포트 · 바인딩(비우면 127.0.0.1:9468 — 쿠버네티스는 deskless 차트) |
| 게이트웨이(백엔드 API) | `NEXT_PUBLIC_API_URL` · (`API_INTERNAL_URL`) | 브라우저가 부르는 주소(게이트웨이 3000 하나) / 서버(route handler)가 부르는 주소(비우면 위 주소) |
| 로그인(next-auth · SNS) | `NEXTAUTH_URL` · `NEXTAUTH_SECRET` · `SERVER_DOMAIN` · `KAKAO_LOGIN_CLIENT_ID` · `KAKAO_LOGIN_SECRET_ID` · `NAVER_LOGIN_CLIENT_ID` · `NAVER_LOGIN_SECRET_ID` | 웹 주소(basePath 포함 — https 면 `__Secure-` 쿠키) / (필수) 세션 암호화 / 쿠키 도메인(localhost 면 비운다) / 콘솔에 콜백 `<웹 주소>/api/auth/callback/kakao · naver` |
| 결제(토스) | `NEXT_PUBLIC_TOSS_CLIENT_KEY` · `TOSS_SECRET_KEY` | 결제위젯 클라이언트 키 / 시크릿 키(승인 route handler 만 — `NEXT_PUBLIC_` 금지) |
| 지도(카카오) | `NEXT_PUBLIC_DAUM_MAP_API_KEY` | 앱 키 |
| 이미지(next/image) | `NEXT_IMAGE_HOSTNAME` · `NEXT_IMAGE_PORT` | 허용할 원격 이미지 호스트 · 포트 `[빌드]` |
| 화면 | `NEXT_PUBLIC_LOADING` | 로딩 표시(1 이면 표시) |
| 광고 · 분석 | `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` · `NEXT_PUBLIC_GA4_ID` | `Scripts.tsx` 주석을 풀면 쓴다 |

- 위 배치는 제안이다 — 프론트 규약에 더 맞는 묶음이 있으면 그쪽으로. 원칙(기능 단위 · 한 줄 주석 · 키 그대로)만 지킨다.

## 4. 그대로 두는 것

- 키 이름 · 기본값 · 코드(`process.env` 읽는 곳 — 바뀌는 것은 "공개 값 실행 때 읽기" 요청서 몫) · deskless 차트.

## 5. 영향 전수 확인 · 정리 (이 요청에 포함)

- 찾는 법: `git grep -n -I -E '\.env\.example|\[빌드\]|\[실행\]' -- . ':!.beaver/output' ':!package-lock.json'` — `.env.example` 의 절 이름 · 줄 번호를 가리키는 곳(예: `docs/architecture.md:94` "목록 · 빌드/실행 시점 구분은 .env.example")을 새 구성으로.
- 긴 주석에서 줄인 설명(로그인 콜백 · basePath 와 next-auth 주소 · 지표 포트 기본값 등)이 `docs/architecture.md` 에 없으면 그쪽에 옮긴다(정보를 잃지 않게).
- 범위: `.env.example` · `AGENTS.md` · `README.md` · `docs/**` · `Dockerfile` 주석 · `.beaver/memory/` · 작업 세션의 Claude 프로젝트 메모리.
- 확인: 키 · 값 목록이 전과 같다(`API_INTERNAL_URL` 한 줄만 더해짐) — `diff <(git show HEAD:.env.example | grep -E '^[A-Z_]+=' | sort) <(grep -E '^[A-Z_]+=' .env.example | sort)`.

## 6. 끝난 상태

- [ ] `.env.example` 이 기능 단위 절로 묶였고, 주석은 키 묶음당 한 줄(길어도 두 줄)
- [ ] 키 · 기본값 목록이 전과 같다(`API_INTERNAL_URL` 만 더해짐)
- [ ] 줄인 설명이 `docs/architecture.md` 에 남아 있다
- [ ] 5절 검색 결과가 모두 고쳐졌거나 그대로 둔 이유가 있다 — 결과 요약을 deskless 에 전달
