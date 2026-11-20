'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { ROOM_PLAN_TYPE } from '@/contracts/common/room.constants';
import { deleteRoomGroup, getRoomGroup } from '@/contracts/room/api';
import { RoomGroupDetailResultDto } from '@/contracts/room/dto/room-group-detail.dto';
import { handleApiError } from '@/shared/api/error';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { ROOM_GROUP_LIST_PATH, roomsText } from '../room-group-format';
import RoomGroupInfoCard from './_components/RoomGroupInfoCard';
import RoomGroupPhotos from './_components/RoomGroupPhotos';
import RoomGroupPlans from './_components/RoomGroupPlans';
import RoomGroupPrices from './_components/RoomGroupPrices';
import styles from '@/app/css/manager/RoomGroupDetailContent.module.css';

type RoomGroupDetailContentProps = {
    roomGroupId: string; // 주소의 그룹 ID
};

/**
 * M5 객실 그룹 상세 — 머리(호실 · 등록 · 수정) · 기본 정보 · 사진 · 그룹 상품 · 상품별 기간 가격 · 그룹 삭제
 * - 기본 정보 · 그룹 상품 칸은 그룹이 바뀔 때만(key) 받은 값으로 채운다 — 사진을 올려 다시 불러와도 고치던 칸이 남는다
 *
 * @param param0
 * @returns
 */
export default function RoomGroupDetailContent({roomGroupId}: RoomGroupDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                               // 매니저 토큰
    const router = useRouter();                                                                         // 삭제 뒤 목록으로
    const loadGroup = useEffectEvent((signal: AbortSignal) => getRoomGroup(auth, roomGroupId, signal)); // 그때의 auth · 그룹으로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                     // ⑤ 다시 불러오기
    const [group, setGroup] = useState<RoomGroupDetailResultDto | null>(null); // ① 그룹 상세
    const [failed, setFailed] = useState<boolean>(false);                      // ① 못 읽음
    const [priceType, setPriceType] = useState<string>(ROOM_PLAN_TYPE.HOURLY); // 기간 가격 절의 상품 — 화면 상태
    const [deleting, setDeleting] = useState<boolean>(false);                  // ⑥ 삭제 확인 창
    const [busy, setBusy] = useState<boolean>(false);                          // ⑥ 삭제 중

    // 효과
    useEffect(() => {
        // ① 그룹 상세(그룹이 바뀌거나 다시 부를 때 · 떠나면 결과를 버린다)
        const controller = new AbortController();
        loadGroup(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setGroup(next);
                setFailed(next === null);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setFailed(true);
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [roomGroupId, reloadKey]);

    // 함수
    function reloadGroup(): void {
        // ⑤ 다시 불러오기
        setReloadKey((key) => key + 1);
    }

    async function confirmDelete(): Promise<void> {
        // ⑥ 확인 뒤 삭제(큐) → 목록으로
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteRoomGroup(auth, roomGroupId);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setDeleting(false);
        if (failure) {
            handleApiError(failure.error); // 예약이 있으면 받은 문구
            return;
        }

        router.push(ROOM_GROUP_LIST_PATH);
    }

    if (!group) {
        return failed ? (
            // ① 못 읽음
            <EmptyState title="객실 그룹을 불러오지 못했어요" description="지워졌거나 잠시 연결이 안 됩니다." action={<Link href={ROOM_GROUP_LIST_PATH} className={buttonClass({size: 'sm'})}>목록으로</Link>} />
        ) : null;
    }

    return (
        // 객실 그룹 상세
        <div className={styles.page}>
            {/* ① 머리 */}
            <div className={styles.head}>
                <div>
                    <p className={styles.crumb}><Link href={ROOM_GROUP_LIST_PATH}>객실 그룹</Link> › {group.room_group_name}</p>
                    <h1 className={styles.title}>{group.room_group_name}</h1>
                    <p className={styles.subtitle}>{roomsText(group)} · 등록 {toKst(group.created_at, 'YYYY-MM-DD')} · 수정 {toKst(group.updated_at, 'YYYY-MM-DD HH:mm')}</p>
                </div>
                <Button variant="danger" onClick={() => setDeleting(true)}>그룹 삭제</Button>
            </div>

            {/* ② 기본 정보 · ③ 사진 */}
            <div className={styles.cols}>
                <RoomGroupInfoCard key={group.room_group_id} group={group} onSaved={reloadGroup} />
                <RoomGroupPhotos group={group} onSaved={reloadGroup} />
            </div>

            {/* ④ 그룹 상품 */}
            <RoomGroupPlans key={group.room_group_id} group={group} onSaved={reloadGroup} onShowPrices={setPriceType} />

            {/* 상품별 기간 가격 — 상품이 바뀌면 1쪽부터 */}
            <RoomGroupPrices key={`${group.room_group_id}-${priceType}`} roomGroupId={group.room_group_id} plans={group.plans} type={priceType} onTypeChange={setPriceType} onChanged={reloadGroup} />

            {/* ⑥ 삭제 확인 */}
            <ConfirmModal open={deleting} title="그룹 삭제" message={`${group.room_group_name} 그룹을 삭제할까요? 그룹의 호실 · 사진도 함께 지워집니다.`} confirmLabel="삭제" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(false)} />
        </div>
    );
}
