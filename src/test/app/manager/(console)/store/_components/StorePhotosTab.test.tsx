import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import StorePhotosTab from '@/app/manager/(console)/store/_components/StorePhotosTab';
import { UploadStepsType } from '@/shared/api/upload';
import { UploaderImageType } from '@/shared/components/upload/ImageUploader';
import { renderWithManager, storeMine } from '../store-fixture';

const {issueMyStoreFileUrl, registerMyStoreFile, reorderMyStoreFiles, deleteMyStoreFile, uploadFile} = vi.hoisted(() => ({
    issueMyStoreFileUrl: vi.fn(),
    registerMyStoreFile: vi.fn(),
    reorderMyStoreFiles: vi.fn(),
    deleteMyStoreFile: vi.fn(),
    uploadFile: vi.fn(),
}));

vi.mock('@/contracts/store/api', () => ({issueMyStoreFileUrl, registerMyStoreFile, reorderMyStoreFiles, deleteMyStoreFile}));
vi.mock('@/shared/api/upload', () => ({uploadFile}));

/** 사진 부품 — 끌기 대신 버튼 두 개(올리기 · 순서 뒤집기), 받은 사진 순서를 보인다(jsdom 에서 dnd 를 끌지 않는다) */
vi.mock('@/shared/components/upload/ImageUploader', () => ({
    default: ({images, onUpload, onReorder}: {images: Array<UploaderImageType>; onUpload: (file: File) => Promise<void>; onReorder: (ids: Array<string>) => void}) => (
        <div>
            <p>{images.map((image) => image.alt).join(',')}</p>
            <button type="button" onClick={() => onUpload(new File(['x'], 'lobby.png', {type: 'image/png'}))}>올리기 테스트</button>
            <button type="button" onClick={() => onReorder(images.map((image) => image.id).reverse())}>순서 뒤집기 테스트</button>
        </div>
    ),
}));

const onSaved = vi.fn();

beforeEach(() => {
    issueMyStoreFileUrl.mockReset().mockResolvedValue({file_key: 'k', upload_url: 'https://s3/put', expires_at: '2026-11-18T03:10:00.000Z'});
    registerMyStoreFile.mockReset().mockResolvedValue({store_file_id: 'e'.repeat(32)});
    reorderMyStoreFiles.mockReset().mockResolvedValue(null);
    deleteMyStoreFile.mockReset();
    uploadFile.mockReset().mockImplementation(async (_file: File, steps: UploadStepsType<unknown>) => {
        await steps.issue('image/png');
        return steps.register({file_key: 'k', file_name: 'lobby.png', content_type: 'image/png'});
    });
    onSaved.mockReset().mockResolvedValue(undefined);
});

describe('StorePhotosTab', () => {
    it('[SUCCESS] 사진을 올린다 → 업로드 주소 발급(형식) → 등록(큐 — 키 · 이름 · 형식) → 다시 읽기', async () => {
        renderWithManager(<StorePhotosTab store={storeMine()} onSaved={onSaved} />);
        expect(screen.getByText('외관.jpg,입구.jpg')).toBeTruthy();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '올리기 테스트'}));
        });

        expect(uploadFile).toHaveBeenCalledTimes(1);
        expect(issueMyStoreFileUrl).toHaveBeenCalledTimes(1);
        expect(issueMyStoreFileUrl.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect({...issueMyStoreFileUrl.mock.calls[0][1]}).toEqual({content_type: 'image/png'});
        expect(registerMyStoreFile).toHaveBeenCalledTimes(1);
        expect({...registerMyStoreFile.mock.calls[0][1]}).toEqual({file_key: 'k', file_name: 'lobby.png', content_type: 'image/png'});
        expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it('[SUCCESS] 끌어서 순서를 바꾼다 → 순서 저장(큐) 1번(사진 ID 전부, 바꾼 순서) → 다시 읽기', async () => {
        renderWithManager(<StorePhotosTab store={storeMine()} onSaved={onSaved} />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '순서 뒤집기 테스트'}));
        });

        expect(reorderMyStoreFiles).toHaveBeenCalledTimes(1);
        expect({...reorderMyStoreFiles.mock.calls[0][1]}).toEqual({store_file_ids: ['a'.repeat(32), 'c'.repeat(32)]});
        expect(onSaved).toHaveBeenCalledTimes(1);
        expect(deleteMyStoreFile).not.toHaveBeenCalled();
    });
});
