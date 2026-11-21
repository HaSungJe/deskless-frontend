import Image from 'next/image';
import { STORE_FILE_PURPOSE } from '@/contracts/common/store.constants';
import { StoreDetailFileResultDto } from '@/contracts/store/dto/store-detail.dto';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import { toKst } from '@/shared/utils/format';
import styles from '@/app/css/admin/StoreFilesCard.module.css';

/** 보일 파일 — 입점 신청 상세 · 업체 상세 파일의 같은 칸 */
type StoreFileViewType = Pick<StoreDetailFileResultDto, 'store_file_id' | 'store_file_purpose_id' | 'file_name' | 'content_type' | 'is_private' | 'file_url' | 'created_at'>;

type StoreFilesCardProps = {
    files: Array<StoreFileViewType>; // 용도 · 정렬 순서대로 온 파일
    markFirst?: boolean;             // 업체 사진 첫 장에 "대표"(업체 상세 — 정렬 0 이 대표)
};

/**
 * 업체 정보 파일 보기 — 사업자등록증(새 창 · 비공개면 10분 안내) · 업체 사진(정렬 순서). 관리자는 보기만
 *
 * @param param0
 * @returns
 */
export default function StoreFilesCard({files, markFirst = false}: StoreFilesCardProps): React.ReactNode {
    // 계산 값
    const licenses = files.filter((file) => file.store_file_purpose_id === STORE_FILE_PURPOSE.LICENSE); // 사업자등록증
    const images = files.filter((file) => file.store_file_purpose_id === STORE_FILE_PURPOSE.IMAGE);     // 업체 사진

    return (
        // 업체 정보 파일
        <Card title="업체 정보 파일">
            {/* 사업자등록증 */}
            <div className={styles.block}>
                <h3 className={styles.blockTitle}>사업자등록증</h3>
                {licenses.length === 0 ? <p className={styles.muted}>사업자등록증이 없습니다.</p> : null}
                {licenses.map((file) => (
                    <div key={file.store_file_id} className={styles.license}>
                        <p className={styles.meta}>{file.file_name} · {file.content_type} · {toKst(file.created_at, 'YYYY-MM-DD HH:mm')}{file.is_private === 1 ? <Badge tone="neutral">비공개</Badge> : null}</p>
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer" className={styles.open}>새 창으로 열기</a>
                        {file.is_private === 1 ? <p className={styles.muted}>비공개 파일이라 열람 주소가 10분 뒤 닫힙니다. 열리지 않으면 이 화면을 새로고침하세요.</p> : null}
                    </div>
                ))}
            </div>

            {/* 업체 사진 */}
            <div className={styles.block}>
                <h3 className={styles.blockTitle}>업체 사진 <span className={styles.muted}>{images.length}장 · 정렬 순서대로</span></h3>
                {images.length === 0 ? <p className={styles.muted}>업체 사진이 없습니다.</p> : null}
                <div className={styles.grid}>
                    {images.map((file, index) => (
                        <figure key={file.store_file_id} className={styles.figure}>
                            <div className={styles.thumb}><Image src={file.file_url} alt={file.file_name} fill sizes="160px" unoptimized className={styles.img} /></div>
                            <figcaption className={styles.caption}>{markFirst && index === 0 ? <Badge tone="primary">대표</Badge> : null}{file.file_name}</figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </Card>
    );
}
