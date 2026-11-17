import AuthGuard from '@/shared/components/AuthGuard';
import MyReservationContent from './MyReservationContent';

// U6 내 예약 목록 — /reservation (이용자 로그인 필요)
export default function MyReservation(): React.ReactNode {
    return (
        // 로그인한 이용자만
        <AuthGuard>
            <MyReservationContent />
        </AuthGuard>
    );
}
