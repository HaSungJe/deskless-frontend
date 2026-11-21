---
feature_goal: "지도 · 주소→좌표 · 인증번호 · 파일 올리기 · 토스 결제위젯 — 이용자 · 콘솔 화면 여러 곳이 같이 쓰는 공통 부품"
domain: "infra"
roadmap_phase: 4
api_method: "COMPONENT · HOOK · MODULE · ROUTE"
api_path: "StoreMap · useMyLocation · searchAddressWithCoords · SmsVerification · uploadFile · ImageUploader · TossPaymentWidget · POST /api/payments/confirm"
affected_data: ["S3 파일(발급받은 업로드 주소로 PUT)", "토스 결제 승인(POST /v1/payments/confirm — 시크릿 키)"]
---

## Feature Description
U1 · U2 · U3 · U5 · U7 · U9 · U11 · M1 · M5 · M7 · A4 화면이 같이 쓰는 공통 부품 다섯 가지 — 업체 지도 · 내 위치, 주소 검색 → 좌표, 인증번호 입력 흐름, 사진 올리기 · 순서 · 삭제, 토스 결제위젯 · 승인 중계.
화면(Phase 5 이후)은 이 부품에 그 화면의 API 함수만 넘긴다 — 부품은 도메인 API 를 모른다(`shared` 는 `contracts` 를 import 하지 않는다).
함께: 쓰는 곳이 없는 `KakaoMap.tsx` · `searchAddress` 를 새 부품으로 바꾸고, 결제위젯 · 끌기 패키지를 들인다.

## 진입점
- Method: COMPONENT · HOOK · MODULE(공통 함수) · ROUTE(route handler)
- Path:
  - **#9 지도**
    - `src/shared/utils/kakao-map.ts` — `loadKakaoMap()`: 카카오 지도 SDK(`autoload=false` · `libraries=services`)를 id 로 한 번만 붙이고 로드를 기다린다. `KakaoMap.tsx` 의 `loadKakaoMapScript` 를 옮겨 넓힌 것
    - `src/shared/components/map/StoreMap.tsx` — 여러 업체 마커 지도. props `center`(`{latitude, longitude}`) · `markers`(`{id, latitude, longitude, title}[]`) · `level` · `onIdle(center)` · `onMarkerClick(id)` — 높이는 감싼 요소의 CSS 변수 `--store-map-h`(기본 320px)
    - `src/shared/hooks/useMyLocation.ts` — 위치 권한 → 내 위치. 거부 · 지원 안 함 · 시간 초과면 기본 위치(서울시청)
  - **#10 주소 → 좌표**: `src/shared/utils/address.ts` — `searchAddressWithCoords()` → `{zonecode, address, latitude, longitude}` 또는 `null`
  - **#11 인증번호**: `src/shared/components/sms/SmsVerification.tsx` — props `onSend(phone)` · `onConfirm(sms_verification_id, code)` · `confirmLabel` · `children`(번호 위에 둘 칸 — 비밀번호 초기화의 아이디)
  - **#12 파일 올리기**
    - `src/shared/utils/file.ts` — `imageContentType(file)` → `'image/jpeg'` · `'image/png'` · `null`
    - `src/shared/api/upload.ts` — `uploadFile(file, {issue, register})`: 형식 확인 → 업로드 주소 발급(`issue`) → S3 로 PUT → 등록(`register`, 큐)
    - `src/shared/components/upload/ImageUploader.tsx` — 사진 목록(첫 장 "대표") · 순서 끌기(@dnd-kit) · 삭제 · "사진 올리기"(JPG · PNG, `max` 장까지)
  - **#13 토스 결제**
    - `src/shared/components/payment/TossPaymentWidget.tsx` — props `payment`(`{payment_id, order_name, amount, expires_at}`) · `onExpired`. 결제수단 · 약관 위젯 + 결제 마감 남은 시간 + "결제하기"
    - `POST /api/payments/confirm/` — `src/app/api/payments/confirm/route.ts` + `toss-confirm.ts`(토스 승인 호출 · 응답 정리 `toConfirmResult`)
    - `src/shared/api/payment.ts` — `requestTossConfirm({paymentKey, orderId, amount})`: 결과 화면(U4)이 위 route 를 부르는 함수
