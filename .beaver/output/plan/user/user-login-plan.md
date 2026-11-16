# Plan — 이용자 틀 · 로그인 · 가입 (Phase 5)

## Feature Summary
- **Feature**: 이용자 모바일 틀 · 카카오 · 네이버 로그인 · 가입 · 휴대폰 인증 · 아이디 찾기 — SNS ID 는 서버에만 두고 로그인 · 가입은 route handler 가 백엔드까지
- **Entry point**: `PAGE · ROUTE · MODULE (user)/layout · /login · /signup · /phone-verification · /find-login-id · GET /api/user/sns-login · POST /api/user/sign · /api/auth/[...nextauth]`
- **Domain**: user (spec: `.beaver/output/spec/user/user-login-spec.md` · 로드맵 Phase 5 — #14 ~ #18)

---

## File List

| File | Action |
|------|------|
| `package.json` · `package-lock.json` | modified — build 때 `npm uninstall jsonwebtoken @types/jsonwebtoken`(쓰는 곳이 없어짐) |
| `.env.example` | modified — `NEXT_PUBLIC_JWT_CODE` · `GOOGLE_*` · `APPLE_*` 삭제, `NEXTAUTH_SECRET` 안내(개발도 필요) |
| `src/contracts/user/dto/user-login.dto.ts` · `user-sign.dto.ts` · `user-me.dto.ts` · `user-phone-verification.dto.ts` · `user-phone-verification-confirm.dto.ts` · `user-find-login-id.dto.ts` · `user-find-login-id-confirm.dto.ts` | new — 지침서 사본(스크립트로 그대로) |
| `src/contracts/user/api.ts` | modified — `loginUser` · `signUser` · `getMe` · `sendPhoneVerification` · `confirmPhoneVerification` · `sendFindLoginId` · `confirmFindLoginId` · `signWithSns` |
| `src/shared/utils/area.ts` | modified — `toSamePath` export(돌아갈 주소를 다른 주소에 붙일 때) |
| `src/shared/utils/util.ts` | modified — `firstQueryValue`(page 의 searchParams) |
| `src/shared/api/queue.ts` | modified — `QUEUE_PENDING_MESSAGE` |
| `src/app/api/route-util.ts` | modified — `RouteBodyType.validation_errors` |
| `src/app/api/user/sns-session.ts` | new — `SnsAccountType` · `toSnsAccount` · `readSnsAccount` · `clearSnsSession` · 상수 |
| `src/app/api/user/sns-login/route.ts` | new — `GET` |
| `src/app/api/user/sign/route.ts` | new — `POST` |
| `src/app/api/auth/[...nextauth]/route.ts` | rewritten — 카카오 · 네이버만, 세션 10분, `jwt` · `session` · `signIn` 콜백, `sns` 쿠키 · `jsonwebtoken` 제거 |
| `src/app/api/cookie/sns/route.ts` | **deleted** |
| `src/shared/api/cookie.ts` | modified — `SnsLoginType` · `getSNSAccessToken` · `deleteSNSAccessToken` 삭제 |
| `src/app/(user)/layout.tsx` · `UserLayoutContent.tsx` | new — 모바일 틀 · 하단 탭 · 내 정보 |
| `src/app/(user)/_components/UserMeProvider.tsx` · `UserTopBar.tsx` · `UserTabBar.tsx` · `MemberStateBand.tsx` | new |
| `src/app/(user)/HomeContent.tsx` | modified — U1 자리의 머리(roomless · 로그인 / 내 예약) |
| `src/app/(user)/login/page.tsx` · `LoginContent.tsx` · `login-flow.ts` | page rewritten · new |
| `src/app/(user)/signup/page.tsx` · `SignupContent.tsx` · `dto.ts` · `birth.ts` | new |
| `src/app/(user)/phone-verification/page.tsx` · `PhoneVerificationContent.tsx` | new |
| `src/app/(user)/find-login-id/page.tsx` · `FindLoginIdContent.tsx` | new |
| `src/app/css/user/UserLayoutContent.module.css` · `UserTopBar.module.css` · `UserTabBar.module.css` · `HomeContent.module.css` · `LoginContent.module.css` · `SignupContent.module.css` · `UserFormPage.module.css` | new — `UserFormPage` 는 휴대폰 인증 · 아이디 찾기가 같이 씀 |
| `src/test/app/(user)/signup/birth.test.ts` · `src/test/app/api/user/sns-session.test.ts` · `src/test/app/(user)/login/login-flow.test.ts` | new — TDD |
| `src/test/app/api/user/sns-login.test.ts` · `sign.test.ts` | new — route |
| `src/test/app/(user)/login/LoginContent.test.tsx` · `signup/SignupContent.test.tsx` · `phone-verification/PhoneVerificationContent.test.tsx` · `find-login-id/FindLoginIdContent.test.tsx` · `_components/UserMeProvider.test.tsx` · `_components/MemberStateBand.test.tsx` | new — 화면 |
| `AGENTS.md` · `docs/architecture.md` · `docs/data-layer.md` | modified(초안) — SNS 로그인 흐름 · `NEXT_PUBLIC_JWT_CODE` 삭제 · 폴더 |

---

## Design

### 계약 — DTO 사본 · contracts 함수

DTO 7개는 `copy-dto.js` 로 `frontend/dto/user.md` 블록을 그대로 옮긴다(Phase 3 와 같은 방식 — 파일 이름 · 상대 import 유지). 함수는 형제 `refreshUserToken`(`src/contracts/user/api.ts:9`)처럼 `request` · `callQueue` 를 부르기만, 로그인이 필요하면 `withAuth`(`src/shared/api/auth.ts:31`).

```ts
// src/contracts/user/api.ts
import { AuthType, withAuth } from '@/shared/api/auth';
import { callQueue } from '@/shared/api/queue';
import { ApiError, NetworkError, request, sendRequest } from '@/shared/api/request';
import { ValidationErrorType } from '@/shared/utils/validation';
import { UserFindLoginIdConfirmDto, UserFindLoginIdConfirmResultDto } from './dto/user-find-login-id-confirm.dto';
import { UserFindLoginIdDto, UserFindLoginIdResultDto } from './dto/user-find-login-id.dto';
import { UserLoginDto, UserLoginResultDto } from './dto/user-login.dto';
import { UserMeResultDto } from './dto/user-me.dto';
import { UserPhoneVerificationConfirmDto } from './dto/user-phone-verification-confirm.dto';
import { UserPhoneVerificationDto, UserPhoneVerificationResultDto } from './dto/user-phone-verification.dto';
import { UserSignDto, UserSignResultDto } from './dto/user-sign.dto';
import { UserTokenRefreshDto, UserTokenRefreshResultDto } from './dto/user-token-refresh.dto';

/** 가입 화면이 보내는 칸 — SNS 계정은 서버가 세션에서 붙인다 */
export type UserSignFormType = Pick<UserSignDto, 'gender' | 'birth' | 'nickname'>;

/** 가입 route 결과 — ok: 가입 · 로그인 완료 / no-sns: SNS 세션이 없거나 만료(다시 로그인) */
export type SignWithSnsResultType = {state: 'ok'; is_phone_verified: number} | {state: 'no-sns'};

/** 가입 route 본문(src/app/api/user/sign/route.ts) */
type SignRouteBodyType = {
    success: boolean;
    data?: {is_phone_verified: number};
    code?: string;
    message?: string;
    validation_errors?: Array<ValidationErrorType> | null;
    retry?: boolean;
};

/** SNS 세션이 없음 — src/app/api/user/sns-session.ts NO_SNS_CODE 와 같은 값 */
const NO_SNS_CODE = 'NO_SNS';

// (refreshUserToken 그대로)

/**
 * 이용자 로그인 — 동기 · 공개 (POST /user-service/user/login). 서버 route(GET /api/user/sns-login)만 부른다
 *
 * @param dto sns_id · sns_user_id(next-auth 세션에서)
 */
export function loginUser(dto: UserLoginDto): Promise<UserLoginResultDto | null> {
    return request<UserLoginResultDto>({method: 'POST', path: '/user-service/user/login', body: dto});
}

/**
 * 이용자 가입 — 큐 · 공개 (POST /user-service/user/sign). 서버 route(POST /api/user/sign)만 부른다
 *
 * @param dto SNS 계정 + 성별 · 생년월일 · 닉네임
 */
export function signUser(dto: UserSignDto): Promise<UserSignResultDto | null> {
    return callQueue<UserSignResultDto>({method: 'POST', path: '/user-service/user/sign', body: dto});
}

/**
 * 내 정보 — 동기 · 이용자 (GET /user-service/user/me)
 *
 * @param auth AuthContext 값
 */
export function getMe(auth: AuthType): Promise<UserMeResultDto | null> {
    return withAuth(auth, (token) => request<UserMeResultDto>({path: '/user-service/user/me', token}));
}

/**
 * 휴대폰 인증번호 발송 — 큐 · 이용자 (POST /user-service/user/phone-verification)
 *
 * @param auth AuthContext 값
 * @param dto phone
 */
export function sendPhoneVerification(auth: AuthType, dto: UserPhoneVerificationDto): Promise<UserPhoneVerificationResultDto | null> {
    return withAuth(auth, (token) => callQueue<UserPhoneVerificationResultDto>({method: 'POST', path: '/user-service/user/phone-verification', body: dto, token}));
}

/**
 * 휴대폰 인증번호 확인 — 큐 · 이용자 (POST /user-service/user/phone-verification/confirm). 응답 DTO 가 null — done · pending 이 같은 null 이라 내 정보를 다시 읽어 확인한다
 *
 * @param auth AuthContext 값
 * @param dto sms_verification_id · code
 */
export function confirmPhoneVerification(auth: AuthType, dto: UserPhoneVerificationConfirmDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'POST', path: '/user-service/user/phone-verification/confirm', body: dto, token}));
}

/**
 * 아이디 찾기 인증번호 발송 — 큐 · 공개 (POST /user-service/user/find-login-id)
 *
 * @param dto phone
 */
export function sendFindLoginId(dto: UserFindLoginIdDto): Promise<UserFindLoginIdResultDto | null> {
    return callQueue<UserFindLoginIdResultDto>({method: 'POST', path: '/user-service/user/find-login-id', body: dto});
}

/**
 * 아이디 찾기 인증번호 확인 — 큐 · 공개 (POST /user-service/user/find-login-id/confirm)
 *
 * @param dto sms_verification_id · code
 */
export function confirmFindLoginId(dto: UserFindLoginIdConfirmDto): Promise<UserFindLoginIdConfirmResultDto | null> {
    return callQueue<UserFindLoginIdConfirmResultDto>({method: 'POST', path: '/user-service/user/find-login-id/confirm', body: dto});
}

/**
 * SNS 가입 — 프론트 route(POST /api/user/sign/)를 거친다(서버가 next-auth 세션의 SNS 계정을 붙여 user/sign)
 * - 백엔드 실패는 ApiError(validation_errors 포함 — 화면은 handleApiError), 처리 늦어짐 · 응답 없음은 ApiError(503, 문구)
 *
 * @param form 성별 · 생년월일 · 닉네임
 */
export async function signWithSns(form: UserSignFormType): Promise<SignWithSnsResultType> {
    const response = await sendRequest('/api/user/sign/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({gender: form.gender, birth: form.birth, nickname: form.nickname}),
    });
    if (!response.ok) {
        throw new NetworkError(new Error(`sign route ${response.status}`));
    }

    const result = (await response.json().catch((): null => null)) as SignRouteBodyType | null;
    if (!result) {
        throw new NetworkError(new Error('sign route body'));
    }

    if (result.success && result.data) {
        return {state: 'ok', is_phone_verified: result.data.is_phone_verified};
    }

    if (result.code === NO_SNS_CODE) {
        return {state: 'no-sns'};
    }

    throw new ApiError(result.retry ? 503 : 400, {message: result.message ?? '', validation_errors: result.validation_errors ?? null});
}
```

### 공통 — 돌아갈 주소 · query · 큐 늦어짐 문구 · route 본문

근거: `toSamePath`(`src/shared/utils/area.ts:91` — 지금은 모듈 안 함수)를 다른 주소(휴대폰 인증 · 가입 · 로그인 오류)에 돌아갈 주소를 붙일 때도 쓴다.

```ts
// src/shared/utils/area.ts — 바뀌는 곳
/**
 * 같은 사이트 주소면 path + query + hash 로, 아니면 null — 다른 사이트로 보내는 주소 막기
 * - 브라우저와 같은 URL 해석으로 본다('/\t/evil.com' · '/\evil.com' · '//evil.com' 은 모두 다른 사이트)
 * - 돌아갈 주소를 다른 주소의 query 로 붙일 때도 쓴다(src/app/(user)/login/login-flow.ts)
 *
 * @param path 주소
 */
export function toSamePath(path: string | null | undefined): string | null {
    // (본문 그대로)
}
```

```ts
// src/shared/utils/util.ts — 더함
/**
 * query 값 하나 — 같은 이름이 여럿이면 첫 값, 없거나 빈 값이면 null (page 의 searchParams)
 *
 * @param value searchParams 의 값
 */
export function firstQueryValue(value: string | Array<string> | undefined): string | null {
    const first = Array.isArray(value) ? value[0] : value;
    return first ? first : null;
}
```

```ts
// src/shared/api/queue.ts — 더함
/** 큐가 30초 안에 결과를 주지 않음(pending) — 처리됐을 수 있어 다시 조회 · 다시 시도를 안내 */
export const QUEUE_PENDING_MESSAGE = '처리가 늦어지고 있어요. 잠시 뒤 다시 시도해 주세요.';
```

```ts
// src/app/api/route-util.ts — RouteBodyType 에 더함
import { ValidationErrorType } from '@/shared/utils/validation';

export type RouteBodyType = {
    success: boolean;
    data?: unknown;
    retry?: boolean;                                      // 일시 실패 — 쿠키 · 결제를 그대로 두고 다시 시도
    message?: string;                                     // 화면에 보일 실패 문구
    code?: string;                                        // 외부 오류 코드(토스) · 화면이 갈래를 나눌 코드(NO_SNS)
    validation_errors?: Array<ValidationErrorType> | null; // 백엔드 칸 오류 그대로(가입)
};
```

### SNS 세션 · next-auth (#15)

근거: 백엔드는 `sns_user_id` 를 그대로 믿는다(frontend/screens.md:100) → 검증된 SNS 계정은 next-auth JWT 세션(httpOnly · `NEXTAUTH_SECRET` 암호화)에만. `getToken`(next-auth 4.24 `next-auth/jwt` — `req: NextRequest`)으로 서버가 읽는다. 공급자 계정 ID 는 next-auth 가 준 `providerAccountId`(네이버 공급자는 `profile.response.id` 를 이 값으로 둔다).

```ts
// src/app/api/user/sns-session.ts
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/** 백엔드가 받는 SNS 계정 — UserLoginDto · UserSignDto 의 sns_id · sns_user_id */
export type SnsAccountType = {
    sns_id: 'KAKAO' | 'NAVER'; // SNS 유형
    sns_user_id: string;       // SNS 회원 번호
};

type CookieStoreType = Awaited<ReturnType<typeof cookies>>;

/** SNS 세션이 없음(만료 · 직접 들어옴) — 가입 화면이 로그인으로 돌린다 */
export const NO_SNS_CODE = 'NO_SNS';

/** 같은 사이트 JSON 이 아닌 요청 */
export const INVALID_REQUEST_MESSAGE = '잘못된 요청입니다.';

/** next-auth 공급자 → 백엔드 SNS 유형 — 백엔드는 카카오 · 네이버만 */
const SNS_PROVIDERS = new Map<string, SnsAccountType['sns_id']>([['kakao', 'KAKAO'], ['naver', 'NAVER']]);

/**
 * next-auth 공급자 · 계정 ID → 백엔드 SNS 계정 — 카카오 · 네이버이고 계정 ID 가 있을 때만
 *
 * @param provider next-auth 공급자 id
 * @param providerAccountId 공급자의 회원 번호
 */
export function toSnsAccount(provider: string, providerAccountId: string | null | undefined): SnsAccountType | null {
    const sns_id = SNS_PROVIDERS.get(provider);
    return sns_id && providerAccountId ? {sns_id, sns_user_id: providerAccountId} : null;
}

/**
 * 요청의 next-auth 세션에서 SNS 계정 읽기 — 없거나 만료 · 모양이 다르면 null
 *
 * @param request route handler 요청
 */
export async function readSnsAccount(request: NextRequest): Promise<SnsAccountType | null> {
    const token = await getToken({req: request, secret: process.env.NEXTAUTH_SECRET});
    const sns_id = token?.sns_id;
    const sns_user_id = token?.sns_user_id;
    if ((sns_id === 'KAKAO' || sns_id === 'NAVER') && typeof sns_user_id === 'string' && sns_user_id) {
        return {sns_id, sns_user_id};
    }

    return null;
}

/**
 * next-auth 쿠키 모두 지우기 — 로그인 · 가입을 마치면 SNS 세션을 남기지 않는다
 *
 * @param cookieStore cookies()
 */
export function clearSnsSession(cookieStore: CookieStoreType): void {
    for (const cookie of cookieStore.getAll()) {
        if (cookie.name.includes('next-auth')) {
            cookieStore.delete(cookie.name);
        }
    }
}
```

```ts
// src/app/api/auth/[...nextauth]/route.ts — 다시 씀
import NextAuth from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import NaverProvider from 'next-auth/providers/naver';
import { toSnsAccount } from '../../user/sns-session';

/** SNS 세션 — 로그인 · 가입을 마칠 동안만(초) */
const SNS_SESSION_MAX_AGE = 10 * 60;

const handler = NextAuth({
    pages: {
        signIn: '/login/',
        error: '/login/',
    },
    session: {
        strategy: 'jwt',
        maxAge: SNS_SESSION_MAX_AGE,
    },
    logger: {
        error(code, ...message) {
            if (code === 'OAUTH_CALLBACK_HANDLER_ERROR' || code === 'OAUTH_CALLBACK_ERROR') return;
            console.error(code, ...message);
        },
    },
    providers: [
        KakaoProvider({
            clientId: process.env.KAKAO_LOGIN_CLIENT_ID,
            clientSecret: process.env.KAKAO_LOGIN_SECRET_ID,
        }),
        NaverProvider({
            clientId: process.env.NAVER_LOGIN_CLIENT_ID,
            clientSecret: process.env.NAVER_LOGIN_SECRET_ID,
        }),
    ],
    callbacks: {
        signIn({account}) {
            // 카카오 · 네이버 계정 ID 가 있을 때만
            return Boolean(account && toSnsAccount(account.provider, account.providerAccountId));
        },
        jwt({token, account}) {
            // 처음 로그인할 때만 account 가 온다 — SNS 계정만 세션 토큰에(이름 · 메일 · 사진은 담지 않는다)
            const sns = account ? toSnsAccount(account.provider, account.providerAccountId) : null;
            return sns ? {sns_id: sns.sns_id, sns_user_id: sns.sns_user_id} : token;
        },
        session({session}) {
            // /api/auth/session 이 브라우저에 주는 값 — SNS 계정 · 개인 정보 없이 만료만
            return {expires: session.expires};
        },
    },
});

export { handler as GET, handler as POST };
```
- `useSecureCookies` · 직접 정한 `pkceCodeVerifier` 쿠키는 지운다 — next-auth 가 `NEXTAUTH_URL`(https 면 `__Secure-`)로 정하고 `getToken` 도 같은 규칙으로 쿠키를 찾는다(둘이 어긋나면 세션을 못 읽는다).

### 로그인 흐름 (#15 · #16)

근거: 형제 route — `src/app/api/cookie/[area]/route.ts`(200 + `json`) · 토큰 저장은 `setTokenCookies`(`src/app/api/cookie/token-cookie.ts:88`). OAuth `callbackUrl` 을 GET route 로 받아 303 — 화면 효과로 로그인을 부르면 개발 모드 두 번 실행에 백엔드 로그인이 두 번 나간다. 리다이렉트는 상대 주소(`Location: <basePath>/…`) — 프록시 뒤에서 `request.url` 의 호스트가 내부 주소일 수 있어서.

```ts
// src/app/(user)/login/login-flow.ts
import { AREA_LOGIN_PATH, RETURN_URL_KEY, safeReturnPath, toSamePath } from '@/shared/utils/area';

export const PHONE_VERIFICATION_PATH = '/phone-verification/';
export const SIGNUP_PATH = '/signup/';
export const FIND_LOGIN_ID_PATH = '/find-login-id/';

/** SNS 로그인이 끝나면 next-auth 가 돌아올 route — 서버가 백엔드 로그인 */
export const SNS_LOGIN_ROUTE = '/api/user/sns-login/';

/** 로그인 화면 오류 코드 — 로그인 route 가 붙인다(next-auth 오류 코드는 SNS 실패로 본다) */
export type LoginErrorCodeType = 'sns' | 'login' | 'retry';

const LOGIN_ERROR_MESSAGE: Record<LoginErrorCodeType, string> = {
    sns: 'SNS 로그인을 마치지 못했어요. 다시 시도해 주세요.',
    login: '로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.',
    retry: '서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.',
};

/** 가입 · SNS 세션이 만료됐을 때 */
export const SNS_EXPIRED_MESSAGE = 'SNS 로그인 정보가 만료됐어요. 다시 로그인해 주세요.';

/**
 * 주소에 돌아갈 주소(같은 사이트일 때만)와 다른 query 를 붙인다
 *
 * @param path 주소
 * @param returnUrl 돌아갈 주소
 * @param extra 더 붙일 query
 */
export function withReturnUrl(path: string, returnUrl: string | null, extra: Record<string, string> = {}): string {
    const params = new URLSearchParams(extra);
    const samePath = toSamePath(returnUrl);
    if (samePath) {
        params.set(RETURN_URL_KEY, samePath);
    }

    const query = params.toString();
    return query ? `${path}?${query}` : path;
}

/**
 * 로그인 · 가입을 마친 뒤 갈 주소 — 휴대폰 인증 전이면 휴대폰 인증(돌아갈 주소를 들고), 인증했으면 돌아갈 주소 · 첫 화면
 *
 * @param isPhoneVerified 휴대폰 인증 여부(0 · 1)
 * @param returnUrl 돌아갈 주소
 */
export function afterLoginPath(isPhoneVerified: number, returnUrl: string | null): string {
    if (isPhoneVerified !== 1) {
        return withReturnUrl(PHONE_VERIFICATION_PATH, returnUrl);
    }

    return safeReturnPath(returnUrl, 'user');
}

/**
 * SNS 로그인 시작 때 next-auth 에 줄 callbackUrl — 로그인 route + 돌아갈 주소
 *
 * @param returnUrl 돌아갈 주소
 */
export function snsLoginCallbackUrl(returnUrl: string | null): string {
    return withReturnUrl(SNS_LOGIN_ROUTE, returnUrl);
}

/**
 * 로그인 화면 + 오류 코드
 *
 * @param code 오류 코드
 * @param returnUrl 돌아갈 주소
 */
export function loginErrorPath(code: LoginErrorCodeType, returnUrl: string | null): string {
    return withReturnUrl(AREA_LOGIN_PATH.user, returnUrl, {error: code});
}

/**
 * 오류 코드 → 안내 문구 — 모르는 코드(next-auth 의 OAuthCallback 등)는 SNS 실패
 *
 * @param code 주소의 error
 */
export function loginErrorMessage(code: string): string {
    // 'constructor' 같은 상속 이름에 속지 않게 자기 키만
    return Object.hasOwn(LOGIN_ERROR_MESSAGE, code) ? LOGIN_ERROR_MESSAGE[code as LoginErrorCodeType] : LOGIN_ERROR_MESSAGE.sns;
}
```

```ts
// src/app/api/user/sns-login/route.ts
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { afterLoginPath, loginErrorPath, SIGNUP_PATH, withReturnUrl } from '@/app/(user)/login/login-flow';
import { loginUser } from '@/contracts/user/api';
import { ApiError } from '@/shared/api/request';
import { RETURN_URL_KEY } from '@/shared/utils/area';
import { setTokenCookies } from '../../cookie/token-cookie';
import { clearSnsSession, readSnsAccount } from '../sns-session';

/**
 * SNS 로그인 마무리 — next-auth 세션의 SNS 계정으로 백엔드 로그인 → 이용자 토큰 쿠키 → 다음 화면으로 303
 * - 가입 전(404)이면 가입 화면(SNS 세션은 둔다), 실패면 로그인 화면 + 오류 코드
 *
 * @param request query return_url
 */
export async function GET(request: NextRequest): Promise<Response> {
    const returnUrl = request.nextUrl.searchParams.get(RETURN_URL_KEY);
    const account = await readSnsAccount(request);
    if (!account) {
        return redirect(loginErrorPath('sns', returnUrl));
    }

    try {
        const result = await loginUser(account);
        if (!result) {
            throw new Error('로그인 결과가 비어 있습니다.');
        }

        const cookieStore = await cookies();
        await setTokenCookies(cookieStore, 'user', result);
        clearSnsSession(cookieStore);
        return redirect(afterLoginPath(result.is_phone_verified, returnUrl));
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            return redirect(withReturnUrl(SIGNUP_PATH, returnUrl, {sns: account.sns_id}));
        }

        console.log('[sns-login] 로그인 실패 —', error instanceof Error ? error.message : error);
        return redirect(loginErrorPath(error instanceof ApiError && error.status < 500 ? 'login' : 'retry', returnUrl));
    }
}

/**
 * 303 상대 주소 리다이렉트(basePath 포함)
 *
 * @param path 앱 안 주소
 */
function redirect(path: string): Response {
    return new Response(null, {status: 303, headers: {Location: `${process.env.NEXT_PUBLIC_LOCAL_SERVER_PREFIX ?? ''}${path}`}});
}
```

```ts
// src/app/api/user/sign/route.ts
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { UserSignDto } from '@/contracts/user/dto/user-sign.dto';
import { signUser } from '@/contracts/user/api';
import { NETWORK_ERROR_MESSAGE } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import { ApiError } from '@/shared/api/request';
import { setTokenCookies } from '../../cookie/token-cookie';
import { isSameSiteJson, json } from '../../route-util';
import { clearSnsSession, INVALID_REQUEST_MESSAGE, NO_SNS_CODE, readSnsAccount } from '../sns-session';

/**
 * SNS 가입 — 가입 칸에 next-auth 세션의 SNS 계정을 붙여 백엔드 user/sign(큐) → 이용자 토큰 쿠키
 * - 같은 사이트 JSON · SNS 세션이 있을 때만 백엔드를 부른다. 백엔드 실패는 message · validation_errors 그대로
 *
 * @param request 본문 {gender, birth, nickname}
 */
export async function POST(request: NextRequest): Promise<Response> {
    if (!isSameSiteJson(request)) {
        return json({success: false, message: INVALID_REQUEST_MESSAGE});
    }

    const account = await readSnsAccount(request);
    if (!account) {
        return json({success: false, code: NO_SNS_CODE});
    }

    const form = (await request.json().catch((): null => null)) as Record<string, unknown> | null;
    const dto = Object.assign(new UserSignDto(), {
        sns_id: account.sns_id,
        sns_user_id: account.sns_user_id,
        gender: textOf(form?.gender),
        birth: textOf(form?.birth),
        nickname: textOf(form?.nickname),
    });

    try {
        const result = await signUser(dto);
        if (!result) {
            return json({success: false, message: QUEUE_PENDING_MESSAGE, retry: true});
        }

        const cookieStore = await cookies();
        await setTokenCookies(cookieStore, 'user', result);
        clearSnsSession(cookieStore);
        return json({success: true, data: {is_phone_verified: result.is_phone_verified}});
    } catch (error) {
        if (error instanceof ApiError) {
            return json({success: false, message: error.body.message, validation_errors: error.body.validation_errors});
        }

        console.log('[sign] 가입 실패 —', error instanceof Error ? error.message : error);
        return json({success: false, message: NETWORK_ERROR_MESSAGE, retry: true});
    }
}

/**
 * 본문 값 → 글자(아니면 빈 글자 — 백엔드 검증이 칸 오류로 돌려준다)
 *
 * @param value 본문 값
 */
function textOf(value: unknown): string {
    return typeof value === 'string' ? value : '';
}
```

### 이용자 틀 · 내 정보 (#14)

근거: 시안 화면 규칙(`frontend/design/user.html:327-334` — 390px · 주 탭 하단 탭 · 하위 화면 상단 바), 상태 띠(`:282-302`), 렌더 중 상태 맞추기 · 효과 규칙은 `useMyLocation`(`src/shared/hooks/useMyLocation.ts`)과 같이 효과 본문에서 바로 `setState` 하지 않는다.

```tsx
// src/app/(user)/layout.tsx
import UserLayoutContent from './UserLayoutContent';

type UserLayoutProps = {
    children: React.ReactNode;
};

// 이용자 영역 틀 — 모바일 폭 · 하단 탭 · 내 정보
export default function UserLayout({children}: UserLayoutProps): React.ReactNode {
    return (
        // 이용자 틀
        <UserLayoutContent>{children}</UserLayoutContent>
    );
}
```

```tsx
// src/app/(user)/UserLayoutContent.tsx
'use client';
import { usePathname } from 'next/navigation';
import UserMeProvider from './_components/UserMeProvider';
import UserTabBar, { isMainTabPath } from './_components/UserTabBar';
import styles from '@/app/css/user/UserLayoutContent.module.css';

type UserLayoutContentProps = {
    children: React.ReactNode;
};

/**
 * 이용자 틀 — 가운데 · 최대 480px, 주 탭 주소면 하단 탭, 내 정보 Context
 *
 * @param param0
 * @returns
 */
export default function UserLayoutContent({children}: UserLayoutContentProps): React.ReactNode {
    // 변수
    const pathname = usePathname(); // 지금 주소 — 하단 탭을 보일지

    // 계산 값
    const showTabBar = isMainTabPath(pathname); // 주 탭 화면(지도 · 내 예약 · 마이)인지

    return (
        // 이용자 틀
        <UserMeProvider>
            <div className={styles.frame}>
                {/* 화면 */}
                <div className={styles.body}>{children}</div>

                {/* 하단 탭 — 주 탭 화면만 */}
                {showTabBar ? <UserTabBar pathname={pathname} /> : null}
            </div>
        </UserMeProvider>
    );
}
```

```tsx
// src/app/(user)/_components/UserMeProvider.tsx
'use client';
import { createContext, useContext, useEffect, useEffectEvent, useState } from 'react';
import { getMe } from '@/contracts/user/api';
import { UserMeResultDto } from '@/contracts/user/dto/user-me.dto';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';

export type UserMeContextType = {
    me: UserMeResultDto | null;                      // 내 정보 — 로그인 안 했거나 못 읽었으면 null
    reloadMe: () => Promise<UserMeResultDto | null>; // 다시 읽기(휴대폰 인증 · 탈퇴 신청 뒤) — 못 읽으면 null
};

type UserMeProviderProps = {
    children: React.ReactNode;
};

export const UserMeContext = createContext<UserMeContextType>({me: null, reloadMe: async () => null});

/**
 * 내 정보 — 로그인했으면 user/me 를 읽어 이용자 화면들에 나눠 준다(앱을 열 때 · 로그인 상태가 바뀔 때)
 * - 실패는 조용히(me null) — 화면이 필요하면 reloadMe
 *
 * @param param0
 * @returns
 */
export default function UserMeProvider({children}: UserMeProviderProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                    // 이용자 로그인 상태
    const loadMe = useEffectEvent(() => getMe(auth));        // 그때의 auth 로 내 정보 읽기(효과를 다시 걸지 않는다)

    // 상태
    const [loadedMe, setLoadedMe] = useState<UserMeResultDto | null>(null); // 마지막으로 읽은 내 정보

    // 계산 값
    const me = auth.isLogin ? loadedMe : null; // 로그아웃하면 바로 null

    // 효과
    useEffect(() => {
        // 로그인하면 내 정보를 읽는다(사라지면 결과를 버린다)
        if (!auth.isLogin) {
            return;
        }

        let active = true;
        loadMe().then((next) => {
            if (active) {
                setLoadedMe(next);
            }
        }).catch(() => {
            if (active) {
                setLoadedMe(null);
            }
        });

        return () => {
            active = false;
        };
    }, [auth.isLogin]);

    // 함수
    async function reloadMe(): Promise<UserMeResultDto | null> {
        // 다시 읽기 — 못 읽으면 null
        const next = await getMe(auth).catch((): null => null);
        setLoadedMe(next);
        return next;
    }

    return (
        // 내 정보 Context
        <UserMeContext.Provider value={{me, reloadMe}}>{children}</UserMeContext.Provider>
    );
}
```

```tsx
// src/app/(user)/_components/UserTabBar.tsx
import Link from 'next/link';
import styles from '@/app/css/user/UserTabBar.module.css';

type UserTabBarProps = {
    pathname: string; // 지금 주소 — 고른 탭 표시
};

/** 하단 탭 — 시안 화면 규칙(지도 · 내 예약 · 마이). 내 예약 · 마이 화면은 Phase 8 · 9 */
const MAIN_TABS = [
    {href: '/', label: '지도'},
    {href: '/reservation/', label: '내 예약'},
    {href: '/me/', label: '마이'},
];

/**
 * 주 탭 화면인지 — 끝 / 상관없이
 *
 * @param pathname 주소
 */
export function isMainTabPath(pathname: string): boolean {
    return MAIN_TABS.some((tab) => trimSlash(tab.href) === trimSlash(pathname));
}

/**
 * 하단 탭
 *
 * @param param0
 * @returns
 */
export default function UserTabBar({pathname}: UserTabBarProps): React.ReactNode {
    return (
        // 하단 탭
        <nav className={styles.bar} aria-label="주 메뉴">
            {MAIN_TABS.map((tab) => {
                const active = trimSlash(tab.href) === trimSlash(pathname);
                return (
                    <Link key={tab.href} href={tab.href} className={active ? `${styles.tab} ${styles.active}` : styles.tab} aria-current={active ? 'page' : undefined}>
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}

/**
 * 끝 / 떼기(루트는 그대로)
 *
 * @param path 주소
 */
function trimSlash(path: string): string {
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
}
```

```tsx
// src/app/(user)/_components/UserTopBar.tsx
import Link from 'next/link';
import styles from '@/app/css/user/UserTopBar.module.css';

type UserTopBarProps = {
    title: string;    // 화면 제목
    backHref: string; // 뒤로 가기 주소
};

/**
 * 상단 바 — 하위 화면(뒤로 가기 + 제목)
 *
 * @param param0
 * @returns
 */
export default function UserTopBar({title, backHref}: UserTopBarProps): React.ReactNode {
    return (
        // 상단 바
        <header className={styles.bar}>
            {/* 뒤로 가기 */}
            <Link href={backHref} className={styles.back} aria-label="뒤로 가기">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            </Link>

            {/* 제목 */}
            <h1 className={styles.title}>{title}</h1>
        </header>
    );
}
```

```tsx
// src/app/(user)/_components/MemberStateBand.tsx
import Link from 'next/link';
import dayjs from 'dayjs';
import { UserMeResultDto } from '@/contracts/user/dto/user-me.dto';
import Band from '@/shared/components/ui/display/Band';

type MemberStateBandProps = {
    me: Pick<UserMeResultDto, 'state_id' | 'block_comment' | 'leave_reserved_at'> | null; // 내 정보 — 없으면 그리지 않음
};

/**
 * 회원 상태 띠 — 이용 제한(BLOCK) · 탈퇴 대기(LEAVE_WAIT)만, 그 밖은 그리지 않는다(시안 user.html:282-302)
 * - 예약(U3) · 연장(U9) · 마이페이지(U10)가 쓴다(사용자 결정 — 필요한 화면에만)
 *
 * @param param0
 * @returns
 */
export default function MemberStateBand({me}: MemberStateBandProps): React.ReactNode {
    if (me?.state_id === 'BLOCK') {
        return (
            // 이용 제한
            <Band tone="danger" title="이용이 제한된 계정이에요">
                {me.block_comment ? <span>정지 사유: {me.block_comment}</span> : null}
                <span>로그인과 기존 예약 이용은 되지만 새 예약 · 연장은 할 수 없어요.</span>
            </Band>
        );
    }

    if (me?.state_id === 'LEAVE_WAIT') {
        return (
            // 탈퇴 대기
            <Band tone="warn" title="탈퇴 대기 중이에요">
                <span>{formatLeaveAt(me.leave_reserved_at)}에 탈퇴돼요. 그 전까지 철회할 수 있어요.</span>
                <Link href="/me/">탈퇴 철회하기</Link>
            </Band>
        );
    }

    return null;
}

/**
 * 탈퇴 예정 시각 — 백엔드가 한국 시각 'YYYY-MM-DD HH:mm:ss'(오프셋 없음)로 주므로 바꾸지 않고 모양만
 *
 * @param value leave_reserved_at
 */
function formatLeaveAt(value: string | null): string {
    return value ? dayjs(value).format('YYYY년 M월 D일 HH:mm') : '';
}
```

```tsx
// src/app/(user)/HomeContent.tsx — U1 자리(지도는 Phase 6)에 머리만
'use client';
import Link from 'next/link';
import { useContext } from 'react';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { loginUrl } from '@/shared/utils/area';
import styles from '@/app/css/user/HomeContent.module.css';

// U1 지도 · 주변 업체 — frontend/screens.md 참고(지도 · 업체 목록은 Phase 6)
export default function HomeContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 로그인했으면 "내 예약", 아니면 "로그인"

    return (
        // 지도 · 주변 업체
        <div className={styles.home}>
            {/* 머리 — roomless · 로그인 / 내 예약 */}
            <header className={styles.header}>
                <strong className={styles.brand}>roomless</strong>
                {auth.isLogin
                    ? <Link href="/reservation/" className={styles.headerLink}>내 예약</Link>
                    : <Link href={loginUrl('user', '/')} className={styles.headerLink}>로그인</Link>}
            </header>

            {/* 지도 자리 — Phase 6 */}
            <div className={styles.placeholder}>지도 · 주변 업체</div>
        </div>
    );
}
```

```css
/* src/app/css/user/UserLayoutContent.module.css — 시안 화면 규칙: 휴대폰 화면 하나 = 390px */
.frame {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 480px;
    min-height: 100dvh;
    margin: 0 auto;
    background: var(--surface);
}

.body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
}
```

```css
/* src/app/css/user/UserTabBar.module.css */
.bar {
    position: sticky;
    bottom: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid var(--line);
    background: var(--surface);
}

.tab {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 56px;
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
    text-decoration: none;
}

.active {
    color: var(--primary);
}
```

```css
/* src/app/css/user/UserTopBar.module.css */
.bar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    height: 56px;
    padding: 0 8px;
    border-bottom: 1px solid var(--line);
    background: var(--surface);
}

.back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    color: var(--fg);
}

.title {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
}
```

```css
/* src/app/css/user/HomeContent.module.css */
.home {
    display: flex;
    flex: 1;
    flex-direction: column;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 16px;
    border-bottom: 1px solid var(--line);
}

.brand {
    font-size: 18px;
    font-weight: 700;
}

.headerLink {
    font-size: 14px;
    font-weight: 700;
    color: var(--primary);
    text-decoration: none;
}

.placeholder {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    background: var(--map-bg);
    color: var(--muted);
}
```

### 화면 — 로그인 · 가입 · 휴대폰 인증 · 아이디 찾기 (#15 ~ #18)

근거: 시안 `frontend/design/user.html:839-1000`, 화면 로직은 `<화면>Content` 안 함수(AGENTS.md "화면 로직"), page 는 `searchParams` 만 읽어 넘긴다(`PageProps<'/login'>` — `.next/types/routes.d.ts:48`), 로그인이 필요한 화면은 `AuthGuard`(`src/shared/components/AuthGuard.tsx:19`).

```tsx
// src/app/(user)/login/page.tsx — 다시 씀
import { firstQueryValue } from '@/shared/utils/util';
import LoginContent from './LoginContent';

// U5 로그인 — /login (카카오 · 네이버)
export default async function Login({searchParams}: PageProps<'/login'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 로그인 화면
        <LoginContent returnUrl={firstQueryValue(query.return_url)} error={firstQueryValue(query.error)} />
    );
}
```

```tsx
// src/app/(user)/login/LoginContent.tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useContext, useEffect } from 'react';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { loginUrl, safeReturnPath } from '@/shared/utils/area';
import UserTopBar from '../_components/UserTopBar';
import { FIND_LOGIN_ID_PATH, loginErrorMessage, snsLoginCallbackUrl } from './login-flow';
import styles from '@/app/css/user/LoginContent.module.css';

type LoginContentProps = {
    returnUrl: string | null; // 로그인 뒤 돌아갈 주소
    error: string | null;     // 로그인 route · next-auth 가 알린 실패 코드
};

/** SNS 공급자 — next-auth provider id */
type SnsProviderType = 'kakao' | 'naver';

/**
 * U5 로그인 — 카카오 · 네이버로 시작, 돌아온 실패는 한 번 안내
 *
 * @param param0
 * @returns
 */
export default function LoginContent({returnUrl, error}: LoginContentProps): React.ReactNode {
    // 변수
    const router = useRouter();           // 오류 안내 뒤 · 이미 로그인 때 이동
    const auth = useContext(AuthContext); // 이미 로그인했는지

    // 효과
    useEffect(() => {
        // 실패 코드가 있으면 한 번 안내하고 주소에서 error 를 지운다
        if (!error) {
            return;
        }

        showErrorPopup(loginErrorMessage(error));
        router.replace(loginUrl('user', returnUrl));
    }, [error, returnUrl, router]);

    useEffect(() => {
        // 이미 로그인했으면 돌아갈 주소로
        if (auth.isLogin) {
            router.replace(safeReturnPath(returnUrl, 'user'));
        }
    }, [auth.isLogin, returnUrl, router]);

    // 함수
    function start(provider: SnsProviderType): void {
        // SNS 로그인 시작 — 끝나면 로그인 route 가 백엔드 로그인 · 돌아갈 주소까지
        signIn(provider, {callbackUrl: snsLoginCallbackUrl(returnUrl)});
    }

    return (
        // 로그인
        <div className={styles.page}>
            {/* 상단 바 */}
            <UserTopBar title="로그인" backHref="/" />

            <div className={styles.body}>
                {/* 브랜드 */}
                <div className={styles.brand}>
                    <strong className={styles.logo}>roomless</strong>
                    <p className={styles.tagline}>가까운 무인 객실을 지도에서 찾고<br />바로 예약해요</p>
                </div>

                {/* SNS 버튼 */}
                <div className={styles.buttons}>
                    <button type="button" className={`${styles.sns} ${styles.kakao}`} onClick={() => start('kakao')}>카카오로 시작하기</button>
                    <button type="button" className={`${styles.sns} ${styles.naver}`} onClick={() => start('naver')}>네이버로 시작하기</button>
                    <p className={styles.notice}>처음이면 SNS 로그인 뒤 가입 정보(성별 · 생년월일 · 닉네임)를 입력해요.<br />가입은 만 19세 이상만 할 수 있어요.</p>
                </div>

                {/* 아이디 찾기 */}
                <div className={styles.find}>
                    <span>어느 SNS 로 가입했는지 모르겠나요?</span>
                    <Link href={FIND_LOGIN_ID_PATH}>아이디 찾기</Link>
                </div>
            </div>
        </div>
    );
}
```

```tsx
// src/app/(user)/signup/page.tsx
import { firstQueryValue } from '@/shared/utils/util';
import SignupContent from './SignupContent';

// U5 가입 — /signup (SNS 로그인 뒤 가입 정보)
export default async function Signup({searchParams}: PageProps<'/signup'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 가입 화면
        <SignupContent sns={firstQueryValue(query.sns)} returnUrl={firstQueryValue(query.return_url)} />
    );
}
```

```ts
// src/app/(user)/signup/dto.ts
import { IsIn, IsNotEmpty, Matches, MaxLength } from 'class-validator';

/**
 * 가입 칸 — 지침서 UserSignDto(src/contracts/user/dto/user-sign.dto.ts)의 gender · birth · nickname 과 같은 규칙 · 메시지
 * - SNS 계정(sns_id · sns_user_id)은 화면이 모르고 서버 route 가 세션에서 붙인다
 */
export class SignupDto {
    /** 성별 — 값: M · F */
    @IsIn(['M', 'F'], {message: '성별이 올바르지 않습니다.'})
    @IsNotEmpty({message: '성별을 입력해주세요.'})
    gender: string;

    /** 생년월일 (YYYY-MM-DD) */
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {message: '생년월일은 YYYY-MM-DD 형식이어야 합니다.'})
    @IsNotEmpty({message: '생년월일을 입력해주세요.'})
    birth: string;

    /** 닉네임 (최대 12자, 특수문자 불가) */
    @MaxLength(12, {message: '닉네임은 최대 12자까지 입력할 수 있습니다.'})
    @Matches(/^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]+$/, {message: '닉네임에 특수문자는 사용할 수 없습니다.'})
    @IsNotEmpty({message: '닉네임을 입력해주세요.'})
    nickname: string;
}
```

```ts
// src/app/(user)/signup/birth.ts
/** 생년월일 숫자 자리 수 */
const BIRTH_DIGITS = 8;

/**
 * 생년월일 칸 글자 → 숫자만 골라 YYYY-MM-DD 모양(치는 중에도 4자리 · 6자리 뒤에 '-') — 사용자 결정
 *
 * @param raw 칸에 친 글자
 */
export function formatBirthInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, BIRTH_DIGITS);
    if (digits.length <= 4) {
        return digits;
    }

    if (digits.length <= 6) {
        return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }

    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}
```

```tsx
// src/app/(user)/signup/SignupContent.tsx
'use client';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { signWithSns } from '@/contracts/user/api';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Segmented, { SegmentedOptionType } from '@/shared/components/ui/form/Segmented';
import { loginUrl } from '@/shared/utils/area';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { validateAction } from '@/shared/utils/validation';
import UserTopBar from '../_components/UserTopBar';
import { afterLoginPath, SNS_EXPIRED_MESSAGE } from '../login/login-flow';
import { formatBirthInput } from './birth';
import { SignupDto } from './dto';
import styles from '@/app/css/user/SignupContent.module.css';

type SignupContentProps = {
    sns: string | null;       // 가입할 SNS(KAKAO · NAVER) — 보이기만(서버 세션을 믿는다)
    returnUrl: string | null; // 가입 · 휴대폰 인증 뒤 돌아갈 주소
};

type GenderType = '' | 'M' | 'F';

const GENDER_OPTIONS: Array<SegmentedOptionType<GenderType>> = [{value: 'M', label: '남'}, {value: 'F', label: '여'}];

/** 닉네임 최대 글자 수 — UserSignDto */
const NICKNAME_MAX = 12;

/**
 * U5 가입 — 성별 · 생년월일 · 닉네임 → 가입 route → 휴대폰 인증
 *
 * @param param0
 * @returns
 */
export default function SignupContent({sns, returnUrl}: SignupContentProps): React.ReactNode {
    // 변수
    const router = useRouter(); // 가입 뒤 · 세션 만료 때 이동

    // 상태
    const [gender, setGender] = useState<GenderType>('');        // 성별
    const [birth, setBirth] = useState<string>('');              // 생년월일 YYYY-MM-DD
    const [nickname, setNickname] = useState<string>('');        // 닉네임
    const [submitting, setSubmitting] = useState<boolean>(false); // 가입 중 — 두 번 누름 막기

    // 계산 값
    const snsName = lookupName('sns_id', sns) || 'SNS'; // "카카오 계정으로 가입해요"

    // 함수
    function changeBirth(event: ChangeEvent<HTMLInputElement>): void {
        // 숫자만 쳐도 YYYY-MM-DD
        setBirth(formatBirthInput(event.target.value));
    }

    function changeNickname(event: ChangeEvent<HTMLInputElement>): void {
        // 12자까지
        setNickname(event.target.value.slice(0, NICKNAME_MAX));
    }

    async function submit(): Promise<void> {
        // 화면 DTO 검증 → 가입 route → 휴대폰 인증 / 세션 만료면 로그인
        const dto = Object.assign(new SignupDto(), {gender, birth, nickname});
        if (submitting || !(await validateAction(dto))) {
            return;
        }

        setSubmitting(true);
        try {
            const result = await signWithSns({gender, birth, nickname});
            if (result.state === 'no-sns') {
                showErrorPopup(SNS_EXPIRED_MESSAGE);
                router.replace(loginUrl('user', returnUrl));
                return;
            }

            router.replace(afterLoginPath(result.is_phone_verified, returnUrl));
        } catch (error) {
            handleApiError(error);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        // 가입
        <div className={styles.page}>
            {/* 상단 바 */}
            <UserTopBar title="가입" backHref={loginUrl('user', returnUrl)} />

            <div className={styles.body}>
                {/* 안내 */}
                <div className={styles.intro}>
                    <p className={styles.sns}><strong>{snsName}</strong> 계정으로 가입해요</p>
                    <h2 className={styles.heading}>예약에 쓸 정보를 입력해 주세요</h2>
                </div>

                {/* 성별 */}
                <Field label="성별" name="gender" htmlFor="signup-gender">
                    <Segmented options={GENDER_OPTIONS} value={gender} onChange={setGender} label="성별" />
                </Field>

                {/* 생년월일 */}
                <Field label="생년월일" name="birth" htmlFor="signup-birth" hint="예: 1998-03-14 · 만 19세가 되는 해의 1월 1일부터 가입할 수 있어요.">
                    <Input id="signup-birth" inputMode="numeric" autoComplete="bday" placeholder="1998-03-14" value={birth} onChange={changeBirth} />
                </Field>

                {/* 닉네임 */}
                <Field label="닉네임" name="nickname" htmlFor="signup-nickname" hint={`최대 ${NICKNAME_MAX}자, 특수문자는 쓸 수 없어요. (${nickname.length}/${NICKNAME_MAX})`}>
                    <Input id="signup-nickname" autoComplete="nickname" maxLength={NICKNAME_MAX} value={nickname} onChange={changeNickname} />
                </Field>
            </div>

            {/* 가입하기 */}
            <div className={styles.footer}>
                <Button variant="primary" size="lg" full onClick={submit} disabled={submitting}>가입하기</Button>
            </div>
        </div>
    );
}
```

```tsx
// src/app/(user)/phone-verification/page.tsx
import AuthGuard from '@/shared/components/AuthGuard';
import { firstQueryValue } from '@/shared/utils/util';
import PhoneVerificationContent from './PhoneVerificationContent';

// U5 휴대폰 인증 — /phone-verification (이용자 로그인 필요)
export default async function PhoneVerification({searchParams}: PageProps<'/phone-verification'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 로그인한 이용자만
        <AuthGuard>
            <PhoneVerificationContent returnUrl={firstQueryValue(query.return_url)} />
        </AuthGuard>
    );
}
```

```tsx
// src/app/(user)/phone-verification/PhoneVerificationContent.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { confirmPhoneVerification, sendPhoneVerification } from '@/contracts/user/api';
import { UserPhoneVerificationConfirmDto } from '@/contracts/user/dto/user-phone-verification-confirm.dto';
import { UserPhoneVerificationDto } from '@/contracts/user/dto/user-phone-verification.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import SmsVerification, { SmsSentType } from '@/shared/components/sms/SmsVerification';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { safeReturnPath } from '@/shared/utils/area';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { validateAction } from '@/shared/utils/validation';
import UserTopBar from '../_components/UserTopBar';
import { UserMeContext } from '../_components/UserMeProvider';
import styles from '@/app/css/user/UserFormPage.module.css';

type PhoneVerificationContentProps = {
    returnUrl: string | null; // 인증 뒤 돌아갈 주소
};

/** 확인 뒤 내 정보가 아직 인증 전일 때 */
export const PHONE_UNVERIFIED_MESSAGE = '인증 결과를 확인하지 못했어요. 다시 시도해 주세요.';

/**
 * U5 휴대폰 인증 — 번호 → 인증번호 → 내 정보를 다시 읽어 인증됐으면 돌아갈 주소로
 *
 * @param param0
 * @returns
 */
export default function PhoneVerificationContent({returnUrl}: PhoneVerificationContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                       // 인증 뒤 이동
    const auth = useContext(AuthContext);             // 이용자 토큰
    const {reloadMe} = useContext(UserMeContext);     // 확인 뒤 내 정보 다시 읽기

    // 함수
    async function send(phone: string): Promise<SmsSentType | null> {
        // 발송 — DTO 검증 → 큐, pending 이면 안내
        const dto = Object.assign(new UserPhoneVerificationDto(), {phone});
        if (!(await validateAction(dto))) {
            return null;
        }

        try {
            const result = await sendPhoneVerification(auth, dto);
            if (!result) {
                showErrorPopup(QUEUE_PENDING_MESSAGE);
            }
            return result;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    }

    async function confirm(sms_verification_id: string, code: string): Promise<void> {
        // 확인 — 결과가 null(done · pending 같음)이라 내 정보로 인증됐는지 본다
        const dto = Object.assign(new UserPhoneVerificationConfirmDto(), {sms_verification_id, code});
        if (!(await validateAction(dto))) {
            return;
        }

        try {
            await confirmPhoneVerification(auth, dto);
            const me = await reloadMe();
            if (me?.is_phone_verified === 1) {
                router.replace(safeReturnPath(returnUrl, 'user'));
                return;
            }

            showErrorPopup(PHONE_UNVERIFIED_MESSAGE);
        } catch (error) {
            handleApiError(error);
        }
    }

    return (
        // 휴대폰 인증
        <div className={styles.page}>
            {/* 상단 바 */}
            <UserTopBar title="휴대폰 인증" backHref="/" />

            <div className={styles.body}>
                {/* 안내 */}
                <div className={styles.intro}>
                    <h2 className={styles.heading}>휴대폰 번호를 인증해 주세요</h2>
                    <p className={styles.desc}>예약 안내와 QR 확인 링크를 문자로 보내 드려요.</p>
                </div>

                {/* 번호 → 인증번호 → 확인 */}
                <SmsVerification onSend={send} onConfirm={confirm} />
            </div>
        </div>
    );
}
```
- `PHONE_UNVERIFIED_MESSAGE` 를 화면 파일에서 export 하면 테스트가 쓴다 — `'use client'` 파일의 상수 export 는 그대로 된다(page 가 아닌 Content).

```tsx
// src/app/(user)/find-login-id/page.tsx
import FindLoginIdContent from './FindLoginIdContent';

// U5 아이디 찾기 — /find-login-id (공개)
export default function FindLoginId(): React.ReactNode {
    return (
        // 아이디 찾기 화면
        <FindLoginIdContent />
    );
}
```

```tsx
// src/app/(user)/find-login-id/FindLoginIdContent.tsx
'use client';
import Link from 'next/link';
import { useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { confirmFindLoginId, sendFindLoginId } from '@/contracts/user/api';
import { UserFindLoginIdConfirmDto, UserFindLoginIdConfirmResultDto } from '@/contracts/user/dto/user-find-login-id-confirm.dto';
import { UserFindLoginIdDto } from '@/contracts/user/dto/user-find-login-id.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import { buttonClass } from '@/shared/components/ui/button/Button';
import SmsVerification, { SmsSentType } from '@/shared/components/sms/SmsVerification';
import { AREA_LOGIN_PATH } from '@/shared/utils/area';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import UserTopBar from '../_components/UserTopBar';
import styles from '@/app/css/user/UserFormPage.module.css';

/**
 * U5 아이디 찾기 — 가입할 때 인증한 번호 → 인증번호 → 가입한 SNS · 가입일
 *
 * @returns
 */
export default function FindLoginIdContent(): React.ReactNode {
    // 상태
    const [found, setFound] = useState<UserFindLoginIdConfirmResultDto | null>(null); // 찾은 가입 정보

    // 계산 값
    const joinedWith = found ? lookupName('sns_id', found.sns_id) || found.login_id || '' : ''; // "카카오"
    const joinedAt = found ? toKst(found.created_at, 'YYYY년 M월 D일') : '';                   // 가입일

    // 함수
    async function send(phone: string): Promise<SmsSentType | null> {
        // 발송 — DTO 검증 → 큐, pending 이면 안내
        const dto = Object.assign(new UserFindLoginIdDto(), {phone});
        if (!(await validateAction(dto))) {
            return null;
        }

        try {
            const result = await sendFindLoginId(dto);
            if (!result) {
                showErrorPopup(QUEUE_PENDING_MESSAGE);
            }
            return result;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    }

    async function confirm(sms_verification_id: string, code: string): Promise<void> {
        // 확인 — 결과가 있으면 가입 정보, pending 이면 안내
        const dto = Object.assign(new UserFindLoginIdConfirmDto(), {sms_verification_id, code});
        if (!(await validateAction(dto))) {
            return;
        }

        try {
            const result = await confirmFindLoginId(dto);
            if (!result) {
                showErrorPopup(QUEUE_PENDING_MESSAGE);
                return;
            }
            setFound(result);
        } catch (error) {
            handleApiError(error);
        }
    }

    return (
        // 아이디 찾기
        <div className={styles.page}>
            {/* 상단 바 */}
            <UserTopBar title="아이디 찾기" backHref={AREA_LOGIN_PATH.user} />

            <div className={styles.body}>
                {found ? (
                    // 찾은 가입 정보
                    <div className={styles.result}>
                        <h2 className={styles.heading}>{joinedWith}로 가입했어요</h2>
                        <p className={styles.desc}>가입일 {joinedAt}</p>
                        <Link href={AREA_LOGIN_PATH.user} className={buttonClass({variant: 'primary', size: 'lg', full: true})}>로그인하러 가기</Link>
                    </div>
                ) : (
                    // 번호 → 인증번호 → 확인
                    <>
                        <div className={styles.intro}>
                            <h2 className={styles.heading}>가입한 SNS 를 찾아요</h2>
                            <p className={styles.desc}>가입할 때 인증한 휴대폰 번호로 인증번호를 보내 드려요.</p>
                        </div>
                        <SmsVerification onSend={send} onConfirm={confirm} confirmLabel="확인" />
                    </>
                )}
            </div>
        </div>
    );
}
```

```css
/* src/app/css/user/LoginContent.module.css — 시안 user.html:839-871 */
.page { display: flex; flex: 1; flex-direction: column; }
.body { display: flex; flex: 1; flex-direction: column; justify-content: space-between; gap: 32px; padding: 32px 20px 24px; }
.brand { display: flex; flex-direction: column; gap: 8px; padding-top: 40px; text-align: center; }
.logo { font-size: 28px; font-weight: 700; color: var(--primary); }
.tagline { margin: 0; font-size: 15px; line-height: 1.6; color: var(--muted); }
.buttons { display: flex; flex-direction: column; gap: 10px; }
.sns { height: var(--control-h-lg); border: 0; border-radius: var(--radius); font: inherit; font-size: 16px; font-weight: 700; cursor: pointer; }
.kakao { background: var(--kakao); color: var(--fg); }
.naver { background: var(--naver); color: var(--on-primary); }
.notice { margin: 6px 0 0; font-size: 13px; line-height: 1.6; color: var(--muted); text-align: center; }
.find { display: flex; justify-content: center; gap: 8px; font-size: 13px; color: var(--muted); }
.find a { font-weight: 700; color: var(--primary); }
```

```css
/* src/app/css/user/SignupContent.module.css — 시안 user.html:872-918 */
.page { display: flex; flex: 1; flex-direction: column; }
.body { display: flex; flex: 1; flex-direction: column; gap: 20px; padding: 24px 20px; }
.intro { display: flex; flex-direction: column; gap: 6px; }
.sns { margin: 0; font-size: 13px; color: var(--muted); }
.sns strong { color: var(--fg); }
.heading { margin: 0; font-size: 20px; font-weight: 700; }
.footer { position: sticky; bottom: 0; padding: 12px 16px 16px; border-top: 1px solid var(--line); background: var(--surface); }
```

```css
/* src/app/css/user/UserFormPage.module.css — 휴대폰 인증 · 아이디 찾기(시안 user.html:919-1000) */
.page { display: flex; flex: 1; flex-direction: column; }
.body { display: flex; flex-direction: column; gap: 20px; padding: 24px 20px; }
.intro { display: flex; flex-direction: column; gap: 6px; }
.heading { margin: 0; font-size: 20px; font-weight: 700; }
.desc { margin: 0; font-size: 15px; line-height: 1.5; color: var(--muted); }
.result { display: flex; flex-direction: column; gap: 12px; padding-top: 24px; }
```
(build 에서는 위 css 를 한 속성씩 줄을 나눠 쓴다 — 기존 css 파일 모양.)

### 지우는 것
- `src/app/api/cookie/sns/route.ts` — `sns` 쿠키를 `NEXT_PUBLIC_JWT_CODE` 로 풀어 브라우저에 돌려주던 route(SNS access token 포함).
- `src/shared/api/cookie.ts` 의 `SnsLoginType` · `getSNSAccessToken` · `deleteSNSAccessToken`(호출처 0).
- next-auth 의 Google · Apple 공급자 · `sns` 쿠키 서명 · `/sign/in` · `/sign/sns` · `useSecureCookies` · 직접 정한 pkce 쿠키.
- `jsonwebtoken` · `@types/jsonwebtoken` 패키지 — build 때 `npm uninstall`.
- `.env.example` — `NEXT_PUBLIC_JWT_CODE` · `GOOGLE_LOGIN_*` · `APPLE_LOGIN_*`. `NEXTAUTH_SECRET` 설명은 "개발에서도 필요 — SNS 로그인 세션을 암호화 · getToken 이 푼다".
- `/login` 자리 표시(`EmptyState`).

### 문서 (초안 — `<!-- beaver:draft based on planning · unconfirmed before ship -->`)
- AGENTS.md Auth — "SNS 로그인은 next-auth" 줄을 흐름으로: next-auth(카카오 · 네이버) → 세션(10분, SNS 계정만) → `GET /api/user/sns-login/` 이 백엔드 로그인 · 이용자 토큰 쿠키 → 다음 화면, 가입은 `POST /api/user/sign/`. 이용자는 토큰 저장을 서버 route 가(`setTokenCookies`), `saveAreaTokens` 는 매니저 · 관리자. `NEXT_PUBLIC_JWT_CODE` 문장 삭제. Checklist 의 시크릿 줄은 `NEXTAUTH_SECRET` · `TOSS_SECRET_KEY` 로.
- docs/architecture.md — 폴더 트리(`(user)/_components` · `api/user`), 서버 전용(`next-auth/jwt` `getToken`), `NEXT_PUBLIC_JWT_CODE` 문장 삭제.
- docs/data-layer.md — 쿠키 표의 `sns` 줄 → next-auth 세션 쿠키(10분), `getSNSAccessToken` · `deleteSNSAccessToken` 삭제, 이용자 로그인 · 가입 route 표.

---

## Test Cases
```
[ABOUT:formatBirthInput] 생년월일 칸에 친 글자를 숫자만 골라 YYYY-MM-DD 모양으로 바꾼다 // 숫자를 8자리까지 쓰고, 4자리 뒤 · 6자리 뒤에 '-' 를 넣는다(치는 중에도)
[CASES:formatBirthInput] `'1998'` → `'1998'` // 4자리까지는 연도만
[CASES:formatBirthInput] `'19980'` → `'1998-0'` // 치는 중 — 5자리면 연도 뒤에 '-'
[CASES:formatBirthInput] `'199803'` → `'1998-03'` // 6자리면 연-월
[CASES:formatBirthInput] `'19980314'` → `'1998-03-14'` // 8자리면 연-월-일
[CASES:formatBirthInput] `'1998.03.14'` → `'1998-03-14'` // 숫자 아닌 글자는 버리고 다시 모양을 맞춤(시안의 잘못된 예)
[CASES:formatBirthInput] `'1998-03-14'` → `'1998-03-14'` // 이미 모양대로 붙여 넣어도 그대로
[CASES:formatBirthInput] `'199803141'` → `'1998-03-14'` // 8자리 넘는 숫자는 자름
[CASES:formatBirthInput] `''` → `''` // 빈 칸은 빈 칸
[ABOUT:toSnsAccount] next-auth 공급자 · 계정 ID 를 백엔드가 받는 SNS 계정({sns_id, sns_user_id})으로 바꾼다 // 공급자가 kakao · naver 이고 계정 ID 가 있을 때만 — 그 밖은 null(로그인시키지 않음)
[CASES:toSnsAccount] `('kakao', '1234567890')` → `{sns_id: 'KAKAO', sns_user_id: '1234567890'}` // 카카오는 KAKAO
[CASES:toSnsAccount] `('naver', 'aBc-123_xyz')` → `{sns_id: 'NAVER', sns_user_id: 'aBc-123_xyz'}` // 네이버는 NAVER
[CASES:toSnsAccount] `('google', '1234')` → `null` // 백엔드는 카카오 · 네이버만 받음
[CASES:toSnsAccount] `('kakao', '')` → `null` // 계정 ID 가 없으면 누구로 로그인할지 모름 — 백엔드가 그대로 믿으니 빈 값은 막음
[ABOUT:afterLoginPath] 로그인 · 가입을 마친 뒤 갈 주소를 정한다 // 휴대폰 인증 전이면 휴대폰 인증(돌아갈 주소를 들고), 인증했으면 같은 사이트 돌아갈 주소 또는 첫 화면
[CASES:afterLoginPath] `(0, '/stores/1/')` → `'/phone-verification/?return_url=%2Fstores%2F1%2F'` // 인증 전이면 휴대폰 인증 먼저 — 끝나면 돌아갈 주소로
[CASES:afterLoginPath] `(0, null)` → `'/phone-verification/'` // 돌아갈 주소가 없으면 붙이지 않음
[CASES:afterLoginPath] `(0, 'https://evil.com/')` → `'/phone-verification/'` // 다른 사이트 주소는 들고 가지 않음
[CASES:afterLoginPath] `(1, '/stores/1/?date=2026-11-20')` → `'/stores/1/?date=2026-11-20'` // 인증했으면 돌아갈 주소로(query 그대로)
[CASES:afterLoginPath] `(1, null)` → `'/'` // 돌아갈 주소가 없으면 첫 화면
[CASES:afterLoginPath] `(1, '//evil.com')` → `'/'` // 다른 사이트 주소는 버림(safeReturnPath)
[ABOUT:GET /api/user/sns-login/] next-auth 세션의 SNS 계정으로 백엔드 로그인을 하고 다음 화면으로 보낸다 // SNS 세션이 있을 때만 백엔드를 부르고, 결과(성공 · 가입 전 · 실패)마다 정해진 주소로 303
[SUCCESS] GET /api/user/sns-login/ — SNS 세션 KAKAO · 백엔드 200(`is_phone_verified` 0) → 백엔드 `user/login` 1회(본문 `{sns_id, sns_user_id}`) · `user_access_token` · `user_refresh_token` 저장 · next-auth 쿠키 삭제 · 303 `/phone-verification/?return_url=…` // 검증된 SNS 계정으로 로그인 성공 — 인증 전이라 휴대폰 인증으로
[FAIL:not-signed] GET /api/user/sns-login/ — 백엔드 404 → 303 `/signup/?sns=KAKAO&return_url=…`, 토큰 쿠키 저장 0 · next-auth 쿠키는 둠 // 가입하지 않은 SNS 계정 — 가입에 SNS 세션이 필요
[FAIL:no-sns] GET /api/user/sns-login/ — SNS 세션 없음 → 303 `/login/?error=sns`, 백엔드 0회 // 검증된 SNS 계정이 없으면 로그인시키지 않음
[FAIL:retry] GET /api/user/sns-login/ — 백엔드 503 · 응답 없음 → 303 `/login/?error=retry` // 일시 장애 — 다시 로그인하면 됨
[ABOUT:POST /api/user/sign/] 가입 칸(성별 · 생년월일 · 닉네임)에 서버 세션의 SNS 계정을 붙여 백엔드 가입을 한다 // 같은 사이트 JSON 이고 SNS 세션이 있을 때만 백엔드를 부르고, 백엔드 실패는 칸 오류까지 그대로 돌려준다
[SUCCESS] POST /api/user/sign/ — SNS 세션 NAVER · 큐 done → 백엔드 `user/sign` 1회(본문 `{sns_id: 'NAVER', sns_user_id, gender, birth, nickname}`) · 토큰 쿠키 저장 · next-auth 쿠키 삭제 → `{success: true, data: {is_phone_verified: 0}}` // 가입 완료 — 화면은 휴대폰 인증으로
[FAIL:validation] POST /api/user/sign/ — 큐 failed 400 `validation_errors: [{property: 'birth', …}]` → `{success: false, message, validation_errors}`, 토큰 쿠키 0 // 미성년 등 백엔드 검증 실패를 칸 옆에 보이도록 그대로
[FAIL:no-sns] POST /api/user/sign/ — SNS 세션 없음 → `{success: false, code: 'NO_SNS'}`, 백엔드 0회 // SNS 세션이 만료(10분)됐으면 다시 로그인
[FAIL:csrf] POST /api/user/sign/ — `Content-Type: text/plain` → `{success: false, message: '잘못된 요청입니다.'}`, 백엔드 0회 // 다른 사이트 form 이 가입을 부르는 것 막기 — 같은 사이트 JSON 만
[ABOUT:SignupContent] 가입 칸을 검증해 가입 route 를 부르고 결과에 따라 이동한다 // 화면 DTO 를 통과할 때만 route 를 부르고, 성공이면 휴대폰 인증 · 세션 만료면 로그인으로
[FAIL:validation] SignupContent — 닉네임 `'고양이!'` · 성별 없음 → 칸 옆 오류, route 0회 // DTO 규칙(특수문자 불가 · 성별 필수)을 어기면 보내지 않음
[SUCCESS] SignupContent — 생년월일 `'19980314'` 입력 · 가입 → 칸에 `'1998-03-14'`, route 1회(본문 `{gender, birth: '1998-03-14', nickname}`) → `router.replace('/phone-verification/?return_url=…')` // 숫자만 쳐도 DTO 형식 — 가입하면 휴대폰 인증 전
[FAIL:no-sns] SignupContent — route `NO_SNS` → 만료 팝업 · `router.replace('/login/?return_url=…')` // SNS 세션이 없으면 가입할 수 없음
[ABOUT:PhoneVerificationContent] 인증번호 확인 뒤 내 정보를 다시 읽어 인증됐는지 보고 이동한다 // 확인 API 는 결과가 null(done · pending 같음)이라 내 정보의 is_phone_verified 가 1 일 때만 성공
[SUCCESS] PhoneVerificationContent — 확인 → `reloadMe` 1회 → `is_phone_verified` 1 → `router.replace(return_url)` // 다시 읽은 내 정보가 인증됨
[FAIL:unverified] PhoneVerificationContent — 확인 뒤 `is_phone_verified` 0 → "인증 결과를 확인하지 못했어요." 팝업 · 이동 0 // 처리가 늦어졌거나 실패 — 다시 시도하게
[ABOUT:LoginContent] 카카오 · 네이버 버튼으로 next-auth 로그인을 시작하고, 돌아온 오류를 안내한다 // callbackUrl 은 로그인 route + 같은 사이트 돌아갈 주소, error 가 있으면 한 번 안내
[SUCCESS] LoginContent — "카카오로 시작하기" → `signIn('kakao', {callbackUrl: '/api/user/sns-login/?return_url=%2Fstores%2F1%2F'})` 1회 // 돌아갈 주소를 로그인 route 까지 들고 감
[FAIL:error] LoginContent — `?error=retry` → 연결 안내 팝업 1회 // 로그인 route 가 알린 실패를 이용자에게
[ABOUT:UserMeProvider] 로그인한 이용자의 내 정보를 읽어 화면들에 나눠 준다 // 로그인했을 때만 user/me 를 부르고, 로그인 안 했으면 null
[SUCCESS] UserMeProvider — 로그인함 → `GET /user-service/user/me` 1회(Bearer 토큰) → `me` // 로그인한 이용자만 내 정보가 있음
[FAIL:logged-out] UserMeProvider — 로그인 안 함 → 호출 0회 · `me` `null` // 토큰 없이 부르면 401 — 부르지 않음
[ABOUT:MemberStateBand] 회원 상태가 이용 제한 · 탈퇴 대기면 안내 띠를 그린다 // BLOCK 은 정지 사유, LEAVE_WAIT 는 탈퇴 예정 시각 + 철회 링크, 그 밖은 그리지 않음
[SUCCESS] MemberStateBand — BLOCK · `block_comment` → "이용이 제한된 계정이에요" + 사유 // 정지 사유를 그대로 보여 줌
[SUCCESS] MemberStateBand — LEAVE_WAIT · `'2026-11-24 15:20:00'` → "2026년 11월 24일 15:20에 탈퇴돼요" + `/me/` 링크 // 탈퇴 예정 시각과 철회 길
[FAIL:active] MemberStateBand — ACTIVE → 아무것도 그리지 않음 // 정상 회원에게는 띠가 없음
[ABOUT:FindLoginIdContent] 인증번호로 확인한 휴대폰의 가입 SNS · 가입일을 보여 준다 // 확인 결과가 있을 때만 결과 카드, pending(null)이면 늦어짐 안내
[SUCCESS] FindLoginIdContent — 확인 결과 `{sns_id: 'KAKAO', created_at}` → "카카오로 가입했어요" · 가입일 · "로그인하러 가기"(`/login/`) // 가입한 SNS 를 이름으로

테스트 생략(위임형): `UserTopBar` · `UserTabBar`(링크만) · `(user)/layout` · next-auth 설정(공급자 · 콜백 — 계정 변환은 `toSnsAccount` TDD) · contracts 함수(request · callQueue · withAuth 를 부르기만) · `page.tsx` · 지우는 것
```

테스트 파일 · 방식(docs/testing.md):
- TDD: `src/test/app/(user)/signup/birth.test.ts` · `src/test/app/api/user/sns-session.test.ts`(`toSnsAccount` — `// @vitest-environment node`) · `src/test/app/(user)/login/login-flow.test.ts`.
- route: `src/test/app/api/user/sns-login.test.ts` · `sign.test.ts` — `next-auth/jwt` 의 `getToken` · `next/headers` 의 `cookies` · `headers` 를 `vi.hoisted` mock(`src/test/app/api/cookie/token-cookie.test.ts:12-17` 방식, 가짜 cookieStore 에 `getAll` · `delete` 더함), 백엔드는 `vi.stubGlobal('fetch')`(가입은 SSE 본문 `event: accepted` → `event: done` / `event: failed`), 요청은 `new NextRequest(url, init)`.
- 화면: `next/navigation`(`useRouter` · `usePathname`) · `next-auth/react`(`signIn`) · `@/contracts/user/api` 를 mock, 오류 팝업은 `@/shared/utils/error-popup` 의 `showErrorPopup` mock. 로그인 상태는 실제 `RootLayoutProvider`, 내 정보는 실제 `UserMeContext.Provider` 에 값을 넣는다. `SmsVerification` 은 실제 부품(가짜 타이머 없이 — 만료 전에 확인).

---

## Response Codes

| 진입점 | 결과 | 원인 |
|------|------|------|
| `GET /api/user/sns-login/` | 303 `afterLoginPath(…)` + 이용자 토큰 쿠키 · next-auth 쿠키 삭제 | 백엔드 로그인 200 |
| | 303 `/signup/?sns=…&return_url=…` | 백엔드 404(가입하지 않은 SNS 계정) |
| | 303 `/login/?error=sns` | SNS 세션 없음 · 만료 |
| | 303 `/login/?error=login` | 백엔드 그 밖 4xx |
| | 303 `/login/?error=retry` | 백엔드 5xx · 응답 없음 · 빈 결과 |
| `POST /api/user/sign/` | 200 `{success: true, data: {is_phone_verified}}` + 토큰 쿠키 · next-auth 쿠키 삭제 | 큐 done |
| | 200 `{success: false, message: '잘못된 요청입니다.'}` | 같은 사이트 JSON 아님 |
| | 200 `{success: false, code: 'NO_SNS'}` | SNS 세션 없음 · 만료 |
| | 200 `{success: false, message, validation_errors}` | 큐 failed · 동기 실패(미성년 `birth` 등) |
| | 200 `{success: false, message: QUEUE_PENDING_MESSAGE, retry: true}` | 큐 pending |
| | 200 `{success: false, message: NETWORK_ERROR_MESSAGE, retry: true}` | 응답 없음 |
| `signWithSns` | `{state: 'ok', is_phone_verified}` · `{state: 'no-sns'}` | route 성공 · NO_SNS |
| | `ApiError(400, {message, validation_errors})` · `ApiError(503, {message})` · `NetworkError` | route 실패 · retry · route 에 닿지 못함 |
| 화면 | 이동 · 오류 팝업 · 칸 옆 오류 | Business Rules 그대로 |
