/**
 * 서버가 뜰 때 한 번 — 요청을 받기 전에 끝난다.
 * 지침서 DTO 의 `@Type`(class-transformer)이 클래스를 읽을 때 `Reflect.getMetadata` 를 부르므로 `reflect-metadata` 를 먼저 붙인다(서버 렌더링).
 * Node 런타임이면 지표 · 헬스 체크 서버(`/metrics` · `/health/live` · `/health/ready` — 전용 포트)를 열고, 끝에서 준비됨으로 표시한다 — Edge 런타임에는 `node:http` 가 없다(frontend/changes/2026-11-22-monitoring-web.md · 2026-11-23-k8s-cleanup.md).
 * 브라우저는 `instrumentation-client.ts`, 테스트는 `vitest.setup.ts`.
 */
export async function register(): Promise<void> {
    await import('reflect-metadata');

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const {markMetricsReady, startMetricsServer} = await import('./metrics-server');
        startMetricsServer('web');
        markMetricsReady(); // register() 가 끝나면 요청을 받는다 — 그때부터 /health/ready 200
    }
}