- Request
  - `onSend(phone: string) => Promise<{sms_verification_id, expires_at} | null>` · `onConfirm(sms_verification_id: string, code: string) => Promise<void>` — 화면이 DTO 를 만들어 `validateAction` · API · 실패 처리까지 한다
  - `uploadFile` 의 `issue(content_type) => Promise<{file_key, upload_url, expires_at}>` · `register({file_key, file_name, content_type}) => Promise<T | null>` — 화면이 그 도메인 contracts 함수로 감싸 넘긴다(입점 신청은 `store_file_purpose_id` 를 감싸 넣는다)
  - `POST /api/payments/confirm/` 본문 `{paymentKey, orderId, amount}` — 성공 주소 query 그대로(같은 사이트 JSON)
- Response
  - `searchAddressWithCoords` — 고르지 않고 닫으면 `null`, 좌표를 못 찾으면 오류 팝업 후 `null`
  - `uploadFile` — `register` 의 결과(큐 `pending` 이면 `null` → 화면이 목록을 다시 조회). 형식이 아니거나 S3 가 거절하면 `ApiError`(400 · 그 상태)를 던진다 — 화면은 catch 에서 `handleApiError`
  - `POST /api/payments/confirm/` — 200 + `{success: true}` / `{success: false, message, code?, retry?}`

## Business Rules
- **지도**
  - SDK 주소 `//dapi.kakao.com/v2/maps/sdk.js?appkey=<NEXT_PUBLIC_DAUM_MAP_API_KEY>&autoload=false&libraries=services` — 지도 · 지오코더가 같은 스크립트를 쓴다.
  - `StoreMap` 은 `center` 가 바뀌면 그쪽으로 옮기고, 사용자가 지도를 움직였다 멈추면(`idle`) `onIdle({latitude, longitude})`. `markers` 가 바뀌면 이전 마커를 지우고 다시 찍는다. 마커를 누르면 `onMarkerClick(id)`, 마커 `title` 은 업체 이름(마우스를 올리면 보임).
  - 한 업체 위치(U2)는 마커 하나 · `onIdle` 없이 쓴다 — 따로 컴포넌트를 두지 않는다.
  - `useMyLocation`: `navigator.geolocation.getCurrentPosition`(시간 초과 10초) → `{latitude, longitude}` · `isDefault: false`. 거부 · 지원 안 함 · 시간 초과 · 오류면 서울시청(위도 37.5665 · 경도 126.9780) · `isDefault: true`(사용자 결정). 확인 중에는 `loading: true`.
- **주소 → 좌표**
  - 다음 우편번호 팝업에서 주소를 고르면 → 카카오 지오코더 `addressSearch(고른 주소)` 첫 결과의 `y` · `x` 를 숫자로 → `latitude` · `longitude`(DTO 는 `number` — `@IsLatitude` · `@IsLongitude`).
  - 좌표를 못 찾으면 "주소의 위치를 찾지 못했습니다. 다른 주소로 검색해 주세요." 오류 팝업 후 `null`. 고르지 않고 닫으면 팝업 없이 `null`.
  - 쓰는 곳이 없는 `searchAddress` 는 지운다(`loadAddressSearchScript` 는 그대로).
- **인증번호**(시안: 이용자 `U5 휴대폰 인증`)
  - 번호 칸 + "인증번호 받기"(보낸 뒤 "다시 받기") → `onSend(phone)`. 결과가 있으면 "인증번호를 보냈어요. 5분 안에 입력해 주세요." + 6자리 칸 + 칸 오른쪽 남은 시간(`Timer`, `expires_at` 까지) + `confirmLabel`(기본 "인증하기") 버튼.
  - `onSend` 가 `null` 이면 보내지 않은 것(화면이 검증 · 오류 · 큐 `pending` 안내를 이미 띄움) — 상태를 바꾸지 않는다.
  - "다시 받기"는 새 `sms_verification_id` · `expires_at` 으로 바꾸고 인증번호 칸을 비운다. 번호를 고치면 받은 인증번호를 비운다(다시 받아야 함).
  - 남은 시간이 0 이 되면 확인 버튼을 막고 "인증번호가 만료되었습니다. 다시 받아 주세요."
  - 보내는 중 · 확인 중에는 두 버튼을 막는다(두 번 누름 방지). 입력 칸은 `<Field name="phone">` · `<Field name="code">` — 화면 DTO 검증 오류가 칸 옆에 나온다.
  - 화면 4곳: 이용자 휴대폰 인증 · 아이디 찾기, 매니저 아이디 찾기 · 비밀번호 초기화(`children` 으로 아이디 칸).
