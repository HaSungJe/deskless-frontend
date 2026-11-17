import { firstQueryValue } from '@/shared/utils/util';
import PaymentFailContent from './PaymentFailContent';

// U4 결제 실패 — /payments/fail (토스 결제창이 돌아오는 주소)
export default async function PaymentFail({searchParams}: PageProps<'/payments/fail'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 결제 실패 화면
        <PaymentFailContent code={firstQueryValue(query.code)} message={firstQueryValue(query.message)} returnUrl={firstQueryValue(query.return_url)} />
    );
}
