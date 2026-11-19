# Review — main (Phase 11 내 업체 설정) — 261119-2

> Re-review after fixing `main-review-261119.md` #1 ~ #3. Same ship unit.

## Target
- stick: `main` (direct 모드) → origin: `main`
- 이전 리뷰: `.beaver/output/review/main-review-261119.md`(Pass with fixes — 낮음 3건 · 참고 2건)
- 고친 파일: `src/app/manager/(console)/manager-console-context.ts` · `ManagerDashboardContent.tsx` · `store/StoreSettingsContent.tsx` · `store/_components/StoreProfileTab.tsx` · `AGENTS.md` · `docs/architecture.md`
- 검증: `npx next typegen && npx tsc --noEmit` 오류 0, `npx vitest run` 359건 통과

## Fixes
| # | 지적 | 고친 모양 |
|---|------|------|
| 1 | 업체 상태 배지 글자를 직접 씀 | `StoreSettingsContent.tsx` · `StoreProfileTab.tsx` 배지 글자는 `lookupName('store_state_id', store.store_state_id)` — `LEAVE` 는 '탈퇴'. 색만 영업중지 여부 |
| 2 | `STORE_SUSPENDED` 세 곳 복제 | `manager-console-context.ts` 에 `isStoreSuspended(store)`(상수는 그 안에 하나) — 대시보드 · 내 업체 설정 · 기본 정보 탭이 쓴다, 세 상수 지움 |
| 3 | 기술 목록에 새 의존성 없음 | `AGENTS.md:31` · `docs/architecture.md:3` 에 `class-transformer` · `reflect-metadata` 를 더함. `class-transformer` 가 들어와 밀린 `package.json` 줄 번호(next 21 · react 25 · class-validator 19 · next-auth 22)도 맞춤 |

## Convention Check (고친 곳)
| Item | Result | Notes |
|------|------|------|
| 상태 이름 | pass | 응답에 `store_state_name` 이 없어 `lookupName` |
| 공통 로직 분리 | pass | 콘솔 화면들이 함께 쓰는 파일에 하나, import 방향 그대로(app 안) |
| 본문 순서 · 주석 | pass | 계산 값 줄 오른쪽 주석 정렬 유지 |
| 테스트 | pass | 머리 배지 테스트(`'내 업체 설정활성영업중'`)가 `lookupName` 으로 그대로 통과 |

## Remaining (참고 — 이전 리뷰 #4 · #5 그대로)
- 영업시간 표의 휴무 스위치 옆 이름 글자(report Remaining Issues).
- 새 특수 파일 `instrumentation-client.ts` 는 개발 서버를 다시 띄워야 잡힌다.

## Verdict
Pass — 커밋한다.
