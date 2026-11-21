'use client';
import dayjs from 'dayjs';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useEffectEvent, useState } from 'react';
import { getStoreDetail, getStoreRoomGroups } from '@/contracts/discovery/api';
import { DiscoveryRoomGroupItemResultDto } from '@/contracts/discovery/dto/discovery-room-group-list.dto';
import { DiscoveryStoreDetailResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import { handleApiError } from '@/shared/api/error';
import StoreMap from '@/shared/components/map/StoreMap';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import { MapMarkerType } from '@/shared/types/map';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { DAY_NAMES, formatPrice, todayKst } from '@/shared/utils/format';
import UserTopBar from '../../_components/UserTopBar';
import StoreImageSlider from './_components/StoreImageSlider';
import { isStoreNotFound, STORE_NOT_FOUND_MESSAGE } from './store-not-found';
import { describeBookingPolicy, describePlan, formatHourRange, formatPeriodPrice, planPriceLabel, roomOptionLabels } from './store-detail-format';
import styles from '@/app/css/user/StoreDetailContent.module.css';

type StoreDetailContentProps = {
    storeId: string; // 주소의 업체 ID
};

/** 위치 지도 확대 단계 — 동네가 보이는 정도 */
const LOCATION_MAP_LEVEL = 4;

/** 주소 아이콘 — 시안 user.html:472 */
const PLACE_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.icon}><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>;

/** 전화 아이콘 — 시안 user.html:473 */
const PHONE_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>;

/**
 * U2 업체 상세 + 객실 그룹 — 상세 · 객실 그룹을 함께 불러 그리고, 없는 업체면 첫 화면으로
 *
 * @param param0
 * @returns
 */
