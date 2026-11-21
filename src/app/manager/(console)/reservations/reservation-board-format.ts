import { RESERVATION_CANCEL_REQUEST_STATE, RESERVATION_STATE } from '@/contracts/common/reservation.constants';
import { ROOM_STATE } from '@/contracts/common/room.constants';
import { ReservationStoreItemResultDto, ReservationStoreResultDto, ReservationStoreRoomResultDto } from '@/contracts/reservation/dto/reservation-store.dto';
import { ReservationUseCancelRequestResultDto } from '@/contracts/reservation/dto/reservation-use-cancel-request.dto';
import { formatTimeRange, toKst } from '@/shared/utils/format';

/** 하루(ms) — 한국은 서머타임이 없어 하루는 늘 24시간 */
const DAY_MS = 86_400_000;

/** 눈금 시각 — 0 ~ 24시 두 시간마다 */
export const TICK_HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] as const;

/** 취소 사유 최대 글자 수 — ReservationStoreCancelDto · ReservationUseCancelRequestDto */
export const CANCEL_REASON_MAX = 255;

/** 열린 대화상자 */
export type BoardActionType = 'menu' | 'store-cancel' | 'room-change' | 'use-cancel';

/** 받은 현황 — 어느 날짜의 것인지 함께 둔다(고른 날짜와 같을 때만 그린다) */
export type BoardLoadType = {
    date: string;                             // 읽은 날짜(한국)
    result: ReservationStoreResultDto | null; // 현황 — 못 읽으면 null
    loadedAt: number;                         // 받은 시각(ms) — 지금 선
};

/** 누른 막대 */
export type BoardTargetType = {
    room: ReservationStoreRoomResultDto;        // 그 호실
    reservation: ReservationStoreItemResultDto; // 예약
    openedAt: number;                           // 누른 시각(ms) — 작업 버튼 판단
};

/** 막대 색 — 시안 M3 .bar(결제 대기 pend · 확정 conf · 이용 중 in · 완료 done) */
export const BAR_STATE_CLASS: Record<string, 'pend' | 'conf' | 'in' | 'done'> = {
    [RESERVATION_STATE.PENDING]: 'pend',
    [RESERVATION_STATE.CONFIRMED]: 'conf',
    [RESERVATION_STATE.CHECKED_IN]: 'in',
    [RESERVATION_STATE.COMPLETED]: 'done',
};

/** 예약 상태 배지 색 — 막대 색과 같은 뜻(결제 대기 warn · 확정 primary · 이용 중 ok · 완료 neutral) */
export const RESERVATION_STATE_TONE: Record<string, 'warn' | 'primary' | 'ok' | 'neutral'> = {
    [RESERVATION_STATE.PENDING]: 'warn',
    [RESERVATION_STATE.CONFIRMED]: 'primary',
    [RESERVATION_STATE.CHECKED_IN]: 'ok',
    [RESERVATION_STATE.COMPLETED]: 'neutral',
};

/** 이용 중 취소 요청 배지 — 시안 글자("취소 요청 중" · "취소 요청 거절"), lookup 이름에 "취소 요청"을 붙이면 "취소 요청 요청 중"이 되어 따로 둔다 */
export const CANCEL_REQUEST_BADGE: Record<string, {label: string; tone: 'warn' | 'ok' | 'danger' | 'neutral'}> = {
    [RESERVATION_CANCEL_REQUEST_STATE.REQUESTED]: {label: '취소 요청 중', tone: 'warn'},
    [RESERVATION_CANCEL_REQUEST_STATE.APPROVED]: {label: '취소 요청 승인', tone: 'ok'},
    [RESERVATION_CANCEL_REQUEST_STATE.REJECTED]: {label: '취소 요청 거절', tone: 'danger'},
    [RESERVATION_CANCEL_REQUEST_STATE.EXPIRED]: {label: '취소 요청 만료', tone: 'neutral'},
};

/** 막대 위치 */
export type BarGeometryType = {
    left: number;      // 시작(%)
    width: number;     // 길이(%)
    cutLeft: boolean;  // 전날 시작 — ‹
    cutRight: boolean; // 다음 날 끝 — ›
    tailLeft: number;  // 정비 꼬리 시작(%)
    tailWidth: number; // 정비 꼬리 길이(%) — 0 이면 그리지 않음
};

/** 작업 버튼 켜짐 */
export type ReservationActionsType = {
    storeCancel: boolean;      // 업체 취소
    roomChange: boolean;       // 호실 이동
    useCancelRequest: boolean; // 이용 중 취소 요청
};

/** 옮길 호실 하나 */
export type RoomOptionType = {
    room_id: string;         // 호실 ID
    room_name: string;       // 호실명
    floor: number;           // 층
    room_state_id: string;   // 상태 — 배지 색
    room_state_name: string; // 상태명
    disabled: boolean;       // 고를 수 없음(사용중지)
};

/**
 * 한국 날짜의 0시(ms)
 *
 * @param date YYYY-MM-DD
 */
function dayStartOf(date: string): number {
    return Date.parse(`${date}T00:00:00+09:00`);
}

/**
 * 하루 안 길이(ms) → %
 *
 * @param ms 0시부터의 길이
 */
function percentOf(ms: number): number {
    return (ms / DAY_MS) * 100;
}

/**
 * 막대 위치와 길이 — 그날 밖은 0 · 100% 에서 자르고 잘렸다고 표시, 정비 꼬리(퇴실 ~ 점유 끝)도 그날 안까지만
 *
 * @param item 예약(입실 · 퇴실 · 점유 끝)
 * @param date 고른 날짜(한국)
 */
