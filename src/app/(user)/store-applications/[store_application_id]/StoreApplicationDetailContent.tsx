'use client';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { cancelStoreApplication, deleteStoreApplicationFile, getMyStoreApplication, issueStoreApplicationFileUrl, registerStoreApplicationFile } from '@/contracts/store/api';
import { StoreApplicationFileUploadUrlDto } from '@/contracts/store/dto/store-application-file-upload-url.dto';
import { StoreApplicationFileDto, StoreApplicationFileResultDto } from '@/contracts/store/dto/store-application-file.dto';
import { StoreMyApplicationFileResultDto, StoreMyApplicationResultDto } from '@/contracts/store/dto/store-my-application.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import { ApiError } from '@/shared/api/request';
import { uploadFile, UploadStepsType } from '@/shared/api/upload';
import Button from '@/shared/components/ui/button/Button';
import CopyButton from '@/shared/components/ui/button/CopyButton';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatBusinessNumber, formatKoreanDate, formatPhone } from '@/shared/utils/format';
import UserTopBar from '../../_components/UserTopBar';
import { storeConsoleLoginUrl } from '@/app/manager/manager-auth';
import { APPLICATION_STATE, applicationStateTone, FILE_PURPOSE } from '../store-application-format';
import ApplicationFiles from './_components/ApplicationFiles';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/StoreApplicationDetailContent.module.css';

type StoreApplicationDetailContentProps = {
    applicationId: string; // 주소의 입점 신청 ID
};

/** 없는 · 남의 신청 */
const APPLICATION_NOT_FOUND_MESSAGE = '입점 신청을 찾을 수 없습니다.';

/** 신청 취소 뒤 */
const APPLICATION_CANCELED_MESSAGE = '입점 신청을 취소했어요.';

/** 신청 목록 */
const LIST_PATH = '/store-applications/';

/**
 * 없는 · 남의 신청 응답인지(404 · 400)
 *
 * @param error 상세 조회 실패
 */
function isNotFoundError(error: unknown): boolean {
    return error instanceof ApiError && (error.status === 404 || error.status === 400);
}

/**
 * 신청이 없어졌는지 — 취소 큐 결과가 null(done · pending 같음)이라 상세를 다시 읽어 확인한다(컴포넌트 밖 — React Compiler 가 try 안 값 계산을 건너뛴다)
 *
 * @param read 상세 다시 읽기
 * @returns 없으면(404 · 400 · 빈 응답) true, 남아 있거나 확인하지 못하면 false
 */
async function isApplicationGone(read: () => Promise<StoreMyApplicationResultDto | null>): Promise<boolean> {
    try {
        return !(await read());
    } catch (error) {
        return isNotFoundError(error);
    }
}

/**
 * U11 입점 신청 상세 — 상태 띠 · (승인) 업체 콘솔 · 파일 · 신청 내용, 대기면 파일 올리기 · 지우기 · 신청 취소
 *
 * @param param0
 * @returns
 */
