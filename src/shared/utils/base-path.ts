/**
 * 앱 안 주소에 basePath(하위 경로 배포 prefix — next.config.ts 의 basePath = NEXT_PUBLIC_LOCAL_SERVER_PREFIX)를 붙인다
 * - Next 가 붙여 주는 곳(<Link> · router · redirect())에는 쓰지 않는다 — 두 번 붙는다
 * - 직접 붙여야 하는 곳: route handler fetch · next-auth 주소(callbackUrl · pages · 클라이언트 basePath) · 메타데이터 주소 · 직접 만든 Location 헤더 · 밖에서 돌아올 주소
 * - 빌드할 때 박히는 값(NEXT_PUBLIC_) — 비어 있으면 그대로
 *
 * @param path '/' 로 시작하는 앱 안 주소
 */
export function withBasePath(path: string): string {
    return `${process.env.NEXT_PUBLIC_LOCAL_SERVER_PREFIX ?? ''}${path}`;
}

/**
 * 문서를 새로 연다 — 화면 안 이동과 달리 앱 상태(로그인 상태 · 내 정보)를 모두 버린다(로그아웃 뒤)
 * - basePath 를 붙이고 지금 기록을 바꾼다(뒤로 가기로 돌아오지 않는다)
 *
 * @param path '/' 로 시작하는 앱 안 주소
 */
export function replaceDocument(path: string): void {
    window.location.replace(withBasePath(path));
}
