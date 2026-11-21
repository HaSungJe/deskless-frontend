# Review — main (Phase 17 통계 · 계정 · 이용자 + 화면 ID 숨김 · 목록 번호) — 261122-3

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main` — 같은 날 세 번째 리뷰(261122 는 Phase 15, 261122-2 는 Phase 16)
- Included features:
  - Phase 17 통계 · 계정 · 이용자(A2 · A5 · A6 — roadmap #57 ~ #61) · spec `.beaver/output/spec/admin/stats-accounts-spec.md` · plan `.beaver/output/plan/admin/stats-accounts-plan.md` · report `.beaver/output/report/admin/stats-accounts-report.md`
  - build 뒤 화면 확인 요청(사용자 2026-11-22 — report 에 기록): 월별 표 머리 칸 정렬(A2 · M2), 업체 고르기를 검색 고르기(`SearchSelect`)로, **세 영역 화면의 ID · 코드 원문 숨김 + 표 목록 번호 열**, 업체 상세 배치 정리
  - 이용자 상단 바(사용자 요청 — plan 없음, ship 직전): 하단 탭이 없는 화면에서 홈으로 나갈 길이 없었다 → `UserTopBar` 를 왼쪽 "바로방"(누르면 홈) · 오른쪽 "지나온 화면 › 지금 화면"(앞 단계를 누르면 그 화면)으로 바꾸고, 제목만 있던 머리(내 예약 · 내 정보 · 결제 결과 2)도 같은 바로. 화면 16곳 · 테스트 1파일 2건, `AGENTS.md` 에 규칙 한 줄. 메인(지도) 머리의 "내 예약" 바로가기는 뺌(하단 탭에 있고, 머리 오른쪽은 지금 위치 자리) — 로그인 전에만 "로그인". 바로방 왼쪽에 이전 화면 버튼(홈 머리도 왼쪽 52px 를 비워 바로방 위치를 맞춤 — `UserBackButton` — 이 사이트 안 이동 · 같은 사이트 referrer 면 브라우저 뒤로, 아니면 위 단계 · 홈 링크, 판단은 `canGoHistoryBack` 테스트 3건 · 버튼 테스트 1건). 앱 안 브라우저(테스트 이용자)로 내 정보 → 내 예약 → 이전 = 내 정보, 주소로 연 예약 상세 → 이전 = 내 예약 확인
- Change scope:
  - 관리자 `src/app/admin/(console)/` — 대시보드(바꿈) · `managers/` · `users/`(새로) · 거르기 부품 `FilterChips` · `FilterSelect` · `ListFilter`(제네릭 · 앞뒤 자리) · `admin-paths.ts`, 입점 신청 · 업체 목록 · 상세(번호 · 코드 숨김 · 배치)
  - 계약 — DTO 사본 8개, `stats` · `manager` · `user` api 8개, `getStores` 의 `all_search_yn`, 공통 `member.constants.ts` · `stats.constants.ts`
  - 공통 — `SearchSelect`(`shared/components/ui/form/`) · `listNumber`(`shared/utils/util.ts`), `/dev/ui` 미리보기
  - 업체 관리자 콘솔 — 회원 상태 사본 지움, 상단 바 업체코드 · 내 업체 설정 코드 · 주소 글자 숨김, 문 연동 업체 ID 복사 버튼, 표 4개 번호, M2 합계 항목 공통 · 표 정렬, 로그인 안내 문구, `shortStoreCode` 지움
  - 이용자 — 회원 상태 사본 지움, 내 입점 신청 카드 · 상세의 업체코드 · 주소 글자 숨김, 결제 완료의 예약 ID 숨김
  - 테스트 — 새 9파일 20건(spec 14 · 검색 고르기 5 · 번호 1) · 고친 9파일, 문서 `AGENTS.md` · `docs/architecture.md` · `docs/conventions.md`
- 검증: `npx next typegen && npx tsc --noEmit` 오류 0, `--noUnusedLocals` 로도 안 쓰는 import 0, `npx vitest run` 105파일 461건 통과(React Compiler 회귀 테스트 포함 — 상단 바 · 이전 화면 버튼 뒤 다시 돌림). `npm run lint` 는 build 직후 사용자 확인(오류 없음) — 화면 확인 뒤 고침에는 다시 돌리지 않았다.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `AdminManagerListContent` · `AdminManagerDetailContent` · `AdminUserListContent` · `AdminUserDetailContent`(관리자 화면 `Admin` 머리) · `ManagerPasswordCard` · `UserStateCard` · `UserReservationsCard` · `FilterChips` · `FilterSelect` · `SearchSelect` · `SearchSelectOptionType` · `MEMBER_STATE` · `memberStateTone` · `STATS_SUMMARY_ITEMS` · `listNumber` |
| Structure & layering | pass | page 는 Content 만(목록 page 는 `?store_id=` 를 `storeIdOf` 로 읽고 key 로 다시 만듦), 화면 전용 부품 `_components/`, 관리자 공통 `admin/(console)/_components/`, 범용 부품 `shared/components/ui/form/`, `app → contracts → shared` |
| 공통 로직 분리 | pass | 세 영역의 회원 상태 값 · 색은 `contracts/common/member.constants.ts`(사본 6곳 지움), 두 대시보드 합계 항목은 `contracts/stats/stats.constants.ts`, 목록 번호는 `listNumber` 하나, 쓰는 곳이 없어진 `shortStoreCode` · 안 쓰는 css 지움 |
| 공통 부품 | pass | `Table` · `Pagination` · `Chip` · `Badge` · `Band` · `Card` · `Field` · `Input` · `Textarea` · `Select` · `Segmented` · `CopyButton` · `ConfirmModal` · `EmptyState` · `BarChart`. 검색 고르기는 패키지 없이 `Input` 위에 새 부품(`/dev/ui` 에 미리보기) |
| Errors & responses | pass | 큐 실패는 `failure` 로 받아 try 밖 `handleApiError`, 읽기 실패는 `EmptyState` + 목록 링크, 서버 칸 오류는 `Field name`(달 · 이용 제한 사유) |
| API 계약 | pass | 8개 경로 · 방식이 `frontend/api.md:145-147 · 236-250` 과 같다(동기 6 · 큐 2), 로그인 필요 → `withAuth` |
| 검증 | pass | DTO 사본 그대로 + `validateAction`(통계 · 이용 제한), 칸이 모양 · 글자 수를 막아 화면 검증 실패는 생기지 않음(spec 결정) |
| React Compiler 모양 | pass | try 안 await 만, 효과는 `useEffectEvent` + `AbortController`, 불리는 함수를 먼저 선언(`send` → `confirmBlock` · `unblock`, `moveActive` → `keyDown`) — 회귀 테스트 통과 |
| 본문 순서 · 주석 | pass | 변수 > 상태 > 계산 값 > 효과 > 함수 > JSX, 오른쪽 주석, 상세의 계산 값은 이른 return 위(`authBadge` · `snsText`) |
| 스타일 토큰 | pass | 색 · 크기는 `var(--…)`, 표 숫자 열은 `.page th.number` 로 머리 칸까지(문서에 한 줄), 시안 2 : 1 배치 `.colWide` · `.colNarrow` · `.cols.even` |
| 이용자 상단 바(새 규칙) | pass | 모든 이용자 화면(홈 빼고)이 `UserTopBar` 하나 — 바로방 링크 `/`, 앞 단계 링크(내 예약 · 예약 상세 / 내 정보 · 입점 신청 / 로그인 / 업체 상세), 지금 화면 h1, 안 쓰게 된 `.plainHeader` · `.plainTitle` 지움 |
| 화면 ID 숨김 · 목록 번호(새 규칙) | pass | `*_id` · 업체코드 · 회원 식별 코드 원문이 화면에 남은 곳 없음(남은 것은 주석 처리된 내 정보 한 줄 · 사람이 정한 로그인 아이디), 건넬 값은 복사 버튼만. 표 목록 9곳에 번호 열, 카드 목록 · 순위 표는 번호 없음(사용자 결정) — `AGENTS.md` · `docs/conventions.md` 에 기록 |
| Test strength | pass | spec ✓ 8 + 계산 6 — 인자(조건 · 쪽 · 다듬은 검색어 · 상태 값 · 다듬은 사유) · 호출 횟수(상세 2번 · 확인 전 0번 · 업체 전부 1번) · 표 글자(번호 · 숨긴 코드) · 띠 글자 · 복사한 주소(`navigator.clipboard.writeText` 인자) |

## Intended Behavior Check (against plan/spec)
- A2 대시보드: 처음 기간 비움 · 실결제 · 활동 업체만 · 1쪽 → 받은 기간 칸, 조회만 다시 읽기, 쪽 넘기기는 제출한 조건 그대로, 합계 카드 · 결제액 · 환불액 막대(M2 와 같이 — 사용자 결정) · 달 줄 + 합계 줄 · 업체별(상호명 → 업체 상세, 음수 위험색) — spec 과 같다. 업체별 표의 업체코드 열은 화면 확인 뒤 뺐다.
- A5: 업체 전부로 채운 검색 고르기 · 권한 · 상태 · 검색, `?store_id=` 처음 값, 초기화 판단(탈퇴 업체 → 휴대폰 순) · 확인 창 · 보낸 띠 · 상세 다시 — spec 과 같다. 업체코드 열 · 복사는 화면 확인 뒤 뺐다.
- A6: 상태 · SNS · 검색, 미인증 배지 · 탈퇴 "—", 이용 제한 확인 창(사용자 결정) · 해제 바로 · 탈퇴 대기 잠금 · 예약 요약 · 이력(이용 기간 글자 · 취소 쪽 · 시각) — spec 과 같다. 검색 코드는 목록 · 상세 모두 뺐다(화면 확인 뒤).
- 화면 확인 뒤 고침은 report "plan 과 다른 점" 에 모두 적혀 있고, 코드 · 테스트가 그 내용과 맞다.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | 참고 | `src/app/admin/(console)/managers/AdminManagerListContent.tsx` 업체 고르기 | 업체 목록 전부(`all_search_yn: 'Y'`)를 들어올 때 한 번 읽는다(시안) — 업체가 수천 곳이 되면 검색형 API 가 필요하다 | 그대로 둔다(report 남은 일에 기록) |
| 2 | 참고 | `src/app/manager/(console)/store/_components/StoreDoorTab.tsx` 업체 ID | 숨김 규칙의 예외 — 문 쪽 프로그램 설정에 필요해 원문 대신 "업체 ID 복사" 버튼만 | 그대로 둔다(문서에 예외로 적음) |
| 3 | 참고 | `src/app/(user)/me/MyPageContent.tsx` 내 정보 dl | 회원 식별 코드 줄이 주석으로 남아 있다(사용자가 직접 — 261122-2 리뷰 #1) — 새 규칙상 다시 보일 일이 없다 | 다음에 지워도 된다 |
| 4 | 참고 | `npm run lint` | 화면 확인 뒤 고침(ID 숨김 · 번호 · 검색 고르기)은 lint 를 다시 돌리지 않았다 — `tsc --noUnusedLocals` 로 안 쓰는 import 는 0 | 사용자가 한 번 더 확인 |

## Verdict
Pass — no issues. 커밋은 하나로: Phase 17 새 화면과 화면 확인 뒤 고침(ID 숨김 · 번호 · 검색 고르기 · 정렬 · 이용자 상단 바)이 같은 파일들(A5 · A6 목록 · 상세, 이용자 내 정보 · 결제 결과 · 입점 신청, `AGENTS.md`)과 공통 함수(`listNumber` · `member.constants.ts`)를 함께 바꿔 파일 단위로 나눌 수 없다. 로드맵 완료 표시는 따로 커밋.
