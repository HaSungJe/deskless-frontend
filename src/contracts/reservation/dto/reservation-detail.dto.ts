import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 내 예약 상세 path param
 */
export class ReservationDetailParamDto {
    /** 예약 ID */
    @Matches(/^[a-f0-9]{32}$/, {message: '예약 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '예약 ID를 입력해주세요.'})
    reservation_id: string;
}

/**
 * 구간의 결제
 */
export class ReservationPaymentResultDto {
    /** 결제 ID (토스 orderId) */
    payment_id: string;

    /** 결제 상태 (READY · DONE · FAILED · EXPIRED · REFUND_REQUESTED · REFUNDED · REFUND_FAILED) */
    payment_state_id: string;

    /** 결제 상태명 */
    payment_state_name: string;

    /** 결제 금액(원) */
    amount: number;

    /** 결제 수단 — 승인 전이면 null */
    method: string | null;

    /** 승인 일시 (ISO 8601) — 승인 전이면 null */
    approved_at: string | null;

    /** 영수증 주소 — 없으면 null */
    receipt_url: string | null;

    /** 환불 금액(원) — 환불이 없으면 null */
    refund_amount: number | null;

    /** 환불 완료 일시 (ISO 8601) — 없으면 null */
    refunded_at: string | null;
}

/**
 * 예약 구간 1개 — 기본 1 + 연장 n
 */
export class ReservationSegmentResultDto {
    /** 구간 ID */
    reservation_detail_id: string;

    /** 구간 종류 (BASE: 기본, EXTENSION: 연장) */
    reservation_detail_type_id: string;

    /** 구간 종류명 */
    reservation_detail_type_name: string;

    /** 구간 상태 (PENDING · CONFIRMED · CANCELED · EXPIRED) */
    reservation_state_id: string;

    /** 구간 시작 (ISO 8601) */
    start_at: string;

    /** 구간 끝 (ISO 8601) */
    end_at: string;

    /** 구간 금액(원) */
    price: number;

    /** 결제 대기 만료 일시 (ISO 8601) — 없으면 null */
    expires_at: string | null;

    /** 결제 */
    payment: ReservationPaymentResultDto;
}

/**
 * 내 예약 상세 — 결제 대기 만료 건은 404
 */
export class ReservationDetailResultDto {
    /** 예약 ID */
    reservation_id: string;

    /** 업체 ID */
    store_id: string;

    /** 상호명 */
    store_name: string;

    /** 호실 ID */
    room_id: string;

    /** 호실명 */
    room_name: string;

    /** 객실 그룹명 */
    room_group_name: string;

    /** 상품 종류 (HOURLY · NIGHT · LONG) */
    room_plan_type_id: string;

    /** 상품 종류명 */
    room_plan_type_name: string;

    /** 예약 상태 */
    reservation_state_id: string;

    /** 예약 상태명 */
    reservation_state_name: string;

    /** 이용 시작 일시 (ISO 8601 — 이 시각에 이용 중) */
    start_at: string;

    /** 이용 끝 일시 (ISO 8601 — 이 시각에 이용 완료) */
    end_at: string;

    /** 합계 금액(원) */
    total_price: number;

    /** 100% 환불 마감 일시 (ISO 8601) */
    refund_deadline_at: string;

    /** 예약한 호실이 사용중지인지 (0 · 1) — 1 이면 확정 · 이용 중 예약을 끝 전까지 전액 환불로 취소할 수 있다 */
    is_room_disabled: number;

    /** 마감 뒤 환불 비율(%) */
    late_refund_percent: number;

    /** 취소 일시 (ISO 8601) — 취소가 아니면 null */
    canceled_at: string | null;

    /** 취소 주체 (USER: 이용자, STORE: 업체) — 취소가 아니면 null */
    cancel_actor: string | null;

    /** 취소 사유 — 취소가 아니면 null */
    cancel_reason: string | null;

    /** 등록일시 (ISO 8601) */
    created_at: string;

    /** 구간 (시작 순) */
    segments: ReservationSegmentResultDto[];
}
