// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { imageContentType } from '@/shared/utils/file';

describe('imageContentType', () => {
    it('[SUCCESS] MIME 이 JPG · PNG 면 그 MIME', () => {
        expect(imageContentType({type: 'image/jpeg', name: 'a.jpg'})).toBe('image/jpeg');
        expect(imageContentType({type: 'image/png', name: 'a.png'})).toBe('image/png');
    });

    it('[SUCCESS] MIME 이 비어 있으면 확장자로 — 대소문자 무시', () => {
        expect(imageContentType({type: '', name: 'photo.JPG'})).toBe('image/jpeg');
        expect(imageContentType({type: '', name: 'photo.jpeg'})).toBe('image/jpeg');
        expect(imageContentType({type: '', name: 'scan.png'})).toBe('image/png');
    });

    it('[FAIL:type] JPG · PNG 가 아니면 null', () => {
        expect(imageContentType({type: 'image/gif', name: 'a.gif'})).toBeNull();
        expect(imageContentType({type: 'image/heic', name: 'IMG_1.HEIC'})).toBeNull();
    });

    it('[FAIL:type] MIME 이 있으면 MIME 이 먼저 — 확장자만 바꾼 파일은 막힘', () => {
        expect(imageContentType({type: 'image/gif', name: 'fake.jpg'})).toBeNull();
    });

    it('[FAIL:type] MIME 도 확장자도 없으면 null', () => {
        expect(imageContentType({type: '', name: 'noext'})).toBeNull();
    });
});
