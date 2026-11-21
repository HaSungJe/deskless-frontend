# Review — main (Phase 13 예약 현황 · 객실 옵션 이름 · 상품 카드 높이) — 261121-2

> Re-review after fixing `main-review-261121.md` #1 · #2. Same ship unit.

## Target
- stick: `main` (direct 모드) → origin: `main`
- 이전 리뷰: `.beaver/output/review/main-review-261121.md`(Pass with fixes — 보통 1 · 낮음 1 · 참고 1)
- 고친 파일: `src/app/manager/(console)/reservations/ReservationBoardContent.tsx` · `reservation-board-format.ts`(`BoardLoadType`) · `src/app/manager/(console)/room-groups/room-group-format.ts`, 테스트 `reservations/ReservationBoardContent.test.tsx`(1건 더함), spec 결과 줄 · report
- 검증: `npx next typegen && npx tsc --noEmit` 오류 0, `npx vitest run` 86파일 411건 통과(React Compiler 회귀 테스트 포함)

## Fixes
| # | 지적 | 고친 모양 |
|---|------|------|
| 1 | 날짜를 바꾸면 이전 날짜 막대가 새 날짜 기준으로 남고, 새 날짜를 못 읽으면 빈 안내가 뜨지 않음 | 현황 · 받은 시각 · 못 읽음을 상태 하나(`board = {date, result, loadedAt}`)로 — 효과는 성공 · 실패 모두 그 날짜로 담고, 화면은 고른 날짜와 같은 것(`shown`)만 그린다(읽는 중에는 막대 없음, 실패는 빈 안내). 호실 이동 후보도 `shown`. 테스트 `[FAIL:load]` — 다음 날 실패 → 날짜 인자 · 팝업 1번 · 빈 안내 · 전날 막대 없음 |
| 2 | 객실 옵션 값 만들기 반복 · 주석 줄 | `optionsOf(valueOf)` 하나(빈 칸 `() => true` · 상세 → 칸 · 칸 → 0 · 1), `RoomGroupFormType` 주석 줄 맞춤 — 보내는 값은 그대로(그룹 등록 · 수정 테스트 통과) |

## Convention Check (고친 곳)
| Item | Result | Notes |
|------|------|------|
| 본문 순서 · 주석 | pass | 상태 > 계산 값(`shown`) > 효과, 상태 줄 오른쪽 주석 정렬 |
| React Compiler 모양 | pass | 효과 안 setState 는 `.then` · `.catch` 에서만, 회귀 테스트 통과 |
| Test strength | pass | 실패 뒤 화면(빈 안내 · 막대 없음)과 팝업 횟수 · 문구까지 |

## Remaining (참고 — 이전 리뷰 #3 그대로)
- 예약 정보 "점유 끝 HH:mm" 은 자정을 넘어도 시각만 — 시안과 같아 그대로.

## Verdict
Pass — 커밋한다. 커밋은 둘로: ① Phase 13 예약 현황(+ 리뷰 문서 2개 · spec · plan · report · spec 판 · 로드맵 build 표시) ② 객실 옵션 이름 · 상품 카드 높이.
