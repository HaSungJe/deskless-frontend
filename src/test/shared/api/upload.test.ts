// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { ApiError, NetworkError } from '@/shared/api/request';
import { IMAGE_TYPE_MESSAGE, UPLOAD_FAIL_MESSAGE, uploadFile, UploadStepsType, UploadUrlType } from '@/shared/api/upload';

type RegisteredType = {store_file_id: string};

const fetchMock = vi.fn();

const ISSUED: UploadUrlType = {file_key: 'store/abc.png', upload_url: 'https://s3.ap-northeast-2.amazonaws.com/bucket/store/abc.png?sig=1', expires_at: '2026-11-16T10:10:00.000Z'};

/**
 * 업로드 주소 발급 · 등록 mock
 */
function steps(): {issue: Mock<UploadStepsType<RegisteredType>['issue']>; register: Mock<UploadStepsType<RegisteredType>['register']>} {
    return {
        issue: vi.fn<UploadStepsType<RegisteredType>['issue']>().mockResolvedValue(ISSUED),
        register: vi.fn<UploadStepsType<RegisteredType>['register']>().mockResolvedValue({store_file_id: 'file-1'}),
    };
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('uploadFile', () => {
    it('[SUCCESS] 발급 → S3 PUT → 등록 순서로 한 번씩, 결과는 등록 결과', async () => {
        const {issue, register} = steps();
        const file = new File(['png'], 'front.png', {type: 'image/png'});
        fetchMock.mockResolvedValue(new Response(null, {status: 200}));

        const result = await uploadFile(file, {issue, register});

        expect(result).toEqual({store_file_id: 'file-1'});
        expect(issue).toHaveBeenCalledTimes(1);
        expect(issue).toHaveBeenCalledWith('image/png');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe(ISSUED.upload_url);
        expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
        expect(fetchMock.mock.calls[0][1].headers).toEqual({'Content-Type': 'image/png'});
        expect(fetchMock.mock.calls[0][1].body).toBe(file);
        expect(register).toHaveBeenCalledTimes(1);
        expect(register).toHaveBeenCalledWith({file_key: ISSUED.file_key, file_name: 'front.png', content_type: 'image/png'});
        expect(issue.mock.invocationCallOrder[0]).toBeLessThan(fetchMock.mock.invocationCallOrder[0]);
        expect(fetchMock.mock.invocationCallOrder[0]).toBeLessThan(register.mock.invocationCallOrder[0]);
    });

    it('[FAIL:validation] JPG · PNG 가 아니면 ApiError(400) — 발급 · PUT · 등록 안 부름', async () => {
        const {issue, register} = steps();
        const file = new File(['gif'], 'moving.gif', {type: 'image/gif'});

        const error = await uploadFile(file, {issue, register}).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).body.message).toBe(IMAGE_TYPE_MESSAGE);
        expect(issue).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(register).not.toHaveBeenCalled();
    });

    it('[FAIL:upload] 업로드 주소를 못 받으면 ApiError(500) — PUT · 등록 안 부름', async () => {
        const {issue, register} = steps();
        issue.mockResolvedValue(null);
        const file = new File(['png'], 'front.png', {type: 'image/png'});

        const error = await uploadFile(file, {issue, register}).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(500);
        expect((error as ApiError).body.message).toBe(UPLOAD_FAIL_MESSAGE);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(register).not.toHaveBeenCalled();
    });

    it('[FAIL:network] S3 로 보내다 응답이 없으면 NetworkError — 등록 안 부름', async () => {
        const {issue, register} = steps();
        const file = new File(['png'], 'front.png', {type: 'image/png'});
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

        const error = await uploadFile(file, {issue, register}).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(NetworkError);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(register).not.toHaveBeenCalled();
    });

    it('[FAIL:upload] S3 가 403 이면 ApiError(403) — 등록 안 부름', async () => {
        const {issue, register} = steps();
        const file = new File(['jpg'], 'room.jpg', {type: 'image/jpeg'});
        fetchMock.mockResolvedValue(new Response('<Error>AccessDenied</Error>', {status: 403}));

        const error = await uploadFile(file, {issue, register}).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
        expect((error as ApiError).body.message).toBe(UPLOAD_FAIL_MESSAGE);
        expect(issue).toHaveBeenCalledTimes(1);
        expect(register).not.toHaveBeenCalled();
    });
});
