---
feature_goal: "이용자 모바일 틀 · 카카오 · 네이버 로그인 · 가입 · 휴대폰 인증 · 아이디 찾기 — SNS ID 는 서버에만 두고 로그인 · 가입은 route handler 가 백엔드까지"
domain: "user"
roadmap_phase: 5
api_method: "PAGE · ROUTE · MODULE"
api_path: "(user)/layout · /login · /signup · /phone-verification · /find-login-id · GET /api/user/sns-login · POST /api/user/sign · /api/auth/[...nextauth]"
affected_data: ["쿠키 user_access_token · user_refresh_token (httpOnly — 로그인 · 가입 route 가 심는다)", "next-auth 세션 쿠키(SNS 계정 — 10분, 로그인 · 가입이 끝나면 지운다)"]
---

## Feature Description
이용자 화면의 모바일 틀(390px 기준 · 하위 화면 상단 바 · 주 탭 하단 탭)을 깔고, 카카오 · 네이버 로그인 → 가입 → 휴대폰 인증 → 돌아갈 주소, 아이디 찾기를 만든다.
백엔드 `user/login` · `user/sign` 은 넘겨받은 `sns_user_id` 를 그대로 믿으므로, 검증된 SNS ID 는 next-auth 세션(서버)에만 두고 route handler 가 백엔드를 불러 이용자 토큰 쿠키를 심는다 — 브라우저는 SNS ID · SNS 토큰을 보지 못한다(사용자 결정).
함께: 쓰지 않는 Google · Apple 로그인, `sns` 쿠키 · `/api/cookie/sns` · `NEXT_PUBLIC_JWT_CODE` · `jsonwebtoken` 을 걷어낸다.

## 진입점
- Method: PAGE(화면) · ROUTE(route handler) · MODULE(contracts · 계산 함수)
- Path:
  - **#14 이용자 틀**
    - `src/app/(user)/layout.tsx` → `UserLayoutContent` — 모바일 틀(가운데 · 최대 480px), 주 탭 주소(`/` · `/reservation/` · `/me/`)면 하단 탭(지도 · 내 예약 · 마이), 내 정보 Context
    - `src/app/(user)/_components/UserMeProvider.tsx` — `UserMeContext` `{me, reloadMe}`: 로그인했으면 `GET user/me`(앱을 열 때 · 로그인한 뒤), 아니면 `null`
    - `src/app/(user)/_components/UserTopBar.tsx`(뒤로 · 제목) · `UserTabBar.tsx`(하단 탭) · `MemberStateBand.tsx`(BLOCK · LEAVE_WAIT 띠 — 화면은 U3 · U9 · U10 Phase 에서 붙인다)
    - U1 자리(`HomeContent`)의 머리 — "deskless" + 로그인 안 했으면 "로그인", 했으면 "내 예약"
  - **#15 SNS 로그인**
    - `/login/` `LoginContent` — 카카오 · 네이버 버튼 → next-auth `signIn(provider, {callbackUrl: /api/user/sns-login/?return_url=…})`, `?error=` 이면 안내 팝업, 이미 로그인했으면 돌아갈 주소로
    - `src/app/api/auth/[...nextauth]/route.ts` — 카카오 · 네이버만, 세션 10분, `jwt` 콜백이 `toSnsAccount` 로 `sns_id` · `sns_user_id` 를 세션 토큰에만(화면에 주는 세션에는 넣지 않는다)
    - `GET /api/user/sns-login/?return_url=` — next-auth 세션의 SNS 계정으로 백엔드 `user/login` → 이용자 토큰 쿠키 · SNS 세션 지움 → `afterLoginPath` 로 / 가입 전(404) → `/signup/?sns=<KAKAO|NAVER>&return_url=` / 실패 → `/login/?error=<code>` (303)
  - **#16 가입**: `/signup/` `SignupContent` — 성별 · 생년월일(숫자만 쳐도 `YYYY-MM-DD`) · 닉네임(12자 · 글자 수) → `POST /api/user/sign/` → 백엔드 `user/sign`(큐) → 이용자 토큰 쿠키 · SNS 세션 지움 → 휴대폰 인증
  - **#17 휴대폰 인증**: `/phone-verification/` `PhoneVerificationContent`(로그인 필요 — `AuthGuard`) — `SmsVerification` 에 `user/phone-verification` · `/confirm`(큐) → 내 정보를 다시 읽어 인증됐으면 돌아갈 주소로
  - **#18 아이디 찾기**: `/find-login-id/` `FindLoginIdContent`(공개) — `SmsVerification` 에 `user/find-login-id` · `/confirm`(큐) → 가입한 SNS · 가입일 + "로그인하러 가기"
  - contracts `src/contracts/user/api.ts` — `loginUser` · `signUser`(서버 route 가 부름) · `getMe` · `sendPhoneVerification` · `confirmPhoneVerification` · `sendFindLoginId` · `confirmFindLoginId` · `signWithSns`(화면 → 가입 route), DTO 사본 7개
