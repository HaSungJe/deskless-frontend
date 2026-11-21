import Badge from '@/shared/components/ui/display/Badge';
import { formatPhone, formatPrice, formatTimeRange, toKst } from '@/shared/utils/format';
import { floorLabel } from '../../room-display';
import { BoardTargetType, CANCEL_REQUEST_BADGE, RESERVATION_STATE_TONE } from '../reservation-board-format';
import styles from '@/app/css/manager/ReservationBoardContent.module.css';

type ReservationSummaryProps = {
    target: BoardTargetType; // 누른 막대 — 호실 · 예약
};

/**
 * 예약 정보 줄 — 호실 · 시간(점유 끝) · 상품 · 예약자 · 상태(취소 요청 배지) · 금액. 대화상자 넷이 함께 쓴다
 *
 * @param param0
 * @returns
 */
export default function ReservationSummary({target}: ReservationSummaryProps): React.ReactNode {
    // 변수
    const {room, reservation} = target; // 호실 · 예약

    // 계산 값
    const request = reservation.cancel_request_state_id ? CANCEL_REQUEST_BADGE[reservation.cancel_request_state_id] ?? null : null; // 지난 취소 요청 배지

    return (
        // 예약 정보
        <dl className={styles.summary}>
            <dt>호실</dt><dd>{room.room_name} · {floorLabel(room.floor)} · {room.room_group_name}</dd>
            <dt>시간</dt>
            <dd>
                {toKst(reservation.start_at, 'YYYY-MM-DD')} {formatTimeRange(reservation.start_at, reservation.end_at)} · {reservation.room_plan_type_name}
                <br /><span className={styles.muted}>점유 끝 {toKst(reservation.blocked_until, 'HH:mm')}(정비 포함)</span>
            </dd>
            <dt>예약자</dt><dd>{reservation.user_name}{reservation.user_phone ? ` · ${formatPhone(reservation.user_phone)}` : ' · 휴대폰 없음'}</dd>
            <dt>상태</dt>
            <dd className={styles.badges}>
                <Badge tone={RESERVATION_STATE_TONE[reservation.reservation_state_id] ?? 'neutral'}>{reservation.reservation_state_name}</Badge>
                {request ? <Badge tone={request.tone}>{request.label}</Badge> : null}
            </dd>
            <dt>금액</dt><dd><b>{formatPrice(reservation.total_price)}</b></dd>
        </dl>
    );
}
