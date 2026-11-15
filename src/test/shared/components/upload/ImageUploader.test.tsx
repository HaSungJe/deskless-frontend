import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import ImageUploader, { UploaderImageType } from '@/shared/components/upload/ImageUploader';

const IMAGES: Array<UploaderImageType> = [
    {id: 'file-a', image_url: 'https://cdn.example.com/store/a.jpg', alt: '외관'},
    {id: 'file-b', image_url: 'https://cdn.example.com/store/b.jpg', alt: '입구'},
];

describe('ImageUploader', () => {
    it('[SUCCESS] 첫 장 "대표" · 나머지 순번, 파일을 고르면 onUpload 한 번 · 삭제는 onDelete 한 번', async () => {
        const onUpload = vi.fn().mockResolvedValue(undefined);
        const onDelete = vi.fn();
        render(<ImageUploader images={IMAGES} onUpload={onUpload} onDelete={onDelete} onReorder={vi.fn()} />);

        const figures = document.querySelectorAll('figure');
        expect(figures).toHaveLength(2);
        expect(within(figures[0] as HTMLElement).getByText('대표')).toBeTruthy();
        expect(within(figures[1] as HTMLElement).getByText('2')).toBeTruthy();
        expect(screen.getByRole('button', {name: '입구 순서 옮기기'})).toBeTruthy();

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['png'], 'hall.png', {type: 'image/png'});
        await act(async () => {
            fireEvent.change(input, {target: {files: [file]}});
        });

        expect(input.accept).toBe('image/jpeg,image/png');
        expect(onUpload).toHaveBeenCalledTimes(1);
        expect(onUpload).toHaveBeenCalledWith(file);

        fireEvent.click(screen.getByRole('button', {name: '입구 삭제'}));
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onDelete).toHaveBeenCalledWith('file-b');
    });

    it('[FAIL:max] 장수가 max 면 올리기 칸이 없다', () => {
        render(<ImageUploader images={IMAGES} max={2} onUpload={vi.fn()} onDelete={vi.fn()} />);

        expect(document.querySelector('input[type="file"]')).toBeNull();
        expect(screen.queryByText('사진 올리기')).toBeNull();
    });

    it('[SUCCESS] onReorder 가 없으면 손잡이가 없다', () => {
        render(<ImageUploader images={IMAGES} onUpload={vi.fn()} onDelete={vi.fn()} />);

        expect(screen.queryByRole('button', {name: '입구 순서 옮기기'})).toBeNull();
        expect(screen.getByText('사진 올리기')).toBeTruthy();
    });
});
