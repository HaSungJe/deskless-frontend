// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { paymentReturnPath } from '@/app/(user)/payments/payment-result';

describe('paymentReturnPath — 결제 뒤 돌아갈 주소', () => {
    it('[SUCCESS] 토스가 우리 주소 뒤에 ? 로 값을 붙여도 앞의 우리 주소만 쓴다', () => {
        expect(paymentReturnPath('/reservation/abc/extension/?code=PAY_PROCESS_CANCELED')).toBe('/reservation/abc/extension/');
    });
});
