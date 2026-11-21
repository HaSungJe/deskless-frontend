# Report — 통계 · 계정 · 이용자 — 대시보드와 회원 관리 (Phase 17)

## Feature Summary
- **Feature**: 통계 · 계정 · 이용자 — 대시보드와 회원 관리
- **Entry point**: `PAGE /admin` · `PAGE /admin/managers` · `PAGE /admin/managers/[user_id]` · `PAGE /admin/users` · `PAGE /admin/users/[user_id]`
- **Domain**: admin
- **Plan**: `.beaver/output/plan/admin/stats-accounts-plan.md` · spec `.beaver/output/spec/admin/stats-accounts-spec.md` · roadmap Phase 17(#57 ~ #61) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|---|---|---|
| `src/contracts/stats/dto/stats.dto.ts` · `src/contracts/manager/dto/manager-account-list` · `-detail` · `-password-reset.dto.ts` · `src/contracts/user/dto/user-list` · `user-detail` · `user-reservation-list` · `user-state.dto.ts` | created | 지침서 사본(`frontend/dto/stats.md` · `manager.md` · `user.md`) |
| `src/contracts/stats/api.ts` · `src/contracts/manager/api.ts` · `src/contracts/user/api.ts` | modified | 관리자 API 8개(`getStats` · `getManagerAccounts` · `getManagerAccount` · `resetManagerAccountPassword` · `getUsers` · `getUser` · `getUserReservations` · `updateUserState`) |
| `src/contracts/store/api.ts` | modified | `getStores` 가 `all_search_yn` 도 보낸다(업체 고르기 — 전부) |
| `src/contracts/common/member.constants.ts` | created | 회원 상태 값 · 새 예약이 막히는 상태 · 상태 배지 색 |
| `src/app/(user)/me/MyPageContent.tsx` · `_components/MemberStateBand.tsx` · `stores/[store_id]/booking/BookingContent.tsx` · `reservation/[reservation_id]/extension/ExtensionContent.tsx` · `src/app/manager/(console)/staff/staff-format.ts` · `StaffListContent.tsx` · `[user_id]/StaffDetailContent.tsx` · `[user_id]/_components/StaffAccountCard.tsx` | modified | 옮긴 회원 상태 값을 쓰고 자기 사본(`MEMBER_TONE` · `LEAVE_WAIT` · `BLOCKED_MEMBER_STATES` · `STAFF_STATE` · `STAFF_STATE_TONE` · 글자 `'BLOCK'`)을 지움 |
| `src/contracts/stats/stats.constants.ts` · `src/app/manager/(console)/ManagerDashboardContent.tsx` | created · modified | 합계 항목(이름 · 단위) — M2 는 자기 `SUMMARY_ITEMS` 를 지우고 이것을 씀 |
| `src/app/admin/(console)/admin-paths.ts` | modified | 업체 관리자 · 이용자 목록 주소 · `managerPath` |
| `src/app/admin/(console)/_components/ListFilter.tsx` · `FilterChips.tsx` · `FilterSelect.tsx` | modified · created | 거르기 값을 넓힌 타입(제네릭) · 상태 칩 앞뒤 자리 · 칩 묶음 · 고르기 상자 |
| `src/app/admin/(console)/AdminDashboardContent.tsx` · `page.tsx` | modified | A2 대시보드(준비 중 안내를 바꿈) |
| `src/app/admin/(console)/managers/` — `page.tsx` · `AdminManagerListContent.tsx` · `manager-format.ts` · `[user_id]/page.tsx` · `AdminManagerDetailContent.tsx` · `_components/ManagerPasswordCard.tsx` | created | A5 업체 관리자 목록 · 상세 · 비밀번호 초기화 |
| `src/app/admin/(console)/users/` — `page.tsx` · `AdminUserListContent.tsx` · `user-format.ts` · `[user_id]/page.tsx` · `AdminUserDetailContent.tsx` · `_components/UserStateCard.tsx` · `UserReservationsCard.tsx` | created | A6 이용자 목록 · 상세 · 이용 제한 · 해제 · 예약 이력 |
| `src/app/css/admin/AdminDashboardContent` · `AdminList` · `AdminDetail` · `ListFilter` `.module.css` | modified | 시안 A2 · A5 · A6 값 |
| `src/test/app/admin/(console)/admin-fixture.tsx` · `AdminDashboardContent.test.tsx` · `managers/manager-format.test.ts` · `managers/AdminManagerListContent.test.tsx` · `managers/[user_id]/AdminManagerDetailContent.test.tsx` · `users/user-format.test.ts` · `users/AdminUserListContent.test.tsx` · `users/[user_id]/AdminUserDetailContent.test.tsx` | modified · created | spec 14건 + 픽스처 |
| `src/shared/components/ui/form/SearchSelect.tsx` · `src/shared/css/ui/form/SearchSelect.module.css` · `src/app/dev/ui/UiPreviewContent.tsx` | created · modified | 검색 고르기(칸에 쳐서 거르고 고름 — select2 처럼) · `/dev/ui` 미리보기 — 업체 관리자 목록의 업체 칸(사용자 요청) |
| `src/app/css/manager/ManagerDashboardContent.module.css` | modified | 월별 표 머리 칸을 값과 같이 오른쪽(사용자 요청 — A2 와 같은 고침) |
| `AGENTS.md` · `docs/architecture.md` · `docs/conventions.md` | modified | 관리자 A2 · A5 · A6 생김, 회원 상태 값 · 통계 항목 공통, 거르기 부품, `SearchSelect`, 표 숫자 열 정렬 |

plan 과 다른 점:
- 상세 카드 안의 세로 간격은 `.stack`(20px) 대신 새 `.cardBody`(16px — 시안 `.card.pad.stack.g16`)로, dd 안의 글자 + 배지 · 복사 줄은 `.copyRow`(위 여백 8px — 머리용) 대신 새 `.inline` 으로 그렸다. 예약 이력 카드도 `.cardBody` 로 감쌌다. 동작은 같다.
- 나머지 코드는 plan 그대로.
- build 뒤 화면 확인(사용자 2026-11-22): 월별 표 머리 칸이 값과 어긋났다 — 공통 표의 `.table th` 왼쪽 정렬이 화면 `.number` 보다 세서 머리 칸만 왼쪽. `.page th.number, .page td.number` 로 같이 오른쪽에 맞췄다. 업체 관리자 대시보드(M2) 월별 표도 같은 상태라 함께 고침, `docs/conventions.md` 스타일 `Table` 줄에 한 줄.
- build 뒤 화면 확인(사용자 2026-11-22): 업체 관리자 목록의 업체 고르기 — 앞 글자 "업체" 를 지우고(칸 이름은 aria-label 로 남김), 고르기 상자를 칸에 쳐서 거르는 검색 고르기로(select2 처럼). 새 패키지 없이 공통 부품 `SearchSelect`(`shared/components/ui/form/`)로 만들었다 — 열면 칸을 비우고 전부(지금 고른 것은 안내 글자), 치면 글자가 들어간 줄만, ↑ ↓ · Enter · Esc, 칸을 떠나면 닫기. "전체 업체" 는 빈 값 줄. 이용자 목록의 SNS(7개)는 고르기 상자(`FilterSelect`) 그대로.
- build 뒤 화면 확인(사용자 2026-11-22): **ID · 코드 원문 숨김 + 표 목록 번호** — 세 영역(관리자 · 업체 관리자 콘솔 · 이용자)에 같이 적용(업체 콘솔도 같이 — 사용자 선택, 휴대폰 카드 목록은 번호 없음 — 사용자 선택).
  - 번호: 공통 `listNumber(pagination, index)`(`src/shared/utils/util.ts` — `content_start_number` 부터 내려감, 테스트 1건). 업체 · 업체 관리자 · 이용자 목록, 이용자 예약 이력, 업체 콘솔의 업체 관리자 · 호실 · 일시 예약불가 · 기간 가격 표에 번호 열. 입점 신청 목록은 같은 함수로 바꿈. 대시보드 업체별(수익순 순위 표) · 객실 그룹 카드 · 이용자 카드 목록은 번호 없음.
  - 숨김: 업체코드 열(업체 · 업체 관리자 목록 · 대시보드 업체별), 검색 코드(이용자 목록 · 상세), 업체코드 복사(업체 관리자 상세), 업체코드 · 로그인 주소 글자(업체 상세 · 입점 승인 띠 · 입점 신청 처리 카드 · 업체 콘솔 내 업체 설정 · 이용자 내 입점 신청 카드 · 상세 — 모두 "로그인 주소 복사" 버튼만), 업체 콘솔 상단 바의 업체코드, 결제 완료 화면의 예약 ID. 문 연동 탭의 업체 ID 는 문 쪽 프로그램 설정에 필요해 "업체 ID 복사" 버튼만. 쓰는 곳이 없어진 `shortStoreCode` 와 그 테스트 2건 · 안 쓰는 css(`.storeCode` · `.loginUrl code` · `.bandDl` · `.copyRow` · 카드 · 상세의 코드 · 주소 칸) 지움. 업체 콘솔 매니저 로그인 안내의 업체코드 찾는 곳 문구를 고침.
  - 업체 상세 배치: 머리에 등록일 · 수정일을 한 줄(`dl.meta`), 오른쪽에 "로그인 주소 복사" · "이 업체의 업체 관리자". 정보 카드는 넓게(2) · 상태 + 영업중은 좁게(1 — 시안 `.col-2` · `.col-1`), 운영 규정 · 업체 정보 파일은 같은 높이(`.cols.even`).
  - 규칙은 `AGENTS.md`(Conventions · Checklist) · `docs/conventions.md`(화면 · 컴포넌트 입력)에 남김.

## Tests Written
spec 의 ✓ 8건 + 계산 규칙 6건 = 14건(계산 규칙을 먼저 썼다 — 처음부터 통과). build 뒤 요청으로 검색 고르기 5건 더함.
- 계산 — 비밀번호를 초기화할 수 있는지 3: 정지 계정 · 휴대폰 있음 → 켜짐 / 휴대폰 없음 → 막고 문구 / 탈퇴 업체 → 막고 문구
- 계산 — 이용 기간 글자 3: 같은 날 `2026-11-14 15:00 ~ 18:00` / 다른 날 `2026-11-09 15:00 ~ 11-11 11:00` / 해 바뀜 `2026-12-31 22:00 ~ 2027-01-01 10:00`
- 대시보드 2 — 처음 인자(달 null · `LIVE` · `'1'` · 1쪽 · 20건) · 받은 기간이 달 칸에 → 시작 달 · 테스트 결제 · 모든 업체 · 조회 → 인자(`'2026-06'` · `TEST` · `'0'` · 1쪽) · 합계 카드 · 월별 표(달 줄 + 합계 줄) · 업체 링크 · 음수 수익 `-320,000` / 칸만 고치고 2쪽 → 처음 조건 그대로 2쪽
- 업체 관리자 목록 2 — 업체 전부 1번(`all_search_yn: 'Y'`) · 업체 고르기 option · 표 글자(영업중지 배지 · 업체코드 앞 8자 · 임시 비밀번호 배지 · 휴대폰 없음 "—") → 업체 · 총괄매니저 · 정지 · 다듬은 검색어 → 5번째 인자 / `storeId` 로 그리면 첫 부름부터 그 업체 · 업체 칸 값
- 업체 관리자 상세 1 — 확인 창 문구 → 초기화 1번(그 계정) · 띠 글자 · 상세 2번
- 이용자 목록 1 — 표 글자(검색 코드 앞 8자 · 미인증 · 탈퇴 "—" · 한국 시각) → 정지 · 카카오 · 다듬은 검색어 → 4번째 인자
- 검색 고르기 5(`src/test/shared/components/ui/form/SearchSelect.test.tsx`) — 닫히면 고른 글자 · 누르면 비우고 전부 / 쳐서 거른 뒤 줄 누름 → 그 값 1번 · 닫힘 / ↓ 로 열고 쳐서 Enter / 맞는 줄 없음 → 안내 · Enter 0번 / Esc · 칸 떠남 → 고르지 않고 원래 글자. 업체 관리자 목록 테스트는 업체 칸을 쳐서 고르도록 고침("강남" → 1줄 → 그 업체로 다시 읽기).
- 이용자 상세 2 — 이력 인자(그 이용자 · 1쪽 · 10건) · 사유 → 확인 창 문구 → 상태 변경 1번(`{state_id: 'BLOCK', block_comment: 다듬은 사유}`) · 띠 · 상세 2번 / 정지 이용자 → 확인 창 없이 `{state_id: 'ACTIVE'}` · 상세 2번

## Verification
- `npx next typegen && npx tsc --noEmit`: 오류 0.
- `npx vitest run`(전체): 102파일 451건 통과(화면 확인 뒤 고침까지 103파일 455건 통과 · 타입 검사 오류 0 — 코드 · 주소 글자를 보던 테스트 9건은 "보이지 않음" · 번호 · 복사한 주소를 보도록 고침) — 이번 테스트 7파일 14건은 처음부터 통과, 옮긴 회원 상태 값 · 합계 항목 · 바꾼 `ListFilter` 를 쓰는 이용자 화면 · 업체 관리자 콘솔 · M2 · 입점 신청 · 업체 목록 테스트와 React Compiler 회귀 테스트도 그대로 통과.
- spec 동작 흐름 번호(①~⑥)가 화면 주석과 맞는지, 결과 표의 `— (이유)` 줄(음수 위험색 · 빈 목록 · 휴대폰 "—" · 확인 창 취소 · 업체 링크 · 복사 · 칸 글자 수 · 탈퇴 대기 잠금 · 예약 이력 표 · 빈 이력)이 코드에 있는지 읽어 확인. API 8개 경로가 `frontend/api.md:145-147 · 236-250` 과 같다.

## Remaining Issues
- 화면 확인(`/admin/` 대시보드 · `/admin/managers/` · `/admin/users/` — 거르기 · 비밀번호 초기화 · 이용 제한 · 해제, 업체 상세의 "이 업체의 업체 관리자" · 입점 신청 상세의 "이용자 상세 보기" 링크)과 `npm run lint` 는 사용자 몫. 비밀번호 초기화는 실제로 그 계정 휴대폰으로 문자가 간다 — 개발 백엔드 SMS 설정을 확인한 뒤 시험.
- 업체 고르기 칸은 업체 전부를 한 번에 읽는다(시안) — 업체가 아주 많아지면 검색형 고르기로 바꿀 일.
