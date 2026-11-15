/** 올릴 수 있는 사진 형식 — 업로드 주소 발급 · 등록 DTO 의 content_type */
export type ImageMimeType = 'image/jpeg' | 'image/png';

const IMAGE_MIME_TYPES: Array<ImageMimeType> = ['image/jpeg', 'image/png'];

/** MIME 이 비어 있을 때 확장자로 */
const IMAGE_EXTENSIONS: Record<string, ImageMimeType> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
};

/**
 * 사진 형식 — JPG · PNG 면 그 MIME, 아니면 null
 * - MIME 이 있으면 MIME 을 따른다(확장자만 바꾼 파일은 막힘), 비어 있으면 확장자(대소문자 무시)
 *
 * @param file 고른 파일
 */
export function imageContentType(file: Pick<File, 'type' | 'name'>): ImageMimeType | null {
    if (file.type) {
        return (IMAGE_MIME_TYPES as Array<string>).includes(file.type) ? (file.type as ImageMimeType) : null;
    }

    const dot = file.name.lastIndexOf('.');
    const extension = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : '';
    return IMAGE_EXTENSIONS[extension] ?? null;
}
