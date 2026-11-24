import { AuthType, withAuth } from '@/shared/api/auth';
import { callQueue } from '@/shared/api/queue';
import { request } from '@/shared/api/request';
import { StoreApplicationApproveResultDto } from './dto/store-application-approve.dto';
import { StoreApplicationDetailResultDto } from './dto/store-application-detail.dto';
import { StoreApplicationFileUploadUrlDto, StoreApplicationFileUploadUrlResultDto } from './dto/store-application-file-upload-url.dto';
import { StoreApplicationFileDto, StoreApplicationFileResultDto } from './dto/store-application-file.dto';
import { StoreApplicationListDto, StoreApplicationListResultDto } from './dto/store-application-list.dto';
import { StoreApplicationRejectDto } from './dto/store-application-reject.dto';
import { StoreApplicationDto, StoreApplicationResultDto } from './dto/store-application.dto';
import { StoreDetailResultDto } from './dto/store-detail.dto';
import { StoreListDto, StoreListResultDto } from './dto/store-list.dto';
import { StoreLoginStoreResultDto } from './dto/store-login-store.dto';
import { StoreMineBreaksDto } from './dto/store-mine-breaks.dto';
import { StoreMineDetailDto } from './dto/store-mine-detail.dto';
import { StoreMineDoorSecretDto } from './dto/store-mine-door-secret.dto';
import { StoreMineFileOrderDto } from './dto/store-mine-file-order.dto';
import { StoreMineFileUploadUrlDto, StoreMineFileUploadUrlResultDto } from './dto/store-mine-file-upload-url.dto';
import { StoreMineFileDto, StoreMineFileResultDto } from './dto/store-mine-file.dto';
import { StoreMineHoursDto } from './dto/store-mine-hours.dto';
import { StoreMineMaintenanceDto } from './dto/store-mine-maintenance.dto';
import { StoreMineOpenDto } from './dto/store-mine-open.dto';
import { StoreMineProfileDto } from './dto/store-mine-profile.dto';
import { StoreMineReservationPolicyDto } from './dto/store-mine-reservation-policy.dto';
import { StoreMineUnavailablePeriodListDto, StoreMineUnavailablePeriodListResultDto } from './dto/store-mine-unavailable-period-list.dto';
import { StoreMineUnavailablePeriodDto, StoreMineUnavailablePeriodResultDto } from './dto/store-mine-unavailable-period.dto';
import { StoreMineResultDto } from './dto/store-mine.dto';
import { StoreMyApplicationListDto, StoreMyApplicationListResultDto } from './dto/store-my-application-list.dto';
import { StoreMyApplicationResultDto } from './dto/store-my-application.dto';
import { StoreOpenDto } from './dto/store-open.dto';
import { StoreStateDto } from './dto/store-state.dto';
import { StoreUpdateDto } from './dto/store-update.dto';

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

/** 내 업체 주소 — /admin-service/store/mine */
const MY_STORE_PATH = '/admin-service/store/mine';

/**
 * 내 업체 소개 · 연락처 수정 — 큐 · 매니저 (PATCH /admin-service/store/mine/profile) — 결과 null
 *
 * @param auth AuthContext 값
 * @param dto 소개 · 연락처
 */