- **파일 올리기**(api.md "파일 · 사진 올리기")
  - 형식은 `imageContentType` — MIME 이 `image/jpeg` · `image/png` 면 그것, MIME 이 비어 있으면 확장자(`.jpg` · `.jpeg` · `.png`, 대소문자 무시), 그 밖은 `null` → "JPG · PNG 사진만 올릴 수 있습니다."(DTO 메시지와 같음) `ApiError(400)`. MIME 이 있으면 MIME 을 따른다(확장자만 바꾼 파일은 막힘).
  - 업로드 PUT 은 발급받은 `upload_url` 로 본문 = 파일, 헤더 `Content-Type` = 발급 때 보낸 값만(토큰 없음). 2xx 가 아니면 "사진을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요." `ApiError(그 상태)`, 응답이 없으면 `NetworkError` — 둘 다 `register` 를 부르지 않는다.
  - `register` 에는 `file_key` · `file_name`(파일 이름 그대로) · `content_type`.
  - `ImageUploader`: `images`(`{id, image_url, alt}[]`) 순서대로, 첫 장 "대표" 배지 · 나머지는 순번. 장수가 `max` 면 "사진 올리기" 칸을 숨긴다. 올리는 중에는 그 칸을 막고 "올리는 중…". 파일 고르기는 한 번에 한 장(`accept="image/jpeg,image/png"`).
  - 순서 끌기(사용자 결정 @dnd-kit): `onReorder` 를 넘긴 화면만 손잡이(⋮⋮)가 보인다. 놓으면 바뀐 순서의 id 전부로 `onReorder(ids)` — 화면이 순서 API(PUT, 보낸 목록이 전부)를 부르고 다시 조회. 마우스 · 키보드(손잡이에 초점 → 스페이스 · 방향키) 끌기.
  - 삭제는 `onDelete(id)` — 확인 모달은 화면이 정한다.
- **토스 결제**(사용자 결정 — 결제위젯 · npm `@tosspayments/tosspayments-sdk` · 구매자 키 `ANONYMOUS`)
  - `loadTossPayments(NEXT_PUBLIC_TOSS_CLIENT_KEY)` → `widgets({customerKey: ANONYMOUS})` → `setAmount({currency: 'KRW', value: amount})` → 결제수단(`variantKey: 'DEFAULT'`) · 약관(`'AGREEMENT'`) 그리기. 다 그려질 때까지 "결제하기"를 막는다. 사라질 때 그린 위젯을 지운다.
  - "결제하기" → `requestPayment({orderId: payment_id, orderName: order_name, successUrl: <origin><basePath>/payments/success/, failUrl: <origin><basePath>/payments/fail/})`. 사용자가 창을 닫으면(`USER_CANCEL`) 조용히, 그 밖의 오류는 오류 팝업.
  - 결제 마감: `expires_at` 까지 남은 시간을 보이고, 0 이 되면 "결제하기"를 막고 "결제 시간이 지났습니다. 다시 예약해 주세요." + `onExpired()`.
  - 클라이언트 키가 비어 있으면 위젯을 그리지 않고 "결제 설정이 없습니다." 안내.
  - 결제 대기 화면(U3 · U7 · U9) 시안은 "토스로 결제하기 → 결제창" 버튼뿐이라, 결제수단 · 약관 자리는 그 화면 Phase(7 · 8)에서 잡는다.
