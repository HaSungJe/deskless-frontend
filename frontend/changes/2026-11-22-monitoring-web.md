# 프론트(Next.js 서버) 모니터링 연결 — 프론트 수정 요청 (2026-11-22)

- 백엔드: spec `.beaver/output/spec/monitoring/monitoring-dashboard-spec.md` · 커밋 2026.11.23
- 규격: deskless-backend `docs/guides/monitoring-integration.md`(다른 프로젝트를 붙이는 공통 규격 — 이 요청은 그 첫 적용이고, **이 문서만으로 작업할 수 있게** 필요한 내용을 모두 옮겨 두었다)
- 반영 순서: 상관없음 — 백엔드 Prometheus 는 `web` 이 붙기 전에는 수집 대상 0개(오류 아님). 화면 · API 는 바뀌지 않는다

## 바뀐 이유
백엔드에 서버 부하 대시보드(Prometheus · Grafana)를 붙였다 — 시간대별 부하를 보고 인스턴스 수를 정하는 근거. 프론트가 부르는 API 의 요청 수 · 응답 시간은 gateway 지표로 이미 보인다. **Next.js 서버 자체의 부하**(서버에서 화면을 그리는 일 · route handler)는 프론트가 지표를 내야 보인다. 같은 서버의 Docker 에서 돌므로 백엔드와 같은 방식으로 모은다 — 붙으면 Grafana "서비스 부하" 대시보드에 `web` 의 인스턴스 수 · 부하율 · CPU · 메모리 · 이벤트 루프 지연이 시간대별로 나오고, 프론트 인스턴스를 늘릴지 정하는 근거가 된다.

## 영향 화면
- 없음(화면 · 동작 그대로) — 서버 쪽 설정만

## 정한 값

| 항목 | 값 |
|---|---|
| 서비스 이름 | **`web`** — compose 서비스 이름 = Prometheus job 이름 = 지표의 `service` 라벨(셋이 같아야 한다) |
| 네트워크 | **`deskless-monitoring`** — 백엔드의 `npm run docker:network` 가 만드는 외부 네트워크(internal — 밖으로 나가는 길 · 호스트 포트 없음). 프론트 compose 에서 `external: true` 로 선언해 붙는다 |
| 지표 포트 · 경로 | Docker 안 **9464** · **`GET /metrics`** · Prometheus 텍스트 형식. 로컬 기본 포트는 **9468**(백엔드 앱이 9464 ~ 9467 을 쓴다) |
| 노출 | 지표는 **전용 포트로만** — Next.js 라우트(`/api/metrics` 같은)로 열지 않는다(공개 주소에 노출된다). compose 에 `ports` 로 호스트 포트도 열지 않는다 |
| 인스턴스 | 여러 대로 늘려도 된다(`--scale` · replicas) — Prometheus 가 `web` 을 DNS 로 풀어 인스턴스를 모두 찾는다 |

## 내야 하는 지표

| 지표 | 종류 | 라벨 | 설명 |
|---|---|---|---|
| (모든 지표 공통) | — | `service="web"` | 기본 라벨 |
| `process_cpu_seconds_total` · `process_resident_memory_bytes` · `nodejs_eventloop_lag_p99_seconds` 등 | prom-client 기본 지표 | — | `collectDefaultMetrics()` 가 이 이름 그대로 낸다 |
| `nodejs_eventloop_time_seconds` | gauge(누적 초) | `state` = `active` · `idle` | **필수** — 이벤트 루프가 일한 · 쉰 누적 시간. 백엔드가 이 값으로 부하율을 계산한다(이름 · 라벨이 다르면 부하율 · 대시보드에 안 나온다) |

**라벨 금지** — ID · 주소 · 사용자 입력처럼 끝없이 늘어나는 값(시계열이 터진다), `job` · `instance`(Prometheus 가 붙이는 이름이라 바뀐다). 프론트 전용 지표를 더하면 이름 앞에 `web_` 를 붙인다.

## 할 일

