// @vitest-environment node
import { createServer, Server } from 'node:net';
import { afterAll, describe, expect, it } from 'vitest';
import { markMetricsReady, startMetricsServer } from '@/metrics-server';

/** 열어 둔 지표 서버 — 끝나면 닫는다 */
let opened: ReturnType<typeof startMetricsServer> = null;

/** 열어 둔 지표 서버 주소 */
let base = '';

/**
 * 비어 있는 이 PC 포트 하나
 */
async function freePort(): Promise<number> {
    const probe: Server = createServer();
    await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const address = probe.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    await new Promise<void>((resolve) => probe.close(() => resolve()));
    return port;
}

/**
 * 지표 서버가 듣기 시작할 때까지
 *
 * @param server 연 서버
 */
async function listening(server: NonNullable<typeof opened>): Promise<void> {
    if (!server.listening) {
        await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    }
}

afterAll(async () => {
    if (opened) {
        await new Promise<void>((resolve) => opened?.close(() => resolve()));
    }
});

describe('startMetricsServer — 지표 · 헬스 체크 전용 서버(이 PC 안에서만)', () => {
    it('[SUCCESS] GET /metrics — service="web" 이 붙은 기본 지표 · 이벤트 루프 누적 시간(active · idle), 다른 경로는 404', async () => {
        const port = await freePort();
        process.env.METRICS_PORT = String(port);
        process.env.METRICS_HOST = '127.0.0.1';
        opened = startMetricsServer('web');
        expect(opened).not.toBeNull();
        await listening(opened as NonNullable<typeof opened>);
        base = `http://127.0.0.1:${port}`;

        const response = await fetch(`${base}/metrics`);
        const body = await response.text();
        expect(response.status).toBe(200);
        expect(body).toMatch(/^process_cpu_seconds_total\{[^}]*service="web"[^}]*\} /m);
        expect(body).toMatch(/^nodejs_eventloop_time_seconds\{(?=[^}]*state="active")(?=[^}]*service="web")[^}]*\} /m);
        expect(body).toMatch(/^nodejs_eventloop_time_seconds\{(?=[^}]*state="idle")(?=[^}]*service="web")[^}]*\} /m);

        expect((await fetch(`${base}/api/metrics`)).status).toBe(404);
    });

    it('[SUCCESS] 헬스 체크 — /health/live 는 늘 200, /health/ready 는 준비 전 503 → register() 끝(markMetricsReady) 뒤 200', async () => {
        const live = await fetch(`${base}/health/live`);
        expect(live.status).toBe(200);
        expect(await live.json()).toEqual({status: 'ok'});

        const before = await fetch(`${base}/health/ready`);
        expect(before.status).toBe(503);
        expect(await before.json()).toEqual({status: 'not_ready'});

        markMetricsReady();

        const after = await fetch(`${base}/health/ready?probe=1`);
        expect(after.status).toBe(200);
        expect(await after.json()).toEqual({status: 'ok'});
        expect((await fetch(`${base}/health/live`)).status).toBe(200);
    });

    it('[FAIL:twice] 이미 열었으면(개발 모드 다시 불러오기) 다시 열지 않는다 — 준비됨도 그대로', async () => {
        expect(startMetricsServer('web')).toBeNull();
        expect((await fetch(`${base}/health/ready`)).status).toBe(200);
    });
});
