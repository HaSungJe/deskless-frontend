'use client';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { deleteRoom, getRoomGroups, getRooms, openRoomDoor } from '@/contracts/room/api';
import { RoomDoorOpenResultDto } from '@/contracts/room/dto/room-door-open.dto';
import { RoomGroupListDto, RoomGroupListItemResultDto } from '@/contracts/room/dto/room-group-list.dto';
import { RoomListDto, RoomListItemResultDto, RoomListResultDto } from '@/contracts/room/dto/room-list.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Select from '@/shared/components/ui/form/Select';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import RoomFormModal from './_components/RoomFormModal';
import RoomStateModal from './_components/RoomStateModal';
import { floorLabel, formatOpenedAt, ROOM_STATE_TONE } from './room-format';
import styles from '@/app/css/manager/RoomsContent.module.css';

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/**
 * M4 호실 — 층 · 그룹 거르기 · 호실 표 · 등록 / 수정 대화상자 · 상태 대화상자 · 문 바로 열기 · 삭제
 * - 거르기 칸은 검사 칸이 아니라 Field 없이 그린다(대화상자의 room_group_id · floor 오류 칸과 겹치지 않게)
 * - 문 열기는 목록을 다시 부르지 않고 그 줄만 받은 시각으로 바꾼다
 *
 * @returns
 */
