import { RoomGroupDetailResultDto } from '@/contracts/room/dto/room-group-detail.dto';
import { RoomGroupListResultDto } from '@/contracts/room/dto/room-group-list.dto';
import { RoomGroupPlanPriceListResultDto } from '@/contracts/room/dto/room-group-plan-price-list.dto';
import { RoomListResultDto } from '@/contracts/room/dto/room-list.dto';
import { RoomPlanListResultDto } from '@/contracts/room/dto/room-plan-list.dto';
import { PaginationResultDto } from '@/contracts/common/pagination.dto';

/** 객실 그룹 ID · 호실 ID */
export const ROOM_GROUP_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
export const ROOM_ID = 'f0e1d2c3b4a5968778695a4b3c2d1e0f';

/** 한 쪽짜리 페이지 정보 */
const ONE_PAGE: PaginationResultDto = {all_search_yn: 'N', total_count: 1, page: 1, max_page: 1, page_range: {start: 1, end: 1}, content_start_number: 1, content_start_number_reverse: 1};

/**
 * 업체 상품 설정 3개 — 시간 이용(매일 · 3시간) · 1박(매일 · 15:00 ~ 11:00) · 연박(일 ~ 목 · 2 ~ 30박)
 */
export function roomPlans(): RoomPlanListResultDto {
    return {
        list: [
            {room_plan_type_id: 'HOURLY', room_plan_type_name: '시간 이용', is_used: 1, days_of_week: 127, usage_hours: 3, check_in_time: null, check_out_time: null, min_nights: null, max_nights: null, is_extendable: 1, max_extensions: 2},
            {room_plan_type_id: 'NIGHT', room_plan_type_name: '1박', is_used: 1, days_of_week: 127, usage_hours: null, check_in_time: '15:00', check_out_time: '11:00', min_nights: null, max_nights: null, is_extendable: 1, max_extensions: 1},
            {room_plan_type_id: 'LONG', room_plan_type_name: '연박', is_used: 0, days_of_week: 31, usage_hours: null, check_in_time: '15:00', check_out_time: '11:00', min_nights: 2, max_nights: 30, is_extendable: 0, max_extensions: 3},
        ],
    } as RoomPlanListResultDto;
}

/**
 * 객실 그룹 목록 한 쪽 — 그룹 1개
 */
export function roomGroupList(): RoomGroupListResultDto {
    return {
        list: [{room_group_id: ROOM_GROUP_ID, room_group_name: '디럭스 트윈', room_count: 2, image_url: null, created_at: '2026-03-02T03:00:00.000Z'}],
        pagination: ONE_PAGE,
    } as RoomGroupListResultDto;
}

/**
 * 객실 그룹 상세 — 디럭스 트윈(방 1 · 샤워실 · TV, PC 없음) · 사진 1장 · 그룹 상품 3개(1박 판매 안 함 · 0원) · 호실 2개
 *
 * @param extra 바꿀 값
 */
export function roomGroupDetail(extra: Partial<RoomGroupDetailResultDto> = {}): RoomGroupDetailResultDto {
    return {
        room_group_id: ROOM_GROUP_ID,
        room_group_name: '디럭스 트윈',
        description: '싱글 침대 2개와 욕조가 있는 트윈 객실입니다.',
        room_group_detail: {room_count: 1, has_shower: 1, has_tv: 1, has_pc: 0},
        images: [{room_group_image_id: 'i'.repeat(32), file_name: '객실.jpg', content_type: 'image/jpeg', sort_order: 1, image_url: 'https://cdn.example.com/room.jpg'}],
        plans: [
            {room_plan_type_id: 'HOURLY', room_plan_type_name: '시간 이용', is_used: 1, price: 18000, price_count: 2},
            {room_plan_type_id: 'NIGHT', room_plan_type_name: '1박', is_used: 0, price: 0, price_count: 3},
            {room_plan_type_id: 'LONG', room_plan_type_name: '연박', is_used: 0, price: 0, price_count: 0},
        ],
        room_count: 2,
        rooms: [{room_id: ROOM_ID, room_name: '301호', floor: 3}, {room_id: 'r'.repeat(32), room_name: '302호', floor: 3}],
        created_at: '2026-03-02T03:00:00.000Z',
        updated_at: '2026-11-08T07:20:00.000Z',
        ...extra,
    } as RoomGroupDetailResultDto;
}

/**
 * 기간 가격 목록 한 쪽 — 1개
 */
export function planPrices(): RoomGroupPlanPriceListResultDto {
    return {
        list: [{room_group_plan_price_id: 'p'.repeat(32), start_date: '2026-12-24', end_date: '2026-12-25', price: 89000, memo: '성탄 연휴'}],
        pagination: ONE_PAGE,
    } as RoomGroupPlanPriceListResultDto;
}

/**
 * 호실 목록 한 쪽 — 301호(예약가능 · 연 적 없음), 층 선택지 B1 · 3
 */
export function roomList(): RoomListResultDto {
    return {
        list: [{room_id: ROOM_ID, room_group_id: ROOM_GROUP_ID, room_group_name: '디럭스 트윈', room_name: '301호', floor: 3, room_state_id: 'AVAILABLE', room_state_name: '예약가능', created_at: '2026-03-02T03:00:00.000Z', door_opened_at: null}],
        pagination: ONE_PAGE,
        floors: [-1, 3],
    } as RoomListResultDto;
}
