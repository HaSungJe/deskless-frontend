'use client';
import Link from 'next/link';
import { useContext, useState } from 'react';
import { ROOM_PLAN_TYPE } from '@/contracts/common/room.constants';
import { updateRoomGroupPlan } from '@/contracts/room/api';
import { RoomGroupDetailResultDto } from '@/contracts/room/dto/room-group-detail.dto';
import { RoomGroupPlanUpdateDto } from '@/contracts/room/dto/room-group-plan-update.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import Table from '@/shared/components/ui/display/Table';
import FieldError from '@/shared/components/ui/form/FieldError';
import Input from '@/shared/components/ui/form/Input';
import Switch from '@/shared/components/ui/form/Switch';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { numberOf } from '@/shared/utils/util';
import { resetValidationError, validateActionChildren } from '@/shared/utils/validation';
import styles from '@/app/css/manager/RoomGroupPlans.module.css';

type RoomGroupPlansProps = {
    group: RoomGroupDetailResultDto;      // 그룹 상세 — plans(판매 · 요금 · 기간 가격 개수)
    onSaved: () => void;                  // 저장 뒤 상세 다시
    onShowPrices: (type: string) => void; // 기간 가격 개수 — 아래 절을 그 상품으로
};

/** 업체 상품 설정 주소 — 카드 오른쪽 링크 */
const PLANS_PATH = '/manager/plans/';

/** 그룹 상품 한 줄 칸 */
type PlanRowType = {
    is_used: boolean; // 판매
    price: string;    // 기본 요금 칸 글자
};

/**
 * 그룹 상품 카드 — 상품마다 판매 · 기본 요금 · 기간 가격 개수 · 줄 저장
 * - 줄 3개가 같은 칸 이름(price)이라 오류는 상품 종류 키로 그 줄에 붙인다
 *
 * @param param0
 * @returns
 */
export default function RoomGroupPlans({group, onSaved, onShowPrices}: RoomGroupPlansProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [rows, setRows] = useState<Record<string, PlanRowType>>(() => Object.fromEntries(group.plans.map((plan) => [plan.room_plan_type_id, {is_used: plan.is_used === 1, price: String(plan.price)}]))); // ④ 줄 칸 — 받은 값으로 한 번
    const [saving, setSaving] = useState<string | null>(null);                                                                                                                                             // 저장 중인 상품

    // 함수
    function change(type: string, patch: Partial<PlanRowType>): void {
        // 그 줄 칸 바꿈
        setRows((prev) => ({...prev, [type]: {...prev[type], ...patch}}));
    }

    async function save(type: string): Promise<void> {
        // ④ 그 줄 검사(상품 종류 키) → 그룹 상품 수정(큐) → ⑤ 상세 다시
        const row = rows[type];
        if (saving !== null || !row) {
            return;
        }

        const dto = Object.assign(new RoomGroupPlanUpdateDto(), {is_used: row.is_used ? 1 : 0, price: numberOf(row.price)});
        resetValidationError();
        if (!(await validateActionChildren(dto, type))) {
            return;
        }

        setSaving(type);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateRoomGroupPlan(auth, group.room_group_id, type, dto);
        } catch (error) {
            failure = {error};
        }

        setSaving(null);
        if (failure) {
            handleApiError(failure.error, true, type); // 판매인데 요금 0 — 그 줄 요금 칸 옆
            return;
        }

        onSaved();
    }

    return (
        // 그룹 상품
        <Card title="그룹 상품" actions={<Link href={PLANS_PATH} className={styles.link}>업체 상품 설정으로</Link>}>
            {/* ④ 안내 */}
            <Band tone="info">업체 상품 설정에서 판매하지 않는 상품은 그룹 상품을 켜도 팔리지 않습니다. 기본 요금은 시간 이용 1회 · 1박 · 연박 1박당입니다.</Band>

            {/* ④ 상품 줄 */}
            <Table>
                <thead><tr><th scope="col">상품</th><th scope="col">판매</th><th scope="col">기본 요금</th><th scope="col">기간 가격</th><th scope="col"><span className={styles.srOnly}>저장</span></th></tr></thead>
                <tbody>
                    {group.plans.map((plan) => {
                        const type = plan.room_plan_type_id;
                        const row = rows[type];
                        return row ? (
                            <tr key={type}>
                                <th scope="row">{plan.room_plan_type_name}</th>
                                <td><Switch label={`${plan.room_plan_type_name} 판매`} checked={row.is_used} onChange={(checked) => change(type, {is_used: checked})} /></td>
                                <td>
                                    <div className={styles.unit}><Input type="number" min={0} aria-label={`${plan.room_plan_type_name} 기본 요금`} value={row.price} onChange={(event) => change(type, {price: event.target.value})} /><span>{type === ROOM_PLAN_TYPE.LONG ? '원 / 1박' : '원'}</span></div>
                                    <FieldError name="price" dataKey={type} />
                                </td>
                                <td><Button size="sm" aria-label={`${plan.room_plan_type_name} 기간 가격 ${plan.price_count}개 보기`} onClick={() => onShowPrices(type)}>{plan.price_count}개</Button></td>
                                <td><Button size="sm" variant="primary" aria-label={`${plan.room_plan_type_name} 저장`} disabled={saving !== null} onClick={() => save(type)}>{saving === type ? '처리 중…' : '저장'}</Button></td>
                            </tr>
                        ) : null;
                    })}
                </tbody>
            </Table>
        </Card>
    );
}
