'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getStoreDetail } from '@/contracts/discovery/api';
import { DiscoveryStoreDetailResultDto, DiscoveryStorePlanResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import { createReservation, getAvailability } from '@/contracts/reservation/api';
import { ReservationAvailabilityDto, ReservationAvailabilityResultDto } from '@/contracts/reservation/dto/reservation-availability.dto';
import { ReservationResultDto } from '@/contracts/reservation/dto/reservation.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Chip from '@/shared/components/ui/form/Chip';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { loginUrl } from '@/shared/utils/area';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatDateTimeRange, formatPrice, formatTimeRange, toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import MemberStateBand from '../../../_components/MemberStateBand';
import { UserMeContext } from '../../../_components/UserMeProvider';
import UserTopBar from '../../../_components/UserTopBar';
import { isStoreNotFound, STORE_NOT_FOUND_MESSAGE } from '../store-not-found';
import BookingCalendar from './_components/BookingCalendar';
import BookingPayment from './_components/BookingPayment';
import RoomGroupCarousel from './_components/RoomGroupCarousel';
import { floorLabel, planSelection, slotLabel, toReservationDto } from './booking-flow';
import { dayState, lastOpenDate, shiftMonth } from './calendar';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/BookingContent.module.css';

type BookingContentProps = {
    storeId: string;            // 주소의 업체 ID
    roomGroupId: string | null; // 처음 보여 줄 객실 그룹(U2 그룹 카드에서)
};

/** 결제 대기 — 예약 결과와 예약한 때의 호실 · 상품(요청 중에 고르기가 바뀌어도 그대로) */
type BookedType = {
    payment: ReservationResultDto; // 예약 생성 done — 결제 정보 · 이용 시간
    roomLabel: string;             // "그룹 · 호실"
    planName: string;              // 상품 이름
};

/** 예약을 막는 회원 상태 — 이용 제한 · 탈퇴 대기(서버도 400) */
const BLOCKED_MEMBER_STATES = ['BLOCK', 'LEAVE_WAIT'];

/**
 * U3 예약 — 상품 · 날짜 · 그룹 · 시간대 · 호수를 골라 예약(큐)하고 결제위젯을 연다
 *
 * @param param0
 * @returns
 */
export default function BookingContent({storeId, roomGroupId}: BookingContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                                            // 로그인 · 없는 업체로 이동
    const auth = useContext(AuthContext);                                  // 예약은 이용자만
    const {me} = useContext(UserMeContext);                                // 회원 상태 — 이용 제한이면 막음
    const storePath = `/stores/${encodeURIComponent(storeId)}/`;           // U2 — 뒤로
    const bookingPath = `${storePath}booking/`;                            // 이 화면 — 로그인 · 결제 뒤 돌아올 곳
    const leaveNotFound = useEffectEvent((): void => {
        showErrorPopup(STORE_NOT_FOUND_MESSAGE);
        router.replace('/');
    });                                                                    // 없는 업체 — 안내 뒤 첫 화면

    // 상태
    const [openedAt] = useState<string>(() => new Date().toISOString());                       // 들어온 시각 — 달력의 오늘 · 열리는 마지막 날 기준
    const [store, setStore] = useState<DiscoveryStoreDetailResultDto | null>(null);             // 업체 — 상품 · 예약 열림
    const [planType, setPlanType] = useState<string>('');                                     // 고른 상품
    const [date, setDate] = useState<string>('');                                             // 고른 날짜
    const [month, setMonth] = useState<string>('');                                           // 달력에 보이는 달
    const [nights, setNights] = useState<number | null>(null);                                // 연박 박수
    const [availability, setAvailability] = useState<ReservationAvailabilityResultDto | null>(null); // 예약 가능 시간 — 불러오는 중 null
    const [availabilityFailed, setAvailabilityFailed] = useState<boolean>(false);             // 예약 가능 시간을 못 불러옴 — 다시 불러오기
    const [reloadKey, setReloadKey] = useState<number>(0);                                    // 다시 불러오기(예약 실패 · 늦어짐 · 결제 마감)
    const [groupId, setGroupId] = useState<string | null>(roomGroupId);                       // 보이는 객실 그룹
    const [slotStart, setSlotStart] = useState<string | null>(null);                          // 고른 시간대(시작 시각)
    const [roomId, setRoomId] = useState<string | null>(null);                                // 고른 호수
    const [submitting, setSubmitting] = useState<boolean>(false);                             // 예약 요청 중
    const [booked, setBooked] = useState<BookedType | null>(null);                            // 결제 대기 — 있으면 결제 화면

    // 계산 값
    const today = toKst(openedAt, 'YYYY-MM-DD');                                                       // 오늘(한국)
    const lastOpen = store ? lastOpenDate(openedAt, store.booking_open_hours) : today;                 // 열리는 마지막 날
    const plan = store?.plans.find((item) => item.room_plan_type_id === planType) ?? null;              // 고른 상품 설정
    const groups = availability?.list ?? [];                                                            // 객실 그룹(그룹명 순)
    const groupIndex = Math.max(0, groups.findIndex((item) => item.room_group_id === groupId));         // 보이는 카드
    const group = groups[groupIndex] ?? null;                                                           // 고른 그룹
    const slot = group?.slots.find((item) => item.start_at === slotStart) ?? null;                      // 고른 시간대
    const room = slot?.rooms.find((item) => item.room_id === roomId) ?? null;                           // 고른 호수
    const blocked = BLOCKED_MEMBER_STATES.includes(me?.state_id ?? '');                                 // 이용 제한 · 탈퇴 대기
    const canSubmit = !auth.isLogin || (room !== null && !blocked && !submitting);                      // 예약하기(로그인 안 했으면 로그인으로)
    const summary = group && slot && room ? `${group.room_group_name} · ${room.room_name} · ${formatDateTimeRange(slot.start_at, slot.end_at)}` : '시간대와 호수를 골라 주세요'; // 아래 요약
    const viewGroupId = group?.room_group_id ?? roomGroupId;                                            // 보던 그룹 — 로그인 뒤 그 그룹으로
    const loginReturnPath = viewGroupId ? `${bookingPath}?room_group_id=${encodeURIComponent(viewGroupId)}` : bookingPath; // 로그인 뒤 돌아올 곳
    const carouselKey = `${planType}-${date}-${nights}-${reloadKey}`;                                   // 새로 불러오면 카드를 처음 위치로

    // 효과
    useEffect(() => {
        // ① 업체 상세 — 상품 탭 · 달력 기준, 처음 상품 · 날짜를 고른다(떠나면 취소)
        const controller = new AbortController();
        getStoreDetail(storeId, controller.signal).then((detail) => {
            if (controller.signal.aborted) {
                return;
            }

            if (!detail) {
                leaveNotFound();
                return;
            }

            setStore(detail);
            const first = detail.plans[0];
            if (first) {
                const selection = planSelection(first, today, lastOpenDate(openedAt, detail.booking_open_hours));
                setPlanType(first.room_plan_type_id);
                setDate(selection.date);
                setMonth(selection.date.slice(0, 7));
                setNights(selection.nights);
            }
        }).catch((error: unknown) => {
            if (isStoreNotFound(error)) {
                leaveNotFound();
                return;
            }

            handleApiError(error);
        });

        return () => {
            controller.abort();
        };
    }, [storeId, openedAt, today]);

    useEffect(() => {
        // ② 상품 · 날짜 · 박수가 바뀌면 예약 가능 시간 — 이전 요청은 취소
        if (!planType || !date) {
            return;
        }

        const controller = new AbortController();
        const query = new ReservationAvailabilityDto({store_id: storeId, date, room_plan_type_id: planType, nights: nights === null ? null : String(nights)});
        getAvailability(query, controller.signal).then((result) => {
            if (!controller.signal.aborted) {
                setAvailability(result ?? {room_plan_type_id: planType, date, nights, list: []});
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setAvailabilityFailed(true);
            }
            handleApiError(error);
        });

        return () => {
            controller.abort();
        };
    }, [storeId, planType, date, nights, reloadKey]);

    // 함수
    function choosePlan(next: DiscoveryStorePlanResultDto): void {
        // ② 상품 — 지금 날짜가 그 상품에도 열려 있으면 그대로, 아니면 처음 날짜로. 박수는 연박 최소
        if (submitting || next.room_plan_type_id === planType) {
            return;
        }

        const selection = planSelection(next, today, lastOpen);
        const keep = date !== '' && dayState(date, today, lastOpen, next.days_of_week) === 'open';
        const nextDate = keep ? date : selection.date;
        setPlanType(next.room_plan_type_id);
        setDate(nextDate);
        setMonth(nextDate.slice(0, 7));
        setNights(selection.nights);
        resetSelection();
    }

    function chooseDate(next: string): void {
        // ② 날짜 — 같은 날을 다시 누르면 그대로(결과를 비우면 다시 불러오지 않아 멈춘다)
        if (submitting || next === date) {
            return;
        }

        setDate(next);
        resetSelection();
    }

    function chooseNights(next: number): void {
        // ② 연박 박수 — 같은 박수면 그대로
        if (submitting || next === nights) {
            return;
        }

        setNights(next);
        resetSelection();
    }

    function chooseGroup(index: number): void {
        // ③ 보이는 그룹 — 시간대 · 호수를 비운다
        if (submitting) {
            return;
        }

        setGroupId(groups[index]?.room_group_id ?? null);
        setSlotStart(null);
        setRoomId(null);
    }

    function chooseSlot(start: string): void {
        // ③ 시간대 — 호수를 비운다
        if (submitting) {
            return;
        }

        setSlotStart(start);
        setRoomId(null);
    }

    function chooseRoom(id: string): void {
        // ③ 호수
        if (!submitting) {
            setRoomId(id);
        }
    }

    function resetSelection(): void {
        // 다시 불러오는 동안 고른 시간대 · 호수와 이전 결과를 비운다(그룹은 같은 그룹을 다시 보여 준다)
        setAvailability(null);
        setAvailabilityFailed(false);
        setSlotStart(null);
        setRoomId(null);
    }

    function reload(): void {
        // 같은 조건으로 다시
        resetSelection();
        setReloadKey((key) => key + 1);
    }

    async function submit(): Promise<void> {
        // ④ 예약하기 — 로그인 안 했으면 로그인, DTO 검증 → 큐 → 결제 대기. 실패 · 늦어짐이면 다시 불러온다
        if (!auth.isLogin) {
            router.push(loginUrl('user', loginReturnPath));
            return;
        }

        if (!group || !slot || !room || blocked || submitting) {
            return;
        }

        const dto = toReservationDto({planType, date, nights, slot, roomId: room.room_id});
        if (!(await validateAction(dto))) {
            return;
        }

        setSubmitting(true);
        let result: ReservationResultDto | null;
        try {
            result = await createReservation(auth, dto);
        } catch (error) {
            setSubmitting(false);
            handleApiError(error);
            reload();
            return;
        }

        setSubmitting(false);
        if (!result) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
            reload();
            return;
        }

        setBooked({payment: result, roomLabel: `${group.room_group_name} · ${room.room_name}`, planName: plan?.room_plan_type_name ?? ''}); // ⑤ 결제 대기 화면 — 누른 때의 호실 · 상품
    }

    function expirePayment(): void {
        // ⑤ 결제 마감 — 고르기로 돌아가 다시 불러온다
        setBooked(null);
        reload();
    }

    return (
        // 예약
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="예약" backHref={storePath} />

            {/* 결제 대기 */}
            {store && booked ? (
                <BookingPayment payment={booked.payment} storeName={store.store_name} roomLabel={booked.roomLabel} planName={booked.planName} returnUrl={`/reservation/${encodeURIComponent(booked.payment.reservation_id)}/`} onExpired={expirePayment} />
            ) : null}

            {/* 판매 상품 없음 */}
            {store && !booked && store.plans.length === 0 ? (
                <EmptyState title="지금 예약할 수 있는 상품이 없어요" description="업체 정보에서 영업 · 상품을 확인해 주세요." action={<Link href={storePath} className={buttonClass({variant: 'primary'})}>업체로 돌아가기</Link>} />
            ) : null}

            {/* 고르기 */}
            {store && !booked && store.plans.length > 0 ? (
                <>
                    <div className={styles.body}>
                        {/* 업체 · 상품 탭 */}
                        <section className={styles.band}>
                            <div className={styles.storeHead}>
                                <strong className={styles.storeName}>{store.store_name}</strong>
                                <span className={styles.muted}>이용 시작 {store.booking_open_hours}시간 전부터 예약할 수 있어요</span>
                            </div>
                            <div className={styles.tabs} role="tablist" aria-label="상품">
                                {store.plans.map((item) => (
                                    <button key={item.room_plan_type_id} type="button" role="tab" aria-selected={item.room_plan_type_id === planType} className={item.room_plan_type_id === planType ? `${styles.tab} ${styles.tabActive}` : styles.tab} onClick={() => choosePlan(item)}>
                                        {item.room_plan_type_name}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 날짜 · 연박 박수 */}
                        <section className={styles.section}>
                            <BookingCalendar month={month} today={today} lastOpen={lastOpen} daysBits={plan?.days_of_week ?? 0} selected={date} onMove={(step) => setMonth(shiftMonth(month, step))} onPick={chooseDate} />
                            {plan && plan.room_plan_type_id === 'LONG' && plan.min_nights !== null && plan.max_nights !== null ? (
                                <div className={styles.chips} role="group" aria-label="박수">
                                    {Array.from({length: plan.max_nights - plan.min_nights + 1}, (_, index) => (plan.min_nights ?? 0) + index).map((count) => (
                                        <Chip key={count} pressed={count === nights} onClick={() => chooseNights(count)}>{count}박</Chip>
                                    ))}
                                </div>
                            ) : null}
                        </section>

                        {/* 객실 그룹 */}
                        <section className={styles.groupSection} aria-labelledby="booking-groups-title">
                            <h2 id="booking-groups-title" className={`${styles.sectionTitle} ${styles.padded}`}>객실 그룹</h2>
                            {availability === null && !availabilityFailed ? <p className={`${styles.muted} ${styles.padded}`}>예약할 수 있는 시간을 불러오고 있어요.</p> : null}
                            {availabilityFailed ? (
                                <div className={`${styles.failed} ${styles.padded}`}>
                                    <p className={styles.muted}>예약할 수 있는 시간을 불러오지 못했어요.</p>
                                    <Button size="sm" onClick={reload}>다시 불러오기</Button>
                                </div>
                            ) : null}
                            {availability !== null && groups.length === 0 ? <p className={`${styles.muted} ${styles.padded}`}>이 날은 예약할 수 있는 객실이 없어요.</p> : null}
                            {groups.length > 0 ? <RoomGroupCarousel key={carouselKey} groups={groups} index={groupIndex} onChange={chooseGroup} /> : null}
                        </section>

                        {/* 시간대 */}
                        {group && group.slots.length > 0 ? (
                            <section className={styles.section} aria-labelledby="booking-slots-title">
                                <div className={styles.sectionHead}>
                                    <h2 id="booking-slots-title" className={styles.sectionTitle}>시간대</h2>
                                    <span className={styles.muted}>{plan?.room_plan_type_id === 'HOURLY' ? `이용 ${plan.usage_hours}시간 · 시작은 30분 단위` : `입실 ${plan?.check_in_time ?? ''} · 퇴실 ${plan?.check_out_time ?? ''}`}</span>
                                </div>
                                <div className={styles.slots}>
                                    {group.slots.map((item) => {
                                        const label = slotLabel(item, planType);
                                        const selected = item.start_at === slotStart;
                                        return (
                                            <button key={item.start_at} type="button" aria-pressed={selected} className={[styles.choice, styles.slot, selected ? styles.selected : '', item.is_now === 1 ? styles.now : ''].filter(Boolean).join(' ')} onClick={() => chooseSlot(item.start_at)}>
                                                <span className={styles.slotMain}>{label.main}</span>
                                                <span className={styles.slotSub}>{label.sub}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        ) : null}

                        {/* 호수 */}
                        {slot ? (
                            <section className={styles.section} aria-labelledby="booking-rooms-title">
                                <div className={styles.sectionHead}>
                                    <h2 id="booking-rooms-title" className={styles.sectionTitle}>호수</h2>
                                    <span className={styles.muted}>{formatTimeRange(slot.start_at, slot.end_at)} 에 예약할 수 있는 호수</span>
                                </div>
                                <div className={styles.rooms}>
                                    {slot.rooms.map((item) => (
                                        <button key={item.room_id} type="button" aria-pressed={item.room_id === roomId} className={[styles.choice, styles.room, item.room_id === roomId ? styles.selected : ''].filter(Boolean).join(' ')} onClick={() => chooseRoom(item.room_id)}>
                                            <span className={styles.roomName}>{item.room_name}</span>
                                            <span className={styles.roomFloor}>{floorLabel(item.floor)}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {/* 회원 상태 — 이용 제한 · 탈퇴 대기 */}
                        <MemberStateBand me={me} />
                    </div>

                    {/* 요약 · 결제 금액 · 예약하기 */}
                    <div className={`${pageStyles.footer} ${pageStyles.footerCol}`}>
                        <span className={styles.summary}>{summary}</span>
                        <div className={styles.amountRow}>
                            <span className={styles.amountLabel}>결제 금액</span>
                            <strong className={styles.amount}>{group ? formatPrice(group.price) : '-'}</strong>
                        </div>
                        <Button variant="primary" size="lg" full disabled={!canSubmit} onClick={submit}>{auth.isLogin ? '예약하기' : '로그인하고 예약하기'}</Button>
                    </div>
                </>
            ) : null}
        </div>
    );
}
