import { StoreMineHourDto, StoreMineHoursDto } from '@/contracts/store/dto/store-mine-hours.dto';
import { StoreMineHourItemResultDto } from '@/contracts/store/dto/store-mine.dto';
import { TabItemType } from '@/shared/components/ui/nav/Tabs';
import { DAY_NAMES } from '@/shared/utils/format';

/** 내 업체 설정 탭 */
export type StoreTabType = 'profile' | 'photos' | 'hours' | 'policy' | 'unavailable' | 'door';

/** 탭 6개 — 문 연동은 업체 총관리자에게만(머리가 거른다) */
export const STORE_TABS: Array<TabItemType<StoreTabType>> = [
    {value: 'profile', label: '기본 정보'},
    {value: 'photos', label: '사진'},
    {value: 'hours', label: '영업시간 · 브레이크'},
    {value: 'policy', label: '운영 규정'},
    {value: 'unavailable', label: '일시 예약불가'},
    {value: 'door', label: '문 연동'},
];

/** 업체 정보 파일 용도 */
export const STORE_FILE_PURPOSE = {LICENSE: 'BUSINESS_LICENSE', IMAGE: 'STORE_IMAGE'} as const;

/** 업체 사진 최대 장수 — StoreMineFileOrderDto */
export const STORE_IMAGE_MAX = 5;

/** 브레이크타임 최대 개수 — StoreMineBreaksDto */
export const BREAK_MAX = 10;

/** 요일 영업시간 칸 한 줄 */
export type HourRowType = {
    day_of_week: number; // 0 일 ~ 6 토
    is_closed: boolean;  // 휴무
    open_time: string;   // 여는 시각(HH:mm — 비었으면 '')
    close_time: string;  // 닫는 시각
};

/** 브레이크타임 칸 한 줄 */
export type BreakRowType = {
    start_time: string; // 시작 시각(HH:mm)
    end_time: string;   // 마감 시각
};

/**
 * 받은 요일 영업시간 → 일 ~ 토 7줄(없는 요일 · 24시간이라 빈 목록이면 빈 시각의 영업 줄)
 *
 * @param hours 내 업체 상세 hours
 */
export function hourRowsOf(hours: Array<StoreMineHourItemResultDto>): Array<HourRowType> {
    const byDay = new Map(hours.map((hour) => [hour.day_of_week, hour]));
    return DAY_NAMES.map((_, day) => {
        const hour = byDay.get(day);
        return {day_of_week: day, is_closed: hour?.is_closed === 1, open_time: hour?.open_time ?? '', close_time: hour?.close_time ?? ''};
    });
}

/**
 * 영업시간 보낼 값 — 24시간이면 빈 목록, 아니면 일 ~ 토 7개(요일 순), 휴무 요일은 시각 없이
 *
 * @param isAlwaysOpen 24시간 연중무휴
 * @param rows 요일 줄
 */
export function toHoursDto(isAlwaysOpen: boolean, rows: Array<HourRowType>): StoreMineHoursDto {
    const hours = isAlwaysOpen ? [] : [...rows]
        .sort((a, b) => a.day_of_week - b.day_of_week)
        .map((row) => Object.assign(new StoreMineHourDto(), row.is_closed
            ? {day_of_week: row.day_of_week, is_closed: 1}
            : {day_of_week: row.day_of_week, is_closed: 0, open_time: row.open_time, close_time: row.close_time}));
    return Object.assign(new StoreMineHoursDto(), {is_always_open: isAlwaysOpen ? 1 : 0, hours});
}

/**
 * 다음 날 표시 — 닫는 시각이 여는 시각보다 이르거나 같으면 "다음 날 HH:mm까지", 늦거나 비었으면 ''
 *
 * @param openTime 여는 · 시작 시각(HH:mm)
 * @param closeTime 닫는 · 마감 시각(HH:mm)
 */
export function overnightLabel(openTime: string, closeTime: string): string {
    if (!openTime || !closeTime) {
        return '';
    }

    return closeTime <= openTime ? `다음 날 ${closeTime}까지` : '';
}

/**
 * 일시 예약불가 일시 글자 — 달력 칸 값(YYYY-MM-DDTHH:mm[:ss]) → 백엔드 모양(YYYY-MM-DD HH:mm), 빈 값은 ''
 *
 * @param value datetime-local 칸 값
 */
export function toPeriodText(value: string): string {
    return value ? value.replace('T', ' ').slice(0, 16) : '';
}

/**
 * 규정 요약 문장 — 예약 시작(하루 단위면 일수) · 100% 환불 마감 · 마감 뒤 비율(0 이면 환불 없이 취소)
 *
 * @param bookingOpenHours 예약 가능 시작(시간)
 * @param refundDeadlineMinutes 100% 환불 마감(분)
 * @param lateRefundPercent 마감 뒤 환불 비율(%)
 */
export function policySummary(bookingOpenHours: number, refundDeadlineMinutes: number, lateRefundPercent: number): string {
    const days = bookingOpenHours % 24 === 0 ? `(${(bookingOpenHours / 24).toLocaleString('ko-KR')}일)` : '';
    const late = lateRefundPercent === 0 ? '그 뒤 시작 전까지 취소하면 환불 없이 취소됩니다.' : `그 뒤 시작 전까지 취소하면 ${lateRefundPercent}%를 환불합니다.`;
    return `이용 시작 ${bookingOpenHours.toLocaleString('ko-KR')}시간${days} 전부터 예약을 받고, 시작 ${refundDeadlineMinutes.toLocaleString('ko-KR')}분 전까지 취소하면 전액, ${late}`;
}
