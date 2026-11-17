# Review — main (Phase 7 예약 · 결제 + Phase 8 내 예약 · Node 24 · React Compiler 수정) — 261118

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features:
  - Phase 7 예약 · 결제 — #21 U3 예약(`BookingContent` · 달력 · 그룹 넘기기 · 결제 대기) · #22 U4 결제 결과(`PaymentSuccessContent` · `PaymentFailContent`), 결제위젯 `returnUrl`, 이용 시간 글자(`format.ts`)
  - Phase 8 내 예약 — #23 U6 목록 · #24 U7 예약 1건 · #25 U8 이용 중 취소 동의 · #26 U9 연장, `qrcode.react`
  - Node 24.22.3 대응(`Dockerfile` · `.nvmrc` · `engines` · `@types/node` ^24)
  - React Compiler 가 건너뛰던 컴포넌트 3개 수정 + 회귀 테스트(`src/test/react-compiler.test.ts`, `@babel/core` devDependency)
- Change scope: 코드 · 테스트 약 60파일(새 · 고침), 문서 AGENTS.md · `docs/architecture.md` · `conventions.md` · `data-layer.md` · `integrations.md` · `testing.md` · README, beaver 기록(spec · plan · report · 로드맵 · spec 보드 · 이 문서).
- 검증: `npx vitest run` 49파일 261건 통과, `npx next typegen && npx tsc --noEmit` 오류 0, React Compiler 회귀 테스트 — `src` 의 모든 컴포넌트 · 훅 컴파일(일부러 `try … finally` 를 넣으면 "파일:줄 이유" 로 실패하는 것도 확인). `npm run lint` · 화면 확인은 사용자 실행.
- 리뷰 방식: 별도 에이전트 둘이 읽기 전용으로 검토(Phase 7 / Phase 8 · 컴파일러 · Node) — Phase 7 #1 · #2 는 에이전트가 실제 `BookingContent` 를 그려 재현. 지적마다 코드를 다시 읽어 확인했다.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `BookingSelectionType` · `SlotLabelType` · `ReservationActionsType` · `RefundGuideType` · `ResultViewType`, 상수 UPPER_SNAKE, 주소 `[reservation_id]` · `cancel-request` |
| Structure & layering | pass | page.tsx 는 서버 컴포넌트(`'use client'` 없음), 화면 전용 부품 `_components/`, 계산 함수는 그 화면 폴더(`calendar.ts` · `booking-flow.ts` · `reservation-rules.ts`), 여러 화면이 쓰는 것만 공용(`format.ts` · `reservation-state.ts` · `store-not-found.ts`). `shared` → `app` · `contracts` import 없음 |
| Shared logic extraction | pass | 결제는 Phase 4 `TossPaymentWidget`, 사유 입력 `ReasonModal`, 남은 시간 `Timer`, 목록 `Pagination` · `EmptyState`, 회원 상태 `MemberStateBand` |
| Errors & responses | pass(아래 P8-4 제외) | 실패는 `handleApiError`, 없는 예약 · 업체는 안내 팝업 뒤 이동, `alert` 없음 |
| Styles | pass | 새 css 8개 — 색은 모두 토큰, 숫자 크기는 기존 화면과 같은 부품 고유 치수(상단 바 56px · 터치 영역 44px), 간격 · 글자 크기는 시안 값 |
| Test strength | pass | spec ✓ 11 + 계산 규칙 37 = 48건 — 호출 횟수 · 인자 · 거절 뒤 미호출. React Compiler 회귀 1건 |

