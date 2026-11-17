import AuthGuard from '@/shared/components/AuthGuard';
import ExtensionContent from './ExtensionContent';

// U9 연장 — /reservation/[reservation_id]/extension (이용 중에만, 이용자 로그인 필요)
export default async function Extension({params}: PageProps<'/reservation/[reservation_id]/extension'>): Promise<React.ReactNode> {
    const {reservation_id} = await params;

    return (
        // 로그인한 이용자만
        <AuthGuard>
            <ExtensionContent reservationId={reservation_id} />
        </AuthGuard>
    );
}
