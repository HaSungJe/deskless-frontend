'use client';
import { useContext, useState } from 'react';
import { updateMyStoreMaintenance, updateMyStoreOpen, updateMyStorePolicy } from '@/contracts/store/api';
import { StoreMineMaintenanceDto } from '@/contracts/store/dto/store-mine-maintenance.dto';
import { StoreMineOpenDto } from '@/contracts/store/dto/store-mine-open.dto';
import { StoreMineReservationPolicyDto } from '@/contracts/store/dto/store-mine-reservation-policy.dto';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Switch from '@/shared/components/ui/form/Switch';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import { numberOf, policySummary } from '../store-settings-format';
import styles from '@/app/css/manager/StorePolicyTab.module.css';

type StorePolicyTabProps = {
    store: StoreMineResultDto;    // 내 업체 상세 — is_open · maintenance_minutes · 규정
    onSaved: () => Promise<void>; // 저장 뒤 다시 읽기
};

/** 저장 카드 */
type PolicySavingType = 'open' | 'maintenance' | 'policy';

/**
 * 운영 규정 탭 — 영업중(바로 저장) · 정비시간 · 예약 · 환불 규정, 저장 단위가 셋이라 카드도 셋
 * - 요약 문장은 지금 저장된 값(store)으로 쓴다
 *
 * @param param0
 * @returns
 */
export default function StorePolicyTab({store, onSaved}: StorePolicyTabProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [maintenance, setMaintenance] = useState<string>(String(store.maintenance_minutes));  // ② 정비시간(분)
    const [openHours, setOpenHours] = useState<string>(String(store.booking_open_hours));      // ③ 예약 가능 시작(시간)
    const [deadline, setDeadline] = useState<string>(String(store.refund_deadline_minutes));   // ③ 100% 환불 마감(분)
    const [latePercent, setLatePercent] = useState<string>(String(store.late_refund_percent)); // ③ 마감 뒤 환불 비율(%)
    const [saving, setSaving] = useState<PolicySavingType | null>(null);                       // 저장 중인 카드

    // 계산 값
    const summary = policySummary(store.booking_open_hours, store.refund_deadline_minutes, store.late_refund_percent); // ③ 지금 규정 한 문장

    // 함수
    async function send(kind: PolicySavingType, call: () => Promise<null>): Promise<void> {
        // 저장(큐) 공통 — 실패면 안내, 끝나면 다시 읽기(①②③)
        setSaving(kind);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await call();
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
        }
        await onSaved();
        setSaving(null);
    }

    async function toggleOpen(checked: boolean): Promise<void> {
        // ① 영업중 — 바꾸면 바로 저장
        if (saving) {
            return;
        }

        await send('open', () => updateMyStoreOpen(auth, Object.assign(new StoreMineOpenDto(), {is_open: checked ? 1 : 0})));
    }

    async function saveMaintenance(): Promise<void> {
        // ② 정비시간 검사 → 저장
        const dto = Object.assign(new StoreMineMaintenanceDto(), {maintenance_minutes: numberOf(maintenance)});
        if (saving || !(await validateAction(dto))) {
            return;
        }

        await send('maintenance', () => updateMyStoreMaintenance(auth, dto));
    }

    async function savePolicy(): Promise<void> {
        // ③ 예약 · 환불 규정 검사 → 저장
        const dto = Object.assign(new StoreMineReservationPolicyDto(), {booking_open_hours: numberOf(openHours), refund_deadline_minutes: numberOf(deadline), late_refund_percent: numberOf(latePercent)});
        if (saving || !(await validateAction(dto))) {
            return;
        }

        await send('policy', () => updateMyStorePolicy(auth, dto));
    }

    return (
        // 운영 규정
        <div className={styles.tab}>
            <div className={styles.cols}>
                {/* ① 영업중 */}
                <Card title="영업중" actions={<Switch label="영업중" checked={store.is_open === 1} disabled={saving !== null} onChange={toggleOpen} />}>
                    <p className={styles.hint}>끄면 영업시간 · 24시간 설정과 관계없이 새 예약을 받지 않습니다. 바꾸면 바로 저장합니다.</p>
                </Card>

                {/* ② 정비시간 */}
                <Card title="정비시간">
                    <Field label="퇴실 뒤 다음 이용까지 호실을 막는 시간" name="maintenance_minutes" htmlFor="store-maintenance" hint="예약 현황 막대 뒤 점선 꼬리(점유 끝)가 이 시간입니다.">
                        <span className={styles.unit}><Input id="store-maintenance" type="number" inputMode="numeric" min={0} max={240} value={maintenance} onChange={(event) => setMaintenance(event.target.value)} /><span>분 (0 ~ 240)</span></span>
                    </Field>
                    <div className={styles.actions}><Button variant="primary" disabled={saving !== null} onClick={saveMaintenance}>{saving === 'maintenance' ? '처리 중…' : '저장'}</Button></div>
                </Card>
            </div>

            {/* ③ 예약 · 환불 규정 */}
            <Card title="예약 · 환불 규정">
                <Band tone="info">예약할 때의 환불 마감 · 비율을 예약에 저장하므로, 바꿔도 이미 받은 예약은 그때 규정을 따릅니다.</Band>
                <div className={styles.grid}>
                    <Field label="예약 가능 시작" name="booking_open_hours" htmlFor="store-open-hours" hint="1 ~ 4,320시간">
                        <span className={styles.unit}><span>이용 시작</span><Input id="store-open-hours" type="number" inputMode="numeric" value={openHours} onChange={(event) => setOpenHours(event.target.value)} /><span>시간 전부터</span></span>
                    </Field>
                    <Field label="100% 환불 마감" name="refund_deadline_minutes" htmlFor="store-deadline" hint="0 ~ 10,080분">
                        <span className={styles.unit}><span>이용 시작</span><Input id="store-deadline" type="number" inputMode="numeric" value={deadline} onChange={(event) => setDeadline(event.target.value)} /><span>분 전까지</span></span>
                    </Field>
                    <Field label="마감 뒤 환불 비율" name="late_refund_percent" htmlFor="store-late-percent" hint="0 ~ 100%">
                        <span className={styles.unit}><Input id="store-late-percent" type="number" inputMode="numeric" value={latePercent} onChange={(event) => setLatePercent(event.target.value)} /><span>%</span></span>
                    </Field>
                </div>
                <p className={styles.summary}>지금 규정: {summary}</p>
                <div className={styles.actions}><Button variant="primary" disabled={saving !== null} onClick={savePolicy}>{saving === 'policy' ? '처리 중…' : '저장'}</Button></div>
            </Card>
        </div>
    );
}
