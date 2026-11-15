import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import RouteModal from '@/shared/components/ui/modal/RouteModal';

const {back} = vi.hoisted(() => ({back: vi.fn()}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({back}),
}));

describe('RouteModal', () => {
    beforeEach(() => {
        back.mockClear();
    });

    it('[SUCCESS] 열린 채 그려지고 내용을 보여 준다', () => {
        render(<RouteModal title="업체 상세"><p>업체 내용</p></RouteModal>);

        expect(screen.getByRole('heading', {name: '업체 상세'})).toBeTruthy();
        expect(screen.getByText('업체 내용')).toBeTruthy();
        expect(back).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 닫기를 빠르게 두 번 눌러도 뒤로 가기는 한 번만 한다', () => {
        render(<RouteModal title="업체 상세"><p>업체 내용</p></RouteModal>);
        const close = screen.getByRole('button', {name: '닫기'});

        fireEvent.click(close);
        fireEvent.click(close);

        expect(back).toHaveBeenCalledTimes(1);
    });

    it('[SUCCESS] Esc(cancel) 도 뒤로 가기를 한 번 한다', () => {
        render(<RouteModal title="업체 상세"><p>업체 내용</p></RouteModal>);
        const dialog = document.querySelector('dialog') as HTMLDialogElement;

        fireEvent(dialog, new Event('cancel', {cancelable: true}));
        fireEvent(dialog, new Event('cancel', {cancelable: true}));

        expect(back).toHaveBeenCalledTimes(1);
    });
});
