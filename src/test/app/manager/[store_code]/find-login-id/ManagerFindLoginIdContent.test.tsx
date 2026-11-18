import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ManagerFindLoginIdContent from '@/app/manager/[store_code]/find-login-id/ManagerFindLoginIdContent';

const {sendManagerFindLoginId, confirmManagerFindLoginId, getLoginStore, showErrorPopup} = vi.hoisted(() => ({
    sendManagerFindLoginId: vi.fn(),
    getLoginStore: vi.fn(),
    confirmManagerFindLoginId: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('@/contracts/manager/api', () => ({sendManagerFindLoginId, confirmManagerFindLoginId}));
vi.mock('@/contracts/store/api', () => ({getLoginStore}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

/** 주소의 업체코드 · 인증 ID */
const STORE_CODE = '3f9a2c7e5b1d4a8e9c0f6b2d7e4a1c21';
const SMS_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

beforeEach(() => {
    showErrorPopup.mockClear();
    sendManagerFindLoginId.mockReset().mockResolvedValue({sms_verification_id: SMS_ID, expires_at: '2099-01-01T00:00:00.000Z'});
    confirmManagerFindLoginId.mockReset();
    getLoginStore.mockReset().mockResolvedValue({store_id: 's'.repeat(32), store_code: STORE_CODE, store_name: '스테이 리프 강남역점'});
});

describe('ManagerFindLoginIdContent', () => {
    it('[SUCCESS] 업체 확인(제목 위 업체명) → 번호로 인증번호를 받아 확인한다 → 발송 1번(주소의 업체코드 · 번호) → 확인 1번 → 아이디 · 등록일 · 로그인 / 비밀번호 초기화 링크', async () => {
        confirmManagerFindLoginId.mockResolvedValue({login_id: 'leaf_front01', created_at: '2026-03-02T03:00:00.000Z'});
        await act(async () => {
            render(<ManagerFindLoginIdContent storeCode={STORE_CODE} />);
        });
        expect(getLoginStore).toHaveBeenCalledTimes(1);
        expect(getLoginStore.mock.calls[0][0]).toBe(STORE_CODE);
        expect(screen.getByText('스테이 리프 강남역점')).toBeTruthy();

        fireEvent.change(screen.getByLabelText('휴대폰 번호'), {target: {value: '01012345678'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '인증번호 받기'}));
        });
        fireEvent.change(screen.getByLabelText('인증번호'), {target: {value: '123456'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '확인'}));
        });

        expect(sendManagerFindLoginId).toHaveBeenCalledTimes(1);
        expect({...sendManagerFindLoginId.mock.calls[0][0]}).toEqual({store_code: STORE_CODE, phone: '01012345678'});
        expect(confirmManagerFindLoginId).toHaveBeenCalledTimes(1);
        expect({...confirmManagerFindLoginId.mock.calls[0][0]}).toEqual({sms_verification_id: SMS_ID, code: '123456'});
        expect(screen.getByRole('heading', {name: '계정 아이디를 찾았습니다.'})).toBeTruthy();
        expect(document.querySelector('dl')?.textContent).toBe('아이디leaf_front01등록일2026-03-02');
        expect(screen.getByRole('link', {name: '로그인'}).getAttribute('href')).toBe(`/manager/${STORE_CODE}/login/`);
        expect(screen.getByRole('link', {name: '비밀번호 초기화'}).getAttribute('href')).toBe(`/manager/${STORE_CODE}/password-reset/`);
        expect(showErrorPopup).not.toHaveBeenCalled();
    });
    it('[FAIL:phone-change] 인증번호를 받은 뒤 번호를 고친다 → 단계 표시가 1단계(인증번호 받기)로 돌아간다', async () => {
        await act(async () => {
            render(<ManagerFindLoginIdContent storeCode={STORE_CODE} />);
        });

        fireEvent.change(screen.getByLabelText('휴대폰 번호'), {target: {value: '01012345678'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '인증번호 받기'}));
        });
        expect(screen.getByText('인증번호 확인').closest('li')?.getAttribute('aria-current')).toBe('step');

        fireEvent.change(screen.getByLabelText('휴대폰 번호'), {target: {value: '01098765432'}});

        expect(sendManagerFindLoginId).toHaveBeenCalledTimes(1);
        expect(screen.getByText('인증번호 받기', {selector: 'li'}).getAttribute('aria-current')).toBe('step');
        expect(screen.getByText('인증번호 확인').closest('li')?.getAttribute('aria-current')).toBeNull();
    });
});
