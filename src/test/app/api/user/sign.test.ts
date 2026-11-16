// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/user/sign/route';
import { API_BASE_URL } from '@/shared/api/request';

const {cookiesMock, getTokenMock} = vi.hoisted(() => ({cookiesMock: vi.fn(), getTokenMock: vi.fn()}));

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
    headers: async () => ({get: (): null => null}),
}));

vi.mock('next-auth/jwt', () => ({getToken: getTokenMock}));

type FakeCookieStoreType = {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
};

const fetchMock = vi.fn();

/** 가입 칸 */
const FORM = {gender: 'F', birth: '1998-03-14', nickname: '여행하는고양이'};

/** 백엔드 가입 결과 */
const SIGN_RESULT = {
    access_token: 'user-access',
    refresh_token: 'user-refresh',
    access_token_expires_at: '2026-11-16T10:20:00.000Z',
    refresh_token_expires_at: '2027-11-16T10:00:00.000Z',
    is_phone_verified: 0,
};

/**
 * 가짜 cookies() — next-auth 세션 쿠키 하나
 */
function fakeCookieStore(): FakeCookieStoreType {
    return {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn(() => [{name: 'next-auth.session-token', value: 'x'}]),
    };
}

/**
 * 큐 응답 — accepted 뒤 이벤트 하나
 *
 * @param event done · failed · pending
 * @param data 그 이벤트 data
 */
