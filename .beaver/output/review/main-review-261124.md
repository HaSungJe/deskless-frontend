# Review — main (Phase 18 문의 — 로드맵 밖) — 261124

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features:
  - 문의 — 이용자 문의와 업체 · 관리자 답변(백엔드 수정 요청 `frontend/changes/2026-11-24-inquiry.md`) · spec `.beaver/output/spec/inquiry/inquiry-spec.md` · plan `.beaver/output/plan/inquiry/inquiry-plan.md` · report `.beaver/output/report/inquiry/inquiry-report.md`
  - build 뒤 코드 리뷰(`/ship` high — 사용자 2026-11-24)의 고침 1건(답변 칸 덮어쓰기) — report "plan 과 다른 점" 에 기록
- Change scope:
  - 계약 — DTO 사본 11개(`discovery-store-search` · `inquiry.constants` · `inquiry/dto` 9개), `searchStores` · `contracts/inquiry/api.ts` 14개, `inquiry-state.ts`, 룩업 `inquiry_state_id`
  - 이용자 `src/app/(user)/inquiries/` — 목록 · 문의하기(`StorePicker` · `StoreMapModal`) · 상세 · `inquiry-format.ts`, 진입 링크 2곳(내 정보 · 업체 상세)
  - 콘솔 한 벌 `src/app/_console/inquiries/`(목록 · 상세 · `inquiry-manage.ts`) + 두 영역 page · Content 각 2개, 메뉴 2곳 · `admin-paths.ts`
  - 거르기 부품 이동 — `ListFilter` · `FilterChips` · `FilterSelect` · css 를 관리자 `_components` 에서 `src/shared/components/console/` · `src/shared/css/console/` 로(`git mv`), 관리자 목록 4곳 import
  - css 새 6개(`css/user` 4 · `css/console` 2), 테스트 새 7파일 + 픽스처 19건 · 고친 3파일(메뉴 기대값), 문서 `AGENTS.md` · `docs/architecture.md` · `docs/conventions.md` · `docs/data-layer.md`
- 검증: `npx next typegen && npx tsc --noEmit` 오류 0, `--noUnusedLocals` 로도 0. 테스트는 build 규칙대로 아직 돌리지 않았다(ship 뒤 `/beaver:test`). `npm run lint` 는 사용자 몫 — 아직 돌리지 않았다.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `InquiryListContent` · `InquiryFormContent` · `InquiryDetailContent` · `ManagerInquiryListContent` · `AdminInquiryDetailContent` · `InquiryManageList` · `InquiryManageDetail` · `StorePicker` · `StoreMapModal` · `InquiryScopeType` · `InquiryActionsType` · `INQUIRY_MANAGE` · `INQUIRY_STATE_FILTERS` · `ANSWER_LOCK_MESSAGE` · `inquiryActionsOf` · `inquiryTargetName` · `storeItemOf` |
| Structure & layering | pass | page 는 Content 만(이용자 page 3개는 `AuthGuard`, 문의하기는 `?store_id=` 를 `firstQueryValue`), 화면 전용 부품 `new/_components/`, 두 콘솔 공통 화면은 `src/app/_console/`(새 규칙 — `AGENTS.md` · `docs/conventions.md` · `docs/architecture.md` 에 기록), 도메인을 모르는 거르기 줄은 `shared/components/console/`, `app → contracts → shared` |
| 공통 로직 분리 | pass | 상태 칩 순서 · 배지 색은 이용자 · 콘솔이 같이 `contracts/inquiry/inquiry-state.ts`, 영역마다 다른 것(부를 함수 · 주소 · 안내)은 `INQUIRY_MANAGE` 표 하나, 거르기 줄은 관리자 목록 4개와 문의 목록이 같은 부품(원본 지움 — 두 벌 없음) |
| 공통 부품 | pass | `Field` · `Input` · `Textarea` · `Chip` · `Segmented` · `Badge` · `Band` · `Card` · `Table` · `EmptyState` · `Pagination` · `Modal` · `ConfirmModal` · `StoreMap`(지도 팝업 — 업체 상세 위치 지도와 같은 `locked`) |
| Errors & responses | pass | 큐 실패는 `failure` 로 받아 try 밖 `handleApiError`, 큐 pending(문의 등록)은 `QUEUE_PENDING_MESSAGE` + 목록, 읽기 실패는 `EmptyState` + 목록 링크, 칸 오류는 `Field name`(카테고리 · 제목 · 내용 · 동의 · 검색어 · 답변) |
| API 계약 | pass | 15개(검색 1 · 문의 14) 경로 · 메서드가 요청서 표와 같다 — 이용자 `/user-service/inquiry…`, 업체 관리자 `/admin-service/inquiry/mine…`, 관리자 `/admin-service/inquiry…`, 답변 PUT · 블라인드 PATCH(본문 없음) 큐, 로그인 필요 → `withAuth`. 동의 값은 DTO 밖이라 보내지 않는다(보내면 400) |
| 검증 | pass | DTO 사본 그대로 + `validateAction`, 동의는 DTO 검사 뒤 `showValidationErrors` 로 더한다(지우지 않게 — plan 그대로) |
| React Compiler 모양 | pass | try 안 await 만, 효과는 `useEffectEvent` + `AbortController`, 불리는 함수를 먼저 선언(`reload` · `send` → `submitAnswer` · `confirmBlind`) |
| 본문 순서 · 주석 | pass | 변수 > 상태 > 계산 값 > 효과 > 함수 > JSX, 오른쪽 주석, JSX 덩어리 주석, 상세의 이른 return 은 함수 뒤 |
| 스타일 토큰 | pass | 색 · 크기는 `var(--…)`, 시안이 없어 형제 화면 값(입점 신청 · 내 예약 · 홈 카드 · AdminList · AdminDetail), 팝업 지도 `--store-map-h: 280px` |
| 화면 ID 숨김 · 목록 번호 | pass | 문의 · 회원 · 업체 ID 원문이 화면에 없다(주소 · 보낼 값으로만), 콘솔 표는 번호 열(`listNumber`), 이용자 카드 목록은 번호 없음 |
| 사이트 이름 | pass | "바로방에 문의" · 대상 이름 · 관리자 안내가 `SITE_NAME` |
| Test strength | pass | spec ✓ 14 + 계산 5 — 인자(DTO 종류 · 쪽 · 거르기 값 · 다듬은 검색어 · 제목 · 답변, 등록 JSON 에 동의 · `store_id` 없음), 호출 횟수(카테고리 1번 · 상세 2번 · 확인 전 0번 · 다른 영역 함수 0번), 칸 옆 문구, 표 글자(번호 · 한국 시각 · ID 없음), 링크 주소 |

