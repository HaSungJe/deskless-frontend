import { RESERVATION_CANCEL_REQUEST_STATE, RESERVATION_STATE } from '@/contracts/common/reservation.constants';
import { ReservationCancelRequestResultDto } from '@/contracts/reservation/dto/reservation-cancel-request.dto';
import { ReservationDetailResultDto, ReservationSegmentResultDto } from '@/contracts/reservation/dto/reservation-detail.dto';
import { formatDateTime, formatDateTimeRange, formatPrice } from '@/shared/utils/format';

/** U7 버튼 · QR — qr: none 없음 · locked 이용 전(잠김) · open 이용 중 */
export type ReservationActionsType = {
    cancel: boolean;                     // 취소
    pay: boolean;                        // 결제하기(마감 전 결제 대기 구간)
    qr: 'none' | 'locked' | 'open';      // QR
    startsSoon: boolean;                 // 이용 시작이 1시간 안(남은 시간을 보여 줌)
    extend: boolean;                     // 연장하기
};

/** 환불 안내 한 줄 */
export type RefundRowType = {
    label: string;    // 언제 취소하면
    value: string;    // 얼마 환불
    current: boolean; // 지금 해당하는 줄
    danger: boolean;  // 취소할 수 없음
};

/** 환불 안내 — 줄 또는 문구 + 아래 설명 */
export type RefundGuideType = {
    rows: Array<RefundRowType>; // 마감 전 · 마감 뒤 · 시작 뒤
    message: string;            // 줄 대신 문구(이용 중 · 사용중지)
    note: string;               // 아래 설명
};

type ActionsDetailType = Pick<ReservationDetailResultDto, 'reservation_state_id' | 'start_at' | 'is_room_disabled'> & {segments: Array<Pick<ReservationSegmentResultDto, 'reservation_state_id' | 'expires_at'>>};

type RefundDetailType = Pick<ReservationDetailResultDto, 'reservation_state_id' | 'start_at' | 'refund_deadline_at' | 'late_refund_percent' | 'total_price' | 'is_room_disabled'>;

/** 없는 · 남의 · 만료된 결제 대기 예약(U7 · U9) */
export const RESERVATION_NOT_FOUND_MESSAGE = '예약을 찾을 수 없습니다.';

/** 결제 대기 마감이 지남 — 만료된 결제 대기는 상세가 404 라 다시 부르지 않고 이 안내 뒤 목록으로 */
export const PENDING_EXPIRED_MESSAGE = '결제 시간이 지나 예약이 만료됐어요.';

/** U7 을 다시 맞출 시각(ms) — refreshAt: 기준 시각만 새로(버튼 · 환불 안내 · 남은 시간), reloadAt: 상세를 다시 */
export type ScreenScheduleType = {
    refreshAt: Array<number>; // 환불 마감 · 시작 1시간 전
    reloadAt: Array<number>;  // 시작 · 끝 · 시작 뒤 다시
};

/** 이 시간 안에 시작하면 남은 시간을 보여 준다(Timer 는 분:초) */
const STARTS_SOON_MS = 60 * 60 * 1000;

/** 시작이 지났는데 아직 확정이면(백엔드 반영이 늦음) 다시 부르는 간격 · 그만두는 때 */
const START_RETRY_MS = 10 * 1000;
const START_RETRY_LIMIT_MS = 5 * 60 * 1000;

/** setTimeout 이 받는 가장 긴 지연(약 24.8일) — 더 길면 바로 불려 버린다 */
const MAX_TIMER_MS = 2 ** 31 - 1;

/** 전액(%) */
const FULL_PERCENT = 100;

/** 끝난 예약 — 아무것도 */
const NO_ACTIONS: ReservationActionsType = {cancel: false, pay: false, qr: 'none', startsSoon: false, extend: false};

const PENDING_NOTE = '결제 전에 취소하면 환불할 금액 없이 취소돼요.';
const CONFIRMED_NOTE = '예약한 호실이 사용중지되면 이용 중이어도 끝나기 전까지 전액 환불로 취소할 수 있어요.';
const CHECKED_IN_MESSAGE = '이용이 시작되어 취소할 수 없어요.';
const CHECKED_IN_NOTE = '예약한 호실이 사용중지되면 끝나기 전까지 전액 환불로 취소할 수 있어요.';
const ROOM_DISABLED_MESSAGE = '예약한 호실이 사용중지되어 끝나기 전까지 전액 환불로 취소할 수 있어요.';

