import { AuthType, withAuth } from '@/shared/api/auth';
import { callQueue } from '@/shared/api/queue';
import { request } from '@/shared/api/request';
import { RoomDoorOpenResultDto } from './dto/room-door-open.dto';
import { RoomGroupDetailResultDto } from './dto/room-group-detail.dto';
import { RoomGroupImageOrderDto } from './dto/room-group-image-order.dto';
import { RoomGroupImageUploadUrlDto, RoomGroupImageUploadUrlResultDto } from './dto/room-group-image-upload-url.dto';
import { RoomGroupImageDto, RoomGroupImageResultDto } from './dto/room-group-image.dto';
import { RoomGroupListDto, RoomGroupListResultDto } from './dto/room-group-list.dto';
import { RoomGroupPlanPriceListDto, RoomGroupPlanPriceListResultDto } from './dto/room-group-plan-price-list.dto';
import { RoomGroupPlanPriceUpdateDto } from './dto/room-group-plan-price-update.dto';
import { RoomGroupPlanPriceDto, RoomGroupPlanPriceResultDto } from './dto/room-group-plan-price.dto';
import { RoomGroupPlanUpdateDto } from './dto/room-group-plan-update.dto';
import { RoomGroupUpdateDto } from './dto/room-group-update.dto';
import { RoomGroupDto, RoomGroupResultDto } from './dto/room-group.dto';
import { RoomListDto, RoomListResultDto } from './dto/room-list.dto';
import { RoomPlanListResultDto } from './dto/room-plan-list.dto';
import { RoomPlanUpdateDto } from './dto/room-plan-update.dto';
import { RoomStateDto } from './dto/room-state.dto';
import { RoomUpdateDto } from './dto/room-update.dto';
import { RoomDto, RoomResultDto } from './dto/room.dto';

/** 객실(상품 설정 · 그룹 · 호실) 경로 */
const ROOM_PATH = '/admin-service/room';

/** 객실 그룹 경로 */
const ROOM_GROUP_PATH = `${ROOM_PATH}/group`;

/**
 * 객실 그룹 하나의 경로
 *
 * @param room_group_id 객실 그룹 ID
 */
function groupPath(room_group_id: string): string {
    return `${ROOM_GROUP_PATH}/${encodeURIComponent(room_group_id)}`;
}

/**
 * 그룹 상품 하나의 기간 가격 경로
 *
 * @param room_group_id 객실 그룹 ID
 * @param room_plan_type_id 상품 종류
 */
function pricePath(room_group_id: string, room_plan_type_id: string): string {
    return `${groupPath(room_group_id)}/plan/${encodeURIComponent(room_plan_type_id)}/price`;
}

/**
 * 호실 하나의 경로
 *
 * @param room_id 호실 ID
 */
function roomPath(room_id: string): string {
    return `${ROOM_PATH}/${encodeURIComponent(room_id)}`;
}

// ── 업체 상품 설정 (M6) ──

/**
 * 업체 상품 설정 목록 — 동기 · 매니저 (GET /admin-service/room/plan) — 상품 종류마다 1개(HOURLY · NIGHT · LONG 순)
 *
 * @param auth AuthContext 값
 * @param signal 화면을 떠날 때 취소
 */
export function getRoomPlans(auth: AuthType, signal?: AbortSignal): Promise<RoomPlanListResultDto | null> {
    return withAuth(auth, (token) => request<RoomPlanListResultDto>({path: `${ROOM_PATH}/plan`, token, signal}));
}

/**
 * 업체 상품 설정 수정 — 큐 · 매니저 (PATCH /admin-service/room/plan/:room_plan_type_id) — 결과 null
 *
 * @param auth AuthContext 값
 * @param room_plan_type_id 상품 종류
 * @param dto 판매 · 요일 · 연장 + 종류별 칸
 */
