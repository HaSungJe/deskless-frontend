'use client';
import Image from 'next/image';
import { useContext, useState } from 'react';
import { deleteMyStoreFile, issueMyStoreFileUrl, registerMyStoreFile, reorderMyStoreFiles } from '@/contracts/store/api';
import { StoreMineFileOrderDto } from '@/contracts/store/dto/store-mine-file-order.dto';
import { StoreMineFileUploadUrlDto } from '@/contracts/store/dto/store-mine-file-upload-url.dto';
import { StoreMineFileDto, StoreMineFileResultDto } from '@/contracts/store/dto/store-mine-file.dto';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { handleApiError } from '@/shared/api/error';
import { uploadFile, UploadStepsType } from '@/shared/api/upload';
import ImageUploader, { UploaderImageType } from '@/shared/components/upload/ImageUploader';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { STORE_FILE_PURPOSE, STORE_IMAGE_MAX } from '../store-settings-format';
import styles from '@/app/css/manager/StorePhotosTab.module.css';

type StorePhotosTabProps = {
    store: StoreMineResultDto;    // 내 업체 상세 — files
    onSaved: () => Promise<void>; // 올리기 · 순서 · 삭제 뒤 다시 읽기
};

/**
 * 사진 탭 — 업체 사진(5장 · 첫 장 대표) 올리기 · 끌어서 순서 · 삭제, 사업자등록증은 보기만
 * - ImageUploader 는 onUpload 가 던진 오류를 다시 던진다 — 이 탭이 잡아 안내한다
 *
 * @param param0
 * @returns
 */
export default function StorePhotosTab({store, onSaved}: StorePhotosTabProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [busy, setBusy] = useState<boolean>(false);              // 순서 · 삭제 중
    const [deleting, setDeleting] = useState<string | null>(null); // 지울 사진 ID — 확인 창

    // 계산 값
    const images: Array<UploaderImageType> = store.files
        .filter((file) => file.store_file_purpose_id === STORE_FILE_PURPOSE.IMAGE)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((file) => ({id: file.store_file_id, image_url: file.file_url, alt: file.file_name}));                    // ① 업체 사진 — 순서대로
    const license = store.files.find((file) => file.store_file_purpose_id === STORE_FILE_PURPOSE.LICENSE) ?? null; // ⑤ 사업자등록증

    // 함수
    async function upload(file: File): Promise<void> {
        // ② 업로드 주소 발급 → PUT → 등록(큐) → 다시 읽기 — 실패는 여기서 안내(부품이 다시 던지지 않게)
        const steps: UploadStepsType<StoreMineFileResultDto> = {
            issue: (content_type) => issueMyStoreFileUrl(auth, Object.assign(new StoreMineFileUploadUrlDto(), {content_type})),
            register: (uploaded) => registerMyStoreFile(auth, Object.assign(new StoreMineFileDto(), uploaded)),
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
        await onSaved();
    }

    async function reorder(ids: Array<string>): Promise<void> {
        // ③ 사진 ID 전부를 바꾼 순서로 저장(큐) → 다시 읽기(실패해도 서버 순서로 되돌린다)
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await reorderMyStoreFiles(auth, Object.assign(new StoreMineFileOrderDto(), {store_file_ids: ids}));
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
        }
        await onSaved();
        setBusy(false);
    }

    async function confirmDelete(): Promise<void> {
        // ④ 확인 뒤 삭제(큐) → 다시 읽기
        const target = deleting;
        if (!target) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteMyStoreFile(auth, target);
        } catch (error) {
            failure = {error};
        }

        setDeleting(null);
        if (failure) {
            handleApiError(failure.error);
        }
        await onSaved();
        setBusy(false);
    }

    return (
        // 사진
        <div className={styles.tab}>
            {/* ①②③④ 업체 사진 */}
            <Card title={`업체 사진 ${images.length} / ${STORE_IMAGE_MAX}`}>
                <p className={styles.hint}>끌어서 순서를 바꾸면 그 순서로 저장합니다. 첫 번째가 대표 사진(이용자 화면 지도 · 목록에 나옵니다).</p>
                <ImageUploader images={images} max={STORE_IMAGE_MAX} onUpload={upload} onDelete={setDeleting} onReorder={reorder} disabled={busy} />
                <p className={styles.hint}>입점 승인 때 넘어온 사진도 5장에 포함됩니다.</p>
            </Card>

            {/* ⑤ 사업자등록증 — 보기만 */}
            <Card title="사업자등록증" actions={<Badge>보기만</Badge>}>
                {license ? (
                    <div className={styles.license}>
                        <span className={styles.licenseImage}><Image src={license.file_url} alt="사업자등록증" fill sizes="140px" unoptimized className={styles.img} /></span>
                        <div className={styles.licenseText}>
                            <b>{license.file_name}</b>
                            <span className={styles.hint}>등록 {toKst(license.created_at, 'YYYY-MM-DD')} · 비공개 파일 — 열어 보기 주소는 10분 동안만 열립니다.</span>
                            <a className={styles.open} href={license.file_url} target="_blank" rel="noopener noreferrer">열어 보기</a>
                            <span className={styles.hint}>바꾸거나 지울 수 없습니다. 바꿔야 하면 총관리자에게 요청합니다.</span>
                        </div>
                    </div>
                ) : <p className={styles.hint}>사업자등록증이 없습니다.</p>}
            </Card>

            {/* ④ 삭제 확인 */}
            <ConfirmModal open={deleting !== null} title="사진 지우기" message="이 사진을 지울까요?" confirmLabel="지우기" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </div>
    );
}
