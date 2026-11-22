/**
 * 서버가 뜰 때 한 번 — 요청을 받기 전에 끝난다.
 * 지침서 DTO 의 `@Type`(class-transformer)이 클래스를 읽을 때 `Reflect.getMetadata` 를 부르므로 `reflect-metadata` 를 먼저 붙인다(서버 렌더링).
 * Node 런타임이면 모니터링 지표 서버(`/metrics` — 전용 포트)를 연다 — Edge 런타임에는 `node:http` 가 없다(frontend/changes/2026-11-22-monitoring-web.md).
 * 브라우저는 `instrumentation-client.ts`, 테스트는 `vitest.setup.ts`.
 */
export async function register(): Promise<void> {
    await import('reflect-metadata');

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const {startMetricsServer} = await import('./metrics-server');
        startMetricsServer('web');
    }
}
