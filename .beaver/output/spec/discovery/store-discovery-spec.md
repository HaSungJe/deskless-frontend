---
feature_goal: "이용자 업체 둘러보기 — U1 지도 · 반경 · 주변 업체 목록, U2 업체 상세(사진 · 영업시간 · 판매 상품 · 규정 · 객실 그룹)"
domain: "discovery"
roadmap_phase: 6
api_method: "PAGE · MODULE"
api_path: "/ (HomeContent) · /stores/[store_id] (StoreDetailContent) · GET discovery/store · GET discovery/store/:store_id · GET discovery/store/:store_id/room-group"
affected_data: []
---

## Feature Description
이용자 첫 화면(U1)에 지도 · 반경(5 · 10 · 20 · 50km) · 주변 업체 목록을 붙이고, 카드 · 마커를 누르면 업체 상세(U2 — 사진 · 영업시간 · 판매 상품 · 예약 · 환불 규정 · 객실 그룹)를 보여 준다.
지도는 시안대로(이름표 마커 · 영업 안 함 회색 · 반경 원 · 내 위치 점 · 내 위치로 버튼) — Phase 4 공통 `StoreMap` 에 기능을 더한다(사용자 결정).
조회만 하는 공개 API 3개 — 로그인 없이 보이고, 예약(U3)은 Phase 7.

## 진입점
- Method: PAGE(화면) · MODULE(contracts · 계산 함수 · 공통 부품)
- Path:
  - **#19 U1 지도 · 주변 업체** — `src/app/(user)/HomeContent.tsx`(지금 머리만 있는 자리)
    - 내 위치(`useMyLocation` — 못 읽으면 서울시청) → `StoreMap`(중심 · 반경 원 · 업체 마커 · 내 위치) → 지도가 멈추면(`onIdle`) 그 중심 + 반경으로 `getNearbyStores`
    - 반경 고르기 5 · 10 · 20 · 50km(처음 20km — 사용자 결정) → 같은 중심으로 다시 조회 · 지도는 그 반경 원이 보이게 맞춤
    - 목록 카드(대표 사진 · 이름 · 영업중 / 지금 영업 안 함 · 24시간 · 거리 · 주소 · 시간 이용 · 1박 최저가) · 300곳 넘음 안내 · 빈 목록 안내
    - 카드 · 마커 → `/stores/<store_id>/`
  - **#20 U2 업체 상세 + 객실 그룹** — `src/app/(user)/stores/[store_id]/page.tsx` → `StoreDetailContent`
    - `getStoreDetail` · `getStoreRoomGroups` 를 함께 → 사진 넘기기(swiper — 사용자 결정) · 이름 · 영업중 · 주소 · 전화 · 소개 · 위치 지도 · 영업시간(오늘 강조) · 브레이크 · 판매 상품 · 예약 · 환불 규정 · 객실 그룹 카드 · 아래 "예약하기"
    - 객실 그룹 카드 → `/stores/<store_id>/booking/?room_group_id=<id>`, "예약하기" → `/stores/<store_id>/booking/`(U3 — Phase 7). 지금 영업 안 함이면 둘 다 링크 없음
  - contracts `src/contracts/discovery/api.ts` — `getNearbyStores` · `getStoreDetail` · `getStoreRoomGroups`(공개 `request` — 토큰 없음), DTO 사본 3개(`discovery-store-list` · `discovery-store-detail` · `discovery-room-group-list`)
  - 공통 `src/shared/components/map/StoreMap.tsx` — 이름표 마커(`label` · `muted`) · 반경 원(`radiusKm`) · 내 위치 점 + 내 위치로 버튼(`myLocation`) · 움직이지 않는 지도(`locked` — U2 위치)
  - 공통 `src/shared/utils/format.ts` `formatDays` — 3일 이상 이어진 요일은 범위(`일 ~ 목`)로(사용자 결정)
- Request
  - `GET /api/v1/user-service/discovery/store` query `{latitude, longitude, radius_km}`(문자열 — `DiscoveryStoreListDto`)
  - `GET /api/v1/user-service/discovery/store/:store_id` · `/:store_id/room-group` — 경로 `store_id`(32자리 소문자 16진수)
