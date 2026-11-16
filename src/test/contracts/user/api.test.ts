import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signWithSns } from '@/contracts/user/api';
import { ApiError, NetworkError } from '@/shared/api/request';

const fetchMock = vi.fn();

/** 가입 칸 */
const FORM = {gender: 'F', birth: '1998-03-14', nickname: '여행하는고양이'};

/**
 * 가입 route 응답 — 항상 200 + JSON
 *
 * @param body 본문
 * @param status 상태
 */
function routeResponse(body: unknown, status: number = 200): Response {
    return new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});
}

/**
 * 던진 오류 받기
 *
 * @param promise signWithSns
 */
async function errorOf(promise: Promise<unknown>): Promise<unknown> {
    return promise.then((): null => null, (error: unknown): unknown => error);
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('signWithSns', () => {
    it('[SUCCESS] 성공이면 is_phone_verified — 가입 칸만 같은 사이트 JSON 으로 보낸다', async () => {
        fetchMock.mockResolvedValue(routeResponse({success: true, data: {is_phone_verified: 0}}));

        const result = await signWithSns(FORM);

        expect(result).toEqual({state: 'ok', is_phone_verified: 0});
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('/api/user/sign/');
        expect(fetchMock.mock.calls[0][1].method).toBe('POST');
        expect(fetchMock.mock.calls[0][1].headers).toEqual({'Content-Type': 'application/json'});
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(FORM);
    });

    it('[FAIL:no-sns] NO_SNS 면 no-sns — 던지지 않는다', async () => {
        fetchMock.mockResolvedValue(routeResponse({success: false, code: 'NO_SNS'}));

        expect(await signWithSns(FORM)).toEqual({state: 'no-sns'});
    });

    it('[FAIL:validation] 백엔드 칸 오류는 ApiError(400) — validation_errors 그대로', async () => {
        const validation_errors = [{property: 'birth', message: '만 19세 이상만 가입할 수 있습니다.'}];
        fetchMock.mockResolvedValue(routeResponse({success: false, message: '입력값을 확인해주세요.', validation_errors}));

        const error = await errorOf(signWithSns(FORM));

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).body).toEqual({message: '입력값을 확인해주세요.', validation_errors});
    });

    it('[FAIL:retry] 늦어짐 · 응답 없음(retry)은 ApiError(503) — 문구 그대로', async () => {
        fetchMock.mockResolvedValue(routeResponse({success: false, message: '처리가 늦어지고 있어요. 잠시 뒤 다시 시도해 주세요.', retry: true}));

        const error = await errorOf(signWithSns(FORM));

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(503);
        expect((error as ApiError).body).toEqual({message: '처리가 늦어지고 있어요. 잠시 뒤 다시 시도해 주세요.', validation_errors: null});
    });

    it('[FAIL:network] route 가 200 이 아니거나 본문이 JSON 이 아니거나 닿지 않으면 NetworkError', async () => {
        fetchMock.mockResolvedValueOnce(routeResponse({}, 502));
        fetchMock.mockResolvedValueOnce(new Response('<html>', {status: 200}));
        fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

        expect(await errorOf(signWithSns(FORM))).toBeInstanceOf(NetworkError);
        expect(await errorOf(signWithSns(FORM))).toBeInstanceOf(NetworkError);
        expect(await errorOf(signWithSns(FORM))).toBeInstanceOf(NetworkError);
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });
});
