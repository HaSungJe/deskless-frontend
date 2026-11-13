'use client';
import { useId, useLayoutEffect, useRef } from 'react';
import styles from '@/shared/css/ui/modal/Modal.module.css';

type ModalProps = {
    open: boolean;
    title: string;
    onClose: () => void;      // Esc · 닫기 버튼 · 브라우저가 스스로 닫음 — 부모가 open 을 false 로 바꾼다
    footer?: React.ReactNode; // 아래 버튼 줄
    children: React.ReactNode;
};

/**
 * <dialog> 를 연다 — showModal 이 없는 환경(jsdom 등)은 open 속성으로
 *
 * @param dialog
 */
function openDialog(dialog: HTMLDialogElement): void {
    if (typeof dialog.showModal === 'function') {
        dialog.showModal();
    } else {
        dialog.setAttribute('open', '');
    }
}

/**
 * <dialog> 를 닫는다 — close 가 없는 환경(jsdom 등)은 open 속성을 지운다
 *
 * @param dialog
 */
function closeDialog(dialog: HTMLDialogElement): void {
    if (typeof dialog.close === 'function') {
        dialog.close();
    } else {
        dialog.removeAttribute('open');
    }
}

/**
 * 모달 — 브라우저 <dialog>(showModal). Esc · 바깥 막기 · 포커스는 브라우저 기본
 * - 열려 있을 때만 내용을 그려, 다시 열면 안의 입력이 처음 상태로 돌아간다
 * - 그리기 전에(useLayoutEffect) 열고 닫아, 내용이 빠진 빈 대화상자가 보이지 않는다
 *
 * @param param0
 * @returns
 */
export default function Modal({open, title, onClose, footer, children}: ModalProps): React.ReactNode {
    // 변수
    const dialogRef = useRef<HTMLDialogElement>(null); // <dialog> 요소
    const titleId = useId();                           // 제목 id — aria-labelledby

    // 효과
    useLayoutEffect(() => {
        // open 에 맞춰 <dialog> 를 열고 닫는다
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }

        if (open && !dialog.open) {
            openDialog(dialog);
        } else if (!open && dialog.open) {
            closeDialog(dialog);
        }
    }, [open]);

    useLayoutEffect(() => {
        // 사라질 때 닫아 포커스를 연 요소로 돌려준다(경로 모달이 주소를 떠날 때)
        const dialog = dialogRef.current;
        return () => {
            if (dialog?.open) {
                closeDialog(dialog);
            }
        };
    }, []);

    // 함수
    function cancel(event: React.SyntheticEvent<HTMLDialogElement>): void {
        event.preventDefault(); // Esc — 닫힘은 부모가 open 으로 정한다
        onClose();
    }

    function syncClosed(event: React.SyntheticEvent<HTMLDialogElement>): void {
        if (open && !event.currentTarget.open) {
            onClose(); // 브라우저가 스스로 닫았다(취소를 막은 뒤 두 번째 Esc 등) — open 을 맞춘다
        }
    }

    return (
        // 모달 — 열려 있을 때만 내용을 그린다
        <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onCancel={cancel} onClose={syncClosed}>
            {open ? (
                <>
                    {/* 머리 — 제목 · 닫기 */}
                    <header className={styles.header}>
                        <h2 id={titleId} className={styles.title}>{title}</h2>
                        <button type="button" className={styles.close} aria-label="닫기" onClick={onClose}>×</button>
                    </header>

                    {/* 본문 */}
                    <div className={styles.body}>{children}</div>

                    {/* 아래 버튼 줄 */}
                    {footer ? <footer className={styles.footer}>{footer}</footer> : null}
                </>
            ) : null}
        </dialog>
    );
}
