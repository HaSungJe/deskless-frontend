// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/payments/confirm/route';
import { CONFIRM_FAIL_MESSAGE, CONFIRM_RETRY_MESSAGE, TOSS_CONFIRM_URL, toConfirmResult } from '@/app/api/payments/confirm/toss-confirm';

const {cookiesMock} = vi.hoisted(() => ({cookiesMock: vi.fn()}));

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
    headers: async () => ({get: (): null => null}),
}));

const fetchMock = vi.fn();

const PAYMENT_ID = '0123456789abcdef0123456789abcdef';

/** 성공 주소 query */
const QUERY = {paymentKey: 'tgen_20261116_pk', orderId: PAYMENT_ID, amount: 12000};

/**
 * 가짜 cookies() — 이용자 refresh 쿠키가 있는지
 *
 * @param loggedIn refresh 쿠키가 있는지
 */
function cookieStore(loggedIn: boolean): {get: (name: string) => {name: string; value: string} | undefined} {
    return {
        get: (name: string) => (loggedIn && name === 'user_refresh_token' ? {name, value: 'refresh'} : undefined),
    };
}

/**
 * 승인 요청
 *
 * @param body 본문
 */
function confirmRequest(body: unknown): Request {
    return new Request('http://localhost/api/payments/confirm/', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
}

beforeEach(() => {
    fetchMock.mockReset();
    cookiesMock.mockReset();
    cookiesMock.mockResolvedValue(cookieStore(true));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('TOSS_SECRET_KEY', 'test_gsk_key');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe('toConfirmResult', () => {
    it('[SUCCESS] 200 이면 ok', () => {
        expect(toConfirmResult(200, {paymentKey: 'pk', status: 'DONE'})).toEqual({state: 'ok'});
    });

    it('[SUCCESS] 이미 처리된 결제(새로고침 · 다시 승인)도 ok', () => {
        expect(toConfirmResult(400, {code: 'ALREADY_PROCESSED_PAYMENT', message: '이미 처리된 결제 입니다.'})).toEqual({state: 'ok'});
    });

    it('[FAIL:toss] 그 밖 4xx 는 토스 code · message 그대로', () => {
        expect(toConfirmResult(400, {code: 'REJECT_CARD_COMPANY', message: '카드사에서 거절했습니다.'}))
            .toEqual({state: 'fail', code: 'REJECT_CARD_COMPANY', message: '카드사에서 거절했습니다.'});
        expect(toConfirmResult(404, {code: 'NOT_FOUND_PAYMENT_SESSION', message: '결제 시간이 만료되어 결제 진행 데이터가 존재하지 않습니다.'}))
            .toEqual({state: 'fail', code: 'NOT_FOUND_PAYMENT_SESSION', message: '결제 시간이 만료되어 결제 진행 데이터가 존재하지 않습니다.'});
    });

    it('[FAIL:key] 401 · 403(키 문제)은 토스 문구 대신 일반 문구', () => {
        expect(toConfirmResult(401, {code: 'UNAUTHORIZED_KEY', message: '인증되지 않은 시크릿 키 혹은 클라이언트 키 입니다.'}))
            .toEqual({state: 'fail', code: 'UNAUTHORIZED_KEY', message: CONFIRM_FAIL_MESSAGE});
    });

    it('[FAIL:body] 4xx 인데 본문을 못 읽으면 일반 문구 · code 없음', () => {
        expect(toConfirmResult(400, null)).toEqual({state: 'fail', message: CONFIRM_FAIL_MESSAGE});
    });

    it('[FAIL:retry] 같은 승인이 처리 중(409)이면 retry', () => {
        expect(toConfirmResult(409, {code: 'IDEMPOTENT_REQUEST_PROCESSING', message: '이전 요청이 처리 중입니다.'}))
            .toEqual({state: 'retry', message: CONFIRM_RETRY_MESSAGE});
    });

    it('[FAIL:retry] 5xx · 응답 없음은 retry', () => {
        expect(toConfirmResult(500, {code: 'FAILED_INTERNAL_SYSTEM_PROCESSING', message: '내부 시스템 처리 작업이 실패했습니다.'}))
            .toEqual({state: 'retry', message: CONFIRM_RETRY_MESSAGE});
        expect(toConfirmResult(null, null)).toEqual({state: 'retry', message: CONFIRM_RETRY_MESSAGE});
    });
});

describe('POST /api/payments/confirm', () => {
    it('[SUCCESS] 시크릿 키로 토스 승인을 한 번 부르고 success', async () => {
        fetchMock.mockResolvedValue(new Response(JSON.stringify({paymentKey: QUERY.paymentKey, status: 'DONE'}), {status: 200}));

        const response = await POST(confirmRequest(QUERY));

        expect(await response.json()).toEqual({success: true});
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(TOSS_CONFIRM_URL);
        expect(init.method).toBe('POST');
        expect(init.headers.Authorization).toBe(`Basic ${Buffer.from('test_gsk_key:').toString('base64')}`);
        expect(init.headers['Idempotency-Key']).toBe(QUERY.paymentKey);
        expect(JSON.parse(init.body)).toEqual(QUERY);
    });

    it('[FAIL:toss] 토스 4xx 는 문구 · code, 5xx 는 retry', async () => {
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({code: 'REJECT_CARD_COMPANY', message: '카드사에서 거절했습니다.'}), {status: 400}));
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({code: 'FAILED_INTERNAL_SYSTEM_PROCESSING', message: '내부'}), {status: 500}));

        const rejected = await POST(confirmRequest(QUERY));
        const busy = await POST(confirmRequest(QUERY));

        expect(await rejected.json()).toEqual({success: false, message: '카드사에서 거절했습니다.', code: 'REJECT_CARD_COMPANY'});
        expect(await busy.json()).toEqual({success: false, message: CONFIRM_RETRY_MESSAGE, retry: true});
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('[FAIL:validation] orderId 가 32자 hex 가 아니거나 amount 가 0 이거나 paymentKey 에 다른 글자가 있으면 토스를 부르지 않는다', async () => {
        const badOrder = await POST(confirmRequest({...QUERY, orderId: 'order-1'}));
        const zero = await POST(confirmRequest({...QUERY, amount: 0}));
        const badKey = await POST(confirmRequest({...QUERY, paymentKey: 'pk\r\nX-Injected: 1'}));

        expect(await badOrder.json()).toEqual({success: false, message: '결제 정보가 올바르지 않습니다.'});
        expect(await zero.json()).toEqual({success: false, message: '결제 정보가 올바르지 않습니다.'});
        expect(await badKey.json()).toEqual({success: false, message: '결제 정보가 올바르지 않습니다.'});
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('[FAIL:login] 이용자 refresh 쿠키가 없으면 토스를 부르지 않는다', async () => {
        cookiesMock.mockResolvedValue(cookieStore(false));

        const response = await POST(confirmRequest(QUERY));

        expect(await response.json()).toEqual({success: false, message: '로그인이 필요합니다.'});
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('[FAIL:config] 시크릿 키가 없으면 토스를 부르지 않는다', async () => {
        vi.stubEnv('TOSS_SECRET_KEY', '');

        const response = await POST(confirmRequest(QUERY));

        expect(await response.json()).toEqual({success: false, message: '결제 설정이 없습니다.'});
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('[FAIL:csrf] JSON 이 아니거나 다른 사이트(Sec-Fetch-Site: cross-site)에서 온 요청은 토스를 부르지 않는다', async () => {
        const plain = new Request('http://localhost/api/payments/confirm/', {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: JSON.stringify(QUERY)});
        const crossSite = new Request('http://localhost/api/payments/confirm/', {method: 'POST', headers: {'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site'}, body: JSON.stringify(QUERY)});

        const plainResponse = await POST(plain);
        const crossSiteResponse = await POST(crossSite);

        expect(await plainResponse.json()).toEqual({success: false, message: '결제 정보가 올바르지 않습니다.'});
        expect(await crossSiteResponse.json()).toEqual({success: false, message: '결제 정보가 올바르지 않습니다.'});
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