function queueResponse(event: string, data: unknown): Response {
    const body = `event: accepted\ndata: ${JSON.stringify({request_id: 'r1'})}\n\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    return new Response(body, {status: 200, headers: {'Content-Type': 'text/event-stream'}});
}

/**
 * 가입 요청
 *
 * @param body 본문
 * @param contentType Content-Type
 */
function signRequest(body: unknown, contentType: string = 'application/json'): NextRequest {
    return new NextRequest('http://localhost:5000/api/user/sign/', {method: 'POST', headers: {'Content-Type': contentType}, body: JSON.stringify(body)});
}

let store: FakeCookieStoreType;

beforeEach(() => {
    fetchMock.mockReset();
    getTokenMock.mockReset();
    store = fakeCookieStore();
    cookiesMock.mockReset();
    cookiesMock.mockResolvedValue(store);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('NEXTAUTH_SECRET', 'test-secret');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe('POST /api/user/sign', () => {
    it('[SUCCESS] SNS 계정을 붙여 백엔드 가입 → 토큰 쿠키 · next-auth 쿠키 삭제 → is_phone_verified', async () => {
        getTokenMock.mockResolvedValue({sns_id: 'NAVER', sns_user_id: 'aBc-123_xyz'});
        fetchMock.mockResolvedValue(queueResponse('done', SIGN_RESULT));

        const response = await POST(signRequest({...FORM, sns_user_id: 'someone-else'}));

        expect(await response.json()).toEqual({success: true, data: {is_phone_verified: 0}});
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/user-service/user/sign`);
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({sns_id: 'NAVER', sns_user_id: 'aBc-123_xyz', ...FORM});
        expect(store.set.mock.calls.map((call) => call[0])).toEqual(['user_access_token', 'user_refresh_token']);
        expect(store.delete).toHaveBeenCalledWith({name: 'next-auth.session-token', path: '/', secure: false});
    });

    it('[FAIL:validation] 백엔드 칸 오류(미성년 birth)는 message · validation_errors 그대로 — 토큰 쿠키 없음', async () => {
        getTokenMock.mockResolvedValue({sns_id: 'KAKAO', sns_user_id: '1234567890'});
        const failed = {status_code: 400, message: '입력값을 확인해주세요.', validation_errors: [{property: 'birth', message: '만 19세 이상만 가입할 수 있습니다.'}]};
        fetchMock.mockResolvedValue(queueResponse('failed', failed));

        const response = await POST(signRequest({...FORM, birth: '2010-01-01'}));

        expect(await response.json()).toEqual({success: false, message: failed.message, validation_errors: failed.validation_errors});
        expect(store.set).not.toHaveBeenCalled();
        expect(store.delete).not.toHaveBeenCalled();
    });

    it('[FAIL:no-sns] SNS 세션이 없으면 NO_SNS — 백엔드를 부르지 않는다', async () => {
        getTokenMock.mockResolvedValue(null);

        const response = await POST(signRequest(FORM));

        expect(await response.json()).toEqual({success: false, code: 'NO_SNS'});
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('[FAIL:csrf] JSON 이 아니면 백엔드를 부르지 않는다 — "text/plain; application/json" 같은 단순 요청도', async () => {
        getTokenMock.mockResolvedValue({sns_id: 'KAKAO', sns_user_id: '1234567890'});

        const plain = await POST(signRequest(FORM, 'text/plain'));
        const disguised = await POST(signRequest(FORM, 'text/plain; application/json'));

        expect(await plain.json()).toEqual({success: false, message: '잘못된 요청입니다.'});
        expect(await disguised.json()).toEqual({success: false, message: '잘못된 요청입니다.'});
        expect(fetchMock).not.toHaveBeenCalled();
        expect(getTokenMock).not.toHaveBeenCalled();
    });

    it('[FAIL:cross-site] 다른 사이트에서 온 JSON 요청은 백엔드를 부르지 않는다', async () => {
        getTokenMock.mockResolvedValue({sns_id: 'KAKAO', sns_user_id: '1234567890'});
        const request = new NextRequest('http://localhost:5000/api/user/sign/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site'},
            body: JSON.stringify(FORM),
        });

        const response = await POST(request);

        expect(await response.json()).toEqual({success: false, message: '잘못된 요청입니다.'});
        expect(fetchMock).not.toHaveBeenCalled();
        expect(store.set).not.toHaveBeenCalled();
    });

    it('[FAIL:pending] 큐 pending 이고 로그인으로 다시 조회해도 아직 가입 전(404)이면 늦어짐 문구 · retry — 토큰 쿠키 없음', async () => {
        getTokenMock.mockResolvedValue({sns_id: 'KAKAO', sns_user_id: '1234567890'});
        fetchMock
            .mockResolvedValueOnce(queueResponse('pending', {request_id: 'r1', message: '처리 중'}))
            .mockResolvedValueOnce(new Response(JSON.stringify({message: '잘못된 로그인 정보입니다.', validation_errors: null}), {status: 404, headers: {'Content-Type': 'application/json'}}));

        const response = await POST(signRequest(FORM));

        expect(await response.json()).toEqual({success: false, message: '처리가 늦어지고 있어요. 잠시 뒤 다시 시도해 주세요.', retry: true});
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[1][0]).toBe(`${API_BASE_URL}/user-service/user/login`);
        expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({sns_id: 'KAKAO', sns_user_id: '1234567890'});
        expect(store.set).not.toHaveBeenCalled();
        expect(store.delete).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 큐 pending 이어도 가입이 끝났으면 로그인 결과로 토큰 쿠키 · next-auth 쿠키 삭제', async () => {
        getTokenMock.mockResolvedValue({sns_id: 'KAKAO', sns_user_id: '1234567890'});
        fetchMock
            .mockResolvedValueOnce(queueResponse('pending', {request_id: 'r1', message: '처리 중'}))
            .mockResolvedValueOnce(new Response(JSON.stringify(SIGN_RESULT), {status: 200, headers: {'Content-Type': 'application/json'}}));

        const response = await POST(signRequest(FORM));

        expect(await response.json()).toEqual({success: true, data: {is_phone_verified: 0}});
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(store.set.mock.calls.map((call) => call[0])).toEqual(['user_access_token', 'user_refresh_token']);
        expect(store.delete).toHaveBeenCalledTimes(1);
    });

    it('[FAIL:network] 가입 응답이 없고 로그인 조회도 실패하면 네트워크 문구 · retry', async () => {
        getTokenMock.mockResolvedValue({sns_id: 'KAKAO', sns_user_id: '1234567890'});
        fetchMock.mockRejectedValue(new TypeError('fetch failed'));

        const response = await POST(signRequest(FORM));

        expect(await response.json()).toEqual({success: false, message: '서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.', retry: true});
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(store.set).not.toHaveBeenCalled();
    });
});
