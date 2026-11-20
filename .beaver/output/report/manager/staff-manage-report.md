# Report — 업체 관리자 (Phase 14)

## Feature Summary
- **Feature**: 업체 관리자 — 목록 · 등록 · 상세 · 계정 관리
- **Entry point**: `PAGE /manager/staff` · `PAGE /manager/staff/[user_id]`
- **Domain**: manager
- **Plan**: `.beaver/output/plan/manager/staff-manage-plan.md` · spec `.beaver/output/spec/manager/staff-manage-spec.md` · roadmap Phase 14(#49 · #50 — #48 M2 대시보드는 Phase 10 과 함께 배포 `facc5f6`) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/contracts/manager/dto/manager-staff*.dto.ts` 7개 | created | 지침서 `frontend/dto/manager.md` 사본 |
| `src/contracts/manager/api.ts` | modified | 업체 관리자 API 7개(동기 2 · 큐 5) |
| `src/app/manager/(console)/manager-console-context.ts` · `ManagerConsoleLayoutContent.tsx` · `store/StoreSettingsContent.tsx` | modified | `isHeadManager(account)` — 업체 총관리자 판단을 한 곳으로(문 연동 탭도 이걸 쓴다), Context `accountLoaded`(계정 쿠키를 다 읽었나) |
| `src/app/manager/(console)/staff/` — `page.tsx` · `StaffListContent.tsx` · `_components/StaffFields.tsx` · `staff-format.ts` | created | M8 목록 · 검색 · 등록 대화상자 · 함께 쓰는 칸 |
| `src/app/manager/(console)/staff/[user_id]/` — `page.tsx` · `StaffDetailContent.tsx` · `_components/StaffInfoCard.tsx` · `StaffAccountCard.tsx` | created | M8 상세 · 계정 정보 수정 · 계정 관리(확인 창) |
| `src/app/css/manager/StaffListContent.module.css` · `StaffDetailContent.module.css` · `StaffFields.module.css` | created | 시안 값 |
| `src/test/app/manager/(console)/staff/StaffListContent.test.tsx` · `staff/[user_id]/StaffDetailContent.test.tsx` · `staff-fixture.tsx` | created | spec 9건 |
| `AGENTS.md` | modified | Auth 줄 — 업체 총관리자 전용 화면 · 탭은 `isHeadManager(account)` |

plan 과 다른 점:
- `contracts/manager/api.ts` 의 업체 관리자 경로는 `STAFF_PATH` · `staffPath(user_id)` 로 모았다(객실 API 와 같은 모양).
- 내 업체 설정 머리의 계산 값 줄 오른쪽 주석 정렬을 `headManager` 에 맞췄다.
- 리뷰 261120-3 반영: 콘솔 Context 에 `accountLoaded` 를 더해(콘솔 틀 `ManagerConsoleLayoutContent.tsx` 가 계정 쿠키를 읽은 뒤 true) 두 화면이 읽기 전엔 아무것도 그리지 않는다 — 업체 총관리자에게 안내가 먼저 보이던 것. 테스트 1건(읽는 중) 더함, Context 를 쓰는 테스트 Provider 3곳에 값 추가. 확인 문구의 휴대폰 조사(`등록된 휴대폰으로`).

## Tests Written
spec 의 ✓ 9건(계산 규칙 없음 — spec 결정, 1건은 리뷰 261120-3 뒤 더함).
- 목록 — 등록(휴대폰 하이픈 입력 → 본문은 숫자만 · 성별 여 · 날짜) → `createManagerStaff` 1번 인자 · 받은 ID 상세 주소로 `push`, 업체 총관리자 줄은 링크 없음 / 아이디 `abc` → 칸 문구 · 0번 / 업체 관리자 계정 → 안내 · 목록 0번 / 계정 쿠키를 읽는 중 → 안내도 목록도 없음 · 목록 0번
- 상세 — 이름 다듬기 · 휴대폰 숫자만 저장 인자 · 상세 2번 / 휴대폰 7자리 → 칸 문구 · 0번 / 정지: 확인 전 0번 → 확인 "정지" → BLOCK · 사유 다듬기 · 상세 2번 / 초기화: 확인 전 0번 → 확인 "초기화" → 1번 · 안내 · 상세 2번 / 삭제 확인 → 1번 → 목록 주소로 `push`

## Verification
- `npx next typegen && npx tsc --noEmit`: 오류 0.
- `npx vitest run`(전체): 83파일 391건 통과. 이번 테스트 2파일 9건, 경고 없음. React Compiler 회귀 테스트 통과 — 새 컴포넌트 모두 컴파일됨. `isHeadManager` 로 바꾼 내 업체 설정 테스트(문 연동 탭 숨김 포함)도 통과.
- spec 동작 흐름 번호(①~⑤)가 화면 주석과 맞는지, 결과 표의 `— (이유)` 줄(겹침 · 검색 · 못 읽음 · 해제 · 취소)이 코드에 있는지 읽어 확인. API 7개 메서드 · 경로가 `frontend/api.md:154-160` 과 같다.

## Remaining Issues
- 화면 확인(`/manager/staff/` · 상세 — 업체 총관리자 계정으로, 업체 관리자 계정이면 안내만)과 `npm run lint` 는 사용자 몫. 등록 · 초기화는 실제로 SMS 가 가므로 개발 백엔드의 SMS 설정을 확인하고 시험한다.
