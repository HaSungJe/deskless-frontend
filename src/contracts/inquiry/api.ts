import { AuthType, withAuth } from '@/shared/api/auth';
import { callQueue } from '@/shared/api/queue';
import { request } from '@/shared/api/request';
import { InquiryAnswerDto } from './dto/inquiry-answer.dto';
import { InquiryCategoryListResultDto } from './dto/inquiry-category-list.dto';
import { InquiryDetailResultDto } from './dto/inquiry-detail.dto';
import { InquiryListDto, InquiryListResultDto } from './dto/inquiry-list.dto';
import { InquiryManageDetailResultDto } from './dto/inquiry-manage-detail.dto';
import { InquiryManageListDto, InquiryManageListResultDto } from './dto/inquiry-manage-list.dto';
import { InquiryDto, InquiryResultDto } from './dto/inquiry.dto';

/** 내 문의 · 문의 관리 주소 — 업체 관리자는 /mine, 관리자는 /mine 없이(frontend/changes/2026-11-24-inquiry.md) */
const MY_INQUIRY_PATH = '/user-service/inquiry';
const STORE_INQUIRY_PATH = '/admin-service/inquiry/mine';
const SITE_INQUIRY_PATH = '/admin-service/inquiry';

/**
 * 문의 하나의 주소 — <앞 주소>/<문의 ID>
 *
 * @param base 앞 주소
 * @param inquiry_id 문의 ID(주소에서 — 경로에 넣을 때 encode)
 */
function inquiryPathOf(base: string, inquiry_id: string): string {
    return `${base}/${encodeURIComponent(inquiry_id)}`;
}

/**
 * 문의 카테고리 목록 — 동기 · 공개 (GET /user-service/inquiry/category) — 보일 순서, 이용자 · 업체 관리자 · 관리자 화면이 같이 쓴다
 *
 * @param signal 화면을 떠날 때 취소
 */
export function getInquiryCategories(signal?: AbortSignal): Promise<InquiryCategoryListResultDto | null> {
    return request<InquiryCategoryListResultDto>({path: `${MY_INQUIRY_PATH}/category`, signal});
}

/**
 * 문의 등록 — 큐 · 이용자 (POST /user-service/inquiry) — store_id 를 빼면 바로방 문의, done 이면 문의 ID. 동의 값은 보내지 않는다(보내면 400)
 *
 * @param auth AuthContext 값
 * @param dto 업체 ID(선택) · 카테고리 · 제목 · 내용
 */
export function createInquiry(auth: AuthType, dto: InquiryDto): Promise<InquiryResultDto | null> {
    return withAuth(auth, (token) => callQueue<InquiryResultDto>({method: 'POST', path: MY_INQUIRY_PATH, body: dto, token}));
}

/**
 * 내 문의 목록 — 동기 · 이용자 (GET /user-service/inquiry) — 카테고리 · 상태(null 이면 빠져 전체) · 최신순
 *
 * @param auth AuthContext 값
 * @param query 카테고리 · 상태 · 페이지 · 개수
 * @param signal 칩 · 쪽이 바뀌거나 화면을 떠날 때 취소
 */
export function getMyInquiries(auth: AuthType, query: InquiryListDto, signal?: AbortSignal): Promise<InquiryListResultDto | null> {
    return withAuth(auth, (token) => request<InquiryListResultDto>({path: MY_INQUIRY_PATH, query: {inquiry_category_id: query.inquiry_category_id, inquiry_state_id: query.inquiry_state_id, page: query.page, size: query.size}, token, signal}));
}

/**
 * 내 문의 상세 — 동기 · 이용자 (GET /user-service/inquiry/:inquiry_id) — 남의 문의는 404
 *
 * @param auth AuthContext 값
 * @param inquiry_id 문의 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getMyInquiry(auth: AuthType, inquiry_id: string, signal?: AbortSignal): Promise<InquiryDetailResultDto | null> {
    return withAuth(auth, (token) => request<InquiryDetailResultDto>({path: inquiryPathOf(MY_INQUIRY_PATH, inquiry_id), token, signal}));
}

/**
 * 문의 관리 목록 query — 카테고리 · 상태 · 검색어(null 이면 빠진다) · 페이지
 *
 * @param query 목록 DTO
 */
function manageQueryOf(query: InquiryManageListDto): Record<string, string | number | null> {
    return {inquiry_category_id: query.inquiry_category_id, inquiry_state_id: query.inquiry_state_id, keyword: query.keyword, page: query.page, size: query.size};
}

/**
 * 내 업체 문의 목록 — 동기 · 매니저 (GET /admin-service/inquiry/mine) — 소속 업체 문의, 업체가 탈퇴 · 삭제됐으면 404
 *
 * @param auth AuthContext 값
 * @param query 카테고리 · 상태 · 검색어(제목 · 내용) · 페이지
 * @param signal 거르기 · 쪽이 바뀌거나 화면을 떠날 때 취소
 */
