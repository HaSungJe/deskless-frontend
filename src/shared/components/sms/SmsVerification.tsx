'use client';
import { ChangeEvent, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import Timer from '@/shared/components/Timer';
import Button from '@/shared/components/ui/button/Button';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import styles from '@/shared/css/sms/SmsVerification.module.css';

/** 인증번호 발송 결과 — 이용자 · 매니저 발송 API 의 done(…ResultDto 와 같은 모양) */
export type SmsSentType = {
    sms_verification_id: string; // 인증 ID — 확인할 때 인증번호와 함께
    expires_at: string;          // 인증번호 만료 시각(ISO 8601 — 발송 후 5분)
};

/** 확인 버튼 자리 — below: 안내 아래 · inline: 인증번호 칸 옆 · slot: confirmSlot 안(화면 아래 고정 영역) */
export type SmsConfirmPlacementType = 'below' | 'inline' | 'slot';

type SmsVerificationProps = {
    onSend: (phone: string) => Promise<SmsSentType | null>;                  // 발송 — 화면이 DTO 검증 · API · 실패 안내, 못 보냈으면 null
    onConfirm: (sms_verification_id: string, code: string) => Promise<void>; // 확인 — 결과 처리(다음 화면 · 오류)는 화면이
    confirmLabel?: string;                                                   // 확인 버튼 글자
    confirmPlacement?: SmsConfirmPlacementType;                              // 확인 버튼 자리(기본 below)
    confirmSlot?: HTMLElement | null;                                        // slot 일 때 버튼을 그릴 요소 — 아직 없으면(null) 그리지 않는다
    notice?: boolean;                                                        // 아래 안내(5분 · 횟수)를 보일지(기본 보임)
    children?: React.ReactNode;                                              // 번호 위에 둘 칸(비밀번호 초기화의 아이디 등)
};

/** 보낸 뒤 안내 */
export const SMS_SENT_MESSAGE = '인증번호를 보냈어요. 5분 안에 입력해 주세요.';

/** 남은 시간이 다 됐을 때 */
export const SMS_EXPIRED_MESSAGE = '인증번호가 만료되었습니다. 다시 받아 주세요.';

/** 아래 안내 — 시안 그대로 */
const SMS_NOTICE = '인증번호는 받은 뒤 5분 동안 쓸 수 있어요. 여러 번 틀렸거나 시간이 지나면 다시 받아 주세요. 하루에 받을 수 있는 횟수가 정해져 있어요.';

/**
 * 인증번호 흐름 — 번호 → 받기 → 6자리 + 남은 시간 → 확인
 * - 입력 칸은 Field name="phone" · name="code" — 화면 DTO 검증 오류가 칸 옆에 나온다
 * - 확인 버튼은 보낸 뒤에만, 자리는 confirmPlacement(slot 이면 createPortal 로 화면의 아래 영역에)
 *
 * @param param0
 * @returns
 */
export default function SmsVerification({onSend, onConfirm, confirmLabel = '인증하기', confirmPlacement = 'below', confirmSlot = null, notice = true, children}: SmsVerificationProps): React.ReactNode {
    // 변수
    const phoneId = useId(); // 번호 칸 id — 라벨이 가리킨다
    const codeId = useId();  // 인증번호 칸 id

    // 상태
    const [phone, setPhone] = useState<string>('');             // 휴대폰 번호(숫자만)
    const [code, setCode] = useState<string>('');               // 인증번호(숫자 6자리까지)
    const [sent, setSent] = useState<SmsSentType | null>(null); // 받은 인증 — 없으면 아직 안 보냄
    const [expired, setExpired] = useState<boolean>(false);     // 남은 시간이 다 됐는지
    const [busy, setBusy] = useState<boolean>(false);           // 보내는 중 · 확인 중 — 두 번 누름 막기

    // 계산 값
    const canConfirm = sent !== null && !expired && !busy; // 확인 버튼을 누를 수 있는지
    const inline = confirmPlacement === 'inline';          // 확인 버튼이 인증번호 칸 옆인지

    // 함수
    function changePhone(event: ChangeEvent<HTMLInputElement>): void {
        // 숫자만 11자리까지 — 번호가 바뀌면 받은 인증번호를 비운다(다시 받아야 함). 보내는 중에는 칸을 막아 다른 번호의 인증이 섞이지 않게
        setPhone(event.target.value.replace(/\D/g, '').slice(0, 11));
        setSent(null);
        setCode('');
        setExpired(false);
    }

    function changeCode(event: ChangeEvent<HTMLInputElement>): void {
        // 숫자만 6자리까지
        setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
    }

    async function send(): Promise<void> {
        // 발송 — 결과가 있을 때만 인증번호 칸을 연다(null 이면 화면이 이미 안내함)
        setBusy(true);
        try {
            const result = await onSend(phone);
            if (result) {
                setSent(result);
                setCode('');
                setExpired(false);
            }
        } finally {
            setBusy(false);
        }
    }

    async function confirm(): Promise<void> {
        // 확인 — 결과 처리는 화면이
        if (!sent || expired) {
            return;
        }

        setBusy(true);
        try {
            await onConfirm(sent.sms_verification_id, code);
        } finally {
            setBusy(false);
        }
    }

    function expire(): void {
        // 남은 시간이 다 됨 — 확인을 막는다
        setExpired(true);
    }

    // 확인 버튼 — 자리(칸 옆 · 안내 아래 · slot)만 다르고 같은 버튼
    const confirmButton = <Button variant="primary" size={inline ? 'md' : 'lg'} full={!inline} onClick={confirm} disabled={!canConfirm}>{confirmLabel}</Button>;

    return (
        // 인증번호 흐름
        <div className={styles.sms}>
            {/* 번호 위 칸(아이디 등) */}
            {children}

            {/* 휴대폰 번호 · 받기 */}
            <Field label="휴대폰 번호" name="phone" htmlFor={phoneId}>
                <div className={styles.row}>
                    <Input id={phoneId} type="tel" inputMode="numeric" autoComplete="tel" placeholder="01012345678" value={phone} onChange={changePhone} disabled={busy} />
                    <Button onClick={send} disabled={busy}>{sent ? '다시 받기' : '인증번호 받기'}</Button>
                </div>
                {sent ? <p className={styles.sent}>{SMS_SENT_MESSAGE}</p> : null}
            </Field>

            {/* 인증번호 · 남은 시간 */}
            {sent ? (
                <Field label="인증번호" name="code" htmlFor={codeId}>
                    <div className={inline ? styles.row : undefined}>
                        <div className={styles.codeBox}>
                            <Input id={codeId} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={changeCode} />
                            <span className={styles.timer}><Timer time={sent.expires_at} closeFunc={expire} /></span>
                        </div>
                        {inline ? confirmButton : null}
                    </div>
                    {expired ? <p className={styles.expired} role="alert">{SMS_EXPIRED_MESSAGE}</p> : null}
                </Field>
            ) : null}

            {/* 안내 */}
            {notice ? <p className={styles.notice}>{SMS_NOTICE}</p> : null}

            {/* 확인 — 안내 아래 · 화면 아래 영역(slot) */}
            {sent && confirmPlacement === 'below' ? confirmButton : null}
            {sent && confirmPlacement === 'slot' && confirmSlot ? createPortal(confirmButton, confirmSlot) : null}
        </div>
    );
}
