import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import SmsVerification, { SMS_EXPIRED_MESSAGE, SMS_SENT_MESSAGE, SmsSentType } from '@/shared/components/sms/SmsVerification';

const NOW = new Date('2026-11-16T10:00:00.000Z');

const SENT: SmsSentType = {sms_verification_id: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', expires_at: '2026-11-16T10:05:00.000Z'};

/**
 * 그리고 번호 입력 · "인증번호 받기" 까지
 *
 * @param sent onSend 결과
 */
async function renderAndSend(sent: SmsSentType | null): Promise<{onSend: ReturnType<typeof vi.fn>; onConfirm: ReturnType<typeof vi.fn>}> {
    const onSend = vi.fn().mockResolvedValue(sent);
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<SmsVerification onSend={onSend} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText('휴대폰 번호'), {target: {value: '010-1234-5678'}});
    await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: '인증번호 받기'}));
    });

    return {onSend, onConfirm};
}

beforeEach(() => {
    vi.useFakeTimers({now: NOW});
});

afterEach(() => {
    vi.useRealTimers();
});

describe('SmsVerification', () => {
    it('[SUCCESS] 받기 → 인증번호 칸 · 남은 시간 → 6자리 확인을 한 번씩 넘긴다', async () => {
        const {onSend, onConfirm} = await renderAndSend(SENT);

        expect(onSend).toHaveBeenCalledTimes(1);
        expect(onSend).toHaveBeenCalledWith('01012345678');
        expect(screen.getByText(SMS_SENT_MESSAGE)).toBeTruthy();
        expect(screen.getByRole('button', {name: '다시 받기'})).toBeTruthy();

        act(() => {
            vi.advanceTimersByTime(600);
        });
        expect(screen.getByText(/^0[45]:\d{2}$/)).toBeTruthy();

        fireEvent.change(screen.getByLabelText('인증번호'), {target: {value: '12a3456'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '인증하기'}));
        });

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith(SENT.sms_verification_id, '123456');
    });

    it('[FAIL:not-sent] onSend 가 null 이면 인증번호 칸 · 확인 버튼이 없다', async () => {
        const {onSend, onConfirm} = await renderAndSend(null);

        expect(onSend).toHaveBeenCalledTimes(1);
        expect(screen.queryByLabelText('인증번호')).toBeNull();
        expect(screen.queryByRole('button', {name: '인증하기'})).toBeNull();
        expect(screen.getByRole('button', {name: '인증번호 받기'})).toBeTruthy();
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('[FAIL:expired] 남은 시간이 지나면 확인을 막고 만료 문구 — onConfirm 안 부름', async () => {
        const {onConfirm} = await renderAndSend(SENT);

        fireEvent.change(screen.getByLabelText('인증번호'), {target: {value: '123456'}});
        act(() => {
            // Timer 는 남은 초를 버림(dayjs diff)해 만료 시각 뒤 1초 안에는 00:00 — 그 뒤 첫 0.3초 틱에서 끝난다
            vi.advanceTimersByTime(302 * 1000);
        });

        const confirm = screen.getByRole('button', {name: '인증하기'}) as HTMLButtonElement;
        expect(confirm.disabled).toBe(true);
        expect(screen.getByText(SMS_EXPIRED_MESSAGE)).toBeTruthy();

        await act(async () => {
            fireEvent.click(confirm);
        });
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('[SUCCESS] "다시 받기"는 새 인증으로 바꾸고 인증번호 · 만료를 푼다', async () => {
        const {onSend, onConfirm} = await renderAndSend(SENT);
        fireEvent.change(screen.getByLabelText('인증번호'), {target: {value: '111111'}});
        act(() => {
            vi.advanceTimersByTime(302 * 1000);
        });
        expect(screen.getByText(SMS_EXPIRED_MESSAGE)).toBeTruthy();

        const resent: SmsSentType = {sms_verification_id: 'f0e1d2c3b4a5968778695a4b3c2d1e0f', expires_at: '2026-11-16T10:10:02.000Z'};
        onSend.mockResolvedValueOnce(resent);
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '다시 받기'}));
        });

        expect(onSend).toHaveBeenCalledTimes(2);
        expect((screen.getByLabelText('인증번호') as HTMLInputElement).value).toBe('');
        expect(screen.queryByText(SMS_EXPIRED_MESSAGE)).toBeNull();

        fireEvent.change(screen.getByLabelText('인증번호'), {target: {value: '222222'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '인증하기'}));
        });
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith(resent.sms_verification_id, '222222');
    });

    it('[FAIL:busy] 보내는 중에는 번호 칸 · 받기 버튼을 막는다', async () => {
        let finishSend: (value: SmsSentType | null) => void = () => undefined;
        const onSend = vi.fn(() => new Promise<SmsSentType | null>((resolve) => {
            finishSend = resolve;
        }));
        render(<SmsVerification onSend={onSend} onConfirm={vi.fn()} />);
        fireEvent.change(screen.getByLabelText('휴대폰 번호'), {target: {value: '01012345678'}});

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '인증번호 받기'}));
        });

        expect((screen.getByLabelText('휴대폰 번호') as HTMLInputElement).disabled).toBe(true);
        expect((screen.getByRole('button', {name: '인증번호 받기'}) as HTMLButtonElement).disabled).toBe(true);

        await act(async () => {
            finishSend(SENT);
        });
        expect((screen.getByLabelText('휴대폰 번호') as HTMLInputElement).disabled).toBe(false);
        expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('[SUCCESS] 번호를 고치면 받은 인증번호를 비운다', async () => {
        await renderAndSend(SENT);

        fireEvent.change(screen.getByLabelText('휴대폰 번호'), {target: {value: '01098765432'}});

        expect(screen.queryByLabelText('인증번호')).toBeNull();
        expect(screen.getByRole('button', {name: '인증번호 받기'})).toBeTruthy();
    });
});