- Response
  - 목록 `{list: DiscoveryStoreItemResultDto[], is_truncated}` · 상세 `DiscoveryStoreDetailResultDto` · 객실 그룹 `{list: DiscoveryRoomGroupItemResultDto[]}`
  - 실패: 상세 404(없는 업체) · 400(ID 모양) → "업체를 찾을 수 없습니다." 팝업 → `/`. 그 밖은 `handleApiError`(목록 · 객실 그룹 포함). 취소(`AbortError`)는 무시.

## Business Rules
- **U1 조회 흐름**(지침서 screens.md U1)
  - 처음: `useMyLocation` 이 끝날 때까지 지도 자리에 "내 위치를 확인하고 있어요". 끝나면 그 위치를 중심으로 `StoreMap`.
  - 조회는 `StoreMap.onIdle`(처음 그릴 때 · 끌기 · 확대 · 반경 맞춤 뒤 모두 온다)에서 — 그 중심(소수 6자리 문자열) + 반경으로 `getNearbyStores`. 반경을 바꾸면 마지막 중심으로 바로 다시 부른다.
  - 같은 중심(차이 0.0001° — 약 11m 안) · 같은 반경이면 다시 부르지 않는다(반경 맞춤 `setBounds` 뒤 idle 이 같은 조회를 또 부르지 않게 — ship 리뷰에서 0.000001 → 0.0001). 새 조회를 시작하면 이전 요청은 취소(`AbortController`) — 늦게 온 이전 결과가 덮지 않게. 실패한 조회는 다음 idle 에 다시, 반경을 바꾸면 마지막으로 멈춘 지도 중심으로.
  - `is_truncated` 1 → 목록 위 안내 띠(`Band` info) "업체가 많아 가까운 300곳만 보여요. 반경을 줄여 주세요."
  - 목록이 비면 `EmptyState` "이 반경에 업체가 없어요" · "반경을 넓히거나 지도를 옮겨 보세요."
  - 카드: 대표 사진(`image_url` — `next/image` `unoptimized`, 없으면 "업체 사진" 자리) · 이름 · 배지(영업중 `ok` / 지금 영업 안 함 `neutral`, 24시간 `primary`) · `<거리> · <주소>`(`formatDistance`) · 가격 줄 "시간 이용 18,000원~" · "1박 59,000원~", 최저가 `null` 이면 "시간 이용 판매 안 함"(흐림). 가까운 순(응답 순서 그대로).
  - 머리(roomless · 로그인 / 내 예약)와 하단 탭은 Phase 5 그대로.
- **지도(StoreMap — 시안 user.html:363-401, 사용자 결정 "시안대로")**
  - 마커는 카카오 기본 마커 대신 시안의 핀(`CustomOverlay`) — 위에 이름표(업체 이름, 길면 말줄임), 영업 안 함(`muted`)이면 핀 · 이름표 회색. 누르면 `onMarkerClick(id)` — 탭 순서에서는 뺀다(같은 업체 목록 링크가 키보드 길), 누를 데가 없으면(U2) 버튼이 아닌 `span`.
  - 반경 원(`radiusKm`) — 지도 중심에 점선 원(주색 · 옅은 채움), 지도가 멈출 때마다 중심을 따라간다. 반경이 바뀌면(처음 포함) 원이 다 보이게 확대 단계를 맞춘다(`setBounds`).
  - 내 위치(`myLocation`) — 그 자리에 주색 점(흰 테두리 · 옅은 둘레), 오른쪽 아래 "내 위치로 이동" 버튼(44px 원)을 누르면 그쪽으로 옮긴다. 기본 위치(서울시청 — 위치를 못 읽음)면 점 · 버튼을 그리지 않는다.
  - `locked` — 끌기 · 확대를 끈다(U2 위치 지도, 화면 스크롤을 잡아먹지 않게).
  - 이전 쓰임(`/dev/infra` 미리보기 — `title` 만 넘김)은 그대로 그려진다(새 값은 모두 선택).
