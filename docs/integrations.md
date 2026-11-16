# 외부 연동 — 지도 · 주소 · 인증번호 · 파일 · 결제

여러 화면이 같이 쓰는 외부 연동 부품(Phase 4 — `.beaver/output/plan/infra/user-infra-plan.md`). 부품은 `shared` 에 있어 도메인 API 를 모른다 — 화면이 그 화면의 contracts 함수를 감싸 넘긴다(`shared` 는 `contracts` 를 import 하지 않는다). 미리보기 `/dev/infra`(개발 전용).

| 연동 | 부품 | 쓰는 화면 |
|---|---|---|
| 카카오 지도 | `src/shared/components/map/StoreMap.tsx` · `src/shared/hooks/useMyLocation.ts` · `src/shared/utils/kakao-map.ts` | U1 · U2 |
| 다음 우편번호 + 카카오 지오코더 | `src/shared/utils/address.ts` `searchAddressWithCoords` | U11 · A4 |
| 인증번호(SMS) | `src/shared/components/sms/SmsVerification.tsx` | U5 · M1 |
| 파일(S3 업로드 주소) | `src/shared/api/upload.ts` `uploadFile` · `src/shared/utils/file.ts` · `src/shared/components/upload/ImageUploader.tsx` | U11 · M5 · M7 |
| 토스 결제위젯 | `src/shared/components/payment/TossPaymentWidget.tsx` · `src/shared/api/payment.ts` · `src/app/api/payments/confirm/` | U3 · U4 · U7 · U9 |

## 지도 · 주소

- 카카오 SDK 는 `loadKakaoMap()` 하나로 붙인다 — `autoload=false&libraries=services`(지도 · 지오코더가 같은 스크립트). 키 `NEXT_PUBLIC_DAUM_MAP_API_KEY`, 카카오 디벨로퍼스에 사이트 도메인 등록.
- `StoreMap` — `center` · `markers`(`{id, latitude, longitude, title}`) · `level` · `onIdle(center)` · `onMarkerClick(id)`.
  - `idle` 은 처음 그릴 때 · `center` 로 옮겼을 때 · 사용자가 움직이고 멈췄을 때 온다 → 화면은 `onIdle` 에서만 조회한다. `onIdle` 값을 `center` 로 되돌려 넣지 않는다.
  - 높이는 감싼 요소의 CSS 변수 `--store-map-h`(기본 320px).
  - 한 업체 위치(U2)는 마커 하나 · `onIdle` 없이.
- `useMyLocation()` → `{location, isDefault, loading}` — 거부 · 지원 안 함 · 10초 동안 답 없음이면 서울시청(37.5665, 126.978) · `isDefault: true`(사용자 결정 2026-11-16). 브라우저 `timeout` 은 권한 창이 떠 있는 시간을 세지 않아 자체 10초 타이머로도 끊는다(늦게 온 위치는 버린다).
- `searchAddressWithCoords()` → `{zonecode, address, latitude, longitude}` — 다음 우편번호 팝업에서 고른 주소를 지오코더 첫 결과로. 고르지 않고 닫으면 `null`, 좌표를 못 찾으면 오류 팝업 후 `null`, 스크립트를 못 불러오면 `Error`(화면 catch 에서 `handleApiError`). 좌표는 숫자(DTO `@IsLatitude` · `@IsLongitude`).
  - 우편번호 팝업은 클릭 직후에 열어야 브라우저가 막지 않는다 — 주소 검색 버튼이 있는 화면은 처음 그릴 때 효과에서 `preloadAddressSearch()`, 카카오 SDK 는 팝업을 연 뒤 좌표를 구할 때 기다린다.
  - 스크립트(카카오 · 우편번호)를 못 불러오면 태그를 지워 다음 호출이 다시 붙인다.

## 인증번호

- `<SmsVerification onSend onConfirm confirmLabel? confirmPlacement? confirmSlot? notice?>{번호 위 칸}</SmsVerification>` — 번호 → "인증번호 받기 / 다시 받기" → 6자리 + 남은 시간(`Timer`) → 확인.
- 확인 버튼(보낸 뒤에만) 자리 `confirmPlacement` — `below`(안내 아래 · 기본) · `inline`(인증번호 칸 옆 — 아이디 찾기) · `slot`(화면의 아래 고정 영역 요소를 `confirmSlot` 으로 — `createPortal`, 휴대폰 인증). slot 영역은 화면이 `useState` + `ref` 로 넘기고 `:empty` 면 숨긴다(`src/app/(user)/phone-verification/PhoneVerificationContent.tsx`). `notice={false}` 면 아래 안내(5분 · 횟수)를 뺀다.
- 검증 · API · 실패 안내는 **화면 함수**가 한다: `onSend(phone)` 는 DTO `validateAction` → contracts(큐) → 결과, 못 보냈으면(검증 실패 · 오류 · 큐 `pending`) 안내를 띄우고 `null`. `onConfirm(sms_verification_id, code)` 는 결과로 다음 화면.
- 입력 칸은 `<Field name="phone">` · `<Field name="code">` — DTO 필드 이름과 같아 검증 오류가 칸 옆에 나온다.
- 번호를 고치면 받은 인증번호를 비우고, 남은 시간이 0 이면 확인을 막는다.

