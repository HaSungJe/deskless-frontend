# frontend 요청 — 서버 쪽 게이트웨이 주소(API_INTERNAL_URL)

- 보낸 곳: deskless (2026-11-24)
- 받는 곳: [deskless-frontend](https://github.com/HaSungJe/deskless-frontend)
- 기준 커밋: `7dd9da9` — 지우는 파일 없음
- 공개 API · 사용자 동작(화면) 변화: 없음 — 브라우저가 부르는 주소(`NEXT_PUBLIC_API_URL`)는 그대로, 서버(route handler)가 게이트웨이를 부르는 주소만 따로 받을 수 있게 한다

## 왜

deskless 가 프론트를 쿠버네티스(Phase 4 — `charts/web`)에 올렸다. 로그인 · 가입 · 토큰 재발급 route handler 는 **Next.js 서버(웹 파드 안)에서** `NEXT_PUBLIC_API_URL` 로 게이트웨이를 부른다(`src/shared/api/request.ts:5` · `buildUrl` `:103`).

- 로컬 클러스터의 `NEXT_PUBLIC_API_URL` 은 `http://localhost:13000`(브라우저가 닿는 PC 입구)인데, 웹 파드 안에서 `localhost` 는 **그 파드 자신**이라 서버 쪽 호출이 실패한다 → 화면은 뜨지만 로그인 · 가입 · 토큰 재발급이 안 된다.
- 운영도 `https://api.<도메인>` 으로 인터넷을 한 바퀴 돌아 Ingress 로 다시 들어온다 — 클러스터 안 주소(`http://gateway:3000`)로 바로 가면 짧고 앞단 한도 · 로그와 섞이지 않는다.

### 정해진 것 (사용자 결정 2026-11-24)
- 서버에서 실행될 때만 쓰는 게이트웨이 주소 env **`API_INTERNAL_URL`**([실행] 값 — 빌드에 박지 않는다). 비어 있으면 지금처럼 `NEXT_PUBLIC_API_URL` 을 쓴다(로컬 `npm run dev` 는 바꿀 것 없음).
- deskless 차트(`charts/web`)가 `API_INTERNAL_URL=http://gateway:3000` 을 넣는다(로컬 · 운영 같음).

## 1. 지우는 것

없음.

## 2. 더하는 것

| 대상 | 계약 |
|---|---|
| env `API_INTERNAL_URL` | [실행] 서버(route handler · 서버 컴포넌트)가 게이트웨이를 부를 주소. 끝 `/` 없이. 비면 `NEXT_PUBLIC_API_URL` |
| 주소 고르기 | 서버에서 실행 중(`typeof window === 'undefined'`)이고 `process.env.API_INTERNAL_URL` 이 있으면 그 값, 아니면 `process.env.NEXT_PUBLIC_API_URL` — 뒤에 `/api/v1` 은 지금처럼 |

구현 메모:
- 바꿀 곳은 주소를 만드는 한 곳 — `src/shared/api/request.ts:4-5`(`API_BASE_URL`) · `:103`(`buildUrl`). 상수로 두면 클라이언트 번들에서 `API_INTERNAL_URL` 은 `undefined` 라 그대로 `NEXT_PUBLIC_API_URL` 이 된다(서버 전용 env 는 브라우저로 새지 않는다).
- 서버에서 게이트웨이를 부르는 곳(이 주소를 쓰게 되는 곳): `src/app/api/user/sign/route.ts:3`(`loginUser` · `signUser`) · `src/app/api/user/sns-login/route.ts:4` · `src/app/api/user/test-login/route.ts` · `src/app/api/manager/login/route.ts:4` · `src/app/api/admin/login/route.ts:3` · `src/app/api/cookie/token-cookie.ts:2-4`(토큰 재발급 3종) — 모두 `@/contracts/*/api` → `request()` → `buildUrl()` 을 지나므로 1곳만 고치면 된다.

## 3. 고치는 것

| 파일 | 고칠 것 |
|---|---|
| `src/shared/api/request.ts:4-5` | 주소 고르기(위 계약) + 주석(서버는 `API_INTERNAL_URL` 우선) |
| `.env.example:11-13` | `API_INTERNAL_URL=` 한 줄 — `# [실행] 서버(route handler)가 게이트웨이를 부를 주소 — 비우면 NEXT_PUBLIC_API_URL. 쿠버네티스는 deskless 차트가 http://gateway:3000` |
| `Dockerfile:5` 주석 | 실행 값 예시에 `API_INTERNAL_URL` 더하기 |

## 4. 그대로 두는 것

- `NEXT_PUBLIC_API_URL` 의 뜻 · 빌드에 박히는 방식 · 브라우저 호출.
- 백엔드 공개 API · 화면 동작.

## 5. 영향 전수 확인 · 정리 (이 요청에 포함)

- 찾는 법: `git grep -n -I -E 'NEXT_PUBLIC_API_URL|API_BASE_URL|buildUrl|게이트웨이 (API )?주소' -- . ':!.beaver/output' ':!package-lock.json'` — 나온 줄마다 고침 · 지움 · 그대로(이유).
- 범위: 코드 주석 · `AGENTS.md`(구조 · 각 절 · 체크리스트) · `README.md` · `docs/**` · `.env.example` · `Dockerfile` 주석 · 테스트 · `.beaver/memory/` · 작업 세션의 Claude 프로젝트 메모리.
- 미리 찾은 곳(deskless 가 `C:\workspace\deskless-frontend` 에서 검색):

| 위치 | 지금 | 고칠 방향 |
|---|---|---|
| `AGENTS.md:73` | 백엔드 호출은 fetch 하나 — `request<T>(…)` | 서버는 `API_INTERNAL_URL` 우선이라는 한 줄 |
| `docs/architecture.md:97` | 게이트웨이 `http://localhost:3000` — 프론트는 이 주소만 부른다(`NEXT_PUBLIC_API_URL`) | 서버 쪽 주소(`API_INTERNAL_URL`, 비면 같은 주소) 덧붙이기 |
| `docs/data-layer.md:7` · `:17` | 부르는 곳 · `buildUrl` = `${NEXT_PUBLIC_API_URL}/api/v1…` | 서버에서는 `API_INTERNAL_URL` 우선 |
| `.env.example:11-13` | `NEXT_PUBLIC_API_URL` 주석 — "배포된 서버(파드 안 route handler)도 이 주소로 부르므로 파드에서 닿는 주소여야 한다" | 그 조건을 `API_INTERNAL_URL` 로 옮기고 이 주석은 브라우저 주소로 |

- 테스트: 주소 고르기(서버 + 값 있음 → 내부 주소 · 서버 + 빈 값 → 공개 주소 · 브라우저 → 공개 주소)를 프론트 테스트 규약대로.

## 6. 끝난 상태

- [ ] 서버에서 실행될 때 `API_INTERNAL_URL` 이 있으면 그 주소로, 없으면 `NEXT_PUBLIC_API_URL` 로 게이트웨이를 부른다(브라우저는 그대로)
- [ ] `.env.example` · `Dockerfile` 주석에 `API_INTERNAL_URL`([실행])
- [ ] 5절 검색 결과가 모두 고쳐졌거나 그대로 둔 이유가 있고, 규약끼리 어긋나지 않는다 — 결과 요약을 deskless 에 전달
