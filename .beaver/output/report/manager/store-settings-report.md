# Report — 내 업체 설정 (Phase 11)

## Feature Summary
- **Feature**: 내 업체 설정 — 기본 정보 · 사진 · 영업 규정
- **Entry point**: `PAGE /manager/store`(탭 6개 — 기본 정보 · 사진 · 영업시간 · 운영 규정 · 일시 예약불가 · 문 연동)
- **Domain**: manager
- **Plan**: `.beaver/output/plan/manager/store-settings-plan.md` · spec `.beaver/output/spec/manager/store-settings-spec.md` · roadmap Phase 11(#37 ~ #42) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/contracts/store/dto/store-mine-*.dto.ts` 14개 | created | 지침서 사본(`copy-dto.js`) |
| `src/contracts/store/api.ts` | modified | 내 업체 쓰기 · 일시 예약불가 함수 14개, import 정리 |
| `src/app/manager/(console)/store/page.tsx` · `StoreSettingsContent.tsx` | created | 머리 · 영업중지 띠 · 탭(문 연동은 업체 총관리자만) · 저장 뒤 다시 읽기 |
| `src/app/manager/(console)/store/_components/Store{Profile,Photos,Hours,Policy,Unavailable,Door}Tab.tsx` | created | 탭 6개 |
| `src/app/manager/(console)/store/store-settings-format.ts` | created | 영업시간 보낼 값 · 다음 날 표시 · 일시 글자 · 규정 요약 · 탭 · 요일 · 숫자 칸 |
| `src/shared/utils/validation.ts` | modified | `validateActionRows(dtos, path)` |
| `src/shared/components/ui/form/FieldError.tsx` · `Field.tsx` | created · modified | 라벨 없는 칸의 오류 span, `Field` 도 이걸 그린다 |
| `src/app/manager/manager-auth.ts` · `src/app/(user)/store-applications/store-application-format.ts` · `ApplicationCard.tsx` · `StoreApplicationDetailContent.tsx` | modified | `managerLoginUrl` · `storeConsoleLoginUrl` 를 매니저 쪽으로 옮김(입점 신청 · 내 업체 설정이 함께 씀) |
| `src/app/css/manager/StoreSettingsContent.module.css` · `Store*Tab.module.css` 6개 | created | 시안 값 |
| `src/test/app/manager/(console)/store/` — `store-settings-format.test.ts` · `StoreSettingsContent.test.tsx` · `_components/Store*Tab.test.tsx` 6개 · `store-fixture.tsx` | created | spec 25건 |
| `src/test/app/manager/manager-auth.test.ts` · `src/test/app/(user)/store-applications/store-application-format.test.ts` | modified · deleted | `managerLoginUrl` 테스트 3건을 옮김 |
| `AGENTS.md` · `docs/conventions.md` · `docs/integrations.md` | modified | `FieldError` · `validateActionRows` · 내 업체 사진 올리기 |
| `package.json` · `package-lock.json` | modified | `class-transformer` · `reflect-metadata` (사용자가 설치) |
| `src/instrumentation.ts` · `src/instrumentation-client.ts` · `vitest.setup.ts` | created · created · modified | `reflect-metadata` 를 DTO 보다 먼저 붙인다(서버 · 브라우저 · 테스트) |
| `docs/data-layer.md` · `docs/error-handling.md` · `AGENTS.md` | modified | `@Type` DTO 와 `reflect-metadata` 를 불러오는 곳 |

plan 과 다른 점:
- 사업자등록증 미리보기는 `<img>` 대신 형제와 같은 `next/image` + `unoptimized`(`src/app/(user)/store-applications/[store_application_id]/_components/ApplicationFiles.tsx:121` — 서명 주소).
- 영업시간 카드의 24시간 스위치는 `Card` 오른쪽에 `Switch` 만(스위치가 이름을 스스로 그려 글자가 두 번 보이지 않게).
- 영업시간 · 브레이크 검사는 `validateActionRows` 의 기본 지움(reset)을 그대로 쓴다.
- `reflect-metadata` 를 더 들였다(plan 에 없음). `class-transformer` 의 `@Type` 은 클래스를 읽을 때 `Reflect.getMetadata` 를 부르는데(`node_modules/class-transformer/esm2015/decorators/type.decorator.js:10`), 이 shim 이 없으면 영업시간 · 브레이크 DTO 를 가져오는 순간 `Reflect.getMetadata is not a function` 으로 화면이 깨진다(테스트 6파일이 같은 오류). 서버는 `src/instrumentation.ts` 의 `register`, 브라우저는 `src/instrumentation-client.ts`(하이드레이션 전), 테스트는 `vitest.setup.ts` 에서 먼저 불러온다.

## Tests Written
spec 의 ✓ 14건 + 계산 규칙 11건 = 25건, 옮긴 테스트 3건.
- 계산 — `store-settings-format.test.ts`(영업시간 보낼 값 3 · 다음 날 표시 3 · 일시 글자 2 · 규정 요약 3)
- 탭 — 기본 정보(저장 인자 · 다시 읽기 / 연락처 7자리 → 칸 옆 · 0번) · 사진(`ImageUploader` 를 버튼 mock — 발급 · 등록 인자 / 순서 ID 전부) · 영업시간(7개 · 휴무 요일 시각 없음 · 다음 날 표시 / 수요일 닫는 시각 비움 → `hours.3.close_time` 칸 · 0번 / 브레이크 줄 전부) · 운영 규정(영업중 끔 → `is_open` 0 · 요약 문장 / 비율 120 → 칸 옆 · 0번) · 일시 예약불가(목록 · 등록 인자 날짜 시각 모양 · 메모 다듬기 · 목록 다시 · 칸 비움 / 시작 비움 → 칸 옆 · 0번) · 문 연동(정하기 → 인자 · 안내 · 칸 비움 · 다시 읽기 / 15자 → 칸 옆 · 0번)
- 머리 — 업체 관리자면 탭 5개(문 연동 없음) · 머리 배지

## Verification
- `class-transformer` 0.5.1 · `reflect-metadata` 0.2.2 는 사용자가 설치(이 세션에서 `npm install` 이 허용되지 않음).
  - 처음 돌렸을 때(`reflect-metadata` 없이) 6파일(`store-settings-format` · `StoreSettingsContent` · 영업시간 · 사진 · 운영 규정 · 일시 예약불가 탭)이 `TypeError: Reflect.getMetadata is not a function`(`store-mine-hours.dto.ts` · `store-mine-breaks.dto.ts` 의 `@Type`)으로 열리지 않음 → `reflect-metadata` 를 먼저 불러오게 함(위 "plan 과 다른 점").
  - `npx next typegen && npx tsc --noEmit`: 오류 0.
  - `npx vitest run`(전체): 74파일 359건 통과. 이번 테스트(`src/test/app/manager/(console)/store/`)는 8파일 25건, 경고 없음.
  - React Compiler 회귀 테스트 통과 — 새 컴포넌트 모두 컴파일됨.
- spec 동작 흐름 번호(①~⑥)가 화면 주석과 맞는지, 결과 표의 `— (이유)` 줄(복사 · 영업중지 띠 · 못 읽음 · 사진 지우기 · 형식 · 5장 · 24시간 · 10개 · 겹침 · 기간 지우기)이 코드에 있는지 읽어 확인.

## Remaining Issues
- 화면 확인(`/manager/store/` 탭 6개, 업체 관리자 계정이면 문 연동 탭 없음)과 `npm run lint` 는 사용자 몫. `instrumentation-client.ts` 는 개발 서버를 다시 띄워야 잡힌다(새 특수 파일).
- 표 칸의 휴무 스위치는 공통 `Switch` 가 이름("일요일 휴무")을 늘 그린다 — 시안은 스위치만. 숨김 글자가 필요하면 `Switch` 에 선택 prop 을 더한다.
