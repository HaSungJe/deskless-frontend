# Review — main (Phase 3 영역별 로그인 기반) — 261116

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: Phase 3 영역별 로그인 기반(영역 판별 · 영역별 토큰 쿠키 · 401 재발급 `withAuth` · `AuthGuard` · 오류 팝업) + build 중 사용자 요청(예전 아이디 로그인 삭제, 테스트를 `src/test/` 로, `npm run lint` 오류 · 경고 정리) + 리뷰 뒤 고침
- Change scope: 코드 · 테스트 약 60파일(새 · 고침 · 삭제 7 · 옮김 8), 문서 AGENTS.md · docs 5개 · beaver 기록(spec · plan · report · 로드맵 · 이 문서)
- 검증: `npx vitest run` 14파일 85건 통과, `npx next typegen && npx tsc --noEmit` 소스 오류 0(`.next/dev/types` 의 옛 route 참조 3건은 dev 서버 산출물). `npm run lint` · `/dev/ui/` 화면 확인은 사용자 실행 대상이라 아직.
- 리뷰 방식: 별도 에이전트가 읽기 전용으로 검토(옆 저장소 `deskless-backend` 의 재발급 코드까지) → 지적을 코드로 확인한 뒤 고침.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `AreaType` · `TokenSetType` · `RefreshResultType` · `AuthContextType` · `ErrorPopupType`, 상수 `AREA_LOGIN_PATH` · `ACCESS_EARLY_EXPIRE_MS` · `RETURN_URL_KEY`, Context `AuthContext` |
| Structure & layering | pass (#11 고침) | `shared` → `contracts` · `app` import 없음, `contracts` → `app` 없음. route handler 공용 코드는 `src/app/api/cookie/token-cookie.ts`, 영역별 재발급 API 는 `contracts/<영역>/api.ts`. 구조 규칙 — `RootLayoutContent` 의 `auth` 화살표 함수를 함수 영역(`changeToken` · `expire` · `logout`)으로 옮겼다 |
| Shared logic extraction | pass | 쿠키 route handler 호출은 `callCookieRoute` 하나, 재발급은 `refreshAndStore` 하나를 `GET` · `…/refresh/` 가 같이 쓴다. 오류 팝업 모듈 상태는 AGENTS.md 예외로 적었다 |
| Errors & responses | pass | route handler 는 200 + `{success, data?, retry?}`. 화면 오류는 `showErrorPopup` 하나(`alert(` 남은 곳 없음) |
| Test strength | pass (#13 보강) | `[SUCCESS]` / `[FAIL:*]`, 호출 횟수 · 인자 · 미호출(쿠키 삭제 안 함 · 로그아웃 안 함 · fetch 안 함)까지 |

## Intended Behavior Check (against plan/spec)
- spec Business Rules — 주소로 영역 판별 · 영역마다 쿠키 두 개 · access 60초 일찍 만료 · 401 → 재발급 한 번 · 재시도 → 또 401 이면 그 영역 로그인 화면(`?return_url=`) · 같은 영역 동시 재발급 하나로 · 로그아웃은 그 영역 쿠키만 · 오류 팝업 하나(개발 때만 원문) — 코드와 테스트가 맞다.
- 리뷰에서 spec 이 다루지 않던 경우가 드러나 고쳤다: 재발급 일시 실패(#2), 영역을 옮긴 뒤 늦게 끝난 콜백(#3), 같은 영역 안 로그인 상태 재확인(#4), `return_url` 우회(#5).
- 초안 규약(AGENTS.md ⚠️ · Data Layer · Error & Response · Auth · Testing, docs/conventions.md · data-layer.md · error-handling.md · testing.md)을 고친 코드와 대조해 맞추고, 바뀐 줄 번호를 스크립트로 대조해 근거를 고친 뒤 초안 표시를 지워 확정했다.
- memory: 미반영 항목 없음(`.beaver/memory/MEMORY.md`).

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | High | `src/app/api/cookie/token-cookie.ts:121` · 백엔드 `apps/user-service/src/user/user.service.ts:250` · `apps/admin-service/src/manager/manager.service.ts:205` · `apps/admin-service/src/admin/admin.service.ts:151` | 재발급은 Next 서버가 부르는데 백엔드는 로그인 때 IP(브라우저)와 재발급 요청 IP(Next 서버)가 다르면 401 — 배포 환경에서 로그인 약 19분 뒤 로그아웃. 로컬은 IP 가 같아 안 보인다 | 백엔드에서 풀기로(사용자 결정) — 요청 내용(세 곳의 IP 일치 검사 제거 · API 모양 그대로)은 대화로 사용자에게 전달. 프론트 코드 변경 없음, docs/data-layer.md 에 ⚠️ |
| 2 | Medium | `src/app/api/cookie/token-cookie.ts:121-156` · `src/shared/api/auth.ts:39-42` | 재발급 실패를 모두 `null` 로 — 네트워크 · 5xx 같은 일시 실패에도 365일짜리 refresh 쿠키를 지우고 로그아웃 | 고침 — `ok` · `invalid`(4xx, 쿠키 삭제) · `retry`(쿠키 유지, `retry: true`), 클라이언트는 `retry` 면 `NetworkError`(네트워크 문구 팝업, 로그인 그대로) |
| 3 | Medium | `src/app/RootLayoutContent.tsx:69-81` | `setToken` · `onExpired` 가 만들 때의 영역을 들고 있어, 다른 영역으로 옮긴 뒤 늦게 끝난 재발급이 옛 영역 값을 쓰고 옛 영역 로그인 화면으로 보낼 수 있다 | 고침 — `changeToken` 은 함수형 갱신으로 영역이 같을 때만, `expire` 는 `currentRef` 로 지금 영역을 보고 바뀌었으면 무시 |
| 4 | Medium | `src/app/RootLayoutContent.tsx:46` · `src/shared/components/AuthGuard.tsx:28-36` | 같은 영역 안에서는 `checked` 가 계속 참이라, 로그인 안 된 주소에서 보호 화면으로 갈 때(로그인 직후 `return_url` 등) 쿠키를 다시 읽기 전에 로그인 화면으로 보낸다 | 고침 — 상태에 확인한 주소(`path`)를 두고, 로그인 안 된 상태는 이 주소 확인이 끝날 때까지 확인 중 |
| 5 | Medium | `src/shared/utils/area.ts` (`safeReturnPath`) | `?return_url=%2F%09%2Fevil.com` → `/\t/evil.com` 이 문자열 검사를 지나고, URL 해석이 탭을 지워 `//evil.com` 으로 — 다른 사이트로 보내진다 | 고침 — `toSamePath` 가 `new URL(path, 기준)` 으로 읽어 origin 이 같을 때만, `loginUrl` 도 같은 검사. 테스트 추가 |
| 6 | Low | `src/shared/components/AuthGuard.tsx:27` | 가드가 그 영역 로그인 화면까지 감싸면 Loading 에 갇힌다(지금은 호출처 0 · 루프 없음) | 고침 — `isLoginPath` 면 막지 않는다. 테스트 추가 |
| 7 | Low | `src/app/api/cookie/[area]/route.ts:31-48` | 다른 사이트 `<form enctype=text/plain>` POST 가 공격자 토큰을 심을 수 있다(login CSRF — 예전 코드도 같음) | 고침 — `isSameSiteJson`(`Content-Type: application/json`, `Sec-Fetch-Site` 가 있으면 `same-origin`) |
| 8 | Low | `src/app/api/cookie/[area]/route.ts:39` | 만료 시각을 확인하지 않아 `Expires=Invalid Date` → 세션 쿠키가 된다 | 고침 — `isTokenSet` 이 토큰 둘 · 만료 시각 둘을 확인 |
| 9 | Low | `src/shared/components/Timer.tsx:24-41` | lint 정리로 `closeFunc` 가 효과 의존성에 들어가, 만료 뒤 부모가 새 콜백을 주면 300ms 마다 다시 부른다 | 고침 — `useEffectEvent`, 의존성 `[time]` |
| 10 | Low | `src/shared/api/queue.ts` (2xx 아닌 응답) | 실패 본문 읽기가 끊기면 네트워크 문구가 아니라 일반 문구 | 고침 — `request.ts` 처럼 `asNetworkError` |
| 11 | Low | `src/app/RootLayoutContent.tsx` · `src/shared/components/KakaoMap.tsx` | 구조 규칙 — `auth` 안 화살표 함수가 계산 값 자리, `KakaoMap` 본문에 영역 · 역할 주석 없음 | 고침 |
| 12 | Low | `src/shared/hooks/useInput.ts` 계열 | `useCallback([])` 을 걷어내 초기화가 최신 `initValue` 를 쓴다(예전엔 처음 값) | 받아들임 — 더 자연스러운 동작, 호출처 없음 |
| 13 | Low | `src/test/…` | 테스트 빈틈 — GET access 있음 · 재발급 실패 시 쿠키 삭제 · POST · 동시 재발급 외 경우 · 제어 문자 · 로그인 화면 예외 | 고침 — 11건 추가(85건). `RootLayoutContent` 영역 전환 · 늦은 응답 테스트는 첫 보호 화면 때 |
| 14 | Low | `src/shared/css/ui/modal/ErrorPopup.module.css:13` | `font-size: 12px` 값 직접 | 받아들임 — docs/conventions.md "스타일" 이 글자 크기는 토큰이 없어 시안 값을 그대로 쓴다고 정함 |

## Verdict
Pass — #1 은 백엔드 수정 요청으로 넘기고(프론트 변경 없음, 반영 전 배포 환경 제약은 문서에 적음), #2 ~ #11 · #13 은 고쳤다(테스트 85건 · 타입 체크 통과), #12 · #14 는 받아들인다. 커밋으로 진행.
