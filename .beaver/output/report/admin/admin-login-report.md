# Report — 관리자 콘솔 — 콘솔 틀 · 관리자 로그인 · 비밀번호 변경 (Phase 15)

## Feature Summary
- **Feature**: 관리자 콘솔 — 콘솔 틀 · 관리자 로그인 · 비밀번호 변경
- **Entry point**: `PAGE /admin/login` · `POST /api/admin/login` · `PAGE /admin/…`(콘솔 틀 · 첫 화면 준비 중) · `PAGE /admin/password`
- **Domain**: admin
- **Plan**: `.beaver/output/plan/admin/admin-login-plan.md` · spec `.beaver/output/spec/admin/admin-login-spec.md` · roadmap Phase 15(#51 · #52) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/contracts/admin/dto/admin-login.dto.ts` · `admin-password.dto.ts` | created | 지침서 `frontend/dto/admin.md` 사본 |
| `src/contracts/admin/api.ts` | modified | `loginAdmin`(서버) · `loginAdminByRoute`(화면) · `changeAdminPassword`(큐) |
| `src/app/api/admin/login/route.ts` | created | 로그인 처리 — `backendLogin` → 관리자 토큰 · 계정 쿠키 |
| `src/app/admin/layout.tsx` · `admin-auth.ts` | created | 콘솔 크기 · 비밀번호 변경 주소 · 로그인 뒤 주소 · 권한 배지(총괄관리자 · 관리자) |
| `src/app/admin/(console)/layout.tsx` · `AdminConsoleLayoutContent.tsx` · `admin-console-context.ts` · `admin-menu.tsx` | created | 콘솔 틀(`<AuthGuard>`) · 계정 · 메뉴 5개(시안 아이콘) · 로그아웃 |
| `src/app/admin/(console)/page.tsx` · `AdminDashboardContent.tsx` | created | 첫 화면 — "대시보드는 준비 중이에요"(Phase 17 에서 바뀐다) |
| `src/app/admin/login/page.tsx` · `AdminLoginContent.tsx` | created | A1 관리자 로그인 |
| `src/app/admin/(console)/password/page.tsx` · `AdminPasswordContent.tsx` | created | A1 비밀번호 변경(콘솔 안) |
| `src/app/css/admin/AdminLoginContent` · `AdminPasswordContent` · `AdminDashboardContent` `.module.css` | created | 시안 값 |
| `src/app/api/route-util.ts` | modified | 로그인 처리 route 공통 `backendLogin` · `textOf`(옮김) |
| `src/app/api/manager/login/route.ts` · `src/app/api/user/sign/route.ts` | modified | `backendLogin` · `textOf` 를 쓰고 자기 사본 지움 |
| `src/shared/api/route.ts` | created | `postRoute` · `routeFailure` · `loginFailureOf` · `LoginFailureType` |
| `src/contracts/manager/api.ts` · `src/contracts/user/api.ts` | modified | `loginManagerByRoute` · `signWithSns` 가 `postRoute` · `routeFailure` — 본문 타입 사본 · 쓰지 않게 된 import 지움 |
| `src/app/manager/[store_code]/login/ManagerLoginContent.tsx` | modified | 띠 계산을 `loginFailureOf`(shared)로 — 사본 지움 |
| `src/shared/hooks/useConsoleLogout.ts` | created | 콘솔 로그아웃(그 영역 쿠키 삭제 → 그 영역 로그인 주소 문서) |
| `src/app/manager/(console)/ManagerConsoleLayoutContent.tsx` | modified | 로그아웃을 `useConsoleLogout` 로 — 상태 · 함수 · 문구 사본 지움 |
| `src/shared/components/console/ConsoleShell.tsx` · `console-menu.ts` · `src/shared/css/console/ConsoleShell.module.css` | modified | 상단 바 "비밀번호 변경" 강조(`isCurrentPath`) |
| `src/test/app/admin/(console)/AdminConsoleLayoutContent.test.tsx` · `admin/login/AdminLoginContent.test.tsx` · `api/admin/login.test.ts` · `admin/(console)/password/AdminPasswordContent.test.tsx` | created | spec 9건 |
| `AGENTS.md` · `docs/data-layer.md` · `docs/architecture.md` | modified | 관리자 로그인 · 공통으로 옮긴 함수 |

plan 과 다른 점:
- `routeFailure(result, withBlockComment = false)` — 기존 테스트가 가입 실패(`block_comment` 칸 없음)와 업체 로그인 실패(늘 `block_comment`, 없으면 null)의 서로 다른 모양을 확인해서, 로그인 쪽만 `routeFailure(result, true)` 로 정지 사유 칸을 붙인다. plan 3-2 코드를 같이 고침.
- `docs/conventions.md` 는 바꾸지 않았다 — 훅 목록이 `docs/architecture.md` 에 있어 거기에 `useConsoleLogout` 을 더했다.

## Tests Written
spec 의 ✓ 9건(계산 규칙 없음 — spec 결정).
- 콘솔 틀 1 — 상단 바(아이디 · "총괄관리자" · 비밀번호 변경 주소 · 강조 없음) · 메뉴 글자 5개 · 대시보드 강조 → 로그아웃 → `logout` 1번 · `replaceDocument('/admin/login/')` · 오류 팝업 0번
- 관리자 로그인 4 — 성공(다듬은 아이디 · 돌아갈 주소) · 처음 로그인(`/admin/password/?required=1`) · 정지(띠 "사유: …" · 비밀번호 칸만 비움 · 이동 0번 · 다시 누를 수 있음) · 아이디 비움(칸 문구 · 0번)
- 로그인 처리 2 — 백엔드 주소 · 본문 · 쿠키 3개(`admin_access_token` · `admin_refresh_token` · `admin_account` 만료) · 404 / 403 본문 그대로 · 쿠키 0개
- 비밀번호 변경 2 — 설명 줄 아이디 · 처음 로그인 띠 · 변경 인자 · 토큰 · "비밀번호를 변경했습니다." · `/admin/` / 숫자 없는 새 비밀번호 → 칸 문구 · 0번

## Verification
- `npx next typegen && npx tsc --noEmit`: 오류 0.
- `npx vitest run`(전체): 처음에 회귀 2건 실패(`src/test/contracts/user/api.test.ts` — 가입 실패 본문에 `block_comment: null` 이 붙음) → `routeFailure` 를 가입 · 로그인으로 가른 뒤 1건(`src/test/contracts/manager/api.test.ts` 다시 시도 — 늘 `block_comment` 를 기대) → 인자로 가른 뒤 90파일 420건 통과. 이번 테스트 4파일 9건, 옮긴 공통 함수를 쓰는 업체 로그인 처리 · 업체 콘솔 틀 · 업체 로그인 화면 · 가입 테스트도 그대로 통과.
- spec 동작 흐름 번호(①~⑤)가 화면 · route 주석과 맞는지, 결과 표의 `— (이유)` 줄(로그인 안 됨 · 계정 쿠키 없음 · 첫 화면 · 없는 메뉴 · 이미 로그인 · 다른 사이트 · 5xx · 비밀번호 틀림)이 코드에 있는지 읽어 확인. API 3개 경로가 `frontend/api.md:167-169` 와 같다.

## Remaining Issues
- 화면 확인(`/admin/login/` — 로그인 · 처음 로그인 → 비밀번호 변경, 콘솔 메뉴 · 상단 바 강조 · 로그아웃)과 `npm run lint` 는 사용자 몫. 백엔드 시드 총관리자는 처음 로그인에 비밀번호 변경으로 간다.
- 메뉴의 입점 신청 · 업체(Phase 16) · 업체 관리자 · 이용자(Phase 17) · 대시보드(Phase 17)는 그 전까지 없는 화면 / 준비 중 안내.
