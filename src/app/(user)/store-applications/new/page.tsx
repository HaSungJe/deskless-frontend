import AuthGuard from '@/shared/components/AuthGuard';
import StoreApplicationFormContent from './StoreApplicationFormContent';

// U11 입점 신청 작성 — /store-applications/new (이용자 로그인 필요)
export default function StoreApplicationNew(): React.ReactNode {
    return (
        // 로그인한 이용자만
        <AuthGuard>
            <StoreApplicationFormContent />
        </AuthGuard>
    );
}
