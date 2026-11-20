# Review — main (Phase 14 업체 관리자) — 261120-4

> Re-review after fixing `main-review-261120-3.md` #1 · #2. Same ship unit.

## Target
- stick: `main` (direct 모드) → origin: `main`
- 이전 리뷰: `.beaver/output/review/main-review-261120-3.md`(Pass with fixes — 보통 1 · 낮음 1 · 참고 1)
- 고친 파일: `src/app/manager/(console)/manager-console-context.ts` · `ManagerConsoleLayoutContent.tsx` · `staff/StaffListContent.tsx` · `staff/[user_id]/StaffDetailContent.tsx` · `staff/[user_id]/_components/StaffAccountCard.tsx`, 테스트 `staff-fixture.tsx` · `staff/StaffListContent.test.tsx` · `ManagerDashboardContent.test.tsx` · `store/StoreSettingsContent.test.tsx`, spec(결과 줄 1 · 동작 흐름 ① · 결정)
- 검증: `npx tsc --noEmit` 오류 0, `npx vitest run` 83파일 391건 통과

## Fixes
| # | 지적 | 고친 모양 |
|---|------|------|
| 1 | 계정을 읽기 전에도 "업체 총관리자만" 안내가 먼저 보임 | 콘솔 Context 에 `accountLoaded`(계정 쿠키를 다 읽었나) — 콘솔 틀이 `getAreaAccount` 를 받은 뒤 true. 업체 관리자 두 화면은 읽기 전엔 아무것도 그리지 않고(조회도 없음), 읽은 뒤 권한을 본다. 테스트 1건 더함(읽는 중 → 안내 · 목록 없음 · 목록 0번), spec 결과 줄 · 결정에 반영 |
| 2 | "등록된 휴대폰 로" 조사 | 문자가 갈 곳을 조사까지 한 덩어리(`010-1234-5678 로` · `등록된 휴대폰으로`)로 확인 문구 · 안내에 쓴다 |

## Convention Check (고친 곳)
| Item | Result | Notes |
|------|------|------|
| Context | pass | 새 값은 Context 타입 · 기본값(`false`) · 틀 Provider 에 함께, 쓰는 테스트 Provider 3곳에 `accountLoaded: true` |
| 본문 순서 · 주석 | pass | 상태 줄 · 계산 값 줄 오른쪽 주석 정렬 유지 |
| Test strength | pass | 읽는 중 · 업체 관리자 · 업체 총관리자 세 경우를 나눠 본다 |

## Remaining (참고 — 이전 리뷰 #3 그대로)
- 등록 · 비밀번호 초기화는 실제 SMS 가 간다 — 개발 백엔드 SMS 설정 확인 뒤 시험.

## Verdict
Pass — 커밋한다.
