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
    room_group_name: string; // 그룹명
    description: string;     // 설명
    room_count: string;      // 방 개수 칸 글자
    has_shower: boolean;     // 샤워실
    has_tv: boolean;         // TV
    has_pc: boolean;         // PC
};

/** 등록 대화상자 빈 칸 — 백엔드 기본값(방 1 · 편의시설 모두 있음)과 같게 */
export const EMPTY_ROOM_GROUP_FORM: RoomGroupFormType = {room_group_name: '', description: '', room_count: '1', has_shower: true, has_tv: true, has_pc: true};

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
    return {room_group_name: group.room_group_name, description: group.description ?? '', room_count: String(detail.room_count), has_shower: detail.has_shower === 1, has_tv: detail.has_tv === 1, has_pc: detail.has_pc === 1};
}

/**
 * 편의시설 값 — 4개 모두(0 · 1)
 *
 * @param form 그룹 칸
 */
function detailValuesOf(form: RoomGroupFormType): {room_count: number | undefined; has_shower: number; has_tv: number; has_pc: number} {
    return {room_count: numberOf(form.room_count), has_shower: form.has_shower ? 1 : 0, has_tv: form.has_tv ? 1 : 0, has_pc: form.has_pc ? 1 : 0};
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
 * 그룹 수정 보낼 값 — 편의시설 통째로, 설명은 빈 글자로도 보낸다(빠뜨리면 지우지 못한다)
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
