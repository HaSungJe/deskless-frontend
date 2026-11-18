import AuthGuard from '@/shared/components/AuthGuard';
import StoreApplicationDetailContent from './StoreApplicationDetailContent';

// U11 입점 신청 상세 — /store-applications/[store_application_id] (이용자 로그인 필요)
export default async function StoreApplicationDetail({params}: PageProps<'/store-applications/[store_application_id]'>): Promise<React.ReactNode> {
    const {store_application_id} = await params;

    return (
        // 로그인한 이용자만
        <AuthGuard>
            <StoreApplicationDetailContent applicationId={store_application_id} />
        </AuthGuard>
    );
}
