# Review — main (Phase 5 이용자 틀 · 로그인 · 가입) — 261116-3

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: Phase 5 이용자 틀 · 로그인 · 가입 — #14 이용자 틀(상단 바 · 하단 탭 · 내 정보 Provider · 회원 상태 띠) · #15 카카오 · 네이버 로그인(next-auth + `GET /api/user/sns-login/`) · #16 가입(`POST /api/user/sign/`) · #17 휴대폰 인증 · #18 아이디 찾기. 화면 확인 뒤 시안(`frontend/design/user.html`)대로 맞춤
- Change scope: 코드 · 테스트 약 60파일(새 · 고침 · 삭제 1 — `src/app/api/cookie/sns/route.ts`), `package.json` · `package-lock.json`(`jsonwebtoken` 제거), `.env.example`, `vitest.config.mts`, 문서 AGENTS.md · docs 6개, beaver 기록(spec · plan · report · 로드맵 · spec 보드 · 이 문서). 같은 날 Phase 3 · 4 리뷰가 있어 `-3`.
- 검증: `npx vitest run` 32파일 168건 통과(처음 157건 중 3건 실패 — 아래 #9), `npx next typegen && npx tsc --noEmit` 오류 0. `npm run lint` · 화면 확인은 사용자(화면은 시안 맞춤 뒤 확인 완료).
- 리뷰 방식: 별도 에이전트가 읽기 전용으로 검토(Next · next-auth 소스, Node 로 URL 해석 확인까지) → 지적을 코드 · Node 로 다시 확인한 뒤 고침.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `SnsAccountType` · `UserMeContextType` · `SignWithSnsResultType` · `SmsConfirmPlacementType`, 상수 UPPER_SNAKE(`NO_SNS_CODE` · `SNS_EXPIRED_MESSAGE` · `PHONE_UNVERIFIED_MESSAGE` · `QUEUE_PENDING_MESSAGE`), 주소 kebab-case(`/phone-verification/` · `/find-login-id/`) |
| Structure & layering | pass | page.tsx 는 서버 컴포넌트로 `<화면>Content` 만, 화면 전용 부품은 `(user)/_components/`, css 는 `src/app/css/user/`. `app/api/user` → `app/(user)/login/login-flow` 는 app 안. `shared` → `contracts` · `app` import 없음 |
| Shared logic extraction | pass | `toSamePath` 를 `area.ts` 에서 export(로그인 흐름이 재사용), `firstQueryValue` → `util.ts`, `QUEUE_PENDING_MESSAGE` → `queue.ts`. 가입 성별 카드는 한 화면만 써서 화면 안에, 대신 `Field group`(fieldset · legend)을 공통으로 |
| Errors & responses | pass | route 는 200 + `{success, data?, code?, message?, validation_errors?, retry?}`, 화면은 `handleApiError` · `showErrorPopup`. 큐 결과 없음은 다시 조회(가입 route — #4) |
| Test strength | pass (#8 보강) | TDD `formatBirthInput` · `toSnsAccount` · `afterLoginPath`, route 는 `NextRequest` + `next-auth/jwt` · `next/headers` mock 으로 호출 횟수 · 인자 · 실패 뒤 미호출. 리뷰 뒤 11건 더함 |

## Intended Behavior Check (against plan/spec)
- spec Business Rules(SNS 로그인 · 가입 · 휴대폰 인증 · 아이디 찾기 · 이용자 틀 · 지우는 것) — 코드 · 테스트가 맞다. 사용자 결정(next-auth + 서버가 로그인, AuthGuard 는 필요한 화면에만, 생년월일 숫자 자동 형식, SNS 계정은 서버에만) 반영.
- SNS 계정이 브라우저에 나가지 않는다 — 리뷰 에이전트가 확인: `session` 콜백은 `expires` 만, `jwt` 콜백은 `sns_id` · `sns_user_id` 만, `sns` query 는 KAKAO · NAVER 만, 가입 route 는 본문의 `sns_*` 를 버린다.
- DTO 7개는 `frontend/dto/user.md` 사본 그대로, U5 흐름(로그인 404 → `/signup` → `/phone-verification`)은 `frontend/screens.md` 와 같다.
- 화면 확인 뒤 시안 맞춤(상단 바 · 하단 탭 아이콘 · 로그인 가운데 정렬 · "계속하기" · 성별 카드 · 닉네임 글자 수 줄 · 인증하기 아래 고정 · 아이디 찾기 칸 옆 확인 + 결과 카드) — report "시안 맞춤". 시안과 다르게 둔 것: 아이디 찾기의 남은 시간 표시(만료는 같아서).
- 초안 규약(AGENTS.md 경고 줄 · Auth "SNS 로그인" · Checklist 시크릿 줄, `docs/data-layer.md` 이용자 route 표)을 코드와 대조해 맞추고(#2 · #4 반영) 초안 표시를 지워 확정했다. 지난 근거도 고침: `auth.ts:30` → `:31`, "AuthGuard 호출처 0" → 이용자는 로그인이 필요한 화면 page 만(`phone-verification/page.tsx`).
- memory: 미반영 항목 없음(`.beaver/memory/MEMORY.md`).

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | High | `src/shared/utils/area.ts` (`toSamePath`) | `new URL('/..//evil.com', base)` 는 점 경로를 풀어 path `//evil.com` · 같은 origin 이 되어 통과 — 로그인한 이용자가 `/login/?return_url=/..//evil.com` 을 열면 `router.replace('//evil.com')` 로 다른 사이트(basePath 가 빈 기본 설정). Node 로 확인 | 고침 — 해석 뒤 path 가 `//` 로 시작하면 null. 테스트(점 경로 5가지 + 막지 않을 `/stores/../me/`) |
| 2 | Medium | `src/app/api/user/sns-session.ts` (`clearSnsSession`) | https 에서 next-auth 쿠키는 `__Secure-` · `__Host-` 이름인데 `delete(name)` 은 Secure 없이 써서 브라우저가 무시(쿠키 접두사 규칙) — SNS 세션이 10분 남아 공용 기기에서 로그아웃 뒤 `/api/user/sns-login/` 이 이전 사람으로 로그인시킬 수 있다 | 고침 — 접두사면 `secure: true` · `path: '/'` 로 지움. 테스트 |
| 3 | Medium | `login-flow.ts` callbackUrl · `[...nextauth]` `pages` · `signIn` · `contracts/user/api.ts` `/api/user/sign/` | basePath(`NEXT_PUBLIC_LOCAL_SERVER_PREFIX`)를 붙이지 않아 하위 경로 배포에서 SNS 로그인이 404 | 미룸 — Phase 2 부터의 `cookie.ts` route 호출도 같은 문제라 프로젝트 전체를 한 번에(따로 작업) |
| 4 | Medium | `src/app/api/user/sign/route.ts` | 큐가 결과 없이 끝나면(pending · 응답 없음) "다시 시도" 만 — 가입이 이미 끝났을 수 있어 다시 누르면 중복 오류로 막힐 수 있다(규약: null 이면 다시 조회) | 고침 — `user/login` 으로 한 번 다시 조회해 토큰이 오면 성공. 테스트 3건 |
| 5 | Low | `src/app/(user)/signup/SignupContent.tsx` (`submit`) | 성공 뒤 `finally` 가 버튼을 다시 켜, 이동 전에 또 누르면 세션이 지워져 NO_SNS → "만료" 팝업 · 로그인 화면 | 고침 — 실패 때만 버튼을 다시 켬. 테스트 |
| 6 | Low | `src/app/api/auth/[...nextauth]/route.ts` (`pages.error`) | OAuth 취소 · 실패면 next-auth 가 `/login/?error=` 로 보내 `return_url` 이 사라짐 — 다시 로그인하면 첫 화면으로 | 받아들임 — 다시 로그인은 되고 돌아갈 화면만 첫 화면. next-auth 오류 주소에 값을 실어 보낼 방법이 없다 |
| 7 | Low | `src/app/api/route-util.ts` (`isSameSiteJson`) | `includes('application/json')` 이라 `text/plain; application/json`(단순 요청 — 사전 확인 없음)도 통과. 지금은 next-auth 쿠키가 SameSite=Lax 라 악용 안 됨 | 고침 — `;` 앞 MIME 만 비교. 테스트 |
| 8 | Low | `src/test/…` | 빠진 테스트 — `signWithSns` 응답 해석, 가입 화면 서버 칸 오류, 가입 route 다른 사이트 요청, #1 · #2 · #4 경우 | 고침 — 11건 더함(168건). next-auth 콜백은 route 파일 안 설정이라 테스트 생략(plan 그대로) |
| 9 | Low | `vitest.config.mts` | 테스트에서 `next/link` 가 `href` 끝 `/` 를 뗌 — `trailingSlash` 는 next build 가 `__NEXT_TRAILING_SLASH` 로 넣는 값이라 테스트에 없음(3건 실패) | 고침 — `test.env.__NEXT_TRAILING_SLASH`, docs/testing.md 에 적음 |

## Verdict
Pass — #1 · #2 · #4 · #5 · #7 ~ #9 는 고쳤고(테스트 168건 · 타입 체크 통과), #6 은 이유를 적어 받아들이고, #3 은 프로젝트 전체 basePath 작업으로 미룬다. 커밋으로 진행.