- **결제 승인 중계** `POST /api/payments/confirm/`(api.md "결제" 3단계)
  - 같은 사이트 JSON 요청만(`isSameSiteJson`), 이용자 refresh 쿠키(`user_refresh_token`)가 없으면 `{success: false, message: '로그인이 필요합니다.'}` — 둘 다 토스를 부르지 않는다.
  - 본문 검사: `paymentKey` 1~200자 · `orderId` 32자 소문자 hex(우리 `payment_id`) · `amount` 양의 정수. 아니면 `{success: false, message: '결제 정보가 올바르지 않습니다.'}`.
  - `TOSS_SECRET_KEY` 가 없으면 `{success: false, message: '결제 설정이 없습니다.'}` + 서버 로그.
  - 토스 `POST https://api.tosspayments.com/v1/payments/confirm` — `Authorization: Basic base64(<시크릿 키>:)` · `Idempotency-Key: <paymentKey>`(같은 결제를 다시 승인해도 같은 응답) · 본문 `{paymentKey, orderId, amount}`.
  - 금액은 성공 주소의 `amount` 를 그대로 쓴다 — 프론트 서버는 예약 금액을 모른다. 다르면 백엔드 결제 확인이 토스에서 다시 읽어 대조하고 환불한다(`deskless-backend` `reservation.service.ts:366` `verifyPaymentLookup` → MISMATCH 환불).
  - 응답 정리 `toConfirmResult(status, body)`: 200 · `ALREADY_PROCESSED_PAYMENT`(새로고침 · 다시 승인) → 성공 / 401 · 403(키 문제) → "결제를 승인하지 못했습니다." + 서버 로그 / 그 밖 4xx → 토스 `message` · `code` / 4xx 인데 본문을 못 읽음 → "결제를 승인하지 못했습니다." / 5xx · 응답 없음 → "결제 승인이 잠시 안 됩니다. 잠시 뒤 다시 시도해 주세요." + `retry: true`.
  - 성공 뒤 백엔드 `POST /api/v1/user-service/reservation/payment-confirm`(큐)은 화면(U4 — Phase 7)이 이용자 토큰으로 부른다.
- **설정**
  - `.env.example`: `NEXT_PUBLIC_TOSS_CLIENT_KEY`([빌드] 결제위젯 연동 클라이언트 키 `test_gck_…`) · `TOSS_SECRET_KEY`([실행] 결제위젯 연동 시크릿 키 `test_gsk_…` — route handler 에서만, `NEXT_PUBLIC_` 붙이지 않음).
  - 패키지(사용자 결정): `@tosspayments/tosspayments-sdk@2.10.0` · `@dnd-kit/core@6.3.1` · `@dnd-kit/sortable@10.0.0` · `@dnd-kit/utilities@3.2.2`.
  - 카카오 디벨로퍼스에 사이트 도메인(로컬 `http://localhost:5000`)이 등록돼 있어야 지도 · 지오코더가 뜬다(운영 설정 — 코드 밖).
- **지우는 것**: `src/shared/components/KakaoMap.tsx`(호출처 0 → `StoreMap` · `kakao-map.ts`), `address.ts` 의 `searchAddress`(호출처 0 → `searchAddressWithCoords`). 문서의 `KakaoMap.tsx` 근거는 새 파일로 바꾼다.

