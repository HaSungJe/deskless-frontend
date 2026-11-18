import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loginManagerByRoute } from '@/contracts/manager/api';
import { ManagerLoginDto } from '@/contracts/manager/dto/manager-login.dto';
import { ApiError, NetworkError } from '@/shared/api/request';

const fetchMock = vi.fn();

/** 로그인 칸 */
const FORM = {store_code: '3f9a2c7e5b1d4a8e9c0f6b2d7e4a1c21', login_id: 'leaf_gangnam', login_pw: 'leafpass2026'};

/**
 * 로그인 처리 route 응답 — 항상 200 + JSON
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
 * @param promise loginManagerByRoute
 */
async function errorOf(promise: Promise<unknown>): Promise<unknown> {
    return promise.then((): null => null, (error: unknown): unknown => error);
}

/**
 * 로그인 DTO
 */
function dto(): ManagerLoginDto {
    return Object.assign(new ManagerLoginDto(), FORM);
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('loginManagerByRoute', () => {
    it('[SUCCESS] 성공이면 비밀번호 변경 필요 여부 — 업체코드 · 아이디 · 비밀번호만 같은 사이트 JSON 으로 보낸다', async () => {
        fetchMock.mockResolvedValue(routeResponse({success: true, data: {is_password_change_required: 1}}));

        const result = await loginManagerByRoute(dto());

        expect(result).toEqual({is_password_change_required: 1});
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('/api/manager/login/');
        expect(fetchMock.mock.calls[0][1].method).toBe('POST');
        expect(fetchMock.mock.calls[0][1].headers).toEqual({'Content-Type': 'application/json'});
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(FORM);
    });

    it('[FAIL:backend] 거절은 ApiError(400) — 문구 · 칸 오류 · 정지 사유 그대로', async () => {
        fetchMock.mockResolvedValue(routeResponse({success: false, message: '이용이 제한된 계정입니다.', validation_errors: null, block_comment: '근무 종료'}));

        const error = await errorOf(loginManagerByRoute(dto()));

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).body).toEqual({message: '이용이 제한된 계정입니다.', validation_errors: null, block_comment: '근무 종료'});
    });

    it('[FAIL:retry] 다시 시도(retry)는 ApiError(503) — 문구 그대로', async () => {
        fetchMock.mockResolvedValue(routeResponse({success: false, message: '서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.', retry: true}));

        const error = await errorOf(loginManagerByRoute(dto()));

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(503);
        expect((error as ApiError).body).toEqual({message: '서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.', validation_errors: null, block_comment: null});
    });

    it('[FAIL:network] route 가 200 이 아니거나 본문이 JSON 이 아니거나 닿지 않으면 NetworkError', async () => {
        fetchMock.mockResolvedValueOnce(routeResponse({}, 502));
        fetchMock.mockResolvedValueOnce(new Response('<html>', {status: 200}));
        fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

        expect(await errorOf(loginManagerByRoute(dto()))).toBeInstanceOf(NetworkError);
        expect(await errorOf(loginManagerByRoute(dto()))).toBeInstanceOf(NetworkError);
        expect(await errorOf(loginManagerByRoute(dto()))).toBeInstanceOf(NetworkError);
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });
});
