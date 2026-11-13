'use client';
import { useId, useState } from 'react';
import Button from '@/shared/components/ui/button/Button';
import Field from '@/shared/components/ui/form/Field';
import Modal from './Modal';
import Textarea from '@/shared/components/ui/form/Textarea';
import styles from '@/shared/css/ui/modal/ReasonModal.module.css';

type ReasonModalProps = {
    open: boolean;
    title: string;
    description?: React.ReactNode;
    label?: string;        // 칸 이름 (기본 '사유')
    name?: string;         // 오류 span data-id — 백엔드 DTO 필드 이름 (예: cancel_reason)
    placeholder?: string;
    maxLength?: number;    // 기본 200 — 넘는 입력은 잘라서 받는다
    required?: boolean;    // 기본 true — 비어 있거나 공백뿐이면 확인을 막는다
    confirmLabel?: string;
    danger?: boolean;      // 확인 버튼을 위험 모양으로
    busy?: boolean;        // 처리 중 — 확인을 막는다(큐 API 응답 대기)
    onConfirm: (reason: string) => void; // 앞뒤 공백을 뺀 사유
    onClose: () => void;
};

type ReasonModalBodyProps = Omit<ReasonModalProps, 'open' | 'title'>;

/**
 * 사유 입력 모달 — 업체 취소 · 반려 · 정지 · 탈퇴 사유
 *
 * @param param0
 * @returns
 */
export default function ReasonModal({open, title, onClose, ...bodyProps}: ReasonModalProps): React.ReactNode {
    return (
        // 모달 — 열릴 때마다 본문을 새로 그려 입력이 비워진다
        <Modal open={open} title={title} onClose={onClose}>
            {/* 사유 칸 · 버튼 줄 */}
            <ReasonModalBody onClose={onClose} {...bodyProps} />
        </Modal>
    );
}

/**
 * 사유 입력 모달 본문 — Modal 이 열려 있을 때만 그려진다
 *
 * @param param0
 * @returns
 */
function ReasonModalBody({description, label = '사유', name = 'reason', placeholder, maxLength = 200, required = true, confirmLabel = '확인', danger = false, busy = false, onConfirm, onClose}: ReasonModalBodyProps): React.ReactNode {
    // 변수
    const inputId = useId(); // 사유 칸 id — 라벨과 연결

    // 상태
    const [reason, setReason] = useState<string>(''); // 입력한 사유

    // 계산 값
    const trimmed = reason.trim();                         // 앞뒤 공백을 뺀 사유
    const blocked = (required && trimmed === '') || busy;  // 확인을 막을지

    // 함수
    function change(event: React.ChangeEvent<HTMLTextAreaElement>): void {
        setReason(event.target.value.slice(0, maxLength)); // 칸의 maxLength 를 넘어 들어온 값(붙여넣기 · 스크립트)도 자른다
    }

    function confirm(): void {
        if (!blocked) {
            onConfirm(trimmed);
        }
    }

    return (
        // 본문
        <>
            {/* 설명 */}
            {description ? <div className={styles.description}>{description}</div> : null}

            {/* 사유 칸 — 글자 수 */}
            <Field label={label} name={name} htmlFor={inputId} required={required} hint={`${reason.length} / ${maxLength}`}>
                <Textarea id={inputId} value={reason} placeholder={placeholder} rows={4} maxLength={maxLength} onChange={change} />
            </Field>

            {/* 버튼 줄 — 취소 · 확인 */}
            <div className={styles.actions}>
                <Button onClick={onClose}>취소</Button>
                <Button variant={danger ? 'danger' : 'primary'} disabled={blocked} onClick={confirm}>
                    {confirmLabel}
                </Button>
            </div>
        </>
    );
}
