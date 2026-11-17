import AuthGuard from '@/shared/components/AuthGuard';
import CancelRequestContent from './CancelRequestContent';

// U8 이용 중 취소 동의 — /reservation/[reservation_id]/cancel-request ★ (업체가 보낸 SMS 링크)
export default async function CancelRequest({params}: PageProps<'/reservation/[reservation_id]/cancel-request'>): Promise<React.ReactNode> {
    const {reservation_id} = await params;

    return (
        // 로그인한 이용자만
        <AuthGuard>
            <CancelRequestContent reservationId={reservation_id} />
        </AuthGuard>
    );
}
