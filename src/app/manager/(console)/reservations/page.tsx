import ReservationBoardContent from './ReservationBoardContent';

// M3 예약 현황 — /manager/reservations (콘솔 틀 · 매니저 로그인 필요 — layout 이 감싼다)
export default function Reservations(): React.ReactNode {
    return (
        // 예약 현황
        <ReservationBoardContent />
    );
}
