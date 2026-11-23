import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import AdminStoreDetailContent from '@/app/admin/(console)/stores/[store_id]/AdminStoreDetailContent';
import { applyPublicEnv } from '@/shared/utils/public-env';
import { renderWithAdmin, STORE_ID, storeDetail } from '../../admin-fixture';

const api = vi.hoisted(() => ({
    getStore: vi.fn(),
    updateStore: vi.fn(),
    updateStoreState: vi.fn(),
    updateStoreOpen: vi.fn(),
}));
const address = vi.hoisted(() => ({
    preloadAddressSearch: vi.fn(),
    searchAddressWithCoords: vi.fn(),
}));

vi.mock('@/contracts/store/api', () => api);
vi.mock('@/shared/utils/address', () => address);

/**
 * 업체 상세를 그리고 상세 읽기를 기다린다
 */
async function renderDetail(): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = renderWithAdmin(<AdminStoreDetailContent storeId={STORE_ID} />);
    });
    return container;
}

beforeEach(() => {
    applyPublicEnv({NEXT_PUBLIC_SERVER_URL: 'https://deskless.kr'}); // 루트 layout 이 넘기는 공개 값
    Object.values(api).forEach((fn) => fn.mockReset());
    api.getStore.mockResolvedValue(storeDetail());
    api.updateStore.mockResolvedValue(null);
    api.updateStoreState.mockResolvedValue(null);
    api.updateStoreOpen.mockResolvedValue(null);
    address.searchAddressWithCoords.mockReset().mockResolvedValue({zonecode: '06236', address: '서울특별시 강남구 테헤란로 152', latitude: 37.500622, longitude: 127.036456});
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('AdminStoreDetailContent', () => {
    it('[SUCCESS] 주소를 검색해 고치고 저장한다 → 정보 수정(큐) 1번(숫자만 연락처 · 고른 주소 · 숫자 좌표 · 빈 상세주소) → 상세 다시', async () => {
        await renderDetail();
        expect(api.getStore).toHaveBeenCalledTimes(1);
        expect(api.getStore.mock.calls[0].slice(0, 2)).toEqual([expect.objectContaining({token: 'admin-token'}), STORE_ID]);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '주소 검색'}));
        });
        fireEvent.change(screen.getByLabelText(/^상호명/), {target: {value: ' 스테이 리프 역삼점 '}});
        fireEvent.change(screen.getByLabelText(/^업체 연락처/), {target: {value: '02-555-0124'}});
        fireEvent.change(screen.getByLabelText('상세주소'), {target: {value: ''}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '정보 저장'}));
        });

        expect(address.searchAddressWithCoords).toHaveBeenCalledTimes(1);
        expect(api.updateStore).toHaveBeenCalledTimes(1);
        expect(api.updateStore.mock.calls[0][1]).toBe(STORE_ID);
        expect({...api.updateStore.mock.calls[0][2]}).toEqual({store_name: '스테이 리프 역삼점', owner_name: '김현석', phone: '025550124', address: '서울특별시 강남구 테헤란로 152', address_detail: '', latitude: 37.500622, longitude: 127.036456});
        expect(api.getStore).toHaveBeenCalledTimes(2);
    });

    it('[FAIL:validation] 연락처를 7자리만 넣고 저장한다 → 칸 옆 "업체 연락처를 숫자만 정확히 입력해주세요.", 수정 0번', async () => {
        const container = await renderDetail();

        fireEvent.change(screen.getByLabelText(/^업체 연락처/), {target: {value: '5550124'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '정보 저장'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="phone"]') as HTMLElement).innerText).toBe('업체 연락처를 숫자만 정확히 입력해주세요.');
        expect(api.updateStore).not.toHaveBeenCalled();
        expect(api.getStore).toHaveBeenCalledTimes(1);
    });

    it('[SUCCESS] 영업중지를 고르고 사유를 넣어 바꾼다 → 상태 변경(큐) 1번(영업중지 · 다듬은 사유) → 상세 다시', async () => {
        await renderDetail();
        const change = screen.getByRole('button', {name: '상태 변경'}) as HTMLButtonElement;
        expect(change.disabled).toBe(true);

        fireEvent.click(screen.getByRole('radio', {name: /영업중지/}));
        fireEvent.change(screen.getByLabelText(/^정지 사유/), {target: {value: ' 소방 점검 보완 '}});
        expect(change.disabled).toBe(false);
        await act(async () => {
            fireEvent.click(change);
        });

        expect(api.updateStoreState).toHaveBeenCalledTimes(1);
        expect(api.updateStoreState.mock.calls[0][1]).toBe(STORE_ID);
        expect(JSON.parse(JSON.stringify(api.updateStoreState.mock.calls[0][2]))).toEqual({store_state_id: 'SUSPEND', suspend_comment: '소방 점검 보완'});
        expect(api.getStore).toHaveBeenCalledTimes(2);
    });

    it('[SUCCESS] 탈퇴를 고르고 확인한다 → 확인 대화상자 → 상태 변경(큐) 1번(탈퇴 · 사유 없음) → 상세 다시', async () => {
        await renderDetail();

        fireEvent.click(screen.getByRole('radio', {name: /탈퇴/}));
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '상태 변경'}));
        });
        expect(api.updateStoreState).not.toHaveBeenCalled();
        const dialog = within(document.querySelector('dialog[open]') as HTMLElement);
        expect(dialog.getByText('스테이 리프 강남역점 업체를 탈퇴 처리합니다. 되돌릴 수 없고, 이 업체의 업체 관리자 계정이 모두 정지되며, 이용자 지도에서 빠집니다.')).toBeTruthy();
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '탈퇴 처리'}));
        });

        expect(api.updateStoreState).toHaveBeenCalledTimes(1);
        expect(JSON.parse(JSON.stringify(api.updateStoreState.mock.calls[0][2]))).toEqual({store_state_id: 'LEAVE'});
        expect(api.getStore).toHaveBeenCalledTimes(2);
    });

    it('[SUCCESS] 영업중 스위치를 끈다 → 영업중 변경(큐) 1번(영업준비 0) → 상세 다시', async () => {
        await renderDetail();

        await act(async () => {
            fireEvent.click(screen.getByRole('switch', {name: '영업중'}));
        });

        expect(api.updateStoreOpen).toHaveBeenCalledTimes(1);
        expect(api.updateStoreOpen.mock.calls[0][1]).toBe(STORE_ID);
        expect({...api.updateStoreOpen.mock.calls[0][2]}).toEqual({is_open: 0});
        expect(api.getStore).toHaveBeenCalledTimes(2);
    });
});
