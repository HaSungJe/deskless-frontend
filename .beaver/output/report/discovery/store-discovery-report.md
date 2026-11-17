# Report — 업체 둘러보기 (Phase 6)

## Feature Summary
- **Feature**: 이용자 업체 둘러보기 — U1 지도 · 반경 · 주변 업체 목록, U2 업체 상세(사진 · 영업시간 · 판매 상품 · 규정 · 객실 그룹)
- **Entry point**: `PAGE · MODULE / (HomeContent) · /stores/[store_id] (StoreDetailContent) · GET discovery/store · GET discovery/store/:store_id · GET discovery/store/:store_id/room-group`
- **Domain**: discovery
- **Plan**: `.beaver/output/plan/discovery/store-discovery-plan.md` · roadmap Phase 6 (#19 · #20) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `package.json` · `package-lock.json` | modified | `swiper` ^14.4.0 (`npm install swiper@14.4.0`) |
| `src/contracts/discovery/dto/` 3개 | created | `discovery-store-list` · `discovery-store-detail` · `discovery-room-group-list` — 지침서 사본(`copy-dto.js`) |
| `src/contracts/discovery/api.ts` | created | `getNearbyStores` · `getStoreDetail` · `getStoreRoomGroups`(공개 `request` · `signal`) |
| `src/shared/types/map.ts` | modified | `MapMarkerType.label` · `muted` |
| `src/shared/components/map/StoreMap.tsx` | modified | 시안 핀(`CustomOverlay` — 기본 마커 · `KakaoMarkerType` 삭제) · 반경 원 + `setBounds`(`radiusKm`) · 내 위치 점 + "내 위치로 이동"(`myLocation`) · `locked` |
| `src/shared/css/map/StoreMap.module.css` | modified | `.wrap` · 핀 · 이름표 · 회색 · 내 위치 점 · 버튼 · `--store-map-radius` |
| `src/shared/utils/format.ts` | modified | `formatDays` — 3일 이상 이어지면 범위(주를 넘어도) |
| `src/app/(user)/HomeContent.tsx` | rewritten | U1 지도 · 반경 `Chip` · 300곳 `Band` · 빈 목록 `EmptyState` · 카드(머리는 그대로, 자리 표시 삭제) |
| `src/app/(user)/distance.ts` | created | `formatDistance` |
| `src/app/(user)/stores/[store_id]/page.tsx` · `StoreDetailContent.tsx` · `store-detail-format.ts` · `_components/StoreImageSlider.tsx` | created | U2 · 안내 문장 계산 함수 6개 · swiper 사진 |
| `src/app/css/user/HomeContent.module.css` | rewritten | 지도 자리 · 반경 · 카드(`.placeholder` 삭제) |
| `src/app/css/user/StoreDetailContent.module.css` · `StoreImageSlider.module.css` | created | |
| `AGENTS.md` · `docs/data-layer.md` · `docs/integrations.md` | modified | `formatDays` 범위 · `StoreMap` 새 속성 · U1 조회 흐름 |

plan 과 다른 점: 없음(`checkInDays` 를 같은 동작으로 짧게 쓰고 plan 을 맞춤). ship 리뷰(`main-review-261117.md`)에서 고친 것은 리뷰 문서 #1 ~ #10. swiper 는 `ssr-window` 패키지가 아니라 `typeof window` 확인(`node_modules/swiper/shared/swiper-core.mjs:5`)으로 서버 렌더에서 안전 — spec · plan 근거 문구를 고침.

## Tests Written
- TDD — `src/test/shared/utils/format.test.ts`(`formatDays` 10) · `src/test/app/(user)/distance.test.ts`(9) · `src/test/app/(user)/stores/[store_id]/store-detail-format.test.ts`(`formatHourRange` 5 · `describePlan` 6 · `describeBookingPolicy` 5 · `planPriceLabel` 3 · `formatPeriodPrice` 5 · `amenityLabels` 3)
- 화면 — `src/test/app/(user)/HomeContent.test.tsx`(조회 · 핀 · 핀 누름 · 반경 바꿈 · 같은 조회 거름 · 300곳 · 빈 목록 — `StoreMap` · `useMyLocation` · contracts mock) · `src/test/app/(user)/stores/[store_id]/StoreDetailContent.test.tsx`(두 API · 구성 · 404 · 영업 안 함)
- 테스트 생략(위임형): contracts `discovery/api.ts` · DTO 사본 · `page.tsx` · `StoreMap` 의 카카오 SDK 호출 · `StoreImageSlider` — plan 그대로
- build 는 테스트를 실행하지 않는다 — 실행은 `/beaver:test`(또는 `npx vitest run`).

## Verification
- `npx next typegen && npx tsc --noEmit` — 오류 0.
- 계층 방향: `shared` → `contracts` · `app` import 없음, `contracts` → `app` 없음(grep).
- 지운 것: 기본 카카오 마커(`new window.kakao.maps.Marker` · `KakaoMarkerType`), U1 자리 표시 · `.placeholder` — 남은 곳 없음.
- 이전 쓰임: `/dev/infra` 미리보기는 `StoreMap` 에 `title` 만 넘겨 그대로 그려진다(핀 모양만 바뀜).
- spec 대조: Business Rules(U1 조회 흐름 · 지도 · U2 · `formatDays` · swiper) — 빠진 것 없음. 결정(시안대로 지도 · 20km · 범위 요일 · swiper · TDD 범위 · 이름 전체 말줄임 · 영업 안 함이면 예약 막음) 반영.
- 구조 규칙: 새 화면 · 부품 — 변수 > 상태 > 계산 값 > 효과 > 함수 > JSX, 주석(읽어서 확인). `StoreDetailContent` 는 효과 본문에서 바로 `setState` 하지 않고 Promise 뒤(형제 `UserMeProvider`).

## Remaining Issues
- 테스트 미실행 — `/beaver:test`. 처음 도는 것: 대괄호 폴더(`stores/[store_id]`) 테스트, `StoreMap` mock 으로 `onIdle` 을 직접 부르는 화면 테스트.
- `npm run lint` 는 사용자 실행.
- 화면 확인(사용자): 백엔드 · 카카오 지도 키(`NEXT_PUBLIC_DAUM_MAP_API_KEY`)가 있어야 `/` 지도 · 핀 · 반경 원이 보인다. 카카오 `CustomOverlay` · `Circle` · `setBounds` 는 테스트가 mock 이라 화면에서만 확인된다.
- "예약하기" · 객실 그룹 카드의 U3(`/stores/<id>/booking/`)는 Phase 7 — 그 전엔 404.
- 업체 사진 높이는 시안 그대로 140px — 화면에서 보고 바꿀 수 있다.
