import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { UserMeContext, UserMeContextType } from '@/app/(user)/_components/UserMeProvider';
import { UserMeResultDto } from '@/contracts/user/dto/user-me.dto';
import PhoneVerificationContent, { PHONE_UNVERIFIED_MESSAGE } from '@/app/(user)/phone-verification/PhoneVerificationContent';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {replace, sendPhoneVerification, confirmPhoneVerification, showErrorPopup} = vi.hoisted(() => ({
    replace: vi.fn(),
    sendPhoneVerification: vi.fn(),
    confirmPhoneVerification: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/user/api', () => ({sendPhoneVerification, confirmPhoneVerification}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

const SMS_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

const AUTH: AuthContextType = {area: 'user', token: 'token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/**
 * 그리고 번호 → 받기 → 6자리 → 확인까지
 *
 * @param reloadMe 내 정보 다시 읽기
 */
async function renderAndConfirm(reloadMe: UserMeContextType['reloadMe']): Promise<void> {
    render(
        <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
            <UserMeContext.Provider value={{me: null, reloadMe}}>
                <PhoneVerificationContent returnUrl="/stores/1/" />
            </UserMeContext.Provider>
        </RootLayoutProvider>,
    );

    fireEvent.change(screen.getByLabelText('휴대폰 번호'), {target: {value: '01012345678'}});
    await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: '인증번호 받기'}));
    });
    fireEvent.change(screen.getByLabelText('인증번호'), {target: {value: '123456'}});
    await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: '인증하기'}));
    });
}

beforeEach(() => {
    replace.mockClear();
    showErrorPopup.mockClear();
    sendPhoneVerification.mockReset();
    sendPhoneVerification.mockResolvedValue({sms_verification_id: SMS_ID, expires_at: '2099-01-01T00:00:00.000Z'});
    confirmPhoneVerification.mockReset();
    confirmPhoneVerification.mockResolvedValue(null);
});

describe('PhoneVerificationContent', () => {
    it('[SUCCESS] 확인 뒤 다시 읽은 내 정보가 인증됐으면 돌아갈 주소로', async () => {
        const reloadMe = vi.fn<UserMeContextType['reloadMe']>().mockResolvedValue({is_phone_verified: 1} as UserMeResultDto);

        await renderAndConfirm(reloadMe);

        expect(sendPhoneVerification).toHaveBeenCalledTimes(1);
        expect(sendPhoneVerification.mock.calls[0][0]).toBe(AUTH);
        expect(sendPhoneVerification.mock.calls[0][1]).toMatchObject({phone: '01012345678'});
        expect(confirmPhoneVerification).toHaveBeenCalledTimes(1);
        expect(confirmPhoneVerification.mock.calls[0][1]).toMatchObject({sms_verification_id: SMS_ID, code: '123456'});
        expect(reloadMe).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith('/stores/1/');
        expect(showErrorPopup).not.toHaveBeenCalled();
    });

    it('[FAIL:unverified] 다시 읽은 내 정보가 아직 인증 전이면 안내 · 이동하지 않는다', async () => {
        const reloadMe = vi.fn<UserMeContextType['reloadMe']>().mockResolvedValue({is_phone_verified: 0} as UserMeResultDto);

        await renderAndConfirm(reloadMe);

        expect(reloadMe).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith(PHONE_UNVERIFIED_MESSAGE);
        expect(replace).not.toHaveBeenCalled();
    });
});