## TDD Cases
- [ABOUT:imageContentType] 고른 파일이 올릴 수 있는 사진(JPG · PNG)인지 보고 그 MIME 을 돌려준다 // MIME 이 있으면 MIME 이 image/jpeg · image/png 일 때만, MIME 이 비어 있으면 확장자 .jpg · .jpeg · .png(대소문자 무시)일 때만 통과
- [CASES:imageContentType] `{type: 'image/jpeg', name: 'a.jpg'}` → `'image/jpeg'` // MIME 이 허용 목록에 있음
- [CASES:imageContentType] `{type: 'image/png', name: 'a.png'}` → `'image/png'` // MIME 이 허용 목록에 있음
- [CASES:imageContentType] `{type: '', name: 'photo.JPG'}` → `'image/jpeg'` // MIME 이 비어 확장자로 판단 — 대소문자를 무시하면 jpg
- [CASES:imageContentType] `{type: '', name: 'photo.jpeg'}` → `'image/jpeg'` // MIME 이 비어 확장자로 판단 — jpeg 도 JPG
- [CASES:imageContentType] `{type: '', name: 'scan.png'}` → `'image/png'` // MIME 이 비어 확장자로 판단 — png
- [CASES:imageContentType] `{type: 'image/gif', name: 'a.gif'}` → `null` // GIF 는 허용 목록에 없음(백엔드 DTO 도 JPG · PNG 만)
- [CASES:imageContentType] `{type: 'image/heic', name: 'IMG_1.HEIC'}` → `null` // HEIC(아이폰 기본 사진)는 허용 목록에 없음
- [CASES:imageContentType] `{type: 'image/gif', name: 'fake.jpg'}` → `null` // MIME 이 있으면 MIME 이 먼저 — 확장자만 바꾼 파일을 막음
- [CASES:imageContentType] `{type: '', name: 'noext'}` → `null` // MIME 도 확장자도 없어 판단할 근거가 없음
- [ABOUT:toConfirmResult] 토스 결제 승인 응답(상태 코드 · 본문)을 화면에 줄 결과(성공 · 실패 · 잠시 뒤 다시)로 바꾼다 // 2xx · ALREADY_PROCESSED_PAYMENT 는 성공, IDEMPOTENT_REQUEST_PROCESSING · 5xx · 응답 없음은 잠시 뒤 다시, 그 밖 4xx 는 실패(401 · 403 · 본문 없음은 일반 문구)
- [CASES:toConfirmResult] `(200, {paymentKey: 'pk', status: 'DONE'})` → `{state: 'ok'}` // 2xx 는 승인 완료
- [CASES:toConfirmResult] `(400, {code: 'ALREADY_PROCESSED_PAYMENT', message: '이미 처리된 결제 입니다.'})` → `{state: 'ok'}` // 이미 승인된 결제 — 새로고침 · 다시 승인이라 성공으로 본다
- [CASES:toConfirmResult] `(400, {code: 'REJECT_CARD_COMPANY', message: '카드사에서 거절했습니다.'})` → `{state: 'fail', code: 'REJECT_CARD_COMPANY', message: '카드사에서 거절했습니다.'}` // 그 밖 4xx 는 다시 결제해야 하는 실패 — 토스 문구가 이용자에게 맞는 안내
- [CASES:toConfirmResult] `(404, {code: 'NOT_FOUND_PAYMENT_SESSION', message: '결제 시간이 만료되어 결제 진행 데이터가 존재하지 않습니다.'})` → `{state: 'fail', code: 'NOT_FOUND_PAYMENT_SESSION', message: '결제 시간이 만료되어 결제 진행 데이터가 존재하지 않습니다.'}` // 4xx 실패 — 결제 세션 만료도 토스 문구 그대로
- [CASES:toConfirmResult] `(401, {code: 'UNAUTHORIZED_KEY', message: '인증되지 않은 시크릿 키 혹은 클라이언트 키 입니다.'})` → `{state: 'fail', code: 'UNAUTHORIZED_KEY', message: '결제를 승인하지 못했습니다.'}` // 401 · 403 은 우리 키 문제 — 키 이야기를 이용자에게 보이지 않고 일반 문구
- [CASES:toConfirmResult] `(400, null)`(본문이 JSON 아님) → `{state: 'fail', message: '결제를 승인하지 못했습니다.'}` // 4xx 인데 본문을 못 읽어 보일 토스 문구가 없음
- [CASES:toConfirmResult] `(409, {code: 'IDEMPOTENT_REQUEST_PROCESSING', message: '이전 요청이 처리 중입니다.'})` → `{state: 'retry', message: '결제 승인이 잠시 안 됩니다. 잠시 뒤 다시 시도해 주세요.'}` // 같은 결제 승인이 아직 처리 중(두 탭 · 연달아 새로고침) — 끝난 뒤 다시 승인하면 같은 응답
- [CASES:toConfirmResult] `(500, {code: 'FAILED_INTERNAL_SYSTEM_PROCESSING', message: '내부 시스템 처리 작업이 실패했습니다.'})` → `{state: 'retry', message: '결제 승인이 잠시 안 됩니다. 잠시 뒤 다시 시도해 주세요.'}` // 5xx 는 토스 쪽 일시 장애 — 같은 결제를 다시 승인하면 된다
- [CASES:toConfirmResult] `(null, null)`(응답 없음) → `{state: 'retry', message: '결제 승인이 잠시 안 됩니다. 잠시 뒤 다시 시도해 주세요.'}` // 응답이 없어 승인됐는지 모름 — 다시 승인해도 멱등 키로 같은 응답
- [ABOUT:uploadFile] 사진 한 장을 형식 확인 → 업로드 주소 발급 → S3 PUT → 등록 순서로 올린다 // 앞 단계가 실패하면 다음 단계를 부르지 않고 ApiError 를 던진다
- [SUCCESS] uploadFile — `issue('image/png')` 1회 → PUT(`upload_url`, 파일, `Content-Type: image/png`) 1회 → `register({file_key, file_name, content_type})` 1회 순서 → 결과 = `register` 결과 // 세 단계가 모두 성공한 정상 흐름 — PUT 헤더는 발급 때 보낸 형식과 같아야 S3 가 받는다
- [FAIL:validation] uploadFile — GIF 파일 → `ApiError(400, 'JPG · PNG 사진만 올릴 수 있습니다.')`, `issue` · PUT · `register` 0회 // JPG · PNG 가 아니면 업로드 주소를 받기 전에 막음
- [FAIL:upload] uploadFile — PUT 이 403 → `ApiError(403, '사진을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.')`, `register` 0회 // S3 가 거절하면 올라간 파일이 없으니 등록하지 않음
- [FAIL:upload] uploadFile — 업로드 주소가 `null` → `ApiError(500, '사진을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.')`, PUT · `register` 0회 // 올릴 주소가 없음
- [FAIL:network] uploadFile — PUT 응답 없음(fetch 실패) → `NetworkError`, `register` 0회 // 올라갔는지 모르니 등록하지 않고 네트워크 안내
- [ABOUT:POST /api/payments/confirm/] 결제 성공 주소의 값(paymentKey · orderId · amount)으로 시크릿 키 토스 승인을 대신 부른다 // 같은 사이트 JSON · 이용자 로그인(refresh 쿠키) · 값 검사 · 시크릿 키가 모두 맞을 때만 토스를 부른다
- [SUCCESS] POST /api/payments/confirm/ — 토스 1회: 주소 · `Authorization: Basic base64(<키>:)` · `Idempotency-Key: <paymentKey>` · 본문 `{paymentKey, orderId, amount}` → `{success: true}` // 조건이 모두 맞는 정상 흐름 — 같은 결제는 Idempotency-Key 로 같은 응답
- [FAIL:validation] POST /api/payments/confirm/ — `orderId` 가 32자 hex 가 아님 · `amount` 0 · `paymentKey` 에 줄바꿈 등 다른 글자 → `{success: false, message: '결제 정보가 올바르지 않습니다.'}`, 토스 0회 // 우리 payment_id(32자 hex) · 양의 금액 · 헤더에 실을 수 있는 결제 키(영문 · 숫자 · _ · -)가 아니면 토스에 보낼 값이 아님
- [FAIL:login] POST /api/payments/confirm/ — 이용자 refresh 쿠키 없음 → `{success: false, message: '로그인이 필요합니다.'}`, 토스 0회 · 시크릿 키 없음 → `'결제 설정이 없습니다.'`, 토스 0회 // 로그인하지 않은 요청 · 키가 없는 서버는 승인을 부르지 않음
- [FAIL:csrf] POST /api/payments/confirm/ — `Content-Type: text/plain` · JSON 이지만 `Sec-Fetch-Site: cross-site` → `{success: false, message: '결제 정보가 올바르지 않습니다.'}`, 토스 0회 // 다른 사이트가 승인을 부르는 것 막기 — 같은 사이트 JSON 만
- [ABOUT:SmsVerification] 번호 → 인증번호 받기 → 6자리 + 남은 시간 → 확인 흐름을 그리고, 발송 · 확인은 화면 함수에 넘긴다 // 받은 인증이 있고 남은 시간이 남았을 때만 확인을 부른다
- [SUCCESS] SmsVerification — 번호 입력 · "인증번호 받기" → `onSend('01012345678')` 1회 → 인증번호 칸 · 남은 시간이 보임 → 6자리 · "인증하기" → `onConfirm(<받은 id>, '123456')` 1회 // 받은 인증이 있고 시간이 남아 확인 조건을 만족 — 번호 · 코드는 숫자만 넘김
- [SUCCESS] SmsVerification — 받은 뒤 번호를 고침 → 인증번호 칸이 사라지고 "인증번호 받기" // 받은 인증은 그 번호의 것 — 새 번호는 다시 받아야 함
- [SUCCESS] SmsVerification — 만료 뒤 "다시 받기" → 새 인증 · 인증번호 칸 비움 · 만료 풀림 → 새 id 로 확인 // 새 인증이라 남은 시간도 새로 — 확인은 마지막으로 받은 인증으로
- [FAIL:busy] SmsVerification — 보내는 중 → 번호 칸 · 받기 버튼 막힘, 끝나면 풀림 // 보내는 중에 번호가 바뀌면 다른 번호의 인증을 확인하게 됨
- [FAIL:not-sent] SmsVerification — `onSend` 가 `null` → 인증번호 칸이 보이지 않음 · `onConfirm` 0회 // 화면이 못 보냈다고 알림 — 받은 인증이 없음
- [FAIL:expired] SmsVerification — 남은 시간이 지남 → "인증하기" 막힘 · 만료 문구 · `onConfirm` 0회 // 남은 시간이 0 — 만료된 인증번호는 서버도 거절
- [ABOUT:useMyLocation] 위치 권한을 물어 내 위치를 주고, 못 읽으면 기본 위치(서울시청)를 준다 // 10초 안에 브라우저가 좌표를 주면 그 좌표, 거부 · 지원 안 함 · 10초 동안 답 없음이면 기본 위치
- [SUCCESS] useMyLocation — 위치를 받음 → 그 좌표 · `isDefault: false` // 브라우저가 좌표를 줌
- [FAIL:denied] useMyLocation — 거부 · `navigator.geolocation` 없음 → 서울시청(37.5665, 126.9780) · `isDefault: true` // 좌표를 못 받음 — 지도는 기본 위치에서 시작
- [FAIL:timeout] useMyLocation — 권한 창에 답이 없어 콜백이 오지 않음 · 10초 → 서울시청 · `isDefault: true` // 브라우저 제한 시간은 권한 창이 떠 있는 시간을 세지 않음 — 자체 10초로 끊음
- [ABOUT:ImageUploader] 사진 목록(첫 장 대표 · 순번 · 삭제 · 순서 끌기)과 올리기 칸을 그리고, 고른 파일 · 삭제 · 순서는 화면 함수에 넘긴다 // 장수가 max 보다 적을 때만 올리기 칸, onReorder 를 줬을 때만 손잡이
- [SUCCESS] ImageUploader — 사진 2장 · 파일 고르기 · 삭제 → 첫 장 "대표", `onUpload(file)` 1회 · `onDelete(id)` 1회 // 첫 장이 대표(백엔드도 첫 사진이 대표) — 고른 파일 · 누른 삭제를 그대로 넘김
- [SUCCESS] ImageUploader — `onReorder` 없음 → 손잡이 없음 // 순서 API 가 없는 화면(입점 신청)은 끌기를 보이지 않음
- [FAIL:max] ImageUploader — 장수가 `max` → "사진 올리기" 칸 없음 // 최대 장수(5장)를 넘으면 서버가 400 — 올리기를 미리 숨김
- 테스트 생략(위임형): `StoreMap` · `loadKakaoMap` · `searchAddressWithCoords`(카카오 · 다음 SDK 를 부르기만 — jsdom 에 SDK 없음, 좌표 변환은 사용자 결정으로 TDD 생략) · `TossPaymentWidget`(토스 SDK 를 그리기만) · `ImageUploader` 의 끌기(@dnd-kit 이 보장) · `.env.example` · 문서