- **U2 업체 상세**(지침서 screens.md U2 · 시안 user.html U2)
  - 들어올 때 두 API 를 함께(`Promise.allSettled` — 하나가 실패해도 다른 하나는 쓴다), 화면을 떠나면 취소. 상세가 404 · 400 · 빈 본문 → "업체를 찾을 수 없습니다." 팝업 → `router.replace('/')`. 객실 그룹만 실패하면 업체 정보는 그리고 `handleApiError` 안내만.
  - 사진: swiper 가로 넘기기(사진 순서 그대로), 오른쪽 아래 "현재 / 전체"(1장 이상일 때). 사진이 없으면 "업체 사진" 자리.
  - 이름 · 배지(영업중 / 지금 영업 안 함 · 24시간) · 주소(+ 상세주소 — "주소, 상세주소") · 전화(`tel:` 링크) · 소개(없으면 줄 없음) · 위치 지도(`StoreMap` 마커 하나 · `locked` · 높이 시안 72px).
  - 영업시간: `is_always_open` 1 → "24시간 연중무휴"(hours 는 참고용이라 그리지 않음), 아니면 일 ~ 토 일곱 줄(`formatHourRange`) — 오늘(한국 날짜의 요일) 줄 강조. 브레이크가 있으면 "브레이크타임 매일 11:00 ~ 12:00"(여럿이면 ", " 로).
  - 판매 상품: 상품마다 배지(`room_plan_type_name`) + `describePlan` 한 줄.
  - 예약 · 환불 규정: `describeBookingPolicy` 문장들.
  - 객실 그룹 카드(그룹명 순 — 응답 그대로): 대표 사진(첫 장) · 이름 · 설명 · "예약 받는 호실 N개" · 편의시설 칩(`amenityLabels`) · 상품별 가격(`planPriceLabel` + `formatPrice`) · 기간 가격 줄(`formatPeriodPrice` — 상품마다, 있을 때만). 그룹이 없으면 "예약할 수 있는 객실이 아직 없어요".
  - "예약하기"(아래 고정) — `is_open` 0 이면 막고 "지금은 예약할 수 없어요"(DTO: 지금 영업하지 않음 — 예약 불가). U3 주소는 Phase 7 에서 생긴다(그 전엔 404).
- **요일 표시 `formatDays`**(공통 — 사용자 결정): 127 "매일", 3일 이상 이어지면 "시작 ~ 끝"(토 다음 일로 주를 넘어 이어진다), 1 ~ 2일은 " · " 나열, 묶음은 시작 요일 순.
- **swiper**: `swiper` 패키지(npm, 14.4.0) — `swiper/react` 의 `Swiper` · `SwiperSlide` + `swiper/css`. `window` 를 쓰기 전에 `typeof window` 를 확인해(`node_modules/swiper/shared/swiper-core.mjs:5`) 서버 렌더에서도 안전 — `next/dynamic` 없이 `'use client'` 부품에서 쓴다(build 때 확인).

