# Report — 예약 현황 (Phase 13)

## Feature Summary
- **Feature**: 예약 현황 — 호실별 하루 막대 · 업체 취소 · 호실 이동
- **Entry point**: `PAGE /manager/reservations`(막대 대화상자 → 업체 취소 · 호실 이동 · 이용 중 취소 요청)
- **Domain**: manager
- **Plan**: `.beaver/output/plan/manager/reservation-board-plan.md` · spec `.beaver/output/spec/manager/reservation-board-spec.md` · roadmap Phase 13(#47) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/contracts/reservation/dto/reservation-store` · `-store-cancel` · `-room-change` · `-use-cancel-request` `.dto.ts` | created | 지침서 `frontend/dto/reservation.md` 사본 |
| `src/contracts/reservation/api.ts` | modified | 현황(동기) · 업체 취소 · 호실 이동 · 이용 중 취소 요청(큐) 4개 |
| `src/contracts/common/room.constants.ts` | modified | 호실 상태 `ROOM_STATE` 를 옮겨 옴 |
| `src/app/manager/(console)/room-display.ts` | created | 호실 상태 배지 색 `ROOM_STATE_TONE` · 층 이름 `floorLabel` 을 옮겨 옴(호실 · 예약 현황) |
| `src/app/manager/(console)/rooms/room-format.ts` · `RoomsContent.tsx` · `_components/RoomStateModal.tsx` | modified | 옮긴 것의 import |
| `src/app/manager/(console)/reservations/` — `page.tsx` · `ReservationBoardContent.tsx` · `reservation-board-format.ts` · `_components/ReservationTimeline.tsx` · `ReservationSummary.tsx` · `ReservationMenuModal.tsx` · `StoreCancelModal.tsx` · `RoomChangeModal.tsx` · `UseCancelRequestModal.tsx` | created | M3 예약 현황 |
| `src/app/css/manager/ReservationBoardContent.module.css` · `ReservationTimeline.module.css` | created | 시안 값 |
| `src/test/app/manager/(console)/reservations/reservation-board-format.test.ts` · `ReservationBoardContent.test.tsx` · `reservation-fixture.tsx` · `room-display.test.ts` · `rooms/room-format.test.ts` | created · modified | spec 19건 + 옮긴 층 이름 2건 |
| `docs/conventions.md` | modified | React Compiler 가 건너뛰는 모양 — 훅이 아닌 함수를 `use…` 로 짓지 않는다 |

plan 과 다른 점:
- 이용 중 취소 요청 안내 함수 이름 `useCancelNotice` → `cancelRequestNotice`. `use` 로 시작해 React Compiler 가 훅으로 보고 이벤트 함수 안의 호출로 `UseCancelRequestModal` 을 통째로 건너뜀(회귀 테스트가 잡음) — `docs/conventions.md` 에 한 줄 더함(plan 은 문서 없음이었다).
- 예약 상태 배지 색 `RESERVATION_STATE_TONE` 을 계산 파일에 더했다(대화상자 정보 줄 — 막대 색과 같은 뜻).
- 막대 버튼에 `aria-label`(`401호 17:00~20:00 최유나 예약`) — 막대 글자가 겹치는 호실이 여럿이라 화면 읽기 프로그램이 구분하도록.
- 호실 이동 버튼은 옮길 호실이 하나도 없으면 꺼진다.

## Tests Written
spec 의 ✓ 5건 + 계산 규칙 14건 = 19건, 옮긴 테스트 2건(층 이름).
- 계산 — 막대 위치(하루 안 · 전날 시작 · 다음 날 끝 · 꼬리가 자정 넘음) 4 · 글자 3 · 작업 버튼(시작 전 확정 · 이용 중 · 휴대폰 없음 · 요청 중) 4 · 옮길 호실(같은 그룹 · 지금 호실 빼기 · 사용중지 못 고름) 3
- 화면(시계를 2026-11-10 14:30 한국으로 고정 — `vi.useFakeTimers({toFake: ['Date']})`) — 첫 현황 날짜 · 지금 선 "지금 14:30" · 다음 날 → `{date: '2026-11-11'}` / 401호 막대 → 업체 취소 → 사유 다듬기 인자 · 닫힘 · 현황 2번 / 사유 비움 → 칸 문구 · 0번 / 호실 이동 → 402호 라디오 꺼짐 · 303호 인자 · 현황 2번 / 202호 이용 중 → 취소 요청 → 인자 · "14:40까지" 띠 · 현황 2번

## Verification
- `npx next typegen && npx tsc --noEmit`: 오류 0.
- `npx vitest run`(전체): 처음에 React Compiler 회귀 테스트 1건 실패(`UseCancelRequestModal.tsx:29` — 위 이름 문제) → 이름을 바꾼 뒤 86파일 410건 통과. 이번 테스트 2파일 19건, 경고 없음. 옮긴 호실 화면 테스트도 통과.
- spec 동작 흐름 번호(①~⑤)가 화면 주석과 맞는지, 결과 표의 `— (이유)` 줄(막대 누름 · 못 읽음 · 시작한 예약 · 겹침 · 사유 비움 · 진행 중)이 코드에 있는지 읽어 확인. API 4개 메서드 · 경로가 `frontend/api.md:231-234` 와 같다.

## Remaining Issues
- 화면 확인(`/manager/reservations/` — 오늘 · 다른 날, 1박이 날짜를 넘는 막대 ‹ ›, 대화상자 셋)과 `npm run lint` 는 사용자 몫. 이용 중 취소 요청은 실제로 예약자에게 SMS 가 간다.
- 이용자 예약 화면(`src/app/(user)/stores/[store_id]/booking/booking-flow.ts:78`)에도 `floorLabel` 이 따로 있다 — 지하를 `B1층` 으로 쓰고(콘솔은 시안대로 `B1`) 글자가 달라 그대로 둔다.

## Review fixes - 261121
- 리뷰 `main-review-261121.md` #1 — 현황을 읽은 날짜와 함께 두고(`BoardLoadType`) 고른 날짜의 것만 그린다. 날짜를 넘기는 동안 · 못 읽었을 때 전날 막대가 남지 않고, 못 읽으면 "불러오지 못했어요" 가 뜬다. 테스트 1건 더함(다음 날 실패 → 팝업 1번 · 빈 안내 · 전날 막대 없음) — spec 결과 줄 ✓ 로, 이번 테스트 2파일 20건.
- 검증: `npx tsc --noEmit` 오류 0, `npx vitest run` 86파일 411건 통과.
