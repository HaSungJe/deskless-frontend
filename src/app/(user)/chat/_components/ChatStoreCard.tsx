'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ChatCardType } from '../chat-format';
import styles from '@/app/css/user/ChatStoreCard.module.css';

type ChatStoreCardProps = {
    store: ChatCardType; // 추천 업체 — 답에 붙은 카드
};

/** 사진 없음 — 홈 업체 카드와 같은 그림 */
const PHOTO_ICON = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" /></svg>;

/**
 * 추천 업체 카드 — 사진(없으면 그림) · 상호명 · 주소 · 편의시설 · 객실 항목 칩(받은 순서), 누르면 업체 상세
 *
 * @param param0
 * @returns
 */
export default function ChatStoreCard({store}: ChatStoreCardProps): React.ReactNode {
    return (
        // 업체 카드 — 업체 상세로
        <Link href={`/stores/${encodeURIComponent(store.store_id)}/`} className={styles.card}>
            {/* 사진 */}
            <div className={styles.thumb}>{store.image_url ? <Image src={store.image_url} alt="" fill sizes="56px" unoptimized className={styles.thumbImg} /> : PHOTO_ICON}</div>

            {/* 상호명 · 주소 · 칩 */}
            <div className={styles.info}>
                <strong className={styles.name}>{store.store_name}</strong>
                <span className={styles.address}>{store.address}</span>
                {store.facilities.length > 0 ? (
                    <span className={styles.chips}>
                        {store.facilities.map((facility) => <span key={facility.key} className={styles.chip}>{facility.name}</span>)}
                    </span>
                ) : null}
            </div>
        </Link>
    );
}
