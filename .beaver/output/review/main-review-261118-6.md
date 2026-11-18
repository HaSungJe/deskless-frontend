# Review — main (Phase 10 업체 콘솔, 다시 리뷰) — 261118-6

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: `main-review-261118-5.md` 의 지적 #1 · #2 · #3 · #4 · #5 · #7 · #10 고침(#6 · #8 · #9 는 근거를 두고 조치 없음)
- Change scope(고침만): `Band.tsx`(`role`) · `ManagerLoginContent.tsx`(실패 띠 `role="alert"`) · `[area]/route.ts` · `token-cookie.ts`(`clearAccountCookie`) · `SmsVerification.tsx`(`onPhoneChange`) · 아이디 찾기 · 비밀번호 초기화 화면, 테스트 새 2파일(`src/test/contracts/manager/api.test.ts` · `src/test/app/manager/login/page.test.tsx`) + 고친 5파일, `docs/data-layer.md` · `docs/integrations.md`
- 검증: `npx next typegen && npx tsc --noEmit` 오류 0, `npx vitest run` 67파일 334건 통과(React Compiler 회귀 테스트 포함)

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `clearAccountCookie` · `onPhoneChange` · `Band` `role` |
| Structure & layering | pass | 공용 부품에는 선택 prop 만 더함(`Band` · `SmsVerification`) — 기존 호출은 그대로 |
| Errors & responses | pass | 로그인 실패 띠는 `role="alert"` 로 알림 |
| 쿠키 · 인증 | pass | 계정 쿠키는 로그인 route 만 쓰고, 토큰만 저장하는 `POST /api/cookie/<area>/` 는 계정 쿠키를 지운다 — `docs/data-layer.md` 표에 적음 |
| React Compiler 모양 | pass | 회귀 테스트 통과 |
| Test strength | pass | `loginManagerByRoute` 4건(본문 · 거절 400 + `block_comment` · retry 503 · 네트워크), 화면 `[FAIL:login]`(띠 문구 · 정지 사유 · 이동 0번 · 다시 누름), 안내 page 3건(쿠키 이동 · `manual=1` · 쿠키 없음/모양 틀림), 메뉴 `/` 경계, 대시보드 활성 업체 Context, 번호를 고치면 1단계 |

## Intended Behavior Check (against plan/spec)
- #1 spec 2 "정보가 틀렸다 · 정지 계정이다 → 위험 띠" 가 route → `loginManagerByRoute` → 화면 띠까지 테스트로 이어진다. 정상 테스트의 "띠 없음" 단언도 이제 `role="alert"` 를 찾으므로 헛돌지 않는다.
- #2 없는 업체 안내 ↔ 업체 로그인 주소 안내 사이 되돌기를 막는 `?manual=1` 이 테스트로 지켜진다.
- #5 지금 부르는 화면이 없는 `POST /api/cookie/<area>/` 도 계정 쿠키와 토큰이 어긋나지 않게 했다 — 관리자 로그인(Phase 15)도 서버 route 로 가면 지운다(report Remaining Issues).
- #7 번호를 고치면 인증 부품과 단계 표시가 같이 1단계로 돌아간다.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| — | 참고 | `-5` #6 · #8 · #9 | `reloadStore` 의 null · 업체코드 쿠키 1년 · 비밀번호 변경 큐 null | `-5` 에 적은 근거대로 조치 없음 |

## Verdict
Pass — 261118-5 의 고칠 지적 7건을 모두 고쳤고 새 지적 없음.