## TDD Cases
- [ABOUT:formatDays] 예약 가능 요일 비트(일 1 · 월 2 · … · 토 64)를 읽을 글자로 바꾼다 // 127 은 "매일", 3일 이상 이어진 요일(토 → 일로 주를 넘어도)은 "시작 ~ 끝", 1 ~ 2일은 " · " 나열, 묶음은 시작 요일 순
- [CASES:formatDays] `127` → `'매일'` // 모든 요일
- [CASES:formatDays] `0` → `''` // 요일이 없으면 빈 글자
- [CASES:formatDays] `42` → `'월 · 수 · 금'` // 이어지지 않은 요일은 나열
- [CASES:formatDays] `31` → `'일 ~ 목'` // 다섯 날이 이어짐 — 범위(시안 연박)
- [CASES:formatDays] `62` → `'월 ~ 금'` // 평일 — 범위
- [CASES:formatDays] `6` → `'월 · 화'` // 이틀만 이어지면 범위로 쓰지 않음
- [CASES:formatDays] `97` → `'금 ~ 일'` // 금 · 토 · 일 — 토 다음은 일, 주를 넘어 이어짐
- [CASES:formatDays] `65` → `'토 · 일'` // 주를 넘는 이틀 — 나열, 시작 요일(토)부터
- [CASES:formatDays] `29` → `'일 · 화 ~ 목'` // 따로 떨어진 하루 + 이어진 사흘
- [CASES:formatDays] `125` → `'화 ~ 일'` // 월만 빠짐 — 화부터 일까지 이어짐
- [ABOUT:formatDistance] 중심에서 업체까지 거리(m)를 카드에 쓸 글자로 바꾼다 // 1km 아래는 m 정수, 1km 부터는 100m 단위 반올림한 km 소수 한 자리(시안 "12.0km")
- [CASES:formatDistance] `420` → `'420m'` // 1km 아래는 m
- [CASES:formatDistance] `0` → `'0m'` // 바로 그 자리
- [CASES:formatDistance] `999` → `'999m'` // 1km 바로 아래까지 m
- [CASES:formatDistance] `1000` → `'1.0km'` // 1km 부터 km, 소수 한 자리
- [CASES:formatDistance] `1049` → `'1.0km'` // 100m 단위 반올림 — 내림
- [CASES:formatDistance] `1050` → `'1.1km'` // 100m 단위 반올림 — 올림
- [CASES:formatDistance] `11300` → `'11.3km'` // 시안 예
- [CASES:formatDistance] `12000` → `'12.0km'` // 딱 떨어져도 소수 한 자리(시안 예)
- [CASES:formatDistance] `49960` → `'50.0km'` // 반올림으로 자리가 올라감
- [ABOUT:formatHourRange] 요일 하나의 영업시간을 한 줄로 쓴다 // 휴무 · 시각 없음은 "휴무", 닫는 시각이 여는 시각보다 이르거나 같으면 "다음 날"
- [CASES:formatHourRange] `{is_closed: 0, open_time: '09:00', close_time: '21:00'}` → `'09:00 ~ 21:00'` // 같은 날 닫음
- [CASES:formatHourRange] `{is_closed: 0, open_time: '09:00', close_time: '01:00'}` → `'09:00 ~ 다음 날 01:00'` // 닫는 시각이 이르면 다음 날(시안)
- [CASES:formatHourRange] `{is_closed: 0, open_time: '00:00', close_time: '00:00'}` → `'00:00 ~ 다음 날 00:00'` // 같으면 하루를 꼬박 — 다음 날
- [CASES:formatHourRange] `{is_closed: 1, open_time: null, close_time: null}` → `'휴무'` // 휴무 요일
- [CASES:formatHourRange] `{is_closed: 0, open_time: null, close_time: '21:00'}` → `'휴무'` // 시각이 빠지면 영업시간을 알 수 없음 — 휴무로
- [ABOUT:describePlan] 판매 상품 설정 하나를 한 줄 설명으로 쓴다 // 시간 이용은 이용 시간, 1박은 입실 · 퇴실 "다음 날", 연박은 박수 범위 · 입실 · 퇴실, 1박 · 연박 요일은 "입실"을 붙이되 매일은 그대로, 끝에 연장
- [CASES:describePlan] `HOURLY · usage_hours 3 · days 127 · 연장 1 · 최대 2` → `'이용 3시간 · 매일 · 연장 최대 2회'` // 시안 시간 이용
- [CASES:describePlan] `HOURLY · usage_hours 2 · days 62 · 연장 0` → `'이용 2시간 · 월 ~ 금 · 연장 안 됨'` // 연장 불가 · 요일 범위
- [CASES:describePlan] `NIGHT · 입실 20:00 · 퇴실 11:00 · days 127 · 연장 1 · 최대 1` → `'입실 20:00 · 퇴실 다음 날 11:00 · 매일 · 연장 최대 1회'` // 시안 1박 — 매일엔 "입실" 없음
- [CASES:describePlan] `NIGHT · 입실 21:00 · 퇴실 10:00 · days 96 · 연장 0` → `'입실 21:00 · 퇴실 다음 날 10:00 · 금 · 토 입실 · 연장 안 됨'` // 요일이 정해지면 입실 요일
- [CASES:describePlan] `LONG · 2 ~ 7박 · 입실 20:00 · 퇴실 11:00 · days 31 · 연장 0` → `'2박 ~ 7박 · 입실 20:00 · 퇴실 11:00 · 일 ~ 목 입실 · 연장 안 됨'` // 시안 연박 — 여러 밤이라 "다음 날" 없음
- [CASES:describePlan] `LONG · 3 ~ 3박 · 입실 15:00 · 퇴실 11:00 · days 127 · 연장 1 · 최대 3` → `'3박 · 입실 15:00 · 퇴실 11:00 · 매일 · 연장 최대 3회'` // 최소 = 최대면 박수 하나
- [ABOUT:describeBookingPolicy] 예약 · 환불 규정 값을 안내 문장들로 쓴다 // 예약 시작 시간, 전액 환불 마감 · 마감 뒤 비율(0% · 100% · 마감 0분은 다르게), 시작 뒤 취소 불가 — 분은 60으로 나누어떨어지면 시간
- [CASES:describeBookingPolicy] `{booking_open_hours: 72, refund_deadline_minutes: 60, late_refund_percent: 50}` → `['이용 시작 72시간 전부터 예약할 수 있어요.', '이용 시작 1시간 전까지 취소하면 전액, 그 뒤 시작 전까지는 50% 환불해요.', '이용이 시작되면 취소할 수 없어요.']` // 시안 규정(60분은 1시간으로)
- [CASES:describeBookingPolicy] `{…, refund_deadline_minutes: 90, late_refund_percent: 30}` 둘째 줄 → `'이용 시작 90분 전까지 취소하면 전액, 그 뒤 시작 전까지는 30% 환불해요.'` // 60으로 나누어떨어지지 않으면 분
- [CASES:describeBookingPolicy] `{…, refund_deadline_minutes: 1440, late_refund_percent: 0}` 둘째 줄 → `'이용 시작 24시간 전까지 취소하면 전액 환불해요. 그 뒤에는 환불되지 않아요.'` // 마감 뒤 0% — 비율 대신 환불 없음
- [CASES:describeBookingPolicy] `{…, refund_deadline_minutes: 60, late_refund_percent: 100}` 둘째 줄 → `'이용 시작 전까지 취소하면 전액 환불해요.'` // 마감 뒤도 100% — 마감이 의미 없음
- [CASES:describeBookingPolicy] `{…, refund_deadline_minutes: 0, late_refund_percent: 50}` 둘째 줄 → `'이용 시작 전까지 취소하면 전액 환불해요.'` // 마감 0분 — 시작 직전까지 전액
- [ABOUT:planPriceLabel] 객실 그룹 가격 앞에 붙일 상품 이름을 정한다 // 연박은 1박당 요금이라 "1박당"을 붙이고, 그 밖은 상품 종류명 그대로
- [CASES:planPriceLabel] `{room_plan_type_id: 'HOURLY', room_plan_type_name: '시간 이용'}` → `'시간 이용'` // 1회 요금
- [CASES:planPriceLabel] `{room_plan_type_id: 'NIGHT', room_plan_type_name: '1박'}` → `'1박'` // 1박 요금
- [CASES:planPriceLabel] `{room_plan_type_id: 'LONG', room_plan_type_name: '연박'}` → `'연박 1박당'` // 연박 가격은 1박당(DTO)
- [ABOUT:formatPeriodPrice] 기간 가격 하나를 카드 아래 한 줄로 쓴다 // "M월 D일 ~ M월 D일 <상품> <가격>원 (메모)" — 하루면 날짜 하나, 메모가 없거나 비면 괄호 없음, 날짜 문자열은 시간대 없이 그대로 읽음
- [CASES:formatPeriodPrice] `({start_date: '2026-12-24', end_date: '2026-12-25', price: 79000, memo: '성탄 연휴'}, '1박')` → `'12월 24일 ~ 12월 25일 1박 79,000원 (성탄 연휴)'` // 시안 예
- [CASES:formatPeriodPrice] `({start_date: '2026-12-24', end_date: '2026-12-24', price: 25000, memo: '성탄 전야'}, '시간 이용')` → `'12월 24일 시간 이용 25,000원 (성탄 전야)'` // 하루짜리 기간
- [CASES:formatPeriodPrice] `({…'2026-08-01' ~ '2026-08-31', price: 65000, memo: null}, '연박 1박당')` → `'8월 1일 ~ 8월 31일 연박 1박당 65,000원'` // 메모 없음 — 괄호 없음
- [CASES:formatPeriodPrice] `({…, memo: ''}, '1박')` → 괄호 없음 // 빈 메모도 없음과 같음
- [CASES:formatPeriodPrice] `({start_date: '2026-12-31', end_date: '2027-01-02', price: 89000, memo: '새해'}, '1박')` → `'12월 31일 ~ 1월 2일 1박 89,000원 (새해)'` // 해를 넘어도 달 · 일만(끝 날짜가 오늘 이후인 가격만 옴)
- [ABOUT:amenityLabels] 객실 그룹 편의시설을 칩 글자 목록으로 바꾼다 // 방 개수(1개 이상일 때) · 샤워 · TV · PC 중 있는 것만, 이 순서로
- [CASES:amenityLabels] `{room_count: 1, has_shower: 1, has_tv: 1, has_pc: 0}` → `['방 1개', '샤워 시설', 'TV']` // 시안 스탠다드 더블
- [CASES:amenityLabels] `{room_count: 2, has_shower: 1, has_tv: 1, has_pc: 1}` → `['방 2개', '샤워 시설', 'TV', 'PC']` // 모두 있음
- [CASES:amenityLabels] `{room_count: 0, has_shower: 0, has_tv: 0, has_pc: 0}` → `[]` // 없는 것은 칩을 만들지 않음
- [ABOUT:HomeContent] 내 위치 · 지도 중심 · 반경으로 주변 업체를 불러 지도와 목록에 그린다 // 지도가 멈출 때와 반경을 바꿀 때만 부르고, 같은 중심 · 반경은 다시 부르지 않으며 이전 요청은 취소
- [SUCCESS] HomeContent — 지도 멈춤 `{37.5, 127.03}` → `getNearbyStores` 1회 `{latitude: '37.500000', longitude: '127.030000', radius_km: '20'}` → 카드(이름 · 영업중 · `420m · 주소` · 가격) · 카드 링크 `/stores/<id>/` // 처음 반경 20km(사용자 결정)로 지도 중심 조회
- [SUCCESS] HomeContent — "5km" 누름 → 같은 중심 · `radius_km: '5'` 로 1회 더 // 반경을 바꾸면 다시 조회
- [FAIL:same-query] HomeContent — 같은 중심으로 지도 멈춤 한 번 더 → 추가 호출 0 // 반경 맞춤 뒤 idle 이 같은 조회를 또 부르지 않게
- [FAIL:truncated] HomeContent — `is_truncated: 1` → "가까운 300곳만 보여요" 안내 // 잘린 결과임을 알림
- [FAIL:empty] HomeContent — 빈 목록 → "이 반경에 업체가 없어요" // 빈 화면 대신 안내
- [FAIL:stale] HomeContent — 첫 조회가 둘째 조회보다 늦게 옴 → 둘째 결과만 그림 · 첫 요청 신호 취소됨 // 늦게 온 이전 결과가 덮지 않게(ship 리뷰)
- [FAIL:error] HomeContent — 조회 500 → `message` 팝업 1회, 같은 중심으로 다시 멈추면 다시 부름, 반경을 바꾸면 지도 중심(내 위치 아님)으로 // 실패한 조회는 다음 idle 에 다시(ship 리뷰)
- [ABOUT:StoreDetailContent] 업체 상세 · 객실 그룹을 함께 불러 그리고, 없는 업체면 첫 화면으로 돌린다 // 두 API 를 한 번씩, 상세 404 · 400 이면 안내 뒤 / 로
- [SUCCESS] StoreDetailContent — 두 API 각 1회(`store_id`) → 이름 · "24시간 연중무휴" 또는 영업시간 줄 · 판매 상품 줄 · 규정 · 그룹 카드(기간 가격 줄 · 예약 링크 `?room_group_id=`) // 지침서 U2 구성
- [FAIL:not-found] StoreDetailContent — 상세 404 → "업체를 찾을 수 없습니다." 팝업 1회 · `router.replace('/')` 1회 // 없는 업체에서 머물지 않음
- [FAIL:empty-body] StoreDetailContent — 상세 본문 없음(null) → "업체를 찾을 수 없습니다." · `/` // 빈 화면에 머물지 않음(ship 리뷰)
- [FAIL:groups] StoreDetailContent — 객실 그룹만 500 → 업체 정보는 그림 · `message` 팝업 1회 · 이동 0 // 하나가 실패해도 다른 하나는 씀(ship 리뷰)
- [FAIL:closed] StoreDetailContent — `is_open: 0` → "예약하기" 막힘 · "지금은 예약할 수 없어요" · 객실 그룹 카드도 링크 없음 // DTO — 지금 영업하지 않으면 예약 불가
- 테스트 생략(위임형): contracts `discovery/api.ts`(request 를 부르기만) · DTO 사본 · `page.tsx` · `StoreMap` 의 카카오 SDK 호출(오버레이 · 원 · `setBounds` — SDK 를 부르기만, 화면 테스트는 `StoreMap` 을 mock) · `StoreImageSlider`(swiper 를 감싸기만)