- Request
  - `GET /api/user/sns-login/` query `return_url`(같은 사이트 주소만 — `safeReturnPath`)
  - `POST /api/user/sign/` 본문 `{gender, birth, nickname}`(같은 사이트 JSON) — `sns_id` · `sns_user_id` 는 서버가 세션에서
- Response
  - `GET /api/user/sns-login/` — 303 리다이렉트만(위)
  - `POST /api/user/sign/` — 200 `{success: true, data: {is_phone_verified}}` / `{success: false, code: 'NO_SNS'}`(SNS 세션 없음 · 만료) / `{success: false, message, validation_errors}`(백엔드 실패 그대로 — 미성년 `birth` 칸 오류) / `{success: false, message, retry: true}`(응답 없음 · 큐 pending)

## Business Rules
- **SNS 로그인(사용자 결정 — next-auth + 서버가 로그인)**
  - 백엔드는 카카오 · 네이버만(`UserLoginDto.sns_id` — `NAVER` · `KAKAO`) → next-auth 공급자도 둘만. Google · Apple 공급자 · 환경 변수를 지운다.
  - SNS 계정(`sns_id` · `sns_user_id`)은 next-auth JWT 세션 쿠키(httpOnly · `NEXTAUTH_SECRET` 암호화)에만 둔다. `/api/auth/session` 이 돌려주는 세션에는 넣지 않는다(이름 · 메일 · 사진도 빼고 만료만).
  - SNS 세션은 10분(`session.maxAge`) — 로그인 · 가입을 마치는 데만 쓰고, 이용자 토큰을 심으면 next-auth 쿠키를 모두 지운다.
  - 로그인 route 는 Next 서버가 백엔드를 부르므로 로그인 IP 와 재발급 IP 가 같아진다(백엔드 재발급 IP 검사 문제가 이용자 영역에서는 생기지 않는다).
  - 로그인 결과: 200 → 이용자 토큰 쿠키(`setTokenCookies(…, 'user', …)`) → `afterLoginPath(is_phone_verified, return_url)`. 404(가입하지 않은 SNS 계정) → `/signup/?sns=…&return_url=…`(SNS 세션은 둔다). 그 밖 4xx → `/login/?error=login`, 5xx · 응답 없음 → `/login/?error=retry`, SNS 세션 없음 → `/login/?error=sns`.
  - 로그인 화면 `?error=` 안내: `sns`(+ next-auth 오류 코드) "SNS 로그인을 마치지 못했어요. 다시 시도해 주세요." · `login` "로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요." · `retry` "서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요." — 띄운 뒤 주소에서 `error` 를 지운다.
  - 이용 제한(BLOCK) · 탈퇴 대기(LEAVE_WAIT)도 로그인은 된다(백엔드 그대로) — 안내는 `MemberStateBand`(필요한 화면에서).
