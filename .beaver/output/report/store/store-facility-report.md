# Report — 업체 편의시설 — 켜고 끄기 · 보기 · 검색필터 (로드맵 밖)

## Feature Summary
- **Feature**: 업체 편의시설 — 켜고 끄기 · 보기 · 검색필터
- **Entry point**: `PAGE /`(지도 검색필터) · `PAGE /stores/[store_id]` · `PAGE /manager/store`(편의시설 탭) · `PAGE /admin/stores/[store_id]`
- **Domain**: store
- **Plan**: `.beaver/output/plan/store/store-facility-plan.md` · spec `.beaver/output/spec/store/store-facility-spec.md` · 백엔드 수정 요청 `frontend/changes/2026-11-24-store-facility.md` · direct 모드(`main`) · 로드맵 해당 없음

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/contracts/store/dto/store-mine-detail.dto.ts` · `src/contracts/discovery/dto/discovery-detail-filter.dto.ts` | created | 요청서 DTO 사본 |
| `src/contracts/discovery/dto/discovery-room-group-detail-filter.dto.ts` | deleted | 옛 필터 항목(백엔드가 주소를 없앤다) |
| `src/contracts/discovery/dto/discovery-store-detail.dto.ts` · `src/contracts/store/dto/store-mine.dto.ts` · `store-detail.dto.ts` | modified | `store_detail` 칸(`introduction` 다음) + 편의시설 클래스 |
| `src/contracts/discovery/dto/discovery-store-list.dto.ts` | modified | `detail_filter` 설명(검증 그대로) |
| `src/contracts/discovery/api.ts` | modified | `getRoomGroupDetailFilters` → `getDetailFilters`(`/user-service/discovery/detail-filter`) |
| `src/contracts/store/api.ts` | modified | `updateMyStoreFacility` — PUT `/admin-service/store/mine/detail`(큐) |
| `src/contracts/common/store.constants.ts` · `room.constants.ts` | modified | 편의시설 표 `STORE_FACILITY_OPTIONS` · `storeFacilityLabels`, 객실 옵션 주석 |
| `src/app/(user)/_components/search-filter.ts` | created | 거리 값 · 글자(홈에서 옮김) · `searchFilterLabel` · `groupDetailFilters` |
| `src/app/(user)/_components/DetailFilterModal.tsx` → `SearchFilterModal.tsx` · `src/app/css/user/DetailFilterModal.module.css` → `SearchFilterModal.module.css` | renamed (`git mv`) · modified | "검색필터" 팝업 — 거리 한 줄 · 묶음 체크 |
| `src/app/(user)/HomeContent.tsx` · `src/app/css/user/HomeContent.module.css` | modified | 거리 칩 줄 · `changeRadius` 지움 → 검색필터 버튼 하나 · 적용 한 곳 · 안내 문구 |
| `src/app/(user)/stores/[store_id]/StoreDetailContent.tsx` | modified | 소개 아래 편의시설 칩 |
| `src/app/manager/(console)/store/_components/StoreFacilityTab.tsx` · `src/app/css/manager/StoreFacilityTab.module.css` | created | 편의시설 탭 — 스위치 7개 · 저장 |
| `src/app/manager/(console)/store/store-settings-format.ts` · `StoreSettingsContent.tsx` | modified | 탭 "편의시설"(기본 정보 다음) · `facilityFormOf` · `facilityDtoOf` |
| `src/app/admin/(console)/stores/[store_id]/AdminStoreDetailContent.tsx` | modified | 운영 규정 카드 "편의시설" 한 줄 |
| `src/test/contracts/common/store.constants.test.ts` · `src/test/app/(user)/_components/search-filter.test.ts` · `src/test/app/manager/(console)/store/_components/StoreFacilityTab.test.tsx` | created | 계산 9건 · 편의시설 저장 1건 |
| `src/test/app/(user)/HomeContent.test.tsx` · `stores/[store_id]/StoreDetailContent.test.tsx` · `manager/(console)/store/StoreSettingsContent.test.tsx` · `store-fixture.tsx` · `admin/(console)/admin-fixture.tsx` | modified | 검색필터 ✓ 2 · 칩 ✓ 1 · 바뀐 화면의 기존 기대값 · `store_detail` 픽스처 |
| `AGENTS.md` · `docs/data-layer.md` | modified | 편의시설 표 위치 · 검색필터 팝업 · 반영한 수정 요청 기록 |

plan 과 다른 점:
- `docs/architecture.md` 는 고치지 않았다 — 이용자 `_components` 목록에 필터 팝업이 적혀 있지 않았다(plan 의 "있으면 이름 바꿈" 조건).
- 업체 상세의 편의시설 칩 칸은 `role="group"` · `aria-label="편의시설"` 을 붙였다(테스트가 칸을 찾고, 화면 읽기 프로그램도 묶음 이름을 읽는다).
- 그 밖은 plan 코드 그대로.

## Tests Written
spec 의 ✓ 4건 + 계산 규칙 9건 = 13건(계산 규칙을 먼저 썼다). build 에서는 실행하지 않았다.
- 계산 — 검색필터 버튼 글자 4(`search-filter.test.ts`): 20km · 체크 없음 → `검색필터 · 20km 이내` / 제한 없음 · 3개 → `검색필터 · 편의시설 3개` / 20km · 객실 1 + 편의시설 2 → `검색필터 · 20km 이내 · 편의시설 3개` / 제한 없음 · 없음 → `검색필터`
- 계산 — 묶음 나누기 3: 객실 4 + 편의시설 7 → 두 묶음 · 받은 순서 / 객실만 → 한 묶음 / 처음 보는 묶음 → 맨 뒤 "기타"
- 계산 — 편의시설 이름 목록 2(`store.constants.test.ts`): 주차 · 편의점 → `편의점` · `주차` / 모두 0 → 빈 목록
- 지도 검색필터 2(`HomeContent.test.tsx`): 10km · PC · 온천 → 항목 1번 · 거리 칩 5개 · 객실 4 · 편의시설 7(받은 순서) · 고르는 동안 0번 → 검색 `radius_km 10` · `has_pc,has_hot_spring` · 원 10 · 팝업 닫힘 · 버튼 글자 · 눌림 / 50km · 주차 적용 → 다시 열면 적용 중인 값 → 초기화 → 20km · 해제 → 검색 `20` · 필터 없음 · 항목 다시 읽지 않음 · 버튼 글자
- 업체 상세 1(`StoreDetailContent.test.tsx`): 편의점 · 주차만 → "편의시설" 칸 칩 `편의점` · `주차` · 소개 바로 다음 자리(기존 테스트는 모두 0 → 칸 없음 확인 한 줄 더함)
- 편의시설 탭 1(`StoreFacilityTab.test.tsx`): 스위치 7개 순서 · 처음 값 → 온천 켬 → 저장 1번 · 매니저 토큰 · `StoreMineDetailDto` · 7개 모두 0 · 1 → 다시 읽기 1번
- 기존 홈 테스트 고침: 거리 칩을 지도에서 누르던 3건(제한 없음 · 실패 뒤 10km 포함)을 팝업 안 거리 → 적용으로, 안내 문구 2건(300곳 · 빈 목록)을 새 문구로, 첫 화면에 거리 칩이 없고 버튼이 `검색필터 · 20km 이내` 인지 확인

## Verification
- `npx next typegen && npx tsc --noEmit --noUnusedLocals`: 오류 0.
- 테스트는 실행하지 않았다(build 규칙 — 실행은 ship 뒤 `/beaver:test`).
- 읽어서 확인: 옛 이름(`DetailFilterModal` · `getRoomGroupDetailFilters` · `room-group-detail-filter` · `radiusChips` · `changeRadius`)이 `src` 에 남지 않았다. spec 동작 흐름 번호(①~④)가 화면 주석과 맞고, `— (이유)` 줄(닫기 · 항목 못 읽음 · 0 · 1 밖 · 서버 거절 · 저장 뒤 못 읽음 · 관리자 보기만)은 코드 그대로 · 공통 처리. 적용은 항목을 못 읽어도 막지 않는다(거리만 적용). `store_detail` 이 없는 응답(백엔드 배포 전)은 칩 숨김 · 스위치 모두 끔.

## Remaining Issues
- 테스트 실행 전 — ship 뒤 `/beaver:test`.
- k8s 백엔드에 새 API 가 아직 없다(`detail-filter` 404 — 2026-11-24 확인). 백엔드를 다시 배포하기 전에는 지도 검색필터의 체크 항목이 "불러오지 못했어요"로 보이고(거리는 적용된다), 편의시설 저장이 실패한다.
- 실제 화면은 아직 보지 않았다 — 개발 서버는 사용자가 띄운다.
