# Review — main (Phase 11 내 업체 설정) — 261119

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: Phase 11 내 업체 설정(M7 — roadmap #37 ~ #42) · spec `.beaver/output/spec/manager/store-settings-spec.md` · plan `.beaver/output/plan/manager/store-settings-plan.md` · report `.beaver/output/report/manager/store-settings-report.md`
- Change scope:
  - 화면 `src/app/manager/(console)/store/` — `page.tsx` · `StoreSettingsContent.tsx` · `store-settings-format.ts` · `_components/Store{Profile,Photos,Hours,Policy,Unavailable,Door}Tab.tsx`, css 7개
  - 계약 `src/contracts/store/api.ts`(함수 14개) · DTO 사본 14개
  - 공통 `validateActionRows`(`src/shared/utils/validation.ts`) · `FieldError`(+ `Field` 가 씀)
  - 로그인 주소 함수를 `src/app/manager/manager-auth.ts` 로 옮김(입점 신청 2파일 import, 테스트 3건 이동)
  - 의존성 `class-transformer` · `reflect-metadata` + `src/instrumentation.ts` · `src/instrumentation-client.ts` · `vitest.setup.ts`
  - 테스트 `src/test/app/manager/(console)/store/` 8파일 25건, 문서 AGENTS.md · docs 4개
- 검증: `npx next typegen && npx tsc --noEmit` 오류 0, `npx vitest run` 74파일 359건 통과(React Compiler 회귀 테스트 포함)

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `Store*Tab` · `store-settings-format.ts` · `validateActionRows` · `FieldError` · `STORE_TABS` · `HourRowType` |
| Structure & layering | pass | page 는 Content 만, 탭은 `_components/`, css 는 `src/app/css/manager/`, `app → contracts → shared` |
| 공통 부품 | pass | `Card` · `Table` · `Field` · `Switch` · `Tabs` · `Pagination` · `ConfirmModal` · `ImageUploader` + `uploadFile` · `CopyButton` |
| 상태 이름 | **finding #1** | 업체 상태 배지가 `lookupName` 대신 '활성' · '영업중지' 를 직접 씀 |
| 공통 로직 분리 | **finding #2** | `STORE_SUSPENDED = 'SUSPEND'` 가 세 화면에 복제 |
| Errors & responses | pass | 모든 쓰기 실패는 catch → `handleApiError`, 줄 칸 오류는 점 경로 `FieldError` 라 큐 failed 의 `validation_errors` 도 같은 칸 |
| API 계약 | pass | 14개 함수의 메서드 · 경로가 `frontend/api.md:184-198` 과 같다(동기 2 · 큐 12), 로그인 필요 → `withAuth` |
| 검증 | pass | 입력 DTO 사본 그대로 + `validateAction` / `validateActionRows`, 숫자 칸은 `numberOf`(빈 값 → IsNotEmpty 문구) |
| React Compiler 모양 | pass | try 안 await 만 · catch 는 `failure = {error}` · 효과는 `useEffectEvent` — 회귀 테스트 통과 |
| 문서 | **finding #3** | 기술 목록(AGENTS.md:31 · docs/architecture.md:3)에 새 의존성이 없다 |
| Test strength | pass | spec ✓ 14건 + 계산 규칙 11건 — 인자(점 경로 · 7요일 순서 · 휴무 시각 없음 · 사진 ID 전부 · 일시 모양 · 메모 다듬기) · 호출 횟수 · 실패 뒤 0번 |
| 시크릿 · 쿠키 | pass | 문 시크릿은 보내기만(원문을 다시 그리지 않음), 쿠키 · 토큰 직접 접근 없음 |

## Intended Behavior Check (against plan/spec)
- spec 의 탭 6개 · 문 연동은 업체 총관리자만 · 저장 뒤 `reloadStore`(못 읽으면 안내) · 영업중지 띠가 코드와 테스트에 있다.
- 영업시간: 24시간이면 빈 목록, 아니면 일 ~ 토 7개, 휴무 요일은 시각 없이(지침서 DTO `ValidateIf` 와 같은 모양). 다음 날 표시는 닫는 ≤ 여는 시각.
- 응답 시각 모양 확인: 영업시간 · 브레이크는 `HH:mm`(`store-mine.dto.ts:39-58` — 그대로 `type="time"` 값), 일시 예약불가 목록은 ISO 8601(`toKst` 로 한국 시각), 등록은 `YYYY-MM-DD HH:mm`(`toPeriodText`).
- 큐 쓰기는 모두 null 을 기다리지 않고 다시 읽는다(데이터 계층 규칙 — pending · null 이면 그 리소스를 다시 조회).
- plan 밖으로 더한 `reflect-metadata` 는 필요하다: `class-transformer` 의 `@Type` 이 `Reflect.getMetadata` 를 부른다(`node_modules/class-transformer/esm2015/decorators/type.decorator.js:10`). 없으면 테스트뿐 아니라 화면도 영업시간 DTO 를 가져오는 순간 깨진다. 서버 `register` · 브라우저 하이드레이션 전 · 테스트 setup 세 곳에서 먼저 불러온다.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | 낮음 | `src/app/manager/(console)/store/StoreSettingsContent.tsx:77` · `_components/StoreProfileTab.tsx:92` | 업체 상태 배지를 `suspended ? '영업중지' : '활성'` 로 직접 쓴다. AGENTS.md "상태 이름은 응답 `*_name` 먼저, 없으면 `lookupName(필드, 값)`" — `StoreMineResultDto` 에 `store_state_name` 이 없으므로 `lookupName('store_state_id', …)`. 지금 모양이면 `LEAVE` 도 '활성' 으로 보인다 | 이름은 `lookupName('store_state_id', store.store_state_id)`, 색만 영업중지 여부로 |
| 2 | 낮음 | `src/app/manager/(console)/ManagerDashboardContent.tsx:36` · `store/StoreSettingsContent.tsx:25` · `store/_components/StoreProfileTab.tsx:33` | `STORE_SUSPENDED = 'SUSPEND'` 가 세 화면에 복제. AGENTS.md "두 곳 이상에서 쓰게 되면 그때 옮긴다" | 콘솔 화면들이 함께 쓰는 `src/app/manager/(console)/manager-console-context.ts` 에 `isStoreSuspended(store)` 를 두고 세 곳이 쓴다 |
| 3 | 낮음 | `AGENTS.md:31` · `docs/architecture.md:3` | 기술 목록에 `class-transformer` · `reflect-metadata` 가 없다(`class-validator` 만) | 두 줄에 더한다 |
| 4 | 참고 | `src/app/manager/(console)/store/_components/StoreHoursTab.tsx:114` | 공통 `Switch` 가 이름을 늘 그려 표 칸에 "일요일 휴무" 글자가 보인다(시안은 스위치만) | report Remaining Issues 에 적음 — 조치 없음(필요하면 `Switch` 에 숨김 글자 선택 prop) |
| 5 | 참고 | `src/instrumentation-client.ts` | 새 특수 파일 — 실행 중인 개발 서버에는 잡히지 않는다 | 사용자가 개발 서버를 다시 띄운다 |

## Verdict
Pass with fixes — 동작 결함은 없고, 고칠 지적 3건(#1 ~ #3)은 규칙 · 문서 정리다. 고친 뒤 커밋한다.