export default function StoreDetailContent({storeId}: StoreDetailContentProps): React.ReactNode {
    // 변수
    const router = useRouter(); // 없는 업체면 첫 화면으로
    const leaveNotFound = useEffectEvent((): void => {
        showErrorPopup(STORE_NOT_FOUND_MESSAGE);
        router.replace('/');
    });                         // 없는 업체 — 안내 뒤 첫 화면(그때의 router — 효과를 다시 걸지 않는다)

    // 상태
    const [store, setStore] = useState<DiscoveryStoreDetailResultDto | null>(null);         // 업체 상세 — 불러오기 전 null
    const [roomGroups, setRoomGroups] = useState<Array<DiscoveryRoomGroupItemResultDto>>([]); // 객실 그룹(그룹명 순)

    // 계산 값
    const today = dayjs(todayKst()).day();                                                                        // 오늘 요일(한국) — 영업시간 줄 강조
    const bookingPath = `/stores/${encodeURIComponent(storeId)}/booking/`;                                        // U3(Phase 7)
    const address = store?.address_detail ? `${store.address}, ${store.address_detail}` : store?.address ?? '';   // 주소 + 상세주소
    const policies = store ? describeBookingPolicy(store) : [];                                                    // 예약 · 환불 규정 문장
    const storeMarkers: Array<MapMarkerType> = store ? [{id: store.store_id, title: store.store_name, latitude: store.latitude, longitude: store.longitude}] : []; // 위치 핀 하나

    // 효과
    useEffect(() => {
        // 상세 · 객실 그룹을 함께 부른다 — 하나가 실패해도 다른 하나는 쓴다, 떠나면 취소
        const controller = new AbortController();

        Promise.allSettled([getStoreDetail(storeId, controller.signal), getStoreRoomGroups(storeId, controller.signal)]).then(([detail, groups]) => {
            if (controller.signal.aborted) {
                return;
            }

            // 상세 — 404 · 400 · 빈 본문이면 없는 업체, 그 밖의 실패는 안내만
            if (detail.status === 'rejected') {
                if (isStoreNotFound(detail.reason)) {
                    leaveNotFound();
                } else {
                    handleApiError(detail.reason);
                }
                return;
            }

            if (!detail.value) {
                leaveNotFound();
                return;
            }

            // 객실 그룹 — 실패해도 업체 정보는 보이고 안내만
            setStore(detail.value);
            if (groups.status === 'fulfilled') {
                setRoomGroups(groups.value?.list ?? []);
            } else {
                handleApiError(groups.reason);
            }
        });

        return () => {
            controller.abort();
        };
    }, [storeId]);

    return (
        // 업체 상세
        <div className={styles.page}>
            {/* 상단 바 */}
            <UserTopBar title="업체 상세" />

            {store ? (
                <>
                    <div className={styles.body}>
                        {/* 사진 · 이름 · 주소 · 전화 · 소개 · 위치 */}
                        <div className={styles.summary}>
                            <StoreImageSlider images={store.images} alt={store.store_name} />
                            <div className={styles.info}>
                                <h2 className={styles.name}>{store.store_name}</h2>
                                <div className={styles.badges}>
                                    {store.is_open === 1 ? <Badge tone="ok">영업중</Badge> : <Badge>지금 영업 안 함</Badge>}
                                    {store.is_always_open === 1 ? <Badge tone="primary">24시간</Badge> : null}
                                </div>
                                <div className={styles.contact}>
                                    <span className={styles.contactRow}>{PLACE_ICON}{address}</span>
                                    <a className={styles.phone} href={`tel:${store.phone}`}>{PHONE_ICON}{store.phone}</a>
                                </div>
                                {store.introduction ? <p className={styles.intro}>{store.introduction}</p> : null}
                                <div className={styles.locationMap}>
                                    <StoreMap center={{latitude: store.latitude, longitude: store.longitude}} markers={storeMarkers} level={LOCATION_MAP_LEVEL} locked />
                                </div>
                            </div>
                        </div>

                        {/* 영업시간 · 브레이크 */}
                        <section className={styles.section} aria-labelledby="store-hours-title">
                            <h3 id="store-hours-title" className={styles.sectionTitle}>영업시간</h3>
                            {store.is_always_open === 1 ? <p className={styles.text}>24시간 연중무휴</p> : (
                                <div className={styles.hours}>
                                    {store.hours.map((hour) => (
                                        <div key={hour.day_of_week} className={hour.day_of_week === today ? `${styles.hour} ${styles.today}` : styles.hour}>
                                            <span className={styles.day}>{DAY_NAMES[hour.day_of_week]}</span>
                                            <span>{formatHourRange(hour)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {store.breaks.length > 0 ? (
                                <div className={styles.breaks}>
                                    <span className={styles.breakTitle}>브레이크타임</span>
                                    <span className={styles.muted}>매일 {store.breaks.map((item) => `${item.start_time} ~ ${item.end_time}`).join(', ')}</span>
                                </div>
                            ) : null}
                        </section>

                        {/* 판매 상품 */}
                        <section className={styles.section} aria-labelledby="store-plans-title">
                            <h3 id="store-plans-title" className={styles.sectionTitle}>판매 상품</h3>
                            <div className={styles.plans}>
                                {store.plans.map((plan) => (
                                    <Fragment key={plan.room_plan_type_id}>
                                        <span className={styles.planBadge}><Badge>{plan.room_plan_type_name}</Badge></span>
                                        <span>{describePlan(plan)}</span>
                                    </Fragment>
                                ))}
                            </div>
                        </section>

                        {/* 예약 · 환불 규정 */}
                        <section className={styles.section} aria-labelledby="store-policy-title">
                            <h3 id="store-policy-title" className={styles.sectionTitle}>예약 · 환불 규정</h3>
                            <ul className={styles.policies}>
                                {policies.map((policy) => <li key={policy}>{policy}</li>)}
                            </ul>
                        </section>

                        {/* 객실 그룹 */}
                        <section className={styles.section} aria-labelledby="store-groups-title">
                            <h3 id="store-groups-title" className={styles.sectionTitle}>객실 그룹</h3>
                            {roomGroups.length === 0 ? <p className={styles.muted}>예약할 수 있는 객실이 아직 없어요.</p> : null}
                            {roomGroups.map((group) => (store.is_open === 1
                                ? <Link key={group.room_group_id} href={`${bookingPath}?room_group_id=${encodeURIComponent(group.room_group_id)}`} className={styles.group}>{roomGroupBody(group)}</Link>
                                : <div key={group.room_group_id} className={styles.group}>{roomGroupBody(group)}</div>))}
                        </section>
                    </div>

                    {/* 예약하기 — 지금 영업하지 않으면 막음 */}
                    <div className={styles.footer}>
                        {store.is_open === 1
                            ? <Link href={bookingPath} className={buttonClass({variant: 'primary', size: 'lg', full: true})}>예약하기</Link>
                            : <Button variant="primary" size="lg" full disabled>지금은 예약할 수 없어요</Button>}
                    </div>
                </>
            ) : null}
        </div>
    );
}

/**
 * 객실 그룹 카드 내용 — 사진 · 이름 · 설명 · 호실 수 · 객실 옵션 · 상품별 가격 · 기간 가격
 * - 영업중이면 예약 링크, 아니면 링크 없이(예약하기를 막은 것과 같이)
 *
 * @param group 객실 그룹
 */
function roomGroupBody(group: DiscoveryRoomGroupItemResultDto): React.ReactNode {
    return (
        <>
            {/* 사진 · 이름 · 설명 · 호실 수 */}
            <div className={styles.groupHead}>
                <div className={styles.groupThumb}>
                    {group.images[0] ? <Image src={group.images[0].image_url} alt="" fill sizes="72px" unoptimized className={styles.img} /> : '객실 사진'}
                </div>
                <div className={styles.groupText}>
                    <strong className={styles.groupName}>{group.room_group_name}</strong>
                    {group.description ? <span className={styles.groupDesc}>{group.description}</span> : null}
                    <span className={styles.roomCount}>예약 받는 호실 {group.room_count}개</span>
                </div>
            </div>

            {/* 객실 옵션 */}
            <div className={styles.options}>
                {roomOptionLabels(group.room_group_detail).map((label) => <span key={label} className={styles.option}>{label}</span>)}
            </div>

            {/* 상품별 가격 */}
            <div className={styles.prices}>
                {group.plans.map((plan) => (
                    <div key={plan.room_plan_type_id} className={styles.price}>
                        <span className={styles.priceLabel}>{planPriceLabel(plan)}</span>
                        <strong className={styles.priceValue}>{formatPrice(plan.price)}</strong>
                    </div>
                ))}
            </div>

            {/* 기간 가격 */}
            {group.plans.flatMap((plan) => plan.period_prices.map((period) => (
                <p key={`${plan.room_plan_type_id}-${period.start_date}-${period.end_date}`} className={styles.period}>기간 가격 · {formatPeriodPrice(period, planPriceLabel(plan))}</p>
            )))}
        </>
    );
}