export function barGeometry(item: Pick<ReservationStoreItemResultDto, 'start_at' | 'end_at' | 'blocked_until'>, date: string): BarGeometryType {
    const dayStart = dayStartOf(date);
    const dayEnd = dayStart + DAY_MS;
    const start = Date.parse(item.start_at);
    const end = Date.parse(item.end_at);
    const from = Math.max(start, dayStart);
    const to = Math.min(end, dayEnd);
    const tailFrom = Math.max(end, dayStart);
    const tailTo = Math.min(Date.parse(item.blocked_until), dayEnd);
    return {
        left: percentOf(from - dayStart),
        width: percentOf(Math.max(to - from, 0)),
        cutLeft: start < dayStart,
        cutRight: end > dayEnd,
        tailLeft: percentOf(Math.min(tailFrom, dayEnd) - dayStart),
        tailWidth: percentOf(Math.max(tailTo - tailFrom, 0)),
    };
}

/**
 * 막대 시간 글자 — 하루 안 "10:00~13:00", 전날 시작 "‹ 11-09 21:00 ~ 11:00", 다음 날 끝 "21:00 ~ 다음 날 11:00 ›"(formatTimeRange), 둘 다면 날짜를 모두
 *
 * @param item 예약(입실 · 퇴실)
 * @param date 고른 날짜(한국)
 */
export function barLabel(item: Pick<ReservationStoreItemResultDto, 'start_at' | 'end_at'>, date: string): string {
    const dayStart = dayStartOf(date);
    const cutLeft = Date.parse(item.start_at) < dayStart;
    const cutRight = Date.parse(item.end_at) > dayStart + DAY_MS;
    if (cutLeft && cutRight) {
        return `‹ ${toKst(item.start_at, 'MM-DD HH:mm')} ~ ${toKst(item.end_at, 'MM-DD HH:mm')} ›`;
    }

    if (cutLeft) {
        return `‹ ${toKst(item.start_at, 'MM-DD HH:mm')} ~ ${toKst(item.end_at, 'HH:mm')}`;
    }

    if (cutRight) {
        return `${formatTimeRange(item.start_at, item.end_at)} ›`;
    }

    return `${toKst(item.start_at, 'HH:mm')}~${toKst(item.end_at, 'HH:mm')}`;
}

/**
 * 작업 버튼 켜짐 — 업체 취소는 시작 전 결제 대기 · 확정, 호실 이동은 시작 전 확정, 이용 중 취소 요청은 이용 중 · 예약자 휴대폰 있음 · 요청 중이 아님
 *
 * @param item 예약
 * @param now 판단 시각(ms) — 막대를 누른 때
 */
export function reservationActions(item: Pick<ReservationStoreItemResultDto, 'reservation_state_id' | 'start_at' | 'user_phone' | 'cancel_request_state_id'>, now: number): ReservationActionsType {
    const beforeStart = Date.parse(item.start_at) > now;
    const state = item.reservation_state_id;
    return {
        storeCancel: beforeStart && (state === RESERVATION_STATE.PENDING || state === RESERVATION_STATE.CONFIRMED),
        roomChange: beforeStart && state === RESERVATION_STATE.CONFIRMED,
        useCancelRequest: state === RESERVATION_STATE.CHECKED_IN && item.user_phone !== null && item.cancel_request_state_id !== RESERVATION_CANCEL_REQUEST_STATE.REQUESTED,
    };
}

/**
 * 옮길 호실 목록 — 같은 객실 그룹, 지금 호실 빼고, 사용중지는 고를 수 없게(현황 순서 그대로 — 층 · 호실명 순)
 *
 * @param rooms 현황 호실 전부
 * @param current 지금 호실
 */
export function roomChangeOptions(rooms: Array<ReservationStoreRoomResultDto>, current: Pick<ReservationStoreRoomResultDto, 'room_id' | 'room_group_id'>): Array<RoomOptionType> {
    return rooms
        .filter((room) => room.room_group_id === current.room_group_id && room.room_id !== current.room_id)
        .map((room) => ({room_id: room.room_id, room_name: room.room_name, floor: room.floor, room_state_id: room.room_state_id, room_state_name: room.room_state_name, disabled: room.room_state_id === ROOM_STATE.DISABLED}));
}

/**
 * 날짜 넘기기 — YYYY-MM-DD 를 일 단위로(시간대와 상관없이 달력 날짜)
 *
 * @param date YYYY-MM-DD
 * @param days 넘길 날 수(전날 -1)
 */
export function shiftDate(date: string, days: number): string {
    return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * 지금 선 위치(%) — 그날이 아니면 null
 *
 * @param now 시각(ms)
 * @param date 고른 날짜(한국)
 */
export function nowPercent(now: number, date: string): number | null {
    const dayStart = dayStartOf(date);
    return now >= dayStart && now < dayStart + DAY_MS ? percentOf(now - dayStart) : null;
}

/**
 * 취소 요청을 보낸 안내 — 만료 시각이 오면 "HH:mm까지", 늦어져 결과가 없으면 시각 없이
 *
 * @param requested 요청 결과
 */
export function cancelRequestNotice(requested: ReservationUseCancelRequestResultDto | null): string {
    return requested ? `취소 요청을 보냈습니다. ${toKst(requested.expires_at, 'HH:mm')}까지 예약자 동의를 기다립니다.` : '취소 요청을 보냈습니다. 결과는 막대 배지로 확인합니다.';
}
