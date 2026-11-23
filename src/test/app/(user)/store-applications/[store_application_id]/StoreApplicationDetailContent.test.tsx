import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import StoreApplicationDetailContent from '@/app/(user)/store-applications/[store_application_id]/StoreApplicationDetailContent';
import { StoreMyApplicationResultDto } from '@/contracts/store/dto/store-my-application.dto';
import { ApiError } from '@/shared/api/request';
import { UploadStepsType } from '@/shared/api/upload';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';
import { applyPublicEnv } from '@/shared/utils/public-env';

const {getMyStoreApplication, issueStoreApplicationFileUrl, registerStoreApplicationFile, deleteStoreApplicationFile, cancelStoreApplication, uploadFile, replace, showErrorPopup} = vi.hoisted(() => ({
    getMyStoreApplication: vi.fn(),
    issueStoreApplicationFileUrl: vi.fn(),
    registerStoreApplicationFile: vi.fn(),
    deleteStoreApplicationFile: vi.fn(),
    cancelStoreApplication: vi.fn(),
    uploadFile: vi.fn(),
    replace: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/store/api', () => ({getMyStoreApplication, issueStoreApplicationFileUrl, registerStoreApplicationFile, deleteStoreApplicationFile, cancelStoreApplication}));
vi.mock('@/shared/api/upload', () => ({uploadFile}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

/** 로그인한 이용자 */
const AUTH: AuthContextType = {area: 'user', token: 'user-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/** 신청 ID · 업체코드 */
const APPLICATION_ID = 'a'.repeat(32);
const STORE_CODE = '3f9a2c7e5b1d4a8e9c0f6b2d7e4a1c21';

/**
 * 신청 상세 — 대기 · 파일 없음
 *
 * @param extra 바꿀 값
 */
function detail(extra: Partial<StoreMyApplicationResultDto> = {}): StoreMyApplicationResultDto {
    return {
        store_application_id: APPLICATION_ID,
        store_application_state_id: 'WAIT',
        store_name: '스테이 리프 신촌점',
        business_number: '2345678901',
        owner_name: '김하늘',
        owner_phone: '01012345678',
        head_manager_login_id: 'sinchon_head',
        phone: '0212345678',
        address: '서울특별시 서대문구 연세로7길 21',
        address_detail: '2층',
        latitude: 37.5591,
        longitude: 126.9368,
        application_comment: null,
        reject_comment: null,
        reviewed_at: null,
        created_at: '2026-11-08T03:00:00.000Z',
        store_code: null,
        files: [],
        ...extra,
    } as StoreMyApplicationResultDto;
}

/**
 * 상세를 그리고 조회를 기다린다
 */
async function renderDetail(): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = render(
            <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                <StoreApplicationDetailContent applicationId={APPLICATION_ID} />
            </RootLayoutProvider>,
        ).container;
    });
    return container;
}

beforeEach(() => {
    applyPublicEnv({NEXT_PUBLIC_SERVER_URL: 'https://deskless.kr'}); // 루트 layout 이 넘기는 공개 값
    vi.stubEnv('NEXT_PUBLIC_LOCAL_SERVER_PREFIX', '');
    getMyStoreApplication.mockReset();
    issueStoreApplicationFileUrl.mockReset().mockResolvedValue({file_key: 'k', upload_url: 'https://s3/put', expires_at: '2026-11-08T03:10:00.000Z'});
    registerStoreApplicationFile.mockReset();
    deleteStoreApplicationFile.mockReset();
    cancelStoreApplication.mockReset().mockResolvedValue(null);
    uploadFile.mockReset();
    replace.mockClear();
    showErrorPopup.mockClear();
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('StoreApplicationDetailContent', () => {
    it('[SUCCESS] 대기 신청에 사업자등록증을 올린다 → 업로드 주소 발급(용도 사업자등록증) → 등록 → 상세 다시', async () => {
        getMyStoreApplication.mockResolvedValue(detail());
        uploadFile.mockImplementation(async (_file: File, steps: UploadStepsType<unknown>) => {
            await steps.issue('image/png');
            return steps.register({file_key: 'k', file_name: 'license.png', content_type: 'image/png'});
        });
        const container = await renderDetail();

        expect(screen.getByText('사업자등록증 사진이 아직 없어요.')).toBeTruthy();
        const file = new File(['x'], 'license.png', {type: 'image/png'});
        await act(async () => {
            fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {target: {files: [file]}});
        });

        expect(uploadFile).toHaveBeenCalledTimes(1);
        expect(uploadFile.mock.calls[0][0]).toBe(file);
        expect(issueStoreApplicationFileUrl).toHaveBeenCalledTimes(1);
        expect(issueStoreApplicationFileUrl.mock.calls[0][1]).toBe(APPLICATION_ID);
        expect({...issueStoreApplicationFileUrl.mock.calls[0][2]}).toEqual({store_file_purpose_id: 'BUSINESS_LICENSE', content_type: 'image/png'});
        expect(registerStoreApplicationFile).toHaveBeenCalledTimes(1);
        expect({...registerStoreApplicationFile.mock.calls[0][2]}).toEqual({store_file_purpose_id: 'BUSINESS_LICENSE', file_key: 'k', file_name: 'license.png', content_type: 'image/png'});
        expect(getMyStoreApplication).toHaveBeenCalledTimes(2);
        expect(showErrorPopup).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 대기 신청을 취소한다 → 확인 뒤 취소(큐) 1번 → 상세를 다시 읽어 없어졌으면(404) 목록', async () => {
        getMyStoreApplication.mockResolvedValueOnce(detail()).mockRejectedValueOnce(new ApiError(404, {message: '입점 신청을 찾을 수 없습니다.', validation_errors: null}));
        await renderDetail();

        fireEvent.click(screen.getByRole('button', {name: '신청 취소'}));
        const dialog = within(document.querySelector('dialog[open]') as HTMLElement);
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '신청 취소'}));
        });

        expect(cancelStoreApplication).toHaveBeenCalledTimes(1);
        expect(cancelStoreApplication.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(cancelStoreApplication.mock.calls[0][1]).toBe(APPLICATION_ID);
        expect(getMyStoreApplication).toHaveBeenCalledTimes(2);
        expect(getMyStoreApplication.mock.calls[1][1]).toBe(APPLICATION_ID);
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('입점 신청을 취소했어요.');
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith('/store-applications/');
    });

    it('[FAIL:pending] 취소(큐) 뒤에도 신청이 남아 있다 → 늦어짐 안내 · 목록으로 가지 않고 상세 다시', async () => {
        getMyStoreApplication.mockResolvedValue(detail());
        await renderDetail();

        fireEvent.click(screen.getByRole('button', {name: '신청 취소'}));
        const dialog = within(document.querySelector('dialog[open]') as HTMLElement);
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '신청 취소'}));
        });

        expect(cancelStoreApplication).toHaveBeenCalledTimes(1);
        expect(getMyStoreApplication).toHaveBeenCalledTimes(3);
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('처리가 늦어지고 있어요. 잠시 뒤 다시 시도해 주세요.');
        expect(replace).not.toHaveBeenCalled();
        expect(screen.getByRole('heading', {name: '스테이 리프 신촌점'})).toBeTruthy();
    });

    it('[SUCCESS] 승인된 신청을 연다 → 로그인 주소 복사만(업체코드 · 주소 글자 숨김 — 복사하면 그 업체 로그인 주소), 파일은 보기만, 신청 취소 없음', async () => {
        getMyStoreApplication.mockResolvedValue(detail({
            store_application_state_id: 'APPROVED',
            store_code: STORE_CODE,
            reviewed_at: '2026-11-10T03:00:00.000Z',
            files: [{store_file_id: 'f'.repeat(32), store_file_purpose_id: 'BUSINESS_LICENSE', file_name: 'license.png', content_type: 'image/png', is_private: 1, file_url: 'https://cdn.example.com/license.png', created_at: '2026-11-08T03:05:00.000Z'}],
        }));
        const container = await renderDetail();

        expect(screen.getByText('입점이 승인되었어요.')).toBeTruthy();
        expect(document.body.textContent).not.toContain(STORE_CODE);
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '로그인 주소 복사'}));
        });
        expect(writeText).toHaveBeenCalledWith(`https://deskless.kr/manager/${STORE_CODE}/login/`);
        expect(screen.getByAltText('사업자등록증')).toBeTruthy();
        expect(screen.queryByRole('button', {name: /지우기/})).toBeNull();
        expect(container.querySelector('input[type="file"]')).toBeNull();
        expect(screen.queryByRole('button', {name: '신청 취소'})).toBeNull();
    });
});