export default function RoomsContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                                // 매니저 토큰
    const loadRooms = useEffectEvent((query: RoomListDto, signal: AbortSignal) => getRooms(auth, query, signal));                        // 그때의 auth 로
    const loadGroups = useEffectEvent((signal: AbortSignal) => getRoomGroups(auth, new RoomGroupListDto({all_search_yn: 'Y'}), signal)); // 그룹 전체

    // 상태
    const [floor, setFloor] = useState<string>('');                                     // ① 층 거르기 — '' 전체
    const [groupId, setGroupId] = useState<string>('');                                 // ① 그룹 거르기 — '' 전체
    const [page, setPage] = useState<number>(1);                                        // 보는 쪽
    const [reloadKey, setReloadKey] = useState<number>(0);                              // ⑥ 지금 쪽 다시
    const [result, setResult] = useState<RoomListResultDto | null>(null);               // ① 목록 · 층 선택지
    const [groups, setGroups] = useState<Array<RoomGroupListItemResultDto>>([]);        // ① 그룹 전체 — 거르기 · 등록 고르기
    const [editing, setEditing] = useState<RoomListItemResultDto | 'new' | null>(null); // ③ 등록 · 고칠 호실 · 닫힘
    const [stateTarget, setStateTarget] = useState<RoomListItemResultDto | null>(null); // ④ 상태 대화상자
    const [deleting, setDeleting] = useState<RoomListItemResultDto | null>(null);       // ⑥ 삭제 확인 창
    const [busy, setBusy] = useState<boolean>(false);                                   // ⑥ 삭제 중
    const [opening, setOpening] = useState<string | null>(null);                        // ⑤ 문을 여는 호실 ID

    // 계산 값
    const floors = result?.floors ?? []; // ① 층 선택지 — 늘 전부

    // 효과
    useEffect(() => {
        // ① 그 쪽 · 거르기 호실(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadRooms(new RoomListDto({page, size: PAGE_SIZE, floor: floor || null, room_group_id: groupId || null}), controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult(next);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [page, floor, groupId, reloadKey]);

    useEffect(() => {
        // ① 그룹 전체 — 한 번
        const controller = new AbortController();
        loadGroups(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setGroups(next?.list ?? []);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, []);

    // 함수
    function changeFloor(value: string): void {
        // ① 층 거르기 → 1쪽
        setFloor(value);
        setPage(1);
    }

    function changeGroup(value: string): void {
        // ① 그룹 거르기 → 1쪽
        setGroupId(value);
        setPage(1);
    }

    function resetFilter(): void {
        // ① 초기화
        setFloor('');
        setGroupId('');
        setPage(1);
    }

    function onSaved(): void {
        // ③④⑥ 끝나면 대화상자를 닫고 지금 쪽 다시
        setEditing(null);
        setStateTarget(null);
        setReloadKey((key) => key + 1);
    }

    async function openDoor(room: RoomListItemResultDto): Promise<void> {
        // ⑤ 문 바로 열기(동기) → 그 줄의 마지막으로 연 시각만 바꾼다
        if (opening !== null) {
            return;
        }

        setOpening(room.room_id);
        let opened: RoomDoorOpenResultDto | null = null; // 받은 시각
        let failure: {error: unknown} | null = null;     // 실패 — 처리는 try 밖에서
        try {
            opened = await openRoomDoor(auth, room.room_id);
        } catch (error) {
            failure = {error};
        }

        setOpening(null);
        if (failure) {
            handleApiError(failure.error); // 503 — 받은 문구
            return;
        }

        if (opened) {
            const openedAt = opened.door_opened_at;
            setResult((prev) => (prev ? {...prev, list: prev.list.map((item) => (item.room_id === room.room_id ? {...item, door_opened_at: openedAt} : item))} : prev));
        }
    }

    async function confirmDelete(): Promise<void> {
        // ⑥ 확인 뒤 삭제(큐) → 지금 쪽 다시
        const target = deleting;
        if (!target) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteRoom(auth, target.room_id);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setDeleting(null);
        if (failure) {
            handleApiError(failure.error); // 예약이 있으면 받은 문구
            return;
        }
        onSaved();
    }

    return (
        // 호실
        <div className={styles.page}>
            {/* 머리 */}
            <div className={styles.head}>
                <div>
                    <h1 className={styles.title}>호실</h1>
                    <p className={styles.subtitle}>호실마다 상태와 문을 관리합니다. 그룹은 등록 때만 정합니다.</p>
                </div>
                <Button variant="primary" onClick={() => setEditing('new')}>호실 등록</Button>
            </div>

            {/* ① 거르기 */}
            <div className={styles.filters}>
                <div className={styles.floorFilter}>
                    <label className={styles.label} htmlFor="rooms-floor">층</label>
                    <Select id="rooms-floor" value={floor} onChange={(event) => changeFloor(event.target.value)}>
                        <option value="">전체</option>
                        {floors.map((item) => <option key={item} value={String(item)}>{floorLabel(item)}</option>)}
                    </Select>
                </div>
                <div className={styles.groupFilter}>
                    <label className={styles.label} htmlFor="rooms-group">객실 그룹</label>
                    <Select id="rooms-group" value={groupId} onChange={(event) => changeGroup(event.target.value)}>
                        <option value="">전체</option>
                        {groups.map((group) => <option key={group.room_group_id} value={group.room_group_id}>{group.room_group_name}</option>)}
                    </Select>
                </div>
                <Button onClick={resetFilter}>초기화</Button>
            </div>

            {/* ② 안내 띠 */}
            <Band tone="info">사용중지로 바꾸면 그 호실 예약자는 예약 끝 전까지 전액 환불 취소를 할 수 있습니다. 앞으로의 예약이 있는 호실은 삭제할 수 없습니다. 문 열기는 문 쪽 프로그램이 연결돼 있어야 합니다.</Band>

            {/* ② 표 */}
            {result && result.list.length === 0 ? <EmptyState title="호실이 없습니다." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">호실</th><th scope="col">층</th><th scope="col">객실 그룹</th><th scope="col">호실 상태</th><th scope="col">마지막으로 연 시각</th><th scope="col">작업</th></tr></thead>
                    <tbody>
                        {result.list.map((room) => (
                            <tr key={room.room_id}>
                                <td><b>{room.room_name}</b></td>
                                <td>{floorLabel(room.floor)}</td>
                                <td>{room.room_group_name}</td>
                                <td><Badge tone={ROOM_STATE_TONE[room.room_state_id] ?? 'neutral'}>{room.room_state_name}</Badge></td>
                                <td className={styles.number}>{formatOpenedAt(room.door_opened_at)}</td>
                                <td>
                                    <div className={styles.acts}>
                                        <Button size="sm" onClick={() => setEditing(room)}>수정</Button>
                                        <Button size="sm" onClick={() => setStateTarget(room)}>상태</Button>
                                        <Button size="sm" disabled={opening !== null} onClick={() => openDoor(room)}>{opening === room.room_id ? '여는 중…' : '문 열기'}</Button>
                                        <Button size="sm" variant="danger" onClick={() => setDeleting(room)}>삭제</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="호실 페이지" />

            {/* ③ 등록 · 수정 — 열 때마다 새 칸 */}
            {editing !== null ? <RoomFormModal key={editing === 'new' ? 'new' : editing.room_id} room={editing === 'new' ? null : editing} groups={groups} onClose={() => setEditing(null)} onSaved={onSaved} /> : null}

            {/* ④ 상태 */}
            {stateTarget ? <RoomStateModal key={stateTarget.room_id} room={stateTarget} onClose={() => setStateTarget(null)} onSaved={onSaved} /> : null}

            {/* ⑥ 삭제 확인 */}
            <ConfirmModal open={deleting !== null} title="호실 삭제" message={`'${deleting?.room_name ?? ''}' 호실을 삭제할까요?`} confirmLabel="삭제" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </div>
    );
}