export default function StoreApplicationDetailContent({applicationId}: StoreApplicationDetailContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                                                                       // 취소 뒤 · 없는 신청이면 목록
    const auth = useContext(AuthContext);                                                             // 이용자 토큰
    const loadDetail = useEffectEvent((signal: AbortSignal) => getMyStoreApplication(auth, applicationId, signal)); // 그때의 auth 로
    const leaveNotFound = useEffectEvent((): void => {
        showErrorPopup(APPLICATION_NOT_FOUND_MESSAGE);
        router.replace(LIST_PATH);
    });                                                                                               // 없는 신청 — 안내 뒤 목록

    // 상태
    const [detail, setDetail] = useState<StoreMyApplicationResultDto | null>(null);         // 신청 상세
    const [reloadKey, setReloadKey] = useState<number>(0);                                  // 다시 불러오기(올리기 · 지우기 뒤)
    const [busy, setBusy] = useState<boolean>(false);                                       // 올리는 중 · 지우는 중 · 취소 중
    const [deleting, setDeleting] = useState<StoreMyApplicationFileResultDto | null>(null); // 지울 파일 — 확인 창
    const [cancelOpen, setCancelOpen] = useState<boolean>(false);                           // 신청 취소 확인 창

    // 계산 값
    const state = detail?.store_application_state_id ?? '';                                                      // 신청 상태
    const editable = state === APPLICATION_STATE.WAIT;                                                           // 대기 — 파일 · 취소
    const files = detail?.files ?? [];                                                                           // 업체 정보 파일
    const licenses = files.filter((file) => file.store_file_purpose_id === FILE_PURPOSE.LICENSE);               // 사업자등록증
    const images = files.filter((file) => file.store_file_purpose_id === FILE_PURPOSE.IMAGE);                   // 업체 사진
    const consoleUrl = detail?.store_code ? storeConsoleLoginUrl(detail.store_code) : '';                        // 업체 콘솔 로그인 주소(승인)
    const summaryMeta = editable ? `신청일 ${formatKoreanDate(detail?.created_at)} · 관리자가 확인하고 있어요` : `신청일 ${formatKoreanDate(detail?.created_at)} · 처리일 ${formatKoreanDate(detail?.reviewed_at)}`; // 요약 둘째 줄

    // 효과
    useEffect(() => {
        // ① 상세 — 없거나 남의 신청이면 목록(떠나면 취소)
        const controller = new AbortController();
        loadDetail(controller.signal).then((next) => {
            if (controller.signal.aborted) {
                return;
            }

            if (!next) {
                leaveNotFound();
                return;
            }

            setDetail(next);
        }).catch((error: unknown) => {
            if (controller.signal.aborted) {
                return;
            }

            if (isNotFoundError(error)) {
                leaveNotFound();
                return;
            }

            handleApiError(error);
        });

        return () => {
            controller.abort();
        };
    }, [applicationId, reloadKey]);

    // 함수
    function reload(): void {
        // 상세 다시
        setReloadKey((key) => key + 1);
    }

    async function upload(purpose: string, file: File): Promise<void> {
        // ③ 올리기 — 업로드 주소 발급 → PUT → 등록(큐) → 상세 다시(성공 · 실패 · 늦어짐 모두)
        const steps: UploadStepsType<StoreApplicationFileResultDto> = {
            issue: (content_type) => issueStoreApplicationFileUrl(auth, applicationId, Object.assign(new StoreApplicationFileUploadUrlDto(), {store_file_purpose_id: purpose, content_type})),
            register: (uploaded) => registerStoreApplicationFile(auth, applicationId, Object.assign(new StoreApplicationFileDto(), {store_file_purpose_id: purpose, ...uploaded})),
        };
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await uploadFile(file, steps);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error);
        }
        reload();
    }

    async function confirmDelete(): Promise<void> {
        // ③ 지우기 — 확인 뒤 큐 → 상세 다시
        const target = deleting;
        if (!target) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteStoreApplicationFile(auth, applicationId, target.store_file_id);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setDeleting(null);
        if (failure) {
            handleApiError(failure.error);
        }
        reload();
    }

    async function confirmCancel(): Promise<void> {
        // ④ 신청 취소 — 확인 뒤 큐 → 상세를 다시 읽어 없어졌으면 목록, 남아 있으면 늦어짐 · 상세 다시(실패면 창을 닫고 상세 다시)
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await cancelStoreApplication(auth, applicationId);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setBusy(false);
            setCancelOpen(false);
            handleApiError(failure.error);
            reload();
            return;
        }

        const gone = await isApplicationGone(() => getMyStoreApplication(auth, applicationId));
        if (gone) {
            showErrorPopup(APPLICATION_CANCELED_MESSAGE);
            router.replace(LIST_PATH);
            return;
        }

        setBusy(false);
        setCancelOpen(false);
        showErrorPopup(QUEUE_PENDING_MESSAGE);
        reload();
    }

    return (
        // 입점 신청 상세
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="입점 신청 상세" backHref={LIST_PATH} />

            {detail ? (
                <>
                    {/* ② 요약 */}
                    <section className={styles.summary}>
                        <div className={styles.summaryHead}>
                            <h2 className={styles.storeName}>{detail.store_name}</h2>
                            <Badge tone={applicationStateTone(state)}>{lookupName('store_application_state_id', state)}</Badge>
                        </div>
                        <span className={styles.meta}>{summaryMeta}</span>
                    </section>

                    {/* ② 상태 띠 — 대기 · 사업자등록증 없음 / 반려 사유 / 승인 */}
                    {editable && licenses.length === 0 ? <Band tone="warn" title="사업자등록증 사진이 아직 없어요.">사진이 있어야 관리자가 승인할 수 있어요.</Band> : null}
                    {state === APPLICATION_STATE.REJECTED ? <Band tone="danger" title="반려된 신청이에요">{detail.reject_comment ?? '반려 사유가 없어요.'}</Band> : null}
                    {detail.store_code ? <Band tone="ok" title="입점이 승인되었어요.">아래 주소에서 업체 관리자 콘솔에 로그인할 수 있어요.</Band> : null}

                    <div className={pageStyles.body}>
                        {/* ② 업체 관리자 콘솔(승인) */}
                        {detail.store_code ? (
                            <section className={pageStyles.card} aria-labelledby="application-console-title">
                                <h2 id="application-console-title" className={pageStyles.cardTitle}>업체 관리자 콘솔</h2>
                                <div className={pageStyles.stack}>
                                    <span className={styles.fieldLabel}>업체코드</span>
                                    <span className={pageStyles.mono}>{detail.store_code}</span>
                                </div>
                                <div className={pageStyles.stack}>
                                    <span className={styles.fieldLabel}>업체 관리자 콘솔 로그인 주소</span>
                                    <span className={styles.urlBox}>{consoleUrl}</span>
                                </div>
                                <p className={styles.text}>이 주소에서 신청 때 정한 아이디 · 비밀번호로 로그인하세요.</p>
                                <CopyButton text={consoleUrl} label="로그인 주소 복사" size="md" variant="primary" full />
                            </section>
                        ) : null}

                        {/* ③ 업체 정보 파일 */}
                        <ApplicationFiles licenses={licenses} images={images} editable={editable} busy={busy} onUpload={upload} onDelete={setDeleting} />

                        {/* ⑤ 신청 내용 */}
                        <section className={pageStyles.card} aria-labelledby="application-content-title">
                            <h2 id="application-content-title" className={pageStyles.cardTitle}>신청 내용</h2>
                            <dl className={`${pageStyles.dl} ${styles.contentDl}`}>
                                <dt>상호명</dt><dd>{detail.store_name}</dd>
                                <dt>사업자등록번호</dt><dd>{formatBusinessNumber(detail.business_number)}</dd>
                                <dt>대표자명</dt><dd>{detail.owner_name}</dd>
                                <dt>대표자 휴대폰</dt><dd>{formatPhone(detail.owner_phone)}</dd>
                                <dt>총관리자 아이디</dt><dd>{detail.head_manager_login_id}</dd>
                                <dt>업체 연락처</dt><dd>{formatPhone(detail.phone)}</dd>
                                <dt>주소</dt><dd>{detail.address_detail ? `${detail.address}, ${detail.address_detail}` : detail.address}</dd>
                                <dt>남길 말</dt><dd>{detail.application_comment ?? '없음'}</dd>
                            </dl>
                        </section>
                    </div>

                    {/* ④ 신청 취소(대기만) */}
                    {editable ? (
                        <div className={pageStyles.footer}>
                            <Button variant="danger" size="lg" full disabled={busy} onClick={() => setCancelOpen(true)}>신청 취소</Button>
                        </div>
                    ) : null}

                    {/* 확인 창 — 사진 지우기 · 신청 취소 */}
                    <ConfirmModal open={deleting !== null} title="사진 지우기" message="이 사진을 지울까요?" confirmLabel="지우기" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
                    <ConfirmModal open={cancelOpen} title="신청 취소" message="입점 신청을 취소할까요? 올린 파일도 함께 지워져요." confirmLabel="신청 취소" danger busy={busy} onConfirm={confirmCancel} onClose={() => setCancelOpen(false)} />
                </>
            ) : null}
        </div>
    );
}
