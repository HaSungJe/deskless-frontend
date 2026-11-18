import { AuthType, withAuth } from '@/shared/api/auth';
import { callQueue } from '@/shared/api/queue';
import { request } from '@/shared/api/request';
import { StoreApplicationFileUploadUrlDto, StoreApplicationFileUploadUrlResultDto } from './dto/store-application-file-upload-url.dto';
import { StoreApplicationFileDto, StoreApplicationFileResultDto } from './dto/store-application-file.dto';
import { StoreApplicationDto, StoreApplicationResultDto } from './dto/store-application.dto';
import { StoreMyApplicationListDto, StoreMyApplicationListResultDto } from './dto/store-my-application-list.dto';
import { StoreLoginStoreResultDto } from './dto/store-login-store.dto';
import { StoreMineResultDto } from './dto/store-mine.dto';
import { StoreMyApplicationResultDto } from './dto/store-my-application.dto';

/**
 * 매니저 로그인용 업체 확인 — 동기 · 공개 (GET /admin-service/store/login-store/:store_code)
 * - 없음 · 탈퇴 · 모양이 틀린 업체코드는 404, 영업중지는 400 + suspend_comment(frontend/changes/2026-11-18-store-login-store.md)
 *
 * @param store_code 주소의 업체코드
 * @param signal 화면을 떠날 때 취소
 */
export function getLoginStore(store_code: string, signal?: AbortSignal): Promise<StoreLoginStoreResultDto | null> {
    return request<StoreLoginStoreResultDto>({path: `/admin-service/store/login-store/${encodeURIComponent(store_code)}`, signal});
}

/**
 * 내 업체 상세 — 동기 · 매니저 (GET /admin-service/store/mine) — 콘솔 상단 바 · 영업중지 띠 · 내 업체 설정
 *
 * @param auth AuthContext 값(매니저)
 * @param signal 화면을 떠날 때 취소
 */
export function getMyStore(auth: AuthType, signal?: AbortSignal): Promise<StoreMineResultDto | null> {
    return withAuth(auth, (token) => request<StoreMineResultDto>({path: '/admin-service/store/mine', token, signal}));
}

/**
 * 내 입점 신청 주소 — /user-service/store/application/mine/<ID>
 *
 * @param store_application_id 입점 신청 ID(주소에서)
 */
function myApplicationPath(store_application_id: string): string {
    return `/user-service/store/application/mine/${encodeURIComponent(store_application_id)}`;
}

/**
 * 입점 신청 — 큐 · 이용자 (POST /user-service/store/application) — done 이면 신청 ID(파일을 붙일 때)
 *
 * @param auth AuthContext 값
 * @param dto 업체 정보 · 대표자 · 업체 총관리자 계정 · 좌표 · 남길 말
 */
export function createStoreApplication(auth: AuthType, dto: StoreApplicationDto): Promise<StoreApplicationResultDto | null> {
    return withAuth(auth, (token) => callQueue<StoreApplicationResultDto>({method: 'POST', path: '/user-service/store/application', body: dto, token}));
}

/**
 * 내 입점 신청 목록 — 동기 · 이용자 (GET /user-service/store/application/mine)
 *
 * @param auth AuthContext 값
 * @param query 페이지 · 개수
 * @param signal 쪽이 바뀌거나 화면을 떠날 때 취소
 */
export function getMyStoreApplications(auth: AuthType, query: StoreMyApplicationListDto, signal?: AbortSignal): Promise<StoreMyApplicationListResultDto | null> {
    return withAuth(auth, (token) => request<StoreMyApplicationListResultDto>({path: '/user-service/store/application/mine', query: {page: query.page, size: query.size}, token, signal}));
}

/**
 * 내 입점 신청 상세 — 동기 · 이용자 (GET /user-service/store/application/mine/:store_application_id)
 *
 * @param auth AuthContext 값
 * @param store_application_id 입점 신청 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getMyStoreApplication(auth: AuthType, store_application_id: string, signal?: AbortSignal): Promise<StoreMyApplicationResultDto | null> {
    return withAuth(auth, (token) => request<StoreMyApplicationResultDto>({path: myApplicationPath(store_application_id), token, signal}));
}

/**
 * 입점 신청 취소 — 큐 · 이용자 (DELETE …/mine/:store_application_id) — 대기 중인 신청만, 결과 DTO 가 없어 done · pending 이 같다
 *
 * @param auth AuthContext 값
 * @param store_application_id 입점 신청 ID
 */
export function cancelStoreApplication(auth: AuthType, store_application_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'DELETE', path: myApplicationPath(store_application_id), token}));
}

/**
 * 업체 정보 파일 업로드 주소 — 동기 · 이용자 (POST …/mine/:store_application_id/file/upload-url)
 *
 * @param auth AuthContext 값
 * @param store_application_id 입점 신청 ID
 * @param dto 용도 · MIME
 */
export function issueStoreApplicationFileUrl(auth: AuthType, store_application_id: string, dto: StoreApplicationFileUploadUrlDto): Promise<StoreApplicationFileUploadUrlResultDto | null> {
    return withAuth(auth, (token) => request<StoreApplicationFileUploadUrlResultDto>({method: 'POST', path: `${myApplicationPath(store_application_id)}/file/upload-url`, body: dto, token}));
}

/**
 * 업체 정보 파일 등록 — 큐 · 이용자 (POST …/mine/:store_application_id/file) — 업로드 주소로 올린 파일의 키를 붙인다
 *
 * @param auth AuthContext 값
 * @param store_application_id 입점 신청 ID
 * @param dto 용도 · 저장 키 · 파일 이름 · MIME
 */
export function registerStoreApplicationFile(auth: AuthType, store_application_id: string, dto: StoreApplicationFileDto): Promise<StoreApplicationFileResultDto | null> {
    return withAuth(auth, (token) => callQueue<StoreApplicationFileResultDto>({method: 'POST', path: `${myApplicationPath(store_application_id)}/file`, body: dto, token}));
}

/**
 * 업체 정보 파일 삭제 — 큐 · 이용자 (DELETE …/mine/:store_application_id/file/:store_file_id) — 결과 DTO 가 없다
 *
 * @param auth AuthContext 값
 * @param store_application_id 입점 신청 ID
 * @param store_file_id 업체 정보 파일 ID
 */
export function deleteStoreApplicationFile(auth: AuthType, store_application_id: string, store_file_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'DELETE', path: `${myApplicationPath(store_application_id)}/file/${encodeURIComponent(store_file_id)}`, token}));
}
