'use client';
import { useRouter } from 'next/navigation';
import { useContext, useState } from 'react';
import { confirmPhoneVerification, sendPhoneVerification } from '@/contracts/user/api';
import { UserPhoneVerificationConfirmDto } from '@/contracts/user/dto/user-phone-verification-confirm.dto';
import { UserMeResultDto } from '@/contracts/user/dto/user-me.dto';
import { UserPhoneVerificationDto } from '@/contracts/user/dto/user-phone-verification.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import SmsVerification, { SmsSentType } from '@/shared/components/sms/SmsVerification';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { safeReturnPath } from '@/shared/utils/area';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { validateAction } from '@/shared/utils/validation';
import UserTopBar from '../_components/UserTopBar';
import { UserMeContext } from '../_components/UserMeProvider';
import styles from '@/app/css/user/UserFormPage.module.css';

type PhoneVerificationContentProps = {
    returnUrl: string | null; // 인증 뒤 돌아갈 주소
};

/** 확인 뒤 내 정보가 아직 인증 전일 때 */
export const PHONE_UNVERIFIED_MESSAGE = '인증 결과를 확인하지 못했어요. 다시 시도해 주세요.';

/**
 * U5 휴대폰 인증 — 번호 → 인증번호 → 내 정보를 다시 읽어 인증됐으면 돌아갈 주소로
 *
 * @param param0
 * @returns
 */
export default function PhoneVerificationContent({returnUrl}: PhoneVerificationContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                   // 인증 뒤 이동
    const auth = useContext(AuthContext);         // 이용자 토큰
    const {reloadMe} = useContext(UserMeContext); // 확인 뒤 내 정보 다시 읽기

    // 상태
    const [footer, setFooter] = useState<HTMLDivElement | null>(null); // 아래 고정 영역 — "인증하기" 를 여기에 그린다

    // 함수
    async function send(phone: string): Promise<SmsSentType | null> {
        // 발송 — DTO 검증 → 큐, pending 이면 안내
        const dto = Object.assign(new UserPhoneVerificationDto(), {phone});
        if (!(await validateAction(dto))) {
            return null;
        }

        let result: SmsSentType | null; // try 안에는 await 만 — 값 갈래가 있으면 React Compiler 가 이 화면을 건너뛴다
        try {
            result = await sendPhoneVerification(auth, dto);
        } catch (error) {
            handleApiError(error);
            return null;
        }

        if (!result) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
        }
        return result;
    }

    async function confirm(sms_verification_id: string, code: string): Promise<void> {
        // 확인 — 결과가 null(done · pending 같음)이라 내 정보로 인증됐는지 본다
        const dto = Object.assign(new UserPhoneVerificationConfirmDto(), {sms_verification_id, code});
        if (!(await validateAction(dto))) {
            return;
        }

        let me: UserMeResultDto | null;
        try {
            await confirmPhoneVerification(auth, dto);
            me = await reloadMe();
        } catch (error) {
            handleApiError(error);
            return;
        }

        if (me?.is_phone_verified === 1) {
            router.replace(safeReturnPath(returnUrl, 'user'));
            return;
        }

        showErrorPopup(PHONE_UNVERIFIED_MESSAGE);
    }

    return (
        // 휴대폰 인증
        <div className={styles.page}>
            {/* 상단 바 */}
            <UserTopBar title="휴대폰 인증" backHref="/" />

            <div className={styles.body}>
                {/* 안내 */}
                <div className={styles.intro}>
                    <h2 className={styles.heading}>휴대폰 번호를 인증해 주세요</h2>
                    <p className={styles.desc}>예약 안내와 QR 확인 링크를 문자로 보내 드려요.</p>
                </div>

                {/* 번호 → 인증번호 */}
                <SmsVerification onSend={send} onConfirm={confirm} confirmPlacement="slot" confirmSlot={footer} />
            </div>

            {/* 인증하기 — 보낸 뒤 SmsVerification 이 채운다(비면 숨김) */}
            <div ref={setFooter} className={styles.footer} />
        </div>
    );
}
