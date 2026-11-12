'use client';
import { deleteToken, getAccessToken } from '@/shared/api/cookie';
import { AccessTokenContextType } from '@/shared/types/access';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

type AccessType = AccessTokenContextType & {
    reload?: number; // 401 재시도 횟수
}

type Headers = Record<string, string>;

const MAX_RELOAD: number = 5;

/**
 * 로그인 토큰을 붙여 요청 — 401 이면 토큰을 다시 받아 최대 MAX_RELOAD 번 재시도, 그래도 안 되면 토큰을 지우고 에러를 던진다
 *
 * @param access
 * @param config
 */
async function request<T = any>(access: AccessType, config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    access.reload = access?.reload ?? 0;

    try {
        return await axios.request<T>({
            ...config,
            headers: {...config.headers, authorization: `Bearer ${access.accessToken}`},
        });
    } catch (error: any) {
        if (error?.response?.data?.statusCode !== 401) {
            throw error;
        }

        if (access.reload < MAX_RELOAD) {
            const accessToken = await getAccessToken();
            if (accessToken) {
                access.setAccessToken(accessToken);
                access.accessToken = accessToken;
                access.reload += 1;
                return await request<T>(access, config);
            }
        }

        access.setAccessToken(null);
        await deleteToken();
        throw error;
    }
}

/**
 * Get
 *
 * @param access
 * @param url
 * @param headers
 */
export function axiosGet<T = any>(access: AccessType, url: string, headers: Headers = {}): Promise<AxiosResponse<T>> {
    return request<T>(access, {method: 'get', url, headers});
}

/**
 * Post
 *
 * @param access
 * @param url
 * @param body
 * @param headers
 */
export function axiosPost<T = any>(access: AccessType, url: string, body?: unknown, headers: Headers = {}): Promise<AxiosResponse<T>> {
    return request<T>(access, {method: 'post', url, data: body, headers});
}

/**
 * Put
 *
 * @param access
 * @param url
 * @param body
 * @param headers
 */
export function axiosPut<T = any>(access: AccessType, url: string, body?: unknown, headers: Headers = {}): Promise<AxiosResponse<T>> {
    return request<T>(access, {method: 'put', url, data: body, headers});
}

/**
 * Patch
 *
 * @param access
 * @param url
 * @param body
 * @param headers
 */
export function axiosPatch<T = any>(access: AccessType, url: string, body?: unknown, headers: Headers = {}): Promise<AxiosResponse<T>> {
    return request<T>(access, {method: 'patch', url, data: body, headers});
}

/**
 * Delete
 *
 * @param access
 * @param url
 * @param body
 * @param headers
 */
export function axiosDelete<T = any>(access: AccessType, url: string, body?: unknown, headers: Headers = {}): Promise<AxiosResponse<T>> {
    return request<T>(access, {method: 'delete', url, data: body, headers});
}
