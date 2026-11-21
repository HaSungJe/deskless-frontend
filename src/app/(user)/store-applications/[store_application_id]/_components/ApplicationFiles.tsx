import Image from 'next/image';
import { ChangeEvent } from 'react';
import { STORE_FILE_PURPOSE } from '@/contracts/common/store.constants';
import { StoreMyApplicationFileResultDto } from '@/contracts/store/dto/store-my-application.dto';
import { buttonClass } from '@/shared/components/ui/button/Button';
import { FILE_MAX } from '../../store-application-format';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/ApplicationFiles.module.css';

type ApplicationFilesProps = {
    licenses: Array<StoreMyApplicationFileResultDto>;            // 사업자등록증(1장)
    images: Array<StoreMyApplicationFileResultDto>;              // 업체 사진(5장까지)
    editable: boolean;                                           // 대기 — 올리기 · 지우기
    busy: boolean;                                               // 올리는 중 · 지우는 중
    onUpload: (purpose: string, file: File) => void;             // 고른 파일 — 화면이 uploadFile · 다시 조회
    onDelete: (file: StoreMyApplicationFileResultDto) => void;   // 지우기 — 확인 창은 화면이
};

/** 고를 수 있는 형식 — JPG · PNG(DTO) */
const ACCEPT = 'image/jpeg,image/png';

/** 아이콘 — 시안 U11 상세 */
const UPLOAD_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 20h16" /></svg>;
const PLUS_ICON = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
const TRASH_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></svg>;

/**
 * 업체 정보 파일 — 사업자등록증(1장) · 업체 사진(5장까지) 칸, 대기면 올리기 · 지우기(시안 user.html U11 상세 — 사용자 결정: 이 화면 전용)
 * - 신청 파일에는 대표 · 순서가 없어 공통 ImageUploader 대신 이 부품을 쓴다. 올리기는 화면이 uploadFile 로
 *
 * @param param0
 * @returns
 */
export default function ApplicationFiles({licenses, images, editable, busy, onUpload, onDelete}: ApplicationFilesProps): React.ReactNode {
    // 계산 값
    const canAddLicense = editable && licenses.length < FILE_MAX.BUSINESS_LICENSE; // 사업자등록증 올리기
    const canAddImage = editable && images.length < FILE_MAX.STORE_IMAGE;          // 업체 사진 올리기

    // 함수
    function pick(purpose: string, event: ChangeEvent<HTMLInputElement>): void {
        // 고른 파일 한 장을 화면에 — 같은 파일을 다시 고를 수 있게 칸을 비운다
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) {
            onUpload(purpose, file);
        }
    }

    function pickLicense(event: ChangeEvent<HTMLInputElement>): void {
        // 사업자등록증
        pick(STORE_FILE_PURPOSE.LICENSE, event);
    }

    function pickImage(event: ChangeEvent<HTMLInputElement>): void {
        // 업체 사진
        pick(STORE_FILE_PURPOSE.IMAGE, event);
    }

    return (
        // 업체 정보 파일
        <section className={pageStyles.card} aria-labelledby="application-files-title">
            <h2 id="application-files-title" className={pageStyles.cardTitle}>업체 정보 파일</h2>

            {/* 사업자등록증 */}
            <div className={styles.block}>
                <div className={styles.blockHead}><span className={styles.blockTitle}>사업자등록증</span><span className={styles.count}>{licenses.length} / {FILE_MAX.BUSINESS_LICENSE}장</span></div>
                {licenses.length > 0 ? (
                    <div className={styles.grid}>
                        {licenses.map((file) => <Thumb key={file.store_file_id} file={file} label="사업자등록증" editable={editable} busy={busy} onDelete={onDelete} />)}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <span className={styles.emptyText}>아직 올린 사진이 없어요</span>
                        {canAddLicense ? (
                            <label className={`${buttonClass({})} ${busy ? styles.disabled : ''}`}>
                                <input type="file" accept={ACCEPT} className={styles.fileInput} disabled={busy} onChange={pickLicense} />
                                {UPLOAD_ICON}사업자등록증 올리기
                            </label>
                        ) : null}
                    </div>
                )}
            </div>

            {/* 업체 사진 */}
            <div className={styles.block}>
                <div className={styles.blockHead}><span className={styles.blockTitle}>업체 사진</span><span className={styles.count}>{images.length} / {FILE_MAX.STORE_IMAGE}장</span></div>
                <div className={styles.grid}>
                    {images.map((file, index) => <Thumb key={file.store_file_id} file={file} label={`업체 사진 ${index + 1}`} editable={editable} busy={busy} onDelete={onDelete} />)}
                    {canAddImage ? (
                        <label className={`${styles.add} ${busy ? styles.disabled : ''}`}>
                            <input type="file" accept={ACCEPT} className={styles.fileInput} disabled={busy} onChange={pickImage} />
                            {PLUS_ICON}사진 올리기
                        </label>
                    ) : null}
                </div>
            </div>

            {/* 안내 */}
            <p className={styles.note}>{editable ? 'JPG · PNG 사진만 올릴 수 있어요.' : '대기 중인 신청만 파일을 고칠 수 있어요.'}</p>
        </section>
    );
}

type ThumbProps = {
    file: StoreMyApplicationFileResultDto;                     // 파일
    label: string;                                             // 대체 글 · 지우기 버튼 이름
    editable: boolean;                                         // 지우기를 보일지
    busy: boolean;                                             // 지우기 막기
    onDelete: (file: StoreMyApplicationFileResultDto) => void; // 지우기
};

/**
 * 사진 한 칸 — 대기면 오른쪽 위 지우기
 *
 * @param param0
 * @returns
 */
function Thumb({file, label, editable, busy, onDelete}: ThumbProps): React.ReactNode {
    return (
        // 사진
        <div className={styles.thumb}>
            <Image src={file.file_url} alt={label} fill sizes="120px" unoptimized className={styles.img} />
            {editable ? <button type="button" className={styles.remove} aria-label={`${label} 지우기`} disabled={busy} onClick={() => onDelete(file)}>{TRASH_ICON}</button> : null}
        </div>
    );
}
