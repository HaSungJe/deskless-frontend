import { createServer, Server } from 'node:http';
import { performance } from 'node:perf_hooks';
import { collectDefaultMetrics, Gauge, Registry } from 'prom-client';

/** 지표 포트 — 로컬 기본(백엔드 앱이 9464 ~ 9467 을 쓴다). Docker 안은 compose 가 METRICS_PORT=9464 */
const DEFAULT_METRICS_PORT = 9468;

/** 지표 서버 주소 — 로컬 기본은 이 PC 안에서만. Docker 안은 compose 가 METRICS_HOST=0.0.0.0(모니터링 내부망에서만 닿는다) */
const DEFAULT_METRICS_HOST = '127.0.0.1';

/** 지표 경로 */
const METRICS_PATH = '/metrics';

/** 개발 모드 다시 불러오기(HMR)로 두 번 열리지 않게 남기는 전역 표시 */
type MetricsMarkerType = {
    __desklessMetrics?: boolean; // 이미 열었다
};

/**
 * 지표 전용 서버 — `GET /metrics` 하나(Prometheus 텍스트). 백엔드 모니터링이 이 서버의 부하(CPU · 메모리 · 이벤트 루프)를 모은다
 * - 지침서 frontend/changes/2026-11-22-monitoring-web.md 그대로 — Next.js 라우트로 열지 않는다(공개 주소에 노출), 전용 포트로만
 * - 모든 지표에 `service` 라벨(compose 서비스 이름 · Prometheus job 이름과 같다), 부하율은 `nodejs_eventloop_time_seconds{state}` 로 백엔드가 계산
 * - 포트를 못 열어도 화면은 그대로(오류를 삼킨다)
 *
 * @param service 서비스 이름 — `web`
 * @returns 연 서버(테스트가 닫는다), 이미 열었으면 null
 */
export function startMetricsServer(service: string): Server | null {
    const marker = globalThis as MetricsMarkerType;
    if (marker.__desklessMetrics) {
        return null;
    }
    marker.__desklessMetrics = true;

    const registry = new Registry();
    registry.setDefaultLabels({service});
    collectDefaultMetrics({register: registry});
    new Gauge({
        name: 'nodejs_eventloop_time_seconds',
        help: '이벤트 루프 누적 시간(초) — state: active · idle',
        labelNames: ['state'],
        registers: [registry],
        collect() {
            const elu = performance.eventLoopUtilization();
            this.set({state: 'active'}, elu.active / 1000);
            this.set({state: 'idle'}, elu.idle / 1000);
        },
    });

    const server = createServer((req, res) => {
        if (req.method !== 'GET' || req.url?.split('?')[0] !== METRICS_PATH) {
            res.writeHead(404).end();
            return;
        }

        registry.metrics().then(
            (body) => res.writeHead(200, {'Content-Type': registry.contentType}).end(body),
            () => res.writeHead(500).end(),
        );
    });
    server.on('error', () => undefined);
    server.listen(Number(process.env.METRICS_PORT ?? DEFAULT_METRICS_PORT), process.env.METRICS_HOST ?? DEFAULT_METRICS_HOST);
    return server;
}