/**
 * 마감 전 결제 대기 구간 — 결제하기에 쓴다(없으면 null)
 *
 * @param detail 예약 상세
 * @param nowIso 지금
 */
export function pendingSegment<T extends Pick<ReservationSegmentResultDto, 'reservation_state_id' | 'expires_at'>>(detail: {segments: Array<T>}, nowIso: string): T | null {
    const now = Date.parse(nowIso);
    return detail.segments.find((segment) => segment.reservation_state_id === RESERVATION_STATE.PENDING && segment.expires_at !== null && Date.parse(segment.expires_at) > now) ?? null;
}

/**
 * U7 버튼 · QR — 결제 대기 취소 · 결제, 확정은 시작 전 취소 · QR 잠김, 이용 중은 QR · 연장, 사용중지 호실은 끝 전 취소, 끝난 예약은 없음
 *
 * @param detail 예약 상세
 * @param nowIso 지금
 */
export function reservationActions(detail: ActionsDetailType, nowIso: string): ReservationActionsType {
    const untilStart = Date.parse(detail.start_at) - Date.parse(nowIso);
    const disabledRoom = detail.is_room_disabled === 1;
    const pay = pendingSegment(detail, nowIso) !== null;

    switch (detail.reservation_state_id) {
        case RESERVATION_STATE.PENDING:
            return {cancel: true, pay, qr: 'none', startsSoon: false, extend: false};
        case RESERVATION_STATE.CONFIRMED:
            return {cancel: untilStart > 0 || disabledRoom, pay, qr: 'locked', startsSoon: untilStart <= STARTS_SOON_MS, extend: false};
        case RESERVATION_STATE.CHECKED_IN:
            return {cancel: disabledRoom, pay, qr: 'open', startsSoon: false, extend: true};
        default:
            return NO_ACTIONS;
    }
}

/**
 * U7 환불 안내 — 결제 대기 · 확정은 마감 전 전액 / 마감 ~ 시작 비율 / 시작 뒤 불가(지금 줄 강조, 확정이면 금액), 이용 중 · 사용중지는 문구, 끝난 예약은 null
 *
 * @param detail 예약 상세
 * @param nowIso 지금
 */
export function refundGuide(detail: RefundDetailType, nowIso: string): RefundGuideType | null {
    const state = detail.reservation_state_id;
    if (state !== RESERVATION_STATE.PENDING && state !== RESERVATION_STATE.CONFIRMED && state !== RESERVATION_STATE.CHECKED_IN) {
        return null;
    }

    if (detail.is_room_disabled === 1 && state !== RESERVATION_STATE.PENDING) {
        return {rows: [], message: ROOM_DISABLED_MESSAGE, note: ''};
    }

    if (state === RESERVATION_STATE.CHECKED_IN) {
        return {rows: [], message: CHECKED_IN_MESSAGE, note: CHECKED_IN_NOTE};
    }

    const now = Date.parse(nowIso);
    const start = Date.parse(detail.start_at);
    const deadline = Date.parse(detail.refund_deadline_at);
    const late = detail.late_refund_percent;
    const amount = (percent: number, current: boolean): string => (state === RESERVATION_STATE.CONFIRMED && current ? ` · ${formatPrice(Math.floor((detail.total_price * percent) / FULL_PERCENT))}` : '');
    const rows: Array<RefundRowType> = [];

    if (late >= FULL_PERCENT || deadline >= start) {
        rows.push({label: `${formatDateTime(detail.start_at)} 이용 시작 전 취소`, value: `전액 환불${amount(FULL_PERCENT, now < start)}`, current: now < start, danger: false});
    } else {
        const beforeDeadline = now < deadline;
        const afterDeadline = deadline <= now && now < start;
        rows.push({label: `${formatDateTime(detail.refund_deadline_at)} 전 취소`, value: `전액 환불${amount(FULL_PERCENT, beforeDeadline)}`, current: beforeDeadline, danger: false});
        rows.push({label: `${formatDateTimeRange(detail.refund_deadline_at, detail.start_at)} 취소`, value: late <= 0 ? '환불 없음' : `${late}% 환불${amount(late, afterDeadline)}`, current: afterDeadline, danger: false});
    }

    rows.push({label: `${formatDateTime(detail.start_at)} 이용 시작 뒤`, value: '취소할 수 없음', current: now >= start, danger: true});
    return {rows, message: '', note: state === RESERVATION_STATE.PENDING ? PENDING_NOTE : CONFIRMED_NOTE};
}

