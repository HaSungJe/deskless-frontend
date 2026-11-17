import { DiscoveryRoomGroupDetailResultDto, DiscoveryRoomGroupPeriodPriceResultDto, DiscoveryRoomGroupPlanResultDto } from '@/contracts/discovery/dto/discovery-room-group-list.dto';
import { DiscoveryStoreDetailResultDto, DiscoveryStoreHourResultDto, DiscoveryStorePlanResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import { EVERY_DAY_BITS, formatDays, formatPrice } from '@/shared/utils/format';

/** 휴무 · 영업시간을 알 수 없는 요일 */
const CLOSED_LABEL = '휴무';

/** 1시간(분) */
const MINUTES_PER_HOUR = 60;

/** 마감 뒤에도 전액 환불(%) */
const FULL_REFUND_PERCENT = 100;

/**
 * 요일 하나의 영업시간 한 줄 — '09:00 ~ 21:00', 닫는 시각이 이르거나 같으면 '09:00 ~ 다음 날 01:00', 휴무 · 시각 없음은 '휴무'
 *
 * @param hour 요일 영업시간
 */
export function formatHourRange(hour: Pick<DiscoveryStoreHourResultDto, 'is_closed' | 'open_time' | 'close_time'>): string {
    const {is_closed, open_time, close_time} = hour;
    if (is_closed === 1 || !open_time || !close_time) {
        return CLOSED_LABEL;
    }

    return `${open_time} ~ ${close_time <= open_time ? '다음 날 ' : ''}${close_time}`;
}

/**
 * 판매 상품 한 줄 — 시간 이용 '이용 3시간 · 매일 · 연장 최대 2회', 1박 '입실 20:00 · 퇴실 다음 날 11:00 · …', 연박 '2박 ~ 7박 · 입실 · 퇴실 · 일 ~ 목 입실 · …'
 *
 * @param plan 판매 중인 상품 설정
 */
export function describePlan(plan: DiscoveryStorePlanResultDto): string {
    const extension = plan.is_extendable === 1 ? `연장 최대 ${plan.max_extensions}회` : '연장 안 됨';

    switch (plan.room_plan_type_id) {
        case 'HOURLY':
            return joinParts([`이용 ${plan.usage_hours}시간`, formatDays(plan.days_of_week), extension]);
        case 'NIGHT':
            return joinParts([`입실 ${plan.check_in_time}`, `퇴실 다음 날 ${plan.check_out_time}`, checkInDays(plan.days_of_week), extension]);
        case 'LONG':
            return joinParts([nightsLabel(plan.min_nights, plan.max_nights), `입실 ${plan.check_in_time}`, `퇴실 ${plan.check_out_time}`, checkInDays(plan.days_of_week), extension]);
        default:
            return joinParts([formatDays(plan.days_of_week), extension]);
    }
}

/**
 * 예약 · 환불 규정 문장들 — 예약 시작 · 환불(마감 · 마감 뒤 비율) · 시작 뒤 취소 불가
 *
 * @param store 업체 상세의 규정 값
 */
export function describeBookingPolicy(store: Pick<DiscoveryStoreDetailResultDto, 'booking_open_hours' | 'refund_deadline_minutes' | 'late_refund_percent'>): Array<string> {
    return [
        `이용 시작 ${store.booking_open_hours}시간 전부터 예약할 수 있어요.`,
        refundLine(store.refund_deadline_minutes, store.late_refund_percent),
        '이용이 시작되면 취소할 수 없어요.',
    ];
}

/**
 * 객실 그룹 가격 앞 상품 이름 — 연박은 1박당 요금이라 '연박 1박당', 그 밖은 종류명 그대로
 *
 * @param plan 그룹 상품
 */
export function planPriceLabel(plan: Pick<DiscoveryRoomGroupPlanResultDto, 'room_plan_type_id' | 'room_plan_type_name'>): string {
    return plan.room_plan_type_id === 'LONG' ? `${plan.room_plan_type_name} 1박당` : plan.room_plan_type_name;
}

/**
 * 기간 가격 한 줄 — '12월 24일 ~ 12월 25일 1박 79,000원 (성탄 연휴)', 하루면 날짜 하나, 메모가 없거나 비면 괄호 없음
 *
 * @param period 기간 가격
 * @param planLabel 상품 이름(planPriceLabel)
 */
export function formatPeriodPrice(period: DiscoveryRoomGroupPeriodPriceResultDto, planLabel: string): string {
    const start = formatMonthDay(period.start_date);
    const dates = period.start_date === period.end_date ? start : `${start} ~ ${formatMonthDay(period.end_date)}`;
    const memo = period.memo ? ` (${period.memo})` : '';
    return `${dates} ${planLabel} ${formatPrice(period.price)}${memo}`;
}

/**
 * 편의시설 칩 글자 — 방 개수(1개 이상) · 샤워 · TV · PC 중 있는 것만, 이 순서로
 *
 * @param detail 객실 그룹 상세정보
 */
export function amenityLabels(detail: DiscoveryRoomGroupDetailResultDto): Array<string> {
    return [
        detail.room_count > 0 ? `방 ${detail.room_count}개` : '',
        detail.has_shower === 1 ? '샤워 시설' : '',
        detail.has_tv === 1 ? 'TV' : '',
        detail.has_pc === 1 ? 'PC' : '',
    ].filter(Boolean);
}

/**
 * 빈 조각을 빼고 ' · ' 로
 *
 * @param parts 조각들
 */
function joinParts(parts: Array<string>): string {
    return parts.filter(Boolean).join(' · ');
}

/**
 * 1박 · 연박 입실 요일 — 매일은 '매일', 그 밖은 '금 · 토 입실'
 *
 * @param bits 예약 가능 요일 비트
 */
function checkInDays(bits: number): string {
    const days = formatDays(bits);
    if (bits === EVERY_DAY_BITS || !days) {
        return days;
    }

    return `${days} 입실`;
}

/**
 * 연박 박수 — 같으면 '3박', 다르면 '2박 ~ 7박'
 *
 * @param min 최소 박수
 * @param max 최대 박수
 */
function nightsLabel(min: number | null, max: number | null): string {
    return min === max ? `${min}박` : `${min}박 ~ ${max}박`;
}

/**
 * 환불 문장 — 마감 0분 · 마감 뒤 100% 는 시작 전까지 전액, 마감 뒤 0% 는 환불 없음, 그 밖은 비율
 *
 * @param deadlineMinutes 100% 환불 마감(분)
 * @param latePercent 마감 뒤 환불 비율(%)
 */
function refundLine(deadlineMinutes: number, latePercent: number): string {
    if (deadlineMinutes <= 0 || latePercent >= FULL_REFUND_PERCENT) {
        return '이용 시작 전까지 취소하면 전액 환불해요.';
    }

    const deadline = `이용 시작 ${formatMinutes(deadlineMinutes)} 전까지 취소하면 전액`;
    if (latePercent <= 0) {
        return `${deadline} 환불해요. 그 뒤에는 환불되지 않아요.`;
    }

    return `${deadline}, 그 뒤 시작 전까지는 ${latePercent}% 환불해요.`;
}

/**
 * 분 → '1시간'(60으로 나누어떨어지면) · '90분'
 *
 * @param minutes 분
 */
function formatMinutes(minutes: number): string {
    return minutes % MINUTES_PER_HOUR === 0 ? `${minutes / MINUTES_PER_HOUR}시간` : `${minutes}분`;
}

/**
 * 'YYYY-MM-DD' → 'M월 D일' — 날짜 문자열을 시간대 없이 그대로 읽는다
 *
 * @param date 날짜
 */
function formatMonthDay(date: string): string {
    const [, month, day] = date.split('-');
    return `${Number(month)}월 ${Number(day)}일`;
}