## 파일 올리기

api.md "파일 · 사진 올리기" 3단계를 `uploadFile` 하나로.

```ts
await uploadFile(file, {
    issue: (content_type) => issueStoreFileUploadUrl(auth, {content_type}), // 업로드 주소 발급(동기)
    register: (uploaded) => registerStoreFile(auth, uploaded),             // 등록(큐) — {file_key, file_name, content_type}
});
```

- 형식은 `imageContentType(file)` — MIME `image/jpeg` · `image/png`, MIME 이 비면 확장자. 아니면 `ApiError(400, 'JPG · PNG 사진만 올릴 수 있습니다.')`.
- PUT 은 `upload_url` 로 본문 = 파일, 헤더 `Content-Type` 만(토큰 없음). 2xx 가 아니면 `ApiError(그 상태, '사진을 올리지 못했습니다. …')`, 응답이 없으면 `NetworkError` — 어느 쪽이든 등록을 부르지 않는다.
- 화면은 catch 에서 `handleApiError`, 끝나면(성공 · `pending` · 실패) 목록을 다시 조회한다.
- `ImageUploader` — `images`(`{id, image_url, alt}`) 순서대로, 첫 장 "대표". `max` 장이면 올리기 칸을 숨긴다. `onReorder` 를 넘기면(사진 2장 이상 · `disabled` 아님) 손잡이로 끌기(@dnd-kit — 마우스 · 키보드), 놓으면 id 전부(순서 API 는 보낸 목록이 전부인 PUT). `images` 가 새 배열로 오면 보이는 순서를 그 순서로 맞춘다 — 화면은 순서 API 뒤(성공 · 실패 모두) 목록을 다시 조회하고(실패하면 저장된 순서로 돌아간다), `images` 는 데이터가 바뀔 때만 새 배열이 되게 둔다(React Compiler 가 매핑을 데이터 기준으로 기억한다). 삭제 확인 모달은 화면이 정한다.
- 사진은 `next/image` `unoptimized`(원격 CDN · S3 주소). 비공개 파일(사업자등록증)의 열람 주소는 10분짜리라 화면을 열 때마다 새로 받는다.

## 결제 — 토스 결제위젯

사용자 결정(2026-11-16): 결제위젯 · npm `@tosspayments/tosspayments-sdk` · 구매자 키 `ANONYMOUS`. 키는 "결제위젯 연동 키" — 클라이언트 `NEXT_PUBLIC_TOSS_CLIENT_KEY`(`gck`), 시크릿 `TOSS_SECRET_KEY`(`gsk`, `NEXT_PUBLIC_` 없음).

1. 예약 생성 · 연장 신청(큐) done → `{payment_id, order_name, amount, expires_at}` → `<TossPaymentWidget payment onExpired?>` — 결제 마감 남은 시간 · 결제수단 · 약관 · "결제하기". SDK 는 효과 안에서 `import()`(서버 렌더 밖). `payment` 가 바뀌면(새 결제 · 새 마감) 만료를 풀고, 금액이 바뀌면 위젯을 다시 그릴 때까지 "결제하기"를 막는다.
2. "결제하기" → 토스 결제창 → 성공 `<basePath>/payments/success/?paymentKey&orderId&amount` · 실패 `<basePath>/payments/fail/?code&message&orderId`. PC 결제창을 닫으면 `requestPayment` 가 `USER_CANCEL` 로 끝나 조용히, 모바일(같은 창)에서 취소하면 실패 주소로 `code=PAY_PROCESS_CANCELED` — 결과 화면(U4)도 이 코드는 오류로 보이지 않는다.
3. 성공 화면(U4)이 `requestTossConfirm({paymentKey, orderId, amount})` → route handler `POST /api/payments/confirm/` 가 시크릿 키로 토스 승인.
   - 같은 사이트 JSON · 이용자 refresh 쿠키 · 값 검사(`paymentKey` 영문 · 숫자 · `_` · `-` 200자까지 · `orderId` 32자 hex · `amount` 양의 정수) · 시크릿 키가 있을 때만 토스를 부른다. refresh 쿠키는 있는지만 본다 — 금액 · 주문 대조는 4 의 백엔드 몫.
   - `Idempotency-Key` = `paymentKey`, 이미 처리됨(`ALREADY_PROCESSED_PAYMENT`)은 성공 — 새로고침해도 된다. 같은 승인이 아직 처리 중(409 `IDEMPOTENT_REQUEST_PROCESSING`)이면 잠시 뒤 다시. 토스 호출은 30초 제한.
   - 결과 `{success}` / `{success: false, message, code?}` / 처리 중 · 토스 5xx · 응답 없음 · 시간 초과 `{success: false, message, retry: true}`.
4. `success` 면 화면이 백엔드 `POST /api/v1/user-service/reservation/payment-confirm`(큐, 이용자 토큰) — 백엔드가 토스에서 다시 읽어 금액 · 주문을 대조하고 확정한다(금액이 다르면 환불). 프론트 서버는 예약 금액을 모르므로 승인 금액은 성공 주소 `amount` 그대로.

- 결제 마감(`expires_at`, 5분)이 지나면 "결제하기"를 막고 `onExpired()`.
- 시크릿 키는 route handler(`src/app/api/payments/confirm/`)에서만 읽는다.