## Intended Behavior Check (against plan/spec)
- spec 동작 흐름 번호(①~⑤)가 화면 주석과 맞고, 결과 표의 ✓ 행 · 계산 규칙 행이 모두 테스트로 있다.
- plan 과 다른 점: `PaymentSuccessContent` 의 승인 · 확인을 값만 돌려주는 `confirmView` 로 — React Compiler 가 건너뛰던 것(report 에 기록, plan 코드도 맞춤).
- 리뷰에서 spec 결과 표와 다른 곳이 드러났다: U7 "취소가 실패한다 · 늦어진다 → 다시 불러온다"(P8-4), U7 "시작 시각에 상세를 다시"는 시작 1시간 안에 연 경우만(P8-2).
- React Compiler 수정 3개 — 바뀌기 전과 동작이 같다(처리 중 표시는 모든 길에서 풀리고, 오류는 그대로 다시 던진다).
- Node 24 — `.nvmrc` · `Dockerfile` · `engines` · `@types/node` · 로컬 `node -v` 가 맞다. `engines` 는 경고만(`engine-strict` 없음).
- memory: 미반영 항목 없음.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| P7-1 | Medium | `src/app/(user)/stores/[store_id]/booking/BookingContent.tsx:158-168` | 이미 고른 날짜 · 박수를 다시 누르면 `resetSelection` 이 시간대 결과를 비우는데, 값이 같아 조회 효과가 다시 돌지 않는다 → "불러오고 있어요"에서 멈춤 | 같은 값이면 바로 돌아간다(`choosePlan` 처럼) |
| P7-2 | Medium | `BookingContent.tsx:246-248` · 고르기 버튼들 | 예약 요청(큐) 중에도 상품 · 날짜 · 시간대 · 호수를 누를 수 있고, 결제 대기 화면은 지금 고른 값(`group` · `room`)으로 그린다 → 다른 호수가 보이거나(301호 예약인데 302호 표시), 날짜를 바꾸면 결제 화면이 아예 안 나와 결제할 수 없다 | 예약 결과와 함께 호실 · 상품 글자를 저장해 결제 화면은 그 값만 쓰고, 요청 중에는 고르기를 막는다 |
| P8-1 | Medium | `src/app/(user)/reservation/[reservation_id]/ReservationDetailContent.tsx:101-117` | QR 효과가 `reloadKey` 에 걸려 있어 다시 불러올 때 옛 상세(이용 중) 기준으로 QR 을 또 부른다 — 사용중지 호실의 이용 중 예약을 취소하면 취소된 예약의 QR 을 불러 오류 팝업이 환불 안내를 덮는다 | QR 효과를 새 상세를 받은 시각(`checkedAt`)에 건다 |
| P8-2 | Medium | `ReservationDetailContent.tsx:56,64-68` · `_components/QrLocked.tsx` | 버튼 · 환불 안내 기준 시각이 상세를 받을 때만 바뀐다 — 시작 1시간보다 일찍 열면 시작 시각에 다시 부르지 않아 QR 이 잠긴 채, 시작 뒤에도 취소 버튼이 남는다. 마감 전에 열고 마감 뒤 취소하면 창이 "전액 환불"이라고 말한다. 이용 끝에도 QR · 연장하기가 남는다 | 상세마다 경계 시각(환불 마감 · 시작 1시간 전 · 시작 · 끝)에 기준 시각을 새로 하거나 다시 부르는 타이머, 취소 창을 열 때 기준 시각 새로 |
| P8-3 | Low | `QrLocked.tsx` · `src/shared/components/Timer.tsx:41` | 시작 시각에 다시 부른 상세가 아직 확정(백엔드 반영 지연)이면 같은 시작 시각이라 타이머가 다시 걸리지 않아 QR 이 영영 안 열린다 | P8-2 타이머에서 시작 뒤에도 확정이면 몇 초 뒤 다시(횟수 제한) |
| P7-3 | Low | `BookingContent.tsx:130-134` | 예약 가능 시간 조회가 실패하면 "불러오고 있어요"가 계속, 다시 시도 길이 없다. 판매 상품이 없는 업체는 달력이 "0년 undefined월" | 실패 상태 + "다시 불러오기", 상품이 없으면 빈 안내 |
| P7-6 | Low | `BookingContent.tsx:199` | 로그인으로 보낼 때 `room_group_id` 를 빼 로그인 뒤 처음 그룹으로 돌아온다 | 돌아올 주소에 `?room_group_id=` 를 붙인다 |
| P8-4 | Low | `ReservationDetailContent.tsx:137-141` | 취소가 실패하면 팝업만 — spec 결과 표의 "→ 다시 불러온다"와 다르다(시작이 막 지나 400 이면 취소 버튼이 그대로) | 칸 옆 오류(`validation_errors`)가 아니면 창을 닫고 다시 불러온다 |
| P8-5 | Low | `ReservationDetailContent.tsx:68` | 결제 대기 예약의 취소 창이 "지금 취소하면 전액 환불"이라고 한다 — 결제 전이라 환불할 금액이 없다 | 결제 대기면 "결제 전이라 환불할 금액 없이 취소돼요" |
| P8-6 | Low | `ReservationDetailContent.tsx` 상태 띠 `Timer` · 결제위젯 `onExpired` | 결제 마감이 지나면 두 곳이 모두 다시 부르고, 만료된 결제 대기는 404 라 "예약을 찾을 수 없습니다."로 목록에 간다 | 마감이면 "결제 시간이 지나 예약이 만료됐어요." 안내 뒤 목록, 한 번만 |
| P8-7 | Low | `src/app/(user)/reservation/[reservation_id]/extension/ExtensionContent.tsx:89-94` | 연장 조회만 실패하면 상단 바만 남는다. 신청 실패 뒤 다시 조회가 실패하면 옛 연장 정보(금액)가 남는다 | 실패하면 연장 정보를 비우고 "다시 불러오기" |
| P8-8 | Low | `src/app/(user)/reservation/[reservation_id]/cancel-request/CancelRequestContent.tsx:118-122` | 승인 · 거절 요청 중에 남은 시간이 다 되면 "요청이 만료되었어요" 안내 · 이동이 끼어든다 | 요청 중이면 만료 처리를 건너뛴다 |
| P7-4 | 결정 필요 | `BookingContent.tsx:247`(`returnUrl={bookingPath}`) · `src/app/(user)/payments/_components/PaymentFailView.tsx` | 결제창에서 실패 · 취소하면 "다시 고르기"가 예약 화면으로 가는데, 예약 화면은 처음부터 다시 시작해 방금 만든 결제 대기 예약을 결제할 수 없다(그 호실은 5분 동안 목록에서 빠지고, 다른 호실을 고르면 결제 대기가 하나 더 생긴다). 예약 1건 화면(U7)은 결제 대기를 결제하기 · 취소할 수 있다 | U3 의 돌아갈 주소를 그 예약 1건(`/reservation/<id>/`)으로 바꾸고 실패 화면 버튼 · 문구를 맞춘다 — 사용자 결정("돌아갈 주소 = 이 예약 화면")을 바꾸는 것이라 확인 필요 |
| P7-5 | 참고 | `BookingContent.tsx:57,72-73` | 화면을 연 채 한국 자정을 넘기면 "오늘"이 그대로라 어제 날짜가 남는다 — 그 날짜의 시간대는 모두 지나 서버가 빈 목록 · 400 으로 막는다 | 이번에는 두고 알려진 제약으로 남김 |

## Verdict
Changes needed — Medium 4건(P7-1 · P7-2 · P8-1 · P8-2)과 함께 Low 를 고친 뒤 다시 리뷰(`-2`). P7-4 는 사용자 결정에 따라. Node 24 · React Compiler 수정은 지적 없음.
