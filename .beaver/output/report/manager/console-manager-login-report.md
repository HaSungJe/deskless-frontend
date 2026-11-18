# Report — 업체 콘솔 — 콘솔 틀 · 매니저 로그인 · 대시보드 (Phase 10)

## Feature Summary
- **Feature**: 업체 콘솔 — 콘솔 틀 · 매니저 로그인 · 대시보드
- **Entry point**: `PAGE /manager/[store_code]/login` · `/manager/[store_code]/find-login-id` · `/manager/[store_code]/password-reset` · `/manager/login` · `/manager/password` · `/manager`(콘솔 틀 · M2 대시보드), `POST /api/manager/login`, `GET /api/cookie/[area]/account`
- **Domain**: manager
- **Plan**: `.beaver/output/plan/manager/console-manager-login-plan.md` · spec `.beaver/output/spec/manager/console-manager-login-spec.md` · roadmap Phase 10(#31 ~ #36) + Phase 14 #48(M2 — 사용자 결정 2026-11-18) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/contracts/manager/dto/` 6개 · `src/contracts/store/dto/store-mine.dto.ts` · `src/contracts/stats/dto/stats-mine.dto.ts` | created | 지침서 사본(`copy-dto.js`) |
| `src/contracts/manager/api.ts` | modified | `loginManager` · `loginManagerByRoute` · 아이디 찾기 · 비밀번호 초기화 · `changeManagerPassword` |
| `src/contracts/store/api.ts` · `src/contracts/stats/api.ts` | modified · created | `getMyStore` · `getMyStats` |
| `src/shared/components/console/ConsoleShell.tsx` · `console-menu.ts` · `ConsoleAuthFrame.tsx` · `ConsoleAuthCard.tsx` + `src/shared/css/console/` 3개 | created | 공용 콘솔 틀 · 메뉴 고르기 · 로그인 계열 바탕 · 카드(관리자 콘솔도 쓴다) |
| `src/shared/components/chart/BarChart.tsx` | rewritten | 쓰지 않던 템플릿 → 묶음 막대(색은 토큰 값) |
| `src/shared/api/cookie.ts` | modified | `getAreaAccount` · `AreaAccountType` |
| `src/shared/utils/format.ts` | modified | `formatManwon` |
| `src/app/api/cookie/token-cookie.ts` | modified | 계정 쿠키 쓰기 · 읽기 · 지우기, 오래 기억하는 쿠키, 재발급 때 계정 쿠키 만료 갱신 |
| `src/app/api/cookie/[area]/account/route.ts` · `src/app/api/manager/login/route.ts` | created | 기억한 계정 읽기 · 매니저 로그인 처리 |
| `src/app/api/route-util.ts` · `src/app/api/user/sns-session.ts` · `src/app/api/user/sign/route.ts` | modified | `block_comment` 칸, `INVALID_REQUEST_MESSAGE` 를 route-util 로 옮김 |
| `src/app/manager/layout.tsx` · `manager-auth.ts` | created | 콘솔 크기 · 업체코드 쿠키 · 업체 로그인 주소 · 로그인 뒤 주소 · 권한 배지 |
| `src/app/manager/(console)/` — `layout.tsx` · `ManagerConsoleLayoutContent.tsx` · `manager-console-context.ts` · `manager-menu.tsx` · `page.tsx` · `ManagerDashboardContent.tsx` | created | 콘솔 틀 · 메뉴 · M2 대시보드 |
| `src/app/manager/[store_code]/` — `login/` · `find-login-id/` · `password-reset/` · `_components/SmsSteps.tsx` | created | M1 로그인 · 아이디 찾기 · 비밀번호 초기화 |
| `src/app/manager/login/` (`page.tsx` · `ManagerLoginGuideContent.tsx` · `dto.ts`) · `src/app/manager/password/` | created | M1 업체 로그인 주소 안내 · 비밀번호 변경 |
| `src/app/css/manager/` 8개 | created | 시안 값 |
| 테스트 10파일 + `src/test/shared/utils/format.test.ts` · `src/test/app/api/cookie/token-cookie.test.ts`(더함) | created · modified | spec 24건 + 계정 쿠키 1건 |
| `AGENTS.md` · `docs/data-layer.md` · `docs/architecture.md` · `docs/conventions.md` | modified | 매니저 로그인 route · 계정 · 업체코드 쿠키, 콘솔 부품, `formatManwon` |

plan 과 다른 점:
- `BarChart` 는 색 토큰을 효과(`useEffect` + 상태)가 아니라 그릴 때 읽는다(`tokenColors` — 문서가 없으면 대신 색). 그래프는 `ssr: false` 라 서버 출력이 없어 화면이 어긋나지 않고, 효과 안에서 바로 상태를 바꾸는 모양(hooks lint)을 피한다.
- `ConsoleAuthCard` 설명 칸은 `<p>` 대신 `<div>`(비밀번호 변경의 아이디 · 배지가 들어간다).

## Tests Written
spec 의 ✓ 11건 + 계산 규칙 13건 = 24건, plan 추가 1건.
- 계산 — `src/test/app/manager/(console)/manager-menu.test.ts`(권한별 메뉴 2 · 지금 메뉴 3 — 실제 `MANAGER_MENU`) · `src/test/app/manager/manager-auth.test.ts`(업체코드 줄임 2 · 업체 로그인 주소 3) · `src/test/shared/utils/format.test.ts`(`formatManwon` 3)
- route — `src/test/app/api/manager/login.test.ts`(백엔드 1번 · 본문 · 쿠키 4개 이름 · 계정 JSON · 만료 / 404 · 403 → 문구 · 정지 사유, 쿠키 0개) · `token-cookie.test.ts`(재발급 때 계정 쿠키 만료 갱신 · 401 때 함께 삭제 · 업체코드 쿠키 안 건드림)
- 화면 — 콘솔 틀(상단 바 · 메뉴 7개 · 강조 · 로그아웃 → `replaceDocument('/manager/login/')`) · 로그인(본문 · 돌아갈 주소 / 임시 비밀번호 → `?required=1` / 아이디 빈칸 → 칸 옆 · 0번) · 아이디 찾기(발송 인자에 주소 업체코드 · 결과 · 링크) · 안내(업체코드 모양 → 칸 옆 · 이동 0번) · 비밀번호 변경(큐 인자 · 안내 · 대시보드 / 숫자 없음 → 칸 옆 · 0번) · 대시보드(조회 인자 null · LIVE · 칸 채움 · 카드 · 표 합계)

## Verification
- `npx next typegen && npx tsc --noEmit` 통과, `npx vitest run` 65파일 324건 통과(Node 24.22.3), React Compiler 회귀 테스트 — 새 컴포넌트를 포함해 모두 컴파일됨. AGENTS.md 가 허용해 build 안에서도 돌렸다 — 정식 실행은 ship 뒤 `/beaver:test`.
- spec 동작 흐름 번호(①~⑤)가 화면 주석과 맞는지, 결과 표의 `— (이유)` 줄(로그인 가드 · 계정 쿠키 없음 · 내 업체 못 읽음 · 이미 로그인 · 다른 사이트 요청 · 공통 실패 · 영업중지 띠)이 코드에 있는지 읽어 확인.

## Remaining Issues
- 화면 확인(백엔드를 켜고 `/manager/<업체코드>/login/` → 콘솔 · 대시보드 · 로그아웃 → 다시 업체 로그인, 임시 비밀번호 → 비밀번호 변경)과 `npm run lint` 는 사용자 몫. 그래프 모양(apexcharts)은 화면에서 볼 것.
- `saveAreaTokens` · `POST /api/cookie/<area>/` 는 이제 부르는 곳이 없다 — 관리자 로그인(Phase 15)도 서버 route 로 가면 지운다.
- 메뉴 중 예약 현황 · 호실 · 객실 그룹 · 상품 설정 · 내 업체 설정 · 업체 관리자는 Phase 11 ~ 14 에서 화면이 생긴다(그 전에는 없는 화면).
- 로드맵 Phase 14 는 #48 만 이 plan 으로 진행 중 — #49 · #50(M8)은 그대로.

## Modification - 261118-1 (업체 로그인 화면에서 업체 확인 — revision `console-manager-login-revision-261118-1.md`)
- 백엔드 수정 요청 `frontend/changes/2026-11-18-store-login-store.md` 반영 — `GET /admin-service/store/login-store/:store_code`(DTO 사본 `store-login-store.dto.ts` · `getLoginStore`).
- 업체 로그인 · 아이디 찾기 · 비밀번호 초기화가 열릴 때 주소의 업체코드로 업체 확인(`src/app/manager/[store_code]/useLoginStore.ts`) — 있으면 업체명(로그인은 제목, 나머지는 제목 위 작은 글자), 없으면(업체 ID · 틀린 값 · 탈퇴) 입력 칸 없이 "업체 로그인 주소를 확인해 주세요" + "업체코드 다시 입력"(`/manager/login/?manual=1` — 기억한 업체로 다시 보내지 않음), 영업중지면 띠 + 정지 사유(로그인은 그대로), 확인 못 함이면 공통 안내 + 입력 칸.
- `ConsoleAuthCard` 에 `caption`(제목 위 작은 글자), `LoginStoreNotFound` · `LoginStoreSuspended`(`[store_code]/_components/`).
- 테스트: 로그인 정상 테스트에 업체 확인 · 업체명, 새 `[FAIL:not-found]`(안내 · 링크 · 입력 칸 없음 · 로그인 0번), 아이디 찾기 정상 테스트에 업체 확인 · 업체명 — spec 24건 + 1건 = 25건.
- 문서: AGENTS.md(M1 업체 확인), `docs/data-layer.md`(반영한 백엔드 수정 요청 기록).

## Modification - 261118-2 (ship 리뷰 고침 — `main-review-261118-5.md` #1 · #2 · #3 · #4 · #5 · #7 · #10)
- #1 · #10 로그인 실패 띠에 `role="alert"`(`Band` 에 선택 `role`), `loginManagerByRoute` 테스트 4건(`src/test/contracts/manager/api.test.ts`) · 화면 `[FAIL:login]` 1건.
- #2 업체 로그인 주소 안내 page 테스트 3건(`src/test/app/manager/login/page.test.tsx` — 쿠키 이동 · `manual=1` · 쿠키 없음/모양 틀림).
- #3 · #4 메뉴 `/` 경계 단언(`/manager/rooms-archive/` → 없음), 대시보드 테스트에 활성 업체 Context.
- #5 `POST /api/cookie/<area>/` 는 토큰을 저장하면 계정 쿠키를 지운다(`clearAccountCookie` — 계정은 로그인 route 만 쓴다).
- #7 `SmsVerification` 에 선택 `onPhoneChange` — 번호를 고치면 아이디 찾기 · 비밀번호 초기화의 단계 표시가 1단계로(테스트 1건).
- 검증: `npx tsc --noEmit` 오류 0, `npx vitest run` 67파일 334건 통과.
