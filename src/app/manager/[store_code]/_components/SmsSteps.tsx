import styles from '@/app/css/manager/SmsSteps.module.css';

type SmsStepsProps = {
    sent: boolean; // 인증번호를 보냈는지 — 2단계
};

/**
 * 인증 단계 표시 — 1 인증번호 받기 · 2 인증번호 확인(시안 M1 `.steps` — 아이디 찾기 · 비밀번호 초기화)
 *
 * @param param0
 * @returns
 */
export default function SmsSteps({sent}: SmsStepsProps): React.ReactNode {
    return (
        // 단계
        <ol className={styles.steps}>
            <li className={sent ? styles.done : undefined} aria-current={sent ? undefined : 'step'}><span className={styles.dot}>1</span>인증번호 받기</li>
            <li className={styles.line} aria-hidden="true" />
            <li aria-current={sent ? 'step' : undefined}><span className={styles.dot}>2</span>인증번호 확인</li>
        </ol>
    );
}
