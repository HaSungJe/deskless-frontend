'use client';
import { useContext, useState } from 'react';
import { ROOM_STATE } from '@/contracts/common/room.constants';
import { updateRoomState } from '@/contracts/room/api';
import { RoomListItemResultDto } from '@/contracts/room/dto/room-list.dto';
import { RoomStateDto } from '@/contracts/room/dto/room-state.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Modal from '@/shared/components/ui/modal/Modal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { roomStateActions } from '../room-format';
import styles from '@/app/css/manager/RoomsContent.module.css';

type RoomStateModalProps = {
    room: RoomListItemResultDto; // 바꿀 호실
    onClose: () => void;         // 닫기
    onSaved: () => void;         // 바꾼 뒤 — 닫고 목록 다시
};

/**
 * 호실 상태 대화상자 — 지금 상태로 고를 수 있는 버튼 · 사용중지 안내, 누르면 바로 바꾼다(확인 창 없음 — spec 결정)
 *
 * @param param0
 * @returns
 */
export default function RoomStateModal({room, onClose, onSaved}: RoomStateModalProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [saving, setSaving] = useState<boolean>(false); // 바꾸는 중

    // 계산 값
    const actions = roomStateActions(room.room_state_id); // ④ 고를 수 있는 버튼

    // 함수
    async function change(roomStateId: string): Promise<void> {
        // ④ 고른 상태로 바로(큐) → ⑥ 닫고 목록 다시
        if (saving) {
            return;
        }

        const dto = Object.assign(new RoomStateDto(), {room_state_id: roomStateId});
        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateRoomState(auth, room.room_id, dto);
        } catch (error) {
            failure = {error};
        }

        setSaving(false);
        if (failure) {
            handleApiError(failure.error); // 그 밖의 전환 400 — 받은 문구
            return;
        }

        onSaved();
    }

    return (
        // 상태 대화상자
        <Modal open title={`${room.room_name} · 지금 ${room.room_state_name}`} onClose={onClose} footer={<Button onClick={onClose}>닫기</Button>}>
            {/* ④ 고를 수 있는 버튼 */}
            <div className={styles.stateActions}>
                {actions.map((action) => <Button key={action.label} variant={action.room_state_id === ROOM_STATE.DISABLED ? 'danger' : 'primary'} disabled={saving} onClick={() => change(action.room_state_id)}>{action.label}</Button>)}
            </div>

            {/* 사용중지 안내 */}
            <p className={styles.hint}>사용중지하면 이 호실 예약자는 예약 끝 전까지 전액 환불 취소를 할 수 있습니다.</p>
        </Modal>
    );
}
