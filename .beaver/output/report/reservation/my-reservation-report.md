# Report — 내 예약 (Phase 8)

## Feature Summary
- **Feature**: 내 예약 — 예약 확인 · 취소 · 이용 중 QR · 연장
- **Entry point**: `PAGE /reservation` · `/reservation/[reservation_id]` ★ · `/reservation/[reservation_id]/cancel-request` ★ · `/reservation/[reservation_id]/extension`
- **Domain**: reservation
- **Plan**: `.beaver/output/plan/reservation/my-reservation-plan.md` · spec `.beaver/output/spec/reservation/my-reservation-spec.md` · roadmap Phase 8(#23 ~ #26) · direct 모드(`main`) · Phase 7(`booking-payment-report.md`)과 한 build

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `package.json` · `package-lock.json` | modified | `qrcode.react` ^4.2.0(사용자 결정) |
| `src/contracts/reservation/api.ts` | created(Phase 7 파일) | `getMyReservations` · `getReservation` · `getReservationQr` · `cancelReservation` · `getCancelRequest` · `approveCancelRequest` · `rejectCancelRequest`(`Promise<null>`) · `getExtension` · `requestExtension` — 모두 `withAuth` |
| `src/app/(user)/reservation/page.tsx` · `MyReservationContent.tsx` | created | U6 |
| `src/app/(user)/reservation/[reservation_id]/page.tsx` · `ReservationDetailContent.tsx` · `reservation-rules.ts` | created | U7 · 버튼 · 환불 안내 · 취소 문구 · 취소 요청 · 연장 길이 · `RESERVATION_NOT_FOUND_MESSAGE` |
| `src/app/(user)/reservation/[reservation_id]/_components/ReservationQr.tsx` · `QrLocked.tsx` · `ReservationSegments.tsx` · `RefundGuideCard.tsx` | created | 문 QR(`QRCodeSVG` 200px) · QR 잠김 · 결제 구간(영수증은 `https://` 만) · 환불 안내 |
| `src/app/(user)/reservation/[reservation_id]/cancel-request/page.tsx` · `CancelRequestContent.tsx` | created | U8 |
| `src/app/(user)/reservation/[reservation_id]/extension/page.tsx` · `ExtensionContent.tsx` | created | U9 |
| `src/app/css/user/MyReservationContent.module.css` · `ReservationDetailContent.module.css` · `CancelRequestContent.module.css` · `ExtensionContent.module.css` | created | 시안 값 |
| `docs/integrations.md` · `docs/architecture.md` | modified | 결제하는 곳(U7 결제하기 · U9 연장)의 `returnUrl` · 라이브러리 목록에 `qrcode.react` |

plan 과 다른 점: 없음. 화면 테스트가 같이 쓰는 예약 상세 만들기 · 시각을 `src/test/app/(user)/reservation/reservation-fixtures.ts` 로 뺐다(테스트 파일이 아님 — `*.test.*` 아님).

## Tests Written
spec 의 ✓ 7건 + 계산 규칙 17건 = 24건.
- 계산 — `src/test/app/(user)/reservation/[reservation_id]/reservation-rules.test.ts`(`reservationActions` 6 · `refundGuide` 4 · `cancelResultMessage` 3 · `canAnswerCancelRequest` 2 · `extensionLengthLabel` 2)
- 화면 — `src/test/app/(user)/reservation/MyReservationContent.test.tsx`(1쪽 조회 인자 · 카드 링크 · 사용중지 경고는 확정 예약에만) · `[reservation_id]/ReservationDetailContent.test.tsx`(이용 중 QR 1번 · 유효 끝 · 연장하기 / 이용 전 QR 0번 · 잠김 / 취소 사유 → 취소 1번 · 환불 문구 · 다시 조회) · `cancel-request/CancelRequestContent.test.tsx`(승인 1번 · 문구 · U7 / 처리된 요청 → 안내 · U7 · 승인 · 거절 0번) · `extension/ExtensionContent.test.tsx`(연장 신청 1번 → 결제위젯 `payment` · `returnUrl`)

## Verification
- `npx tsc --noEmit` 통과 · `npx vitest run` 260건 통과(Phase 7 report 와 같은 실행).
- React Compiler — U6 ~ U9 화면 · 조각 8개 모두 컴파일됨.
- spec 동작 흐름 번호가 화면 주석 번호와 맞는지, 결과 표의 `— (이유)` 줄(결제하기 · 거절 · 불가 · 회원 상태 …)이 코드에 있는지 읽어 확인.

## Remaining Issues
- 화면 확인(백엔드를 켜고 `/reservation/` · SMS 링크 주소 두 개 — 로그인 전에 열면 로그인 뒤 그 주소로)과 `npm run lint` 는 사용자 몫.
- 결제하기 · 연장 결제의 돌아올 주소는 Phase 7 의 테스트 결제 확인과 같이 본다.

## Modification - 261118-1
ship 리뷰(`.beaver/output/review/main-review-261118.md`) 지적을 고쳤다.
- **P8-1** `ReservationDetailContent` — QR 효과를 새 상세(`detail`)에 건다(다시 부를 때 옛 상세로 취소된 예약의 QR 을 불러 오류가 환불 안내를 덮던 것).
- **P8-2 · P8-3** `screenSchedule`(reservation-rules) — 환불 마감 · 시작 1시간 전에는 기준 시각만 새로, 시작 · 끝에는 상세를 다시, 시작이 지났는데 아직 확정이면 10초 뒤 다시(5분까지). 화면이 상세마다 타이머를 건다. 취소 창을 열 때도 기준 시각을 새로. `QrLocked` 의 남은 시간은 보여 주기만(다시 부르는 것은 시각표).
- **P8-4** 취소 실패 → 칸 옆 오류가 아니면 창을 닫고 다시 불러온다(실패 처리는 try 밖).
- **P8-5** 결제 대기 예약의 취소 창은 "결제 전에 취소하면 환불할 금액 없이 취소돼요."
- **P8-6** 결제 대기 마감 → "결제 시간이 지나 예약이 만료됐어요." 뒤 내 예약(한 번만 — 띠 · 결제위젯이 함께 알려도). 상태 띠의 결제 대기 줄은 JSX 에서 직접 그린다 — 처음엔 `bandText()` 에 넘겨 React Compiler 가 "Cannot access refs during render" 로 건너뛰었고 회귀 테스트가 잡았다.
- **P8-7** `ExtensionContent` — 연장 조회 실패 → 옛 정보를 비우고 "연장 정보를 불러오지 못했어요" · 다시 불러오기. 연장 결제 뒤 돌아갈 곳은 예약 1건(P7-4 와 같은 결정).
- **P8-8** `CancelRequestContent` — 승인 · 거절 중이면 만료 처리를 건너뛴다.
- 테스트: `ReservationDetailContent.test.tsx` 회귀 1건(P8-1), `reservation-rules.test.ts` `screenSchedule` 3건, 연장 돌아갈 곳 기대값 고침. spec ✓ · 계산 규칙 수는 그대로(24).
- 검증: `npx tsc --noEmit` 통과, `npx vitest run` 49파일 267건 통과, React Compiler 회귀 테스트 통과.
