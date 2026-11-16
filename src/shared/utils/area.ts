/** 화면 영역 — 이용자 / · 업체 관리자 /manager · 관리자 /admin. 영역마다 로그인 · 토큰이 따로다 */
export type AreaType = 'user' | 'manager' | 'admin';

/** 영역 목록 */
export const AREAS: Array<AreaType> = ['user', 'manager', 'admin'];

/** 영역 첫 화면 — 돌아올 주소가 맞지 않을 때 */
export const AREA_HOME: Record<AreaType, string> = {user: '/', manager: '/manager/', admin: '/admin/'};

/** 영역 로그인 화면 — 매니저는 기억한 업체코드로 보내는 안내 화면(Phase 10) */
export const AREA_LOGIN_PATH: Record<AreaType, string> = {user: '/login/', manager: '/manager/login/', admin: '/admin/login/'};

/** 로그인 뒤 돌아올 주소를 담는 query 이름 */
export const RETURN_URL_KEY = 'return_url';

/**
 * 주소로 영역 알기 — /manager · /manager/… 는 manager, /admin · /admin/… 는 admin, 그 밖은 user
 *
 * @param pathname 주소 path (usePathname)
 */
export function areaOf(pathname: string): AreaType {
    if (isUnder(pathname, '/manager')) {
        return 'manager';
    }

    if (isUnder(pathname, '/admin')) {
        return 'admin';
    }

    return 'user';
}

/**
 * 영역 로그인 주소 — 돌아올 주소(같은 사이트 path + query)를 return_url 로 붙인다
 * - 같은 사이트 주소가 아니거나 로그인 화면 자신이면 붙이지 않는다
 *
 * @param area 영역
 * @param returnPath 돌아올 주소 (/stores/1/?date=…)
 */
export function loginUrl(area: AreaType, returnPath?: string | null): string {
    const loginPath = AREA_LOGIN_PATH[area];
    const samePath = toSamePath(returnPath);
    if (!samePath || isLoginPath(samePath, area)) {
        return loginPath;
    }

    return `${loginPath}?${RETURN_URL_KEY}=${encodeURIComponent(samePath)}`;
}

/**
 * 로그인 화면이 return_url 을 읽을 때 — 같은 사이트 주소만, 아니면 그 영역 첫 화면
 *
 * @param raw return_url 값
 * @param area 영역
 */
export function safeReturnPath(raw: string | null | undefined, area: AreaType): string {
    return toSamePath(raw) ?? AREA_HOME[area];
}

/**
 * 그 영역 로그인 화면 주소인지 — query 를 떼고 끝 '/' 가 있든 없든 (AuthGuard 가 로그인 화면은 막지 않는다)
 *
 * @param path 주소
 * @param area 영역
 */
export function isLoginPath(path: string, area: AreaType): boolean {
    const loginPath = AREA_LOGIN_PATH[area];
    const pathOnly = path.split('?')[0];
    return pathOnly === loginPath || pathOnly === loginPath.slice(0, -1);
}

/**
 * base 와 같거나 그 아래 주소인지 — /managerX 는 /manager 아래가 아니다
 *
 * @param pathname 주소 path
 * @param base 영역 시작 path
 */
function isUnder(pathname: string, base: string): boolean {
    return pathname === base || pathname.startsWith(`${base}/`);
}

/** 같은 사이트 주소 확인에 쓰는 가짜 기준 주소 */
const SAME_ORIGIN_BASE = 'http://same-origin.invalid';

/**
 * 같은 사이트 주소면 path + query + hash 로, 아니면 null — 다른 사이트로 보내는 주소 막기
 * - 브라우저와 같은 URL 해석으로 본다('/\t/evil.com' · '/\evil.com' · '//evil.com' 은 모두 다른 사이트)
 * - 해석 뒤 path 가 '//' 로 시작해도 막는다('/..//evil.com' → '//evil.com' — 다시 쓰면 다른 사이트)
 * - 돌아갈 주소를 다른 주소의 query 로 붙일 때도 쓴다(src/app/(user)/login/login-flow.ts)
 *
 * @param path 주소
 */
export function toSamePath(path: string | null | undefined): string | null {
    if (typeof path !== 'string' || !path.startsWith('/')) {
        return null;
    }

    try {
        const url = new URL(path, SAME_ORIGIN_BASE);
        return url.origin === SAME_ORIGIN_BASE && !url.pathname.startsWith('//') ? `${url.pathname}${url.search}${url.hash}` : null;
    } catch {
        return null;
    }
}
