'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { storeConsoleLoginUrl } from '@/app/manager/manager-auth';
import { lookupName } from '@/contracts/common/lookup';
import { applicationStateTone } from '@/contracts/common/store.constants';
import { approveStoreApplication, getStoreApplication, rejectStoreApplication } from '@/contracts/store/api';
import { StoreApplicationApproveResultDto } from '@/contracts/store/dto/store-application-approve.dto';
import { StoreApplicationDetailResultDto } from '@/contracts/store/dto/store-application-detail.dto';
import { StoreApplicationRejectDto } from '@/contracts/store/dto/store-application-reject.dto';
import { handleApiError } from '@/shared/api/error';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import CopyButton from '@/shared/components/ui/button/CopyButton';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import ReasonModal from '@/shared/components/ui/modal/ReasonModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatBusinessNumber, formatPhone, toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { APPLICATION_LIST_PATH, storePath, userPath } from '../../admin-paths';
import StoreFilesCard from '../../_components/StoreFilesCard';
import { ApprovedStoreType, approvalOf, approvedStoreOf } from '../application-format';
import styles from '@/app/css/admin/AdminDetail.module.css';

type AdminApplicationDetailContentProps = {
    applicationId: string; // 주소의 입점 신청 ID
};

/** 반려 사유 최대 글자 수 — StoreApplicationRejectDto */
const REJECT_COMMENT_MAX = 255;

/**
 * A3 입점 신청 상세 — 신청 내용 · 신청자 · 처리 · 업체 정보 파일 · 승인(업체코드 · 로그인 주소 안내) · 반려(사유)
 *
 * @param param0
 * @returns
 */
