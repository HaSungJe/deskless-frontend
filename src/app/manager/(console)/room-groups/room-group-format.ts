import { ROOM_GROUP_OPTIONS, RoomGroupOptionKeyType } from '@/contracts/common/room.constants';
import { RoomGroupDetailResultDto } from '@/contracts/room/dto/room-group-detail.dto';
import { RoomGroupUpdateDetailDto, RoomGroupUpdateDto } from '@/contracts/room/dto/room-group-update.dto';
import { RoomGroupDetailInputDto, RoomGroupDto } from '@/contracts/room/dto/room-group.dto';
import { numberOf } from '@/shared/utils/util';
import { validateAction, validateActionChildren } from '@/shared/utils/validation';

/** 객실 그룹 목록 주소 */
export const ROOM_GROUP_LIST_PATH = '/manager/room-groups/';

/** 방 개수 칸 오류 키 — 안쪽 DTO(room_group_detail) */
export const ROOM_GROUP_DETAIL_KEY = 'room_group_detail';

/** 그룹 사진 최대 장수 — RoomGroupImageOrderDto */
export const ROOM_GROUP_IMAGE_MAX = 5;

/** 그룹 칸 */
export type RoomGroupFormType = {
    room_group_name: string;                          // 그룹명
    description: string;                              // 설명
    room_count: string;                               // 방 개수 칸 글자
    options: Record<RoomGroupOptionKeyType, boolean>; // 객실 옵션(샤워실 · TV · PC …) — 켬 · 끔
};

/**
 * 객실 옵션 항목마다 값을 정한다(ROOM_GROUP_OPTIONS 순서) — 빈 칸 · 받은 상세 → 칸 · 칸 → 보낼 값이 함께 쓴다
 *
 * @param valueOf 항목 키 → 값
 */
function optionsOf<T>(valueOf: (key: RoomGroupOptionKeyType) => T): Record<RoomGroupOptionKeyType, T> {
    return Object.fromEntries(ROOM_GROUP_OPTIONS.map((option) => [option.key, valueOf(option.key)])) as Record<RoomGroupOptionKeyType, T>;
}

/** 등록 대화상자 빈 칸 — 백엔드 기본값(방 1 · 객실 옵션 모두 켬)과 같게 */
export const EMPTY_ROOM_GROUP_FORM: RoomGroupFormType = {room_group_name: '', description: '', room_count: '1', options: optionsOf(() => true)};

/**
 * 그룹 상세 주소
 *
 * @param roomGroupId 그룹 ID
 */
export function roomGroupPath(roomGroupId: string): string {
    return `${ROOM_GROUP_LIST_PATH}${encodeURIComponent(roomGroupId)}/`;
}

/**
 * 받은 그룹 상세 → 그룹 칸
 *
 * @param group 그룹 상세
 */
export function roomGroupFormOf(group: RoomGroupDetailResultDto): RoomGroupFormType {
    const detail = group.room_group_detail;
    return {room_group_name: group.room_group_name, description: group.description ?? '', room_count: String(detail.room_count), options: optionsOf((key) => detail[key] === 1)};
}

/**
 * 상세정보 보낼 값 — 방 개수 + 객실 옵션 모두(0 · 1)
 *
 * @param form 그룹 칸
 */
function detailValuesOf(form: RoomGroupFormType): {room_count: number | undefined} & Record<RoomGroupOptionKeyType, number> {
    return {room_count: numberOf(form.room_count), ...optionsOf((key) => (form.options[key] ? 1 : 0))};
}

/**
 * 그룹 등록 보낼 값 — 설명은 빈 글자로도 보낸다(백엔드 "비우면 null")
 *
 * @param form 그룹 칸
 */
export function toRoomGroupDto(form: RoomGroupFormType): RoomGroupDto {
    return Object.assign(new RoomGroupDto(), {room_group_name: form.room_group_name.trim(), description: form.description.trim(), room_group_detail: Object.assign(new RoomGroupDetailInputDto(), detailValuesOf(form))});
}

/**
 * 그룹 수정 보낼 값 — 상세정보(방 개수 · 객실 옵션) 통째로, 설명은 빈 글자로도 보낸다(빠뜨리면 지우지 못한다)
 *
 * @param form 그룹 칸
 */
export function toRoomGroupUpdateDto(form: RoomGroupFormType): RoomGroupUpdateDto {
    return Object.assign(new RoomGroupUpdateDto(), {room_group_name: form.room_group_name.trim(), description: form.description.trim(), room_group_detail: Object.assign(new RoomGroupUpdateDetailDto(), detailValuesOf(form))});
}

/**
 * 그룹 검사 — 그룹명 · 설명은 validateAction(칸 오류를 먼저 지움), 방 개수는 안쪽 DTO 라 키로 따로(validateAction 은 안쪽 오류를 칸에 붙이지 못한다)
 *
 * @param dto 등록 · 수정 DTO
 */
export async function validateRoomGroup(dto: RoomGroupDto | RoomGroupUpdateDto): Promise<boolean> {
    const groupOk = await validateAction(dto);
    const detailOk = dto.room_group_detail ? await validateActionChildren(dto.room_group_detail, ROOM_GROUP_DETAIL_KEY) : true;
    return groupOk && detailOk;
}

/**
 * 머리 호실 글자 — "호실 3개(203호 · 301호 · 302호)", 없으면 "호실 0개"
 *
 * @param group 그룹 상세
 */
export function roomsText(group: RoomGroupDetailResultDto): string {
    const names = group.rooms.map((room) => room.room_name).join(' · ');
    return names ? `호실 ${group.room_count}개(${names})` : `호실 ${group.room_count}개`;
}
