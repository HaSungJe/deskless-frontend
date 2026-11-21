import { ROOM_STATE } from '@/contracts/common/room.constants';
import { ReservationStoreItemResultDto, ReservationStoreRoomResultDto } from '@/contracts/reservation/dto/reservation-store.dto';
import Badge from '@/shared/components/ui/display/Badge';
import { toKst } from '@/shared/utils/format';
import { floorLabel, ROOM_STATE_TONE } from '../../room-display';
import { BAR_STATE_CLASS, barGeometry, barLabel, BoardTargetType, CANCEL_REQUEST_BADGE, nowPercent, TICK_HOURS } from '../reservation-board-format';
import styles from '@/app/css/manager/ReservationTimeline.module.css';

type ReservationTimelineProps = {
    rooms: Array<ReservationStoreRoomResultDto>;                   // 현황 호실(층 · 호실명 순)
    date: string;                                                  // 고른 날짜
    now: number | null;                                            // 현황을 받은 시각 — 그날이면 지금 선
    selectedId: string | null;                                     // 대화상자를 연 예약
    onSelect: (target: Omit<BoardTargetType, 'openedAt'>) => void; // 막대를 눌렀다
};

/**
 * 호실별 하루(0 ~ 24시) 막대 — 눈금 · 지금 선 · 예약 막대(잘림 ‹ ›) · 정비 꼬리 · 이용 중 취소 요청 배지
 *
 * @param param0
 * @returns
 */
export default function ReservationTimeline({rooms, date, now, selectedId, onSelect}: ReservationTimelineProps): React.ReactNode {
    // 계산 값
    const nowAt = now === null ? null : nowPercent(now, date);                       // ③ 지금 선 위치 — 그날이 아니면 없음
    const nowText = now === null ? '' : toKst(new Date(now).toISOString(), 'HH:mm'); // ③ 지금 시각 글자

    return (
        // 막대 판(가로로 넘치면 스크롤)
        <div className={styles.wrap}>
            <div className={styles.timeline}>
                {/* 눈금 */}
                <div className={styles.head}>
                    <div className={styles.room}>호실</div>
                    <div className={styles.track}>{TICK_HOURS.map((hour) => <span key={hour} className={styles.tick} style={{left: `${(hour / 24) * 100}%`}}>{hour === 24 ? '24시' : String(hour).padStart(2, '0')}</span>)}</div>
                </div>

                <div className={styles.body}>
                    {/* 눈금선 · ③ 지금 선 */}
                    <div className={styles.grid}>
                        {TICK_HOURS.slice(1, -1).map((hour) => <div key={hour} className={styles.gridLine} style={{left: `${(hour / 24) * 100}%`}} />)}
                        {nowAt !== null ? <><div className={styles.now} style={{left: `${nowAt}%`}} /><span className={styles.nowLabel} style={{left: `${nowAt}%`}}>지금 {nowText}</span></> : null}
                    </div>

                    {/* ② 호실 줄 */}
                    {rooms.map((room) => (
                        <div key={room.room_id} className={room.room_state_id === ROOM_STATE.DISABLED ? `${styles.row} ${styles.off}` : styles.row}>
                            <div className={styles.room}>
                                <div className={styles.roomName}>{room.room_name}<Badge tone={ROOM_STATE_TONE[room.room_state_id] ?? 'neutral'}>{room.room_state_name}</Badge></div>
                                <div className={styles.roomSub}>{floorLabel(room.floor)} · {room.room_group_name}</div>
                            </div>
                            <div className={styles.track}>
                                {room.reservations.length === 0 ? <span className={styles.empty}>{room.room_state_id === ROOM_STATE.DISABLED ? '사용중지 — 새 예약을 받지 않습니다' : '예약 없음'}</span> : null}
                                {room.reservations.map((reservation) => <Bar key={reservation.reservation_id} room={room} reservation={reservation} date={date} selected={selectedId === reservation.reservation_id} onSelect={onSelect} />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

type BarProps = {
    room: ReservationStoreRoomResultDto;                           // 그 호실
    reservation: ReservationStoreItemResultDto;                    // 예약
    date: string;                                                  // 고른 날짜
    selected: boolean;                                             // 대화상자를 연 막대
    onSelect: (target: Omit<BoardTargetType, 'openedAt'>) => void; // 눌렀다
};

/**
 * 예약 막대 하나 — 위치 · 길이(barGeometry) · 시간 글자(barLabel) · 정비 꼬리 · 취소 요청 배지
 *
 * @param param0
 * @returns
 */
function Bar({room, reservation, date, selected, onSelect}: BarProps): React.ReactNode {
    // 계산 값
    const geometry = barGeometry(reservation, date);                                                                                                                                                                   // 위치 · 길이 · 잘림 · 꼬리
    const label = barLabel(reservation, date);                                                                                                                                                                         // 시간 글자
    const badge = reservation.cancel_request_state_id ? CANCEL_REQUEST_BADGE[reservation.cancel_request_state_id] ?? null : null;                                                                                       // 취소 요청 배지
    const classNames = [styles.bar, styles[BAR_STATE_CLASS[reservation.reservation_state_id] ?? 'done'], geometry.cutLeft ? styles.cutLeft : '', geometry.cutRight ? styles.cutRight : '', selected ? styles.selected : ''].filter(Boolean).join(' '); // 막대 모양

    return (
        // 막대 · 꼬리 · 배지
        <>
            {badge ? <span className={styles.requestBadge} style={{left: `${geometry.left}%`}}><Badge tone={badge.tone}>{badge.label}</Badge></span> : null}
            <button type="button" className={classNames} style={{left: `${geometry.left}%`, width: `${geometry.width}%`}} aria-label={`${room.room_name} ${label} ${reservation.user_name} 예약`} onClick={() => onSelect({room, reservation})}>
                <b>{label}</b>
                <span>{reservation.user_name} · {reservation.room_plan_type_name}</span>
            </button>
            {geometry.tailWidth > 0 ? <div className={styles.tail} style={{left: `${geometry.tailLeft}%`, width: `${geometry.tailWidth}%`}} /> : null}
        </>
    );
}
