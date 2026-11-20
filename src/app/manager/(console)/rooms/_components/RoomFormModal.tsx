'use client';
import { useContext, useState } from 'react';
import { createRoom, updateRoom } from '@/contracts/room/api';
import { RoomGroupListItemResultDto } from '@/contracts/room/dto/room-group-list.dto';
import { RoomListItemResultDto } from '@/contracts/room/dto/room-list.dto';
import { RoomUpdateDto } from '@/contracts/room/dto/room-update.dto';
import { RoomDto } from '@/contracts/room/dto/room.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Select from '@/shared/components/ui/form/Select';
import Modal from '@/shared/components/ui/modal/Modal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { numberOf } from '@/shared/utils/util';
import { validateAction } from '@/shared/utils/validation';
import styles from '@/app/css/manager/RoomsContent.module.css';

type RoomFormModalProps = {
    room: RoomListItemResultDto | null;        // 고칠 호실 — null 이면 등록
    groups: Array<RoomGroupListItemResultDto>; // 등록 때 고를 그룹 전체
    onClose: () => void;                       // 닫기
    onSaved: () => void;                       // 저장 뒤 — 닫고 목록 다시
};

/** 호실명 최대 글자 수 — RoomDto */
const ROOM_NAME_MAX = 50;

/**
 * 호실 등록 · 수정 대화상자 — 등록은 그룹 고르기 · 호실명 · 층, 수정은 그룹을 읽기만
 *
 * @param param0
 * @returns
 */
export default function RoomFormModal({room, groups, onClose, onSaved}: RoomFormModalProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [groupId, setGroupId] = useState<string>(room?.room_group_id ?? '');   // 그룹(등록만)
    const [name, setName] = useState<string>(room?.room_name ?? '');             // 호실명
    const [floor, setFloor] = useState<string>(room ? String(room.floor) : '');  // 층 칸 글자
    const [saving, setSaving] = useState<boolean>(false);                       // 저장 중

    // 함수
    async function save(): Promise<void> {
        // ③ 검사 → 등록 · 수정(큐) → ⑥ 닫고 목록 다시
        const target = room;
        if (saving) {
            return;
        }

        const values = {room_name: name.trim(), floor: numberOf(floor)};
        const createDto = Object.assign(new RoomDto(), {room_group_id: groupId}, values);
        const updateDto = Object.assign(new RoomUpdateDto(), values);
        if (!(await validateAction(target === null ? createDto : updateDto))) {
            return;
        }

        const send = target === null ? () => createRoom(auth, createDto) : () => updateRoom(auth, target.room_id, updateDto); // try 안에 갈래를 두지 않는다
        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await send();
        } catch (error) {
            failure = {error};
        }

        setSaving(false);
        if (failure) {
            handleApiError(failure.error); // 호실명이 겹치면 호실명 칸 옆
            return;
        }

        onSaved();
    }

    return (
        // 호실 등록 · 수정
        <Modal open title={room ? `호실 수정 — ${room.room_name}` : '호실 등록'} onClose={onClose} footer={<><Button onClick={onClose}>취소</Button><Button variant="primary" disabled={saving} onClick={save}>{saving ? '처리 중…' : room ? '저장' : '등록'}</Button></>}>
            <div className={styles.form}>
                {/* 그룹 — 등록은 고르기, 수정은 읽기만 */}
                {room ? (
                    <Field label="객실 그룹" name="room_group_id" htmlFor="room-form-group" hint="그룹은 바꾸지 않습니다. 잘못 등록했으면 지우고 다시 등록합니다.">
                        <Input id="room-form-group" readOnly value={room.room_group_name} />
                    </Field>
                ) : (
                    <Field label="객실 그룹" name="room_group_id" htmlFor="room-form-group" hint="그룹은 등록 뒤 바꿀 수 없습니다." required>
                        <Select id="room-form-group" value={groupId} onChange={(event) => setGroupId(event.target.value)}>
                            <option value="">그룹을 고르세요</option>
                            {groups.map((group) => <option key={group.room_group_id} value={group.room_group_id}>{group.room_group_name}</option>)}
                        </Select>
                    </Field>
                )}

                {/* 호실명 · 층 */}
                <Field label="호실명" name="room_name" htmlFor="room-form-name" required>
                    <Input id="room-form-name" maxLength={ROOM_NAME_MAX} value={name} onChange={(event) => setName(event.target.value)} />
                </Field>
                <Field label="층" name="floor" htmlFor="room-form-floor" hint="-10 ~ 200, 지하는 음수(B1 = -1)" required>
                    <div className={styles.unit}><Input id="room-form-floor" type="number" min={-10} max={200} value={floor} onChange={(event) => setFloor(event.target.value)} /><span>층</span></div>
                </Field>
            </div>
        </Modal>
    );
}