export function updateMyStoreProfile(auth: AuthType, dto: StoreMineProfileDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${MY_STORE_PATH}/profile`, body: dto, token}));
}

/**
 * 내 업체 편의시설 설정 — 큐 · 매니저 (PUT /admin-service/store/mine/detail) — 통째로 교체(빠진 항목은 0), 결과 null
 *
 * @param auth AuthContext 값
 * @param dto 편의시설 7개(0 · 1)
 */
export function updateMyStoreFacility(auth: AuthType, dto: StoreMineDetailDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PUT', path: `${MY_STORE_PATH}/detail`, body: dto, token}));
}

/**
 * 내 업체 사진 업로드 주소 — 동기 · 매니저 (POST /admin-service/store/mine/file/upload-url)
 *
 * @param auth AuthContext 값
 * @param dto content_type
 */
export function issueMyStoreFileUrl(auth: AuthType, dto: StoreMineFileUploadUrlDto): Promise<StoreMineFileUploadUrlResultDto | null> {
    return withAuth(auth, (token) => request<StoreMineFileUploadUrlResultDto>({method: 'POST', path: `${MY_STORE_PATH}/file/upload-url`, body: dto, token}));
}

/**
 * 내 업체 사진 등록 — 큐 · 매니저 (POST /admin-service/store/mine/file) — 마지막 순서
 *
 * @param auth AuthContext 값
 * @param dto file_key · file_name · content_type
 */
export function registerMyStoreFile(auth: AuthType, dto: StoreMineFileDto): Promise<StoreMineFileResultDto | null> {
    return withAuth(auth, (token) => callQueue<StoreMineFileResultDto>({method: 'POST', path: `${MY_STORE_PATH}/file`, body: dto, token}));
}

/**
 * 내 업체 사진 순서 — 큐 · 매니저 (PUT /admin-service/store/mine/file/order) — 사진 ID 전부, 결과 null
 *
 * @param auth AuthContext 값
 * @param dto store_file_ids
 */
export function reorderMyStoreFiles(auth: AuthType, dto: StoreMineFileOrderDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PUT', path: `${MY_STORE_PATH}/file/order`, body: dto, token}));
}

/**
 * 내 업체 사진 삭제 — 큐 · 매니저 (DELETE /admin-service/store/mine/file/:store_file_id) — 결과 null
 *
 * @param auth AuthContext 값
 * @param store_file_id 업체 정보 파일 ID
 */
export function deleteMyStoreFile(auth: AuthType, store_file_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'DELETE', path: `${MY_STORE_PATH}/file/${encodeURIComponent(store_file_id)}`, token}));
}

/**
 * 내 업체 영업시간 — 큐 · 매니저 (PUT /admin-service/store/mine/hours) — 통째로 교체, 결과 null
 *
 * @param auth AuthContext 값
 * @param dto is_always_open · hours
 */
export function updateMyStoreHours(auth: AuthType, dto: StoreMineHoursDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PUT', path: `${MY_STORE_PATH}/hours`, body: dto, token}));
}

/**
 * 내 업체 브레이크타임 — 큐 · 매니저 (PUT /admin-service/store/mine/breaks) — 통째로 교체, 결과 null
 *
 * @param auth AuthContext 값
 * @param dto breaks
 */
export function updateMyStoreBreaks(auth: AuthType, dto: StoreMineBreaksDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PUT', path: `${MY_STORE_PATH}/breaks`, body: dto, token}));
}

/**
 * 내 업체 정비시간 — 큐 · 매니저 (PATCH /admin-service/store/mine/maintenance) — 결과 null
 *
 * @param auth AuthContext 값
 * @param dto maintenance_minutes
 */
export function updateMyStoreMaintenance(auth: AuthType, dto: StoreMineMaintenanceDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${MY_STORE_PATH}/maintenance`, body: dto, token}));
}

/**
 * 내 업체 영업중 — 큐 · 매니저 (PATCH /admin-service/store/mine/open) — 결과 null
 *
 * @param auth AuthContext 값
 * @param dto is_open
 */
export function updateMyStoreOpen(auth: AuthType, dto: StoreMineOpenDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${MY_STORE_PATH}/open`, body: dto, token}));
}

/**
 * 내 업체 예약 · 환불 규정 — 큐 · 매니저 (PATCH /admin-service/store/mine/reservation-policy) — 결과 null
 *
 * @param auth AuthContext 값
 * @param dto booking_open_hours · refund_deadline_minutes · late_refund_percent
 */
export function updateMyStorePolicy(auth: AuthType, dto: StoreMineReservationPolicyDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${MY_STORE_PATH}/reservation-policy`, body: dto, token}));
}

