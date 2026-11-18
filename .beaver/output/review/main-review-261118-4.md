# Review — main (Phase 9 마이페이지 · 입점 신청, 다시 리뷰) — 261118-4

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: `main-review-261118-3.md` 의 지적 #1 ~ #6 고침(Phase 9 마이페이지 · 입점 신청) + 개발용 테스트 로그인 조건 바꿈(개발 서버에서만 — 카카오 로그인 키는 보지 않는다, 사용자 결정 2026-11-18)
- Change scope(고침만): `UserMeProvider.tsx` · `MyPageContent.tsx` · `RootLayoutContent.tsx` · `RootLayoutProvider.tsx` · `base-path.ts`(`replaceDocument`) · `StoreApplicationDetailContent.tsx` · `StoreApplicationFormContent.tsx` · `MyPageContent.module.css`, 테스트 4파일, AGENTS.md · `docs/data-layer.md` · spec · report
- 검증: `npx tsc --noEmit` 오류 0, `npx vitest run` 56파일 299건 통과(React Compiler 회귀 테스트 포함 — 바뀐 컴포넌트 모두 컴파일됨)

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `replaceDocument` · `isApplicationGone` · `isNotFoundError` · `ME_LOAD_FAILED_MESSAGE` · `RESULT_UNCHECKED_MESSAGE` · `LOGOUT_FAILED_MESSAGE` |
| Structure & layering | pass | 문서 새로 열기는 `shared/utils/base-path.ts`(basePath 를 붙이는 곳과 같이), 취소 확인은 화면 파일 안 모듈 함수 — 다른 화면이 아직 쓰지 않음 |
| Shared logic extraction | pass | 다시 불러오기는 공통 `EmptyState` + `Button`, 늦어짐 문구는 `QUEUE_PENDING_MESSAGE` |
| Errors & responses | pass | 실패는 `handleApiError` · `showErrorPopup`, 큐 결과 null 은 다시 조회해 판단(AGENTS.md "Data Layer") |
| React Compiler 모양 | pass | `try` 안은 `await` 만 — 값 계산이 있는 `try` 는 컴포넌트 밖 `isApplicationGone`, 효과 이벤트는 앞에 선언된 값만(`reloadMe`), 상태 변경은 효과의 `.then` 에서 |
| Styles | pass | `.withdraw` 의 `align-self` → `display: block`, 새 값 없음 |
| Test strength | pass | 새 6건 `[SUCCESS]` · `[FAIL:*]` — 호출 횟수 · 인자 · 이동 안 함 · 팝업 문구까지 |

## Intended Behavior Check (against plan/spec)
- #1 다시 읽기가 실패해도 마이페이지 · 회원 상태 띠가 사라지지 않고(이전 값), 처음부터 없으면 "다시 불러오기"와 로그아웃이 보인다. 탈퇴 · 철회 뒤 다시 읽기 실패는 늦어짐이 아니라 "확인하지 못했어요"로 나눈다 — spec 1 흐름 ① · ④ 에 반영.
- #2 `auth.logout()` 이 로그인 상태를 바꾸지 않으므로 `AuthGuard` 가 로그인 화면으로 보낼 틈이 없다. 쿠키 삭제가 실패하면 머문다 — spec 결정 "로그아웃" 의 근거와 맞다. `auth.logout()` 을 부르는 곳은 마이페이지 하나뿐(검색 확인) — 바뀐 약속은 AGENTS.md Auth · `docs/data-layer.md` 에 적었다.
- #3 취소 결과 null 뒤 상세를 다시 읽어 404 · 400 · 빈 응답이면 취소됨, 남아 있거나 확인하지 못하면 늦어짐 · 상세 다시 — 백엔드 취소는 신청 · 파일을 지운다(spec "데이터 변화"). #4 떠난 뒤 온 실패는 무시.
- #5 공백뿐인 상호명 · 대표자명 · 아이디는 `IsNotEmpty` 에 걸린다. 비밀번호는 다듬지 않는다(공백도 비밀번호 글자).
- 테스트 로그인: 버튼(`page.tsx` → `LoginContent`)과 route 가 같은 `isTestLoginEnabled`(`NODE_ENV === 'development'`)를 쓰고, 운영 빌드에서는 버튼이 숨고 route 는 404 — 테스트 2 + 2 + 2건.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| — | 참고 | `src/app/RootLayoutContent.tsx` `logout` | 이제 `logout()` 뒤 화면 안 이동을 하면 다음 주소 확인 때까지 Context 의 토큰이 남는다 — 지금 부르는 곳(마이페이지)은 문서를 새로 연다 | 매니저 · 관리자 로그아웃(Phase 10 · 15)도 `replaceDocument` 로 — AGENTS.md 에 적음 |
| — | 참고 | 화면 확인 | 로그아웃 → 첫 화면, 탈퇴 철회 버튼 위치(띠 문장 아래)는 브라우저에서 볼 것 | 사용자 몫(`npm run dev`) |

## Verdict
Pass — 261118-3 의 지적 6건을 모두 고쳤고 새 지적 없음. Phase 9 와 개발용 테스트 로그인을 따로 커밋한다.
