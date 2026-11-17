# Plan — 예약 · 결제

> 무엇을·왜는 [spec](../../spec/reservation/booking-payment-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 화면마다 비즈니스 로직 — 이 프로젝트는 서비스 계층 없이 `<화면>Content` 안 함수에 둔다(AGENTS.md "화면 로직") ② 계산 함수 ③ 규약만으로 예측할 수 없는 부분(결제위젯 돌아갈 주소 · 없는 업체 처리 옮기기 · 상태 색) ④ 시안 값 스타일(형제 없음)
> **싣지 않는 것** page.tsx, DTO 사본, contracts 함수 — 따르는 패턴을 표 한 줄로 가리킨다
>
> Phase 8 plan(`my-reservation-plan.md`)과 함께 build · ship 한다. 지침서 frontend/screens.md U3(:68-77) · U4(:79-87) · frontend/api.md 결제(:74-79) · 이용자 예약(:112-127), 시안 frontend/design/user.html U3-select(:580-727) · U3-payment(:728-772) · U4-success(:773-803) · U4-fail(:804-834).

## 선행 조건

- [x] 결제위젯 · 결제 승인 route 가 있다 (Phase 4 — `src/shared/components/payment/TossPaymentWidget.tsx`, `src/app/api/payments/confirm/`)
- [x] swiper 가 있다 (Phase 6 — `package.json`)
- [x] 이용자 틀 · 로그인 가드 · 내 정보가 있다 (Phase 5 — `AuthGuard` · `UserMeContext` · `MemberStateBand`)

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/app/(user)/stores/[store_id]/booking/BookingContent.tsx` | 신규 | 예약 화면 — 고르기 · 예약(큐) · 결제 대기 | 아래 1-1 |
| `src/app/(user)/stores/[store_id]/booking/_components/BookingCalendar.tsx` · `RoomGroupCarousel.tsx` · `BookingPayment.tsx` | 신규 | 달력 · 객실 그룹 넘기기(swiper) · 결제 대기 | 아래 1-1 |
| `src/app/(user)/payments/success/PaymentSuccessContent.tsx` · `src/app/(user)/payments/_components/PaymentFailView.tsx` | 신규 | 결제 성공 — 승인 · 확인 · 결과 화면 | 아래 1-2 |
| `src/app/(user)/payments/fail/PaymentFailContent.tsx` | 신규 | 결제 실패 | 아래 1-3 |
| `src/app/(user)/stores/[store_id]/booking/calendar.ts` | 신규 | 달력 계산 | 아래 2-1 |
| `src/app/(user)/stores/[store_id]/booking/booking-flow.ts` | 신규 | 예약 요청 값 · 시간대 칩 글자 · 상품을 고를 때 날짜 · 층 글자 | 아래 2-2 |
| `src/shared/utils/format.ts` | 수정 | 이용 시간 · 구간 시간 글자(U3 · U6 ~ U9) | 아래 2-3 |
| `src/app/(user)/payments/payment-result.ts` | 신규 | 결제 뒤 돌아갈 주소 | 아래 2-4 |
| `src/shared/components/payment/TossPaymentWidget.tsx` | 수정 | 돌아갈 주소 붙이기 · `finally` 없애기 | 아래 3-1 |
| `src/app/(user)/stores/[store_id]/store-not-found.ts` · `StoreDetailContent.tsx` | 신규 · 수정 | 없는 업체 처리를 업체 상세 · 예약이 같이 쓴다 | 아래 3-2 |
| `src/app/(user)/reservation/reservation-state.ts` | 신규 | 예약 · 결제 상태 → 배지 · 띠 색(U4 · U6 · U7) | 아래 3-3 |
| `src/contracts/reservation/dto/` 3개(`reservation-availability` · `reservation` · `reservation-payment-confirm`) | 신규 | 지침서 사본 — Phase 8 의 9개와 한 번에 | 생략 |
| `src/contracts/reservation/api.ts` | 신규 | `getAvailability` · `createReservation` · `confirmPayment`(Phase 8 함수도 같은 파일) | 생략 |
| `src/app/(user)/stores/[store_id]/booking/page.tsx` · `src/app/(user)/payments/success/page.tsx` · `src/app/(user)/payments/fail/page.tsx` | 신규 | 얇은 page | 생략 |
| `src/app/css/user/ReservationPage.module.css` · `BookingContent.module.css` · `BookingCalendar.module.css` · `RoomGroupCarousel.module.css` | 신규 | 시안 값 — `ReservationPage` 는 U3 결제 대기 · U4 · U6 ~ U9 공통 | 아래 5 |
| `src/test/app/(user)/stores/[store_id]/booking/calendar.test.ts` · `booking-flow.test.ts` · `BookingContent.test.tsx` · `src/test/app/(user)/payments/payment-result.test.ts` · `success/PaymentSuccessContent.test.tsx` · `src/test/shared/utils/format.test.ts`(더함) | 신규 · 수정 | spec 테스트 | 아래 테스트 |
| `AGENTS.md` · `docs/integrations.md` · `docs/data-layer.md` · `docs/conventions.md` | 수정 | 이용 시간 글자 · 결제 `return_url` · 결제 결과 흐름 · React Compiler 가 건너뛰는 try 모양 | 만드는 순서 6 |

---

## 1. 비즈니스 로직 — 화면별 코드

spec 의 "동작 흐름" 번호와 주석 번호가 같다. 형제: `StoreDetailContent`(Phase 6 — 효과 안 `AbortController`, 없는 업체는 효과 이벤트로 안내 뒤 `/`) · `HomeContent`(try 안에는 await 만 — React Compiler).

### 1-1. 예약 화면 — `BookingContent`

업체 상세 효과는 `[storeId]` 에만, 빈 시간 효과는 상품 · 날짜 · 박수 · 다시 불러오기에만 건다 — 화면을 그릴 때마다 새로 만들어지는 `router` 를 의존에 넣으면 두 번 부른다(Phase 6 에서 겪음). 예약 결과 처리는 `try` 밖에서 한다.

```tsx
// src/app/(user)/stores/[store_id]/booking/BookingContent.tsx
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
import pageStyles from '@/app/css/user/ReservationPage.module.css';
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
```

화면 조각 — 시안 U3-select · U3-payment 그대로. 달력은 직접 그린다(사용자 결정), 그룹 넘기기는 Phase 6 swiper(`A11y` · `Keyboard`).

```tsx
// src/app/(user)/stores/[store_id]/booking/_components/BookingCalendar.tsx
import { DAY_NAMES, formatMonthDayWeek } from '@/shared/utils/format';
import { buildMonthCells, dayState, monthNav } from '../calendar';
import styles from '@/app/css/user/BookingCalendar.module.css';

type BookingCalendarProps = {
    month: string;                  // 보이는 달 'YYYY-MM'
    today: string;                  // 오늘(한국)
    lastOpen: string;               // 열리는 마지막 날
    daysBits: number;               // 상품 판매 요일 비트
    selected: string;               // 고른 날
    onMove: (step: number) => void; // 달 이동(-1 · 1)
    onPick: (date: string) => void; // 날 고르기(열린 날만)
};

/** 화살표 — 시안 user.html U3 달 이동 */
const CHEVRON_LEFT = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>;
const CHEVRON_RIGHT = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>;

/** 흐린 날 설명 */
const DAY_STATE_LABEL: Record<string, string> = {past: '지난 날', 'not-open': '아직 예약이 열리지 않음', closed: '이 상품을 팔지 않는 요일'};

/**
 * 예약 달력 — 월 격자 · 이전 / 다음 달 · 지난 날 · 안 열린 날 · 팔지 않는 요일은 흐리게(시안 user.html U3-select)
 *
 * @param param0
 * @returns
 */
export default function BookingCalendar({month, today, lastOpen, daysBits, selected, onMove, onPick}: BookingCalendarProps): React.ReactNode {
    // 계산 값
    const cells = month ? buildMonthCells(month) : [];          // 앞 빈칸 + 날짜
    const nav = monthNav(month, today, lastOpen);               // 이전 · 다음 달 버튼
    const [year, monthNumber] = month.split('-').map(Number);   // 달 이름

    return (
        // 달력
        <div className={styles.calendar}>
            {/* 제목 · 고른 날 */}
            <div className={styles.head}>
                <h2 className={styles.title}>날짜</h2>
                {selected ? <span className={styles.picked}>{formatMonthDayWeek(selected)} 선택됨</span> : null}
            </div>

            {/* 달 이동 */}
            <div className={styles.monthRow}>
                <button type="button" className={styles.navButton} aria-label="이전 달" disabled={!nav.prev} onClick={() => onMove(-1)}>{CHEVRON_LEFT}</button>
                <strong className={styles.monthLabel}>{year}년 {monthNumber}월</strong>
                <button type="button" className={styles.navButton} aria-label="다음 달" disabled={!nav.next} onClick={() => onMove(1)}>{CHEVRON_RIGHT}</button>
            </div>

            {/* 요일 · 날짜 */}
            <div className={styles.grid}>
                {DAY_NAMES.map((name) => <span key={name} className={styles.weekday}>{name}</span>)}
                {cells.map((cell, index) => {
                    if (cell === null) {
                        return <span key={`blank-${index}`} />;
                    }

                    const state = dayState(cell, today, lastOpen, daysBits);
                    const isSelected = cell === selected;
                    return (
                        <button key={cell} type="button" disabled={state !== 'open'} aria-pressed={isSelected} aria-label={`${formatMonthDayWeek(cell)}${state === 'open' ? '' : ` — ${DAY_STATE_LABEL[state]}`}`} className={[styles.day, state === 'open' ? styles.open : '', isSelected ? styles.selected : ''].filter(Boolean).join(' ')} onClick={() => onPick(cell)}>
                            {Number(cell.slice(8))}
                            {cell === today ? <span className={styles.todayMark}>오늘</span> : null}
                        </button>
                    );
                })}
            </div>

            {/* 안내 */}
            <p className={styles.note}>흐린 날짜는 지난 날 · 아직 예약이 열리지 않은 날 · 이 상품을 팔지 않는 요일이에요.</p>
        </div>
    );
}
```

```tsx
// src/app/(user)/stores/[store_id]/booking/_components/RoomGroupCarousel.tsx
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
```

```tsx
// src/app/(user)/stores/[store_id]/booking/_components/BookingPayment.tsx
import { RESERVATION_PAYMENT_PENDING_MINUTES, RESERVATION_REBOOK_BLOCK_MINUTES } from '@/contracts/common/reservation.constants';
import { ReservationResultDto } from '@/contracts/reservation/dto/reservation.dto';
import TossPaymentWidget from '@/shared/components/payment/TossPaymentWidget';
import { formatDateTimeRange, formatPrice, toKst } from '@/shared/utils/format';
import styles from '@/app/css/user/ReservationPage.module.css';

type BookingPaymentProps = {
    payment: ReservationResultDto; // 예약 생성 done — 결제 정보 · 이용 시간
    storeName: string;             // 업체
    roomLabel: string;             // "그룹 · 호실"
    planName: string;              // 상품 이름
    returnUrl: string;             // 결제 뒤 돌아갈 곳(이 예약 화면)
    onExpired: () => void;         // 결제 마감
};

/** 시계 — 시안 결제 대기 */
const CLOCK_ICON = <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;

/**
 * U3 결제 대기 — 결제 마감 안내 · 예약 내용 · 결제위젯(시안 user.html U3-payment, 남은 시간은 위젯 안 표시)
 *
 * @param param0
 * @returns
 */
export default function BookingPayment({payment, storeName, roomLabel, planName, returnUrl, onExpired}: BookingPaymentProps): React.ReactNode {
    return (
        // 결제 대기
        <div className={styles.body}>
            {/* 결제 마감 안내 */}
            <section className={`${styles.card} ${styles.hero}`}>
                <span className={`${styles.icon} ${styles.icon48} ${styles.warn}`}>{CLOCK_ICON}</span>
                <h2 className={styles.heroTitle}>결제를 기다리고 있어요</h2>
                <p className={styles.heroText}>결제 마감 {toKst(payment.expires_at, 'HH:mm')}</p>
                <p className={styles.note}>{RESERVATION_PAYMENT_PENDING_MINUTES}분 안에 결제하지 않으면 예약이 만료돼요.<br />만료 뒤 {RESERVATION_REBOOK_BLOCK_MINUTES}분 동안은 같은 호실을 다시 예약할 수 없어요.</p>
            </section>

            {/* 예약 내용 */}
            <section className={styles.card} aria-labelledby="booking-payment-summary">
                <h2 id="booking-payment-summary" className={styles.cardTitle}>예약 내용</h2>
                <dl className={styles.dl}>
                    <dt>업체</dt><dd>{storeName}</dd>
                    <dt>객실</dt><dd>{roomLabel}</dd>
                    <dt>상품</dt><dd>{planName}</dd>
                    <dt>이용</dt><dd>{formatDateTimeRange(payment.start_at, payment.end_at)}</dd>
                    <dt>주문명</dt><dd>{payment.order_name}</dd>
                </dl>
                <div className={styles.total}>
                    <span className={styles.totalLabel}>결제 금액</span>
                    <strong className={styles.totalValue}>{formatPrice(payment.amount)}</strong>
                </div>
            </section>

            {/* 결제위젯 — 남은 시간 · 결제수단 · 약관 · 결제하기 */}
            <section className={styles.card}>
                <TossPaymentWidget payment={payment} returnUrl={returnUrl} onExpired={onExpired} />
            </section>
        </div>
    );
}
```

### 1-2. 결제 성공 — `PaymentSuccessContent`

승인 · 확인은 한 번만 — 개발 모드에서 효과가 두 번 돌아도 `startedRef` 로 막는다. 잘못된 query 는 처음 상태를 바로 실패 화면으로(효과 안에서 setState 하지 않는다). 토스가 거절하면 결제 확인을 부르지 않는다.

```tsx
// src/app/(user)/payments/success/PaymentSuccessContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { confirmPayment } from '@/contracts/reservation/api';
import { ReservationPaymentConfirmDto, ReservationPaymentConfirmResultDto } from '@/contracts/reservation/dto/reservation-payment-confirm.dto';
import { AuthType, LoginRequiredError } from '@/shared/api/auth';
import { NETWORK_ERROR_MESSAGE } from '@/shared/api/error';
import { requestTossConfirm, TossConfirmQueryType } from '@/shared/api/payment';
import { ApiError } from '@/shared/api/request';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { reservationStateTone } from '../../reservation/reservation-state';
import PaymentFailView from '../_components/PaymentFailView';
import { paymentReturnPath } from '../payment-result';
import styles from '@/app/css/user/ReservationPage.module.css';

type PaymentSuccessContentProps = {
    paymentKey: string | null; // 토스 결제 키
    orderId: string | null;    // 우리 결제 ID
    amount: string | null;     // 결제 금액(토스가 붙임)
    returnUrl: string | null;  // 다시 고르기 — 결제위젯이 붙인 return_url
};

/** 결과 화면 */
type ResultViewType =
    | {kind: 'checking'}
    | {kind: 'done'; reservationId: string; stateId: string}
    | {kind: 'fail'; message: string; code: string | null}
    | {kind: 'retry'; message: string}
    | {kind: 'late'};

/** 성공 주소에 결제 정보가 빠졌을 때 */
const PAYMENT_INVALID_MESSAGE = '결제 정보가 올바르지 않습니다.';

/** 결제 확인 큐가 결과 없이 끝났을 때 */
const PAYMENT_LATE_MESSAGE = '결제 확인이 늦어지고 있어요. 잠시 뒤 내 예약에서 확인해 주세요.';

/** 확인 · 확정 아이콘 — 시안 U4 */
const CHECK_ICON = <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const CLOCK_ICON = <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;

/**
 * U4 결제 성공 — 토스 승인(route) → 백엔드 결제 확인(큐)을 한 번만 하고 결과를 보여 준다
 *
 * @param param0
 * @returns
 */
export default function PaymentSuccessContent({paymentKey, orderId, amount, returnUrl}: PaymentSuccessContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                    // 결제 확인 API 토큰
    const valid = Boolean(paymentKey && orderId && amount);  // 성공 주소에 결제 정보가 다 있는지
    const query: TossConfirmQueryType = {paymentKey: paymentKey ?? '', orderId: orderId ?? '', amount: Number(amount)}; // 토스 승인에 넘길 값
    const startedRef = useRef<boolean>(false);               // 승인 · 확인을 시작했는지 — 효과가 두 번 돌아도 한 번만
    const loadView = useEffectEvent(() => confirmView(auth, query)); // 그때의 값으로 승인 · 확인(효과를 다시 걸지 않는다)

    // 상태
    const [view, setView] = useState<ResultViewType>(valid ? {kind: 'checking'} : {kind: 'fail', message: PAYMENT_INVALID_MESSAGE, code: null}); // 결과 화면

    // 계산 값
    const backPath = paymentReturnPath(returnUrl); // 다시 고르기

    // 효과
    useEffect(() => {
        // ① 들어오면 한 번 — 승인 · 확인
        if (!valid || startedRef.current) {
            return;
        }

        startedRef.current = true;
        loadView().then(setView);
    }, [valid]);

    // 함수
    function retry(): void {
        // 다시 확인 — 토스 · 백엔드 모두 같은 결제를 다시 확인해도 된다
        setView({kind: 'checking'});
        confirmView(auth, query).then(setView);
    }

    return (
        // 결제 결과
        <div className={styles.page}>
            {/* 머리 */}
            <header className={styles.plainHeader}><h1 className={styles.plainTitle}>결제 결과</h1></header>

            {/* 실패 — 사유 · 오류 코드 · 다시 고르기 */}
            {view.kind === 'fail' ? <PaymentFailView message={view.message} code={view.code} backPath={backPath} /> : null}

            {/* 확인 중 · 확정 · 다시 확인 · 늦어짐 */}
            {view.kind !== 'fail' ? (
                <>
                    <div className={styles.resultBody}>
                        <div className={styles.resultHero}>
                            <span className={[styles.icon, styles.icon64, view.kind === 'done' ? styles.ok : view.kind === 'checking' ? styles.neutral : styles.warn].join(' ')}>{view.kind === 'done' ? CHECK_ICON : CLOCK_ICON}</span>
                            <h2 className={styles.heroTitle}>{view.kind === 'done' ? '예약이 확정되었어요' : view.kind === 'checking' ? '결제를 확인하고 있어요' : view.kind === 'late' ? '처리가 늦어지고 있어요' : '결제를 확인하지 못했어요'}</h2>
                            <p className={styles.heroText}>
                                {view.kind === 'done' ? '결제가 확인되었어요. 이용 시작 시각부터 예약 화면에서 QR 을 볼 수 있어요.' : null}
                                {view.kind === 'checking' ? '잠시만 기다려 주세요.' : null}
                                {view.kind === 'late' ? PAYMENT_LATE_MESSAGE : null}
                                {view.kind === 'retry' ? view.message : null}
                            </p>
                        </div>

                        {/* 상태 · 예약 번호 */}
                        {view.kind === 'done' ? (
                            <section className={`${styles.card} ${styles.stretch}`}>
                                <div className={styles.rowBetween}>
                                    <span className={styles.label}>상태</span>
                                    <Badge tone={reservationStateTone(view.stateId)}>{lookupName('reservation_state_id', view.stateId)}</Badge>
                                </div>
                                <div className={styles.stack}>
                                    <span className={styles.label}>예약 번호</span>
                                    <span className={styles.mono}>{view.reservationId}</span>
                                </div>
                            </section>
                        ) : null}
                    </div>

                    {/* 다음 */}
                    <div className={styles.footer}>
                        {view.kind === 'done' ? <Link href={`/reservation/${encodeURIComponent(view.reservationId)}/`} className={buttonClass({variant: 'primary', size: 'lg', full: true})}>예약 보기</Link> : null}
                        {view.kind === 'late' ? <Link href="/reservation/" className={buttonClass({variant: 'primary', size: 'lg', full: true})}>내 예약</Link> : null}
                        {view.kind === 'retry' ? <Button variant="primary" size="lg" full onClick={retry}>다시 확인</Button> : null}
                        {view.kind === 'checking' ? <Button variant="primary" size="lg" full disabled>확인하고 있어요</Button> : null}
                    </div>
                </>
            ) : null}
        </div>
    );
}

/**
 * ① 토스 승인 → ② 결제 확인 → ③ · ④ 결과 화면 값 — setState 없이 값만 돌려준다(들어올 때의 효과 · "다시 확인"이 같이 쓴다)
 *
 * @param auth AuthContext 값
 * @param query 토스가 붙여 준 결제 키 · 주문 번호 · 금액
 */
async function confirmView(auth: AuthType, query: TossConfirmQueryType): Promise<ResultViewType> {
    const toss = await requestTossConfirm(query).catch((): null => null);
    if (!toss) { // ④ 토스 쪽 장애 · 응답 없음 — 다시 확인
        return {kind: 'retry', message: NETWORK_ERROR_MESSAGE};
    }

    if (!toss.success) { // ③ 거절 — 결제 확인을 부르지 않는다 / ④ 장애
        return toss.retry ? {kind: 'retry', message: toss.message ?? NETWORK_ERROR_MESSAGE} : {kind: 'fail', message: toss.message ?? PAYMENT_INVALID_MESSAGE, code: toss.code ?? null};
    }

    // ② 승인되면 결제 확인(큐)
    const dto = Object.assign(new ReservationPaymentConfirmDto(), {payment_id: query.orderId, payment_key: query.paymentKey});
    let result: ReservationPaymentConfirmResultDto | null;
    try {
        result = await confirmPayment(auth, dto);
    } catch (error) {
        return failView(error);
    }

    // ③ 확정 · ④ 늦어짐
    return result ? {kind: 'done', reservationId: result.reservation_id, stateId: result.reservation_state_id} : {kind: 'late'};
}

/**
 * 결제 확인 실패 → 화면 — 백엔드 실패는 사유 · 결제 오류 코드, 응답 없음은 다시 확인, 로그인 만료는 로그인 화면으로 가는 중
 *
 * @param error 잡은 오류
 */
function failView(error: unknown): ResultViewType {
    if (error instanceof ApiError) {
        const code = (error.body as {payment_error_code?: unknown}).payment_error_code;
        return {kind: 'fail', message: error.body.message, code: typeof code === 'string' ? code : null};
    }

    if (error instanceof LoginRequiredError) {
        return {kind: 'checking'};
    }

    return {kind: 'retry', message: NETWORK_ERROR_MESSAGE};
}
```

```tsx
// src/app/(user)/payments/_components/PaymentFailView.tsx
import Link from 'next/link';
import { buttonClass } from '@/shared/components/ui/button/Button';
import styles from '@/app/css/user/ReservationPage.module.css';

type PaymentFailViewProps = {
    message: string;     // 사유
    code: string | null; // 토스 · 결제 오류 코드
    backPath: string;    // 돌아갈 곳 — 결제한 예약 1건(없으면 첫 화면)
};

/** 돌아갈 곳이 없을 때(첫 화면) */
const HOME_PATH = '/';

/** X — 시안 U4 실패 */
const X_ICON = <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7l10 10" /><path d="M17 7L7 17" /></svg>;

/**
 * 결제 실패 화면 — 사유 · 오류 코드 · 예약으로 돌아가기(시안 user.html U4-fail) — 오류 팝업은 띄우지 않는다
 * - 돌아갈 곳은 결제한 예약 1건(U7) — 결제 마감 전이면 거기서 다시 결제하거나 취소한다
 *
 * @param param0
 * @returns
 */
export default function PaymentFailView({message, code, backPath}: PaymentFailViewProps): React.ReactNode {
    // 계산 값
    const backLabel = backPath === HOME_PATH ? '처음으로' : '예약으로 돌아가기'; // 돌아가기 버튼 글자

    return (
        // 결제 실패
        <>
            <div className={styles.resultBody}>
                {/* 안내 */}
                <div className={styles.resultHero}>
                    <span className={`${styles.icon} ${styles.icon64} ${styles.danger}`}>{X_ICON}</span>
                    <h2 className={styles.heroTitle}>결제하지 못했어요</h2>
                    <p className={styles.heroText}>결제 마감 전이면 예약에서 다시 결제할 수 있어요.<br />마감이 지났으면 시간대와 호수를 다시 골라 주세요.</p>
                </div>

                {/* 사유 · 오류 코드 */}
                <section className={`${styles.card} ${styles.stretch}`}>
                    <div className={styles.stack}>
                        <span className={styles.label}>사유</span>
                        <strong className={styles.dangerText}>{message}</strong>
                    </div>
                    {code ? (
                        <div className={styles.stack}>
                            <span className={styles.label}>오류 코드</span>
                            <span className={styles.mono}>{code}</span>
                        </div>
                    ) : null}
                </section>
            </div>

            {/* 예약으로 돌아가기 */}
            <div className={styles.footer}>
                <Link href={backPath} className={buttonClass({variant: 'primary', size: 'lg', full: true})}>{backLabel}</Link>
            </div>
        </>
    );
}
```

### 1-3. 결제 실패 — `PaymentFailContent`

```tsx
// src/app/(user)/payments/fail/PaymentFailContent.tsx
'use client';
import PaymentFailView from '../_components/PaymentFailView';
import { paymentReturnPath } from '../payment-result';
import styles from '@/app/css/user/ReservationPage.module.css';

type PaymentFailContentProps = {
    code: string | null;      // 토스 오류 코드(PAY_PROCESS_CANCELED — 사용자가 취소 등)
    message: string | null;   // 토스 오류 문구
    returnUrl: string | null; // 다시 고르기 — 결제위젯이 붙인 return_url
};

/** 토스 문구가 없을 때 */
const PAYMENT_FAIL_MESSAGE = '결제를 마치지 못했어요.';

/**
 * U4 결제 실패 — 토스가 돌려준 사유 · 코드와 다시 고르기
 *
 * @param param0
 * @returns
 */
export default function PaymentFailContent({code, message, returnUrl}: PaymentFailContentProps): React.ReactNode {
    return (
        // 결제 결과
        <div className={styles.page}>
            {/* 머리 */}
            <header className={styles.plainHeader}><h1 className={styles.plainTitle}>결제 결과</h1></header>

            {/* ① 사유 · 코드 · ② 다시 고르기 */}
            <PaymentFailView message={message || PAYMENT_FAIL_MESSAGE} code={code} backPath={paymentReturnPath(returnUrl)} />
        </div>
    );
}
```

---

## 2. 계산 함수

### 2-1. 예약할 수 있는 마지막 날 · 달력 칸 배치 · 날짜를 고를 수 있는지 · 달 넘기기 · 처음 고르는 날짜 — `calendar.ts`

날짜는 모두 한국 날짜 문자열(`YYYY-MM-DD`)로 다룬다. 요일은 `Date.UTC` 로 구해 실행 환경 시간대와 상관없게 한다.

```ts
// src/app/(user)/stores/[store_id]/booking/calendar.ts
import { toKst } from '@/shared/utils/format';

/** 달력 날 하나 — past: 지난 날, not-open: 아직 예약이 안 열림, closed: 그 상품을 팔지 않는 요일, open: 고를 수 있음 */
export type DayStateType = 'past' | 'not-open' | 'closed' | 'open';

/** 달 이동 버튼을 누를 수 있는지 */
export type MonthNavType = {
    prev: boolean; // 이전 달
    next: boolean; // 다음 달
};

/** 1시간(ms) */
const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * 열리는 마지막 날 — 지금 + 예약 열림 시간의 한국 날짜
 *
 * @param nowIso 지금(ISO)
 * @param bookingOpenHours 업체 예약 가능 시작(시간)
 */
export function lastOpenDate(nowIso: string, bookingOpenHours: number): string {
    return toKst(new Date(Date.parse(nowIso) + bookingOpenHours * MS_PER_HOUR).toISOString(), 'YYYY-MM-DD');
}

/**
 * 'YYYY-MM' → 일요일부터 7칸 격자 — 앞 빈칸(null) + 'YYYY-MM-DD' 날짜들
 *
 * @param month 달
 */
export function buildMonthCells(month: string): Array<string | null> {
    const [year, monthNumber] = month.split('-').map(Number);
    const blanks = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
    const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    return [
        ...Array.from({length: blanks}, (): null => null),
        ...Array.from({length: dayCount}, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`),
    ];
}

/**
 * 달력 날 하나를 고를 수 있는지 — 지난 날 → 안 열린 날 → 팔지 않는 요일 순
 *
 * @param date 날짜
 * @param today 오늘(한국)
 * @param lastOpen 열리는 마지막 날
 * @param daysBits 상품 판매 요일 비트(일 1 · … · 토 64)
 */
export function dayState(date: string, today: string, lastOpen: string, daysBits: number): DayStateType {
    if (date < today) {
        return 'past';
    }

    if (date > lastOpen) {
        return 'not-open';
    }

    return (daysBits & (1 << weekdayOf(date))) === 0 ? 'closed' : 'open';
}

/**
 * 달 이동 — 오늘의 달보다 앞으로, 열리는 마지막 날의 달보다 뒤로는 못 감
 *
 * @param month 보이는 달
 * @param today 오늘
 * @param lastOpen 열리는 마지막 날
 */
export function monthNav(month: string, today: string, lastOpen: string): MonthNavType {
    return {prev: month > today.slice(0, 7), next: month < lastOpen.slice(0, 7)};
}

/**
 * 처음 고를 날 — 오늘이 열려 있으면 오늘, 아니면 열린 첫 날, 없으면 오늘
 *
 * @param today 오늘
 * @param lastOpen 열리는 마지막 날
 * @param daysBits 판매 요일 비트
 */
export function initialDate(today: string, lastOpen: string, daysBits: number): string {
    for (let date = today; date <= lastOpen; date = shiftDate(date, 1)) {
        if (dayState(date, today, lastOpen, daysBits) === 'open') {
            return date;
        }
    }

    return today;
}

/**
 * 'YYYY-MM' 달을 step 만큼 옮김
 *
 * @param month 달
 * @param step 옮길 달 수(앞 -1 · 뒤 1)
 */
export function shiftMonth(month: string, step: number): string {
    const [year, monthNumber] = month.split('-').map(Number);
    const moved = new Date(Date.UTC(year, monthNumber - 1 + step, 1));
    return `${moved.getUTCFullYear()}-${String(moved.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * 날짜의 요일(0 일 ~ 6 토)
 *
 * @param date 'YYYY-MM-DD'
 */
function weekdayOf(date: string): number {
    return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/**
 * 'YYYY-MM-DD' 를 days 만큼 옮김
 *
 * @param date 날짜
 * @param days 옮길 날 수
 */
function shiftDate(date: string, days: number): string {
    return new Date(Date.parse(`${date}T00:00:00Z`) + days * 24 * MS_PER_HOUR).toISOString().slice(0, 10);
}
```

### 2-2. 예약 요청에 담는 값 · 시간대 칩 글자 — `booking-flow.ts`

지금 바로 칸은 `start_time` 을 보내지 않는다(DTO — `is_now` 와 함께 오면 400).

```ts
// src/app/(user)/stores/[store_id]/booking/booking-flow.ts
import { DiscoveryStorePlanResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import { ReservationAvailabilitySlotResultDto } from '@/contracts/reservation/dto/reservation-availability.dto';
import { ReservationDto } from '@/contracts/reservation/dto/reservation.dto';
import { formatTimeRange, toKst } from '@/shared/utils/format';
import { initialDate } from './calendar';

/** 예약에 고른 것 */
export type BookingSelectionType = {
    planType: string;                                                // 상품 종류(HOURLY · NIGHT · LONG)
    date: string;                                                    // 날짜(한국)
    nights: number | null;                                           // 연박 박수
    slot: Pick<ReservationAvailabilitySlotResultDto, 'start_at' | 'is_now'>; // 시간대
    roomId: string;                                                  // 호실
};

/** 시간대 칩 두 줄 */
export type SlotLabelType = {
    main: string; // 위 줄(시작 · 지금 바로 · 입실)
    sub: string;  // 아래 줄(끝 · 범위 · 퇴실)
};

/**
 * 고른 것 → 예약 생성 본문 — 시간 이용은 시작 시각(한국 HH:mm) 또는 지금 바로(is_now 1), 연박은 박수, 1박은 날짜만
 *
 * @param selection 고른 것
 */
export function toReservationDto(selection: BookingSelectionType): ReservationDto {
    const dto = Object.assign(new ReservationDto(), {room_id: selection.roomId, room_plan_type_id: selection.planType, date: selection.date});
    if (selection.planType === 'HOURLY' && selection.slot.is_now === 1) {
        dto.is_now = 1;
    } else if (selection.planType === 'HOURLY') {
        dto.start_time = toKst(selection.slot.start_at, 'HH:mm');
    }

    if (selection.planType === 'LONG' && selection.nights !== null) {
        dto.nights = selection.nights;
    }

    return dto;
}

/**
 * 시간대 칩 글자 — 시간 이용 '14:30' / '~ 17:30', 지금 바로 '지금 바로' / '14:12 ~ 17:12', 1박 · 연박 '20:00 입실' / '~ 11월 11일 11:00 퇴실'
 *
 * @param slot 시간대
 * @param planType 상품 종류
 */
export function slotLabel(slot: Pick<ReservationAvailabilitySlotResultDto, 'start_at' | 'end_at' | 'is_now'>, planType: string): SlotLabelType {
    const start = toKst(slot.start_at, 'HH:mm');
    if (planType !== 'HOURLY') {
        return {main: `${start} 입실`, sub: `~ ${toKst(slot.end_at, 'M월 D일 HH:mm')} 퇴실`};
    }

    const range = formatTimeRange(slot.start_at, slot.end_at);
    if (slot.is_now === 1) {
        return {main: '지금 바로', sub: range};
    }

    return {main: start, sub: `~ ${range.split(' ~ ')[1]}`};
}

/**
 * 상품을 고를 때의 날짜 · 박수 — 처음 날짜는 initialDate, 연박이면 최소 박수
 *
 * @param plan 업체 상품
 * @param today 오늘
 * @param lastOpen 열리는 마지막 날
 */
export function planSelection(plan: DiscoveryStorePlanResultDto, today: string, lastOpen: string): {date: string; nights: number | null} {
    return {date: initialDate(today, lastOpen, plan.days_of_week), nights: plan.room_plan_type_id === 'LONG' ? plan.min_nights : null};
}

/**
 * 층 글자 — 지하는 'B1층'
 *
 * @param floor 층(지하는 음수)
 */
export function floorLabel(floor: number): string {
    return floor < 0 ? `B${-floor}층` : `${floor}층`;
}
```

### 2-3. 이용 시간 글자 · 구간 시간 글자 — `format.ts`

`toKst`(한국 시각 고정 — `src/shared/utils/format.ts:29`)를 쓴다.

```ts
// src/shared/utils/format.ts — 더함(맨 아래)
/** 하루(ms) */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 'YYYY-MM-DD' → 'M월 D일(요일)' — 날짜 문자열을 시간대 없이 그대로 읽는다
 *
 * @param date 날짜
 */
export function formatMonthDayWeek(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return `${month}월 ${day}일(${DAY_NAMES[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]})`;
}

/**
 * ISO 시각 → 'M월 D일(요일) HH:mm'(한국 시각), 읽을 수 없으면 ''
 *
 * @param iso ISO 시각
 */
export function formatDateTime(iso: string | null | undefined): string {
    const date = toKst(iso, 'YYYY-MM-DD');
    return date ? `${formatMonthDayWeek(date)} ${toKst(iso, 'HH:mm')}` : '';
}

/**
 * 이용 시작 ~ 끝 → '11월 10일(화) 14:30 ~ 17:30', 한국 날짜가 다르면 '11월 14일(토) 20:00 ~ 11월 15일(일) 11:00'
 *
 * @param startIso 시작(ISO)
 * @param endIso 끝(ISO)
 */
export function formatDateTimeRange(startIso: string | null | undefined, endIso: string | null | undefined): string {
    const startDate = toKst(startIso, 'YYYY-MM-DD');
    const endDate = toKst(endIso, 'YYYY-MM-DD');
    if (!startDate || !endDate) {
        return '';
    }

    return `${formatDateTime(startIso)} ~ ${startDate === endDate ? toKst(endIso, 'HH:mm') : formatDateTime(endIso)}`;
}

/**
 * 구간 시작 ~ 끝 → '14:30 ~ 17:30', 다음 날이면 '20:00 ~ 다음 날 11:00', 그 뒤면 '20:00 ~ 11월 13일 11:00'
 *
 * @param startIso 시작(ISO)
 * @param endIso 끝(ISO)
 */
export function formatTimeRange(startIso: string | null | undefined, endIso: string | null | undefined): string {
    const startDate = toKst(startIso, 'YYYY-MM-DD');
    const endDate = toKst(endIso, 'YYYY-MM-DD');
    if (!startDate || !endDate) {
        return '';
    }

    const endTime = toKst(endIso, 'HH:mm');
    const days = Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / MS_PER_DAY);
    const end = days === 0 ? endTime : days === 1 ? `다음 날 ${endTime}` : `${toKst(endIso, 'M월 D일')} ${endTime}`;
    return `${toKst(startIso, 'HH:mm')} ~ ${end}`;
}
```

### 2-4. 결제 뒤 돌아갈 주소 — `payment-result.ts`

```ts
// src/app/(user)/payments/payment-result.ts
import { safeReturnPath } from '@/shared/utils/area';

/**
 * 결제 결과 화면의 return_url → "다시 고르기" 주소 — ? 앞까지를 같은 사이트 주소로만, 없으면 첫 화면
 * - 우리 돌아갈 주소(U3 · U7 · U9)에는 query 가 없다. 토스가 우리 query 뒤에 ? 로 붙였을 때 대비
 *
 * @param raw return_url 값
 */
export function paymentReturnPath(raw: string | null | undefined): string {
    return safeReturnPath(raw ? raw.split('?')[0] : null, 'user');
}
```

---

## 3. 데이터 규칙 — 규약만으로 예측할 수 없는 부분

### 3-1. 결제위젯이 돌아갈 주소를 붙인다 — `TossPaymentWidget.tsx`

`returnUrl` 하나만 더한다. 그리고 `pay` 의 `try … finally` 를 `try … catch` 뒤 처리로 바꾼다 — React Compiler 가 `finally` 있는 try 를 다루지 못해 이 부품을 통째로 건너뛰고 있었다(`babel-plugin-react-compiler` 로 확인).

```tsx
// src/shared/components/payment/TossPaymentWidget.tsx — 바뀌는 곳
import { RETURN_URL_KEY, toSamePath } from '@/shared/utils/area';

type TossPaymentWidgetProps = {
    payment: TossPaymentType;   // 결제 정보
    returnUrl?: string | null;  // 결제 뒤 돌아갈 주소(같은 사이트 path — U3 예약 · U7 결제하기 · U9 연장) — 성공 · 실패 주소에 return_url 로
    onExpired?: () => void;     // 결제 마감이 지나면
};

export default function TossPaymentWidget({payment, returnUrl = null, onExpired}: TossPaymentWidgetProps): React.ReactNode {
    // …(그대로)

    async function pay(): Promise<void> {
        // 결제창 열기 — 창을 닫은 것(USER_CANCEL)은 조용히, 그 밖은 오류 팝업
        const widgets = widgetsRef.current;
        if (!widgets || !canPay) {
            return;
        }

        setRequesting(true);
        let failure: unknown = null; // try 안에는 await 만 — finally · 값 갈래가 있으면 React Compiler 가 건너뛴다
        try {
            await widgets.requestPayment({
                orderId: payment.payment_id,
                orderName: payment.order_name,
                successUrl: paymentResultUrl('success', returnUrl),
                failUrl: paymentResultUrl('fail', returnUrl),
            });
        } catch (error) {
            failure = error;
        }

        setRequesting(false);
        if (failure !== null && errorField(failure, 'code') !== USER_CANCEL_CODE) {
            showErrorPopup(errorField(failure, 'message') ?? PAYMENT_REQUEST_FAIL_MESSAGE);
        }
    }
    // …
}

/**
 * 결제창이 돌아올 주소 — origin + basePath + /payments/<결과>/, 돌아갈 주소가 같은 사이트면 ?return_url=
 *
 * @param result success · fail
 * @param returnUrl 결제 뒤 돌아갈 주소
 */
function paymentResultUrl(result: 'success' | 'fail', returnUrl: string | null): string {
    const base = `${window.location.origin}${withBasePath(`/payments/${result}/`)}`;
    const samePath = toSamePath(returnUrl);
    return samePath ? `${base}?${RETURN_URL_KEY}=${encodeURIComponent(samePath)}` : base;
}
```

### 3-2. 없는 업체 처리를 업체 상세 · 예약이 같이 쓴다 — `store-not-found.ts`

U2 파일 안에 있던 것을 옮기고 U2 의 정의는 지운다.

```ts
// src/app/(user)/stores/[store_id]/store-not-found.ts
import { ApiError } from '@/shared/api/request';

/** 없는 업체 · 잘못된 업체 ID */
export const STORE_NOT_FOUND_MESSAGE = '업체를 찾을 수 없습니다.';

/**
 * 없는 업체인지 — 업체 · 객실 그룹 조회가 404(없음) · 400(ID 모양)
 *
 * @param error 잡은 오류
 */
export function isStoreNotFound(error: unknown): boolean {
    return error instanceof ApiError && (error.status === 404 || error.status === 400);
}
```

```tsx
// src/app/(user)/stores/[store_id]/StoreDetailContent.tsx — 바뀌는 곳: 파일 안 STORE_NOT_FOUND_MESSAGE · isNotFound 를 지우고
import { isStoreNotFound, STORE_NOT_FOUND_MESSAGE } from './store-not-found';
// … `isNotFound(detail.reason)` → `isStoreNotFound(detail.reason)`
```

### 3-3. 상태 → 색 — `reservation-state.ts`

객체 대신 `Map` — 응답 상태 값이 `toString` 같은 prototype 이름이어도 엉뚱한 값을 돌려주지 않는다.

```ts
// src/app/(user)/reservation/reservation-state.ts
/** 상태 배지 · 띠 색 — Badge tone 과 같은 이름 */
export type StateToneType = 'primary' | 'warn' | 'ok' | 'danger' | 'neutral';

/** 예약 상태 → 색(시안 U6 · U7) — Map 이라 'constructor' 같은 상속 이름에 속지 않는다 */
const RESERVATION_STATE_TONE = new Map<string, StateToneType>([['PENDING', 'warn'], ['CONFIRMED', 'primary'], ['CHECKED_IN', 'ok'], ['COMPLETED', 'neutral'], ['CANCELED', 'danger'], ['EXPIRED', 'neutral']]);

/** 결제 상태 → 색(시안 U7 결제 구간) */
const PAYMENT_STATE_TONE = new Map<string, StateToneType>([['READY', 'warn'], ['DONE', 'ok'], ['FAILED', 'danger'], ['EXPIRED', 'neutral'], ['REFUND_REQUESTED', 'warn'], ['REFUNDED', 'neutral'], ['REFUND_FAILED', 'danger']]);

/**
 * 예약 상태 색
 *
 * @param stateId reservation_state_id
 */
export function reservationStateTone(stateId: string): StateToneType {
    return RESERVATION_STATE_TONE.get(stateId) ?? 'neutral';
}

/**
 * 결제 상태 색
 *
 * @param stateId payment_state_id
 */
export function paymentStateTone(stateId: string): StateToneType {
    return PAYMENT_STATE_TONE.get(stateId) ?? 'neutral';
}
```

---

## 4. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| DTO 사본 12개(Phase 7 · 8) | `copy-dto.js` 로 `frontend/dto/reservation.md` 블록을 그대로 — 파일 이름 · 상대 import 유지 | `src/contracts/user/dto/user-token-refresh.dto.ts:5` |
| `getAvailability(query, signal?)` | 공개 조회 — `request` GET `/user-service/reservation/availability`, query `store_id · date · room_plan_type_id · nights` | `src/contracts/discovery/api.ts:12` |
| `createReservation(auth, dto)` · `confirmPayment(auth, dto)` | 이용자 쓰기 — `withAuth` + `callQueue` POST `/user-service/reservation` · `/user-service/reservation/payment-confirm` | `src/contracts/user/api.ts:76` |
| `booking/page.tsx` | 얇은 page — `params.store_id` · `searchParams.room_group_id`(`firstQueryValue`)를 Content 로 | `src/app/(user)/stores/[store_id]/page.tsx:4` · `src/shared/utils/util.ts:21` |
| `payments/success/page.tsx` · `payments/fail/page.tsx` | 같은 모양 — query `paymentKey · orderId · amount · return_url` / `code · message · return_url`, 성공은 `<AuthGuard>` 로 감쌈 | `src/app/(user)/phone-verification/page.tsx:11` |

---

## 5. 스타일 — 시안 값

형제가 없는 새 화면이라 값을 싣는다. 색 · 크기는 `globals.css` 토큰만.

```css
/* src/app/css/user/ReservationPage.module.css — U3 결제 대기 · U4 · U7 · U8 · U9 공통(시안 user.html 카드 · 히어로 · dl · 합계 · 아래 영역) */
.page {
    display: flex;
    flex: 1;
    flex-direction: column;
    background: var(--bg);
}

.plainHeader {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    height: 56px;
    padding: 0 16px;
    border-bottom: 1px solid var(--line);
    background: var(--surface);
}

.plainTitle {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
}

.body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
}

.card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
}

.cardTitle {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
}

.hero {
    align-items: center;
    gap: 8px;
    padding: 20px 16px;
    text-align: center;
}

.icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
}

.icon44 { width: 44px; height: 44px; }
.icon48 { width: 48px; height: 48px; }
.icon64 { width: 64px; height: 64px; }

.primary { background: var(--primary-soft); color: var(--primary-strong); }
.warn { background: var(--warn-soft); color: var(--warn); }
.ok { background: var(--ok-soft); color: var(--ok); }
.danger { background: var(--danger-soft); color: var(--danger); }
.neutral { background: var(--neutral-bg); color: var(--neutral-fg); }

.heroTitle {
    margin: 4px 0 0;
    font-size: 20px;
    font-weight: 700;
}

.heroText {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
}

.dl {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 8px 12px;
    margin: 0;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
}

.dl64 {
    grid-template-columns: 64px minmax(0, 1fr);
}

.dl dt {
    font-weight: 500;
    color: var(--muted);
}

.dl dd {
    margin: 0;
}

.strong {
    font-weight: 700;
}

.total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid var(--line);
}

.totalLabel {
    font-size: 15px;
    font-weight: 700;
}

.totalValue {
    font-size: 20px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.note {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--muted);
}

/* 결과 화면(U4) — 가운데 */
.resultBody {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 48px 16px 16px;
}

.resultHero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
}

.resultHero .heroTitle {
    margin-top: 6px;
}

.stretch {
    align-self: stretch;
}

.rowBetween {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.stack {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.label {
    font-size: 14px;
    font-weight: 500;
    color: var(--muted);
}

.mono {
    font-family: var(--mono);
    font-size: 13px;
    word-break: break-all;
}

.dangerText {
    font-size: 15px;
    font-weight: 700;
    color: var(--danger);
}

/* 아래 고정 영역 */
.footer {
    position: sticky;
    bottom: 0;
    flex-shrink: 0;
    padding: 12px 16px 16px;
    border-top: 1px solid var(--line);
    background: var(--surface);
}

.footerCol {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.footerSplit {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 8px;
}

.footerHalf {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
}
```

```css
/* src/app/css/user/BookingContent.module.css — 시안 user.html U3-select(:580-727) */
.body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
}

.band {
    background: var(--surface);
}

.storeHead {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 16px;
}

.storeName {
    font-size: 16px;
    font-weight: 700;
}

.muted {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
}

.tabs {
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    border-top: 1px solid var(--line);
}

.tab {
    height: var(--control-h);
    border: 0;
    border-bottom: 2px solid var(--line);
    background: var(--surface);
    color: var(--muted);
    font: inherit;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
}

.tabActive {
    border-bottom-color: var(--primary);
    color: var(--primary);
    font-weight: 700;
}

.section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: var(--surface);
}

.groupSection {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 0;
    background: var(--surface);
}

.padded {
    padding: 0 16px;
}

/* 예약 가능 시간을 못 불러옴 — 안내 + 다시 불러오기 */
.failed {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
}

.sectionHead {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.sectionTitle {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
}

.chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

/* 시간대 · 호수 — 고르기 칸 */
.slots {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    font-variant-numeric: tabular-nums;
}

.rooms {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
}

.choice {
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    cursor: pointer;
}

.slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    height: 56px;
    padding: 0;
}

.slotMain {
    font-size: 15px;
    font-weight: 700;
}

.slotSub {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
}

.now .slotMain {
    color: var(--primary);
}

.room {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--control-h);
    padding: 0 16px;
}

.roomName {
    font-size: 15px;
    font-weight: 700;
}

.roomFloor {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
}

.selected {
    border-color: var(--primary);
    background: var(--primary-soft);
    color: var(--primary-strong);
}

.selected .slotSub,
.selected .roomFloor,
.selected .slotMain {
    color: var(--primary-strong);
}

/* 아래 요약 · 금액 */
.summary {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
}

.amountRow {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
}

.amountLabel {
    font-size: 15px;
    font-weight: 500;
}

.amount {
    font-size: 20px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}
```

```css
/* src/app/css/user/BookingCalendar.module.css — 시안 user.html U3-select 날짜 */
.calendar {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
}

.title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
}

.picked {
    font-size: 13px;
    font-weight: 700;
    color: var(--primary-strong);
    font-variant-numeric: tabular-nums;
}

.monthRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.navButton {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--fg);
    cursor: pointer;
}