/**
 * 내 업체 일시 예약불가 목록 — 동기 · 매니저 (GET /admin-service/store/mine/unavailable-period) — 끝나지 않은 것만, 시작 순
 *
 * @param auth AuthContext 값
 * @param query page · size
 * @param signal 화면을 떠날 때 취소
 */
export function getMyUnavailablePeriods(auth: AuthType, query: StoreMineUnavailablePeriodListDto, signal?: AbortSignal): Promise<StoreMineUnavailablePeriodListResultDto | null> {
    return withAuth(auth, (token) => request<StoreMineUnavailablePeriodListResultDto>({path: `${MY_STORE_PATH}/unavailable-period`, query: {page: query.page, size: query.size}, token, signal}));
}

/**
 * 내 업체 일시 예약불가 등록 — 큐 · 매니저 (POST /admin-service/store/mine/unavailable-period) — 겹치면 400
 *
 * @param auth AuthContext 값
 * @param dto starts_at · ends_at · memo
 */
export function createMyUnavailablePeriod(auth: AuthType, dto: StoreMineUnavailablePeriodDto): Promise<StoreMineUnavailablePeriodResultDto | null> {
    return withAuth(auth, (token) => callQueue<StoreMineUnavailablePeriodResultDto>({method: 'POST', path: `${MY_STORE_PATH}/unavailable-period`, body: dto, token}));
}

/**
 * 내 업체 일시 예약불가 삭제 — 큐 · 매니저 (DELETE /admin-service/store/mine/unavailable-period/:id) — 결과 null
 *
 * @param auth AuthContext 값
 * @param store_unavailable_period_id 일시 예약불가 ID
 */
export function deleteMyUnavailablePeriod(auth: AuthType, store_unavailable_period_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'DELETE', path: `${MY_STORE_PATH}/unavailable-period/${encodeURIComponent(store_unavailable_period_id)}`, token}));
}

/**
 * 내 업체 문 소켓 시크릿 — 큐 · 매니저(업체 총관리자) (PATCH /admin-service/store/mine/door-secret) — 결과 null
 *
 * @param auth AuthContext 값
 * @param dto door_secret
 */
export function updateMyDoorSecret(auth: AuthType, dto: StoreMineDoorSecretDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${MY_STORE_PATH}/door-secret`, body: dto, token}));
}

// ── 입점 신청 · 업체 관리 (A3 · A4 — 관리자) ──

/** 관리자 — 업체 경로 */
const ADMIN_STORE_PATH = '/admin-service/store';

/** 관리자 — 입점 신청 경로 */
const ADMIN_APPLICATION_PATH = '/admin-service/store/application';

/**
 * 업체 하나의 경로 — /admin-service/store/<ID>
 *
 * @param store_id 업체 ID
 */
function adminStorePath(store_id: string): string {
    return `${ADMIN_STORE_PATH}/${encodeURIComponent(store_id)}`;
}

/**
 * 입점 신청 하나의 경로 — /admin-service/store/application/<ID>
 *
 * @param store_application_id 입점 신청 ID
 */
function adminApplicationPath(store_application_id: string): string {
    return `${ADMIN_APPLICATION_PATH}/${encodeURIComponent(store_application_id)}`;
}

/**
 * 입점 신청 목록 — 동기 · 관리자 (GET /admin-service/store/application) — 신청일 최신순
 *
 * @param auth AuthContext 값
 * @param query 상태 · 검색어 · 페이지
 * @param signal 거르기를 바꾸거나 화면을 떠날 때 취소
 */
export function getStoreApplications(auth: AuthType, query: StoreApplicationListDto, signal?: AbortSignal): Promise<StoreApplicationListResultDto | null> {
    return withAuth(auth, (token) => request<StoreApplicationListResultDto>({path: ADMIN_APPLICATION_PATH, query: {store_application_state_id: query.store_application_state_id, keyword: query.keyword, page: query.page, size: query.size}, token, signal}));
}

/**
 * 입점 신청 상세 — 동기 · 관리자 (GET /admin-service/store/application/:store_application_id) — 사업자등록증 열람 주소는 10분짜리라 열 때마다 새로
 *
 * @param auth AuthContext 값
 * @param store_application_id 입점 신청 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getStoreApplication(auth: AuthType, store_application_id: string, signal?: AbortSignal): Promise<StoreApplicationDetailResultDto | null> {
    return withAuth(auth, (token) => request<StoreApplicationDetailResultDto>({path: adminApplicationPath(store_application_id), token, signal}));
}

/**
 * 입점 승인 — 큐 · 관리자 (PATCH /admin-service/store/application/:store_application_id/approve) — done 이면 만든 업체 ID · 업체코드
 *
 * @param auth AuthContext 값
 * @param store_application_id 입점 신청 ID
 */
export function approveStoreApplication(auth: AuthType, store_application_id: string): Promise<StoreApplicationApproveResultDto | null> {
    return withAuth(auth, (token) => callQueue<StoreApplicationApproveResultDto>({method: 'PATCH', path: `${adminApplicationPath(store_application_id)}/approve`, token}));
}

/**
 * 입점 반려 — 큐 · 관리자 (PATCH /admin-service/store/application/:store_application_id/reject) — 결과 null
 *
 * @param auth AuthContext 값
 * @param store_application_id 입점 신청 ID
 * @param dto reject_comment
 */
export function rejectStoreApplication(auth: AuthType, store_application_id: string, dto: StoreApplicationRejectDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${adminApplicationPath(store_application_id)}/reject`, body: dto, token}));
}