export function updateRoomPlan(auth: AuthType, room_plan_type_id: string, dto: RoomPlanUpdateDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${ROOM_PATH}/plan/${encodeURIComponent(room_plan_type_id)}`, body: dto, token}));
}

// ── 객실 그룹 (M5) ──

/**
 * 객실 그룹 목록 — 동기 · 매니저 (GET /admin-service/room/group) — 등록일 최신순, all_search_yn=Y 면 전부
 *
 * @param auth AuthContext 값
 * @param query keyword · page · size · all_search_yn
 * @param signal 화면을 떠날 때 취소
 */
export function getRoomGroups(auth: AuthType, query: RoomGroupListDto, signal?: AbortSignal): Promise<RoomGroupListResultDto | null> {
    return withAuth(auth, (token) => request<RoomGroupListResultDto>({path: ROOM_GROUP_PATH, query: {keyword: query.keyword, page: query.page, size: query.size, all_search_yn: query.all_search_yn}, token, signal}));
}

/**
 * 객실 그룹 등록 — 큐 · 매니저 (POST /admin-service/room/group) — 그룹 상품 3개가 함께 생긴다, 그룹명 겹치면 400
 *
 * @param auth AuthContext 값
 * @param dto 그룹명 · 설명 · 상세정보
 */
export function createRoomGroup(auth: AuthType, dto: RoomGroupDto): Promise<RoomGroupResultDto | null> {
    return withAuth(auth, (token) => callQueue<RoomGroupResultDto>({method: 'POST', path: ROOM_GROUP_PATH, body: dto, token}));
}

/**
 * 객실 그룹 상세 — 동기 · 매니저 (GET /admin-service/room/group/:room_group_id) — 그룹 · 상세정보 · 사진 · 그룹 상품 · 호실
 *
 * @param auth AuthContext 값
 * @param room_group_id 객실 그룹 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getRoomGroup(auth: AuthType, room_group_id: string, signal?: AbortSignal): Promise<RoomGroupDetailResultDto | null> {
    return withAuth(auth, (token) => request<RoomGroupDetailResultDto>({path: groupPath(room_group_id), token, signal}));
}

/**
 * 객실 그룹 수정 — 큐 · 매니저 (PATCH /admin-service/room/group/:room_group_id) — 상세정보는 통째로, 결과 null
 *
 * @param auth AuthContext 값
 * @param room_group_id 객실 그룹 ID
 * @param dto 그룹명 · 설명 · 상세정보
 */
export function updateRoomGroup(auth: AuthType, room_group_id: string, dto: RoomGroupUpdateDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: groupPath(room_group_id), body: dto, token}));
}

/**
 * 객실 그룹 삭제 — 큐 · 매니저 (DELETE /admin-service/room/group/:room_group_id) — 호실 · 사진도 함께, 결과 null
 *
 * @param auth AuthContext 값
 * @param room_group_id 객실 그룹 ID
 */
export function deleteRoomGroup(auth: AuthType, room_group_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'DELETE', path: groupPath(room_group_id), token}));
}

/**
 * 객실 그룹 사진 업로드 주소 — 동기 · 매니저 (POST /admin-service/room/group/:room_group_id/image/upload-url)
 *
 * @param auth AuthContext 값
 * @param room_group_id 객실 그룹 ID
 * @param dto content_type
 */
export function issueRoomGroupImageUrl(auth: AuthType, room_group_id: string, dto: RoomGroupImageUploadUrlDto): Promise<RoomGroupImageUploadUrlResultDto | null> {
    return withAuth(auth, (token) => request<RoomGroupImageUploadUrlResultDto>({method: 'POST', path: `${groupPath(room_group_id)}/image/upload-url`, body: dto, token}));
}

/**
 * 객실 그룹 사진 등록 — 큐 · 매니저 (POST /admin-service/room/group/:room_group_id/image) — 마지막 순서
 *
 * @param auth AuthContext 값
 * @param room_group_id 객실 그룹 ID
 * @param dto file_key · file_name · content_type
 */
export function registerRoomGroupImage(auth: AuthType, room_group_id: string, dto: RoomGroupImageDto): Promise<RoomGroupImageResultDto | null> {
    return withAuth(auth, (token) => callQueue<RoomGroupImageResultDto>({method: 'POST', path: `${groupPath(room_group_id)}/image`, body: dto, token}));
}

/**
 * 객실 그룹 사진 순서 — 큐 · 매니저 (PUT /admin-service/room/group/:room_group_id/image/order) — 사진 ID 전부, 결과 null
 *
 * @param auth AuthContext 값
 * @param room_group_id 객실 그룹 ID
 * @param dto room_group_image_ids
 */
export function reorderRoomGroupImages(auth: AuthType, room_group_id: string, dto: RoomGroupImageOrderDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PUT', path: `${groupPath(room_group_id)}/image/order`, body: dto, token}));
}

/**
 * 객실 그룹 사진 삭제 — 큐 · 매니저 (DELETE /admin-service/room/group/:room_group_id/image/:room_group_image_id) — 결과 null
 *
 * @param auth AuthContext 값
 * @param room_group_id 객실 그룹 ID
 * @param room_group_image_id 사진 ID
 */
export function deleteRoomGroupImage(auth: AuthType, room_group_id: string, room_group_image_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'DELETE', path: `${groupPath(room_group_id)}/image/${encodeURIComponent(room_group_image_id)}`, token}));
}

/**
 * 그룹 상품 수정 — 큐 · 매니저 (PATCH /admin-service/room/group/:room_group_id/plan/:room_plan_type_id) — 판매인데 요금 0 이면 400, 결과 null
 *
 * @param auth AuthContext 값
 * @param room_group_id 객실 그룹 ID
 * @param room_plan_type_id 상품 종류
 * @param dto is_used · price
 */
export function updateRoomGroupPlan(auth: AuthType, room_group_id: string, room_plan_type_id: string, dto: RoomGroupPlanUpdateDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${groupPath(room_group_id)}/plan/${encodeURIComponent(room_plan_type_id)}`, body: dto, token}));
}

