'use client';
import { useContext, useState } from 'react';
import { deleteRoomGroupImage, issueRoomGroupImageUrl, registerRoomGroupImage, reorderRoomGroupImages } from '@/contracts/room/api';
import { RoomGroupDetailResultDto } from '@/contracts/room/dto/room-group-detail.dto';
import { RoomGroupImageOrderDto } from '@/contracts/room/dto/room-group-image-order.dto';
import { RoomGroupImageUploadUrlDto } from '@/contracts/room/dto/room-group-image-upload-url.dto';
import { RoomGroupImageDto, RoomGroupImageResultDto } from '@/contracts/room/dto/room-group-image.dto';
import { handleApiError } from '@/shared/api/error';
import { uploadFile, UploadStepsType } from '@/shared/api/upload';
import ImageUploader, { UploaderImageType } from '@/shared/components/upload/ImageUploader';
import Card from '@/shared/components/ui/display/Card';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { ROOM_GROUP_IMAGE_MAX } from '../../room-group-format';
import styles from '@/app/css/manager/RoomGroupDetailContent.module.css';

type RoomGroupPhotosProps = {
    group: RoomGroupDetailResultDto; // 그룹 상세 — images
    onSaved: () => void;             // 올리기 · 순서 · 삭제 뒤 상세 다시
};

/**
 * 사진 카드 — 그룹 사진(5장 · 첫 장 대표) 올리기 · 끌어서 순서 · 삭제(내 업체 사진 탭과 같은 흐름)
 * - ImageUploader 는 onUpload 가 던진 오류를 다시 던진다 — 이 카드가 잡아 안내한다
 *
 * @param param0
 * @returns
 */
export default function RoomGroupPhotos({group, onSaved}: RoomGroupPhotosProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [busy, setBusy] = useState<boolean>(false);              // 순서 · 삭제 중
    const [deleting, setDeleting] = useState<string | null>(null); // 지울 사진 ID — 확인 창

    // 계산 값
    const images: Array<UploaderImageType> = [...group.images]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((image) => ({id: image.room_group_image_id, image_url: image.image_url, alt: image.file_name})); // ③ 그룹 사진 — 순서대로

    // 함수
    async function upload(file: File): Promise<void> {
        // ③ 업로드 주소 발급 → PUT → 등록(큐) → ⑤ 상세 다시 — 실패는 여기서 안내(부품이 다시 던지지 않게)
        const steps: UploadStepsType<RoomGroupImageResultDto> = {
            issue: (content_type) => issueRoomGroupImageUrl(auth, group.room_group_id, Object.assign(new RoomGroupImageUploadUrlDto(), {content_type})),
            register: (uploaded) => registerRoomGroupImage(auth, group.room_group_id, Object.assign(new RoomGroupImageDto(), uploaded)),
        };
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await uploadFile(file, steps);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
        }
        onSaved();
    }

    async function reorder(ids: Array<string>): Promise<void> {
        // ③ 사진 ID 전부를 바꾼 순서로 저장(큐) → ⑤ 상세 다시(실패해도 서버 순서로 되돌린다)
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await reorderRoomGroupImages(auth, group.room_group_id, Object.assign(new RoomGroupImageOrderDto(), {room_group_image_ids: ids}));
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error);
        }
        onSaved();
    }

    async function confirmDelete(): Promise<void> {
        // ③ 확인 뒤 삭제(큐) → ⑤ 상세 다시
        const target = deleting;
        if (!target) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteRoomGroupImage(auth, group.room_group_id, target);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setDeleting(null);
        if (failure) {
            handleApiError(failure.error);
        }
        onSaved();
    }

    return (
        // 사진
        <Card title={`사진 ${images.length} / ${ROOM_GROUP_IMAGE_MAX}`}>
            {/* ③ 그룹 사진 */}
            <p className={styles.hint}>끌어서 순서를 바꾸면 그 순서로 저장합니다. 첫 번째가 대표 사진.</p>
            <ImageUploader images={images} max={ROOM_GROUP_IMAGE_MAX} onUpload={upload} onDelete={setDeleting} onReorder={reorder} disabled={busy} />

            {/* ③ 삭제 확인 */}
            <ConfirmModal open={deleting !== null} title="사진 지우기" message="이 사진을 지울까요?" confirmLabel="지우기" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </Card>
    );
}
