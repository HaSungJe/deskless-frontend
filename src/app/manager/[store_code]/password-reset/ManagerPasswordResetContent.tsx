'use client';
import Link from 'next/link';
import { useState } from 'react';
import { confirmManagerPasswordReset, sendManagerPasswordReset } from '@/contracts/manager/api';
import { ManagerPasswordResetConfirmDto } from '@/contracts/manager/dto/manager-password-reset-confirm.dto';
import { ManagerPasswordResetDto, ManagerPasswordResetResultDto } from '@/contracts/manager/dto/manager-password-reset.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import ConsoleAuthCard from '@/shared/components/console/ConsoleAuthCard';
import ConsoleAuthFrame from '@/shared/components/console/ConsoleAuthFrame';
import Loading from '@/shared/components/Loading';
import SmsVerification, { SmsSentType } from '@/shared/components/sms/SmsVerification';
import { buttonClass } from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { validateAction } from '@/shared/utils/validation';
import { managerStorePath } from '../../manager-auth';
import LoginStoreNotFound from '../_components/LoginStoreNotFound';
import LoginStoreSuspended from '../_components/LoginStoreSuspended';
import SmsSteps from '../_components/SmsSteps';
import useLoginStore from '../useLoginStore';
import styles from '@/app/css/manager/ManagerPasswordResetContent.module.css';

type ManagerPasswordResetContentProps = {
    storeCode: string; // 주소의 업체코드
};

/**
 * M1 비밀번호 초기화 — 주소의 업체코드로 업체 확인(제목 위 업체명) → 아이디 · 번호 → 인증번호 → 임시 비밀번호 문자
 * - 확인 결과는 null(완료 · 늦어짐 같음)이고 다시 확인할 조회가 없어 됨으로 안내한다(spec 결정)
 *
 * @param param0
 * @returns
 */
export default function ManagerPasswordResetContent({storeCode}: ManagerPasswordResetContentProps): React.ReactNode {
    // 변수
    const loginStore = useLoginStore(storeCode); // 주소의 업체코드로 업체 확인

    // 상태
    const [loginId, setLoginId] = useState<string>(''); // 아이디
    const [sent, setSent] = useState<boolean>(false);   // 인증번호를 보냈는지 — 단계 표시
    const [done, setDone] = useState<boolean>(false);   // 인증이 끝났는지 — 임시 비밀번호 안내

    // 계산 값
    const storeName = loginStore.status === 'ok' ? loginStore.store.store_name : undefined; // 제목 위 업체명
    const showForm = loginStore.status !== 'loading' && loginStore.status !== 'not-found'; // 입력 칸 — 없는 업체면 안내만

    // 함수
    async function send(phone: string): Promise<SmsSentType | null> {
        // ② 발송 — 업체코드 · 아이디 · 번호, DTO 검증 → 큐
        const dto = Object.assign(new ManagerPasswordResetDto(), {store_code: storeCode, login_id: loginId.trim(), phone});
        if (!(await validateAction(dto))) {
            return null;
        }

        let result: ManagerPasswordResetResultDto | null = null; // 발송 결과
        let failure: {error: unknown} | null = null;             // 실패 — 처리는 try 밖에서
        try {
            result = await sendManagerPasswordReset(dto);
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
        // ③ 확인(큐 — 결과 null) → 임시 비밀번호 안내
        const dto = Object.assign(new ManagerPasswordResetConfirmDto(), {sms_verification_id, code});
        if (!(await validateAction(dto))) {
            return;
        }

        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await confirmManagerPasswordReset(dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
            return;
        }

        setDone(true);
    }

    return (
        // 비밀번호 초기화 — 메뉴 없는 가운데 카드
        <ConsoleAuthFrame areaName="업체 관리자 콘솔">
            {/* 업체 확인 중 · 없는 업체(입력 칸 없이 안내) */}
            {loginStore.status === 'loading' ? <Loading size={40} height={20} /> : null}
            {loginStore.status === 'not-found' ? <LoginStoreNotFound /> : null}

            {!showForm ? null : done ? (
                // ③ 임시 비밀번호 안내
                <ConsoleAuthCard>
                    <div className={styles.resultHead}>
                        <span className={styles.okMark} aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg></span>
                        <h1 className={styles.resultTitle}>임시 비밀번호를 문자로 보냈습니다.</h1>
                    </div>
                    <Band tone="info">받은 임시 비밀번호(영문 + 숫자 10자리)로 로그인하면 비밀번호 변경 화면으로 이동합니다. 새 비밀번호로 바꿔 주세요. 문자가 오지 않으면 다시 초기화해 주세요.</Band>
                    <Link href={managerStorePath(storeCode, 'login')} className={buttonClass({variant: 'primary', full: true})}>로그인</Link>
                </ConsoleAuthCard>
            ) : (
                // ①② 아이디 · 번호 → 인증번호
                <ConsoleAuthCard caption={storeName} title="비밀번호 초기화" description="아이디와 등록된 휴대폰 번호가 맞으면 인증번호를 보냅니다. 인증이 끝나면 임시 비밀번호가 문자로 갑니다.">
                    {loginStore.status === 'suspended' ? <LoginStoreSuspended message={loginStore.message} suspendComment={loginStore.suspendComment} /> : null}
                    <SmsSteps sent={sent} />
                    <SmsVerification onSend={send} onConfirm={confirm} confirmLabel="확인" notice={false} onPhoneChange={() => setSent(false)}>
                        <Field label="아이디" name="login_id" htmlFor="manager-reset-login-id">
                            <Input id="manager-reset-login-id" autoComplete="username" value={loginId} onChange={(event) => setLoginId(event.target.value)} />
                        </Field>
                    </SmsVerification>
                    <div className={styles.links}>
                        <Link href={managerStorePath(storeCode, 'login')}>로그인으로 돌아가기</Link>
                        <span aria-hidden="true">|</span>
                        <Link href={managerStorePath(storeCode, 'find-login-id')}>아이디 찾기</Link>
                    </div>
                </ConsoleAuthCard>
            )}
        </ConsoleAuthFrame>
    );
}
