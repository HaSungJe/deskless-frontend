import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import StoreApplicationListContent from '@/app/(user)/store-applications/StoreApplicationListContent';
import { StoreMyApplicationItemResultDto, StoreMyApplicationListDto } from '@/contracts/store/dto/store-my-application-list.dto';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {getMyStoreApplications} = vi.hoisted(() => ({getMyStoreApplications: vi.fn()}));

vi.mock('@/contracts/store/api', () => ({getMyStoreApplications}));

/** 로그인한 이용자 */
const AUTH: AuthContextType = {area: 'user', token: 'user-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/** 승인된 업체코드 */
const STORE_CODE = '3f9a2c7e5b1d4a8e9c0f6b2d7e4a1c21';

/**
 * 신청 한 건
 *
 * @param id 신청 ID
 * @param name 상호명
 * @param extra 바꿀 값
 */
function application(id: string, name: string, extra: Partial<StoreMyApplicationItemResultDto>): StoreMyApplicationItemResultDto {
    return {store_application_id: id, store_application_state_id: 'WAIT', store_name: name, business_number: '2345678901', reject_comment: null, reviewed_at: null, created_at: '2026-11-08T03:00:00.000Z', store_code: null, ...extra};
}

beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://deskless.kr');
    vi.stubEnv('NEXT_PUBLIC_LOCAL_SERVER_PREFIX', '');
    getMyStoreApplications.mockReset();
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('StoreApplicationListContent', () => {
    it('[SUCCESS] 대기 · 반려 · 승인 신청이 있다 → 1쪽 카드(상태 · 반려 사유 · 승인이면 업체코드 · 로그인 주소 · 복사), 카드 링크는 상세', async () => {
        getMyStoreApplications.mockResolvedValue({
            list: [
                application('a'.repeat(32), '스테이 리프 신촌점', {}),
                application('b'.repeat(32), '무인텔 온담 홍대점', {store_application_state_id: 'REJECTED', reject_comment: '사업자등록증 사진이 흐려 확인할 수 없습니다.', reviewed_at: '2026-10-21T03:00:00.000Z'}),
                application('c'.repeat(32), '스테이 리프 강남역점', {store_application_state_id: 'APPROVED', store_code: STORE_CODE, reviewed_at: '2026-10-02T03:00:00.000Z'}),
            ],
            pagination: {all_search_yn: 'N', total_count: 3, page: 1, max_page: 1, page_range: {start: 1, end: 1}, content_start_number: 1, content_start_number_reverse: 3},
        });

        await act(async () => {
            render(
                <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                    <StoreApplicationListContent />
                </RootLayoutProvider>,
            );
        });

        expect(getMyStoreApplications).toHaveBeenCalledTimes(1);
        expect(getMyStoreApplications.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(getMyStoreApplications.mock.calls[0][1]).toBeInstanceOf(StoreMyApplicationListDto);
        expect(getMyStoreApplications.mock.calls[0][1]).toMatchObject({page: 1, size: 20});

        const waiting = screen.getByRole('link', {name: /스테이 리프 신촌점/});
        expect(waiting.getAttribute('href')).toBe(`/store-applications/${'a'.repeat(32)}/`);
        expect(waiting.textContent).toContain('대기');
        expect(waiting.textContent).toContain('사업자등록번호 234-56-78901 · 신청일 2026년 11월 8일');

        expect(screen.getByRole('link', {name: /무인텔 온담 홍대점/}).textContent).toContain('사업자등록증 사진이 흐려 확인할 수 없습니다.');

        expect(screen.getByRole('link', {name: '스테이 리프 강남역점'}).getAttribute('href')).toBe(`/store-applications/${'c'.repeat(32)}/`);
        expect(screen.getByText(`https://deskless.kr/manager/${STORE_CODE}/login/`)).toBeTruthy();
        expect(screen.getByTitle(STORE_CODE).textContent).toBe('3f9a2c7e…');
        expect(screen.getByRole('button', {name: '로그인 주소 복사'})).toBeTruthy();
        expect(screen.getByRole('link', {name: /새 입점 신청/}).getAttribute('href')).toBe('/store-applications/new/');
    });
});
