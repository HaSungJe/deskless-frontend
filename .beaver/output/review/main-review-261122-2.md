# Review — main (Phase 16 입점 신청 · 업체 관리 · 이용자 화면 수정) — 261122-2

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main` — 같은 날 두 번째 리뷰(261122 는 Phase 15)
- Included features:
  - Phase 16 입점 신청 · 업체 관리(A3 · A4 — roadmap #53 ~ #56) · spec `.beaver/output/spec/admin/store-manage-spec.md` · plan `.beaver/output/plan/admin/store-manage-plan.md` · report `.beaver/output/report/admin/store-manage-report.md`
  - 이용자 화면 수정(사용자 요청 — plan 없음): 내 예약 · 입점 신청 목록 페이지 번호를 화면 아래쪽에, 내 정보에서 회원 식별 코드 숨김(사용자가 직접 주석 처리)
- Change scope:
  - 관리자 화면 `src/app/admin/(console)/store-applications/` · `stores/` — Content 4개 · page 4개 · 카드 3개 · format 2개, 공통 `_components/ListFilter` · `StoreFilesCard` · `admin-paths.ts`, css 4개
  - 계약 `src/contracts/store/api.ts`(9개 더함) · DTO 사본 9개 · `src/contracts/common/store.constants.ts`(새로 — 이용자 입점 신청 · 업체 관리자 콘솔 사본을 지움)
  - 이용자 `MyReservationContent` · `StoreApplicationListContent` · `UserPage.module.css`(`.pager`) · `MyPageContent`
  - 테스트 6파일 14건 + 픽스처, 문서 `AGENTS.md` · `docs/architecture.md` · `docs/conventions.md`
- 검증: `npx next typegen && npx tsc --noEmit` 오류 0, `npx vitest run` 95파일 434건 통과(React Compiler 회귀 테스트 포함)

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `AdminApplicationListContent` · `AdminApplicationDetailContent` · `AdminStoreListContent` · `AdminStoreDetailContent`(관리자 화면 `Admin` 머리 — Phase 15 와 같다) · `StoreInfoCard` · `StoreStateCard` · `StoreOpenCard` · `ListFilter` · `StoreFilesCard` · `ListQueryType` · `ApprovalType` · `STORE_STATE_TONE` |
| Structure & layering | pass | page 는 Content 만(동적 주소 `await params`), 화면 전용 부품 `_components/`, 관리자 공통 부품 `admin/(console)/_components/`, css 는 `src/app/css/admin/`, `app → contracts → shared` |
| 공통 로직 분리 | pass | 세 영역이 쓰는 백엔드 값 · 신청 상태 배지 색은 `contracts/common/store.constants.ts`(사본 2곳 지움), 두 목록이 쓰는 거르기 · 두 상세가 쓰는 파일 보기는 부품 하나, 화면 주소는 `admin-paths.ts` |
| 공통 부품 | pass | `Table` · `Pagination` · `Chip` · `Badge` · `Band` · `Card` · `Field` · `Input` · `Textarea` · `Switch` · `CopyButton` · `ReasonModal` · `ConfirmModal` · `EmptyState`, 주소 검색은 `searchAddressWithCoords` |
| Errors & responses | pass | 모든 쓰기 실패는 catch → `handleApiError`(칸 오류는 칸 옆 — 반려 사유는 대화상자 칸), 읽기 실패는 `EmptyState` + 목록 링크 |
| API 계약 | pass | 9개 경로 · 방식이 `frontend/api.md:175-183` 과 같다(동기 4 · 큐 5), 로그인 필요 → `withAuth` |
| 검증 | pass | DTO 사본 그대로 + `validateAction`, 연락처 `digitsOnly`, 위도 · 경도 `numberOf`, 상세주소는 빈 글자로도 보낸다(지우기) |
| React Compiler 모양 | pass | try 안 await 만, 효과는 `useEffectEvent` + `AbortController`, 불리는 함수를 먼저 선언(`send` → `submit` — 회귀 테스트가 잡아 고침, 문서에 한 줄) |
| 본문 순서 · 주석 | pass | 변수 > 상태 > 계산 값 > 효과 > 함수 > JSX, 오른쪽 주석 정렬 |
| 스타일 토큰 | pass | 색 · 크기는 `var(--…)`, 고정폭은 `--mono` |
| Test strength | pass | spec ✓ 10건 + 계산 4건 — 인자(거르기 · 다듬은 사유 · 숫자 좌표 · 빈 상세주소 · 상태 · 영업중) · 호출 횟수(상세 다시 2번 · 검증 실패 0번 · 탈퇴는 확인 전 0번) · 표 글자 · 띠 글자 · 버튼 꺼짐 |

## Intended Behavior Check (against plan/spec)
- A3 목록 · 상세: 상태 칩 · 검색 · 번호(`content_start_number` 부터) · 업체 보기, 승인 판단(대기만 · 사업자등록증 · 신청자) · 승인 띠(업체코드 · 로그인 주소 · 늦으면 다시 읽은 값) · 반려 사유 대화상자 — spec 과 같다.
- A4 목록 · 상세: 상태 칩 · 검색 · 업체코드 줄임 · 탈퇴 업체 `DELETE_…`, 주소 검색으로 좌표 · 정보 저장 · 상태(지금과 다를 때만 · 영업중지 사유 · 탈퇴 확인) · 영업중 바로 저장 · 운영 규정 · 파일 보기 · 탈퇴 잠금 — spec 과 같다.
- 이용자 수정: 페이지 번호가 목록이 짧아도 하단 탭 바로 위(화면으로 확인), 회원 식별 코드 숨김 — 요청과 같다. 옮긴 상수를 쓰는 이용자 입점 신청 · 업체 관리자 콘솔 테스트가 그대로 통과.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | 참고 | `src/app/(user)/me/MyPageContent.tsx` 내 정보 dl | 회원 식별 코드 줄을 지우지 않고 주석으로 남겨 두었다(사용자가 직접) — 다시 보일 가능성이 있으면 그대로, 아니면 다음에 지운다 | 그대로 둔다 |
| 2 | 참고 | `src/app/admin/(console)/store-applications/[store_application_id]/AdminApplicationDetailContent.tsx` 승인 버튼 | 승인은 확인 대화상자 없이 바로 처리된다 — spec 결정(시안대로, 위 안내 띠가 결과를 먼저 알린다) | 그대로 둔다 |
| 3 | 참고 | report "plan 과 다른 점" | 상태 칩 목록 타입 · `StoreStateCard` 함수 순서 — 둘 다 plan 코드도 고침 | 없음 |

## Verdict
Pass — no issues. 커밋은 둘로 나눈다: ① 이용자 화면 수정(페이지 번호 · 회원 식별 코드) ② Phase 16 입점 신청 · 업체 관리(+ 리뷰 문서 · spec · plan · report · 문서 · spec 판 · 로드맵 build 표시).