.navButton:disabled {
    color: var(--faint);
    cursor: not-allowed;
}

.monthLabel {
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px;
    font-variant-numeric: tabular-nums;
}

.weekday {
    font-size: 12px;
    font-weight: 700;
    color: var(--muted);
    text-align: center;
}

.day {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--faint);
    font: inherit;
    font-size: 15px;
    font-weight: 400;
    line-height: 1.1;
}

.open {
    color: var(--fg);
    font-weight: 700;
    cursor: pointer;
}

.selected {
    background: var(--primary);
    color: var(--on-primary);
    font-weight: 700;
}

.todayMark {
    font-size: 10px;
    font-weight: 700;
}

.note {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
}
```

```css
/* src/app/css/user/RoomGroupCarousel.module.css — 시안 user.html U3-select 객실 그룹 */
.carousel {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.swiper {
    width: 100%;
    padding: 0 24px 4px;
}

.card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 0 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    overflow: hidden;
}

.current {
    border: 2px solid var(--primary);
    background: var(--primary-soft);
}

.empty {
    background: var(--bg);
    color: var(--muted);
}

.photo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 112px;
    background: var(--neutral-bg);
    color: var(--muted);
    font-size: 13px;
    font-weight: 500;
}

.text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 14px;
}

.name {
    font-size: 16px;
    font-weight: 700;
}

