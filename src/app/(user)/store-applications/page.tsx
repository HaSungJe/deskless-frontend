import AuthGuard from '@/shared/components/AuthGuard';
import StoreApplicationListContent from './StoreApplicationListContent';

// U11 입점 신청 목록 — /store-applications (이용자 로그인 필요)
export default function StoreApplicationList(): React.ReactNode {
    return (
        // 로그인한 이용자만
        <AuthGuard>
            <StoreApplicationListContent />
        </AuthGuard>
    );
}
