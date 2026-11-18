'use client';
import Link from 'next/link';
import { useState } from 'react';
import { confirmManagerFindLoginId, sendManagerFindLoginId } from '@/contracts/manager/api';
import { ManagerFindLoginIdConfirmDto, ManagerFindLoginIdConfirmResultDto } from '@/contracts/manager/dto/manager-find-login-id-confirm.dto';
import { ManagerFindLoginIdDto } from '@/contracts/manager/dto/manager-find-login-id.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import ConsoleAuthCard from '@/shared/components/console/ConsoleAuthCard';
import ConsoleAuthFrame from '@/shared/components/console/ConsoleAuthFrame';
import Loading from '@/shared/components/Loading';
import SmsVerification, { SmsSentType } from '@/shared/components/sms/SmsVerification';
import { buttonClass } from '@/shared/components/ui/button/Button';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { managerStorePath } from '../../manager-auth';
import LoginStoreNotFound from '../_components/LoginStoreNotFound';
import LoginStoreSuspended from '../_components/LoginStoreSuspended';
import SmsSteps from '../_components/SmsSteps';
import useLoginStore from '../useLoginStore';
import styles from '@/app/css/manager/ManagerFindLoginIdContent.module.css';

type ManagerFindLoginIdContentProps = {
    storeCode: string; // 주소의 업체코드
};

/**
 * M1 아이디 찾기 — 주소의 업체코드로 업체 확인(제목 위 업체명) → 번호 → 인증번호 → 아이디 · 등록일
 *
 * @param param0
 * @returns
 */
export default function ManagerFindLoginIdContent({storeCode}: ManagerFindLoginIdContentProps): React.ReactNode {
    // 변수
    const loginStore = useLoginStore(storeCode); // 주소의 업체코드로 업체 확인

    // 상태
    const [sent, setSent] = useState<boolean>(false);                                    // 인증번호를 보냈는지 — 단계 표시
    const [found, setFound] = useState<ManagerFindLoginIdConfirmResultDto | null>(null); // 찾은 아이디

    // 계산 값
    const storeName = loginStore.status === 'ok' ? loginStore.store.store_name : undefined; // 제목 위 업체명
    const showForm = loginStore.status !== 'loading' && loginStore.status !== 'not-found'; // 입력 칸 — 없는 업체면 안내만

    // 함수
    async function send(phone: string): Promise<SmsSentType | null> {
        // ② 발송 — 주소의 업체코드 + 번호, DTO 검증 → 큐, 늦어지면 안내
        const dto = Object.assign(new ManagerFindLoginIdDto(), {store_code: storeCode, phone});
        if (!(await validateAction(dto))) {
            return null;
        }

        let result: SmsSentType | null = null;       // 발송 결과
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            result = await sendManagerFindLoginId(dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
            return null;
        }

        if (!result) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
            return null;
        }

        setSent(true);
        return result;
    }

    async function confirm(sms_verification_id: string, code: string): Promise<void> {
        // ③ 확인 — 아이디 · 등록일, ④ 늦어지면 안내
        const dto = Object.assign(new ManagerFindLoginIdConfirmDto(), {sms_verification_id, code});
        if (!(await validateAction(dto))) {
            return;
        }

        let result: ManagerFindLoginIdConfirmResultDto | null = null; // 찾은 아이디
        let failure: {error: unknown} | null = null;                   // 실패 — 처리는 try 밖에서
        try {
            result = await confirmManagerFindLoginId(dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
            return;
        }

        if (!result) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
            return;
        }

        setFound(result);
    }

    return (
        // 아이디 찾기 — 메뉴 없는 가운데 카드
        <ConsoleAuthFrame areaName="업체 관리자 콘솔">
            {/* 업체 확인 중 · 없는 업체(입력 칸 없이 안내) */}
            {loginStore.status === 'loading' ? <Loading size={40} height={20} /> : null}
            {loginStore.status === 'not-found' ? <LoginStoreNotFound /> : null}

            {!showForm ? null : found ? (
                // ③ 찾은 아이디
                <ConsoleAuthCard>
                    <div className={styles.resultHead}>
                        <span className={styles.okMark} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" /></svg></span>
                        <h1 className={styles.resultTitle}>계정 아이디를 찾았습니다.</h1>
                    </div>
                    <dl className={styles.summary}>
                        <dt>아이디</dt><dd><b>{found.login_id}</b></dd>
                        <dt>등록일</dt><dd>{toKst(found.created_at, 'YYYY-MM-DD')}</dd>
                    </dl>
                    <div className={styles.actions}>
                        <Link href={managerStorePath(storeCode, 'login')} className={buttonClass({variant: 'primary'})}>로그인</Link>
                        <Link href={managerStorePath(storeCode, 'password-reset')} className={buttonClass()}>비밀번호 초기화</Link>
                    </div>
                </ConsoleAuthCard>
            ) : (
                // ①② 번호 → 인증번호
                <ConsoleAuthCard caption={storeName} title="아이디 찾기" description="계정에 등록된 휴대폰 번호로 인증번호를 받습니다.">
                    {loginStore.status === 'suspended' ? <LoginStoreSuspended message={loginStore.message} suspendComment={loginStore.suspendComment} /> : null}
                    <SmsSteps sent={sent} />
                    <SmsVerification onSend={send} onConfirm={confirm} confirmLabel="확인" notice={false} onPhoneChange={() => setSent(false)} />
                    <div className={styles.links}><Link href={managerStorePath(storeCode, 'login')}>로그인으로 돌아가기</Link></div>
                </ConsoleAuthCard>
            )}
        </ConsoleAuthFrame>
    );
}
