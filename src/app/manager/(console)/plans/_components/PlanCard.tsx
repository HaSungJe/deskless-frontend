'use client';
import { useContext, useState } from 'react';
import { ROOM_PLAN_TYPE } from '@/contracts/common/room.constants';
import { updateRoomPlan } from '@/contracts/room/api';
import { RoomPlanItemResultDto } from '@/contracts/room/dto/room-plan-list.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import Chip from '@/shared/components/ui/form/Chip';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Switch from '@/shared/components/ui/form/Switch';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { DAY_NAMES, formatDays } from '@/shared/utils/format';
import { resetValidationError, validateActionChildren } from '@/shared/utils/validation';
import { planFormOf, PlanFormType, toPlanUpdateDto } from '../plan-format';
import styles from '@/app/css/manager/PlanCard.module.css';

type PlanCardProps = {
    plan: RoomPlanItemResultDto;     // 상품 설정 1개
    saved: boolean;                  // 방금 저장한 카드 — "저장했습니다."
    onSaved: (type: string) => void; // 저장 뒤 — 3개 다시
};

/**
 * 상품 카드 — 판매 · 판매 요일 · 종류별 칸(이용 시간 · 입실 / 퇴실 · 박수) · 연장, 카드 저장
 * - 칸 오류는 상품 종류 키로 이 카드에만 붙인다(카드 3개가 같은 칸 이름)
 *
 * @param param0
 * @returns
 */
export default function PlanCard({plan, saved, onSaved}: PlanCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰
    const type = plan.room_plan_type_id;  // 상품 종류 — 칸 오류 키 · 칸 id 앞

    // 상태
    const [form, setForm] = useState<PlanFormType>(() => planFormOf(plan)); // 칸 값 — 받은 값으로 한 번
    const [saving, setSaving] = useState<boolean>(false);                   // 저장 중

    // 계산 값
    const daysText = form.days_of_week === 0 ? '고른 요일 없음' : formatDays(form.days_of_week); // ② 고른 요일 글자
    const isHourly = type === ROOM_PLAN_TYPE.HOURLY;                                            // 시간 이용 — 이용 시간
    const isLong = type === ROOM_PLAN_TYPE.LONG;                                                // 연박 — 박수 · 시각 설명

    // 함수
    function change(patch: Partial<PlanFormType>): void {
        // 칸 바꿈
        setForm((prev) => ({...prev, ...patch}));
    }

    function toggleDay(day: number): void {
        // ② 요일 칩 — 그 요일 비트를 뒤집는다
        setForm((prev) => ({...prev, days_of_week: prev.days_of_week ^ (1 << day)}));
    }

    async function save(): Promise<void> {
        // ③ 종류에 맞는 칸만 모아 검사(이 카드 키) → 저장(큐) → ④ 저장했습니다 · 다시
        if (saving) {
            return;
        }

        const dto = toPlanUpdateDto(type, form);
        resetValidationError();
        if (!(await validateActionChildren(dto, type))) {
            return;
        }

        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateRoomPlan(auth, type, dto);
        } catch (error) {
            failure = {error};
        }

        setSaving(false);
        if (failure) {
            handleApiError(failure.error, true, type); // ④ 입실 = 퇴실 · 최소 > 최대 — 이 카드 칸 옆
            return;
        }

        onSaved(type);
    }

    return (
        // 상품 카드
        <Card title={plan.room_plan_type_name} actions={<Switch label="판매" checked={form.is_used} onChange={(checked) => change({is_used: checked})} />}>
            <div className={styles.card}>
                {/* ② 판매 요일 */}
                <Field label={`판매 요일 · ${daysText}`} name="days_of_week" dataKey={type} group>
                    <div className={styles.days}>
                        {DAY_NAMES.map((name, day) => <Chip key={name} pressed={(form.days_of_week & (1 << day)) !== 0} onClick={() => toggleDay(day)}>{name}</Chip>)}
                    </div>
                </Field>

                {/* ② 시간 이용 — 이용 시간 */}
                {isHourly ? (
                    <Field label="이용 시간" name="usage_hours" dataKey={type} htmlFor={`${type}-usage-hours`}>
                        <div className={styles.unit}><Input id={`${type}-usage-hours`} type="number" min={1} max={24} value={form.usage_hours} onChange={(event) => change({usage_hours: event.target.value})} /><span>시간 (1 ~ 24)</span></div>
                    </Field>
                ) : null}

                {/* ② 1박 · 연박 — 입실 · 퇴실, 연박은 박수 */}
                {!isHourly ? (
                    <div className={styles.grid}>
                        <Field label="입실 시각" name="check_in_time" dataKey={type} htmlFor={`${type}-check-in`} hint={isLong ? '첫날' : undefined}>
                            <Input id={`${type}-check-in`} type="time" value={form.check_in_time} onChange={(event) => change({check_in_time: event.target.value})} />
                        </Field>
                        <Field label="퇴실 시각" name="check_out_time" dataKey={type} htmlFor={`${type}-check-out`} hint={isLong ? '마지막 날' : '항상 다음 날'}>
                            <Input id={`${type}-check-out`} type="time" value={form.check_out_time} onChange={(event) => change({check_out_time: event.target.value})} />
                        </Field>
                        {isLong ? (
                            <>
                                <Field label="최소 박수" name="min_nights" dataKey={type} htmlFor={`${type}-min-nights`}>
                                    <div className={styles.unit}><Input id={`${type}-min-nights`} type="number" min={1} max={180} value={form.min_nights} onChange={(event) => change({min_nights: event.target.value})} /><span>박</span></div>
                                </Field>
                                <Field label="최대 박수" name="max_nights" dataKey={type} htmlFor={`${type}-max-nights`}>
                                    <div className={styles.unit}><Input id={`${type}-max-nights`} type="number" min={1} max={180} value={form.max_nights} onChange={(event) => change({max_nights: event.target.value})} /><span>박</span></div>
                                </Field>
                            </>
                        ) : null}
                    </div>
                ) : null}

                {/* ② 연장 */}
                <hr className={styles.sep} />
                <div className={styles.kv}><Switch label="연장 가능" checked={form.is_extendable} onChange={(checked) => change({is_extendable: checked})} /></div>
                <Field label="최대 연장 횟수" name="max_extensions" dataKey={type} htmlFor={`${type}-max-extensions`} hint="연장 불가여도 값은 남습니다.">
                    <div className={styles.unit}><Input id={`${type}-max-extensions`} type="number" min={1} max={10} value={form.max_extensions} onChange={(event) => change({max_extensions: event.target.value})} /><span>회 (1 ~ 10)</span></div>
                </Field>

                {/* ③④ 저장 */}
                <div className={styles.actions}>
                    {saved ? <span className={styles.saved} role="status">저장했습니다.</span> : null}
                    <Button variant="primary" disabled={saving} onClick={save}>{saving ? '처리 중…' : '저장'}</Button>
                </div>
            </div>
        </Card>
    );
}
