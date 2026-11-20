# Report — 상품 · 객실 (Phase 12)

## Feature Summary
- **Feature**: 상품 · 객실 — 상품 설정 · 객실 그룹 · 호실
- **Entry point**: `PAGE /manager/plans` · `PAGE /manager/room-groups` · `PAGE /manager/room-groups/[room_group_id]` · `PAGE /manager/rooms`
- **Domain**: manager
- **Plan**: `.beaver/output/plan/manager/room-manage-plan.md` · spec `.beaver/output/spec/manager/room-manage-spec.md` · roadmap Phase 12(#43 ~ #46 · #62) · direct 모드(`main`)
- **백엔드 변경 반영**: `frontend/changes/2026-11-19-door-state-removed.md`(문 상태 → 마지막으로 연 시각) · `2026-11-20-room-group-detail-floors.md`(프론트 요청 — 그룹 상세 `price_count` · `room_count` · `rooms`, 호실 목록 `floors`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/contracts/room/dto/` 22개 | created | 지침서 `frontend/dto/room.md` 사본 — `room-door-open` · `room-list` · `room-group-detail` 는 변경 문서 모양 |
| `src/contracts/room/api.ts` | created | 객실 API 22개(동기 7 · 큐 15) |
| `src/contracts/common/lookup.ts` | modified | `door_state` 룩업 지움 |
| `src/contracts/common/room.constants.ts` | created | 상품 종류 `ROOM_PLAN_TYPE`(상품 설정 · 그룹 화면이 함께 씀 — 리뷰 261120 #2) |
| `src/app/dev/ui/UiPreviewContent.tsx` | modified | `Select` 미리보기(리뷰 261120 #3) |
| `src/shared/api/error.ts` | modified | `handleApiError(error, isReset, key?)` — 받은 칸 오류를 그 키의 칸에 |
| `src/shared/components/ui/form/Select.tsx` | created | 고르기 상자(`Input.module.css` 를 함께 씀) |
| `src/shared/utils/util.ts` · `store/store-settings-format.ts` · `StorePolicyTab.tsx` · `StoreHoursTab.tsx` | modified | `numberOf` 를 공용으로 옮김, 요일 이름 복제를 `format.ts` 것으로 |
| `src/app/manager/(console)/plans/` — `page.tsx` · `PlansContent.tsx` · `_components/PlanCard.tsx` · `plan-format.ts` | created | M6 상품 설정 |
| `src/app/manager/(console)/room-groups/` — `page.tsx` · `RoomGroupListContent.tsx` · `_components/RoomGroupForm.tsx` · `room-group-format.ts` | created | M5 객실 그룹 목록 · 등록 대화상자 · 그룹 칸 |
| `src/app/manager/(console)/room-groups/[room_group_id]/` — `page.tsx` · `RoomGroupDetailContent.tsx` · `_components/RoomGroup{InfoCard,Photos,Plans,Prices}.tsx` | created | M5 객실 그룹 상세 · 상품별 기간 가격 |
| `src/app/manager/(console)/rooms/` — `page.tsx` · `RoomsContent.tsx` · `_components/RoomFormModal.tsx` · `RoomStateModal.tsx` · `room-format.ts` | created | M4 호실 |
| `src/app/css/manager/` — `PlansContent` · `PlanCard` · `RoomGroupListContent` · `RoomGroupForm` · `RoomGroupDetailContent` · `RoomGroupPlans` · `RoomGroupPrices` · `RoomsContent` `.module.css` | created | 시안 값 |
| `src/test/app/manager/(console)/` — `plans/plan-format.test.ts` · `plans/PlansContent.test.tsx` · `room-groups/RoomGroupListContent.test.tsx` · `room-groups/[room_group_id]/RoomGroupDetailContent.test.tsx` · `…/_components/RoomGroupPrices.test.tsx` · `rooms/room-format.test.ts` · `rooms/RoomsContent.test.tsx` · `room-fixture.tsx` | created | spec 23건 |
| `AGENTS.md` · `docs/conventions.md` · `docs/error-handling.md` · `docs/data-layer.md` | modified | `Select` · 키로 나누는 검사 · `handleApiError` key · `numberOf` · 반영한 변경 2건 |

plan 과 다른 점:
- `contracts/room/api.ts` 는 경로 조각을 `groupPath` · `pricePath` · `roomPath` 로 모았다(경로 22개가 같은 앞부분을 되풀이해서).
- 그룹 상품 줄의 "n개" · "저장" 버튼에 `aria-label`(`1박 기간 가격 3개 보기` · `1박 저장`)을 붙였다 — 줄 3개의 버튼 이름이 같아 화면 읽기 프로그램이 구분하지 못한다.
- 카드 · 대화상자 안의 칸 묶음에 간격용 감싸개(`.card` · `.section` · `.form`)를 더했다(Card · Modal 은 안쪽 간격을 주지 않는다).
- 테스트 픽스처의 페이지 정보는 `PaginationResultDto` 전체 모양(`content_start_number` 포함 — 타입 검사가 잡음).
- 리뷰 261120 반영: 상품 종류 상수는 plan 의 `plans/plan-format.ts` `PLAN_TYPE` 대신 `src/contracts/common/room.constants.ts` `ROOM_PLAN_TYPE`(그룹 화면도 쓰므로), `PLANS_PATH` 는 `RoomGroupPlans.tsx` 안으로. 호실 삭제 문구는 `'301호' 호실을 삭제할까요?`, `Select` 를 `/dev/ui` 미리보기에.

## Tests Written
spec 의 ✓ 12건 + 계산 규칙 11건 = 23건.
- 계산 — `plan-format.test.ts`(상품 설정 보낼 값 3 — 본문 JSON 으로 빠진 칸까지) · `room-format.test.ts`(마지막으로 연 시각 3 · 층 이름 2 · 상태별 버튼 3)
- 상품 설정 — 1박 카드 요일을 모두 끄고 저장 → `data-key="NIGHT"` 칸에만 문구 · 시간 이용 카드 칸은 비어 있음 · 저장 0번
- 그룹 목록 — 등록 인자(설명 · 편의시설 4개) → 받은 ID 상세 주소로 `push` / 그룹명 비움 → 칸 문구 · 0번
- 그룹 상세 — 기본 정보 저장 인자(방 개수 · PC 켬) · 상세 2번 / 방 개수 0 → `data-key="room_group_detail"` 칸 문구 · 0번 / 1박 판매 · 59000 → `NIGHT` 경로 · 본문 · 상세 2번 / 삭제 확인 → 1번 → 목록 주소로 `push`
- 기간 가격 — 추가 인자(그룹 · `NIGHT` · 메모 다듬기) → 대화상자 닫힘 · 목록 2번 · `onChanged` 1번 / 요금 0 → `data-key="plan_price"` 칸 문구 · 0번
- 호실 — 첫 목록 query(1쪽 · 거르기 null) · 층 선택지 `B1` / 등록 인자(층 숫자) → 대화상자 닫힘 · 목록 2번 / 층 300 → 칸 문구 · 0번 / 문 열기 → 그 줄 `2026-11-20 09:05` · 목록 1번만

## Verification
- `npx next typegen && npx tsc --noEmit`: 오류 0(처음 한 번 픽스처 페이지 정보 모양이 모자라 3건 — 고침).
- `npx vitest run`(전체): 81파일 382건 통과. 이번 테스트 7파일 23건, 경고 없음. React Compiler 회귀 테스트 통과 — 새 컴포넌트 모두 컴파일됨.
- 옮긴 `numberOf` · 지운 `DAY_NAMES` 복제 뒤 내 업체 설정 테스트(8파일 25건)도 통과.
- spec 동작 흐름 번호(①~⑥)가 화면 주석과 맞는지, 결과 표의 `— (이유)` 줄(검색 · 상품 고르기 · 거르기 · 정비 완료 · 수정 · 삭제 · 사진 · 받은 문구)이 코드에 있는지 읽어 확인.

## Remaining Issues
- 화면 확인(`/manager/plans/` · `/manager/room-groups/` · 그룹 상세 · `/manager/rooms/`)과 `npm run lint` 는 사용자 몫. 백엔드가 두 변경(11-19 · 11-20)을 배포한 환경이어야 시각 · 층 · 개수가 보인다.
- 11-19 문 상태 변경은 "프론트와 함께 배포" — 백엔드와 배포 시점을 맞춘다(지금 프론트에는 옛 `door_state` 를 쓰는 화면이 없다).
- 표 칸의 판매 스위치는 공통 `Switch` 가 이름("1박 판매")을 늘 그린다 — Phase 11 의 휴무 스위치와 같은 일, 숨김 글자가 필요하면 `Switch` 에 선택 prop.
