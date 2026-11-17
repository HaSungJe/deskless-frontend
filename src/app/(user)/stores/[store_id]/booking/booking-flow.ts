import { DiscoveryStorePlanResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import { ReservationAvailabilitySlotResultDto } from '@/contracts/reservation/dto/reservation-availability.dto';
import { ReservationDto } from '@/contracts/reservation/dto/reservation.dto';
import { formatTimeRange, toKst } from '@/shared/utils/format';
import { initialDate } from './calendar';

/** 예약에 고른 것 */
export type BookingSelectionType = {
    planType: string;                                                // 상품 종류(HOURLY · NIGHT · LONG)
    date: string;                                                    // 날짜(한국)
    nights: number | null;                                           // 연박 박수
    slot: Pick<ReservationAvailabilitySlotResultDto, 'start_at' | 'is_now'>; // 시간대
    roomId: string;                                                  // 호실
};

/** 시간대 칩 두 줄 */
export type SlotLabelType = {
    main: string; // 위 줄(시작 · 지금 바로 · 입실)
    sub: string;  // 아래 줄(끝 · 범위 · 퇴실)
};

/**
 * 고른 것 → 예약 생성 본문 — 시간 이용은 시작 시각(한국 HH:mm) 또는 지금 바로(is_now 1), 연박은 박수, 1박은 날짜만
 *
 * @param selection 고른 것
 */
export function toReservationDto(selection: BookingSelectionType): ReservationDto {
    const dto = Object.assign(new ReservationDto(), {room_id: selection.roomId, room_plan_type_id: selection.planType, date: selection.date});
    if (selection.planType === 'HOURLY' && selection.slot.is_now === 1) {
        dto.is_now = 1;
    } else if (selection.planType === 'HOURLY') {
        dto.start_time = toKst(selection.slot.start_at, 'HH:mm');
    }

    if (selection.planType === 'LONG' && selection.nights !== null) {
        dto.nights = selection.nights;
    }

    return dto;
}

/**
 * 시간대 칩 글자 — 시간 이용 '14:30' / '~ 17:30', 지금 바로 '지금 바로' / '14:12 ~ 17:12', 1박 · 연박 '20:00 입실' / '~ 11월 11일 11:00 퇴실'
 *
 * @param slot 시간대
 * @param planType 상품 종류
 */
export function slotLabel(slot: Pick<ReservationAvailabilitySlotResultDto, 'start_at' | 'end_at' | 'is_now'>, planType: string): SlotLabelType {
    const start = toKst(slot.start_at, 'HH:mm');
    if (planType !== 'HOURLY') {
        return {main: `${start} 입실`, sub: `~ ${toKst(slot.end_at, 'M월 D일 HH:mm')} 퇴실`};
    }

    const range = formatTimeRange(slot.start_at, slot.end_at);
    if (slot.is_now === 1) {
        return {main: '지금 바로', sub: range};
    }

    return {main: start, sub: `~ ${range.split(' ~ ')[1]}`};
}

/**
 * 상품을 고를 때의 날짜 · 박수 — 처음 날짜는 initialDate, 연박이면 최소 박수
 *
 * @param plan 업체 상품
 * @param today 오늘
 * @param lastOpen 열리는 마지막 날
 */
export function planSelection(plan: DiscoveryStorePlanResultDto, today: string, lastOpen: string): {date: string; nights: number | null} {
    return {date: initialDate(today, lastOpen, plan.days_of_week), nights: plan.room_plan_type_id === 'LONG' ? plan.min_nights : null};
}

/**
 * 층 글자 — 지하는 'B1층'
 *
 * @param floor 층(지하는 음수)
 */
export function floorLabel(floor: number): string {
    return floor < 0 ? `B${-floor}층` : `${floor}층`;
}
