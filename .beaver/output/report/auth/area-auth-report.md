# Report — 영역별 로그인 기반 (Phase 3)

## Feature Summary
- **Feature**: 이용자 · 매니저 · 관리자 토큰을 영역별 쿠키로 따로 두고, 401 이면 그 영역 재발급 한 번 · 재시도, 또 401 이면 그 영역 로그인 화면으로 — 오류는 전용 팝업으로
- **Entry point**: `ROUTE · MODULE GET · POST · DELETE /api/cookie/[area] · POST /api/cookie/[area]/refresh · src/shared/api/auth.ts(withAuth) · src/shared/utils/area.ts · src/shared/components/AuthGuard.tsx · ErrorPopup`
- **Domain**: auth
- **Plan**: `.beaver/output/plan/auth/area-auth-plan.md` · roadmap Phase 3 (#6 · #7 · #8) · direct 모드(`main`) · 함께: 오류 팝업 · 테스트 `src/test/` · lint 0 (사용자 요청)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/shared/utils/area.ts` | created | `AreaType` · `AREAS` · `AREA_HOME` · `AREA_LOGIN_PATH` · `RETURN_URL_KEY` · `areaOf` · `loginUrl` · `safeReturnPath` |
| `src/shared/api/request.ts` | modified | `NetworkError` · `isAbortError` · `asNetworkError` · `sendRequest`, `request` 가 `sendRequest` · 본문 읽기 실패도 맞춤 |
| `src/shared/api/queue.ts` | modified | `sendRequest`, `reader.read()` 실패 → `NetworkError` |
| `src/shared/api/auth.ts` | created | `AuthType` · `LoginRequiredError` · `withAuth` |
| `src/shared/api/cookie.ts` | rewritten | `getAreaToken` · `saveAreaTokens` · `deleteAreaTokens` · `refreshAreaToken`(동시 재발급 하나로) · SNS 2개(`SnsLoginType`). 옛 함수 6개 삭제, 주소 끝 `/` |
| `src/shared/api/error.ts` | modified | 오류 팝업, `NetworkError` · `LoginRequiredError` · 기타 오류(`UNKNOWN_ERROR_MESSAGE` + 개발 원문) |
| `src/shared/utils/error-popup.ts` | created | 저장소 — `showErrorPopup` · `closeErrorPopup` · `subscribeErrorPopup` · `getErrorPopup` |
| `src/shared/components/ui/modal/ErrorPopup.tsx` · `src/shared/css/ui/modal/ErrorPopup.module.css` | created | 루트 오류 팝업("알림" · 확인, 개발 원문) |
| `src/shared/utils/validation.ts` · `src/shared/components/ui/button/CopyButton.tsx` | modified | `alert` → `showErrorPopup` |
| `src/shared/providers/RootLayoutProvider.tsx` | rewritten | `RootLayoutLoadingContext` · `AuthContext` · `AuthContextType` |
| `src/app/RootLayoutContent.tsx` | modified | 영역 판별 · `{area, token}` 상태 · `AuthContext` · `ErrorPopup`, `sessionStorage.referer` 삭제 |
| `src/shared/components/AuthGuard.tsx` | rewritten | 영역 로그인 주소 + 돌아올 주소, `loginPath` 삭제, 구조 규칙 |
| `src/app/api/cookie/token-cookie.ts` | created | 영역 확인 · 쿠키 이름 · 옵션 · 저장 · 삭제 · 영역별 재발급 · `json` |
| `src/app/api/cookie/[area]/route.ts` · `[area]/refresh/route.ts` | created | `GET` · `POST` · `DELETE` / `POST` (`RouteContext`) |
| `src/app/api/cookie/access/route.ts` · `refresh/route.ts` · `logout/route.ts` | deleted | `[area]` 로 |
| `src/contracts/{user,manager,admin}/dto/<영역>-token-refresh.dto.ts` | created | 지침서 블록을 스크립트로 그대로 |
| `src/contracts/{user,manager,admin}/api.ts` | created | `refreshUserToken` · `refreshManagerToken` · `refreshAdminToken` |
| `src/shared/types/access.ts` | deleted | 쓰는 곳 없음 |
| `src/app/(user)/login/LoginContent.tsx` · `dto.ts` · `dto.test.ts` | deleted | 예전 아이디 로그인(사용자 결정) |
| `src/app/(user)/login/page.tsx` | modified | `EmptyState` 자리 표시(Phase 5 까지) |
| `src/app/dev/ui/UiPreviewContent.tsx` | modified | "오류 팝업" 미리보기 버튼(콘솔 열은 개발 원문까지) |
| `src/shared/components/Editor.tsx` · `Timer.tsx` | modified | lint — 부모 값을 그대로 · interval 콜백을 효과 안에 |
| `src/shared/hooks/useCheckboxGroup.ts` · `useInput.ts` · `useInputDate.ts` · `useInputFloat.ts` · `useInputNumber.ts` · `useInputTime.ts` | modified | lint — 렌더 중 목록 바뀜 맞추기, `any` → `unknown`, `useCallback` 걷어냄(React Compiler), 구조 규칙 |
| `src/shared/components/KakaoMap.tsx` · `src/shared/utils/address.ts` | modified | 외부 SDK 전역 `any` 에 이유 주석 |
| `src/app/api/auth/[...nextauth]/route.ts` · `src/app/api/cookie/sns/route.ts` | modified | `profile` 타입, 쓰지 않는 `catch` 변수 |
| 기존 테스트 8개 | moved | `src/test/<같은 경로>` · 별칭 import |
| `AGENTS.md` · `docs/{architecture,conventions,data-layer,error-handling,testing}.md` | modified | 영역 토큰 · withAuth · 오류 팝업 · 테스트 위치 · 근거 경로 — 초안 표시 |

## Tests Written
- 새: `src/test/shared/utils/area.test.ts`(areaOf 3 · loginUrl 3 · safeReturnPath 2), `src/test/shared/api/auth.test.ts`(withAuth 5), `src/test/shared/api/cookie.test.ts`(refreshAreaToken 동시 1), `src/test/app/api/cookie/token-cookie.test.ts`(쿠키 이름 · 만료, 영역별 재발급 주소 · 본문, 재발급 401, GET 재발급, GET 쿠키 없음 · 없는 영역 — 5), `src/test/shared/components/AuthGuard.test.tsx`(3), `src/test/shared/components/ui/modal/ErrorPopup.test.tsx`(2)
- 고침: `error.test.ts`(alert → `showErrorPopup` mock, `NetworkError` · 기타 오류 · `LoginRequiredError` 추가 — 6), `request.test.ts`(+ fetch 실패 → `NetworkError` · `AbortError` 그대로), `queue.test.ts`(+ 스트림 끊김 → `NetworkError`)
- 테스트 생략(위임형): `cookie.ts` 의 나머지 함수 · contracts api 3개(token-cookie 테스트가 주소 · 본문 확인) · `RootLayoutContent` · lint 정리 · `/login` 자리 표시
- build 는 테스트를 실행하지 않는다 — 실행은 `/beaver:test`.

## Verification
- `npx next typegen && npx tsc --noEmit` — 소스 오류 0. 남은 3건은 `.next/dev/types/validator.ts`(실행 중인 `npm run dev` 가 만든 파일)가 지운 `cookie/access|refresh|logout/route` 를 가리키는 것 — 개발 서버를 다시 띄우면 새로 만들어진다.
- 계층 방향: `shared` → `contracts` · `app` import 없음, `contracts` → `app` 없음(grep). `src/test` 는 규칙 밖.
- `alert(` · `LoginContent` · `AccessTokenContext` · `IsLoginContext` · `loginPath` · `sessionStorage.referer` — `src` · AGENTS.md · docs 에 남은 것 없음(grep).
- plan 대조: 새 파일 · 통째로 다시 쓴 파일 22개는 plan 코드 블록을 스크립트로 그대로 옮겼고, 나머지(`request` · `queue` · `validation` · `CopyButton` · `/dev/ui` · lint 파일)는 plan 의 바뀌는 곳 그대로. 지침서 DTO 3개는 블록 그대로.
- 구조 규칙: `AuthGuard` · `ErrorPopup` · `RootLayoutContent` · `Timer` · `useCheckboxGroup` · `useInput` 계열 — 영역 순서 · 빈 줄 · 영역 주석 · 오른쪽 주석 · JSX 주석(읽어서 확인). `useCheckboxGroup` 의 렌더 중 상태 맞추기는 상태 영역 바로 뒤 별도 주석 덩어리.

## Remaining Issues
- 테스트 미실행 — `/beaver:test`(또는 `npx vitest run`). `next/headers` mock 으로 route handler 를 부르는 테스트 · `useSyncExternalStore` 팝업 테스트가 처음 돈다.
- `npm run lint` 는 사용자 실행 대상 — 이번 목표가 오류 · 경고 0 이라 확인이 필요하다.
- 실제 백엔드로는 아직 못 본다 — 로그인 화면이 없어 토큰을 저장할 길이 없다(Phase 5 · 10 · 15). 그 전까지 영역 토큰은 늘 없음 → `AuthGuard` 를 쓰는 화면도 아직 없다.
- 화면 확인: `npm run dev` 후 `/dev/ui/` "오류 팝업"(이용자 열 · 콘솔 열 — 콘솔 열은 개발 원문까지), `/login/` 자리 표시.
- 쿠키 `domain` 은 `SERVER_DOMAIN` 이 빈 문자열이면 붙이지 않게 바꿨다(`|| undefined` — 예전은 `??` 라 빈 문자열이 그대로 갔다).
- 예전 브라우저에 남은 `accessToken` · `refreshToken` 쿠키는 쓰지 않을 뿐 지우지 않는다(httpOnly 라 만료되면 사라진다).

## Modification - 261116-1

ship 리뷰(`.beaver/output/review/main-review-261116.md`) 지적을 사용자 결정("고친 뒤 ship")으로 고쳤다. High(재발급 IP 검사)는 백엔드에서 풀기로 했다 — 요청 내용은 대화로 전달(프론트 코드 변경 없음).

### Changes
| 파일 | 구분 | 내용 |
|---|---|---|
| `src/app/api/cookie/token-cookie.ts` | modified | 재발급 결과를 `ok` · `invalid`(4xx — 쿠키 삭제) · `retry`(네트워크 · 5xx — 쿠키 유지) 셋으로, `refreshAndStore` · `refreshResponse`(`retry: true`), POST 검사 `isSameSiteJson` · `isTokenSet` |
| `src/app/api/cookie/[area]/route.ts` · `[area]/refresh/route.ts` | modified | `refreshResponse(await refreshAndStore(…))`, POST 는 같은 사이트 JSON · 만료 시각을 읽을 수 있을 때만 저장 |
| `src/shared/api/cookie.ts` | modified | `refreshAreaToken` — `retry` · 2xx 아님 · 응답 없음이면 `NetworkError`(로그아웃하지 않게), 로그인이 끝났으면 `null` |
| `src/shared/api/auth.ts` | modified | JSDoc — 재발급 일시 실패는 `NetworkError` 그대로 |
| `src/app/RootLayoutContent.tsx` | modified | 상태 `{area, path, token}` — 로그인 안 된 상태는 주소마다 확인이 끝날 때까지 확인 중, `changeToken` · `expire` 는 그 사이 영역이 바뀌었으면 무시(`currentRef`), `auth` 함수를 함수 영역으로 |
| `src/shared/components/AuthGuard.tsx` | modified | 그 영역 로그인 화면은 막지 않는다(`isLoginPath`) |
| `src/shared/utils/area.ts` | modified | `toSamePath` — URL 로 읽어 같은 사이트일 때만(탭 · 줄바꿈을 끼운 `//evil.com` 막기), `isLoginPath` 추가 |
| `src/shared/api/queue.ts` | modified | 2xx 아닌 응답의 본문 읽기 실패도 `NetworkError` |
| `src/shared/components/Timer.tsx` | modified | `useEffectEvent` 로 `closeFunc` 를 효과 의존성에서 뺌 — `time` 마다 한 번 |
| `src/shared/components/KakaoMap.tsx` | modified | 구조 규칙 주석 |
| `src/shared/utils/validation.ts` | modified | 주석 "alert" → "오류 팝업" |
| `AGENTS.md` · `docs/{architecture,conventions,data-layer,error-handling,testing}.md` | modified | 위 동작 반영 · `경로:줄` 근거 맞춤 · 재발급 IP 제약 ⚠️(data-layer), 초안 표시를 지워 확정 |

### Tests
- `token-cookie.test.ts` — 결과 모양(`{state}`), 401 → invalid · 503 · 응답 없음 → retry, GET access 있음(재발급 안 함) · 재발급 성공 · 401(두 쿠키 삭제) · 503(쿠키 유지 · `retry: true`), POST 저장 · text/plain · 만료 시각 이상 — 9건
- `cookie.test.ts` — 끝난 뒤 다시 부름 · 로그인 끝남 → null · retry · 응답 없음 → `NetworkError` — 4건
- `auth.test.ts` — 재발급 `NetworkError` 는 그대로 던지고 토큰 삭제 · `onExpired` · `setToken` 없음
- `area.test.ts` — 탭 · 줄바꿈 주소, `isLoginPath`
- `AuthGuard.test.tsx` — 로그인 화면은 막지 않음(`usePathname` mock 을 `vi.hoisted` 값으로)

### Verification
- `npx vitest run` — 14파일 85건 통과.
- `npx next typegen && npx tsc --noEmit` — 소스 오류 0(남은 3건은 `.next/dev/types/validator.ts` 가 지운 옛 route 를 가리키는 것 — dev 서버를 다시 띄우면 사라진다).
- 문서 `경로:줄` 근거를 스크립트로 대조해 어긋난 곳을 맞췄다.

### Remaining Issues
- 백엔드 IP 검사 완화 전에는 배포 환경에서 access 토큰이 끝날 때(로그인 뒤 약 19분) 로그인이 풀린다 — 로컬은 영향 없음. 백엔드가 반영하면 docs/data-layer.md 의 ⚠️ 를 지운다.
- `RootLayoutContent` 의 영역 전환 · 늦은 응답은 테스트 없음(동작은 코드로 확인) — 첫 보호 화면(Phase 4 이후)에서 더한다.
- `npm run lint` · `/dev/ui/` 오류 팝업 확인은 사용자 실행 대상.
