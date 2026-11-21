'use client';
import { useContext, useState } from 'react';
import { cancelStoreReservation } from '@/contracts/reservation/api';
import { ReservationStoreCancelDto } from '@/contracts/reservation/dto/reservation-store-cancel.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Field from '@/shared/components/ui/form/Field';
import Textarea from '@/shared/components/ui/form/Textarea';
import Modal from '@/shared/components/ui/modal/Modal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPrice } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { BoardTargetType, CANCEL_REASON_MAX } from '../reservation-board-format';
import ReservationSummary from './ReservationSummary';
import styles from '@/app/css/manager/ReservationBoardContent.module.css';

type StoreCancelModalProps = {
    target: BoardTargetType; // 취소할 예약
    onClose: () => void;     // 닫기
    onDone: () => void;      // 끝나면 — 닫고 현황 다시
};

/**
 * 업체 취소 대화상자 — 사유(예약자 문자에 함께) → 업체 취소(큐, 확정은 전액 환불)
 *
 * @param param0
 * @returns
 */
export default function StoreCancelModal({target, onClose, onDone}: StoreCancelModalProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [reason, setReason] = useState<string>(''); // 취소 사유
    const [busy, setBusy] = useState<boolean>(false); // 보내는 중

    // 함수
    async function submit(): Promise<void> {
        // ② 사유 검사 → 업체 취소(큐) → ③ 닫고 현황 다시
        const dto = Object.assign(new ReservationStoreCancelDto(), {cancel_reason: reason.trim()});
        if (busy || !(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await cancelStoreReservation(auth, target.reservation.reservation_id, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error); // ③ 이미 시작한 예약 — 받은 문구
            return;
        }

        onDone();
    }

    return (
        // 업체 취소
        <Modal open title="업체 취소" onClose={onClose} footer={<><Button onClick={onClose}>닫기</Button><Button variant="danger" disabled={busy} onClick={submit}>{busy ? '처리 중…' : '업체 취소'}</Button></>}>
            <div className={styles.dialog}>
                {/* ① 예약 · 안내 */}
                <ReservationSummary target={target} />
                <Band tone="warn">확정 예약은 결제 금액 전액({formatPrice(target.reservation.total_price)})을 환불합니다. 취소 사유는 예약자에게 가는 문자에 함께 나갑니다.</Band>

                {/* ② 사유 */}
                <Field label="취소 사유" name="cancel_reason" htmlFor="store-cancel-reason" hint={`${reason.length} / ${CANCEL_REASON_MAX}`} required>
                    <Textarea id="store-cancel-reason" rows={3} maxLength={CANCEL_REASON_MAX} value={reason} onChange={(event) => setReason(event.target.value)} />
                </Field>
            </div>
        </Modal>
    );
}