- [ ] 의존성 `prom-client@^15`
- [ ] `instrumentation.ts` + `lib/metrics-server.ts` — 아래 코드 그대로(서비스 이름 `web`)
- [ ] compose — 서비스 이름 `web`, 네트워크에 `deskless-monitoring`(external), env `METRICS_PORT: '9464'` · `METRICS_HOST: '0.0.0.0'` — 아래 예시
- [ ] 확인 — 아래 "확인" 3가지

### 코드

Next.js 는 서버가 시작할 때 `instrumentation.ts` 의 `register()` 를 한 번 부른다(Node 런타임에서만 지표 서버를 연다 — Edge 런타임에는 `node:http` 가 없다).

```ts
// instrumentation.ts (프로젝트 루트 또는 src/)
export async function register(): Promise<void> {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const {startMetricsServer} = await import('./lib/metrics-server');
        startMetricsServer('web');
    }
}
```

```ts
// lib/metrics-server.ts
import {createServer} from 'node:http';
import {performance} from 'node:perf_hooks';
import {collectDefaultMetrics, Gauge, Registry} from 'prom-client';

/**
 * 지표 전용 서버 — /metrics 하나. 개발 모드의 다시 불러오기(HMR)로 두 번 열리지 않게 전역 표시를 둔다.
 *
 * @param service 서비스 이름(compose 서비스 이름 · Prometheus job 이름과 같다)
 */
export function startMetricsServer(service: string): void {
    const marker = globalThis as {__desklessMetrics?: boolean};
    if (marker.__desklessMetrics) {
        return;
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
        if (req.method !== 'GET' || req.url?.split('?')[0] !== '/metrics') {
            res.writeHead(404).end();
            return;
        }
        registry.metrics().then(
            (body) => res.writeHead(200, {'Content-Type': registry.contentType}).end(body),
            () => res.writeHead(500).end(),
        );
    });
    server.on('error', () => undefined); // 포트를 못 열어도 화면은 그대로
    server.listen(Number(process.env.METRICS_PORT ?? 9468), process.env.METRICS_HOST ?? '127.0.0.1');
}
```

### compose (프론트 저장소)

```yaml
services:
    web: # 서비스 이름 = Prometheus job 이름 — 바꾸면 백엔드와 다시 맞춘다
        environment:
            METRICS_PORT: '9464' # Docker 안은 9464 고정
            METRICS_HOST: '0.0.0.0' # 모니터링 내부망에서만 닿는다(ports 로 호스트에 열지 않는다)
        networks: [default, monitoring] # 기존 네트워크는 그대로 두고 monitoring 을 더한다

networks:
    monitoring:
        name: deskless-monitoring
        external: true # 백엔드 npm run docker:network 가 만든다 — 없으면 프론트 compose 가 뜨지 않으니 백엔드 묶음을 먼저 한 번 띄운 서버에서 실행
```

### 확인

1. 프론트 컨테이너 안에서 `wget -qO- http://127.0.0.1:9464/metrics | grep nodejs_eventloop_time_seconds` — `service="web"` 이 붙어 나온다.
2. 백엔드 서버에서 Prometheus `http://localhost:9090/targets` — `web` 인스턴스가 모두 **UP**(백엔드 모니터링 묶음이 떠 있을 때).
3. Grafana `http://localhost:3001` → Deskless → "서비스 부하" — 맨 위 서비스 목록에 `web` 이 나오고, 부하율 · CPU · 메모리 · 이벤트 루프 지연 패널에 선이 그려진다. HTTP · DB · 큐 패널은 `web` 이 그 지표를 내지 않아 비어 있는 것이 정상이다(프론트가 부르는 API 는 gateway 로 본다).

## 백엔드 쪽(이미 반영)
- [x] Prometheus 수집 대상 `web`(DNS — 서비스 이름 `web` · 9464) — `docker/prometheus/prometheus.yml`
- [x] 대시보드 서비스 목록은 Prometheus 에서 읽어 `web` 이 붙으면 저절로 나온다(대시보드 수정 없음)
- 서비스 이름 · 포트를 바꾸고 싶으면 백엔드에 알려 수집 대상을 함께 고친다

## 바뀐 DTO
없음.
