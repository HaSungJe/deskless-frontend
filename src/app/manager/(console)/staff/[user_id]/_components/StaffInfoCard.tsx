'use client';
import { useContext, useState } from 'react';
import { updateManagerStaff } from '@/contracts/manager/api';
import { ManagerStaffDetailResultDto } from '@/contracts/manager/dto/manager-staff-detail.dto';
import { ManagerStaffUpdateDto } from '@/contracts/manager/dto/manager-staff-update.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import StaffFields from '../../_components/StaffFields';
import { staffFormOf, StaffFormType } from '../../staff-format';
import styles from '@/app/css/manager/StaffDetailContent.module.css';

type StaffInfoCardProps = {
    staff: ManagerStaffDetailResultDto; // 상세 — 칸을 한 번 채운다
    onSaved: () => void;                // 저장 뒤 상세 다시
};

/**
 * 계정 정보 카드 — 아이디 · 등록일 · 수정일은 읽기만, 이름 · 휴대폰 · 성별 · 생년월일 저장(통째로)
 *
 * @param param0
 * @returns
 */
export default function StaffInfoCard({staff, onSaved}: StaffInfoCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [form, setForm] = useState<StaffFormType>(() => staffFormOf(staff)); // 칸 값
    const [saving, setSaving] = useState<boolean>(false);                     // 저장 중

    // 함수
    async function save(): Promise<void> {
        // ③ 검사 → 수정(큐 — 네 칸 통째로) → ④ 상세 다시
        const dto = Object.assign(new ManagerStaffUpdateDto(), {name: form.name.trim(), phone: form.phone, gender: form.gender, birth: form.birth});
        if (saving || !(await validateAction(dto))) {
            return;
        }

        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateManagerStaff(auth, staff.user_id, dto);
        } catch (error) {
            failure = {error};
        }

        setSaving(false);
        if (failure) {
            handleApiError(failure.error); // ④ 휴대폰이 겹치면 그 칸 옆
            return;
        }

        onSaved();
    }

    return (
        // 계정 정보
        <Card title="계정 정보">
            {/* 읽기만 */}
            <dl className={styles.dl}>
                <dt>아이디</dt><dd>{staff.login_id}</dd>
                <dt>등록일</dt><dd className={styles.number}>{toKst(staff.created_at, 'YYYY-MM-DD HH:mm')}</dd>
                <dt>수정일</dt><dd className={styles.number}>{toKst(staff.updated_at, 'YYYY-MM-DD HH:mm')}</dd>
            </dl>
            <hr className={styles.sep} />

            {/* ③ 고치는 칸 */}
            <StaffFields idPrefix="staff-info" form={form} onChange={(patch) => setForm((prev) => ({...prev, ...patch}))} />
            <div className={styles.actions}><Button variant="primary" disabled={saving} onClick={save}>{saving ? '처리 중…' : '저장'}</Button></div>
        </Card>
    );
}
