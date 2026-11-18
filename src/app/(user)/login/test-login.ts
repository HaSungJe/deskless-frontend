/** 개발용 테스트 이용자 — 백엔드가 이 SNS 계정으로 바로 로그인시킨다(사용자 안내 2026-11-18) */
export const TEST_USER_ACCOUNT = {sns_id: 'KAKAO', sns_user_id: 'sample-user-01'} as const;

/** 테스트 로그인 route — 로그인 화면의 개발용 버튼이 연다 */
export const TEST_LOGIN_ROUTE = '/api/user/test-login/';

/** 판단에 쓰는 환경 값 — 기본은 process.env */
type TestLoginEnvType = {
    NODE_ENV?: string; // development 만(npm run dev) — 운영 빌드는 production
};

/**
 * 테스트 로그인을 쓸 수 있는지 — 개발 서버에서만(카카오 로그인 키가 있어도 — 사용자 결정 2026-11-18)
 * - 로그인 화면의 버튼과 테스트 로그인 route 가 같은 판단을 쓴다 — 아니면 버튼은 숨고 route 는 404
 *
 * @param env 환경 값(테스트에서 바꿔 넣는다)
 */
export function isTestLoginEnabled(env: TestLoginEnvType = process.env): boolean {
    return env.NODE_ENV === 'development';
}
