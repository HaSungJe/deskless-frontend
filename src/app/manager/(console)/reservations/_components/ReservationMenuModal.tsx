import Button from '@/shared/components/ui/button/Button';
import Modal from '@/shared/components/ui/modal/Modal';
import { BoardActionType, BoardTargetType, reservationActions } from '../reservation-board-format';
import ReservationSummary from './ReservationSummary';
import styles from '@/app/css/manager/ReservationBoardContent.module.css';

type ReservationMenuModalProps = {
    target: BoardTargetType;                     // 누른 막대
    onClose: () => void;                         // 닫기
    onChoose: (action: BoardActionType) => void; // ⑤ 작업 대화상자로
};

/**
 * 막대 대화상자 — 예약 정보 · 그 예약에 할 수 있는 작업 버튼만 켠다(누른 시각 기준)
 *
 * @param param0
 * @returns
 */
export default function ReservationMenuModal({target, onClose, onChoose}: ReservationMenuModalProps): React.ReactNode {
    // 계산 값
    const actions = reservationActions(target.reservation, target.openedAt); // ④ 켜질 버튼

    return (
        // 막대 대화상자
        <Modal open title={`${target.room.room_name} 예약`} onClose={onClose} footer={<Button onClick={onClose}>닫기</Button>}>
            {/* ④ 예약 정보 */}
            <ReservationSummary target={target} />

            {/* ④ 작업 */}
            <div className={styles.menuActions}>
                <Button variant="danger" disabled={!actions.storeCancel} onClick={() => onChoose('store-cancel')}>업체 취소</Button>
                <Button disabled={!actions.roomChange} onClick={() => onChoose('room-change')}>호실 이동</Button>
                <Button disabled={!actions.useCancelRequest} onClick={() => onChoose('use-cancel')}>이용 중 취소 요청</Button>
            </div>
            <p className={styles.hint}>업체 취소 · 호실 이동은 시작 전 예약에만, 이용 중 취소 요청은 이용 중 예약에만 켜집니다.</p>
        </Modal>
    );
}