## Notes
- 쓰는 화면: 지도 U1 · U2 / 주소 → 좌표 U11 · A4 / 인증번호 U5 · M1 / 파일 U11 · M5 · M7 / 결제 U3 · U4 · U7 · U9 (frontend/screens.md).
- 시안: 사진 목록 `frontend/design/manager.html:157-161,1055-1060`(`.thumbs` · `.thumb` · `.upload` — 손잡이 · "대표" · 순번 · 삭제 · "사진 올리기 / JPG · PNG, 5장까지"), 인증번호 `frontend/design/user.html:935-954`(번호 + "다시 받기", 칸 안 오른쪽 남은 시간 `04:12`, 안내 문구).
- 재사용: `Timer`(`src/shared/components/Timer.tsx:16` — `time` 이 바뀌면 다시 셈 · 다 되면 `closeFunc` 한 번), `Field` · `Input` · `Button` · `Badge`(ui), `sendRequest` · `ApiError` · `NetworkError`(`src/shared/api/request.ts`), `isSameSiteJson` · `json`(`src/app/api/cookie/token-cookie.ts:66,176` — 두 route 가 쓰게 되어 `src/app/api/route-util.ts` 로 옮긴다), `showErrorPopup`.
- 외부 스크립트 규칙(`AGENTS.md` Key Patterns — id 로 한 번 · Promise)은 카카오 · 다음에 그대로. 토스는 npm 패키지(`loadTossPayments` 가 스스로 스크립트를 붙인다).
- 결제위젯 키는 "API 개별 연동 키"(`ck`)와 다르다 — 토스 개발자센터의 "결제위젯 연동 키"(`gck` · `gsk`). 결제수단 · 약관 UI 의 variantKey 는 토스 어드민 위젯 설정 기본값(`DEFAULT` · `AGREEMENT`).
- `.beaver/config.json` 의 `stack` 에 남은 `axios` 를 `fetch` 로 고친다(Phase 2 에서 걷어냄).

