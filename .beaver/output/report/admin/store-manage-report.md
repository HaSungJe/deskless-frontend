# Report — 입점 신청 · 업체 관리 — 승인 · 반려 · 업체 상태 (Phase 16)

## Feature Summary
- **Feature**: 입점 신청 · 업체 관리 — 승인 · 반려 · 업체 상태
- **Entry point**: `PAGE /admin/store-applications` · `PAGE /admin/store-applications/[store_application_id]` · `PAGE /admin/stores` · `PAGE /admin/stores/[store_id]`
- **Domain**: admin
- **Plan**: `.beaver/output/plan/admin/store-manage-plan.md` · spec `.beaver/output/spec/admin/store-manage-spec.md` · roadmap Phase 16(#53 ~ #56) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/contracts/store/dto/` 9개(`store-application-list` · `-detail` · `-approve` · `-reject` · `store-list` · `store-detail` · `store-update` · `store-state` · `store-open`) | created | 지침서 `frontend/dto/store.md` 사본 |
| `src/contracts/store/api.ts` | modified | 관리자 API 9개(입점 신청 목록 · 상세 · 승인 · 반려, 업체 목록 · 상세 · 정보 수정 · 상태 · 영업중) |
| `src/contracts/common/store.constants.ts` | created | 입점 신청 상태 · 파일 용도 · 업체 상태 값, 신청 상태 배지 색 |
| `src/app/(user)/store-applications/store-application-format.ts` · `StoreApplicationDetailContent.tsx` · `ApplicationFiles.tsx` · `ApplicationCard.tsx` | modified | 옮긴 상수를 쓰고 자기 사본 지움(`FILE_MAX` 만 남김) |
| `src/app/manager/(console)/manager-console-context.ts` | modified | `isStoreSuspended` 가 `STORE_STATE.SUSPEND` — `STORE_SUSPENDED` 사본 지움 |
| `src/app/admin/(console)/admin-paths.ts` | created | 관리자 화면 주소(입점 신청 · 업체 · Phase 17 업체 관리자 · 이용자) |
| `src/app/admin/(console)/_components/ListFilter.tsx` · `StoreFilesCard.tsx` | created | 목록 거르기(상태 칩 · 검색) · 업체 정보 파일 보기 |
| `src/app/admin/(console)/store-applications/` — `page.tsx` · `AdminApplicationListContent.tsx` · `application-format.ts` · `[store_application_id]/page.tsx` · `AdminApplicationDetailContent.tsx` | created | A3 입점 신청 목록 · 상세(승인 · 반려) · 승인 판단 |
| `src/app/admin/(console)/stores/` — `page.tsx` · `AdminStoreListContent.tsx` · `store-format.ts` · `[store_id]/page.tsx` · `AdminStoreDetailContent.tsx` · `_components/StoreInfoCard.tsx` · `StoreStateCard.tsx` · `StoreOpenCard.tsx` | created | A4 업체 목록 · 상세(정보 · 주소 검색 · 상태 · 탈퇴 확인 · 영업중) |
| `src/app/css/admin/AdminList` · `AdminDetail` · `ListFilter` · `StoreFilesCard` `.module.css` | created | 시안 A3 · A4 값 |
| `src/test/app/admin/(console)/admin-fixture.tsx` · `store-applications/application-format.test.ts` · `AdminApplicationListContent.test.tsx` · `[store_application_id]/AdminApplicationDetailContent.test.tsx` · `stores/AdminStoreListContent.test.tsx` · `stores/[store_id]/AdminStoreDetailContent.test.tsx` | created | spec 14건 |
| `AGENTS.md` · `docs/architecture.md` · `docs/conventions.md` | modified | 관리자 A3 · A4 · 공통 상수 · 주소 모음, React Compiler 가 건너뛰는 모양 한 줄 더함 |

plan 과 다른 점:
- 상태 칩 목록(`STATE_CHIPS`)을 `as const` 대신 `ReadonlyArray<{value: string | null; label: string}>` 로 적었다 — `as const` 면 `{value: null}` 칸이 암묵 any(TS7018)로 잡혔다.
- `StoreStateCard` 의 함수 순서를 `send` → `submit` 으로 — `submit` 이 아래에 선언된 `send` 를 부르면 React Compiler 가 "Rewrite hoisted function references" 로 컴포넌트를 건너뛴다(회귀 테스트가 잡음). `docs/conventions.md` React Compiler 목록에 한 줄 더함. 두 가지 모두 plan 코드도 같이 고침.

## Tests Written
spec 의 ✓ 10건 + 계산 규칙 4건 = 14건(계산 규칙을 먼저 썼다).
- 계산 — 승인할 수 있는지 4: 대기 · 사업자등록증 · 신청자 있음 → 승인 가능 / 사업자등록증 없음 → 막고 문구 / 신청자 없음 → 막고 문구 / 반려됨 → 버튼 숨김
- 입점 신청 목록 1 — 처음 인자(전체 · 1쪽 · 20건) · 표 한 줄 글자(번호 14 · `214-87-12345` · 대기 · 한국 시각) · 업체 보기 주소 → 대기 칩 · 검색어(다듬음) → 마지막 인자 `{store_application_state_id: 'WAIT', keyword: '온담', page: 1}` · 칩 `aria-pressed`
- 입점 신청 상세 3 — 승인: 승인 1번(신청 ID) · 상세 2번 · 띠(업체코드 · `https://deskless.kr/manager/<코드>/login/` · 업체 상세 링크) · 승인 버튼 사라짐 / 반려: 다듬은 사유 인자 · 대화상자 닫힘 · 상세 2번 / 빈 사유: "반려하기" `disabled` · 반려 0번 · 상세 1번
- 업체 목록 1 — 표 한 줄 글자(업체코드 앞 8자 · 사업자등록번호 · 전화 · 영업중 · 활성) · 탈퇴 업체 `DELETE_eeeeeeee…` → 영업중지 칩 · 검색어 → 인자
- 업체 상세 5 — 주소 검색 → 저장 인자(숫자만 연락처 · 고른 주소 · 숫자 좌표 · 빈 상세주소 `''`) · 상세 2번 / 7자리 연락처 → 칸 문구 · 0번 / 영업중지 + 사유 → `{store_state_id: 'SUSPEND', suspend_comment}` · 버튼 꺼짐 → 켜짐 / 탈퇴 → 확인 대화상자 문구 → `{store_state_id: 'LEAVE'}` / 스위치 → `{is_open: 0}`

## Verification
- `npx next typegen && npx tsc --noEmit`: 오류 0(처음 `STATE_CHIPS` TS7018 → 고침).
- `npx vitest run`(전체): 처음 React Compiler 회귀 테스트 1건 실패(`StoreStateCard.tsx:42` hoisted function) → 함수 순서를 바꾼 뒤 95파일 434건 통과. 이번 테스트 6파일 14건은 처음부터 통과, 옮긴 상수를 쓰는 이용자 입점 신청 · 업체 관리자 콘솔 테스트도 그대로 통과.
- spec 동작 흐름 번호(①~⑥)가 화면 주석과 맞는지, 결과 표의 `— (이유)` 줄(빈 목록 · 못 읽음 · 승인 늦음 · 서버 거절 · 사업자등록증 링크 · 신청자 없음 · 같은 상태 · 영업중지 띠 · 탈퇴 잠금 · 주소 검색 닫음)이 코드에 있는지 읽어 확인. API 9개 경로가 `frontend/api.md:175-183` 과 같다.

## Remaining Issues
- 화면 확인(`/admin/store-applications/` · `/admin/stores/` — 승인 · 반려, 주소 검색, 상태 · 탈퇴, 영업중)과 `npm run lint` 는 사용자 몫. 승인은 실제로 업체 · 계정을 만들고 대표자 휴대폰으로 문자가 간다 — 개발 백엔드 SMS 설정을 확인한 뒤 시험.
- "이용자 상세 보기" · "이 업체의 업체 관리자" 링크는 Phase 17 화면이 생길 때까지 없는 화면.
- 작업 트리에 이번 Phase 와 별개인 이용자 화면 수정(내 예약 · 입점 신청 목록 페이지 번호 아래로, 내 정보 회원 식별 코드 숨김)이 커밋 전으로 함께 있다 — ship 때 나눠 커밋.
