'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SessionProvider, signIn } from 'next-auth/react';
import { useContext, useEffect } from 'react';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { loginUrl, safeReturnPath } from '@/shared/utils/area';
import { withBasePath } from '@/shared/utils/base-path';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { SITE_NAME } from '@/shared/utils/site';
import UserTopBar from '../_components/UserTopBar';
import { FIND_LOGIN_ID_PATH, loginErrorMessage, snsLoginCallbackUrl, withReturnUrl } from './login-flow';
import { TEST_LOGIN_ROUTE } from './test-login';
import styles from '@/app/css/user/LoginContent.module.css';

type LoginContentProps = {
    returnUrl: string | null; // 로그인 뒤 돌아갈 주소
    error: string | null;     // 로그인 route · next-auth 가 알린 실패 코드
    testLogin?: boolean;      // 개발용 테스트 이용자 로그인 버튼 — 개발 서버에서만(page 가 서버에서 판단)
};

/** SNS 공급자 — next-auth provider id */
type SnsProviderType = 'kakao' | 'naver';

/**
 * U5 로그인 — 카카오 · 네이버로 계속, 돌아온 실패는 한 번 안내
 *
 * @param param0
 * @returns
 */
export default function LoginContent({returnUrl, error, testLogin = false}: LoginContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                     // 오류 안내 뒤 · 이미 로그인 때 이동
    const auth = useContext(AuthContext);           // 이미 로그인했는지
    const authBasePath = withBasePath('/api/auth'); // next-auth API 주소 — 클라이언트 signIn 은 NEXTAUTH_URL 을 못 읽어 SessionProvider 로 넘긴다
    const testLoginHref = withBasePath(withReturnUrl(TEST_LOGIN_ROUTE, returnUrl)); // 테스트 로그인 route — 화면 이동이 아니라 route 를 연다(basePath 를 직접 붙인다)

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
        // 로그인 — SessionProvider 는 signIn 주소(basePath)만, session={null} 이라 세션을 부르지 않는다
        <SessionProvider basePath={authBasePath} session={null} refetchOnWindowFocus={false}>
            <div className={styles.page}>
                {/* 상단 바 */}
                <UserTopBar title="로그인" />

                <div className={styles.body}>
                    {/* 브랜드 */}
                    <div className={styles.brand}>
                        <strong className={styles.logo}>{SITE_NAME}</strong>
                        <p className={styles.tagline}>가까운 무인 객실을 지도에서 찾고<br />바로 예약해요</p>
                    </div>

                    {/* SNS 버튼 */}
                    <div className={styles.buttons}>
                        <button type="button" className={`${styles.sns} ${styles.kakao}`} onClick={() => start('kakao')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 6L6.5 20l3.6-2.2c.6.1 1.2.2 1.9.2 5 0 9-3.1 9-7s-4-7-9-7z" /></svg>
                            카카오로 계속하기
                        </button>
                        <button type="button" className={`${styles.sns} ${styles.naver}`} onClick={() => start('naver')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 16V8l6 8V8" /></svg>
                            네이버로 계속하기
                        </button>
                        <p className={styles.notice}>처음이면 SNS 로그인 뒤 가입 정보(성별 · 생년월일 · 닉네임)를 입력해요.<br />가입은 만 19세 이상만 할 수 있어요.</p>

                        {/* 개발용 테스트 로그인 — 개발 서버에서만 */}
                        {testLogin ? (
                            <div className={styles.testBox}>
                                <a className={styles.test} href={testLoginHref}>테스트 이용자로 로그인</a>
                                <span className={styles.testNote}>개발 서버에서만 보여요 (sample-user-01)</span>
                            </div>
                        ) : null}
                    </div>

                    {/* 아이디 찾기 */}
                    <div className={styles.find}>
                        <span>어느 SNS 로 가입했는지 모르겠나요?</span>
                        <Link href={FIND_LOGIN_ID_PATH}>아이디 찾기</Link>
                    </div>
                </div>
            </div>
        </SessionProvider>
    );
}