## Notes
- 지침서: frontend/screens.md U1(:49-57) · U2(:59-66), frontend/api.md "업체 둘러보기"(:104-110), DTO frontend/dto/discovery.md(사본 3개 — `contracts/discovery/dto/<파일>`). `frontend/changes/` 에 discovery 변경 없음.
- 시안: U1 `frontend/design/user.html:351-455`(머리 · 지도 320px · 반경 알약 · 핀 + 이름표 · 내 위치 점 · 내 위치로 44px · 300곳 띠 · 카드 88px 사진), U2 `:456-579`(사진 · 이름 · 주소 · 전화 · 소개 · 72px 지도 · 영업시간 2열 · 브레이크 · 판매 상품 배지 + 줄 · 규정 목록 · 그룹 카드 · 예약하기 52px), 하단 탭 `:274-279`.
- 재사용: `StoreMap` · `useMyLocation`(`src/shared/hooks/useMyLocation.ts` — 서울시청 기본) · `request`(`signal` 지원 — `src/shared/api/request.ts:165`) · `handleApiError` · `showErrorPopup` · `Band`(info) · `Badge`(ok · neutral · primary) · `EmptyState` · `Button` · `buttonClass` · `UserTopBar` · `formatPrice` · `DAY_NAMES` · `todayKst` · `next/image unoptimized`(`src/shared/components/upload/ImageUploader.tsx:137` — CloudFront 호스트가 정해지지 않아 최적화 없이).
- `StoreMap` 은 "화면은 onIdle 에서만 조회"(`src/shared/components/map/StoreMap.tsx:34-36`)를 전제로 만들었다 — U1 이 그대로 쓴다.
- 반경 원 색은 카카오 `Circle` 옵션이 CSS 변수를 못 받아 `getComputedStyle(document.documentElement)` 로 `--primary` 값을 읽어 넘긴다.
- U3 주소(`/stores/[store_id]/booking`)는 Phase 7 — 그 전엔 "예약하기" · 그룹 카드가 404(하단 탭 "내 예약" · "마이"와 같음).

