// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { PlanFormType, toPlanUpdateDto } from '@/app/manager/(console)/plans/plan-format';
import { ROOM_PLAN_TYPE } from '@/contracts/common/room.constants';

/**
 * 카드 칸 — 모든 칸에 값이 있다(종류가 받지 않는 칸에 값이 남아 있어도 보내지 않는지 본다)
 *
 * @param extra 바꿀 칸
 */
function planForm(extra: Partial<PlanFormType> = {}): PlanFormType {
    return {
        is_used: true,
        days_of_week: 127,
        is_extendable: true,
        max_extensions: '2',
        usage_hours: '3',
        check_in_time: '15:00',
        check_out_time: '11:00',
        min_nights: '2',
        max_nights: '30',
        ...extra,
    };
}

/**
 * 보낼 본문 — JSON 으로 바꿔 빠진 칸까지 본다(undefined 칸은 본문에 없다)
 *
 * @param dto 보낼 값
 */
function bodyOf(dto: object): unknown {
    return JSON.parse(JSON.stringify(dto));
}

describe('toPlanUpdateDto — 상품 설정 보낼 값', () => {
    it('[SUCCESS] 시간 이용은 이용 시간만 보낸다', () => {
        const dto = toPlanUpdateDto(ROOM_PLAN_TYPE.HOURLY, planForm());

        expect(bodyOf(dto)).toEqual({is_used: 1, days_of_week: 127, is_extendable: 1, max_extensions: 2, usage_hours: 3});
    });

    it('[SUCCESS] 1박은 입실 · 퇴실 시각만 보낸다', () => {
        const dto = toPlanUpdateDto(ROOM_PLAN_TYPE.NIGHT, planForm({is_extendable: false}));

        expect(bodyOf(dto)).toEqual({is_used: 1, days_of_week: 127, is_extendable: 0, max_extensions: 2, check_in_time: '15:00', check_out_time: '11:00'});
    });

    it('[SUCCESS] 연박은 시각과 최소 · 최대 박수까지 보낸다', () => {
        const dto = toPlanUpdateDto(ROOM_PLAN_TYPE.LONG, planForm({is_used: false, days_of_week: 31}));

        expect(bodyOf(dto)).toEqual({is_used: 0, days_of_week: 31, is_extendable: 1, max_extensions: 2, check_in_time: '15:00', check_out_time: '11:00', min_nights: 2, max_nights: 30});
    });
});
