import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ManagerLoginGuideContent from '@/app/manager/login/ManagerLoginGuideContent';

const {push} = vi.hoisted(() => ({push: vi.fn()}));

vi.mock('next/navigation', () => ({useRouter: () => ({push})}));

beforeEach(() => {
    push.mockClear();
});

describe('ManagerLoginGuideContent', () => {
    it('[FAIL:validation] 업체코드 모양이 틀렸다 → 칸 아래 "업체코드가 올바르지 않습니다.", 이동 없음', async () => {
        const {container} = render(<ManagerLoginGuideContent returnUrl={null} />);

        fireEvent.change(screen.getByLabelText('업체코드'), {target: {value: ' 3F9A2C7E-not-a-code '}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '로그인 화면으로 이동'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="store_code"]') as HTMLElement).innerText).toBe('업체코드가 올바르지 않습니다.');
        expect(push).not.toHaveBeenCalled();
    });
});