## Proposals (Codebase-Based)
- [x] 지도는 Phase 4 `StoreMap` 을 넓힌다 — 새 지도 부품을 만들지 않음 (`src/shared/components/map/StoreMap.tsx`)
- [x] 업체 사진은 `ImageUploader` 처럼 `next/image` `unoptimized` (`src/shared/components/upload/ImageUploader.tsx:137`)
- [x] 요일 글자는 공통 `formatDays` 를 고쳐 쓴다 — 화면마다 따로 만들지 않음 (`src/shared/utils/format.ts:81`)
- [x] 300곳 넘음 · 빈 목록은 `Band` · `EmptyState` (`src/shared/components/ui/display/`)
- [x] 기본 카카오 마커(`new kakao.maps.Marker`)는 핀 오버레이로 바꾸면서 지운다 (`src/shared/components/map/StoreMap.tsx:126-134`)
- [x] U1 자리 표시(`HomeContent` 의 "지도 · 주변 업체" · `.placeholder`)를 지운다

## Decisions
- [x] 지도 — 시안대로: 이름표 핀 · 영업 안 함 회색 · 반경 원 · 반경에 맞춘 확대 · 내 위치 점 · 내 위치로 버튼(사용자 결정 2026-11-16)
- [x] 처음 반경 — 20km(사용자 결정)
- [x] 요일 — 3일 이상 이어지면 범위, `formatDays` 를 고침(사용자 결정)
- [x] 사진 넘기기 — swiper(사용자 결정)
- [x] TDD — `formatDays` · `formatDistance` · U2 안내 문장(`formatHourRange` · `describePlan` · `describeBookingPolicy`) · 객실 그룹 카드(`planPriceLabel` · `formatPeriodPrice` · `amenityLabels`)(사용자 결정)
- [x] 핀 이름표 — 업체 이름 전체를 말줄임(시안은 "강남역점"처럼 짧은 이름 — 이름에서 지점명을 잘라 내는 규칙이 없어 전체 이름)(제안 — 검토 때 바꿀 수 있음)
- [x] 지금 영업 안 함(`is_open` 0) — "예약하기"를 막는다(DTO "예약 불가")(제안 — 검토 때 바꿀 수 있음)