export default function AdminApplicationDetailContent({applicationId}: AdminApplicationDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                         // 관리자 토큰
    const loadDetail = useEffectEvent((signal: AbortSignal) => getStoreApplication(auth, applicationId, signal)); // 그때의 auth · 신청으로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                               // ④⑤ 다시 읽기
    const [detail, setDetail] = useState<StoreApplicationDetailResultDto | null>(null); // ① 상세
    const [failed, setFailed] = useState<boolean>(false);                                // ① 못 읽음
    const [approved, setApproved] = useState<ApprovedStoreType | null>(null);            // ④ 방금 승인 — 받은 업체(늦으면 비어 있음)
    const [rejecting, setRejecting] = useState<boolean>(false);                          // ⑤ 반려 대화상자
    const [busy, setBusy] = useState<boolean>(false);                                    // ③⑤ 승인 · 반려 중

    // 계산 값
    const approval = detail ? approvalOf(detail) : null;                            // ② 버튼 · 막는 이유
    const bandStore = approved ? approvedStoreOf(approved, detail) : null;           // ④ 승인 띠의 업체 — 늦어 아직 없으면 null
    const consoleUrl = bandStore ? storeConsoleLoginUrl(bandStore.store_code) : ''; // ④ 업체 콘솔 로그인 주소

    // 효과
    useEffect(() => {
        // ① 상세(신청이 바뀌거나 다시 읽을 때 · 떠나면 결과를 버린다) — 사업자등록증 열람 주소도 이때 새로
        const controller = new AbortController();
        loadDetail(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setDetail(next);
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
    }, [applicationId, reloadKey]);

    // 함수
    function reload(): void {
        // ④⑤ 상세 다시
        setReloadKey((key) => key + 1);
    }

    async function approve(): Promise<void> {
        // ③ 승인(큐) → ④ 받은 업체 · 상세 다시(받은 게 없으면 다시 읽은 업체코드로)
        if (busy) {
            return;
        }

        setBusy(true);
        let result: StoreApplicationApproveResultDto | null = null; // 승인 결과 — 늦으면 null
        let failure: {error: unknown} | null = null;                // 실패 — 처리는 try 밖에서
        try {
            result = await approveStoreApplication(auth, applicationId);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error); // ③ 이미 처리됨 · 사업자등록증 없음 — 받은 문구
            return;
        }

        setApproved({store_id: result?.store_id ?? null, store_code: result?.store_code ?? null});
        reload();
    }

    async function reject(reason: string): Promise<void> {
        // ⑤ 사유 검사 → 반려(큐) → 닫고 상세 다시
        const dto = Object.assign(new StoreApplicationRejectDto(), {reject_comment: reason});
        if (busy || !(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await rejectStoreApplication(auth, applicationId, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error); // 사유 칸 오류는 대화상자 칸 옆
            return;
        }

        setRejecting(false);
        reload();
    }

    if (!detail) {
        return failed ? (
            // ① 못 읽음 — 받은 문구는 팝업으로
            <EmptyState title="입점 신청을 불러오지 못했어요" description="없는 신청이거나 잠시 연결이 안 됩니다." action={<Link href={APPLICATION_LIST_PATH} className={buttonClass({size: 'sm'})}>입점 신청 목록</Link>} />
        ) : null;
    }

    return (
        // 입점 신청 상세
        <div className={styles.page}>
            {/* 머리 — ② 대기면 반려 · 승인 */}
            <div className={styles.head}>
                <div>
                    <p className={styles.crumb}><Link href={APPLICATION_LIST_PATH}>입점 신청 목록</Link></p>
                    <h1 className={styles.title}>{detail.store_name}<Badge tone={applicationStateTone(detail.store_application_state_id)}>{lookupName('store_application_state_id', detail.store_application_state_id)}</Badge></h1>
                    <p className={styles.sub}>신청일시 {toKst(detail.created_at, 'YYYY-MM-DD HH:mm')} · 처리일시 {detail.reviewed_at ? toKst(detail.reviewed_at, 'YYYY-MM-DD HH:mm') : '—'}</p>
                </div>
                {approval?.visible ? (
                    <div className={styles.actions}>
                        <Button variant="danger" disabled={busy} onClick={() => setRejecting(true)}>반려</Button>
                        <Button variant="primary" disabled={busy || !approval.canApprove} onClick={approve}>{busy ? '처리 중…' : '승인'}</Button>
                    </div>
                ) : null}
            </div>

            {/* ④ 승인 결과 */}
            {bandStore ? (
                <Band tone="ok" role="status" title="입점을 승인했습니다. 대표자 휴대폰으로 승인 문자를 보냈습니다.">
                    <dl className={styles.bandDl}>
                        <dt>업체코드</dt><dd className={styles.mono}>{bandStore.store_code}</dd>
                        <dt>업체 관리자 콘솔 로그인 주소</dt><dd className={styles.mono}>{consoleUrl}</dd>
                    </dl>
                    <div className={styles.bandActions}><CopyButton text={consoleUrl} label="로그인 주소 복사" size="sm" /><Link href={storePath(bandStore.store_id)} className={buttonClass({size: 'sm'})}>업체 상세로</Link></div>
                </Band>
            ) : null}

            {/* ② 승인 안내 · 막는 이유 */}
            {approval?.blockedReason ? <Band tone="warn">{approval.blockedReason}</Band> : null}
            {approval?.canApprove ? <Band tone="info">승인하면 업체와 업체 총관리자 계정(아이디 {detail.head_manager_login_id}, 신청 때 정한 비밀번호)이 만들어지고, 대표자 휴대폰 {formatPhone(detail.owner_phone)} 로 승인 문자가 갑니다. 대기 중인 신청만 승인 · 반려할 수 있습니다.</Band> : null}

            {/* ① 신청 내용 · 신청자 · 처리 */}
            <div className={styles.cols}>
                <Card title="신청 내용">
                    <dl className={styles.dl}>
                        <dt>상호명</dt><dd>{detail.store_name}</dd>
                        <dt>사업자등록번호</dt><dd className={styles.mono}>{formatBusinessNumber(detail.business_number)}</dd>
                        <dt>대표자명</dt><dd>{detail.owner_name}</dd>
                        <dt>대표자 휴대폰</dt><dd className={styles.mono}>{formatPhone(detail.owner_phone)}</dd>
                        <dt>업체 총관리자 아이디</dt><dd className={styles.mono}>{detail.head_manager_login_id}</dd>
                        <dt>업체 연락처</dt><dd className={styles.mono}>{formatPhone(detail.phone)}</dd>
                        <dt>주소</dt><dd>{detail.address}</dd>
                        <dt>상세주소</dt><dd>{detail.address_detail ?? '—'}</dd>
                        <dt>위도 · 경도</dt><dd className={styles.mono}>{detail.latitude} · {detail.longitude}</dd>
                        <dt>신청 메모</dt><dd>{detail.application_comment ?? '—'}</dd>
                    </dl>
                </Card>
                <div className={styles.stack}>
                    <Card title="신청자">
                        {detail.applicant ? (
                            <>
                                <dl className={styles.dl}>
                                    <dt>이름</dt><dd>{detail.applicant.name}</dd>
                                    <dt>닉네임</dt><dd>{detail.applicant.nickname}</dd>
                                    <dt>휴대폰</dt><dd className={styles.mono}>{detail.applicant.phone ? formatPhone(detail.applicant.phone) : '—'}</dd>
                                </dl>
                                <Link href={userPath(detail.applicant.user_id)} className={buttonClass({size: 'sm'})}>이용자 상세 보기</Link>
                            </>
                        ) : <p className={styles.muted}>신청자 정보 없음</p>}
                    </Card>
                    <Card title="처리">
                        <dl className={styles.dl}>
                            <dt>상태</dt><dd><Badge tone={applicationStateTone(detail.store_application_state_id)}>{lookupName('store_application_state_id', detail.store_application_state_id)}</Badge></dd>
                            <dt>처리일시</dt><dd className={styles.mono}>{detail.reviewed_at ? toKst(detail.reviewed_at, 'YYYY-MM-DD HH:mm') : '—'}</dd>
                            <dt>업체코드</dt><dd className={styles.mono}>{detail.store_code ?? '— (승인 뒤 생김)'}</dd>
                            <dt>반려 사유</dt><dd>{detail.reject_comment ?? '—'}</dd>
                        </dl>
                    </Card>
                </div>
            </div>

            {/* ① 업체 정보 파일 */}
            <StoreFilesCard files={detail.files} />

            {/* ⑤ 반려 사유 */}
            <ReasonModal open={rejecting} title="입점 신청 반려" description={`${detail.store_name} 신청을 반려합니다. 사유는 신청자가 내 신청 화면에서 봅니다.`} label="반려 사유" name="reject_comment" maxLength={REJECT_COMMENT_MAX} confirmLabel="반려하기" danger busy={busy} onConfirm={reject} onClose={() => setRejecting(false)} />
        </div>
    );
}
