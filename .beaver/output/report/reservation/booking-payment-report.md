# Report — 예약 · 결제 (Phase 7)

## Feature Summary
- **Feature**: 예약 · 결제 — 시간대를 골라 예약하고 토스로 결제
- **Entry point**: `PAGE /stores/[store_id]/booking` · `/payments/success` · `/payments/fail`
- **Domain**: reservation
- **Plan**: `.beaver/output/plan/reservation/booking-payment-plan.md` · spec `.beaver/output/spec/reservation/booking-payment-spec.md` · roadmap Phase 7(#21 · #22) · direct 모드(`main`) · Phase 8(`my-reservation-report.md`)과 한 build

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/contracts/reservation/dto/` 12개 | created | 지침서 사본(`copy-dto.js`) — Phase 7 3개 · Phase 8 9개 |
| `src/contracts/reservation/api.ts` | created | `getAvailability`(공개) · `createReservation` · `confirmPayment`(`withAuth` + `callQueue`) — Phase 8 함수 9개와 한 파일, 경로는 `reservationPath` |
| `src/shared/utils/format.ts` | modified | `formatMonthDayWeek` · `formatDateTime` · `formatDateTimeRange` · `formatTimeRange`, `MS_PER_DAY`(위 상수들 옆) |
| `src/shared/components/payment/TossPaymentWidget.tsx` | modified | `returnUrl` → 성공 · 실패 주소 `?return_url=`(같은 사이트만), `pay` 의 `finally` 제거(React Compiler 가 건너뛰던 것) |
| `src/app/(user)/stores/[store_id]/store-not-found.ts` | created | `STORE_NOT_FOUND_MESSAGE` · `isStoreNotFound` — 업체 상세 · 예약이 같이 씀 |
| `src/app/(user)/stores/[store_id]/StoreDetailContent.tsx` | modified | 위 둘을 import(파일 안 정의 · `ApiError` import 삭제) |
| `src/app/(user)/stores/[store_id]/booking/page.tsx` · `BookingContent.tsx` · `calendar.ts` · `booking-flow.ts` | created | U3 · 달력 계산 · 예약 요청 값 · 시간대 칩 글자 |
| `src/app/(user)/stores/[store_id]/booking/_components/BookingCalendar.tsx` · `RoomGroupCarousel.tsx` · `BookingPayment.tsx` | created | 달력 · 그룹 넘기기(swiper) · 결제 대기 |
| `src/app/(user)/payments/payment-result.ts` · `success/page.tsx` · `success/PaymentSuccessContent.tsx` · `fail/page.tsx` · `fail/PaymentFailContent.tsx` · `_components/PaymentFailView.tsx` | created | U4 |
| `src/app/(user)/reservation/reservation-state.ts` | created | 예약 · 결제 상태 → 색(`Map`) |
| `src/app/css/user/ReservationPage.module.css` · `BookingContent.module.css` · `BookingCalendar.module.css` · `RoomGroupCarousel.module.css` | created | 시안 값 |
| `AGENTS.md` · `docs/data-layer.md` · `docs/integrations.md` · `docs/conventions.md` · `docs/architecture.md` | modified | 표시 형식 줄 · 이용 시간 예 · 결제 `returnUrl` · 결과 화면 흐름 · "React Compiler 가 건너뛰는 모양"(integrations 에서 옮김) · `package.json` 줄 번호(dnd-kit 뒤로 어긋나 있던 것) |

plan 과 다른 점:
- `PaymentSuccessContent` — 승인 → 확인을 화면 밖 `confirmView`(값만 돌려줌)로, 효과 이벤트 `loadView` 는 값만 돌려주고 setState 는 효과 안 `.then`. plan 대로면 변수 영역의 효과 이벤트가 아래에서 선언되는 `setView` 를 불러 React Compiler 가 컴포넌트를 건너뛰었다(`babel-plugin-react-compiler` 로 확인). plan 1-2 코드를 지금 코드로 맞췄고, 이 모양을 `docs/conventions.md` 에 적었다.
- 화면 파일은 컴포넌트만 내보낸다 — 결제 결과 문구 상수는 파일 안에서만 쓴다(plan 재작성 때 이미 반영).

## Tests Written
spec 의 ✓ 4건 + 계산 규칙 20건 = 24건.
- 계산 — `src/test/app/(user)/stores/[store_id]/booking/calendar.test.ts`(`lastOpenDate` 2 · `buildMonthCells` 1 · `dayState` 4 · `monthNav` 1 · `initialDate` 2) · `booking-flow.test.ts`(`toReservationDto` 3 · `slotLabel` 2) · `src/test/shared/utils/format.test.ts`(더함 — `formatDateTimeRange` 2 · `formatTimeRange` 2) · `src/test/app/(user)/payments/payment-result.test.ts`(1)
- 화면 — `src/test/app/(user)/stores/[store_id]/booking/BookingContent.test.tsx`(정상: 조회 인자 · 예약 본문 · 결제위젯 `payment` · `returnUrl` / 실패: 팝업 · 빈 시간 다시 · 위젯 없음) · `src/test/app/(user)/payments/success/PaymentSuccessContent.test.tsx`(정상: 승인 · 확인 인자 · 확정 화면 · 예약 보기 / 토스 거절: 결제 확인 0번 · 다시 고르기)

## Verification
- `npx next typegen && npx tsc --noEmit` 통과. `npx vitest run` 48파일 260건 통과(Node 24.22.3 — 이번에 더한 48건 포함). AGENTS.md 가 Claude 실행을 허용해 build 안에서도 돌렸다 — 권위 있는 실행은 ship 뒤 `/beaver:test`.
- React Compiler — 새로 만들거나 고친 컴포넌트 17개(Phase 7 · 8) 모두 컴파일됨(`babel-plugin-react-compiler`). `TossPaymentWidget` 은 이번에 처음으로 컴파일됨.
- spec 동작 흐름 ①~⑤ 가 `BookingContent` · `PaymentSuccessContent` · `PaymentFailContent` 주석 번호와 맞는지 읽어 확인.

## Remaining Issues
- 토스가 우리 성공 · 실패 주소(`?return_url=…`) 뒤에 값을 `&` 로 잇는지 문서에 없다 — 테스트 결제로 확인할 것(`?` 로 붙어도 `paymentReturnPath` 가 앞 주소만 읽는다).
- 객실 그룹 카드 사진 — 예약 가능 시간 응답에 사진이 없어 자리만 둔다(시안도 자리 표시).
- `npm run lint` · 화면 확인(백엔드를 켜고 `/stores/<id>/booking/`)은 사용자 몫.

## Modification - 261118-1
ship 리뷰(`.beaver/output/review/main-review-261118.md`) 지적을 고쳤다.
- **P7-1** `BookingContent` — 이미 고른 날짜 · 박수를 다시 누르면 그대로(결과를 비우고 다시 부르지 않아 멈추던 것).
- **P7-2** 예약 결과와 함께 누른 때의 호실 · 상품 글자를 저장(`BookedType`)해 결제 화면은 그 값만 쓰고, 요청 중에는 상품 · 날짜 · 박수 · 그룹 · 시간대 · 호수를 바꾸지 않는다(`chooseRoom` 더함).
- **P7-3** 예약 가능 시간 조회 실패 → "불러오지 못했어요" · 다시 불러오기(`.failed`), 판매 상품이 없는 업체 → 빈 안내 · 업체로 돌아가기.
- **P7-4**(사용자 결정 2026-11-18) 결제 뒤 돌아갈 곳을 그 예약 1건(`/reservation/<id>/`)으로 — U3 · U9 모두. 실패 화면 버튼은 "예약으로 돌아가기"(돌아갈 곳이 없으면 "처음으로").
- **P7-6** 로그인 뒤 보던 객실 그룹으로 돌아온다(`?room_group_id=`).
- P7-5(자정을 넘겨 연 화면)는 알려진 제약으로 spec 결정에 적었다.
- 테스트: `BookingContent.test.tsx` 회귀 2건(P7-1 · P7-2), 돌아갈 곳 · 버튼 글자 기대값 고침. spec ✓ · 계산 규칙 수는 그대로(24), 회귀는 plan "테스트" 추가분.
- 문서: `docs/integrations.md` 결제하는 곳 · 실패 화면, `docs/conventions.md` "React Compiler 가 건너뛰는 모양"에 ref 를 render 중 함수 인자로 넘기는 모양.
- 검증: `npx tsc --noEmit` 통과, `npx vitest run` 49파일 267건 통과, React Compiler 회귀 테스트 통과(고치는 중 `ReservationDetailContent` 가 건너뛰어진 것을 이 테스트가 잡았다 — Phase 8 report).
