'use client';
import Button from '@/shared/components/ui/button/Button';
import Modal from './Modal';

type ConfirmModalProps = {
    open: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean; // 확인 버튼을 위험 모양으로
    busy?: boolean;   // 처리 중 — 확인을 막는다(큐 API 응답 대기)
    onConfirm: () => void;
    onClose: () => void;
};

/**
 * 확인 모달 — 취소 · 확인
 *
 * @param param0
 * @returns
 */
export default function ConfirmModal({open, title, message, confirmLabel = '확인', cancelLabel = '취소', danger = false, busy = false, onConfirm, onClose}: ConfirmModalProps): React.ReactNode {
    return (
        // 확인 모달
        <Modal
            open={open}
            title={title}
            onClose={onClose}
            footer={
                <>
                    {/* 취소 */}
                    <Button onClick={onClose}>{cancelLabel}</Button>

                    {/* 확인 — 처리 중이면 막는다 */}
                    <Button variant={danger ? 'danger' : 'primary'} disabled={busy} onClick={onConfirm}>{confirmLabel}</Button>
                </>
            }
        >
            {/* 묻는 말 */}
            <div>{message}</div>
        </Modal>
    );
}
