# Review — main (Phase 6 업체 둘러보기) — 261117

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: Phase 6 업체 둘러보기 — #19 U1 지도 · 주변 업체(`HomeContent` · `formatDistance`) · #20 U2 업체 상세 + 객실 그룹(`StoreDetailContent` · `store-detail-format` · `StoreImageSlider`) + 공통 `StoreMap` 확장(핀 · 반경 원 · 내 위치 · `locked`) · `formatDays` 범위 · `swiper` 패키지
- Change scope: 코드 · 테스트 약 30파일(새 · 고침), `package.json` · `package-lock.json`(`swiper` ^14.4.0), 문서 AGENTS.md · `docs/data-layer.md` · `docs/integrations.md`, beaver 기록(spec · plan · report · 로드맵 · spec 보드 · 이 문서).
- 검증: `npx vitest run` 38파일 212건 통과(처음 208건 중 1건 실패 — 아래 #10), `npx next typegen && npx tsc --noEmit` 오류 0, React Compiler(`babel-plugin-react-compiler` 1.0.0)로 바꾼 컴포넌트 넷이 모두 컴파일됨(`HomeContent` 는 처음에 건너뜀 — #1). `npm run lint` · 화면 확인은 사용자 실행.
- 리뷰 방식: 별도 에이전트가 읽기 전용으로 검토(React Compiler 를 node_modules 에서 직접 돌려 확인까지) → 지적을 코드 · 컴파일러로 다시 확인한 뒤 고침.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `StoreQueryType` · `RadiusType` · `KakaoCircleType` · `StoreImageSliderProps`, 상수 UPPER_SNAKE(`RADIUS_OPTIONS` · `DEFAULT_RADIUS` · `SAME_CENTER_EPSILON` · `STORE_NOT_FOUND_MESSAGE` · `CIRCLE_STYLE` · `PIN_SVG`), 주소 `[store_id]` |
| Structure & layering | pass | page.tsx 는 서버 컴포넌트로 `<화면>Content` 만, 화면 전용 부품은 `_components/`, css 는 `src/app/css/user/`. `shared` → `contracts` · `app` import 없음. 본문 순서 · 주석 규칙(효과 이벤트는 변수, `markersKey` 는 계산 값) |
| Shared logic extraction | pass | 지도는 Phase 4 `StoreMap` 을 넓힘(새 지도 부품 없음), 요일은 공통 `formatDays`, 반경은 공통 `Chip`, 안내는 `Band` · `EmptyState`. 거리 · 안내 문장은 그 화면 폴더(한 화면만 씀) |
| Errors & responses | pass | 실패는 `handleApiError`(취소 무시), 없는 업체만 "업체를 찾을 수 없습니다." 팝업 → `/` |
| Test strength | pass (#9 보강) | TDD 46 + 화면 12 — 호출 횟수 · 인자 · 취소 신호 · 미호출, 리뷰 뒤 4건 더함 |

## Intended Behavior Check (against plan/spec)
- spec Business Rules(U1 조회 흐름 · 지도 · U2 · `formatDays` · swiper) — 코드 · 테스트가 맞다. 사용자 결정(시안대로 지도 · 처음 20km · 범위 요일 · swiper · TDD 범위) 반영.
- 리뷰에서 spec 이 다루지 않던 경우가 드러나 spec 을 고쳤다: 같은 중심 기준 0.000001 → 0.0001°(약 11m — #2), 실패 뒤 반경은 지도 중심으로(#3), 영업 안 함이면 그룹 카드도 링크 없음(#4), 객실 그룹만 실패 · 빈 본문(#5), 핀 탭 순서 · `span`(#7). TDD 줄 4개 더함(spec · plan 같은 줄).
- swiper 서버 렌더 안전성: plan 의 "`ssr-window` 를 품어" 는 틀림 — swiper 14 는 `typeof window` 확인(`node_modules/swiper/shared/swiper-core.mjs:5`)으로 안전, 그리고 사진은 클라이언트 조회 뒤에만 그려져 서버에서 돌지 않는다. 근거 문구를 고쳤다.
- 초안 규약: 없음(새 규약 영역 없음 — 지도는 Phase 4 문서 `docs/integrations.md` 를 고침).
- memory: 미반영 항목 없음(`.beaver/memory/MEMORY.md`).

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | Medium | `src/app/(user)/HomeContent.tsx` (`search`) | `try` 안의 `found ?? EMPTY_RESULT` 때문에 React Compiler 가 `HomeContent` 를 건너뜀(`Support value blocks … within a try/catch`) — `markers` 가 렌더마다 새 배열이라 `StoreMap` 이 핀(최대 300개)을 렌더마다 지우고 다시 찍음. 컴파일러로 확인 | 고침 — `try` 안에는 `await` 만, 결과 처리는 밖에서(컴파일 확인). `StoreMap` 핀 효과도 배열 대신 내용 키(`id:좌표:회색:이름표`)로 — 컴파일러가 없어도 다시 찍지 않음 |
| 2 | Low–Medium | `HomeContent.tsx` (`SAME_CENTER_EPSILON`) | 같은 중심 기준 0.000001°(약 0.1m)는 `setBounds` 뒤 중심 흔들림보다 좁을 수 있어 반경을 바꿀 때마다 요청 두 번(첫 요청은 취소) — 추정(카카오 실제 값은 화면에서) | 고침 — 0.0001°(약 11m). 테스트를 0.00005° 흔들림으로 |
| 3 | Low | `HomeContent.tsx` (`changeRadius`) | 조회가 실패하면 마지막 조회를 비워, 그 뒤 반경을 바꾸면 지도 중심이 아니라 내 위치(GPS)로 조회 | 고침 — 마지막으로 멈춘 중심을 따로(`centerRef`), 실패는 거름 키만 비움. 테스트 |
| 4 | Low | `src/app/(user)/stores/[store_id]/StoreDetailContent.tsx` (객실 그룹 카드) | 영업 안 함이어도 그룹 카드가 예약 링크 — "예약하기를 막는다"는 결정을 우회 | 고침 — 영업 안 함이면 링크 없는 카드(`roomGroupBody` 를 `Link` / `div` 가 감쌈). 테스트 |
| 5 | Low | `StoreDetailContent.tsx` (불러오기 효과) | `Promise.all` 이라 객실 그룹만 500 이어도 업체 정보까지 버림, 상세 빈 본문(null)이면 안내 없이 빈 화면 | 고침 — `Promise.allSettled`, 빈 본문은 없는 업체, 그룹 실패는 안내만. 테스트 2건 |
| 6 | Low | `src/app/(user)/stores/[store_id]/_components/StoreImageSlider.tsx` | 키보드로 사진을 넘길 수 없고 넘김이 낭독되지 않음 | 고침 — swiper `Keyboard` · `A11y`(이전 · 다음 사진 문구) + `swiper/css/a11y` |
| 7 | Low | `src/shared/components/map/StoreMap.tsx` (`createPin`) | U1 핀 최대 300개가 목록보다 앞의 탭 정지, U2 핀은 누를 데가 없는 버튼 | 고침 — 누를 수 있는 핀은 `tabIndex = -1`(목록 링크가 키보드 길), `onMarkerClick` 이 없으면 `span` |
| 8 | Low | `src/app/css/user/HomeContent.module.css` (`.radius`) | 칩 줄이 지도 위 가로 전체를 덮어, 칩 사이 · 오른쪽 빈 곳에서 지도 끌기 · 핀 누르기가 막힘 | 고침 — 줄은 `pointer-events: none`, 칩만 `auto` |
| 9 | Low | `src/test/app/(user)/HomeContent.test.tsx` | 늦게 온 이전 결과 · 실패 뒤 다시 조회가 테스트되지 않음(그 코드를 지워도 통과) | 고침 — `[FAIL:stale]` · `[FAIL:error]` 더함 |
| 10 | Low | `StoreDetailContent.tsx` (불러오기 효과) | 효과가 `router` 에 의존 — 테스트의 `useRouter` 가 렌더마다 새 객체라 결과를 그린 뒤 상세를 한 번 더 부름(208건 중 1건 실패). 실제 Next router 는 같은 객체지만 효과는 `storeId` 에만 걸려야 함 | 고침 — 없는 업체 처리를 `useEffectEvent`(`leaveNotFound`)로, 의존은 `[storeId]` |

## Verdict
Pass — #1 ~ #10 모두 고쳤고(테스트 212건 · 타입 체크 · React Compiler 컴파일 통과), spec · plan · `docs/integrations.md` 를 고친 동작에 맞췄다. #2 의 카카오 실제 중심 흔들림 · 핀 · 반경 원 · 사진 넘기기는 SDK 를 mock 한 테스트로는 확인되지 않아 화면 확인이 남는다. 커밋으로 진행.
