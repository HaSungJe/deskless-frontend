# Review — main (Phase 12 상품 · 객실) — 261120

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: Phase 12 상품 · 객실(M6 · M5 · M4 — roadmap #43 ~ #46 · #62) · spec `.beaver/output/spec/manager/room-manage-spec.md` · plan `.beaver/output/plan/manager/room-manage-plan.md` · report `.beaver/output/report/manager/room-manage-report.md`
- 백엔드 변경 반영: `frontend/changes/2026-11-19-door-state-removed.md` · `2026-11-20-room-group-detail-floors.md`(이번에 함께 커밋)
- Change scope:
  - 화면 `src/app/manager/(console)/plans/` · `room-groups/` · `room-groups/[room_group_id]/` · `rooms/` — Content 4개 · 부품 8개 · format 3개 · page 4개, css 8개
  - 계약 `src/contracts/room/api.ts`(22개) · DTO 사본 22개(3개는 변경 문서 모양) · 룩업 `door_state` 지움
  - 공통 `Select`(새 부품) · `handleApiError(error, isReset, key?)` · `numberOf` 를 `util.ts` 로(내 업체 설정 2파일 import), 요일 이름 복제 정리
  - 테스트 7파일 23건 + 픽스처, 문서 AGENTS.md · docs 3개
- 검증: `npx next typegen && npx tsc --noEmit` 오류 0, `npx vitest run` 81파일 382건 통과(React Compiler 회귀 테스트 포함)

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `PlansContent` · `PlanCard` · `RoomGroup*` · `Rooms*` · `room-format.ts` · `PLAN_TYPE` · `ROOM_STATE` · `PlanFormType` |
| Structure & layering | pass | page 는 Content 만(동적 주소는 `await params`), 화면 전용 부품은 `_components/`, css 는 `src/app/css/manager/`, `app → contracts → shared` |
| 공통 로직 분리 | **finding #2** | `PLAN_TYPE` 을 다른 화면 폴더(`plans/plan-format.ts`)에서 그룹 화면 2곳이 가져다 쓴다 |
| 공통 부품 | pass · **finding #3** | `Card` · `Table` · `Field` · `FieldError` · `Switch` · `Chip` · `Segmented` · `Modal` · `ConfirmModal` · `Pagination` · `ImageUploader` + `uploadFile`. 새 `Select` 는 `/dev/ui` 미리보기에 없다(다른 form 부품은 모두 있음) |
| 상태 이름 | pass | 호실 상태 · 상품 종류는 응답 `*_name`(`room_state_name` · `room_plan_type_name`) |
| Errors & responses | pass | 모든 쓰기 실패는 catch → `handleApiError`, 같은 이름 칸은 키(`HOURLY` · `room_group_detail` · `plan_price`)로 그 카드 · 줄 · 대화상자 칸에, 문 열기 503 은 받은 문구 팝업 |
| API 계약 | pass | 22개 메서드 · 경로가 `frontend/api.md:204-225` 와 같다(동기 7 — 목록 · 상세 · 업로드 주소 · 문 열기, 큐 15), 로그인 필요 → `withAuth` |
| 검증 | pass | 입력 DTO 사본 그대로 + `validateAction` / `validateActionChildren`, 중첩 DTO(`room_group_detail`)는 부모 + 안쪽 둘 다(`validateRoomGroup`), 숫자 칸 `numberOf` |
| React Compiler 모양 | pass | try 안 await 만(갈래는 try 밖 `send`), catch 는 `failure = {error}`, 효과는 `useEffectEvent` — 회귀 테스트 통과 |
| 화면 문구 | **finding #1** | 호실 삭제 확인 "301호을 삭제할까요?" — 조사 |
| 문서 | pass | `Select` · 키로 나누는 검사 · `handleApiError` key · `numberOf` · 반영한 변경 2건(`docs/data-layer.md`) |
| Test strength | pass | spec ✓ 12건 + 계산 규칙 11건 — 인자(본문 JSON 으로 빠진 칸까지 · 경로 상품 종류 · 그룹 ID) · 호출 횟수(다시 부르기 2번 · 문 열기 뒤 목록 1번만) · 실패 뒤 0번 · 키가 다른 칸은 비어 있음 |

## Intended Behavior Check (against plan/spec)
- spec 화면 5개의 동작 흐름(①~⑥)이 코드 주석 번호와 맞고, 결과 표의 `— (이유)` 줄(검색 · 상품 고르기 · 거르기 · 정비 완료 · 수정 · 삭제 · 사진 · 받은 문구)이 코드에 있다.
- 변경 문서 반영: 호실 표는 문 상태 대신 "마지막으로 연 시각"(`formatOpenedAt` — 시간대 변환 없이, null · 틀린 모양은 "-"), 문 열기 응답 `door_opened_at` 으로 그 줄만 바꾼다. 그룹 상품 "n개"는 `price_count`, 머리는 `room_count` · `rooms`, 층 거르기는 `floors`(`floorLabel` — B1).
- 큐 쓰기는 모두 null 을 기다리지 않고 그 화면 조회를 다시 부른다. 그룹 등록만 결과 ID 가 있으면 상세로, 없으면(늦어짐) 대화상자를 닫고 목록 다시(spec 결정).
- 상태 대화상자는 `roomStateActions` 로 백엔드가 허락하는 전환만 보인다(`RoomStateDto` — 그 밖은 400).
- 기본 정보 · 그룹 상품 칸은 그룹이 바뀔 때만(`key`) 채워 사진을 올려 다시 불러와도 고치던 값이 남는다.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | 낮음 | `src/app/manager/(console)/rooms/RoomsContent.tsx` 삭제 `ConfirmModal` | 확인 문구가 `${room_name}을 삭제할까요?` — 호실명은 대개 "301호"처럼 받침 없이 끝나 "301호을" 이 된다 | 조사가 붙지 않게 `'301호' 호실을 삭제할까요?` |
| 2 | 낮음 | `src/app/manager/(console)/room-groups/[room_group_id]/RoomGroupDetailContent.tsx` · `_components/RoomGroupPlans.tsx` → `plans/plan-format.ts` | 상품 종류 상수 `PLAN_TYPE` 을 상품 설정 화면 폴더에서 그룹 화면이 가져다 쓴다. AGENTS.md "두 곳 이상에서 쓰게 되면 그때 contracts · shared 로". `PLANS_PATH` 는 그룹 상품 카드 한 곳만 쓴다 | 백엔드 값이라 `src/contracts/common/room.constants.ts` 의 `ROOM_PLAN_TYPE`(`reservation.constants.ts` 와 같은 자리)로, `PLANS_PATH` 는 쓰는 파일(`RoomGroupPlans.tsx`)로 |
| 3 | 낮음 | `src/app/dev/ui/UiPreviewContent.tsx` "입력 · 칸" | 새 공통 부품 `Select` 가 미리보기에 없다(`Input` · `Textarea` · `Switch` · `Chip` · `Segmented` 는 있음) | "입력 · 칸" 절에 고르기 칸 하나 |
| 4 | 참고 | `src/app/manager/(console)/plans/PlansContent.tsx` `savedType` | 한 카드를 저장한 뒤 다른 카드 저장이 실패하면 앞 카드의 "저장했습니다."가 남는다 | 조치 없음(실패는 오류 팝업 · 칸 문구로 따로 보인다) |
| 5 | 참고 | `RoomGroupPlans.tsx` 판매 스위치 | 공통 `Switch` 가 이름("1박 판매")을 늘 그린다 — Phase 11 휴무 스위치와 같은 일 | report Remaining Issues 에 적음 |
| 6 | 참고 | 배포 | 11-19 문 상태 변경은 백엔드 "프론트와 함께 배포" — 이 커밋 뒤 백엔드와 배포 시점을 맞춘다 | 사용자가 백엔드와 맞춘다 |

## Verdict
Pass with fixes — 동작 결함은 없고, 고칠 지적 3건(#1 ~ #3)은 화면 문구 · 공통 로직 자리 · 미리보기 정리다. 고친 뒤 커밋한다.
