'use client';
import { useContext, useState } from 'react';
import { changeReservationRoom } from '@/contracts/reservation/api';
import { ReservationRoomChangeDto } from '@/contracts/reservation/dto/reservation-room-change.dto';
import { ReservationStoreRoomResultDto } from '@/contracts/reservation/dto/reservation-store.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Field from '@/shared/components/ui/form/Field';
import Modal from '@/shared/components/ui/modal/Modal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import { floorLabel, ROOM_STATE_TONE } from '../../room-display';
import { BoardTargetType, roomChangeOptions } from '../reservation-board-format';
import ReservationSummary from './ReservationSummary';
import styles from '@/app/css/manager/ReservationBoardContent.module.css';

type RoomChangeModalProps = {
    target: BoardTargetType;                     // 옮길 예약
    rooms: Array<ReservationStoreRoomResultDto>; // 현황 호실 전부 — 옮길 호실 후보
    onClose: () => void;                         // 닫기
    onDone: () => void;                          // 끝나면 — 닫고 현황 다시
};

/**
 * 호실 이동 대화상자 — 같은 그룹의 다른 호실 고르기(사용중지는 못 고름) → 호실 이동(큐, 금액 · 시간 그대로)
 *
 * @param param0
 * @returns
 */
export default function RoomChangeModal({target, rooms, onClose, onDone}: RoomChangeModalProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [roomId, setRoomId] = useState<string>(''); // ③ 고른 호실
    const [busy, setBusy] = useState<boolean>(false); // 보내는 중

    // 계산 값
    const options = roomChangeOptions(rooms, target.room); // ① 같은 그룹 · 지금 호실 빼고 · 사용중지는 못 고름

    // 함수
    async function submit(): Promise<void> {
        // ③ 검사 → 호실 이동(큐) → 닫고 현황 다시
        const dto = Object.assign(new ReservationRoomChangeDto(), {room_id: roomId});
        if (busy || !(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await changeReservationRoom(auth, target.reservation.reservation_id, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error); // ③ 겹치는 예약 — validation_errors.room_id 는 목록 아래
            return;
        }

        onDone();
    }

    return (
        // 호실 이동
        <Modal open title="호실 이동" onClose={onClose} footer={<><Button onClick={onClose}>닫기</Button><Button variant="primary" disabled={busy || options.length === 0} onClick={submit}>{busy ? '처리 중…' : '호실 이동'}</Button></>}>
            <div className={styles.dialog}>
                {/* 예약 */}
                <ReservationSummary target={target} />

                {/* ① 옮길 호실 */}
                <Field label={`옮길 호실 (같은 객실 그룹 · ${target.room.room_group_name})`} name="room_id" group required>
                    {options.length === 0 ? <p className={styles.hint}>같은 객실 그룹에 옮길 수 있는 호실이 없습니다.</p> : null}
                    <div className={styles.roomOptions}>
                        {options.map((option) => (
                            <label key={option.room_id} className={option.disabled ? `${styles.roomOption} ${styles.disabled}` : styles.roomOption}>
                                <input type="radio" name="room-change" value={option.room_id} checked={roomId === option.room_id} disabled={option.disabled} onChange={() => setRoomId(option.room_id)} />
                                <span className={styles.roomOptionName}><b>{option.room_name}</b> · {floorLabel(option.floor)}{option.disabled ? ' — 사용중지된 호실로는 옮길 수 없습니다.' : ''}</span>
                                <Badge tone={ROOM_STATE_TONE[option.room_state_id] ?? 'neutral'}>{option.room_state_name}</Badge>
                            </label>
                        ))}
                    </div>
                </Field>

                {/* ② 안내 */}
                <p className={styles.hint}>금액 · 시간은 그대로입니다. 옮길 호실의 그 시간(정비시간 포함)이 비어 있어야 합니다.</p>
            </div>
        </Modal>
    );
}
