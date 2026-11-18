/** 콘솔 메뉴 한 줄 — 업체 관리자 · 관리자 */
export type ConsoleMenuItemType = {
    href: string;                  // 주소('/manager/rooms/')
    label: string;                 // 이름
    icon: React.ReactNode;         // svg 안 모양(viewBox 0 0 24 24)
    exact?: boolean;               // 이 주소일 때만 강조(영역 첫 화면 — 대시보드)
    roles?: ReadonlyArray<string>; // 이 권한에게만 보인다 — 없으면 모두
};

/**
 * 보일 메뉴 — 권한이 정해진 메뉴는 그 권한에게만, 권한을 모르면(null) 그 메뉴를 숨긴다
 *
 * @param menu 영역 메뉴
 * @param authId 로그인 때 기억한 권한
 */
export function visibleMenu(menu: ReadonlyArray<ConsoleMenuItemType>, authId: string | null): Array<ConsoleMenuItemType> {
    return menu.filter((item) => !item.roles || (authId !== null && item.roles.includes(authId)));
}

/**
 * 강조할 메뉴 주소 — 메뉴 주소와 같거나 그 아래 주소면 그 메뉴, exact 메뉴는 같을 때만
 * - '/' 단위로 본다 — /manager/rooms 는 /manager/room-groups 아래가 아니다(area.ts isUnder 와 같은 규칙)
 *
 * @param pathname 지금 주소
 * @param menu 보이는 메뉴
 * @returns 메뉴 href, 없으면 null(비밀번호 변경처럼 메뉴 밖 화면)
 */
export function activeMenuHref(pathname: string, menu: ReadonlyArray<ConsoleMenuItemType>): string | null {
    const path = trimSlash(pathname);
    const active = menu.find((item) => {
        const base = trimSlash(item.href);
        return item.exact ? path === base : path === base || path.startsWith(`${base}/`);
    });
    return active?.href ?? null;
}

/**
 * 끝 / 떼기(루트는 그대로)
 *
 * @param path 주소
 */
function trimSlash(path: string): string {
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
}
