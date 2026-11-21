'use client';
import { useContext, useState } from 'react';
import { requestUseCancel } from '@/contracts/reservation/api';
import { ReservationUseCancelRequestDto, ReservationUseCancelRequestResultDto } from '@/contracts/reservation/dto/reservation-use-cancel-request.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Field from '@/shared/components/ui/form/Field';
import Textarea from '@/shared/components/ui/form/Textarea';
import Modal from '@/shared/components/ui/modal/Modal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import { BoardTargetType, CANCEL_REASON_MAX, cancelRequestNotice } from '../reservation-board-format';
import ReservationSummary from './ReservationSummary';
import styles from '@/app/css/manager/ReservationBoardContent.module.css';

type UseCancelRequestModalProps = {
    target: BoardTargetType;           // 요청할 예약(이용 중)
    onClose: () => void;               // 닫기
    onDone: (message: string) => void; // 끝나면 — 안내 띠 글자를 넘긴다
};

/**
 * 이용 중 취소 요청 대화상자 — 사유(예약자 동의 화면에 보인다) → 요청(큐) → 만료 시각 안내
 *
 * @param param0
 * @returns
 */
export default function UseCancelRequestModal({target, onClose, onDone}: UseCancelRequestModalProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [reason, setReason] = useState<string>(''); // 취소 사유
    const [busy, setBusy] = useState<boolean>(false); // 보내는 중

    // 함수
    async function submit(): Promise<void> {
        // ② 사유 검사 → 요청(큐) → ③ 만료 시각 안내 · 닫고 현황 다시
        const dto = Object.assign(new ReservationUseCancelRequestDto(), {cancel_reason: reason.trim()});
        if (busy || !(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let requested: ReservationUseCancelRequestResultDto | null = null; // 요청 결과 — 늦어지면 null
        let failure: {error: unknown} | null = null;                        // 실패 — 처리는 try 밖에서
        try {
            requested = await requestUseCancel(auth, target.reservation.reservation_id, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error); // ③ 이미 진행 중 · 이용 중이 아님 — 받은 문구
            return;
        }

        onDone(cancelRequestNotice(requested));
    }

    return (
        // 이용 중 취소 요청
        <Modal open title="이용 중 취소 요청" onClose={onClose} footer={<><Button onClick={onClose}>닫기</Button><Button variant="primary" disabled={busy} onClick={submit}>{busy ? '처리 중…' : '요청 보내기'}</Button></>}>
            <div className={styles.dialog}>
                {/* ① 예약 · 안내 */}
                <ReservationSummary target={target} />
                <Band tone="info">예약자에게 동의 링크 문자를 보냅니다. 10분 안에(예약 끝이 먼저면 예약 끝까지) 예약자가 승인하면 전액 환불로 취소됩니다. 결과는 예약 현황의 막대 배지로 확인합니다.</Band>

                {/* ② 사유 */}
                <Field label="취소 사유" name="cancel_reason" htmlFor="use-cancel-reason" hint="예약자 동의 화면에 그대로 보이고, 승인되면 예약의 취소 사유가 됩니다." required>
                    <Textarea id="use-cancel-reason" rows={3} maxLength={CANCEL_REASON_MAX} value={reason} onChange={(event) => setReason(event.target.value)} />
                </Field>
            </div>
        </Modal>
    );
}
