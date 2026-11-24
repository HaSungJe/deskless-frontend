# Review — main (업체 편의시설 · 지도 검색필터 — 로드맵 밖) — 261124-2

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main` — 같은 날 두 번째 리뷰(261124 는 문의)
- Included features:
  - 업체 편의시설 — 켜고 끄기 · 보기 · 검색필터(백엔드 수정 요청 `frontend/changes/2026-11-24-store-facility.md`) · spec `.beaver/output/spec/store/store-facility-spec.md` · plan `.beaver/output/plan/store/store-facility-plan.md` · report `.beaver/output/report/store/store-facility-report.md`
  - 지도 "추가정보" 팝업을 거리까지 담은 "검색필터" 팝업으로(사용자 요청 2026-11-24 — spec 에 반영)
- Change scope:
  - 계약 — DTO 새 2 · 고침 4 · 옛 필터 DTO 지움, `getDetailFilters`(옛 `getRoomGroupDetailFilters` 대신) · `updateMyStoreFacility`, 편의시설 표 `STORE_FACILITY_OPTIONS` · `storeFacilityLabels`
  - 이용자 — `search-filter.ts`(거리 값 · 글자를 홈에서 옮김 · 버튼 글자 · 묶음 나누기), `DetailFilterModal` → `SearchFilterModal`(`git mv` · 거리 한 줄 · 묶음 체크), 홈(거리 칩 줄 · `changeRadius` 지움 · 버튼 하나 · 안내 문구), 업체 상세 칩
  - 업체 관리자 — 편의시설 탭 `StoreFacilityTab`(새) · 탭 목록 · 칸 ↔ 보낼 값, 관리자 업체 상세 한 줄
  - 테스트 — 새 3파일(계산 9 · 저장 1) · 고친 5파일(검색필터 ✓ 2 · 칩 ✓ 1 · 기존 홈 테스트를 팝업 흐름으로 · 탭 목록 · 픽스처 `store_detail`), 문서 `AGENTS.md` · `docs/data-layer.md`
- 검증: `npx next typegen && npx tsc --noEmit --noUnusedLocals` 오류 0. 코드 리뷰(`/ship` high — 사용자 2026-11-24) 지적 0건. 테스트는 build 규칙대로 아직 돌리지 않았다(ship 뒤 `/beaver:test`). `npm run lint` 는 사용자 몫 — 아직 돌리지 않았다.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `SearchFilterModal` · `StoreFacilityTab` · `STORE_FACILITY_OPTIONS` · `StoreFacilityKeyType` · `StoreFacilityValuesType` · `FacilityFormType` · `DetailFilterGroupType` · `SEARCH_FILTER_NAME` · `searchFilterLabel` · `groupDetailFilters` · `storeFacilityLabels` · `facilityFormOf` · `facilityDtoOf` · `getDetailFilters` · `updateMyStoreFacility` |
| Structure & layering | pass | 세 영역이 쓰는 편의시설 표는 `contracts/common/store.constants.ts`(객실 옵션 `room.constants.ts` 와 같은 자리), 홈 · 팝업이 쓰는 거리 값 · 계산은 `(user)/_components/search-filter.ts`, 탭 칸 ↔ 보낼 값은 `store-settings-format.ts`(영업시간 칸 변환과 같은 파일), `app → contracts → shared` |
| 공통 로직 분리 | pass | 편의시설 이름은 업체 상세 칩 · 관리자 상세가 같은 `storeFacilityLabels`, 업체 관리자 스위치도 같은 표 순서. 옛 필터 DTO · 함수 · 거리 칩 줄 · `changeRadius` · `radiusChips` css 지움 — 두 벌 없음 |
| 공통 부품 | pass | `Chip`(거리 · 검색필터 버튼) · `Modal` · `Button` · `Switch`(객실 옵션과 같은 부품) · `Card` |
| Errors & responses | pass | 큐 실패는 `failure` 로 받아 try 밖 `handleApiError`, 체크 항목 실패는 안내 · 거리만 적용 가능, 저장 뒤 다시 읽기 실패는 기존 `onSaved` 안내 |
| API 계약 | pass | `GET /user-service/discovery/detail-filter`(동기 · 공개) · `PUT /admin-service/store/mine/detail`(큐 · 매니저 · 7개 모두) — 요청서 표와 같다, `detail_filter` 호출 방식 그대로 |
| 검증 | pass | `StoreMineDetailDto` 사본 그대로 + `validateAction`(스위치라 걸릴 일 없음 — 칸 옆 자리가 없어 걸리면 오류 팝업) |
| React Compiler 모양 | pass | try 안 await 만, 불리는 함수가 먼저(`toggle` · `reset` → `apply`), 효과 추가 없음 |
| 본문 순서 · 주석 | pass | 변수 > 상태 > 계산 값 > 함수 > JSX, 오른쪽 주석(업체 상세 `facilities` 정렬 맞춤), JSX 덩어리 주석 · spec 흐름 번호 |
| 스타일 토큰 | pass | 색 · 크기는 `var(--…)`, 묶음 제목은 콘솔 거르기 줄 앞 글자와 같은 값, 거리 줄은 내 예약 상태 칩 값, 업체 상세 칩은 객실 옵션 css 그대로 |
| Test strength | pass | spec ✓ 4 + 계산 9 — 인자(거리 · 쉼표 키 순서 · 7개 모두 0 · 1 · DTO 종류 · 토큰), 호출 횟수(항목 1번 · 고르는 동안 0번 · 다시 열어도 다시 안 읽음 · 저장 1번 · 다시 읽기 1번), 버튼 글자 · 눌림, 묶음 이름 · 순서, 칩 자리(소개 바로 다음) |

## Intended Behavior Check (against plan/spec)
- 지도 검색필터: 버튼 하나(글자 — 거리 · 편의시설 수, 둘 다 없으면 이름만), 팝업(거리 한 줄 · 객실 · 편의시설 묶음 · 처음 보는 묶음은 "기타"), 적용 때 한 번 검색, 초기화 20km · 해제, 닫기 변화 없음, 항목 실패해도 거리 적용 — spec 과 같다. 기존 동작(같은 중심 거름 · 제한 없음이면 원 없음 · 실패 뒤 지도 중심 · 늦은 결과 버림)은 테스트로 지켰다.
- 업체 상세: 켜진 것만 정한 순서 칩 · 없으면 숨김, `store_detail` 이 없는 응답(백엔드 배포 전)도 숨김 — spec 과 같다.
- 편의시설 탭: 기본 정보 다음, 스위치 7개 처음 값, 저장 7개 모두 → 다시 읽기 — spec 과 같다.
- 관리자 업체 상세: 운영 규정 카드 한 줄(없으면 `—`) — spec 과 같다.
- plan 과 다른 점(report): `docs/architecture.md` 는 필터 팝업이 적혀 있지 않아 고치지 않음, 업체 상세 칩 칸에 `role="group"` · `aria-label`.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | 참고 | 백엔드 배포 | k8s 백엔드에 새 API 가 아직 없다(`detail-filter` 404 — 2026-11-24 확인) — 배포 전에는 검색필터 체크 항목이 "불러오지 못했어요"(거리는 적용), 편의시설 저장 실패 | 요청서대로 백엔드와 함께 배포 |
| 2 | 참고 | `src/app/(user)/HomeContent.tsx` 검색필터 버튼 | 눌린 표시는 체크가 있을 때만(spec 결정 — 지금과 같다) — 거리만 바꾸면 글자로만 보인다 | 그대로 둔다 |
| 3 | 참고 | 테스트 · `npm run lint` | build 규칙대로 테스트를 아직 돌리지 않았고, lint 는 사용자 몫 | ship 뒤 `/beaver:test`, lint 는 사용자 확인 |

## Verdict
Pass — no issues(참고 3건). 커밋은 하나로: 요청서 · spec · plan · report · 코드 · 테스트 · 문서가 모두 업체 편의시설 한 덩어리이고, 검색필터 팝업 변경은 같은 필터 팝업 · 홈 파일을 함께 바꿔 나눌 수 없다. 로드맵 해당 없음(17개 단계 모두 끝남).
