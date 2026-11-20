import { ROOM_PLAN_TYPE } from '@/contracts/common/room.constants';
import { RoomPlanItemResultDto } from '@/contracts/room/dto/room-plan-list.dto';
import { RoomPlanUpdateDto } from '@/contracts/room/dto/room-plan-update.dto';
import { numberOf } from '@/shared/utils/util';

/** 상품 카드 칸 — 숫자 칸은 입력 글자 그대로 */
export type PlanFormType = {
    is_used: boolean;       // 판매
    days_of_week: number;   // 판매 요일 비트 합(0 이면 고른 요일 없음)
    is_extendable: boolean; // 연장 가능
    max_extensions: string; // 최대 연장 횟수
    usage_hours: string;    // 이용 시간 — 시간 이용
    check_in_time: string;  // 입실 시각(HH:mm) — 1박 · 연박
    check_out_time: string; // 퇴실 시각
    min_nights: string;     // 최소 박수 — 연박
    max_nights: string;     // 최대 박수
};

/**
 * 받은 상품 설정 → 카드 칸(null 은 빈 칸)
 *
 * @param plan 상품 설정 1개
 */
export function planFormOf(plan: RoomPlanItemResultDto): PlanFormType {
    return {
        is_used: plan.is_used === 1,
        days_of_week: plan.days_of_week,
        is_extendable: plan.is_extendable === 1,
        max_extensions: String(plan.max_extensions),
        usage_hours: plan.usage_hours === null ? '' : String(plan.usage_hours),
        check_in_time: plan.check_in_time ?? '',
        check_out_time: plan.check_out_time ?? '',
        min_nights: plan.min_nights === null ? '' : String(plan.min_nights),
        max_nights: plan.max_nights === null ? '' : String(plan.max_nights),
    };
}

/**
 * 상품 설정 보낼 값 — 판매 · 요일 · 연장은 늘, 시간 이용은 이용 시간만, 1박은 입실 · 퇴실만, 연박은 시각 + 최소 · 최대 박수
 * - 종류가 받지 않는 칸은 넣지 않는다(DTO 는 선택 필드 — 백엔드가 종류로 가른다). 빈 칸은 undefined → 백엔드가 그 칸 오류
 *
 * @param type 상품 종류
 * @param form 카드 칸
 */
export function toPlanUpdateDto(type: string, form: PlanFormType): RoomPlanUpdateDto {
    const common = {is_used: form.is_used ? 1 : 0, days_of_week: form.days_of_week, is_extendable: form.is_extendable ? 1 : 0, max_extensions: numberOf(form.max_extensions)};
    if (type === ROOM_PLAN_TYPE.HOURLY) {
        return Object.assign(new RoomPlanUpdateDto(), common, {usage_hours: numberOf(form.usage_hours)});
    }

    const times = {check_in_time: form.check_in_time || undefined, check_out_time: form.check_out_time || undefined};
    if (type === ROOM_PLAN_TYPE.NIGHT) {
        return Object.assign(new RoomPlanUpdateDto(), common, times);
    }

    return Object.assign(new RoomPlanUpdateDto(), common, times, {min_nights: numberOf(form.min_nights), max_nights: numberOf(form.max_nights)});
}
