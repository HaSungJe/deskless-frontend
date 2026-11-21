'use client';
import { useContext, useState } from 'react';
import { updateRoomGroup } from '@/contracts/room/api';
import { RoomGroupDetailResultDto } from '@/contracts/room/dto/room-group-detail.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import RoomGroupForm from '../../_components/RoomGroupForm';
import { roomGroupFormOf, RoomGroupFormType, toRoomGroupUpdateDto, validateRoomGroup } from '../../room-group-format';
import styles from '@/app/css/manager/RoomGroupForm.module.css';

type RoomGroupInfoCardProps = {
    group: RoomGroupDetailResultDto; // 그룹 상세 — 칸을 한 번 채운다
    onSaved: () => void;             // 저장 뒤 상세 다시
};

/**
 * 기본 정보 카드 — 그룹명 · 방 개수 · 설명 · 객실 옵션 저장
 *
 * @param param0
 * @returns
 */
export default function RoomGroupInfoCard({group, onSaved}: RoomGroupInfoCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [form, setForm] = useState<RoomGroupFormType>(() => roomGroupFormOf(group)); // 칸 값
    const [saving, setSaving] = useState<boolean>(false);                             // 저장 중

    // 함수
    async function save(): Promise<void> {
        // ② 그룹명 · 설명 · 방 개수 검사 → 수정(큐 — 상세정보 통째로) → ⑤ 상세 다시
        const dto = toRoomGroupUpdateDto(form);
        if (saving || !(await validateRoomGroup(dto))) {
            return;
        }

        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateRoomGroup(auth, group.room_group_id, dto);
        } catch (error) {
            failure = {error};
        }

        setSaving(false);
        if (failure) {
            handleApiError(failure.error); // 그룹명이 겹치면 그룹명 칸 옆
            return;
        }

        onSaved();
    }

    return (
        // 기본 정보
        <Card title="기본 정보">
            <RoomGroupForm idPrefix="group-info" form={form} onChange={(patch) => setForm((prev) => ({...prev, ...patch}))} />
            <div className={styles.actions}><Button variant="primary" disabled={saving} onClick={save}>{saving ? '처리 중…' : '기본 정보 저장'}</Button></div>
        </Card>
    );
}
