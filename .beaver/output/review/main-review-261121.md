# Review — main (Phase 13 예약 현황 · 객실 옵션 이름 · 상품 카드 높이) — 261121

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features:
  - Phase 13 예약 현황(M3 — roadmap #47) · spec `.beaver/output/spec/manager/reservation-board-spec.md` · plan `.beaver/output/plan/manager/reservation-board-plan.md` · report `.beaver/output/report/manager/reservation-board-report.md`
  - 객실 옵션 이름(사용자 요청 — "편의시설" → "객실 옵션", 항목 목록 `ROOM_GROUP_OPTIONS` 한 곳) · 상품 설정 카드 높이 맞춤(사용자 요청) — plan 없음, 화면 수정
- Change scope:
  - 화면 `src/app/manager/(console)/reservations/` — Content · page · `reservation-board-format.ts` · 부품 6개(`ReservationTimeline` · `ReservationSummary` · `ReservationMenuModal` · `StoreCancelModal` · `RoomChangeModal` · `UseCancelRequestModal`), css 2개
  - 계약 `src/contracts/reservation/api.ts`(4개 더함) · DTO 사본 4개, 옮김 `ROOM_STATE` → `contracts/common/room.constants.ts` · `ROOM_STATE_TONE` · `floorLabel` → `manager/(console)/room-display.ts`
  - 객실 옵션 — `ROOM_GROUP_OPTIONS`(`room.constants.ts`) · `room-group-format.ts` · `RoomGroupForm.tsx` · 이용자 `store-detail-format.ts` `roomOptionLabels` · `StoreDetailContent.tsx` · css 2개
  - 카드 높이 — `PlansContent.module.css` · `PlanCard.module.css`
  - 테스트 — 예약 현황 2파일 19건 + 픽스처, `room-display.test.ts`(층 이름 옮김), 객실 옵션 테스트 4파일 이름 · 글자, 문서 `docs/conventions.md`(React Compiler `use…` 이름) · `docs/data-layer.md`(객실 옵션 한 줄)
- 검증: `npx next typegen && npx tsc --noEmit` 오류 0, `npx vitest run` 86파일 410건 통과(React Compiler 회귀 테스트 포함), `npm run lint` 통과(사용자 확인)

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `ReservationBoardContent` · `reservation-board-format.ts` · `BoardTargetType` · `BoardActionType` · `CANCEL_REASON_MAX` · `ROOM_GROUP_OPTIONS` · `RoomGroupOptionKeyType`, 훅이 아닌 함수는 `use…` 로 짓지 않음(`cancelRequestNotice`) |
| Structure & layering | pass | page 는 Content 만, 화면 전용 부품 `_components/`, css 는 `src/app/css/manager/`, 두 화면이 쓰는 표시 값은 `(console)/room-display.ts`, 백엔드 값 상수는 `contracts/common/`, `app → contracts → shared` |
| 공통 로직 분리 | pass | 호실 상태 · 층 이름을 호실 화면과 예약 현황이 함께 → 옮김, 객실 옵션 이름은 업체 관리자 · 이용자 화면이 한 목록 |
| 공통 부품 | pass | `Modal` · `Field` · `Textarea` · `Band` · `Badge` · `EmptyState` · `Input` · `Button` |
| Errors & responses | pass | 쓰기 3개 실패는 catch → `handleApiError`(호실 이동 겹침은 `room_id` 칸 아래), 현황 읽기 실패도 `handleApiError` |
| API 계약 | pass | 4개 메서드 · 경로가 `frontend/api.md` M3 와 같다(동기 1 · 큐 3), 로그인 필요 → `withAuth` |
| 검증 | pass | 입력 DTO 사본 그대로 + `validateAction`, 사유는 다듬어 보낸다 |
| React Compiler 모양 | pass | try 안 await 만, 효과는 `useEffectEvent` + `AbortController`, "지금"은 효과 · 이벤트에서만(`loadedAt` · `openedAt`) — 회귀 테스트 통과 |
| 날짜를 바꿀 때의 현황 | **finding #1** | 아래 |
| 본문 정리 | **finding #2** | 아래 |
| 스타일 토큰 | pass | 색은 `var(--…)`, 막대 위치는 % 인라인(값 계산) |
| Test strength | pass | spec ✓ 5건 + 계산 규칙 14건 — 인자(날짜 · 예약 ID · 다듬은 사유 · 호실 ID) · 호출 횟수(검증 실패 0번 · 끝나면 현황 2번) · 닫힘 · 안내 띠 |

## Intended Behavior Check (against plan/spec)
- 예약 현황: 날짜 고르기 · 호실별 하루 막대 · 잘림 ‹ › · 정비 꼬리 · 지금 선 · 취소 요청 배지 · 막대 대화상자(누른 시각으로 버튼 켜짐) · 업체 취소 · 호실 이동(같은 그룹 · 사용중지 못 고름) · 이용 중 취소 요청(만료 시각 안내) — spec 과 같다.
- 단, spec 결과 줄 "현황을 못 읽었다 → 불러오지 못했어요 · 다시 불러오기" 가 **다른 날짜로 넘긴 뒤 실패하면 지켜지지 않는다**(#1).
- 객실 옵션: 업체 관리자 칸 제목 · 스위치, 이용자 칩이 `ROOM_GROUP_OPTIONS` 순서 · 이름으로 — 이용자 칩 "샤워 시설" → "샤워실"(같은 이름으로 맞춤). 보내는 값(`room_group_detail` 0 · 1)은 그대로(테스트 확인).
- 카드 높이: 한 줄의 카드가 같은 높이, 저장 줄은 카드 바닥.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | 보통 | `src/app/manager/(console)/reservations/ReservationBoardContent.tsx:34,47,53,132-133` | 현황(`result`)이 어느 날짜의 것인지 모른다. 날짜를 바꾸면 새 현황이 오기 전까지 **이전 날짜 막대를 새 날짜 기준으로** 그린다(그날 밖이라 ‹ 붙은 0 길이 막대로 잠깐 보임). 새 날짜를 못 읽으면 이전 현황이 남아 있어 "불러오지 못했어요" 가 뜨지 않고, 다른 날의 막대가 계속 보인다 | 받은 현황을 날짜 · 받은 시각과 함께 한 상태로 두고(`board = {date, result, loadedAt}`), 고른 날짜와 같은 것만 그린다. 실패도 그 날짜의 결과(`result: null`)로 담아 빈 안내를 띄운다. 테스트 1건(다음 날 실패 → 안내 · 이전 막대 없음) |
| 2 | 낮음 | `src/app/manager/(console)/room-groups/room-group-format.ts:19-22,31,53,63` | 객실 옵션 값을 만드는 `Object.fromEntries(ROOM_GROUP_OPTIONS.map(…)) as Record<…>` 가 세 번 반복. `RoomGroupFormType` 오른쪽 주석 줄이 맞지 않음 | `optionsOf(valueOf)` 하나로 모으고(빈 칸 · 상세 → 칸 · 칸 → 보낼 값), 주석 줄을 맞춘다 |
| 3 | 참고 | `src/app/manager/(console)/reservations/_components/ReservationSummary.tsx:31` | "점유 끝 HH:mm" — 정비시간이 자정을 넘으면 날짜 없이 시각만(바로 위 시간 줄에 "다음 날" 이 있어 읽을 수는 있다) | 그대로 둔다 — 시안과 같다 |

## Verdict
Pass with fixes — #1 · #2 를 고친 뒤(재검증) 커밋한다. 커밋은 둘로 나눈다: ① Phase 13 예약 현황(+ 리뷰 문서 · spec 판 · 로드맵 build 표시) ② 객실 옵션 이름 · 상품 카드 높이.