/**
 * 상품별 기간 가격 목록 — 동기 · 매니저 (GET /admin-service/room/group/:room_group_id/plan/:room_plan_type_id/price) — 시작 날짜 순
 *
 * @param auth AuthContext 값
 * @param room_group_id 객실 그룹 ID
 * @param room_plan_type_id 상품 종류
 * @param query page · size
 * @param signal 화면을 떠날 때 취소
 */
export function getRoomGroupPlanPrices(auth: AuthType, room_group_id: string, room_plan_type_id: string, query: RoomGroupPlanPriceListDto, signal?: AbortSignal): Promise<RoomGroupPlanPriceListResultDto | null> {
    return withAuth(auth, (token) => request<RoomGroupPlanPriceListResultDto>({path: pricePath(room_group_id, room_plan_type_id), query: {page: query.page, size: query.size}, token, signal}));
}

/**
 * 상품별 기간 가격 등록 — 큐 · 매니저 (POST …/plan/:room_plan_type_id/price) — 같은 상품 안에서 날짜가 겹치면 400
 *
 * @param auth AuthContext 값
 * @param room_group_id 객실 그룹 ID
 * @param room_plan_type_id 상품 종류
 * @param dto start_date · end_date · price · memo
 */
export function createRoomGroupPlanPrice(auth: AuthType, room_group_id: string, room_plan_type_id: string, dto: RoomGroupPlanPriceDto): Promise<RoomGroupPlanPriceResultDto | null> {
    return withAuth(auth, (token) => callQueue<RoomGroupPlanPriceResultDto>({method: 'POST', path: pricePath(room_group_id, room_plan_type_id), body: dto, token}));
}

/**
 * 상품별 기간 가격 수정 — 큐 · 매니저 (PATCH …/price/:room_group_plan_price_id) — 통째로, 결과 null
 *
 * @param auth AuthContext 값
 * @param room_group_id 객실 그룹 ID
 * @param room_plan_type_id 상품 종류
 * @param room_group_plan_price_id 기간 가격 ID
 * @param dto start_date · end_date · price · memo
 */
