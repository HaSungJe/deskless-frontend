'use client';
import { useContext, useState } from 'react';
import { STORE_FACILITY_OPTIONS } from '@/contracts/common/store.constants';
import { updateMyStoreFacility } from '@/contracts/store/api';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import Switch from '@/shared/components/ui/form/Switch';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import { facilityDtoOf, facilityFormOf, FacilityFormType } from '../store-settings-format';
import styles from '@/app/css/manager/StoreFacilityTab.module.css';

type StoreFacilityTabProps = {
    store: StoreMineResultDto;    // 내 업체 상세 — store_detail 이 처음 값
    onSaved: () => Promise<void>; // 저장 뒤 다시 읽기
};

/**
 * 편의시설 탭 — 스위치 7개(편의점 · 카페 · 온천 · 반려동물 동반 · 식사 제공 · 배달 음식 · 주차) · 저장(7개 모두 — 통째로 교체)
 * - 칸이 스위치라 0 · 1 밖으로 나갈 수 없지만 규약대로 보내기 전에 검사한다(칸 옆 자리가 없어 걸리면 오류 팝업)
 *
 * @param param0
 * @returns
 */
export default function StoreFacilityTab({store, onSaved}: StoreFacilityTabProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [form, setForm] = useState<FacilityFormType>(() => facilityFormOf(store.store_detail)); // ② 스위치 — 처음은 내 업체 값
    const [saving, setSaving] = useState<boolean>(false);                                         // 저장 중

    // 함수
    async function save(): Promise<void> {
        // ③ 7개 모두 0 · 1 → 저장(큐) → ④ 다시 읽기
        const dto = facilityDtoOf(form);
        if (saving || !(await validateAction(dto))) {
            return;
        }

        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateMyStoreFacility(auth, dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setSaving(false);
            handleApiError(failure.error);
            return;
        }

        await onSaved();
        setSaving(false);
    }

    return (
        // 편의시설
        <Card title="편의시설">
            <div className={styles.body}>
                {/* 안내 */}
                <p className={styles.hint}>켜 둔 편의시설이 이용자 화면의 업체 상세에 보이고, 지도 검색필터로 찾을 수 있습니다.</p>

                {/* ② 스위치 7개 — 정한 순서 */}
                <div className={styles.switches} role="group" aria-label="편의시설">
                    {STORE_FACILITY_OPTIONS.map((option) => <Switch key={option.key} label={option.label} checked={form[option.key]} onChange={(checked) => setForm((prev) => ({...prev, [option.key]: checked}))} />)}
                </div>

                {/* ③ 저장 */}
                <div className={styles.actions}><Button variant="primary" disabled={saving} onClick={save}>{saving ? '처리 중…' : '저장'}</Button></div>
            </div>
        </Card>
    );
}
