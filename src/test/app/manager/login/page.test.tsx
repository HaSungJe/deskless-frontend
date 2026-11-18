import { beforeEach, describe, expect, it, vi } from 'vitest';
import ManagerLoginGuide from '@/app/manager/login/page';

const {cookiesMock, redirectMock} = vi.hoisted(() => ({cookiesMock: vi.fn(), redirectMock: vi.fn()}));

vi.mock('next/headers', () => ({cookies: cookiesMock}));
vi.mock('next/navigation', () => ({redirect: redirectMock, useRouter: vi.fn()}));

/** 업체코드 */
const STORE_CODE = '3f9a2c7e5b1d4a8e9c0f6b2d7e4a1c21';

/**
 * 업체코드 쿠키를 가진 cookies()
 *
 * @param storeCode 기억한 업체코드(없으면 쿠키 없음)
 */
function cookieStore(storeCode: string | null): {get: (name: string) => {value: string} | undefined} {
    return {get: (name: string) => (name === 'manager_store_code' && storeCode !== null ? {value: storeCode} : undefined)};
}

/**
 * 안내 page 를 부른다
 *
 * @param query 주소 query
 */
async function openGuide(query: Record<string, string>): Promise<unknown> {
    return ManagerLoginGuide({params: Promise.resolve({}), searchParams: Promise.resolve(query)} as never);
}

beforeEach(() => {
    cookiesMock.mockReset();
    redirectMock.mockReset();
});

describe('/manager/login page — 업체 로그인 주소 안내', () => {
    it('[SUCCESS] 기억한 업체코드가 있으면 그 업체 로그인으로 보낸다(돌아갈 주소를 들고)', async () => {
        cookiesMock.mockResolvedValue(cookieStore(STORE_CODE));

        await openGuide({return_url: '/manager/rooms/'});

        expect(redirectMock).toHaveBeenCalledTimes(1);
        expect(redirectMock).toHaveBeenCalledWith(`/manager/${STORE_CODE}/login/?return_url=%2Fmanager%2Frooms%2F`);
    });

    it('[FAIL:manual] 직접 넣겠다고 왔으면(?manual=1) 기억한 업체코드가 있어도 보내지 않는다', async () => {
        cookiesMock.mockResolvedValue(cookieStore(STORE_CODE));

        const page = await openGuide({manual: '1'});

        expect(redirectMock).not.toHaveBeenCalled();
        expect(page).toBeTruthy();
    });

    it('[FAIL:cookie] 기억한 업체코드가 없거나 모양이 틀리면 보내지 않고 안내를 그린다', async () => {
        cookiesMock.mockResolvedValueOnce(cookieStore(null));
        cookiesMock.mockResolvedValueOnce(cookieStore('not-a-store-code'));

        await openGuide({});
        await openGuide({});

        expect(redirectMock).not.toHaveBeenCalled();
    });
});
