import {IsNotEmpty, Matches} from 'class-validator';
import {PaginationDto, PaginationResultDto} from '../../common/pagination.dto';

/**
 * 이용자 예약 이력 path param
 */
export class UserReservationListParamDto {
    /** 이용자 회원 ID */
    @Matches(/^[a-f0-9]{32}$/, {message: '회원 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '회원 ID를 입력해주세요.'})
    user_id: string;
}

/**
 * 이용자 예약 이력 query — 페이지만
 */
export class UserReservationListDto extends PaginationDto {
    /**
     * @param data 요청 쿼리 — 빠진 페이지 값은 PaginationDto 기본값
     */
    constructor(data?: Partial<UserReservationListDto>) {
        super(data);
    }
}

/**
 * 이용자 예약 이력 항목
 */
export class UserReservationListItemResultDto {
    /** 예약 ID */
    reservation_id: string;

    /** 업체 ID */
    store_id: string;

    /** 상호명 */
    store_name: string;

    /** 호실명 */
    room_name: string;

    /** 객실 그룹명 */
    room_group_name: string;

    /** 상품 종류 (HOURLY · NIGHT · LONG) */
    room_plan_type_id: string;

    /** 상품 종류 이름 (시간 이용 · 1박 · 연박) */
    room_plan_type_name: string;

    /** 예약 상태 (PENDING · CONFIRMED · CHECKED_IN · COMPLETED · CANCELED) */
    reservation_state_id: string;

    /** 예약 상태 이름 */
    reservation_state_name: string;

    /** 이용 시작 (ISO 8601) */
    start_at: string;

    /** 이용 끝 (ISO 8601) */
    end_at: string;

    /** 합계 금액(원) */
    total_price: number;

    /** 취소 시각 (ISO 8601, 취소 아니면 null) */
    canceled_at: string | null;

    /** 취소 주체 (USER · STORE, 취소 아니면 null) */
    cancel_actor: string | null;

    /** 예약일시 (ISO 8601) */
    created_at: string;
}

/**
 * 이용자 예약 이력
 */
export class UserReservationListResultDto {
    /** 목록 (이용 시작 최신순, 결제 대기 만료 제외) */
    list: UserReservationListItemResultDto[];

    /** 페이지 정보 */
    pagination: PaginationResultDto;
}