- **가입**(시안 U5 가입)
  - 칸: 성별(남 `M` · 여 `F`) · 생년월일 · 닉네임. 검증은 화면 DTO `SignupDto`(지침서 `UserSignDto` 의 세 칸과 같은 데코레이터 · 메시지) → `validateAction`.
  - 생년월일은 숫자만 쳐도 `formatBirthInput` 이 `YYYY-MM-DD` 로(사용자 결정). 만 19세 확인은 서버에만(사용자 결정) — 미성년이면 400 `validation_errors` 의 `birth` 가 칸 옆에.
  - 닉네임 옆 글자 수 `n/12`. 위에 "<카카오|네이버> 계정으로 가입해요"(주소 `sns` — 보이기만, 믿지 않음).
  - 성공 → `afterLoginPath(0, return_url)`(가입하면 휴대폰 인증 전). `NO_SNS` → "SNS 로그인 정보가 만료됐어요. 다시 로그인해 주세요." 팝업 → `/login/`(return_url 유지).
- **휴대폰 인증**(로그인 필요 — page 가 `AuthGuard` 로 감싼다)
  - `SmsVerification` — 발송 `UserPhoneVerificationDto` 검증 → `sendPhoneVerification`(큐) → `{sms_verification_id, expires_at}`, 큐 pending 이면 "처리가 늦어지고 있어요. 잠시 뒤 다시 시도해 주세요." 팝업 · `null`.
  - 확인 `UserPhoneVerificationConfirmDto` → `confirmPhoneVerification`(큐 — 응답 DTO 가 null 이라 done · pending 이 같은 `null`) → `reloadMe()` → `is_phone_verified` 1 이면 돌아갈 주소(`safeReturnPath`)로, 아니면 "인증 결과를 확인하지 못했어요. 다시 시도해 주세요." 팝업.
  - 틀린 번호 · 횟수 초과 · 하루 한도는 백엔드 `message` 그대로(`handleApiError`).
- **아이디 찾기**(공개)
  - `SmsVerification` — `UserFindLoginIdDto` → `sendFindLoginId` / `UserFindLoginIdConfirmDto` → `confirmFindLoginId` → 결과 카드 "<카카오|네이버>로 가입했어요 · 가입일 YYYY년 M월 D일"(`lookupName('sns_id', …)` · `toKst`) + "로그인하러 가기"(`/login/`). 확인 pending(`null`) → 같은 늦어짐 팝업.
- **이용자 틀**(시안 규칙: 너비 390px · 주 탭 하단 탭 · 하위 화면 상단 바)
  - 틀은 가운데 · 최대 480px · 화면 높이 꽉. 하단 탭은 `/` · `/reservation/` · `/me/` 에서만(지금 있는 화면은 `/` 뿐 — 내 예약 · 마이는 Phase 8 · 9).
  - 내 정보 `UserMeContext`: `auth.isLogin` 이면 `getMe` 한 번(로그인 상태가 바뀔 때 다시), 실패는 조용히(`me` 는 `null`). `reloadMe()` 는 다시 읽어 돌려준다.
  - `MemberStateBand`: BLOCK — "이용이 제한된 계정이에요" + 정지 사유 `block_comment` + "로그인과 기존 예약 이용은 되지만 새 예약 · 연장은 할 수 없어요." / LEAVE_WAIT — "탈퇴 대기 중이에요" + `leave_reserved_at` 한국 시각 "YYYY년 M월 D일 HH:mm에 탈퇴돼요. 그 전까지 철회할 수 있어요." + "탈퇴 철회하기"(`/me/`) / 그 밖 — 그리지 않음(사용자 결정 — 필요한 화면에만).
- **지우는 것**: next-auth 의 Google · Apple 공급자 · `/sign/in` · `/sign/sns` 주소, `sns` 쿠키 · `src/app/api/cookie/sns/route.ts` · `cookie.ts` 의 `getSNSAccessToken` · `deleteSNSAccessToken` · `SnsLoginType`, `jsonwebtoken` · `@types/jsonwebtoken` 패키지, `.env.example` 의 `NEXT_PUBLIC_JWT_CODE` · `GOOGLE_*` · `APPLE_*`, `/login` 자리 표시.

