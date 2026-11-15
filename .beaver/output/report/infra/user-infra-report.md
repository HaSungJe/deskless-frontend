# Report — 이용자 공통 인프라 (Phase 4)

## Feature Summary
- **Feature**: 지도 · 주소→좌표 · 인증번호 · 파일 올리기 · 토스 결제위젯 — 이용자 · 콘솔 화면 여러 곳이 같이 쓰는 공통 부품
- **Entry point**: `COMPONENT · HOOK · MODULE · ROUTE StoreMap · useMyLocation · searchAddressWithCoords · SmsVerification · uploadFile · ImageUploader · TossPaymentWidget · requestTossConfirm · POST /api/payments/confirm`
- **Domain**: infra
- **Plan**: `.beaver/output/plan/infra/user-infra-plan.md` · roadmap Phase 4 (#9 ~ #13) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `package.json` · `package-lock.json` | modified | `@tosspayments/tosspayments-sdk@^2.10.0` · `@dnd-kit/core@^6.3.1` · `@dnd-kit/sortable@^10.0.0` · `@dnd-kit/utilities@^3.2.2` (`npm install` — 사용자 결정) |
| `src/shared/types/map.ts` | created | `MapPointType` · `MapMarkerType` |
| `src/shared/utils/kakao-map.ts` | created | `loadKakaoMap` — `autoload=false&libraries=services`, `window.kakao` 전역 선언(옮김) |
| `src/shared/components/map/StoreMap.tsx` · `src/shared/css/map/StoreMap.module.css` | created | 여러 마커 · `onIdle` · `onMarkerClick` · `center` · `level`, 높이 `--store-map-h` |
| `src/shared/hooks/useMyLocation.ts` | created | `{location, isDefault, loading}` — 못 읽으면 서울시청 |
| `src/shared/components/KakaoMap.tsx` | deleted | 호출처 0 → `StoreMap` · `kakao-map.ts` |
| `src/shared/utils/address.ts` | modified | `searchAddressWithCoords` · `AddressWithCoordsType` · `ADDRESS_COORDS_NOT_FOUND_MESSAGE`, `searchAddress` 삭제(호출처 0) |
| `src/shared/components/sms/SmsVerification.tsx` · `src/shared/css/sms/SmsVerification.module.css` | created | 번호 → 받기 / 다시 받기 → 6자리 + `Timer` → 확인, `SMS_SENT_MESSAGE` · `SMS_EXPIRED_MESSAGE` |
| `src/shared/utils/file.ts` | created | `ImageMimeType` · `imageContentType` |
| `src/shared/api/upload.ts` | created | `uploadFile` · `UploadUrlType` · `UploadedFileType` · `UploadStepsType` · 문구 2개 |
| `src/shared/components/upload/ImageUploader.tsx` · `src/shared/css/upload/ImageUploader.module.css` | created | 대표 · 순번 · @dnd-kit 손잡이 끌기(마우스 · 키보드) · 삭제 · 올리기 칸(`max`) |
| `src/shared/components/payment/TossPaymentWidget.tsx` · `src/shared/css/payment/TossPaymentWidget.module.css` | created | 결제위젯(`ANONYMOUS`) · 결제 마감 `Timer` · "결제하기" · 효과마다 새 자리에 그리고 지움 |
| `src/shared/api/payment.ts` | created | `requestTossConfirm` |
| `src/app/api/route-util.ts` | created | `json` · `isSameSiteJson` · `RouteBodyType`(token-cookie 에서 옮김 + `message` · `code`) |
| `src/app/api/cookie/token-cookie.ts` · `[area]/route.ts` · `[area]/refresh/route.ts` | modified | `json` · `isSameSiteJson` 을 `route-util` 에서 가져옴(동작 그대로) |
| `src/app/api/payments/confirm/toss-confirm.ts` | created | `toConfirmResult` · `isConfirmRequest` · `confirmTossPayment` · 문구 · `TOSS_CONFIRM_URL` |
| `src/app/api/payments/confirm/route.ts` | created | `POST` — 같은 사이트 JSON · 이용자 refresh 쿠키 · 값 검사 · 시크릿 키 → 토스 승인 |
| `src/app/dev/infra/page.tsx` · `InfraPreviewContent.tsx` · `src/app/css/dev/InfraPreviewContent.module.css` | created | 개발 전용 미리보기(운영 404) — 지도 · 주소 · 인증번호(123456) · 사진 · 결제위젯 |
| `.env.example` | modified | `NEXT_PUBLIC_TOSS_CLIENT_KEY` · `TOSS_SECRET_KEY` |
| `.beaver/config.json` | modified | `stack` — `axios` → `fetch`, `tosspayments-sdk@2` · `dnd-kit` |
| `docs/integrations.md` · AGENTS.md "## 외부 연동" · Checklist | created(초안) | plan 단계에서 씀 — 코드와 맞음(초안 표시 유지, ship 이 확정) |
| `AGENTS.md` · `docs/architecture.md` · `docs/conventions.md` · `docs/error-handling.md` · `docs/data-layer.md` | modified | `KakaoMap.tsx` 근거 → `StoreMap` · `kakao-map.ts`, `json` 근거 → `route-util.ts`, 줄 번호(`address.ts` · `token-cookie.ts` · `[area]/route.ts`), 폴더 트리 · 공통 부품 · 인라인 style(dnd `transform`) · CSS 변수 크기 |

plan 과 다른 점(작은 것):
- `TossPaymentWidget` 의 위젯 타입은 plan 의 `ReturnType<…>` 유도 대신 SDK 가 내보내는 `TossPaymentsWidgets` 를 `import type` 으로(설치 뒤 `types/index.d.ts:2875` 확인 — 런타임에 들어가지 않음).
- `ImageUploader` 손잡이의 `aria-label` 을 `{...attributes}` 뒤에 둬 @dnd-kit 속성이 덮지 않게.
- `toss-confirm.ts` 의 `.catch` 콜백에 반환 타입 `null`(`noImplicitAny`).

## Tests Written
- `src/test/shared/utils/file.test.ts` — TDD `imageContentType` 9 케이스(5 `it`)
- `src/test/app/api/payments/confirm/toss-confirm.test.ts` — TDD `toConfirmResult` 8 케이스(6 `it`) + route 6(`[SUCCESS]` 토스 주소 · Basic · Idempotency-Key · 본문 / 4xx · 5xx / 값 검사 / 로그인 / 시크릿 키 / JSON 아님)
- `src/test/shared/api/upload.test.ts` — 3(순서 · 인자 · 결과 / 형식 → 0회 / S3 403 → 등록 0회)
- `src/test/shared/components/sms/SmsVerification.test.tsx` — 4(받기 · 남은 시간 · 확인 / `null` / 만료 / 번호 고치면 비움) — 가짜 타이머
- `src/test/shared/hooks/useMyLocation.test.ts` — 3(위치 · 시간 초과 옵션 / 거부 / 없음)
- `src/test/shared/components/upload/ImageUploader.test.tsx` — 3(대표 · 순번 · 올리기 · 삭제 / `max` / 손잡이 없음)
- 테스트 생략(위임형): `StoreMap` · `loadKakaoMap` · `searchAddressWithCoords` · `TossPaymentWidget` · `requestTossConfirm` · 끌기 · `route-util` 옮김 · `/dev/infra` — plan 그대로
- build 는 테스트를 실행하지 않는다 — 실행은 `/beaver:test`(또는 `npx vitest run`).

## Verification
- `npx next typegen && npx tsc --noEmit` — 오류 0(처음 실행에서 `toss-confirm.ts` `.catch` 반환 타입 · 테스트 mock 타입 3곳을 고침).
- 계층 방향: `shared` 의 새 파일은 `contracts` · `app` 을 import 하지 않음, `app/api/payments` 는 `app/api/cookie` · `route-util` 만. 토스 SDK 는 `TossPaymentWidget` 효과 안 `import()` 와 `import type` 만.
- 지운 것: `KakaoMap` · `searchAddress` · token-cookie 의 `json` · `isSameSiteJson` 정의 — `src` 에 남은 참조 없음(grep), 문서 근거도 바꿈(스크립트로 줄 번호 대조).
- 시크릿: `TOSS_SECRET_KEY` 는 `src/app/api/payments/confirm/route.ts` 에서만 읽는다(grep).
- 구조 규칙: 새 컴포넌트 · 훅(`StoreMap` · `useMyLocation` · `SmsVerification` · `ImageUploader`(+`SortableThumb`) · `TossPaymentWidget` · `InfraPreviewContent`) — 변수 > 상태 > 계산 값 > 효과 > 함수 > JSX, 영역 주석 · 오른쪽 주석 · JSX 주석(읽어서 확인). 효과 안 콜백은 `useEffectEvent`, 효과 본문에서 바로 `setState` 하지 않음(Promise 뒤 · 렌더 중 맞추기).
- spec 대조: Business Rules 의 지도 · 주소 · 인증번호 · 파일 · 결제 · 승인 중계 · 설정 · 지우는 것 — 빠진 것 없음.

## Remaining Issues
- 테스트 미실행 — `/beaver:test`. 처음 도는 것: `next/image`(`unoptimized`) · @dnd-kit 을 jsdom 에서 그리는 `ImageUploader`, 가짜 타이머 + `Timer`(0.3초 · `dayjs()`)의 `SmsVerification`.
- `npm run lint` 는 사용자 실행 — 새 효과(`StoreMap` 의 `mapVersion` 의존성 등)에서 경고가 나오면 알려 주세요.
- 화면 확인(사용자): `.env.local` 에 `NEXT_PUBLIC_DAUM_MAP_API_KEY`(카카오 디벨로퍼스에 `http://localhost:5000` 등록) · `NEXT_PUBLIC_TOSS_CLIENT_KEY`(`test_gck_…`) · `TOSS_SECRET_KEY`(`test_gsk_…`) 를 넣고 `npm run dev` → `/dev/infra/`. 결제위젯의 "결제하기"는 토스 테스트 결제창까지 — 돌아오는 `/payments/success/` 화면은 Phase 7.
- 결제위젯 자리(결제수단 · 약관)는 시안에 없다 — U3 · U7 · U9 화면(Phase 7 · 8)에서 잡는다.
- `npm install` 이 알린 취약점 경고(`npm audit`)는 이번 변경과 별개 — 필요하면 따로 본다.
- 백엔드 재발급 IP 검사 완화 요청(2026-11-16)은 그대로 대기 — 결제 승인 route 는 이용자 refresh 쿠키가 있는지만 본다.
- ship 때 spec · plan 의 TDD 줄을 beaver 0.41.0 형식(유닛 `[ABOUT]` 설명 · 케이스 `// 이유`)으로 보완 — 이미 쓴 테스트 3건(JSON 아닌 승인 요청 · 번호 고치면 비움 · 손잡이 없음)을 spec 에도 적어 33건.

## Modification - 261116-1

ship 리뷰(`.beaver/output/review/main-review-261116-2.md`) 지적을 사용자 결정("전부 고친 뒤 ship")으로 고쳤다.

### Changes
| 파일 | 구분 | 내용 |
|---|---|---|
| `src/shared/hooks/useMyLocation.ts` | modified | 자체 10초 타이머 — 권한 창에 답이 없어도 기본 위치로 끝냄(브라우저 `timeout` 은 권한 창 시간을 세지 않음), `LOCATION_TIMEOUT_MS` export |
| `src/shared/utils/address.ts` | modified | 팝업을 먼저 열고 카카오는 좌표 구할 때 기다림(첫 클릭 팝업 차단 방지), `preloadAddressSearch()` 추가, 우편번호 스크립트 실패 시 태그 삭제 |
| `src/shared/utils/kakao-map.ts` | modified | 스크립트 실패 시 태그 삭제 — 다음 호출이 다시 붙임 |
| `src/app/api/payments/confirm/toss-confirm.ts` | modified | 409 `IDEMPOTENT_REQUEST_PROCESSING` → retry, `paymentKey` 를 `^[A-Za-z0-9_-]{1,200}$` 로 검사, 토스 호출 30초 제한(`AbortSignal.timeout`) |
| `src/shared/components/sms/SmsVerification.tsx` | modified | 보내는 중 번호 칸 막기(다른 번호의 인증이 섞이지 않게) |
| `src/shared/components/payment/TossPaymentWidget.tsx` | modified | `payment` 가 바뀌면 렌더 중에 만료 풀기(새 결제 · 새 마감) · 준비 상태 끄기(금액 바뀜) |
| `src/shared/components/map/StoreMap.tsx` | modified | 사라질 때 `idle` 듣기 끊기 · 지도 DOM 비우기 |
| `src/app/dev/infra/InfraPreviewContent.tsx` | modified | `preloadAddressSearch()` 효과, 사진 삭제 때 blob 주소 풀기 |
| `docs/integrations.md` · AGENTS.md | modified | 위 동작 · 실패 주소 `<basePath>` · 모바일 취소 `PAY_PROCESS_CANCELED` · 순서 API 뒤 다시 조회 — 초안 표시를 지워 확정. 근거 줄 번호(`kakao-map.ts:15` · `address.ts:35`) |
| spec · plan | modified | TDD 줄(0.41.0 형식)에 새 케이스, spec 의 지난 `height` 속성 → `--store-map-h` |

고치지 않은 것: `ImageUploader` 순서 맞추기를 "id 순서 비교"로 바꾸자는 제안 — 순서 저장이 실패해 다시 조회해도 id 순서가 같아 저장 안 된 순서가 남는다. 배열이 바뀔 때 맞추는 지금 방식을 두고, 화면 규칙(순서 API 뒤 다시 조회 · `images` 는 데이터가 바뀔 때만 새 배열)을 docs/integrations.md 에 적었다.

### Tests
- `toss-confirm.test.ts` — 409 retry, `paymentKey` 줄바꿈 거절, `Sec-Fetch-Site: cross-site` 거절, 4xx · 5xx 토스 2회 호출 확인
- `upload.test.ts` — 업로드 주소 `null` → ApiError(500) · PUT 0회, PUT 응답 없음 → `NetworkError` · 등록 0회
- `SmsVerification.test.tsx` — 만료 뒤 "다시 받기"(새 id · 칸 비움 · 만료 풀림), 보내는 중 번호 칸 · 받기 막힘, 만료 테스트 시간 302초(Timer 가 초를 버림)
- `useMyLocation.test.ts` — 콜백이 오지 않으면 10초 뒤 기본 위치(가짜 타이머)

### Verification
- `npx vitest run` — 20파일 121건 통과. `npx next typegen && npx tsc --noEmit` — 오류 0.
