/**
 * 서버가 뜰 때 한 번 — 요청을 받기 전에 끝난다.
 * 지침서 DTO 의 `@Type`(class-transformer)이 클래스를 읽을 때 `Reflect.getMetadata` 를 부르므로 `reflect-metadata` 를 먼저 붙인다(서버 렌더링).
 * 브라우저는 `instrumentation-client.ts`, 테스트는 `vitest.setup.ts`.
 */
export async function register(): Promise<void> {
    await import('reflect-metadata');
}