## TDD Cases
- [ABOUT:formatBirthInput] 생년월일 칸에 친 글자를 숫자만 골라 YYYY-MM-DD 모양으로 바꾼다 // 숫자를 8자리까지 쓰고, 4자리 뒤 · 6자리 뒤에 '-' 를 넣는다(치는 중에도)
- [CASES:formatBirthInput] `'1998'` → `'1998'` // 4자리까지는 연도만
- [CASES:formatBirthInput] `'19980'` → `'1998-0'` // 치는 중 — 5자리면 연도 뒤에 '-'
- [CASES:formatBirthInput] `'199803'` → `'1998-03'` // 6자리면 연-월
- [CASES:formatBirthInput] `'19980314'` → `'1998-03-14'` // 8자리면 연-월-일
- [CASES:formatBirthInput] `'1998.03.14'` → `'1998-03-14'` // 숫자 아닌 글자는 버리고 다시 모양을 맞춤(시안의 잘못된 예)
- [CASES:formatBirthInput] `'1998-03-14'` → `'1998-03-14'` // 이미 모양대로 붙여 넣어도 그대로
- [CASES:formatBirthInput] `'199803141'` → `'1998-03-14'` // 8자리 넘는 숫자는 자름
- [CASES:formatBirthInput] `''` → `''` // 빈 칸은 빈 칸
- [ABOUT:toSnsAccount] next-auth 공급자 · 계정 ID 를 백엔드가 받는 SNS 계정({sns_id, sns_user_id})으로 바꾼다 // 공급자가 kakao · naver 이고 계정 ID 가 있을 때만 — 그 밖은 null(로그인시키지 않음)
- [CASES:toSnsAccount] `('kakao', '1234567890')` → `{sns_id: 'KAKAO', sns_user_id: '1234567890'}` // 카카오는 KAKAO
- [CASES:toSnsAccount] `('naver', 'aBc-123_xyz')` → `{sns_id: 'NAVER', sns_user_id: 'aBc-123_xyz'}` // 네이버는 NAVER
- [CASES:toSnsAccount] `('google', '1234')` → `null` // 백엔드는 카카오 · 네이버만 받음
- [CASES:toSnsAccount] `('kakao', '')` → `null` // 계정 ID 가 없으면 누구로 로그인할지 모름 — 백엔드가 그대로 믿으니 빈 값은 막음
- [ABOUT:afterLoginPath] 로그인 · 가입을 마친 뒤 갈 주소를 정한다 // 휴대폰 인증 전이면 휴대폰 인증(돌아갈 주소를 들고), 인증했으면 같은 사이트 돌아갈 주소 또는 첫 화면
- [CASES:afterLoginPath] `(0, '/stores/1/')` → `'/phone-verification/?return_url=%2Fstores%2F1%2F'` // 인증 전이면 휴대폰 인증 먼저 — 끝나면 돌아갈 주소로
- [CASES:afterLoginPath] `(0, null)` → `'/phone-verification/'` // 돌아갈 주소가 없으면 붙이지 않음
- [CASES:afterLoginPath] `(0, 'https://evil.com/')` → `'/phone-verification/'` // 다른 사이트 주소는 들고 가지 않음
- [CASES:afterLoginPath] `(1, '/stores/1/?date=2026-11-20')` → `'/stores/1/?date=2026-11-20'` // 인증했으면 돌아갈 주소로(query 그대로)
- [CASES:afterLoginPath] `(1, null)` → `'/'` // 돌아갈 주소가 없으면 첫 화면
- [CASES:afterLoginPath] `(1, '//evil.com')` → `'/'` // 다른 사이트 주소는 버림(safeReturnPath)
- [ABOUT:GET /api/user/sns-login/] next-auth 세션의 SNS 계정으로 백엔드 로그인을 하고 다음 화면으로 보낸다 // SNS 세션이 있을 때만 백엔드를 부르고, 결과(성공 · 가입 전 · 실패)마다 정해진 주소로 303
- [SUCCESS] GET /api/user/sns-login/ — SNS 세션 KAKAO · 백엔드 200(`is_phone_verified` 0) → 백엔드 `user/login` 1회(본문 `{sns_id, sns_user_id}`) · `user_access_token` · `user_refresh_token` 저장 · next-auth 쿠키 삭제 · 303 `/phone-verification/?return_url=…` // 검증된 SNS 계정으로 로그인 성공 — 인증 전이라 휴대폰 인증으로
- [FAIL:not-signed] GET /api/user/sns-login/ — 백엔드 404 → 303 `/signup/?sns=KAKAO&return_url=…`, 토큰 쿠키 저장 0 · next-auth 쿠키는 둠 // 가입하지 않은 SNS 계정 — 가입에 SNS 세션이 필요
- [FAIL:no-sns] GET /api/user/sns-login/ — SNS 세션 없음 → 303 `/login/?error=sns`, 백엔드 0회 // 검증된 SNS 계정이 없으면 로그인시키지 않음
- [FAIL:retry] GET /api/user/sns-login/ — 백엔드 503 · 응답 없음 → 303 `/login/?error=retry` // 일시 장애 — 다시 로그인하면 됨
- [ABOUT:POST /api/user/sign/] 가입 칸(성별 · 생년월일 · 닉네임)에 서버 세션의 SNS 계정을 붙여 백엔드 가입을 한다 // 같은 사이트 JSON 이고 SNS 세션이 있을 때만 백엔드를 부르고, 백엔드 실패는 칸 오류까지 그대로 돌려준다
- [SUCCESS] POST /api/user/sign/ — SNS 세션 NAVER · 큐 done → 백엔드 `user/sign` 1회(본문 `{sns_id: 'NAVER', sns_user_id, gender, birth, nickname}`) · 토큰 쿠키 저장 · next-auth 쿠키 삭제 → `{success: true, data: {is_phone_verified: 0}}` // 가입 완료 — 화면은 휴대폰 인증으로
- [FAIL:validation] POST /api/user/sign/ — 큐 failed 400 `validation_errors: [{property: 'birth', …}]` → `{success: false, message, validation_errors}`, 토큰 쿠키 0 // 미성년 등 백엔드 검증 실패를 칸 옆에 보이도록 그대로
- [FAIL:no-sns] POST /api/user/sign/ — SNS 세션 없음 → `{success: false, code: 'NO_SNS'}`, 백엔드 0회 // SNS 세션이 만료(10분)됐으면 다시 로그인
- [FAIL:csrf] POST /api/user/sign/ — `Content-Type: text/plain` → `{success: false, message: '잘못된 요청입니다.'}`, 백엔드 0회 // 다른 사이트 form 이 가입을 부르는 것 막기 — 같은 사이트 JSON 만
- [ABOUT:SignupContent] 가입 칸을 검증해 가입 route 를 부르고 결과에 따라 이동한다 // 화면 DTO 를 통과할 때만 route 를 부르고, 성공이면 휴대폰 인증 · 세션 만료면 로그인으로
- [FAIL:validation] SignupContent — 닉네임 `'고양이!'` · 성별 없음 → 칸 옆 오류, route 0회 // DTO 규칙(특수문자 불가 · 성별 필수)을 어기면 보내지 않음
- [SUCCESS] SignupContent — 생년월일 `'19980314'` 입력 · 가입 → 칸에 `'1998-03-14'`, route 1회(본문 `{gender, birth: '1998-03-14', nickname}`) → `router.replace('/phone-verification/?return_url=…')` // 숫자만 쳐도 DTO 형식 — 가입하면 휴대폰 인증 전
- [FAIL:no-sns] SignupContent — route `NO_SNS` → 만료 팝업 · `router.replace('/login/?return_url=…')` // SNS 세션이 없으면 가입할 수 없음
- [ABOUT:PhoneVerificationContent] 인증번호 확인 뒤 내 정보를 다시 읽어 인증됐는지 보고 이동한다 // 확인 API 는 결과가 null(done · pending 같음)이라 내 정보의 is_phone_verified 가 1 일 때만 성공
- [SUCCESS] PhoneVerificationContent — 확인 → `reloadMe` 1회 → `is_phone_verified` 1 → `router.replace(return_url)` // 다시 읽은 내 정보가 인증됨
- [FAIL:unverified] PhoneVerificationContent — 확인 뒤 `is_phone_verified` 0 → "인증 결과를 확인하지 못했어요." 팝업 · 이동 0 // 처리가 늦어졌거나 실패 — 다시 시도하게
- [ABOUT:LoginContent] 카카오 · 네이버 버튼으로 next-auth 로그인을 시작하고, 돌아온 오류를 안내한다 // callbackUrl 은 로그인 route + 같은 사이트 돌아갈 주소, error 가 있으면 한 번 안내
- [SUCCESS] LoginContent — "카카오로 시작하기" → `signIn('kakao', {callbackUrl: '/api/user/sns-login/?return_url=%2Fstores%2F1%2F'})` 1회 // 돌아갈 주소를 로그인 route 까지 들고 감
- [FAIL:error] LoginContent — `?error=retry` → 연결 안내 팝업 1회 // 로그인 route 가 알린 실패를 이용자에게
- [ABOUT:UserMeProvider] 로그인한 이용자의 내 정보를 읽어 화면들에 나눠 준다 // 로그인했을 때만 user/me 를 부르고, 로그인 안 했으면 null
- [SUCCESS] UserMeProvider — 로그인함 → `GET /user-service/user/me` 1회(Bearer 토큰) → `me` // 로그인한 이용자만 내 정보가 있음
- [FAIL:logged-out] UserMeProvider — 로그인 안 함 → 호출 0회 · `me` `null` // 토큰 없이 부르면 401 — 부르지 않음
- [ABOUT:MemberStateBand] 회원 상태가 이용 제한 · 탈퇴 대기면 안내 띠를 그린다 // BLOCK 은 정지 사유, LEAVE_WAIT 는 탈퇴 예정 시각 + 철회 링크, 그 밖은 그리지 않음
- [SUCCESS] MemberStateBand — BLOCK · `block_comment` → "이용이 제한된 계정이에요" + 사유 // 정지 사유를 그대로 보여 줌
- [SUCCESS] MemberStateBand — LEAVE_WAIT · `'2026-11-24 15:20:00'` → "2026년 11월 24일 15:20에 탈퇴돼요" + `/me/` 링크 // 탈퇴 예정 시각과 철회 길
- [FAIL:active] MemberStateBand — ACTIVE → 아무것도 그리지 않음 // 정상 회원에게는 띠가 없음
- [ABOUT:FindLoginIdContent] 인증번호로 확인한 휴대폰의 가입 SNS · 가입일을 보여 준다 // 확인 결과가 있을 때만 결과 카드, pending(null)이면 늦어짐 안내
- [SUCCESS] FindLoginIdContent — 확인 결과 `{sns_id: 'KAKAO', created_at}` → "카카오로 가입했어요" · 가입일 · "로그인하러 가기"(`/login/`) // 가입한 SNS 를 이름으로
- 테스트 생략(위임형): `UserTopBar` · `UserTabBar`(링크만) · `(user)/layout` · next-auth 설정(공급자 · 콜백 — 계정 변환은 `toSnsAccount` TDD) · contracts 함수(request · callQueue · withAuth 를 부르기만) · `page.tsx` · 지우는 것