export function getStoreInquiries(auth: AuthType, query: InquiryManageListDto, signal?: AbortSignal): Promise<InquiryManageListResultDto | null> {
    return withAuth(auth, (token) => request<InquiryManageListResultDto>({path: STORE_INQUIRY_PATH, query: manageQueryOf(query), token, signal}));
}

/**
 * 내 업체 문의 상세 — 동기 · 매니저 (GET /admin-service/inquiry/mine/:inquiry_id) — 다른 업체 문의는 404
 *
 * @param auth AuthContext 값
 * @param inquiry_id 문의 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getStoreInquiry(auth: AuthType, inquiry_id: string, signal?: AbortSignal): Promise<InquiryManageDetailResultDto | null> {
    return withAuth(auth, (token) => request<InquiryManageDetailResultDto>({path: inquiryPathOf(STORE_INQUIRY_PATH, inquiry_id), token, signal}));
}

/**
 * 내 업체 문의 답변 — 큐 · 매니저 (PUT /admin-service/inquiry/mine/:inquiry_id/answer) — 다시 보내면 통째로 고쳐 쓴다, 블라인드된 문의는 400, done data 없음
 *
 * @param auth AuthContext 값
 * @param inquiry_id 문의 ID
 * @param dto 답변
 */
export function answerStoreInquiry(auth: AuthType, inquiry_id: string, dto: InquiryAnswerDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PUT', path: `${inquiryPathOf(STORE_INQUIRY_PATH, inquiry_id)}/answer`, body: dto, token}));
}

/**
 * 내 업체 문의 블라인드 — 큐 · 매니저 (PATCH /admin-service/inquiry/mine/:inquiry_id/blind) — 본문 없음, 이미 블라인드면 400
 *
 * @param auth AuthContext 값
 * @param inquiry_id 문의 ID
 */
export function blindStoreInquiry(auth: AuthType, inquiry_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${inquiryPathOf(STORE_INQUIRY_PATH, inquiry_id)}/blind`, token}));
}

/**
 * 내 업체 문의 블라인드 해제 — 큐 · 매니저 (PATCH /admin-service/inquiry/mine/:inquiry_id/unblind) — 본문 없음, 블라인드가 아니면 400
 *
 * @param auth AuthContext 값
 * @param inquiry_id 문의 ID
 */
export function unblindStoreInquiry(auth: AuthType, inquiry_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${inquiryPathOf(STORE_INQUIRY_PATH, inquiry_id)}/unblind`, token}));
}

/**
 * 바로방 문의 목록 — 동기 · 관리자 (GET /admin-service/inquiry) — 업체 대상이 아닌 문의만
 *
 * @param auth AuthContext 값
 * @param query 카테고리 · 상태 · 검색어(제목 · 내용) · 페이지
 * @param signal 거르기 · 쪽이 바뀌거나 화면을 떠날 때 취소
 */
export function getInquiries(auth: AuthType, query: InquiryManageListDto, signal?: AbortSignal): Promise<InquiryManageListResultDto | null> {
    return withAuth(auth, (token) => request<InquiryManageListResultDto>({path: SITE_INQUIRY_PATH, query: manageQueryOf(query), token, signal}));
}

/**
 * 바로방 문의 상세 — 동기 · 관리자 (GET /admin-service/inquiry/:inquiry_id) — 업체 문의는 404
 *
 * @param auth AuthContext 값
 * @param inquiry_id 문의 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getInquiry(auth: AuthType, inquiry_id: string, signal?: AbortSignal): Promise<InquiryManageDetailResultDto | null> {
    return withAuth(auth, (token) => request<InquiryManageDetailResultDto>({path: inquiryPathOf(SITE_INQUIRY_PATH, inquiry_id), token, signal}));
}

/**
 * 바로방 문의 답변 — 큐 · 관리자 (PUT /admin-service/inquiry/:inquiry_id/answer) — 다시 보내면 통째로 고쳐 쓴다, 블라인드된 문의는 400, done data 없음
 *
 * @param auth AuthContext 값
 * @param inquiry_id 문의 ID
 * @param dto 답변
 */
export function answerInquiry(auth: AuthType, inquiry_id: string, dto: InquiryAnswerDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PUT', path: `${inquiryPathOf(SITE_INQUIRY_PATH, inquiry_id)}/answer`, body: dto, token}));
}

/**
 * 바로방 문의 블라인드 — 큐 · 관리자 (PATCH /admin-service/inquiry/:inquiry_id/blind) — 본문 없음, 이미 블라인드면 400
 *
 * @param auth AuthContext 값
 * @param inquiry_id 문의 ID
 */
export function blindInquiry(auth: AuthType, inquiry_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${inquiryPathOf(SITE_INQUIRY_PATH, inquiry_id)}/blind`, token}));
}

/**
 * 바로방 문의 블라인드 해제 — 큐 · 관리자 (PATCH /admin-service/inquiry/:inquiry_id/unblind) — 본문 없음, 블라인드가 아니면 400
 *
 * @param auth AuthContext 값
 * @param inquiry_id 문의 ID
 */
export function unblindInquiry(auth: AuthType, inquiry_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${inquiryPathOf(SITE_INQUIRY_PATH, inquiry_id)}/unblind`, token}));
}