.desc {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
}

.price {
    padding: 0 14px;
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
}

.navButton {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--fg);
    cursor: pointer;
}

.navButton:disabled {
    color: var(--faint);
    cursor: not-allowed;
}

.count {
    min-width: 48px;
    font-size: 14px;
    font-weight: 700;
    color: var(--muted);
    text-align: center;
    font-variant-numeric: tabular-nums;
}
```

---

## 테스트

spec 의 "결과" 표에서 ✓ 표시된 4건과 "계산 규칙" 표 20건을 그대로 테스트로 옮긴다. 여기에는 추가분만 적는다(ship 리뷰 `main-review-261118.md` 의 회귀).

| 종류 | 대상 | 이유 |
|---|---|---|
| 화면 회귀 | `BookingContent` — 이미 고른 날짜를 다시 눌러도 시간대가 남는다 | P7-1: 결과만 비우고 다시 부르지 않아 "불러오고 있어요"에서 멈췄다 |
| 화면 회귀 | `BookingContent` — 예약 요청 중 다른 호수를 눌러도 결제 화면은 누른 때의 호실 | P7-2: 결제 화면이 지금 고른 값으로 그려 다른 호실이 보이거나 사라졌다 |

테스트 모양(형제 `src/test/app/(user)/stores/[store_id]/StoreDetailContent.test.tsx` · `HomeContent.test.tsx`):
- 계산 함수 — `calendar.test.ts` · `booking-flow.test.ts` · `payment-result.test.ts` · `format.test.ts`(더함). 행마다 `expect`, 설명 앞에 `[SUCCESS]` · `[FAIL:<이유>]`.
- `BookingContent.test.tsx` — `getStoreDetail` · `getAvailability` · `createReservation` · `TossPaymentWidget`(받은 props 잡기) · `RoomGroupCarousel`(그룹 이름만) · `next/navigation` · `error-popup` mock, `vi.useFakeTimers({now: '2026-11-10T05:00:00Z'})` 로 오늘 고정, `RootLayoutProvider` + `UserMeContext.Provider` 로 감쌈. `validateAction` 은 실제.
- `PaymentSuccessContent.test.tsx` — `requestTossConfirm` · `confirmPayment` mock, 호출 횟수 · 인자 · 거절 뒤 결제 확인 0회.

## 만드는 순서

1. DTO 사본 12개 → 2. 계산 함수(`calendar` · `booking-flow` · `format` · `payment-result`)와 그 테스트 → 3. contracts · 결제위젯 돌아갈 주소 · `store-not-found` · `reservation-state` → 4. 화면(예약 → 결제 성공 · 실패)과 화면 테스트 → 5. 스타일 → 6. 문서(AGENTS.md 표시 형식 줄 · `docs/integrations.md` 결제 `return_url` · 결제 결과 흐름 · `docs/data-layer.md` 이용 시간 예 · `docs/conventions.md` React Compiler 가 건너뛰는 try 모양)