## Notes
- 지침서: frontend/screens.md U5(:89-104) · U1 머리 · U10 상태 띠, frontend/api.md "로그인", DTO frontend/dto/user.md(user-login · user-sign · user-me · user-phone-verification(-confirm) · user-find-login-id(-confirm)).
- 시안: 로그인 `frontend/design/user.html:839-871`(뒤로 · 브랜드 · 카카오 · 네이버 버튼 · 안내 · 아이디 찾기 링크), 가입 `:872-918`(SNS 표시 · 성별 라디오 · 생년월일 글자 칸 · 닉네임 n/12 · 가입하기), 휴대폰 인증 `:919-964`, 아이디 찾기 `:965-`, 상태 띠 `:282-302`, 화면 규칙 `:327-334`(390px · 주 탭 하단 탭 · 하위 화면 상단 바 · 52px 주 버튼).
- 재사용: `SmsVerification`(Phase 4) · `withAuth` · `callQueue` · `request` · `setTokenCookies`(`src/app/api/cookie/token-cookie.ts:88`) · `isSameSiteJson` · `json`(`src/app/api/route-util.ts`) · `safeReturnPath` · `loginUrl` · `AuthGuard` · `Band` · `Field` · `Input` · `Button` · `Segmented` · `lookupName('sns_id', …)`(`src/contracts/common/lookup.ts:8`) · `toKst`.
- 기존 next-auth(`src/app/api/auth/[...nextauth]/route.ts`)는 SNS 정보를 `NEXT_PUBLIC_JWT_CODE` 로 서명한 `sns` 쿠키에 담아 `/api/cookie/sns` 로 브라우저에 돌려줬다(SNS access token 포함) — 없는 주소(`/sign/in` · `/sign/sns`)를 가리킨다.
- `NEXTAUTH_SECRET` 은 개발에서도 있어야 한다(`getToken` 이 세션을 푼다) — `.env.example` 안내를 고친다.
- 백엔드 쪽 위험(전달할 것): `user/login` · `user/sign` 이 SNS 토큰을 다시 확인하지 않고 `sns_user_id` 를 믿는다 — 백엔드 공개 API 라 누군가 남의 카카오 · 네이버 회원 번호를 알면 그 계정으로 로그인할 수 있다. 프론트는 브라우저에 ID 를 내보내지 않는 것까지만 할 수 있다.
- 이용자 토큰 저장은 서버 route 가 하므로 `saveAreaTokens` 는 매니저 · 관리자 로그인(Phase 10 · 15)이 쓴다.