/**
 * 업체 목록 — 동기 · 관리자 (GET /admin-service/store) — 등록일 최신순
 *
 * @param auth AuthContext 값
 * @param query 상태 · 검색어 · 페이지 · 전부 읽기(all_search_yn Y — 업체 관리자 목록의 업체 고르기)
 * @param signal 거르기를 바꾸거나 화면을 떠날 때 취소
 */
export function getStores(auth: AuthType, query: StoreListDto, signal?: AbortSignal): Promise<StoreListResultDto | null> {
    return withAuth(auth, (token) => request<StoreListResultDto>({path: ADMIN_STORE_PATH, query: {all_search_yn: query.all_search_yn, store_state_id: query.store_state_id, keyword: query.keyword, page: query.page, size: query.size}, token, signal}));
}

/**
 * 업체 상세 — 동기 · 관리자 (GET /admin-service/store/:store_id)
 *
 * @param auth AuthContext 값
 * @param store_id 업체 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getStore(auth: AuthType, store_id: string, signal?: AbortSignal): Promise<StoreDetailResultDto | null> {
    return withAuth(auth, (token) => request<StoreDetailResultDto>({path: adminStorePath(store_id), token, signal}));
}

/**
 * 업체 정보 수정 — 큐 · 관리자 (PATCH /admin-service/store/:store_id) — 상호명 · 대표자 · 연락처 · 주소 · 좌표, 결과 null
 *
 * @param auth AuthContext 값
 * @param store_id 업체 ID
 * @param dto 업체 정보
 */
export function updateStore(auth: AuthType, store_id: string, dto: StoreUpdateDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: adminStorePath(store_id), body: dto, token}));
}

/**
 * 업체 상태 변경 — 큐 · 관리자 (PATCH /admin-service/store/:store_id/state) — 탈퇴는 되돌릴 수 없다, 결과 null
 *
 * @param auth AuthContext 값
 * @param store_id 업체 ID
 * @param dto store_state_id · suspend_comment
 */
export function updateStoreState(auth: AuthType, store_id: string, dto: StoreStateDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${adminStorePath(store_id)}/state`, body: dto, token}));
}

/**
 * 업체 영업중 여부 변경 — 큐 · 관리자 (PATCH /admin-service/store/:store_id/open) — 결과 null
 *
 * @param auth AuthContext 값
 * @param store_id 업체 ID
 * @param dto is_open
 */
export function updateStoreOpen(auth: AuthType, store_id: string, dto: StoreOpenDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${adminStorePath(store_id)}/open`, body: dto, token}));
}
