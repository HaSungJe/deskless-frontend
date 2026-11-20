import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 객실 그룹 상세 path param — 내 업체의 지워지지 않은 그룹만(아니면 404)
 */
export class RoomGroupDetailParamDto {
    /** 객실 그룹 ID */
    @Matches(/^[a-f0-9]{32}$/, {message: '객실 그룹 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '객실 그룹 ID를 입력해주세요.'})
    room_group_id: string;
}

/**
 * 객실 그룹 상세정보 (t_room_group.room_group_detail) — 저장되지 않은 항목도 기본값으로 채워 모두 있다
 */
export class RoomGroupDetailValueResultDto {
    /** 객실 안의 방 개수 (원룸 1 · 투룸 2) */
    room_count: number;

    /** 샤워실 유무 (0: 없음, 1: 있음) */
    has_shower: number;

    /** TV 유무 (0: 없음, 1: 있음) */
    has_tv: number;

    /** PC 유무 (0: 없음, 1: 있음) */
    has_pc: number;
}

/**
 * 객실 그룹 사진
 */
export class RoomGroupDetailImageResultDto {
    /** 객실 그룹 사진 ID */
    room_group_image_id: string;

    /** 원본 파일명 */
    file_name: string;

    /** MIME 타입 */
    content_type: string;

    /** 정렬 순서 (가장 앞이 대표) */
    sort_order: number;

    /** 열람 주소 (CDN 공개 주소) */
    image_url: string;
}

/**
 * 그룹 상품 — 그룹 × 상품 종류의 사용 여부 · 기본 요금
 */
export class RoomGroupDetailPlanResultDto {
    /** 상품 종류 ID (HOURLY: 시간 이용, NIGHT: 1박, LONG: 연박) */
    room_plan_type_id: string;

    /** 상품 종류명 */
    room_plan_type_name: string;

    /** 사용 여부 (0: 이 그룹은 팔지 않음, 1: 판매 — 업체 상품 설정도 사용 중이어야 판다) */
    is_used: number;

    /** 기본 요금(원) — 시간 이용 1회 · 1박 · 연박 1박당 */
    price: number;

    /** 이 상품의 기간 가격 수 (지워지지 않은 것 — 지난 기간 포함) (frontend/changes/2026-11-20-room-group-detail-floors.md) */
    price_count: number;
}

/**
 * 객실 그룹 상세의 호실 — 지워지지 않은 호실 (frontend/changes/2026-11-20-room-group-detail-floors.md)
 */
export class RoomGroupDetailRoomResultDto {
    /** 호실 ID */
    room_id: string;

    /** 호실명 (예: 101호) */
    room_name: string;

    /** 층 (지하는 음수, B1 = -1) */
    floor: number;
}

/**
 * 객실 그룹 상세 — 그룹 정보 · 상세정보 · 사진 · 그룹 상품 3개
 */
export class RoomGroupDetailResultDto {
    /** 객실 그룹 ID */
    room_group_id: string;

    /** 그룹명 */
    room_group_name: string;

    /** 설명 */
    description: string | null;

    /** 상세정보 (항목 모두) */
    room_group_detail: RoomGroupDetailValueResultDto;

    /** 사진 (정렬 순서) */
    images: RoomGroupDetailImageResultDto[];

    /** 그룹 상품 (HOURLY · NIGHT · LONG 순) */
    plans: RoomGroupDetailPlanResultDto[];

    /** 호실 수 (지워지지 않은 호실) — 그룹 목록의 room_count 와 같은 값 */
    room_count: number;

    /** 이 그룹의 호실 (지워지지 않은 호실, 층 · 호실명 순) */
    rooms: RoomGroupDetailRoomResultDto[];

    /** 등록일시 (ISO 8601) */
    created_at: string;

    /** 수정일시 (ISO 8601) */
    updated_at: string;
}
