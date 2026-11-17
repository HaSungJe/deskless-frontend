import AuthGuard from '@/shared/components/AuthGuard';
import { firstQueryValue } from '@/shared/utils/util';
import PaymentSuccessContent from './PaymentSuccessContent';

// U4 결제 성공 — /payments/success (토스 결제창이 돌아오는 주소, 이용자 로그인 필요)
export default async function PaymentSuccess({searchParams}: PageProps<'/payments/success'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 로그인한 이용자만 — 결제 확인 API 가 이용자 토큰
        <AuthGuard>
            <PaymentSuccessContent paymentKey={firstQueryValue(query.paymentKey)} orderId={firstQueryValue(query.orderId)} amount={firstQueryValue(query.amount)} returnUrl={firstQueryValue(query.return_url)} />
        </AuthGuard>
    );
}
