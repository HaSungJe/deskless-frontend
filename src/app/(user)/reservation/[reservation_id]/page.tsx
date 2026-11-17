import AuthGuard from '@/shared/components/AuthGuard';
import ReservationDetailContent from './ReservationDetailContent';

// U7 예약 1건 — /reservation/[reservation_id] ★ (SMS 링크 — 이용자 로그인 필요, 로그인 뒤 이 주소로)
export default async function ReservationDetail({params}: PageProps<'/reservation/[reservation_id]'>): Promise<React.ReactNode> {
    const {reservation_id} = await params;

    return (
        // 로그인한 이용자만
        <AuthGuard>
            <ReservationDetailContent reservationId={reservation_id} />
        </AuthGuard>
    );
}
