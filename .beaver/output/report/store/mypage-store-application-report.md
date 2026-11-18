# Report — 마이페이지 · 입점 신청 (Phase 9)

## Feature Summary
- **Feature**: 마이페이지 · 입점 신청 — 내 정보 · 탈퇴, 업체 입점 신청
- **Entry point**: `PAGE /me` · `/store-applications` · `/store-applications/new` · `/store-applications/[store_application_id]`
- **Domain**: store
- **Plan**: `.beaver/output/plan/store/mypage-store-application-plan.md` · spec `.beaver/output/spec/store/mypage-store-application-spec.md` · roadmap Phase 9(#27 ~ #30) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/contracts/user/dto/user-leave.dto.ts` · `src/contracts/store/dto/` 7개 | created | 지침서 사본(`copy-dto.js`) |
| `src/contracts/user/api.ts` | modified | `leaveUser`(DELETE) · `cancelLeave`(PATCH) — 큐, 결과 DTO 없음 |
| `src/contracts/store/api.ts` | created | `createStoreApplication` · `getMyStoreApplications` · `getMyStoreApplication` · `cancelStoreApplication` · `issueStoreApplicationFileUrl`(동기) · `registerStoreApplicationFile` · `deleteStoreApplicationFile` |
| `src/shared/utils/format.ts` | modified | `formatPhone` · `formatBusinessNumber` · `formatKoreanDate` |
| `src/shared/utils/util.ts` | modified | `digitsOnly` |
| `src/app/(user)/store-applications/store-application-format.ts` | created | `managerLoginUrl` · `storeConsoleLoginUrl` · 상태 색 · 파일 용도 · 최대 장수 |
| `src/app/(user)/me/page.tsx` · `MyPageContent.tsx` | created | U10 |
| `src/app/(user)/store-applications/page.tsx` · `StoreApplicationListContent.tsx` · `_components/ApplicationCard.tsx` | created | U11 목록 |
| `src/app/(user)/store-applications/new/page.tsx` · `StoreApplicationFormContent.tsx` | created | U11 작성 |
| `src/app/(user)/store-applications/[store_application_id]/page.tsx` · `StoreApplicationDetailContent.tsx` · `_components/ApplicationFiles.tsx` | created | U11 상세 · 파일 칸(화면 전용 — 사용자 결정) |
| `src/app/(user)/_components/MemberStateBand.tsx` | modified | `action` — 탈퇴 대기 띠의 할 일(없으면 지금처럼 `/me/` 링크) |
| `src/shared/components/ui/display/Band.tsx` · `src/shared/css/ui/display/Band.module.css` | modified | `ok` 톤 |
| `src/shared/components/ui/button/CopyButton.tsx` | modified | `variant` · `full` |
| `src/app/css/user/ReservationPage.module.css` → `UserPage.module.css` | renamed | 이용자 화면 공통 — import 13곳 고침, 첫 줄 주석 · `ReservationDetailContent.module.css` 주석 한 줄 |
| `src/app/css/user/MyPageContent.module.css` · `StoreApplicationListContent.module.css` · `StoreApplicationFormContent.module.css` · `StoreApplicationDetailContent.module.css` · `ApplicationFiles.module.css` | created | 시안 값 |
| `AGENTS.md` · `docs/data-layer.md` · `docs/conventions.md` · `docs/integrations.md` | modified | 표시 형식 줄 · 번호 · 날짜 예 · `Band` 톤 · `CopyButton` · 입점 신청 파일 칸 |

plan 과 다른 점: 없음 — plan 코드를 그대로 옮기고, contracts · page.tsx 는 plan 4절이 가리킨 형제대로 썼다.

## Tests Written
spec 의 ✓ 8건 + 계산 규칙 12건 = 20건.
- 계산 — `src/test/shared/utils/format.test.ts`(`formatPhone` 4 · `formatBusinessNumber` 2 더함) · `util.test.ts`(`digitsOnly` 3 더함) · `src/test/app/(user)/store-applications/store-application-format.test.ts`(`managerLoginUrl` 3)
- 화면 — `src/test/app/(user)/me/MyPageContent.test.tsx`(탈퇴 신청: 사유 · 큐 1번 · 내 정보 다시 2번 / 철회: 큐 1번 · 다시 2번, 늦어짐 팝업 0번) · `store-applications/StoreApplicationListContent.test.tsx`(조회 인자 · 대기 카드 링크 · 반려 사유 · 승인 업체코드 · 로그인 주소 · 복사) · `new/StoreApplicationFormContent.test.tsx`(주소 검색 좌표 · 숫자만 남긴 번호 · 신청 1번 · 상세로 / 사업자번호 9자리 → 칸 옆 오류 · 신청 0번) · `[store_application_id]/StoreApplicationDetailContent.test.tsx`(사업자등록증 올리기 — 발급 · 등록 용도 · 다시 조회 / 신청 취소 → 목록 / 승인 — 콘솔 · 보기 전용)

## Verification
- `npx next typegen && npx tsc --noEmit` 통과, `npx vitest run` 54파일 287건 통과(Node 24.22.3), React Compiler 회귀 테스트 — 새 컴포넌트 7개(`MyPageContent` · `StoreApplicationListContent` · `ApplicationCard` · `StoreApplicationFormContent` · `StoreApplicationDetailContent` · `ApplicationFiles` · `Thumb`)를 포함해 모두 컴파일됨. AGENTS.md 가 허용해 build 안에서도 돌렸다 — 정식 실행은 ship 뒤 `/beaver:test`.
- spec 동작 흐름 번호(①~⑤)가 화면 주석과 맞는지, 결과 표의 `— (이유)` 줄(사유 없는 탈퇴 · 휴대폰 인증 전 · 로그아웃 · 빈 목록 · 주소 검색 안 함 · 사진 지우기 · 형식 · 최대 장수 · 반려 보기 전용 · 없는 신청)이 코드에 있는지 읽어 확인.

## Remaining Issues
- 화면 확인(백엔드를 켜고 `/me/` · `/store-applications/`, 주소 검색은 카카오 지도 키가 있어야 좌표가 들어온다)과 `npm run lint` 는 사용자 몫.
- 업체 콘솔 로그인 주소(`/manager/<업체코드>/login/`)는 Phase 10 에서 화면이 생긴다 — 지금은 복사만.
- 로그아웃 뒤 첫 화면을 새로 여는 것은 화면 확인으로 볼 것(로그인 가드가 먼저 로그인 화면으로 보내지 않는지).

## Modification - 261118-1 (ship 리뷰 고침 — `main-review-261118-3.md` #1 ~ #6)
- #1 `UserMeProvider.reloadMe` — 못 읽으면 이미 읽은 내 정보를 두고 null. 마이페이지는 들어올 때 다시 읽기를 마쳤는데 내 정보가 없으면 "다시 불러오기", 로그아웃은 내 정보 밖, 탈퇴 · 철회 뒤 null 은 "확인하지 못했어요"(늦어짐과 나눔).
- #2 `auth.logout()` 은 토큰 쿠키만 지우고 성공 여부를 돌려준다(로그인 상태는 그대로 — `RootLayoutContent` · `RootLayoutProvider`). 마이페이지는 실패면 안내, 성공이면 `replaceDocument('/')`(새 공통 함수 — `src/shared/utils/base-path.ts`).
- #3 신청 취소 뒤 상세를 다시 읽어(`isApplicationGone` — 컴포넌트 밖) 없어졌으면 목록, 남아 있으면 늦어짐 · 상세 다시. #4 상세 효과 `.catch` 도 취소(abort)를 먼저 본다.
- #5 상호명 · 대표자명 · 총관리자 아이디를 다듬어 검사 · 전송. #6 `.withdraw` 는 `display: block`(띠 내용 아래).
- 테스트 +6: `UserMeProvider`(다시 읽기 실패 → 이전 값) · `MyPageContent`(확인하지 못함 · 내 정보 없음 다시 불러오기 · 로그아웃 성공 · 쿠키 삭제 실패) · `StoreApplicationDetailContent`(취소 늦어짐), 기존 취소 성공 · 신청 성공 테스트는 404 확인 · 공백 다듬기를 함께 본다.
- 문서: AGENTS.md(로그아웃 · `replaceDocument`) · `docs/data-layer.md`(`logout()`) · spec(마이페이지 · 작성 · 상세 흐름과 결과 표).
- 검증: `npx tsc --noEmit` 오류 0, `npx vitest run` 56파일 299건 통과(React Compiler 회귀 테스트 포함).
