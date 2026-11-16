// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { clearSnsSession, toSnsAccount } from '@/app/api/user/sns-session';

describe('clearSnsSession', () => {
    it('[SUCCESS] next-auth 쿠키만 지운다 — https 이름(__Secure- · __Host-)은 secure 를 붙여', () => {
        const store = {
            getAll: vi.fn(() => [
                {name: '__Secure-next-auth.session-token', value: 'x'},
                {name: '__Host-next-auth.csrf-token', value: 'y'},
                {name: 'next-auth.callback-url', value: 'z'},
                {name: 'user_access_token', value: 'keep'},
            ]),
            delete: vi.fn(),
        };

        clearSnsSession(store as unknown as Parameters<typeof clearSnsSession>[0]);

        expect(store.delete).toHaveBeenCalledTimes(3);
        expect(store.delete).toHaveBeenNthCalledWith(1, {name: '__Secure-next-auth.session-token', path: '/', secure: true});
        expect(store.delete).toHaveBeenNthCalledWith(2, {name: '__Host-next-auth.csrf-token', path: '/', secure: true});
        expect(store.delete).toHaveBeenNthCalledWith(3, {name: 'next-auth.callback-url', path: '/', secure: false});
    });
});

describe('toSnsAccount', () => {
    it('[SUCCESS] 카카오는 KAKAO · 네이버는 NAVER', () => {
        expect(toSnsAccount('kakao', '1234567890')).toEqual({sns_id: 'KAKAO', sns_user_id: '1234567890'});
        expect(toSnsAccount('naver', 'aBc-123_xyz')).toEqual({sns_id: 'NAVER', sns_user_id: 'aBc-123_xyz'});
    });

    it('[FAIL:provider] 카카오 · 네이버가 아니면 null — 상속 이름에도 속지 않는다', () => {
        expect(toSnsAccount('google', '1234')).toBeNull();
        expect(toSnsAccount('constructor', '1234')).toBeNull();
    });

    it('[FAIL:empty] 계정 ID 가 없으면 null', () => {
        expect(toSnsAccount('kakao', '')).toBeNull();
        expect(toSnsAccount('naver', null)).toBeNull();
    });
});