export function updateRoomGroupPlanPrice(auth: AuthType, room_group_id: string, room_plan_type_id: string, room_group_plan_price_id: string, dto: RoomGroupPlanPriceUpdateDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${pricePath(room_group_id, room_plan_type_id)}/${encodeURIComponent(room_group_plan_price_id)}`, body: dto, token}));
}

/**
 * 상품별 기간 가격 삭제 — 큐 · 매니저 (DELETE …/price/:room_group_plan_price_id) — 결과 null
 *
 * @param auth AuthContext 값
 * @param room_group_id 객실 그룹 ID
 * @param room_plan_type_id 상품 종류
 * @param room_group_plan_price_id 기간 가격 ID
 */
export function deleteRoomGroupPlanPrice(auth: AuthType, room_group_id: string, room_plan_type_id: string, room_group_plan_price_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'DELETE', path: `${pricePath(room_group_id, room_plan_type_id)}/${encodeURIComponent(room_group_plan_price_id)}`, token}));
}

// ── 호실 (M4) ──

/**
 * 호실 목록 — 동기 · 매니저 (GET /admin-service/room) — 층 · 호실명 순, floors 는 거르기와 상관없이 늘 전부
 *
 * @param auth AuthContext 값
 * @param query page · size · floor · room_group_id(null 이면 전체)
 * @param signal 화면을 떠날 때 취소
 */
export function getRooms(auth: AuthType, query: RoomListDto, signal?: AbortSignal): Promise<RoomListResultDto | null> {
    return withAuth(auth, (token) => request<RoomListResultDto>({path: ROOM_PATH, query: {page: query.page, size: query.size, floor: query.floor, room_group_id: query.room_group_id}, token, signal}));
}

/**
 * 호실 등록 — 큐 · 매니저 (POST /admin-service/room) — 예약가능으로 시작, 호실명 겹치면 400
 *
 * @param auth AuthContext 값
 * @param dto room_group_id · room_name · floor
 */
export function createRoom(auth: AuthType, dto: RoomDto): Promise<RoomResultDto | null> {
    return withAuth(auth, (token) => callQueue<RoomResultDto>({method: 'POST', path: ROOM_PATH, body: dto, token}));
}

/**
 * 호실 수정 — 큐 · 매니저 (PATCH /admin-service/room/:room_id) — 호실명 · 층, 그룹은 바꾸지 않는다, 결과 null
 *
 * @param auth AuthContext 값
 * @param room_id 호실 ID
 * @param dto room_name · floor
 */
export function updateRoom(auth: AuthType, room_id: string, dto: RoomUpdateDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: roomPath(room_id), body: dto, token}));
}

/**
 * 호실 삭제 — 큐 · 매니저 (DELETE /admin-service/room/:room_id) — 앞으로의 예약이 있으면 400, 결과 null
 *
 * @param auth AuthContext 값
 * @param room_id 호실 ID
 */
export function deleteRoom(auth: AuthType, room_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'DELETE', path: roomPath(room_id), token}));
}

/**
 * 호실 문 바로 열기 — 동기 · 매니저 (POST /admin-service/room/:room_id/door-open) — 마지막으로 연 시각을 돌려준다, 문 쪽이 연결돼 있지 않으면 503
 *
 * @param auth AuthContext 값
 * @param room_id 호실 ID
 */
export function openRoomDoor(auth: AuthType, room_id: string): Promise<RoomDoorOpenResultDto | null> {
    return withAuth(auth, (token) => request<RoomDoorOpenResultDto>({method: 'POST', path: `${roomPath(room_id)}/door-open`, token}));
}

/**
 * 호실 상태 변경 — 큐 · 매니저 (PATCH /admin-service/room/:room_id/state) — 정비 완료 · 사용중지 · 사용 재개만(그 밖은 400), 결과 null
 *
 * @param auth AuthContext 값
 * @param room_id 호실 ID
 * @param dto room_state_id(AVAILABLE · DISABLED)
 */
export function updateRoomState(auth: AuthType, room_id: string, dto: RoomStateDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${roomPath(room_id)}/state`, body: dto, token}));
}
