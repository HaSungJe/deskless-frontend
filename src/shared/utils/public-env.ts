/**
 * 공개 값(NEXT_PUBLIC_*) 읽기 한 곳 — 빌드 때가 아니라 실행 때 읽는다(이미지 하나로 모든 환경 — frontend/changes/2026-11-24-runtime-public-env.md)
 * - 서버: 요청 때 `process.env` 에서. 동적 키(`process.env[key]`)라 `next build` 가 빌드 값으로 바꿔 박지 않는다
 * - 브라우저: 루트 layout 이 요청 때 읽어 넘긴 값(`RootLayoutContent` 가 처음 그릴 때 `applyPublicEnv`)에서
 * - **정적 참조 `process.env.NEXT_PUBLIC_X` 를 쓰지 않는다** — 빌드가 서버 · 클라이언트 번들 모두에서 그 자리를 빌드 값으로 바꾼다. 예외는 basePath(`NEXT_PUBLIC_LOCAL_SERVER_PREFIX` — next.config 가 빌드 때 정한다)
 */

/** 공개 값 — 키는 NEXT_PUBLIC_* */
export type PublicEnvType = Record<string, string>;

/** 공개 값 머리 */
const PUBLIC_PREFIX = 'NEXT_PUBLIC_';

/** 브라우저로 넘기지 않는 공개 값 — 빌드 때 정해지는 값(basePath — next.config) */
const BUILD_ONLY_KEYS: ReadonlyArray<string> = ['NEXT_PUBLIC_LOCAL_SERVER_PREFIX'];

/** 브라우저에 둔 공개 값 자리 */
type PublicEnvWindowType = {
    __DESKLESS_PUBLIC_ENV__?: PublicEnvType; // 루트 layout 이 넘긴 값
};

/**
 * 브라우저로 넘길 공개 값 — 서버(루트 layout)가 요청 때. 허용 목록은 `NEXT_PUBLIC_` 로 시작하는 키 중 basePath 를 뺀 것(빈 값은 뺀다)
 * - 서버 전용 값(`NEXTAUTH_SECRET` · `TOSS_SECRET_KEY` · `API_INTERNAL_URL` …)은 이름이 달라 실리지 않는다
 *
 * @param env 읽을 환경 — 기본 process.env
 */
export function publicEnvValues(env: Record<string, string | undefined> = process.env): PublicEnvType {
    const values: PublicEnvType = {};
    for (const [key, value] of Object.entries(env)) {
        if (key.startsWith(PUBLIC_PREFIX) && !BUILD_ONLY_KEYS.includes(key) && value) {
            values[key] = value;
        }
    }

    return values;
}

/**
 * 받은 공개 값을 브라우저에 둔다 — `RootLayoutContent` 가 처음 그릴 때(그 아래 화면이 그리기 전). 서버에서는 하지 않는다
 *
 * @param values 루트 layout 이 넘긴 값
 */
export function applyPublicEnv(values: PublicEnvType): void {
    if (typeof window === 'undefined') {
        return;
    }

    (window as PublicEnvWindowType).__DESKLESS_PUBLIC_ENV__ = values;
}

/**
 * 공개 값 하나 — 서버는 요청 때 `process.env`, 브라우저는 받아 둔 값. 없거나 비었으면 undefined
 *
 * @param key NEXT_PUBLIC_* 키
 */
export function getPublicEnv(key: string): string | undefined {
    if (typeof window === 'undefined') {
        return process.env[key] || undefined;
    }

    return (window as PublicEnvWindowType).__DESKLESS_PUBLIC_ENV__?.[key] || undefined;
}
