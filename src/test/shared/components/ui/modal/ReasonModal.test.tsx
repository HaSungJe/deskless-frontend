import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ReasonModal from '@/shared/components/ui/modal/ReasonModal';

type ReasonModalProps = React.ComponentProps<typeof ReasonModal>;

function renderReasonModal(props: Partial<ReasonModalProps> = {}) {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ReasonModal open title="업체 취소" {...props} onConfirm={onConfirm} onClose={onClose} />);

    const textarea = screen.getByRole('textbox', {name: /사유/}) as HTMLTextAreaElement;
    const confirm = screen.getByRole('button', {name: '확인'}) as HTMLButtonElement;
    const cancel = screen.getByRole('button', {name: '취소'}) as HTMLButtonElement;
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    return {onConfirm, onClose, textarea, confirm, cancel, dialog};
}

describe('ReasonModal', () => {
    it('[FAIL:validation] 필수인데 사유가 비어 있거나 공백뿐이면 확인을 막는다', () => {
        const {onConfirm, textarea, confirm} = renderReasonModal();

        expect(confirm.disabled).toBe(true);
        fireEvent.click(confirm);

        fireEvent.change(textarea, {target: {value: '   '}});
        expect(confirm.disabled).toBe(true);
        fireEvent.click(confirm);

        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 확인하면 앞뒤 공백을 뺀 사유를 한 번 넘긴다', () => {
        const {onConfirm, onClose, textarea, confirm} = renderReasonModal();

        fireEvent.change(textarea, {target: {value: '  고객 요청  '}});
        fireEvent.click(confirm);

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith('고객 요청');
        expect(onClose).not.toHaveBeenCalled();
    });

    it('[SUCCESS] maxLength 를 넘는 입력은 잘라서 넘긴다', () => {
        const {onConfirm, textarea, confirm} = renderReasonModal({maxLength: 5});

        expect(textarea.maxLength).toBe(5);
        fireEvent.change(textarea, {target: {value: '123456789'}});

        expect(textarea.value).toBe('12345');
        fireEvent.click(confirm);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith('12345');
    });

    it('[SUCCESS] 필수가 아니면 빈 사유로도 확인된다', () => {
        const {onConfirm, confirm} = renderReasonModal({required: false});

        expect(confirm.disabled).toBe(false);
        fireEvent.click(confirm);

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith('');
    });

    it('[FAIL:busy] 처리 중이면 사유가 있어도 확인을 막는다', () => {
        const {onConfirm, textarea, confirm} = renderReasonModal({busy: true});

        fireEvent.change(textarea, {target: {value: '고객 요청'}});
        expect(confirm.disabled).toBe(true);
        fireEvent.click(confirm);

        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 취소 버튼은 onClose 를 한 번 부르고 사유는 넘기지 않는다', () => {
        const {onConfirm, onClose, textarea, cancel} = renderReasonModal();

        fireEvent.change(textarea, {target: {value: '고객 요청'}});
        fireEvent.click(cancel);

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('[SUCCESS] Esc(cancel) 는 브라우저 닫기를 막고 onClose 를 한 번 부른다', () => {
        const {onConfirm, onClose, dialog} = renderReasonModal();
        const event = new Event('cancel', {cancelable: true});

        fireEvent(dialog, event);

        expect(event.defaultPrevented).toBe(true);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 브라우저가 스스로 닫으면 onClose 를 한 번 부른다', () => {
        const {onClose, dialog} = renderReasonModal();

        dialog.removeAttribute('open'); // 실제 브라우저의 close() 결과
        fireEvent(dialog, new Event('close'));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('[SUCCESS] 닫혀 있으면 그리지 않고, 다시 열면 사유 칸이 비어 있다', () => {
        const onConfirm = vi.fn();
        const onClose = vi.fn();
        const {rerender} = render(<ReasonModal open title="업체 취소" onConfirm={onConfirm} onClose={onClose} />);

        fireEvent.change(screen.getByRole('textbox', {name: /사유/}), {target: {value: '고객 요청'}});

        rerender(<ReasonModal open={false} title="업체 취소" onConfirm={onConfirm} onClose={onClose} />);
        expect(screen.queryByRole('textbox', {name: /사유/})).toBeNull();
        expect(onClose).not.toHaveBeenCalled();

        rerender(<ReasonModal open title="업체 취소" onConfirm={onConfirm} onClose={onClose} />);
        expect((screen.getByRole('textbox', {name: /사유/}) as HTMLTextAreaElement).value).toBe('');
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
