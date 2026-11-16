'use client';
import Link from 'next/link';
import { useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { confirmFindLoginId, sendFindLoginId } from '@/contracts/user/api';
import { UserFindLoginIdConfirmDto, UserFindLoginIdConfirmResultDto } from '@/contracts/user/dto/user-find-login-id-confirm.dto';
import { UserFindLoginIdDto } from '@/contracts/user/dto/user-find-login-id.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import SmsVerification, { SmsSentType } from '@/shared/components/sms/SmsVerification';
import { buttonClass } from '@/shared/components/ui/button/Button';
import { AREA_LOGIN_PATH } from '@/shared/utils/area';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import UserTopBar from '../_components/UserTopBar';
import styles from '@/app/css/user/UserFormPage.module.css';

/**
 * U5 아이디 찾기 — 가입할 때 인증한 번호 → 인증번호 → 가입한 SNS · 가입일
 *
 * @returns
 */
export default function FindLoginIdContent(): React.ReactNode {
    // 상태
    const [found, setFound] = useState<UserFindLoginIdConfirmResultDto | null>(null); // 찾은 가입 정보

    // 계산 값
    const joinedWith = found ? lookupName('sns_id', found.sns_id) || found.login_id || '' : ''; // "카카오"
    const joinedAt = found ? toKst(found.created_at, 'YYYY년 M월 D일') : '';                   // 가입일

    // 함수
    async function send(phone: string): Promise<SmsSentType | null> {
        // 발송 — DTO 검증 → 큐, pending 이면 안내
        const dto = Object.assign(new UserFindLoginIdDto(), {phone});
        if (!(await validateAction(dto))) {
            return null;
        }

        try {
            const result = await sendFindLoginId(dto);
            if (!result) {
                showErrorPopup(QUEUE_PENDING_MESSAGE);
            }
            return result;
        } catch (error) {
            handleApiError(error);
            return null;
        }
    }

    async function confirm(sms_verification_id: string, code: string): Promise<void> {
        // 확인 — 결과가 있으면 가입 정보, pending 이면 안내
        const dto = Object.assign(new UserFindLoginIdConfirmDto(), {sms_verification_id, code});
        if (!(await validateAction(dto))) {
            return;
        }

        try {
            const result = await confirmFindLoginId(dto);
            if (!result) {
                showErrorPopup(QUEUE_PENDING_MESSAGE);
                return;
            }
            setFound(result);
        } catch (error) {
            handleApiError(error);
        }
    }

    return (
        // 아이디 찾기
        <div className={styles.page}>
            {/* 상단 바 */}
            <UserTopBar title="아이디 찾기" backHref={AREA_LOGIN_PATH.user} />

            <div className={styles.body}>
                {/* 안내 */}
                <div className={styles.intro}>
                    <h2 className={styles.heading}>어느 SNS 로 가입했는지 찾아요</h2>
                    <p className={styles.desc}>가입할 때 인증한 휴대폰 번호로 인증번호를 보내 드려요.</p>
                </div>

                {/* 번호 → 인증번호 + 칸 옆 확인 */}
                <SmsVerification onSend={send} onConfirm={confirm} confirmLabel="확인" confirmPlacement="inline" notice={false} />

                {/* 찾은 가입 정보 */}
                {found ? (
                    <section className={styles.result} aria-labelledby="find-login-id-result">
                        <div className={styles.resultHead}>
                            <span className={styles.resultIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                            </span>
                            <h3 id="find-login-id-result" className={styles.resultTitle}>가입한 계정을 찾았어요</h3>
                        </div>
                        <dl className={styles.resultList}>
                            <dt>가입한 SNS</dt>
                            <dd className={styles.strong}>{joinedWith}</dd>
                            <dt>가입일</dt>
                            <dd>{joinedAt}</dd>
                        </dl>
                    </section>
                ) : null}
            </div>

            {/* 로그인하러 가기 — 찾은 뒤 */}
            {found ? (
                <div className={styles.footer}>
                    <Link href={AREA_LOGIN_PATH.user} className={buttonClass({variant: 'primary', size: 'lg', full: true})}>로그인하러 가기</Link>
                </div>
            ) : null}
        </div>
    );
}
