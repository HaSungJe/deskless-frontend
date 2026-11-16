# Report — 이용자 틀 · 로그인 · 가입 (Phase 5)

## Feature Summary
- **Feature**: 이용자 모바일 틀 · 카카오 · 네이버 로그인 · 가입 · 휴대폰 인증 · 아이디 찾기 — SNS ID 는 서버에만 두고 로그인 · 가입은 route handler 가 백엔드까지
- **Entry point**: `PAGE · ROUTE · MODULE (user)/layout · /login · /signup · /phone-verification · /find-login-id · GET /api/user/sns-login · POST /api/user/sign · /api/auth/[...nextauth]`
- **Domain**: user
- **Plan**: `.beaver/output/plan/user/user-login-plan.md` · roadmap Phase 5 (#14 ~ #18) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `package.json` · `package-lock.json` | modified | `jsonwebtoken` · `@types/jsonwebtoken` 제거(`npm uninstall`) |
| `.env.example` | modified | `NEXT_PUBLIC_JWT_CODE` · `GOOGLE_*` · `APPLE_*` 삭제, `NEXTAUTH_SECRET`(개발에서도 필요) · 카카오 · 네이버 콜백 안내 |
| `src/contracts/user/dto/` 7개 | created | `user-login` · `user-sign` · `user-me` · `user-phone-verification(-confirm)` · `user-find-login-id(-confirm)` — 지침서 사본(스크립트) |
| `src/contracts/user/api.ts` | modified | `loginUser` · `signUser` · `getMe` · `sendPhoneVerification` · `confirmPhoneVerification` · `sendFindLoginId` · `confirmFindLoginId` · `signWithSns` · `UserSignFormType` · `SignWithSnsResultType` |
| `src/shared/utils/area.ts` | modified | `toSamePath` export |
| `src/shared/utils/util.ts` | modified | `firstQueryValue` |
| `src/shared/api/queue.ts` | modified | `QUEUE_PENDING_MESSAGE` |
| `src/app/api/route-util.ts` | modified | `RouteBodyType.validation_errors` |
| `src/app/api/user/sns-session.ts` | created | `SnsAccountType` · `toSnsAccount`(Map — 상속 이름에 안 속음) · `readSnsAccount`(`getToken`) · `clearSnsSession` · `NO_SNS_CODE` · `INVALID_REQUEST_MESSAGE` |
| `src/app/api/user/sns-login/route.ts` · `src/app/api/user/sign/route.ts` | created | `GET`(303 상대 주소) · `POST` |
| `src/app/api/auth/[...nextauth]/route.ts` | rewritten | 카카오 · 네이버만, 세션 jwt 10분, `signIn` · `jwt` · `session` 콜백, `sns` 쿠키 · `jsonwebtoken` · Google · Apple · `useSecureCookies` · 직접 정한 pkce 쿠키 제거, `pages` → `/login/` |
| `src/app/api/cookie/sns/route.ts` | deleted | SNS 정보(access token 포함)를 브라우저에 돌려주던 route |
| `src/shared/api/cookie.ts` | modified | `SnsLoginType` · `getSNSAccessToken` · `deleteSNSAccessToken` 삭제 |
| `src/app/(user)/layout.tsx` · `UserLayoutContent.tsx` | created | 모바일 틀 · 주 탭 하단 탭 · 내 정보 Provider |
| `src/app/(user)/_components/UserMeProvider.tsx` · `UserTopBar.tsx` · `UserTabBar.tsx` · `MemberStateBand.tsx` | created | |
| `src/app/(user)/HomeContent.tsx` | modified | 머리(roomless · 로그인 / 내 예약) |
| `src/app/(user)/login/page.tsx` · `LoginContent.tsx` · `login-flow.ts` | rewritten · created | |
| `src/app/(user)/signup/page.tsx` · `SignupContent.tsx` · `dto.ts` · `birth.ts` | created | |
| `src/app/(user)/phone-verification/page.tsx` · `PhoneVerificationContent.tsx` | created | `AuthGuard` |
| `src/app/(user)/find-login-id/page.tsx` · `FindLoginIdContent.tsx` | created | |
| `src/app/css/user/` 7개 | created | `UserLayoutContent` · `UserTopBar` · `UserTabBar` · `HomeContent` · `LoginContent` · `SignupContent` · `UserFormPage` |
| `AGENTS.md` · `docs/architecture.md` · `docs/data-layer.md` · `docs/conventions.md` · `docs/error-handling.md` | modified | SNS 로그인 흐름(초안 표시) · 시크릿 줄 · 폴더 · 쿠키 표 · 이용자 route 표 · 근거 줄 번호 |

plan 과 다른 점: 없음(테스트 타입 두 곳만 — `reloadMe` mock 을 `vi.fn<UserMeContextType['reloadMe']>`, `LOGIN_RESULT` 의 null 칸 타입).

시안 맞춤(build 뒤 화면 확인 — 사용자 "시안대로 맞추기"):
- 상단 바 제목 20px · 뒤로 44px, 하단 탭 64px + 아이콘, U1 머리(로고 20px primary · 로그인 44px).
- 로그인 — 가운데 정렬, "카카오로 계속하기" · "네이버로 계속하기" + 아이콘, 네이버 글자 `--fg`.
- 가입 — SNS `Badge`, 성별 라디오 카드 두 칸(`Field group` — fieldset · legend), 닉네임 도움말 줄 오른쪽 `n/12`.
- 휴대폰 인증 — "인증하기" 를 아래 고정 영역에(`SmsVerification confirmPlacement="slot"` · createPortal).
- 아이디 찾기 — 제목 "어느 SNS 로 가입했는지 찾아요", 칸 옆 "확인"(`confirmPlacement="inline"` · `notice={false}`), 폼 아래 결과 카드, 아래 고정 "로그인하러 가기".
- 공통 부품: `Field` 에 `group` · `hint` ReactNode, `SmsVerification` 에 `confirmPlacement` · `confirmSlot` · `notice`, 칸 사이 24px(시안).

## Tests Written
- TDD — `src/test/app/(user)/signup/birth.test.ts`(8) · `src/test/app/api/user/sns-session.test.ts`(4 + `'constructor'` 1) · `src/test/app/(user)/login/login-flow.test.ts`(`afterLoginPath` 6 + callbackUrl · 오류 주소 · 문구)
- route — `src/test/app/api/user/sns-login.test.ts`(성공 · 404 · SNS 없음 · 503/응답 없음/400) · `sign.test.ts`(성공 · 칸 오류 · NO_SNS · csrf · pending)
- 화면 — `LoginContent`(시작 · 오류 · 이미 로그인) · `SignupContent`(검증 · 성공 · NO_SNS) · `PhoneVerificationContent`(인증됨 · 아직) · `FindLoginIdContent`(결과 · pending) · `UserMeProvider`(로그인 · 로그아웃) · `MemberStateBand`(BLOCK · LEAVE_WAIT · 그 밖)
- 테스트 생략(위임형): `UserTopBar` · `UserTabBar` · `(user)/layout` · next-auth 설정 · contracts 함수 · `page.tsx` — plan 그대로
- build 는 테스트를 실행하지 않는다 — 실행은 `/beaver:test`(또는 `npx vitest run`).

## Verification
- `npx next typegen && npx tsc --noEmit` — 오류 0(테스트 타입 두 곳을 고친 뒤).
- 계층 방향: `shared` → `contracts` · `app` import 없음, `contracts` → `app` 없음(grep). `app/api/user` → `app/(user)/login/login-flow` 는 app 안.
- 지운 것: `SnsLoginType` · `getSNSAccessToken` · `deleteSNSAccessToken` · `/api/cookie/sns` · `jsonwebtoken` · `NEXT_PUBLIC_JWT_CODE` · `GOOGLE_LOGIN` · `APPLE_LOGIN` · `/sign/in` · `/sign/sns` — `src` · `.env.example` · AGENTS.md · docs 에 남은 것 없음(grep).
- 보안: SNS 계정은 next-auth 세션 토큰에만(`session` 콜백은 만료만 돌려줌), `sns_user_id` 는 서버 route 만 읽는다. 가입 route 는 본문의 `sns_*` 를 쓰지 않고 세션 것만. route 둘 다 SNS 세션이 없으면 백엔드를 부르지 않는다.
- 구조 규칙: 새 컴포넌트 · 화면 — 변수 > 상태 > 계산 값 > 효과 > 함수 > JSX, 주석(읽어서 확인). `UserMeProvider` 는 효과 본문에서 바로 `setState` 하지 않고 Promise 뒤, 로그아웃 때 `me` 는 계산 값으로 null.
- spec 대조: Business Rules(SNS 로그인 · 가입 · 휴대폰 인증 · 아이디 찾기 · 이용자 틀 · 지우는 것) — 빠진 것 없음.

## Remaining Issues
- 테스트 미실행 — `/beaver:test`. 처음 도는 것: `NextRequest` + `next-auth/jwt` mock 의 route, `(user)` 경로(괄호 폴더) 테스트, `next/link` 를 그리는 화면.
- `npm run lint` 는 사용자 실행.
- 화면 확인(사용자): `.env.local` 에 `NEXTAUTH_SECRET` · 카카오 · 네이버 키(콜백 `http://localhost:5000/api/auth/callback/kakao` · `/naver` 등록) → `/login/` → SNS 로그인 → 가입 → 휴대폰 인증. 하단 탭의 "내 예약" · "마이"는 Phase 8 · 9 화면이 생기기 전까지 404.
- 백엔드 위험(전달 대상): `user/login` · `user/sign` 이 `sns_user_id` 를 SNS 토큰 확인 없이 믿는다 — 프론트는 브라우저에 내보내지 않는 것까지만.
- 매니저 · 관리자 로그인 IP 문제는 그대로(백엔드 완화 요청 대기) — 이용자는 로그인도 서버가 불러 해당 없음.
