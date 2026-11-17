'use client';
import Image from 'next/image';
import { useState } from 'react';
import { A11y, Keyboard } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/a11y';
import { DiscoveryStoreImageResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import styles from '@/app/css/user/StoreImageSlider.module.css';

type StoreImageSliderProps = {
    images: Array<DiscoveryStoreImageResultDto>; // 업체 사진(정렬 순서)
    alt: string;                                 // 사진 설명 앞부분 — 업체 이름
};

/**
 * 업체 사진 넘기기 — swiper 가로 넘기기 + 오른쪽 아래 "현재 / 전체", 사진이 없으면 자리 표시
 * - 키보드 화살표로도 넘기고(Keyboard), 넘길 때 화면 낭독기가 알린다(A11y)
 * - swiper 는 window 를 쓰기 전에 typeof window 를 확인해(node_modules/swiper/shared/swiper-core.mjs) 서버 렌더에서도 안전 — next/dynamic 없이
 *
 * @param param0
 * @returns
 */
export default function StoreImageSlider({images, alt}: StoreImageSliderProps): React.ReactNode {
    // 상태
    const [index, setIndex] = useState<number>(0); // 보고 있는 사진(0부터)

    // 사진 없음
    if (images.length === 0) {
        return (
            // 사진 자리
            <div className={styles.empty}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" /></svg>
                <span>업체 사진</span>
            </div>
        );
    }

    return (
        // 사진 넘기기
        <div className={styles.slider}>
            <Swiper className={styles.swiper} modules={[A11y, Keyboard]} keyboard={{enabled: true}} a11y={{prevSlideMessage: '이전 사진', nextSlideMessage: '다음 사진'}} onSlideChange={(swiper) => setIndex(swiper.activeIndex)}>
                {images.map((image, order) => (
                    <SwiperSlide key={image.image_url}>
                        <div className={styles.slide}>
                            <Image src={image.image_url} alt={`${alt} 사진 ${order + 1}`} fill sizes="480px" unoptimized className={styles.img} />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* 현재 / 전체 */}
            <span className={styles.count}>{index + 1} / {images.length}</span>
        </div>
    );
}
