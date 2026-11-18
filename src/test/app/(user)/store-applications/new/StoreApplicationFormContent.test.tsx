import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import StoreApplicationFormContent from '@/app/(user)/store-applications/new/StoreApplicationFormContent';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {createStoreApplication, searchAddressWithCoords, replace, showErrorPopup} = vi.hoisted(() => ({
    createStoreApplication: vi.fn(),
    searchAddressWithCoords: vi.fn(),
    replace: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/store/api', () => ({createStoreApplication}));
vi.mock('@/shared/utils/address', () => ({searchAddressWithCoords, preloadAddressSearch: vi.fn()}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

/** 로그인한 이용자 */
const AUTH: AuthContextType = {area: 'user', token: 'user-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/** 신청 ID */
const APPLICATION_ID = 'a'.repeat(32);

/**
 * 작성 화면을 그린다
 */
function renderForm(): HTMLElement {
    const {container} = render(
        <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
            <StoreApplicationFormContent />
        </RootLayoutProvider>,
    );
    return container;
}

/**
 * 칸에 값 넣기
 *
 * @param name 칸 이름(접근 이름)
 * @param value 값
 */
function type(name: string, value: string): void {
    fireEvent.change(screen.getByRole('textbox', {name}), {target: {value}});
}

/**
 * 사업자등록번호를 빼고 필수 칸을 모두 채우고 주소를 고른다
 *
 * @param container 화면
 */
async function fillForm(container: HTMLElement): Promise<void> {
    type('상호명', '스테이 리프 신촌점');
    type('업체 연락처', '02-1234-5678');
    type('대표자명', '김하늘');
    type('대표자 휴대폰 번호', '010-1234-5678');
    type('업체 총관리자 아이디', 'sinchon_head');
    fireEvent.change(container.querySelector('#apply-login-pw') as HTMLInputElement, {target: {value: 'pass1234!'}});
    await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: '주소 검색'}));
    });
}

beforeEach(() => {
    createStoreApplication.mockReset();
    searchAddressWithCoords.mockReset().mockResolvedValue({zonecode: '03722', address: '서울특별시 서대문구 연세로7길 21', latitude: 37.5591, longitude: 126.9368});
    replace.mockClear();
    showErrorPopup.mockClear();
});

describe('StoreApplicationFormContent', () => {
    it('[SUCCESS] 모든 칸을 맞게 채우고 신청한다 → 입점 신청(큐) 1번(주소 검색 좌표 포함 · 이름 · 아이디는 앞뒤 공백을 다듬어) → 상세로', async () => {
        createStoreApplication.mockResolvedValue({store_application_id: APPLICATION_ID});
        const container = renderForm();

        await fillForm(container);
        type('상호명', '  스테이 리프 신촌점 ');
        type('대표자명', ' 김하늘 ');
        type('업체 총관리자 아이디', 'sinchon_head ');
        type('사업자등록번호', '234-56-78901');
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '신청하기'}));
        });

        expect(searchAddressWithCoords).toHaveBeenCalledTimes(1);
        expect(createStoreApplication).toHaveBeenCalledTimes(1);
        expect(createStoreApplication.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(createStoreApplication.mock.calls[0][1]).toMatchObject({
            store_name: '스테이 리프 신촌점',
            business_number: '2345678901',
            phone: '0212345678',
            address: '서울특별시 서대문구 연세로7길 21',
            latitude: 37.5591,
            longitude: 126.9368,
            owner_name: '김하늘',
            owner_phone: '01012345678',
            head_manager_login_id: 'sinchon_head',
            head_manager_login_pw: 'pass1234!',
        });
        expect(createStoreApplication.mock.calls[0][1].address_detail).toBeUndefined();
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith(`/store-applications/${APPLICATION_ID}/`);
    });

    it('[FAIL:validation] 사업자등록번호가 10자리가 아니다 → 칸 옆 오류, 신청 0번', async () => {
        const container = renderForm();

        await fillForm(container);
        type('사업자등록번호', '123456789');
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '신청하기'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="business_number"]') as HTMLElement).innerText).toBe('사업자등록번호 10자리를 숫자만 입력해주세요.');
        expect(createStoreApplication).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });
});
