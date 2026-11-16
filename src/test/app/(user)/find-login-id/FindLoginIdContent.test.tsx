import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import FindLoginIdContent from '@/app/(user)/find-login-id/FindLoginIdContent';

const {sendFindLoginId, confirmFindLoginId, showErrorPopup} = vi.hoisted(() => ({
    sendFindLoginId: vi.fn(),
    confirmFindLoginId: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('@/contracts/user/api', () => ({sendFindLoginId, confirmFindLoginId}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

const SMS_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

beforeEach(() => {
    showErrorPopup.mockClear();
    sendFindLoginId.mockReset();
    sendFindLoginId.mockResolvedValue({sms_verification_id: SMS_ID, expires_at: '2099-01-01T00:00:00.000Z'});
    confirmFindLoginId.mockReset();
});

describe('FindLoginIdContent', () => {
    it('[SUCCESS] 확인 결과가 오면 가입한 SNS · 가입일 · 로그인하러 가기', async () => {
        confirmFindLoginId.mockResolvedValue({login_id: null, sns_id: 'KAKAO', created_at: '2026-11-10T05:00:00.000Z'});
        render(<FindLoginIdContent />);

        fireEvent.change(screen.getByLabelText('휴대폰 번호'), {target: {value: '01012345678'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '인증번호 받기'}));
        });
        fireEvent.change(screen.getByLabelText('인증번호'), {target: {value: '123456'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '확인'}));
        });

        expect(sendFindLoginId).toHaveBeenCalledTimes(1);
        expect(sendFindLoginId.mock.calls[0][0]).toMatchObject({phone: '01012345678'});
        expect(confirmFindLoginId).toHaveBeenCalledTimes(1);
        expect(confirmFindLoginId.mock.calls[0][0]).toMatchObject({sms_verification_id: SMS_ID, code: '123456'});
        const result = screen.getByRole('region', {name: '가입한 계정을 찾았어요'});
        expect(result.querySelector('dl')?.textContent).toBe('가입한 SNS카카오가입일2026년 11월 10일');
        expect(screen.getByRole('link', {name: '로그인하러 가기'}).getAttribute('href')).toBe('/login/');
        expect(screen.getByLabelText('인증번호')).toBeTruthy();
    });

    it('[FAIL:pending] 확인이 pending(null)이면 늦어짐 안내 · 결과 없음', async () => {
        confirmFindLoginId.mockResolvedValue(null);
        render(<FindLoginIdContent />);

        fireEvent.change(screen.getByLabelText('휴대폰 번호'), {target: {value: '01012345678'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '인증번호 받기'}));
        });
        fireEvent.change(screen.getByLabelText('인증번호'), {target: {value: '123456'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '확인'}));
        });

        expect(showErrorPopup).toHaveBeenCalledWith('처리가 늦어지고 있어요. 잠시 뒤 다시 시도해 주세요.');
        expect(screen.queryByText('가입한 계정을 찾았어요')).toBeNull();
        expect(screen.queryByRole('link', {name: '로그인하러 가기'})).toBeNull();
    });
});
