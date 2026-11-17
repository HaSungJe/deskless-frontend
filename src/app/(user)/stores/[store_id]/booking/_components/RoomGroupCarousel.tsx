'use client';
import { useRef } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { ReservationAvailabilityGroupResultDto } from '@/contracts/reservation/dto/reservation-availability.dto';
import { formatPrice } from '@/shared/utils/format';
import styles from '@/app/css/user/RoomGroupCarousel.module.css';

type RoomGroupCarouselProps = {
    groups: Array<ReservationAvailabilityGroupResultDto>; // 객실 그룹(그룹명 순)
    index: number;                                        // 처음 보여 줄 카드(바뀌면 key 로 다시 그린다)
    onChange: (index: number) => void;                    // 보이는 카드가 바뀌면
};

/** 이전 · 다음 화살표 — 시안 18px · 굵기 2 */
const PREV_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>;
const NEXT_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>;

/**
 * 객실 그룹 카드 넘기기 — 한 장씩 · 양옆 여백 · 이전 / 현재 / 전체 / 다음(시안 user.html U3-select), 보이는 카드가 고른 그룹
 *
 * @param param0
 * @returns
 */
export default function RoomGroupCarousel({groups, index, onChange}: RoomGroupCarouselProps): React.ReactNode {
    // 변수
    const swiperRef = useRef<SwiperType | null>(null); // 이전 · 다음 버튼이 넘긴다

    return (
        // 그룹 넘기기
        <div className={styles.carousel}>
            {/* 카드 */}
            <Swiper className={styles.swiper} slidesPerView={1} spaceBetween={48} initialSlide={index} onSwiper={(swiper) => { swiperRef.current = swiper; }} onSlideChange={(swiper) => onChange(swiper.activeIndex)}>
                {groups.map((item, order) => (
                    <SwiperSlide key={item.room_group_id}>
                        <div className={[styles.card, item.slots.length === 0 ? styles.empty : '', order === index ? styles.current : ''].filter(Boolean).join(' ')}>
                            <div className={styles.photo}>객실 사진</div>
                            <div className={styles.text}>
                                <strong className={styles.name}>{item.room_group_name}</strong>
                                <span className={styles.desc}>{item.slots.length > 0 ? `예약할 수 있는 시간 ${item.slots.length}개` : '이 날은 예약할 수 있는 시간이 없어요'}</span>
                            </div>
                            <strong className={styles.price}>{formatPrice(item.price)}</strong>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* 이전 · 현재 / 전체 · 다음 */}
            <div className={styles.controls}>
                <button type="button" className={styles.navButton} aria-label="이전 객실 그룹" disabled={index === 0} onClick={() => swiperRef.current?.slidePrev()}>{PREV_ICON}</button>
                <span className={styles.count} aria-live="polite">{index + 1} / {groups.length}</span>
                <button type="button" className={styles.navButton} aria-label="다음 객실 그룹" disabled={index >= groups.length - 1} onClick={() => swiperRef.current?.slideNext()}>{NEXT_ICON}</button>
            </div>
        </div>
    );
}
