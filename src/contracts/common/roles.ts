/** 회원 권한 — 업체 총관리자(HEAD_MANAGER)만 업체 관리자 관리 · 문 시크릿 설정 */
export const AUTH_ID = {SUPER_ADMIN: 'SUPER_ADMIN', ADMIN: 'ADMIN', HEAD_MANAGER: 'HEAD_MANAGER', MANAGER: 'MANAGER', USER: 'USER'} as const;

/** 로그인 그룹 — 그룹마다 로그인 · 재발급 API 와 토큰이 따로다 */
export const LOGIN_SCOPE = {USER: 'USER', MANAGER: 'MANAGER', ADMIN: 'ADMIN'} as const;

/** 로그인 그룹 값 */
export type LoginScope = (typeof LOGIN_SCOPE)[keyof typeof LOGIN_SCOPE];
