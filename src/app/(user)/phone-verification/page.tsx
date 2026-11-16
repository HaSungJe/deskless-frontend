import AuthGuard from '@/shared/components/AuthGuard';
import { firstQueryValue } from '@/shared/utils/util';
import PhoneVerificationContent from './PhoneVerificationContent';

// U5 휴대폰 인증 — /phone-verification (이용자 로그인 필요)
export default async function PhoneVerification({searchParams}: PageProps<'/phone-verification'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 로그인한 이용자만
        <AuthGuard>
            <PhoneVerificationContent returnUrl={firstQueryValue(query.return_url)} />
        </AuthGuard>
    );
}
