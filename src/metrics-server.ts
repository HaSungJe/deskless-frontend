import { createServer, Server, ServerResponse } from 'node:http';
import { performance } from 'node:perf_hooks';
import { collectDefaultMetrics, Gauge, Registry } from 'prom-client';

/** 지표 포트 — 로컬 기본(백엔드 앱이 9464 ~ 9467 을 쓴다). 쿠버네티스는 deskless 차트가 METRICS_PORT=9464 */
const DEFAULT_METRICS_PORT = 9468;

/** 지표 서버 주소 — 로컬 기본은 이 PC 안에서만. 쿠버네티스는 deskless 차트가 METRICS_HOST=0.0.0.0(클러스터 안에서만 닿는다) */
const DEFAULT_METRICS_HOST = '127.0.0.1';

/** 지표 경로 — Prometheus 텍스트 */
const METRICS_PATH = '/metrics';

/** 살아 있음 — 프로세스가 응답하면 늘 200 */
const LIVE_PATH = '/health/live';

/** 준비됨 — 요청을 받을 준비가 되면 200, 그 전 503 */
const READY_PATH = '/health/ready';

/** 지표 서버 상태 */
type MetricsStateType = {
    ready: boolean; // 요청을 받을 준비가 됨 — instrumentation register() 가 끝나면 true
};

/** 개발 모드 다시 불러오기(HMR)로 두 번 열리지 않게 남기는 전역 표시 */
type MetricsMarkerType = {
    __desklessMetrics?: MetricsStateType; // 이미 열었다 — 그 서버의 상태
};

/**
 * 헬스 체크 응답 — 상태 코드가 계약이고 본문은 짧게(프로브는 본문을 보지 않는다)
 *
 * @param res 응답
 * @param ok 200(ok) · 503(not_ready)
 */
function sendHealth(res: ServerResponse, ok: boolean): void {
    res.writeHead(ok ? 200 : 503, {'Content-Type': 'application/json'}).end(JSON.stringify({status: ok ? 'ok' : 'not_ready'}));
}

/**
 * 지표 · 헬스 체크 전용 서버 — `GET /metrics` · `/health/live` · `/health/ready`(지침서 frontend/changes/2026-11-22-monitoring-web.md · 2026-11-23-k8s-cleanup.md)
 * - 이 서버의 부하(CPU · 메모리 · 이벤트 루프)를 deskless(쿠버네티스)가 모으고, 헬스 체크로 파드를 살핀다 — Next.js 라우트로 열지 않는다(공개 주소에 노출), 전용 포트로만
 * - 모든 지표에 `service` 라벨(deskless 의 수집 대상 이름 `web` 과 같다), 부하율은 `nodejs_eventloop_time_seconds{state}` 로 deskless 가 계산
 * - 준비됨은 백엔드 API 를 보지 않는다(백엔드가 잠깐 끊겨도 프론트 파드까지 준비 안 됨이 되지 않게). 종료 때 503 전환은 두지 않는다 — SIGTERM 리스너가 Node 기본 종료를 바꿀 수 있고, 종료 전 대기(preStop)는 deskless 차트가 맡는다
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
    const state: MetricsStateType = {ready: false};
    marker.__desklessMetrics = state;

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
        const path = req.url?.split('?')[0];
        if (req.method !== 'GET') {
            res.writeHead(404).end();
            return;
        }

        if (path === LIVE_PATH) {
            sendHealth(res, true);
            return;
        }

        if (path === READY_PATH) {
            sendHealth(res, state.ready);
            return;
        }

        if (path !== METRICS_PATH) {
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

/**
 * 준비됨 표시 — instrumentation `register()` 가 끝날 때(요청을 받기 전에 끝난다). 이후 `/health/ready` 가 200
 * - 본 포트가 열리는 정확한 때와의 짧은 틈은 deskless 프로브의 첫 확인 지연이 흡수한다
 */
export function markMetricsReady(): void {
    const state = (globalThis as MetricsMarkerType).__desklessMetrics;
    if (state) {
        state.ready = true;
    }
}