/**
 * U7 을 다시 맞출 시각 — 결제 대기 · 확정은 환불 마감 · 시작 1시간 전에 기준 시각만 새로, 확정은 시작에 · 확정 · 이용 중은 끝에 상세를 다시.
 * 시작이 지났는데 아직 확정이면 10초 뒤 다시(5분까지). 지난 시각 · 너무 먼 시각은 뺀다
 *
 * @param detail 예약 상세
 * @param nowMs 지금(ms)
 */
export function screenSchedule(detail: Pick<ReservationDetailResultDto, 'reservation_state_id' | 'start_at' | 'end_at' | 'refund_deadline_at'>, nowMs: number): ScreenScheduleType {
    const state = detail.reservation_state_id;
    const start = Date.parse(detail.start_at);
    const end = Date.parse(detail.end_at);
    const upcoming = (at: number): boolean => at > nowMs && at - nowMs <= MAX_TIMER_MS;
    const refreshAt: Array<number> = [];
    const reloadAt: Array<number> = [];

    if (state === RESERVATION_STATE.PENDING || state === RESERVATION_STATE.CONFIRMED) {
        refreshAt.push(Date.parse(detail.refund_deadline_at), start - STARTS_SOON_MS);
    }

    if (state === RESERVATION_STATE.CONFIRMED) {
        reloadAt.push(start);
        if (nowMs >= start && nowMs - start < START_RETRY_LIMIT_MS) {
            reloadAt.push(nowMs + START_RETRY_MS);
        }
    }

    if (state === RESERVATION_STATE.CONFIRMED || state === RESERVATION_STATE.CHECKED_IN) {
        reloadAt.push(end);
    }

    return {refreshAt: refreshAt.filter(upcoming), reloadAt: reloadAt.filter(upcoming)};
}

/**
 * 취소 결과 안내 — null(결제 대기 취소)은 금액 없이, 0 은 환불 없음, 그 밖은 금액
 *
 * @param refundAmount 환불 금액
 */
export function cancelResultMessage(refundAmount: number | null): string {
    if (refundAmount === null) {
        return '예약을 취소했어요.';
    }

    return refundAmount === 0 ? '예약을 취소했어요. 환불할 금액은 없어요.' : `예약을 취소했어요. ${formatPrice(refundAmount)}을 환불해 드려요.`;
}

/**
 * 이용 중 취소 요청에 답할 수 있는지 — 요청 중이고 만료 시각 전
 *
 * @param request 취소 요청
 * @param nowIso 지금
 */
export function canAnswerCancelRequest(request: Pick<ReservationCancelRequestResultDto, 'reservation_cancel_request_state_id' | 'expires_at'>, nowIso: string): boolean {
    return request.reservation_cancel_request_state_id === RESERVATION_CANCEL_REQUEST_STATE.REQUESTED && Date.parse(nowIso) < Date.parse(request.expires_at);
}

/**
 * 연장 길이 — 24시간 배수는 '1일 더', 그 밖은 '3시간 더' · '1시간 30분 더' · '30분 더'
 *
 * @param startIso 연장 시작
 * @param endIso 연장 뒤 끝
 */
export function extensionLengthLabel(startIso: string | null, endIso: string | null): string {
    const minutes = Math.round((Date.parse(endIso ?? '') - Date.parse(startIso ?? '')) / 60000);
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return '';
    }

    if (minutes % (24 * 60) === 0) {
        return `${minutes / (24 * 60)}일 더`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `${[hours > 0 ? `${hours}시간` : '', rest > 0 ? `${rest}분` : ''].filter(Boolean).join(' ')} 더`;
}
