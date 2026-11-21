import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import AdminApplicationDetailContent from '@/app/admin/(console)/store-applications/[store_application_id]/AdminApplicationDetailContent';
import { APPLICATION_ID, applicationDetail, renderWithAdmin, STORE_CODE, STORE_ID } from '../../admin-fixture';

const api = vi.hoisted(() => ({
    getStoreApplication: vi.fn(),
    approveStoreApplication: vi.fn(),
    rejectStoreApplication: vi.fn(),
}));

vi.mock('@/contracts/store/api', () => api);

/**
 * 신청 상세를 그리고 상세 읽기를 기다린다
 */
async function renderDetail(): Promise<void> {
    await act(async () => {
        renderWithAdmin(<AdminApplicationDetailContent applicationId={APPLICATION_ID} />);
    });
}

/**
 * 지금 열린 대화상자
 */
function dialog(): ReturnType<typeof within> {
    return within(document.querySelector('dialog[open]') as HTMLElement);
}

beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://deskless.kr');
    vi.stubEnv('NEXT_PUBLIC_LOCAL_SERVER_PREFIX', '');
    Object.values(api).forEach((fn) => fn.mockReset());
    api.getStoreApplication.mockResolvedValue(applicationDetail());
    api.approveStoreApplication.mockResolvedValue({store_id: STORE_ID, store_code: STORE_CODE});
    api.rejectStoreApplication.mockResolvedValue(null);
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('AdminApplicationDetailContent', () => {
    it('[SUCCESS] 대기 신청을 승인한다 → 승인(큐) 1번 → 상세 다시 → 승인 띠(로그인 주소 복사 — 업체코드 · 주소 글자 숨김 · 업체 상세 링크)', async () => {
        await renderDetail();
        expect(api.getStoreApplication).toHaveBeenCalledTimes(1);
        expect(api.getStoreApplication.mock.calls[0].slice(0, 2)).toEqual([expect.objectContaining({token: 'admin-token'}), APPLICATION_ID]);
        api.getStoreApplication.mockResolvedValue(applicationDetail({store_application_state_id: 'APPROVED', store_id: STORE_ID, store_code: STORE_CODE, reviewed_at: '2026-11-10T01:00:00.000Z'}));

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '승인'}));
        });

        expect(api.approveStoreApplication).toHaveBeenCalledTimes(1);
        expect(api.approveStoreApplication.mock.calls[0][1]).toBe(APPLICATION_ID);
        expect(api.getStoreApplication).toHaveBeenCalledTimes(2);
        const band = within(screen.getByRole('status'));
        expect(band.getByText('입점을 승인했습니다. 대표자 휴대폰으로 승인 문자를 보냈습니다.')).toBeTruthy();
        expect(document.body.textContent).not.toContain(STORE_CODE);
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true});
        await act(async () => {
            fireEvent.click(band.getByRole('button', {name: '로그인 주소 복사'}));
        });
        expect(writeText).toHaveBeenCalledWith(`https://deskless.kr/manager/${STORE_CODE}/login/`);
        expect(band.getByRole('link', {name: '업체 상세로'}).getAttribute('href')).toBe(`/admin/stores/${STORE_ID}/`);
        expect(screen.queryByRole('button', {name: '승인'})).toBeNull();
    });

    it('[SUCCESS] 사유를 넣어 반려한다 → 반려(큐) 1번(그 신청 · 다듬은 사유) → 대화상자 닫힘 → 상세 다시', async () => {
        await renderDetail();

        fireEvent.click(screen.getByRole('button', {name: '반려'}));
        fireEvent.change(dialog().getByLabelText(/반려 사유/), {target: {value: ' 사업자등록증의 상호명이 다릅니다. '}});
        await act(async () => {
            fireEvent.click(dialog().getByRole('button', {name: '반려하기'}));
        });

        expect(api.rejectStoreApplication).toHaveBeenCalledTimes(1);
        expect(api.rejectStoreApplication.mock.calls[0][1]).toBe(APPLICATION_ID);
        expect({...api.rejectStoreApplication.mock.calls[0][2]}).toEqual({reject_comment: '사업자등록증의 상호명이 다릅니다.'});
        expect(document.querySelector('dialog[open]')).toBeNull();
        expect(api.getStoreApplication).toHaveBeenCalledTimes(2);
    });

    it('[FAIL:validation] 사유를 비우고 반려하려 한다 → "반려하기" 꺼짐, 반려 0번', async () => {
        await renderDetail();

        fireEvent.click(screen.getByRole('button', {name: '반려'}));
        fireEvent.change(dialog().getByLabelText(/반려 사유/), {target: {value: '   '}});
        const confirm = dialog().getByRole('button', {name: '반려하기'}) as HTMLButtonElement;
        expect(confirm.disabled).toBe(true);
        await act(async () => {
            fireEvent.click(confirm);
        });

        expect(api.rejectStoreApplication).not.toHaveBeenCalled();
        expect(api.getStoreApplication).toHaveBeenCalledTimes(1);
    });
});
