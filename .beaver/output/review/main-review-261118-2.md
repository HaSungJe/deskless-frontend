# Review — main (Phase 7 · 8 리뷰 지적 고친 뒤) — 261118-2

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: `main-review-261118.md` 와 같음 — 그 지적(P7-1 ~ P7-6 · P8-1 ~ P8-8)을 고친 결과를 다시 본다.
- Change scope: `BookingContent.tsx` · `BookingContent.module.css`(`.failed`) · `PaymentFailView.tsx` · `ReservationDetailContent.tsx` · `reservation-rules.ts`(`screenSchedule` · `PENDING_EXPIRED_MESSAGE`) · `QrLocked.tsx` · `CancelRequestContent.tsx` · `ExtensionContent.tsx`, 테스트 회귀 6건 + 기대값 3곳, spec · plan · report · `docs/integrations.md` · `docs/conventions.md`.
- 검증: `npx tsc --noEmit` 오류 0, `npx vitest run` 49파일 267건 통과, React Compiler 회귀 테스트 통과.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `BookedType` · `ScreenScheduleType` · `PENDING_EXPIRED_MESSAGE` · `START_RETRY_MS` · `MAX_TIMER_MS` · `openCancel` · `expirePending` · `chooseRoom` |
| Structure & layering | pass | 시각 계산은 계산 함수(`screenSchedule`)로 빼 테스트하고, 화면은 타이머만 건다. ref 는 변수 영역, 새 상태는 상태 영역에 역할 주석 |
| Shared logic extraction | pass | 새 공용 없음 — 화면 하나만 쓰는 것은 그 화면 폴더 |
| Errors & responses | pass | 취소 실패는 `handleApiError` 뒤 칸 옆 오류가 아니면 닫고 다시(spec 결과 표와 맞음), 실패 처리는 try 밖 |
| Test strength | pass | 리뷰 버그마다 회귀(P7-1 · P7-2 · P8-1 화면, P8-2 · P8-3 계산 3건) — 호출 횟수(`getAvailability` 1번 · `getReservationQr` 1번)까지 |

## Intended Behavior Check (against plan/spec)
- 지적마다 고친 동작이 spec 결과 표 · 결정에 들어갔다(조회 실패 · 판매 상품 없음 · 같은 날짜 다시 · 요청 중 고르기, 결제 대기 마감 · 시작 · 끝 다시 맞춤 · 취소 실패 → 닫고 다시, 연장 조회 실패). ✓ 행 · 계산 규칙 수는 그대로(각 24) — 회귀는 plan "테스트" 추가분.
- P7-4(사용자 결정 2026-11-18) — 결제 뒤 돌아갈 곳은 U3 · U7 · U9 모두 그 예약 1건, 실패 화면 버튼 "예약으로 돌아가기"(없으면 "처음으로"). `docs/integrations.md` 와 spec 결정에 근거를 적었다.
- 고치는 중 React Compiler 회귀 테스트가 `ReservationDetailContent` 를 잡았다("Cannot access refs during render" — ref 를 쓰는 `expirePending` 을 render 중 `bandText()` 인자로 넘김). 결제 대기 줄을 JSX 에서 직접 그려 해결하고, 이 모양을 `docs/conventions.md` 에 더했다.
- plan 코드 블록을 지금 소스로 맞췄다(전체 파일 블록 29개).
- P7-5 는 알려진 제약(spec 결정).

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| — | — | — | 남은 지적 없음 | — |

## Verdict
Pass — no issues. 커밋 3개(Node 24 / Phase 7 · 8 / React Compiler 수정)로 나눠 올린다.
