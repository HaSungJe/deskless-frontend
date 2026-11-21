import styles from '@/shared/css/console/ConsoleAuthFrame.module.css';

type ConsoleAuthFrameProps = {
    areaName: string;          // 로고 아래 글자 — "업체 관리자 콘솔"
    children: React.ReactNode; // 카드
};

/** 로고 — 시안 `#i-logo`(콘솔 틀과 같은 모양, 32px) */
const LOGO = <svg className={styles.mark} viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="7" fill="var(--primary)" /><path d="M10 21V8h8v13M8 21h12" fill="none" stroke="var(--on-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="15.5" cy="14.5" r="1.2" fill="var(--on-primary)" /></svg>;

/**
 * 로그인 계열 바탕 — 메뉴 없이 바탕 위 로고 + 가운데 카드(시안 M1 — 관리자 A1 도 쓴다)
 *
 * @param param0
 * @returns
 */
export default function ConsoleAuthFrame({areaName, children}: ConsoleAuthFrameProps): React.ReactNode {
    return (
        // 바탕
        <div className={styles.frame}>
            {/* 로고 */}
            <div className={styles.logo}>{LOGO}<div><b>deskless</b><small>{areaName}</small></div></div>

            {/* 카드 */}
            {children}
        </div>
    );
}