## Proposals (Codebase-Based)
- [x] 인증번호는 `SmsVerification` 에 contracts 함수만 넘긴다 (`src/shared/components/sms/SmsVerification.tsx`)
- [x] 로그인 · 가입 결과 토큰은 쿠키 route 와 같은 `setTokenCookies` 로 (`src/app/api/cookie/token-cookie.ts:88`)
- [x] 쓰지 않는 SNS 쿠키 경로(`/api/cookie/sns` · `getSNSAccessToken` · `deleteSNSAccessToken`)와 `jsonwebtoken` 을 지운다 (`src/shared/api/cookie.ts:20-75`)
- [x] 큐 pending 안내 문구를 `QUEUE_PENDING_MESSAGE` 하나로 (`src/shared/api/error.ts` — 휴대폰 인증 · 아이디 찾기 · 이후 화면이 같이 씀)

## Decisions
- [x] SNS 로그인 — next-auth 유지 + route handler 가 백엔드 로그인 · 가입(사용자 결정 2026-11-16 — SNS ID 를 브라우저에 내보내지 않음)
- [x] 회원 상태 띠 — 필요한 화면(U3 · U9 · U10)에만, 이번엔 부품 · 내 정보 Context 만(사용자 결정)
- [x] 생년월일 — 숫자만 쳐도 자동 형식(사용자 결정)
- [x] 만 19세 — 서버에만(사용자 결정)
- [x] TDD — `formatBirthInput` · `toSnsAccount` · `afterLoginPath`(사용자 결정)
- [x] 로그인 완료 처리 — OAuth callbackUrl 을 GET route(`/api/user/sns-login/`)로 받아 303 — 화면 효과(개발 모드 두 번 실행)로 백엔드 로그인이 두 번 나가지 않게
