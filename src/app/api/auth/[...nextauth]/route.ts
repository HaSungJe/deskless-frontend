import NextAuth from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import NaverProvider from 'next-auth/providers/naver';
import { toSnsAccount } from '../../user/sns-session';

/** SNS 세션 — 로그인 · 가입을 마칠 동안만(초) */
const SNS_SESSION_MAX_AGE = 10 * 60;

// SNS 로그인(카카오 · 네이버) — 검증된 SNS 계정은 이 세션(httpOnly · NEXTAUTH_SECRET 암호화)에만 두고, 백엔드 로그인 · 가입은 /api/user/* route 가 한다
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
