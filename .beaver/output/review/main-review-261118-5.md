# Review — main (Phase 10 업체 콘솔 — 콘솔 틀 · 매니저 로그인 · 대시보드) — 261118-5

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: Phase 10(#31 ~ #36) + Phase 14 #48(M2 대시보드 — 사용자 결정) — 콘솔 틀(`ConsoleShell` · 메뉴 · 콘솔 Context), M1 업체 로그인 · 아이디 찾기 · 비밀번호 초기화 · 업체 로그인 주소 안내 · 비밀번호 변경, 로그인 처리 route(`/api/manager/login/`) · 계정 쿠키 · 업체코드 쿠키 · 계정 읽기 route, M2 대시보드(`BarChart` 고쳐 씀 · `formatManwon`), revision 261118-1(업체 로그인 화면에서 업체 확인 — 백엔드 수정 요청 `2026-11-18-store-login-store.md`)
- Change scope: 새 파일 약 60개(화면 · 부품 · css · DTO 9 · 테스트 10), 고친 파일 20개(쿠키 · route-util · contracts · 문서)
- 검증: `npx next typegen && npx tsc --noEmit` 오류 0, `npx vitest run` 65파일 325건 통과, React Compiler 회귀 테스트 — 새 컴포넌트 모두 컴파일됨
- 리뷰 방식: 별도 에이전트가 읽기 전용으로 검토(관련 테스트 12파일 51건도 돌림) → 지적마다 코드를 다시 읽어 확인

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `ConsoleShell` · `ConsoleAuthFrame` · `ConsoleAuthCard` · `visibleMenu` · `activeMenuHref` · `useLoginStore`(`UseLoginStoreType`) · `MANAGER_MENU` · `STORE_CODE_COOKIE` · 주소 `[store_code]` |
| Structure & layering | pass | 콘솔 부품은 도메인을 모르는 `shared/components/console/`, 메뉴 · 업체코드 규칙은 `app/manager/`, `(console)/layout.tsx` 가 `<AuthGuard>`, page · layout 은 얇게(안내 page 의 쿠키 읽기 · `redirect()` 만) |
| Shared logic extraction | pass | 인증번호 `SmsVerification` · 띠 `Band` · 카드 `Card` · 표 `Table` · 고르기 `Segmented`, 세 화면이 쓰는 업체 확인은 `[store_code]/useLoginStore.ts` |
| Errors & responses | pass(#1 · #10 제외) | route 는 200 + `{success}`, 실패는 `handleApiError` · `showErrorPopup`, 큐 null 은 spec 결정대로 |
| 쿠키 · 인증 | pass(#5 제외) | 계정 쿠키는 로그인 route 만 쓰고 `clearTokenCookies` 가 함께 지우며 재발급 때 만료를 다시 씀, 업체코드 쿠키는 로그아웃이 안 지움, 같은 사이트 JSON 검사, `return_url` 은 `toSamePath` · `safeReturnPath`, `/manager/login/` ↔ 업체 로그인 사이 되돌기 없음(`?manual=1`) |
| 라우팅 | pass | 정적 `/manager/login` · `/manager/password` 가 `[store_code]` 보다 먼저, `(console)/page.tsx` 가 `/manager` |
| React Compiler 모양 | pass | `try` 안은 `await` 만, 값 계산이 있는 판단은 컴포넌트 밖(`loginFailureOf` · `loginStoreFailureOf`), 회귀 테스트 통과 |
| Test strength | #1 ~ #4 | spec 24건 + revision 1건 + 쿠키 1건 — 아래 빈칸 · 헛도는 단언 |

## Intended Behavior Check (against plan/spec)
- spec 8개 진입점의 동작 흐름 · 결과 표와 코드가 맞는다. revision 261118-1(업체 확인 — 있음 · 없음 · 영업중지 · 확인 못 함)도 세 화면에 같은 모양으로 들어갔다.
- spec 2 결과 표의 "정보가 틀렸다 · 정지 계정이다 → 위험 띠" 는 "로그인 처리가 문구를 그대로 넘긴다 — 3에서 확인"으로 테스트를 생략했지만, 3(route)의 테스트는 JSON 까지만 본다 — route 결과를 `ApiError` 로 바꾸는 `loginManagerByRoute` 와 띠를 그리는 화면 사이가 비어 있다(#1).

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | Medium | `src/contracts/manager/api.ts:53` · `src/app/manager/[store_code]/login/ManagerLoginContent.tsx:46` · 테스트 `ManagerLoginContent.test.tsx` | 로그인 실패 경로가 끝까지 테스트되지 않는다 — `loginManagerByRoute`(route 본문 → `ApiError(400·503)` + `block_comment`, `NetworkError`)는 테스트 0건(형제 `signWithSns` 는 6건), 화면의 실패 띠 · "정지 사유: …" 도 0건. 정상 테스트의 `queryByRole('alert')` 는 `Band` 에 role 이 없어 늘 통과 | `src/test/contracts/manager/api.test.ts`(성공 본문 · 거절 400 + `block_comment` · retry 503 · 네트워크) + 화면 `[FAIL:login]`(띠 문구 · 정지 사유 · 이동 0번), 헛도는 단언은 실제 문구로 |
| 2 | Low | `src/app/manager/login/page.tsx:7-20` | 업체코드 쿠키로 보내기 · `?manual=1` 건너뛰기가 테스트되지 않는다 — 없는 업체 ↔ 안내 되돌기를 막는 곳 | page 함수 테스트(`cookies` · `redirect` mock): 쿠키 있음 → 이동, `manual=1` → 이동 없음, 모양이 틀린 쿠키 → 이동 없음 |
| 3 | Low | `src/test/app/manager/(console)/manager-menu.test.ts:23` | "이름 앞부분만 같은 다른 메뉴는 고르지 않는다"가 `'/manager/rooms/'`(같은 주소)라 `/` 경계 없이 `startsWith` 해도 통과 | 같은 테스트에 `'/manager/rooms-archive/'` → `null` 을 더한다 |
| 4 | Low | `src/test/app/manager/(console)/ManagerDashboardContent.test.tsx:60` | 영업중지 띠가 없다는 단언이 콘솔 Context 없이(store 늘 null) 돌아 늘 통과 | 활성 업체 Context 를 넣고 본다 |
| 5 | Low | `src/app/api/cookie/[area]/route.ts:32-49` | `POST /api/cookie/manager/` 는 토큰만 쓰고 계정 쿠키는 그대로 둔다 — 지금은 부르는 곳이 없지만, 불리면 다른 계정 토큰에 이전 계정의 아이디 · 권한 배지 · 업체 관리자 메뉴가 붙는다 | 토큰을 저장할 때 그 영역 계정 쿠키를 지운다(계정은 로그인 route 만 쓴다), `docs/data-layer.md` 표 |
| 6 | Low | `src/app/manager/(console)/ManagerConsoleLayoutContent.tsx:78` | `reloadStore` 가 실패를 null 로 삼킨다 | 조치 없음 — 이용자 `UserMeProvider.reloadMe` 와 같은 약속(null 을 받은 화면이 안내 — Phase 9 마이페이지), 부르는 화면(Phase 11)이 정한다 |
| 7 | Low | `ManagerFindLoginIdContent.tsx:72` · `ManagerPasswordResetContent.tsx:76` | 번호를 고치면 `SmsVerification` 은 받은 인증을 비우는데(`SmsVerification.tsx:63-68`) 화면의 단계 표시는 2단계로 남는다 | `SmsVerification` 에 선택 `onPhoneChange` 를 더해 화면이 단계를 1로 되돌린다 |
| 8 | Low | `src/app/api/manager/login/route.ts:51` | 업체코드 쿠키는 로그인 때만 1년으로 쓰여, 1년 넘게 다시 로그인하지 않고 재발급으로만 이어 쓰면 먼저 끝난다 | 조치 없음 — 그 경우에도 안내 화면에서 업체코드를 붙여 넣으면 되고, 다시 로그인하면 1년이 새로 붙는다 |
| 9 | Low | `src/app/manager/password/ManagerPasswordContent.tsx:89` | 큐 null(완료 · 늦어짐 같음)을 "바꿨습니다"로 안내 | 조치 없음 — spec 결정(확인할 조회 API 없음) |
| 10 | Low | `ManagerLoginContent.tsx:138` · `src/shared/components/ui/display/Band.tsx` | 로그인 실패 띠가 화면 읽기 프로그램에 알려지지 않는다(`Band` 는 role 없는 div) | `Band` 에 선택 `role` 을 더하고 로그인 실패 띠는 `role="alert"` — #1 테스트도 이걸로 찾는다 |

## Verdict
Changes needed — #1(Medium)과 #2 · #3 · #4 · #5 · #7 · #10(Low)을 고친 뒤 다시 리뷰(`-6`). #6 · #8 · #9 는 근거를 두고 조치 없음.
