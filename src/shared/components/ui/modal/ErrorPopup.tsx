'use client';
import { useSyncExternalStore } from 'react';
import Button from '@/shared/components/ui/button/Button';
import Modal from './Modal';
import { closeErrorPopup, ErrorPopupType, getErrorPopup, subscribeErrorPopup } from '@/shared/utils/error-popup';
import styles from '@/shared/css/ui/modal/ErrorPopup.module.css';

/**
 * 서버 렌더링 때 오류 — 없음
 */
function getServerPopup(): ErrorPopupType | null {
    return null;
}

/**
 * 오류 팝업 — 루트(RootLayoutContent)에 하나. showErrorPopup(message, detail?) 로 연다
 *
 * @returns
 */
export default function ErrorPopup(): React.ReactNode {
    // 변수
    const popup = useSyncExternalStore(subscribeErrorPopup, getErrorPopup, getServerPopup); // 지금 띄울 오류 — 없으면 null

    return (
        // 오류 팝업 — 확인을 누르면 닫힌다
        <Modal open={popup !== null} title="알림" onClose={closeErrorPopup} footer={<Button variant="primary" onClick={closeErrorPopup}>확인</Button>}>
            {/* 문구 */}
            <p className={styles.message}>{popup?.message}</p>

            {/* 개발 때만 — 오류 원문 */}
            {popup?.detail ? <pre className={styles.detail}>{popup.detail}</pre> : null}
        </Modal>
    );
}