## Intended Behavior Check (against plan/spec)
- 내 문의 목록: 카테고리 · 상태 칩(전체는 값을 빼고) · 1쪽부터 다시 · 카드(상태 · 카테고리 · 대상 · 문의일 · 답변일) · 빈 안내 두 가지 — spec 과 같다.
- 문의하기: 대상 바로방 · 업체(검색 버튼 · Enter, 결과마다 지도 · 고르기, 대표 사진 없으면 그림), `?store_id` 로 들어오면 업체 상세를 읽어 골라 둠, 업체를 안 골랐으면 등록 꺼짐, 카테고리 받은 목록, 제목 100 · 내용 2000, 동의 체크 하나 + 펼친 안내(보관 기간 임시 문구), 큐 done → 상세 · pending → 목록 — spec 과 같다. 동의 칸 라벨 글자만 plan 과 다르다(report 에 기록).
- 내 문의 상세: 블라인드 띠(요청서 문구 그대로) · 내용 그대로 · 답변 없으면 안내 — spec 과 같다.
- 문의 관리: 두 영역이 같은 화면(업체 관리자 `/mine` · 관리자), 카테고리 고르기 · 상태 칩 · 검색어, 표 번호, 상세의 할 수 있는 일(블라인드면 답변 막고 해제만), 답변 등록 · 수정 띠, 블라인드 · 해제 확인 창 → 상세 다시 — spec 과 같다. 메뉴 "문의"는 업체 관리자 모두 · 관리자(spec 결정).

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | 참고 | `src/app/(user)/inquiries/new/_components/StorePicker.tsx:44` | 업체 검색의 `validateAction` 이 화면의 칸 오류를 모두 지운다 — 등록에서 뜬 카테고리 · 동의 문구가 검색하면 사라진다 | 그대로 둔다 — 이 프로젝트의 검사는 모두 화면 오류를 지우고 다시 그린다(같은 모양) |
| 2 | 참고 | `src/app/_console/inquiries/InquiryManageDetail.tsx` `submitAnswer` | 결과 DTO 가 없는 큐(답변 · 블라인드 · 해제)는 done · pending 이 같은 `null` 이라, 처리가 늦어져도 "답변을 등록했어요." 띠가 뜬다 | 그대로 둔다 — 관리자 이용 제한 카드(`UserStateCard`)와 같은 기존 모양, 고치려면 `callQueue` 를 바꿔야 한다 |
| 3 | 참고 | 동의 안내 `InquiryFormContent.tsx` `CONSENT_ITEMS` | 보관 기간 "탈퇴 시까지"는 임시 문구(사용자 결정) | 정책이 정해지면 문구만 바꾼다 |
| 4 | 참고 | 테스트 · `npm run lint` | build 규칙대로 테스트를 아직 돌리지 않았고, lint 는 사용자 몫 | ship 뒤 `/beaver:test`, lint 는 사용자 확인 |
| — | 고침 | `src/app/_console/inquiries/InquiryManageDetail.tsx` `applyInquiry` | (코드 리뷰에서 찾아 ship 전에 고침) 다시 읽을 때마다 답변 칸을 덮어써서 보내기 전 블라인드 · 해제로 쓰던 답변이 사라졌다 | 고침 — 처음 · 다른 문의 · 저장된 답변이 바뀔 때만 다시 채운다 |

## Verdict
Pass — 막을 문제 없음(참고 4건). 커밋은 하나로: 요청서 · spec · plan · report · 코드 · 테스트 · 문서가 모두 문의 기능 한 덩어리이고, 거르기 부품 이동은 문의 목록이 쓰려고 한 것이라 같은 커밋에 둔다. 로드맵 해당 없음(17개 단계 모두 끝남 — 로드맵 밖 Phase 18).