## Proposals (Codebase-Based)
- [x] `KakaoMap.tsx`(호출처 0)를 지우고 `StoreMap` 하나로 — 한 업체 위치(U2)도 마커 하나로 쓴다 (`src/shared/components/KakaoMap.tsx:54`)
- [x] `searchAddress`(호출처 0)를 `searchAddressWithCoords` 로 바꾼다 (`src/shared/utils/address.ts:47`)
- [x] `isSameSiteJson` · `json` 을 두 route(쿠키 · 결제)가 같이 쓰도록 `src/app/api/route-util.ts` 로 (`src/app/api/cookie/token-cookie.ts:66,176`)
- [x] 인증번호 남은 시간 · 결제 마감 남은 시간은 `Timer` 를 그대로 쓴다 (`src/shared/components/Timer.tsx:16`)

## Decisions
- [x] 토스 연동 방식 — 결제위젯(사용자 결정, 시안의 "결제창" 버튼과 다름 → 결제 화면 Phase 에서 자리 잡기)
- [x] 토스 SDK — npm `@tosspayments/tosspayments-sdk`(사용자 결정)
- [x] 위젯 구매자 키 — `ANONYMOUS`(사용자 결정 — 이용자 식별값을 토스에 넘기지 않음)
- [x] 사진 순서 끌기 — `@dnd-kit/core` · `sortable` · `utilities`(사용자 결정)
- [x] 위치를 못 읽을 때 — 서울시청 37.5665 · 126.9780(사용자 결정)
- [x] TDD — `toConfirmResult` · `imageContentType` 만듦, `toCoords` 생략(사용자 결정)
- [x] 인증번호 부품 — 발송 · 확인 함수를 props 로 받는 한 컴포넌트(로드맵 #11)
- [x] 승인 금액 — 성공 주소의 `amount`, 대조 · 환불은 백엔드 결제 확인(백엔드 코드 근거)
