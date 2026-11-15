import { ApiError, sendRequest } from '@/shared/api/request';
import { ImageMimeType, imageContentType } from '@/shared/utils/file';

/** 업로드 주소 발급 결과 — …UploadUrlResultDto 와 같은 모양 */
export type UploadUrlType = {
    file_key: string;   // 저장 키 — 등록 때 보낸다
    upload_url: string; // 업로드 주소(PUT, 10분)
    expires_at: string; // 업로드 주소 만료(ISO 8601)
};

/** 등록 API 에 넘길 값 — …FileDto · …ImageDto 의 공통 칸 */
export type UploadedFileType = {
    file_key: string;            // 저장 키
    file_name: string;           // 원본 파일 이름
    content_type: ImageMimeType; // 발급 때와 같은 MIME
};

/** 화면이 넘기는 두 API — 그 도메인 contracts 함수로 감싼다 */
export type UploadStepsType<T> = {
    issue: (content_type: ImageMimeType) => Promise<UploadUrlType | null>; // 업로드 주소 발급(동기)
    register: (file: UploadedFileType) => Promise<T | null>;               // 등록(큐) — pending 이면 null
};

/** 형식이 JPG · PNG 가 아닐 때 — DTO 메시지와 같다 */
export const IMAGE_TYPE_MESSAGE = 'JPG · PNG 사진만 올릴 수 있습니다.';

/** 업로드 주소를 못 받았거나 S3 가 거절했을 때 */
export const UPLOAD_FAIL_MESSAGE = '사진을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.';

/**
 * 사진 올리기 — 형식 확인 → 업로드 주소 발급 → S3 로 PUT → 등록
 * - 형식이 아니면 ApiError(400), 업로드 주소가 없거나 PUT 이 2xx 가 아니면 ApiError(그 상태) — 다음 단계를 부르지 않는다
 * - 응답 없는 실패는 NetworkError. 화면은 catch 에서 handleApiError
 *
 * @param file 고른 파일
 * @param steps 업로드 주소 발급 · 등록 API
 * @returns 등록 결과(큐 pending 이면 null → 화면이 목록을 다시 조회)
 */
export async function uploadFile<T>(file: File, {issue, register}: UploadStepsType<T>): Promise<T | null> {
    const content_type = imageContentType(file);
    if (!content_type) {
        throw new ApiError(400, {message: IMAGE_TYPE_MESSAGE, validation_errors: null});
    }

    const issued = await issue(content_type);
    if (!issued) {
        throw new ApiError(500, {message: UPLOAD_FAIL_MESSAGE, validation_errors: null});
    }

    const response = await sendRequest(issued.upload_url, {method: 'PUT', headers: {'Content-Type': content_type}, body: file});
    if (!response.ok) {
        throw new ApiError(response.status, {message: UPLOAD_FAIL_MESSAGE, validation_errors: null});
    }

    return register({file_key: issued.file_key, file_name: file.name, content_type});
}
