# Review — main (Phase 9 마이페이지 · 입점 신청) — 261118-3

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: Phase 9 마이페이지 · 입점 신청 — #27 U10 마이페이지 · #28 ~ #30 U11 입점 신청 목록 · 작성 · 상세(파일), 공용 부품 넓히기(`MemberStateBand` `action` · `Band` `ok` · `CopyButton` `variant` · `full`), `ReservationPage.module.css` → `UserPage.module.css`, 표시 형식(`formatPhone` · `formatBusinessNumber` · `formatKoreanDate` · `digitsOnly`)
- 같은 작업 트리의 다른 변경: 개발용 테스트 로그인(로그인 화면 버튼 · `/api/user/test-login/` — 사용자 요청 2026-11-18) — Phase 9 와 따로 커밋한다.
- Change scope: 코드 · 테스트 약 40파일, DTO 8개, 문서 AGENTS.md · `docs/data-layer.md` · `conventions.md` · `integrations.md`, beaver 기록.
- 검증: `npx tsc --noEmit` 오류 0, `npx vitest run` 56파일 295건 통과(테스트 로그인 포함), React Compiler 회귀 테스트 통과.
- 리뷰 방식: 별도 에이전트가 읽기 전용으로 검토 → 지적마다 코드를 다시 읽어 확인.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `ApplicationFormType` · `ApplicationPageType` · `ThumbProps` · `MEMBER_TONE` · `APPLICATION_STATE` · `FILE_PURPOSE` · `FILE_MAX`, 주소 `[store_application_id]` · `store-applications` |
| Structure & layering | pass | page.tsx 4개 얇고 `<AuthGuard>`, 화면 전용 부품 `_components/`, 신청 화면들이 같이 쓰는 것은 `store-applications/store-application-format.ts` |
| Shared logic extraction | pass | 사유 입력 `ReasonModal` · 확인 `ConfirmModal` · 복사 `CopyButton` · 띠 `Band` · 올리기 `uploadFile` · 주소 `searchAddressWithCoords`. 공용 부품 변경은 기존 호출(예약 · 연장 · `/dev/ui`)을 바꾸지 않음 |
| Errors & responses | 아래 #1 · #3 | `handleApiError` · `showErrorPopup`, `alert` 없음 |
| Styles | pass(#6 제외) | 새 css 5개 · `Band.module.css` 의 `var(--…)` 모두 `globals.css` 에 있음, 날 색 없음, 옛 css 이름을 가리키는 곳 없음 |
| Test strength | pass | spec ✓ 8 + 계산 규칙 12 = 20건 |

## Intended Behavior Check (against plan/spec)
- spec 동작 흐름 · 결과 표와 코드가 맞는다(테스트 20건). 다만 큐 결과가 null 인 두 흐름에서 결과 판단이 spec 의도와 다르다 — #1(내 정보를 못 다시 읽으면 늦어짐으로 오인), #3(신청 취소 결과 null 을 취소됨으로 단정).
- spec 결정 "로그아웃은 첫 화면을 새로 연다"의 이유(로그인 가드가 먼저 로그인 화면으로 보냄)를 지금 코드가 막지 못한다 — #2.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | Medium | `src/app/(user)/_components/UserMeProvider.tsx:60-65` · `src/app/(user)/me/MyPageContent.tsx` | `reloadMe` 가 실패하면 이미 읽은 내 정보까지 null 로 덮는다 — 마이페이지에 들어올 때 다시 읽기가 실패하면 머리만 남고 로그아웃 버튼도 사라진다(예약 · 연장의 회원 상태 띠도 사라짐). 탈퇴가 됐는데 다시 읽기만 실패하면 "처리가 늦어지고 있어요"로 잘못 안내 | 실패하면 이전 값을 두고 null 을 돌려준다. 마이페이지는 로그아웃을 내 정보 밖에 두고, 못 읽으면 "다시 불러오기", 탈퇴 · 철회 뒤 null 은 "확인하지 못했어요" |
| 2 | Medium | `MyPageContent.tsx` `logout` · `src/app/RootLayoutContent.tsx:83-86` · `src/shared/components/AuthGuard.tsx:32-37` | `auth.logout()` 이 먼저 로그인 상태를 바꿔 로그인 가드가 로그인 화면(`?return_url=/me/`)으로 보내는 이동과 `location.assign('/')` 이 겹친다 — 로그인 화면이 깜빡이거나 그쪽으로 간다. 쿠키 삭제 실패(false)도 무시 | 화면 상태를 바꾸지 않고 `deleteAreaTokens('user')`(`src/shared/api/cookie.ts`) → 실패면 안내, 성공이면 `location.replace` |
| 3 | Medium | `src/app/(user)/store-applications/[store_application_id]/StoreApplicationDetailContent.tsx` `confirmCancel` | 취소 큐 결과가 null(done · pending 같음)인데 늘 "입점 신청을 취소했어요."로 목록 이동 — 늦어지면 목록에 대기로 남아 있고, 나중에 실패해도 이용자는 취소된 줄 안다 | null 뒤 상세를 다시 읽어 404 면 취소됨 · 목록, 남아 있으면 늦어짐 안내 · 다시 |
| 4 | Low | 같은 파일 상세 효과 `.catch` | `.then` 은 취소(abort)를 보지만 `.catch` 는 안 봐서, 떠난 뒤 온 404 가 안내 · 목록 이동을 일으킬 수 있다 | `.catch` 처음에 취소 확인 |
| 5 | Low | `src/app/(user)/store-applications/new/StoreApplicationFormContent.tsx` `submit` | 상호명 · 대표자명 · 아이디가 공백뿐이어도 `IsNotEmpty` 를 지나 백엔드로 간다 | 이 칸들을 다듬어(trim) 넘긴다 |
| 6 | Low | `src/app/css/user/MyPageContent.module.css` `.withdraw` · `src/shared/components/ui/display/Band.tsx:28` | 띠 내용이 flex 가 아닌 `div` 라 `align-self` 가 안 먹어 "탈퇴 철회" 버튼이 문장 옆에 붙는다(시안은 아래) | `.withdraw` 를 `display: block` 으로 |
| — | 참고 | `store-application-format.ts` `storeConsoleLoginUrl` | 빌드 때 `NEXT_PUBLIC_SERVER_URL` 이 비면 로그인 주소가 상대 주소(`/manager/…`)가 된다 — 설정 실수일 때만 | `.env.example` 에 이미 있는 값 — 조치 없음 |

## Verdict
Changes needed — Medium 3건(#1 · #2 · #3)과 Low(#4 · #5 · #6)를 고친 뒤 다시 리뷰(`-4`). 테스트 로그인은 지적 없음(개발 서버 · 카카오 키 없음일 때만 — 버튼 · route 같은 판단, 운영 · 키 있음 404 테스트).
