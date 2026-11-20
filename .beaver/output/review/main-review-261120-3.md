# Review — main (Phase 14 업체 관리자) — 261120-3

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main` — 같은 날 세 번째 리뷰(261120 · 261120-2 는 Phase 12)
- Included features: Phase 14 업체 관리자(M8 — roadmap #49 · #50, #48 M2 대시보드는 Phase 10 과 함께 배포) · spec `.beaver/output/spec/manager/staff-manage-spec.md` · plan `.beaver/output/plan/manager/staff-manage-plan.md` · report `.beaver/output/report/manager/staff-manage-report.md`
- Change scope:
  - 화면 `src/app/manager/(console)/staff/` · `staff/[user_id]/` — Content 2개 · 부품 3개(`StaffFields` · `StaffInfoCard` · `StaffAccountCard`) · `staff-format.ts` · page 2개, css 3개
  - 계약 `src/contracts/manager/api.ts`(7개 더함) · DTO 사본 7개
  - 공통 `isHeadManager(account)`(`manager-console-context.ts`) — 내 업체 설정 문 연동 탭도 이걸로
  - 테스트 2파일 8건 + 픽스처, 문서 AGENTS.md Auth 줄
- 검증: `npx next typegen && npx tsc --noEmit` 오류 0, `npx vitest run` 83파일 390건 통과(React Compiler 회귀 테스트 포함)

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `StaffListContent` · `StaffDetailContent` · `StaffFields` · `StaffInfoCard` · `StaffAccountCard` · `staff-format.ts` · `STAFF_STATE` · `StaffFormType` · `GenderType` |
| Structure & layering | pass | page 는 Content 만(동적 주소는 `await params`), 화면 전용 부품은 `_components/`, css 는 `src/app/css/manager/`, `app → contracts → shared` |
| 공통 로직 분리 | pass | 업체 총관리자 판단 세 곳(문 연동 탭 · 목록 · 상세) → `isHeadManager` 하나, 등록 · 상세가 함께 쓰는 칸은 `staff/_components/StaffFields` |
| 공통 부품 | pass | `Table` · `Pagination` · `Modal` · `ConfirmModal` · `Field` · `Segmented`(성별) · `Badge` · `Band` · `EmptyState`, 권한 배지는 기존 `MANAGER_AUTH_BADGE` |
| 상태 이름 | pass | 상태는 `lookupName('state_id', …)`(응답에 `*_name` 없음), 권한은 콘솔 상단 바와 같은 `MANAGER_AUTH_BADGE` |
| Errors & responses | pass | 모든 쓰기 실패는 catch → `handleApiError`(아이디 · 휴대폰 겹침은 칸 옆) |
| API 계약 | pass | 7개 메서드 · 경로가 `frontend/api.md:154-160` 과 같다(동기 2 · 큐 5), 로그인 필요 → `withAuth` |
| 검증 | pass | 입력 DTO 사본 그대로 + `validateAction`, 휴대폰 `digitsOnly`, 정지는 사유 검사 뒤 확인 창 |
| React Compiler 모양 | pass | try 안 await 만(세 동작 갈래는 try 밖 `send`), 효과는 `useEffectEvent` — 회귀 테스트 통과 |
| 권한 화면 | **finding #1** | 계정을 읽기 전(첫 그림)에도 "업체 총관리자만" 안내가 먼저 보인다 |
| 화면 문구 | **finding #2** | 휴대폰이 없을 때 "등록된 휴대폰 로" — 조사 |
| Test strength | pass | spec ✓ 8건 — 인자(본문 JSON · 숫자만 휴대폰 · 사유 다듬기 · 회원 ID) · 호출 횟수(확인 전 0번 · 다시 부르기 2번 · 업체 관리자면 목록 0번) · 실패 뒤 0번 |

## Intended Behavior Check (against plan/spec)
- spec 화면 3개의 동작 흐름(①~⑤)이 코드 주석 번호와 맞고, 결과 표의 `— (이유)` 줄(겹침 · 검색 · 못 읽음 · 해제 · 취소)이 코드에 있다.
- 확인 창: 초기화 · 정지 · 삭제는 확인 뒤에만 보내고(테스트가 확인 전 0번을 본다), 해제는 바로(spec 결정).
- 등록이 끝나 회원 ID 를 받으면 상세로, 늦어지면 닫고 1쪽 다시. 목록의 업체 총관리자 줄은 링크가 없다.
- **어긋남**: spec ① "계정이 업체 총관리자가 아니거나 모르면(계정 쿠키 없음) 안내" — 코드는 "아직 읽는 중"도 "모름"으로 본다. 콘솔 틀은 계정을 `null` 로 시작해 계정 쿠키를 읽은 뒤에야 채우므로(`src/app/manager/(console)/ManagerConsoleLayoutContent.tsx:44,64-68`), 업체 총관리자도 화면을 열 때마다 잠깐 안내를 본다.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | 보통 | `src/app/manager/(console)/staff/StaffListContent.tsx` · `staff/[user_id]/StaffDetailContent.tsx` (`allowed`) · `ManagerConsoleLayoutContent.tsx:44,64-68` | 콘솔 Context 의 계정이 "읽는 중"과 "없음"을 둘 다 `null` 로 둬서, 업체 총관리자도 첫 그림에 "업체 총관리자만 볼 수 있는 화면입니다."를 보고 계정 쿠키를 읽은 뒤에야 목록이 나온다(테스트는 계정을 처음부터 넣어 줘 잡지 못함) | Context 에 `accountLoaded`(계정 쿠키를 다 읽었나)를 더하고 콘솔 틀이 읽은 뒤 true — 두 화면은 읽기 전엔 아무것도 그리지 않는다. 테스트 1건(읽기 전에는 안내도 목록 호출도 없음) |
| 2 | 낮음 | `src/app/manager/(console)/staff/[user_id]/_components/StaffAccountCard.tsx` `phone` | 휴대폰이 없으면(`phone: null`) "임시 비밀번호가 등록된 휴대폰 로 문자로 갑니다." — 조사 | 번호 뒤 조사까지 한 덩어리로(`010-1234-5678 로` · `등록된 휴대폰으로`) |
| 3 | 참고 | 시험 | 등록 · 비밀번호 초기화는 실제 SMS 가 간다 | report Remaining Issues 에 적음 — 개발 백엔드 SMS 설정 확인 뒤 시험 |

## Verdict
Pass with fixes — 고칠 지적 2건: #1 은 권한 화면이 업체 총관리자에게도 잠깐 막힌 것처럼 보이는 동작 결함(보통), #2 는 문구. 고친 뒤 커밋한다.
