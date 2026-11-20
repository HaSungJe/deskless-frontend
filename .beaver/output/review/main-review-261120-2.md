# Review — main (Phase 12 상품 · 객실) — 261120-2

> Re-review after fixing `main-review-261120.md` #1 ~ #3. Same ship unit.

## Target
- stick: `main` (direct 모드) → origin: `main`
- 이전 리뷰: `.beaver/output/review/main-review-261120.md`(Pass with fixes — 낮음 3건 · 참고 3건)
- 고친 파일: `src/app/manager/(console)/rooms/RoomsContent.tsx` · `src/contracts/common/room.constants.ts`(새로) · `plans/plan-format.ts` · `plans/_components/PlanCard.tsx` · `room-groups/[room_group_id]/RoomGroupDetailContent.tsx` · `room-groups/[room_group_id]/_components/RoomGroupPlans.tsx` · `src/app/dev/ui/UiPreviewContent.tsx` · `src/test/app/manager/(console)/plans/plan-format.test.ts`
- 검증: `npx tsc --noEmit` 오류 0, `npx vitest run` 81파일 382건 통과

## Fixes
| # | 지적 | 고친 모양 |
|---|------|------|
| 1 | 호실 삭제 확인 문구 조사("301호을") | `'301호' 호실을 삭제할까요?` — 이름 뒤에 조사가 붙지 않는다 |
| 2 | `PLAN_TYPE` 을 다른 화면 폴더에서 가져다 씀 | 백엔드 값이라 `src/contracts/common/room.constants.ts` 의 `ROOM_PLAN_TYPE`(`reservation.constants.ts` 와 같은 자리) — 상품 설정 · 그룹 상세 · 그룹 상품 카드 · 계산 테스트가 쓴다. 한 곳만 쓰던 `PLANS_PATH` 는 `RoomGroupPlans.tsx` 안으로. 화면 폴더 사이 import 없음 |
| 3 | `Select` 가 `/dev/ui` 미리보기에 없음 | "입력 · 칸" 절에 고르기 칸(객실 그룹 — 전체 · 그룹 2개) |

## Convention Check (고친 곳)
| Item | Result | Notes |
|------|------|------|
| 공통 로직 분리 | pass | 두 화면이 쓰는 백엔드 값은 `contracts/common`, 한 곳만 쓰는 주소는 그 파일 |
| import 방향 | pass | `app → contracts` 만 — `room-groups` 가 `plans` 화면 파일을 부르지 않는다 |
| 화면 문구 | pass | 조사 없는 문구 |
| 미리보기 | pass | form 부품(`Input` · `Textarea` · `Select` · `Switch` · `Chip` · `Segmented`)이 모두 `/dev/ui` 에 |

## Remaining (참고 — 이전 리뷰 #4 ~ #6 그대로)
- 다른 카드 저장이 실패해도 앞 카드의 "저장했습니다."가 남는다(실패는 따로 보인다).
- 그룹 상품 줄의 판매 스위치 이름 글자(report Remaining Issues).
- 11-19 문 상태 변경은 백엔드와 배포 시점을 맞춘다.

## Verdict
Pass — 커밋한다.
