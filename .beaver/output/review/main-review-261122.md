# Review — main (Phase 15 관리자 로그인) — 261122

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: Phase 15 관리자 로그인(A1 — roadmap #51 · #52) · spec `.beaver/output/spec/admin/admin-login-spec.md` · plan `.beaver/output/plan/admin/admin-login-plan.md` · report `.beaver/output/report/admin/admin-login-report.md`
- Change scope:
  - 관리자 영역 `src/app/admin/` — layout · `admin-auth.ts` · 로그인 page · Content, `(console)/` layout · 콘솔 틀 · Context · 메뉴 · 첫 화면(준비 중) · 비밀번호 변경 page · Content, css 3개
  - 로그인 처리 `src/app/api/admin/login/route.ts`, 계약 `src/contracts/admin/api.ts`(3개 더함) · DTO 사본 2개
  - 공통으로 옮김 — `backendLogin` · `textOf`(`src/app/api/route-util.ts` — 업체 로그인 처리 · 가입 route 가 함께 씀), `postRoute` · `routeFailure` · `loginFailureOf`(`src/shared/api/route.ts` — 업체 로그인 · 가입 화면 쪽도), `useConsoleLogout`(`src/shared/hooks/` — 업체 콘솔 틀도), `isCurrentPath`(상단 바 비밀번호 변경 강조)
  - 테스트 4파일 9건, 문서 `AGENTS.md` · `docs/data-layer.md` · `docs/architecture.md`
- 검증: `npx next typegen && npx tsc --noEmit` 오류 0, `npx vitest run` 90파일 420건 통과(React Compiler 회귀 테스트 포함), 쓰지 않는 import 없음(바뀐 파일 전부 훑음)

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `AdminLoginContent` · `AdminPasswordContent` · `AdminConsoleLayoutContent` · `AdminDashboardContent` · `admin-auth.ts` · `ADMIN_MENU` · `ADMIN_AUTH_BADGE` · `useConsoleLogout` / `UseConsoleLogoutType` · `LoginFailureType` · `BackendLoginType` |
| Structure & layering | pass | page · layout 은 서버 컴포넌트로 Content 만, 로그인 화면은 `(console)` 밖 · 비밀번호 변경은 안(시안), css 는 `src/app/css/admin/`, `app → contracts → shared` (route-util 은 app, `route.ts` 는 shared — 도메인 모름) |
| 공통 로직 분리 | pass | 업체 콘솔에만 있던 로그인 처리 앞부분 · route 부르기 · 로그인 띠 · 콘솔 로그아웃을 관리자가 두 번째로 쓰게 되어 옮기고 사본 4벌을 지움(가입 route 의 `textOf` · 가입 화면 쪽 route 부르기 포함) |
| 공통 부품 | pass | `ConsoleShell` · `ConsoleAuthFrame` · `ConsoleAuthCard` · `Field` · `Input` · `Band` · `Badge` · `Card` · `EmptyState` · `Button` |
| Auth | pass | 콘솔은 `<AuthGuard>`, 로그인은 Next 서버 route(로그인 IP = 재발급 IP), 쿠키는 `setTokenCookies` · `setAccountCookie`(httpOnly), 같은 사이트 JSON 만, 클라이언트는 쿠키를 직접 읽지 않음(`getAreaAccount`), 돌아갈 주소는 `safeReturnPath` |
| Errors & responses | pass | route 는 항상 200 + `{success}`, 로그인 거절은 띠 · 칸 오류는 칸 옆 · 그 밖은 `handleApiError`, 비밀번호 변경 실패는 `handleApiError`(spec 결정 — 오류 팝업) |
| API 계약 | pass | 3개 경로 · 방식이 `frontend/api.md:167-169` 와 같다(로그인 동기 · 비밀번호 큐 · 재발급은 이미 있음), 메뉴 주소가 `frontend/screens.md` A2 ~ A6 과 같다 |
| 검증 | pass | DTO 사본 그대로 + `validateAction`, 아이디는 다듬어 보냄 |
| React Compiler 모양 | pass | try 안 await 만(결과 · 실패를 담고 밖에서 처리), 띠 계산은 컴포넌트 밖 함수 — 회귀 테스트 통과 |
| 본문 순서 · 주석 | pass | 변수 > 상태 > 계산 값 > 효과 > 함수 > JSX, 오른쪽 주석 정렬 |
| Test strength | pass | spec ✓ 9건 — 인자(다듬은 아이디 · 본문 · 토큰) · 호출 횟수(검증 실패 0번 · 이동 0번 · 쿠키 `set` 3번 / 0번) · 실패 뒤 화면(띠 글자 · 비밀번호 칸 비움 · 버튼 다시 켜짐) |

## Intended Behavior Check (against plan/spec)
- 콘솔 틀: 메뉴 5개(시안 순서 · 아이콘) · 상단 바 아이디 · 권한 배지 · 비밀번호 변경(그 화면이면 강조) · 로그아웃 → 관리자 로그인 문서, 첫 화면 준비 중 안내 — spec 과 같다.
- 관리자 로그인: 이미 로그인 → 돌아갈 주소, 처음 로그인 → `/admin/password/?required=1`, 실패 띠는 아이디 칸 위 · "사유: …" · 비밀번호 칸만 비움 — spec · 시안과 같다.
- 로그인 처리: 토큰 · 계정 쿠키, 업체코드 쿠키 없음, 거절 본문 그대로 · 다시 시도 — spec 과 같다.
- 비밀번호 변경: 콘솔 안, 처음 로그인 띠, 성공 → 오류 팝업 "비밀번호를 변경했습니다." → 첫 화면 — spec 과 같다.
- 옮긴 공통 함수: 업체 로그인 처리 · 업체 콘솔 틀 · 업체 로그인 화면 · 가입(화면 · route · contracts) 기존 테스트가 그대로 통과 — 동작 변화 없음.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | 참고 | `src/shared/api/route.ts` `routeFailure` | plan 과 다르게 `withBlockComment` 인자가 생김 — 가입 실패(정지 사유 칸 없음)와 업체 로그인 실패(늘 있음, 없으면 null)의 모양이 기존 테스트로 서로 달라서. report · plan 3-2 에 적혀 있다 | 그대로 둔다 |
| 2 | 참고 | `src/app/admin/(console)/AdminConsoleLayoutContent.tsx` | 처음 로그인(비밀번호 변경 필요) 상태에서 다른 메뉴로 가는 것을 막지 않는다 — spec · 시안이 막지 않는다(백엔드도 막지 않음) | 그대로 둔다 — 필요하면 다음 phase 에서 |

## Verdict
Pass — no issues. 커밋한다(코드 · 문서 · spec · plan · report · 리뷰 · spec 판 · 로드맵 build 표시를 한 커밋으로 — 한 기능).
