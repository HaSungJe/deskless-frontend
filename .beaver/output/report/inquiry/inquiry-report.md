# Report — 문의 — 이용자 문의와 업체 · 관리자 답변 (Phase 18 — 로드맵 밖)

## Feature Summary
- **Feature**: 문의 — 이용자 문의와 업체 · 관리자 답변
- **Entry point**: `PAGE /inquiries` · `PAGE /inquiries/new` · `PAGE /inquiries/[inquiry_id]` · `PAGE /manager/inquiries` · `PAGE /manager/inquiries/[inquiry_id]` · `PAGE /admin/inquiries` · `PAGE /admin/inquiries/[inquiry_id]`
- **Domain**: inquiry
- **Plan**: `.beaver/output/plan/inquiry/inquiry-plan.md` · spec `.beaver/output/spec/inquiry/inquiry-spec.md` · 백엔드 수정 요청 `frontend/changes/2026-11-24-inquiry.md` · direct 모드(`main`) · 로드맵 해당 없음(17개 단계 모두 끝남)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/contracts/discovery/dto/discovery-store-search.dto.ts` · `src/contracts/inquiry/inquiry.constants.ts` · `src/contracts/inquiry/dto/` 9개(`inquiry-category-list` · `inquiry` · `inquiry-list` · `inquiry-detail` · `inquiry-manage-list` · `inquiry-manage-detail` · `inquiry-answer` · `inquiry-blind` · `inquiry-unblind`) | created | 요청서 DTO 사본 11개(`.js` 뗌 · pagination → `../../common/pagination.dto`) |
| `src/contracts/discovery/api.ts` | modified | `searchStores` — 업체 이름 검색(로그인 없음) |
| `src/contracts/inquiry/api.ts` | created | 문의 API 14개 — 카테고리 · 이용자 등록(큐) · 목록 · 상세, 업체 관리자 `/mine` 목록 · 상세 · 답변 · 블라인드 · 해제, 관리자 같은 5개 |
| `src/contracts/inquiry/inquiry-state.ts` | created | 상태 칩 순서 `INQUIRY_STATE_FILTERS` · 배지 색 `inquiryStateTone` |
| `src/contracts/common/lookup.ts` | modified | `inquiry_state_id` 이름 |
| `src/shared/components/console/ListFilter.tsx` · `FilterChips.tsx` · `FilterSelect.tsx` · `src/shared/css/console/ListFilter.module.css` | moved (`git mv`) | 관리자 `_components` · `css/admin` 에서 콘솔 공통으로 — css import · 주석만 바뀜 |
| `src/app/admin/(console)/store-applications/AdminApplicationListContent.tsx` · `stores/AdminStoreListContent.tsx` · `managers/AdminManagerListContent.tsx` · `users/AdminUserListContent.tsx` | modified | 옮긴 거르기 부품 import |
| `src/app/(user)/inquiries/` — `page.tsx` · `InquiryListContent.tsx` · `inquiry-format.ts` · `new/page.tsx` · `new/InquiryFormContent.tsx` · `new/_components/StorePicker.tsx` · `new/_components/StoreMapModal.tsx` · `[inquiry_id]/page.tsx` · `[inquiry_id]/InquiryDetailContent.tsx` | created | 내 문의 목록 · 문의하기(업체 검색 · 지도 팝업 · 동의) · 내 문의 상세 |
| `src/app/(user)/me/MyPageContent.tsx` · `src/app/(user)/stores/[store_id]/StoreDetailContent.tsx` | modified | 진입 — 내 정보 메뉴 "문의" 줄 · 업체 상세 "이 업체에 문의" |
| `src/app/_console/inquiries/inquiry-manage.ts` · `InquiryManageList.tsx` · `InquiryManageDetail.tsx` | created | 콘솔 한 벌 — 영역별 API 표 `INQUIRY_MANAGE` · 할 수 있는 일 `inquiryActionsOf` · 목록 · 상세 |
| `src/app/manager/(console)/inquiries/` · `src/app/admin/(console)/inquiries/` — `page.tsx` · `<영역>InquiryListContent.tsx` · `[inquiry_id]/page.tsx` · `[inquiry_id]/<영역>InquiryDetailContent.tsx` | created | 두 영역 page · 한 벌에 `scope` 만 넘기는 Content |
| `src/app/manager/(console)/manager-menu.tsx` · `src/app/admin/(console)/admin-menu.tsx` · `admin-paths.ts` | modified | 메뉴 "문의"(업체 관리자 — 예약 현황 다음 · 모두, 관리자 — 이용자 다음) · `INQUIRY_LIST_PATH` |
| `src/app/css/user/InquiryListContent` · `InquiryFormContent` · `StorePicker` · `InquiryDetailContent` `.module.css` · `src/app/css/console/InquiryManageList` · `InquiryManageDetail` `.module.css` | created | 시안 없음 — 형제 화면 값 · 토큰만 |
| `src/test/app/(user)/inquiries/` 4파일 · `src/test/app/_console/inquiries/` 3파일 + `inquiry-fixture.tsx` | created | spec 19건 |
| `src/test/app/manager/(console)/manager-menu.test.ts` · `ManagerConsoleLayoutContent.test.tsx` · `src/test/app/admin/(console)/AdminConsoleLayoutContent.test.tsx` | modified | 메뉴 목록 기대값에 "문의" |
| `AGENTS.md` · `docs/architecture.md` · `docs/conventions.md` · `docs/data-layer.md` | modified | 문의 화면 · 콘솔 공통 화면 폴더 `src/app/_console/` · 거르기 부품 위치 · 반영한 수정 요청 기록 |

plan 과 다른 점:
- 동의 칸 — plan 은 `Field` 라벨 "개인정보 수집 · 이용 동의"(구역 제목과 같은 글자) + 체크 상자 글자 "…동의합니다(필수)" 였다. 같은 글자가 세 번 나와서 `Field group` 라벨 "필수 동의" · 체크 상자 "개인정보 수집 · 이용에 동의합니다" 로 줄이고, 펼친 안내(dl)는 `Field` 안에 두었다. 오류 span(`data-id="agree"`) · 검사 순서는 plan 그대로.
- 업체 검색 줄 — 검색 버튼을 `Field` 옆이 아니라 `Field` 안의 한 줄(칸 + 버튼)로 — 입점 신청 주소 찾기 줄과 같은 모양이라 라벨 높이를 맞추는 고정 여백이 필요 없다.
- 업체 상세 "이 업체에 문의" 링크를 `<div>` 로 감쌌다 — 세로 묶음(`.info`) 안에서 버튼이 가로로 늘어나지 않게.
- 카테고리 읽기 실패 처리에 `aborted` 확인을 더했다(이용자 목록 · 문의하기) — 콘솔 목록과 같은 모양.
- 블라인드 확인에서 누를 때의 `blinded` 를 먼저 받아 둔다(`unblinding`) — 부르는 동안 상세가 바뀌어도 고른 API 가 그대로.
- 메뉴 테스트 3파일의 기대값에 "문의"를 넣었다 — plan 의 파일 표에 없었지만 메뉴를 더하면 바뀌는 회귀 기대값.
- build 뒤 코드 리뷰(`/ship` — 사용자 2026-11-24)에서 고침: 문의 관리 상세가 다시 읽을 때마다 답변 칸을 받은 답변으로 덮어써서, 보내기 전에 블라인드 · 해제를 누르면 쓰던 답변이 사라졌다 → `applyInquiry`(useEffectEvent)가 처음 · 다른 문의 · 저장된 답변이 바뀔 때만 칸을 다시 채운다. 답변 등록 테스트(저장된 답변이 칸에 남는다)는 그대로 맞다.

## Tests Written
spec 의 ✓ 14건 + 계산 규칙 5건 = 19건(계산 규칙을 먼저 썼다). build 에서는 실행하지 않았다.
- 계산 — 문의 대상 이름 2(`inquiry-format.test.ts`): 상호명 → 상호명 / 없음 → `바로방`(SITE_NAME)
- 계산 — 관리 상세에서 할 수 있는 일 3(`inquiry-manage.test.ts`): 접수 · 답변 없음 → "답변 등록" · 열림 · "블라인드" / 답변완료 → "답변 수정" · 열림 · "블라인드" / 블라인드 → 막는 문구 · "블라인드 해제"
- 내 문의 목록 1: 카테고리 1번 · 처음 목록 인자(`InquiryListDto` · 1쪽 · 20 · 값 null) · 카드 글자(상태 · `결제/환불 · 상호명` · 바로방 · 문의일 · 답변일) · 링크 → 칩 2번 → 목록 3번 · 마지막 인자(`PAYMENT` · `ANSWERED` · 1쪽) · `aria-pressed`
- 문의하기 5: 업체 검색(`{keyword: '강남'}` 다듬음) → 고르기 → 등록 인자 JSON `{store_id, inquiry_category_id, title(다듬음), content}`(동의 값 없음) → 상세로 / 바로방 — `store_id` 없음 · 검색 0번 / `?store_id` — 업체 상세 1번 · 대상 "업체에 문의" · 상호명 · 주소 · 첫 사진 · 검색 칸 없음 / 동의 안 함 → `agree` 칸 문구 · 등록 0번 / 카테고리 없음 → `inquiry_category_id` 칸 "카테고리를 선택해주세요." · 동의 칸 비어 있음 · 등록 0번
- 내 문의 상세 2: 답변완료 — 상세 1번 · 제목 · 대상 · 줄바꿈 내용 · 답변 · `11월 21일(토) 14:30` · ID 글자 없음 / 블라인드 — 안내 띠 · 내용 그대로 · "아직 답변이 없어요" · 대상 `바로방`
- 문의 관리 목록 2: 업체 관리자 — `/mine` 함수만 · 인자 · 표 한 줄 글자(번호 14 · 13 · `—` · 한국 시각) · 상세 링크 `/manager/inquiries/<문의>/` → 카테고리 · 접수 칩 · 검색어 → 4번째 인자 / 관리자 — 관리자 함수만 · 링크 `/admin/inquiries/<문의>/` · 안내 문구
- 문의 관리 상세 4: 답변 등록(다듬은 답변 · `/mine` · 띠 · 상세 2번 · 칸에 저장된 답변 · "답변 수정" · 마지막 답변 줄) / 빈 답변 → 칸 문구 · 0번 / 관리자 블라인드 — 확인 창 문구 → 1번 · 상세 2번 · 창 닫힘 / 블라인드 해제 — 칸 막힘 · 막는 문구 · 확인 창 → `unblindStoreInquiry` 1번 · 상세 2번

## Verification
- `npx next typegen && npx tsc --noEmit`: 처음 테스트 픽스처 1건(TS7018 `image_url: null` 암묵 any) → 타입을 붙여 오류 0.
- 테스트는 실행하지 않았다(build 규칙 — 실행은 ship 뒤 `/beaver:test`).
- 읽어서 확인: spec 동작 흐름 번호(①~⑤)가 화면 주석과 맞는지, 결과 표의 `— (이유)` 줄(검색 결과 없음 · 지도 팝업 · 업체 미선택이면 등록 꺼짐 · 큐 pending → 목록 · 서버 거절 · `?store_id` 못 읽음 · 답변 전 · 못 읽음 · 빈 목록 · 확인 창 취소 · 마지막 답변 줄)이 코드에 있는지. API 14개 경로 · 메서드가 요청서 표와 같다(`/admin-service/inquiry/mine…` · `/admin-service/inquiry…` · 답변 PUT · 블라인드 PATCH 본문 없음). 동의 값은 DTO 밖이라 보내지 않는다. 화면에 문의 · 회원 ID 를 보이지 않는다, 표는 번호 열(`listNumber`), 카드 목록은 번호 없음.
- 거르기 부품 이동: 원본 3파일 · css 가 없어졌고(`git mv`), 관리자 목록 4곳과 새 문의 목록만 `@/shared/components/console/…` 를 부른다 — `shared` 부품이 `app` · `contracts` 를 가져오지 않는다.

## Remaining Issues
- 테스트 실행 전 — ship 뒤 `/beaver:test` 로 전체를 돌린다.
- 동의 안내의 보관 기간 "탈퇴 시까지"는 임시 문구(사용자 결정 2026-11-24) — 정책이 정해지면 `InquiryFormContent.tsx` `CONSENT_ITEMS` 문구만 바꾼다.
- 실제 화면(k8s · 로컬)에서는 아직 보지 않았다 — 개발 서버는 사용자가 띄운다.
