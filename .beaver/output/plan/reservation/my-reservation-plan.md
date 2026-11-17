# Plan — 내 예약

> 무엇을·왜는 [spec](../../spec/reservation/my-reservation-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 화면마다 비즈니스 로직 — `<화면>Content` 안 함수(AGENTS.md "화면 로직") ② 계산 함수 ③ 시안 값 스타일(형제 없음)
> **싣지 않는 것** page.tsx, DTO 사본, contracts 함수 — 따르는 패턴을 표 한 줄로 가리킨다
>
> Phase 7 plan(`booking-payment-plan.md`) 위에 올린다 — `reservation/api.ts` · `reservation-state.ts` · `ReservationPage.module.css` · `formatDateTime` · `formatDateTimeRange` · `formatTimeRange` · 결제위젯 `returnUrl`. 지침서 frontend/screens.md U6(:106-110) · U7(:112-124) · U8(:126-133) · U9(:135-140), 시안 frontend/design/user.html U6(:1022-1112) · U7(:1113-1371) · U8(:1372-1416) · U9(:1417-1487).

## 선행 조건

- [x] Phase 7 plan 이 같은 build 에서 먼저 만들어진다(위 공용 파일)

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/app/(user)/reservation/MyReservationContent.tsx` | 신규 | 내 예약 목록 | 아래 1-1 |
| `src/app/(user)/reservation/[reservation_id]/ReservationDetailContent.tsx` | 신규 | 예약 1건 — 띠 · QR · 취소 · 결제하기 | 아래 1-2 |
| `src/app/(user)/reservation/[reservation_id]/_components/ReservationQr.tsx` · `QrLocked.tsx` · `ReservationSegments.tsx` · `RefundGuideCard.tsx` | 신규 | 문 QR · QR 잠김 · 결제 구간 · 환불 안내 | 아래 1-2 |
| `src/app/(user)/reservation/[reservation_id]/cancel-request/CancelRequestContent.tsx` | 신규 | 이용 중 취소 동의 | 아래 1-3 |
| `src/app/(user)/reservation/[reservation_id]/extension/ExtensionContent.tsx` | 신규 | 연장 | 아래 1-4 |
| `src/app/(user)/reservation/[reservation_id]/reservation-rules.ts` | 신규 | 버튼 · 환불 안내 · 취소 문구 · 취소 요청 · 연장 길이 | 아래 2-1 |
| `src/contracts/reservation/dto/` 9개(`reservation-list` · `-detail` · `-qr` · `-cancel` · `-cancel-request` · `-cancel-request-approve` · `-cancel-request-reject` · `-extension` · `-extend`) | 신규 | 지침서 사본 — Phase 7 과 한 번에 | 생략 |
| `src/contracts/reservation/api.ts` | 수정(Phase 7 파일) | 함수 9개 | 생략 |
| `src/app/(user)/reservation/page.tsx` · `[reservation_id]/page.tsx` · `cancel-request/page.tsx` · `extension/page.tsx` | 신규 | 얇은 page + 로그인 가드 | 생략 |
| `src/app/css/user/MyReservationContent.module.css` · `ReservationDetailContent.module.css` · `CancelRequestContent.module.css` · `ExtensionContent.module.css` | 신규 | 시안 값 | 아래 5 |
| `package.json` · `package-lock.json` | 수정 | `qrcode.react@4.2.0`(사용자 결정) | 만드는 순서 1 |
| `src/test/app/(user)/reservation/[reservation_id]/reservation-rules.test.ts` · `MyReservationContent.test.tsx` · `ReservationDetailContent.test.tsx` · `CancelRequestContent.test.tsx` · `ExtensionContent.test.tsx`(src 와 같은 경로) | 신규 | spec 테스트 | 아래 테스트 |
| `docs/integrations.md` | 수정 | 결제하기 · 연장 결제의 `returnUrl` | 만드는 순서 6 |

---

## 1. 비즈니스 로직 — 화면별 코드

spec 의 "동작 흐름" 번호와 주석 번호가 같다. 네 화면 모두 page 가 `<AuthGuard>` — SMS 링크(★)는 로그인 뒤 그 주소로 돌아온다. 조회는 효과 이벤트로 그때의 `auth` 를 쓰고(효과는 ID · 다시 불러오기에만), 큐 결과 처리는 `try` 밖에서 한다(형제 Phase 7 `BookingContent`).

### 1-1. 내 예약 목록 — `MyReservationContent`

응답 data 가 없으면 빈 목록으로 본다. 쪽은 화면 상태(주소에 남기지 않음).

```tsx
// src/app/(user)/reservation/MyReservationContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { RESERVATION_STATE } from '@/contracts/common/reservation.constants';
import { getMyReservations } from '@/contracts/reservation/api';
import { ReservationListDto, ReservationListItemResultDto } from '@/contracts/reservation/dto/reservation-list.dto';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { PaginationType } from '@/shared/types/pagination';
import { formatDateTimeRange, formatPrice } from '@/shared/utils/format';
import { reservationStateTone } from './reservation-state';
import pageStyles from '@/app/css/user/ReservationPage.module.css';
import styles from '@/app/css/user/MyReservationContent.module.css';

/** 한 쪽 예약 수 */
const PAGE_SIZE = 20;

/** 받은 한 쪽 — 응답에 data 가 없으면 빈 목록 */
type ReservationPageType = {
    list: Array<ReservationListItemResultDto>; // 예약(입실 최근순)
    pagination: PaginationType | null;          // 페이지
};

/** 경고 아이콘 — 시안 U6 사용중지 */
const ALERT_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5" /><path d="M12 16.5v.01" /></svg>;

/**
 * U6 내 예약 목록 — 카드 · 페이지, 비면 지도로
 *
 * @returns
 */
export default function MyReservationContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 이용자 토큰
    const loadPage = useEffectEvent((page: number, signal: AbortSignal) => getMyReservations(auth, new ReservationListDto({page, size: PAGE_SIZE}), signal)); // 그때의 auth 로(효과를 다시 걸지 않는다)

    // 상태
    const [page, setPage] = useState<number>(1);                                  // 보는 쪽
    const [result, setResult] = useState<ReservationPageType | null>(null);         // 목록 — 불러오기 전 null

    // 계산 값
    const reservations = result?.list ?? []; // 예약(입실 최근순)

    // 효과
    useEffect(() => {
        // ① · ④ 쪽이 바뀌면 그 쪽 — 떠나면 취소
        const controller = new AbortController();
        loadPage(page, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult({list: next?.list ?? [], pagination: next?.pagination ?? null});
            }
        }).catch((error: unknown) => handleApiError(error));

        return () => {
            controller.abort();
        };
    }, [page]);

    return (
        // 내 예약
        <div className={pageStyles.page}>
            {/* 머리 */}
            <header className={pageStyles.plainHeader}><h1 className={pageStyles.plainTitle}>내 예약</h1></header>

            <div className={pageStyles.body}>
                {/* ④ 빈 목록 */}
                {result && reservations.length === 0 ? (
                    <EmptyState title="아직 예약이 없어요" description="지도에서 가까운 무인 객실을 찾아 보세요." action={<Link href="/" className={buttonClass({variant: 'primary'})}>지도에서 찾기</Link>} />
                ) : null}

                {/* ② · ③ 예약 카드 · 사용중지 경고 */}
                {reservations.map((item) => (
                    <Link key={item.reservation_id} href={`/reservation/${encodeURIComponent(item.reservation_id)}/`} className={styles.card}>
                        <div className={styles.head}>
                            <strong className={styles.store}>{item.store_name}</strong>
                            <Badge tone={reservationStateTone(item.reservation_state_id)}>{item.reservation_state_name}</Badge>
                        </div>
                        <span className={styles.meta}>{item.room_group_name} · {item.room_name} · {item.room_plan_type_name}</span>
                        <span className={styles.date}>{formatDateTimeRange(item.start_at, item.end_at)}</span>
                        <div className={styles.total}>
                            <span className={styles.meta}>합계</span>
                            <strong className={styles.price}>{formatPrice(item.total_price)}</strong>
                        </div>
                        {item.is_room_disabled === 1 && (item.reservation_state_id === RESERVATION_STATE.CONFIRMED || item.reservation_state_id === RESERVATION_STATE.CHECKED_IN) ? (
                            <span className={styles.alert}>{ALERT_ICON}예약한 호실이 사용중지되어 전액 환불로 취소할 수 있어요</span>
                        ) : null}
                    </Link>
                ))}

                {/* ④ 페이지 */}
                <Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="내 예약 페이지" />
            </div>
        </div>
    );
}
```

### 1-2. 예약 1건 — `ReservationDetailContent`

버튼 · 환불 안내는 상세를 받은 시각(`checkedAt`) 기준 — 그리는 동안 시각이 바뀌어도 버튼이 흔들리지 않는다. QR 은 이용 중일 때만 부른다(시작 전에 부르면 400).

```tsx
// src/app/(user)/reservation/[reservation_id]/ReservationDetailContent.tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { RESERVATION_STATE } from '@/contracts/common/reservation.constants';
import { cancelReservation, getReservation, getReservationQr } from '@/contracts/reservation/api';
import { ReservationCancelDto, ReservationCancelResultDto } from '@/contracts/reservation/dto/reservation-cancel.dto';
import { ReservationDetailResultDto } from '@/contracts/reservation/dto/reservation-detail.dto';
import { ReservationQrResultDto } from '@/contracts/reservation/dto/reservation-qr.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import { ApiError } from '@/shared/api/request';
import Timer from '@/shared/components/Timer';
import TossPaymentWidget from '@/shared/components/payment/TossPaymentWidget';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import ReasonModal from '@/shared/components/ui/modal/ReasonModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatDateTime, formatDateTimeRange, formatPrice, toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import UserTopBar from '../../_components/UserTopBar';
import { reservationStateTone } from '../reservation-state';
import QrLocked from './_components/QrLocked';
import RefundGuideCard from './_components/RefundGuideCard';
import ReservationQr from './_components/ReservationQr';
import ReservationSegments from './_components/ReservationSegments';
import { PENDING_EXPIRED_MESSAGE, RESERVATION_NOT_FOUND_MESSAGE, cancelResultMessage, pendingSegment, refundGuide, reservationActions, screenSchedule } from './reservation-rules';
import pageStyles from '@/app/css/user/ReservationPage.module.css';
import styles from '@/app/css/user/ReservationDetailContent.module.css';

type ReservationDetailContentProps = {
    reservationId: string; // 주소의 예약 ID
};

/**
 * U7 예약 1건 — 상태 띠 · QR · 예약 내용 · 결제 구간 · 환불 안내 · 취소 · 결제하기 · 연장으로
 *
 * @param param0
 * @returns
 */
export default function ReservationDetailContent({reservationId}: ReservationDetailContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                                                          // 없는 예약이면 목록으로
    const auth = useContext(AuthContext);                                                // 이용자 토큰
    const detailPath = `/reservation/${encodeURIComponent(reservationId)}/`;             // 이 화면 — 결제 뒤 돌아올 곳
    const loadDetail = useEffectEvent((signal: AbortSignal) => getReservation(auth, reservationId, signal)); // 그때의 auth 로 상세
    const loadQr = useEffectEvent((signal: AbortSignal) => getReservationQr(auth, reservationId, signal));   // 그때의 auth 로 QR
    const leaveNotFound = useEffectEvent((): void => {
        showErrorPopup(RESERVATION_NOT_FOUND_MESSAGE);
        router.replace('/reservation/');
    });                                                                                  // 없는 예약 — 안내 뒤 목록
    const expiredRef = useRef<boolean>(false);                                           // 결제 대기 만료를 알렸는지 — 띠 · 결제위젯이 함께 알려도 한 번만

    // 상태
    const [detail, setDetail] = useState<ReservationDetailResultDto | null>(null); // 예약 상세
    const [checkedAt, setCheckedAt] = useState<string>(() => new Date().toISOString()); // 버튼 · 환불 안내 기준 시각 — 상세를 받을 때 · 경계 시각 · 취소 창을 열 때 새로
    const [reloadKey, setReloadKey] = useState<number>(0);                          // 다시 불러오기(취소 · 마감 · 시작)
    const [qr, setQr] = useState<ReservationQrResultDto | null>(null);              // 이용 중 QR
    const [cancelOpen, setCancelOpen] = useState<boolean>(false);                   // 취소 사유 창
    const [canceling, setCanceling] = useState<boolean>(false);                     // 취소 요청 중
    const [paying, setPaying] = useState<boolean>(false);                           // 결제 칸을 열었는지

    // 계산 값
    const actions = detail ? reservationActions(detail, checkedAt) : null;          // 버튼 · QR
    const guide = detail ? refundGuide(detail, checkedAt) : null;                   // 환불 안내
    const pending = detail ? pendingSegment(detail, checkedAt) : null;              // 결제하기 구간
    const qrOpen = actions?.qr === 'open';                                          // QR 을 부를지
    const currentRefund = guide?.rows.find((row) => row.current)?.value ?? guide?.message ?? ''; // 지금 취소하면 받을 것
    const cancelNotice = detail?.reservation_state_id === RESERVATION_STATE.PENDING ? (guide?.note ?? '') : (currentRefund && `지금 취소하면 ${currentRefund}`); // 취소 창 안내 — 결제 전이면 금액 없이
    const refundTotal = detail ? detail.segments.reduce((sum, segment) => sum + (segment.payment.refund_amount ?? 0), 0) : 0; // 취소 내용 환불 금액

    // 효과
    useEffect(() => {
        // ① 상세 — 받은 시각을 기준으로, 없는 예약이면 목록으로(떠나면 취소)
        const controller = new AbortController();
        loadDetail(controller.signal).then((next) => {
            if (controller.signal.aborted) {
                return;
            }

            if (!next) {
                leaveNotFound();
                return;
            }

            setCheckedAt(new Date().toISOString());
            setDetail(next);
        }).catch((error: unknown) => {
            if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
                leaveNotFound();
                return;
            }

            handleApiError(error);
        });

        return () => {
            controller.abort();
        };
    }, [reservationId, reloadKey]);

    useEffect(() => {
        // ③ 이용 중이면 QR — 이용 전 · 끝난 뒤에는 부르지 않는다(시작 전은 400)
        if (!qrOpen) {
            return;
        }

        const controller = new AbortController();
        loadQr(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setQr(next);
            }
        }).catch((error: unknown) => handleApiError(error));

        return () => {
            controller.abort();
        };
    }, [qrOpen, detail]);

    useEffect(() => {
        // ③ 경계 시각 — 환불 마감 · 시작 1시간 전은 기준 시각만 새로, 시작 · 끝은 상세를 다시(상세가 바뀌거나 떠나면 취소)
        if (!detail) {
            return;
        }

        const now = Date.now();
        const schedule = screenSchedule(detail, now);
        const timers = [
            ...schedule.refreshAt.map((at) => window.setTimeout(() => setCheckedAt(new Date().toISOString()), at - now)),
            ...schedule.reloadAt.map((at) => window.setTimeout(() => {
                setPaying(false);
                setReloadKey((key) => key + 1);
            }, at - now)),
        ];

        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, [detail]);

    // 함수
    function reload(): void {
        // 다시 — 결제 칸을 닫는다
        setPaying(false);
        setReloadKey((key) => key + 1);
    }

    function openCancel(): void {
        // 취소 창 — 기준 시각을 새로 해 지금의 환불 안내로
        setCheckedAt(new Date().toISOString());
        setCancelOpen(true);
    }

    function expirePending(): void {
        // 결제 대기 마감 — 만료된 예약은 다시 부르면 404 라 만료 안내 뒤 목록(한 번만)
        if (expiredRef.current) {
            return;
        }

        expiredRef.current = true;
        showErrorPopup(PENDING_EXPIRED_MESSAGE);
        router.replace('/reservation/');
    }

    async function cancel(reason: string): Promise<void> {
        // ④ 취소 — DTO 검증 → 큐 → 환불 문구 → 상세 다시
        const dto = Object.assign(new ReservationCancelDto(), {cancel_reason: reason});
        if (!(await validateAction(dto))) {
            return;
        }

        setCanceling(true);
        let result: ReservationCancelResultDto | null = null; // 취소 결과
        let failure: {error: unknown} | null = null;        // 실패 — 처리는 try 밖에서(React Compiler)
        try {
            result = await cancelReservation(auth, reservationId, dto);
        } catch (error) {
            failure = {error};
        }

        setCanceling(false);
        if (failure) {
            // 칸 옆 오류면 창을 두고, 그 밖(시작이 지남 · 이미 취소됨 …)은 닫고 다시 불러온다
            handleApiError(failure.error);
            if (!hasFieldErrors(failure.error)) {
                setCancelOpen(false);
                reload();
            }
            return;
        }

        setCancelOpen(false);
        showErrorPopup(result ? cancelResultMessage(result.refund_amount) : QUEUE_PENDING_MESSAGE);
        reload();
    }

    return (
        // 예약 상세
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="예약 상세" backHref="/reservation/" />

            {detail && actions ? (
                <>
                    <div className={styles.content}>
                        {/* ② 상태 띠 */}
                        <div className={`${styles.band} ${pageStyles[reservationStateTone(detail.reservation_state_id)]}`}>
                            <strong className={styles.bandTitle}>{detail.reservation_state_name}</strong>
                            <span className={styles.bandText}>
                                {detail.reservation_state_id === RESERVATION_STATE.PENDING && pending?.expires_at ? (
                                    <>{toKst(pending.expires_at, 'HH:mm')}까지 결제하지 않으면 예약이 만료돼요 · 남은 시간 <strong className={styles.bandTime}><Timer time={pending.expires_at} closeFunc={expirePending} /></strong></>
                                ) : bandText(detail)}
                            </span>
                        </div>

                        <div className={pageStyles.body}>
                            {/* ③ QR — 이용 중 · 잠김 */}
                            {qrOpen && qr ? <ReservationQr qr={qr} roomName={detail.room_name} /> : null}
                            {actions.qr === 'locked' ? <QrLocked startAt={detail.start_at} startsSoon={actions.startsSoon} /> : null}

                            {/* 취소 내용 */}
                            {detail.reservation_state_id === RESERVATION_STATE.CANCELED ? (
                                <section className={pageStyles.card} aria-labelledby="reservation-cancel-title">
                                    <h2 id="reservation-cancel-title" className={pageStyles.cardTitle}>취소 내용</h2>
                                    <dl className={`${pageStyles.dl} ${styles.relaxed}`}>
                                        <dt>취소 시각</dt><dd>{formatDateTime(detail.canceled_at)}</dd>
                                        <dt>취소한 쪽</dt><dd>{detail.cancel_actor ? lookupName('cancel_actor', detail.cancel_actor) : '-'}</dd>
                                        <dt>사유</dt><dd>{detail.cancel_reason ?? '-'}</dd>
                                        <dt>환불 금액</dt><dd className={pageStyles.strong}>{formatPrice(refundTotal)}</dd>
                                    </dl>
                                </section>
                            ) : null}

                            {/* ② 예약 내용 */}
                            <section className={pageStyles.card} aria-labelledby="reservation-store-title">
                                <h2 id="reservation-store-title" className={pageStyles.cardTitle}>{detail.store_name}</h2>
                                <dl className={`${pageStyles.dl} ${pageStyles.dl64}`}>
                                    <dt>객실</dt><dd>{detail.room_group_name} · {detail.room_name}</dd>
                                    <dt>상품</dt><dd>{detail.room_plan_type_name}</dd>
                                    <dt>이용</dt><dd>{formatDateTimeRange(detail.start_at, detail.end_at)}</dd>
                                    <dt>합계</dt><dd className={pageStyles.strong}>{formatPrice(detail.total_price)}</dd>
                                </dl>
                            </section>

                            {/* ② 결제 구간 */}
                            <ReservationSegments segments={detail.segments} />

                            {/* ② 환불 안내 */}
                            {guide ? <RefundGuideCard guide={guide} /> : null}

                            {/* ⑤ 결제하기 — 결제 대기 구간 */}
                            {paying && pending && pending.expires_at ? (
                                <section className={pageStyles.card}>
                                    <TossPaymentWidget payment={{payment_id: pending.payment.payment_id, order_name: `${detail.store_name} ${detail.room_name}`, amount: pending.payment.amount, expires_at: pending.expires_at}} returnUrl={detailPath} onExpired={detail.reservation_state_id === RESERVATION_STATE.PENDING ? expirePending : reload} />
                                </section>
                            ) : null}
                        </div>
                    </div>

                    {/* ④ · ⑤ 아래 버튼 — 취소 · 결제하기 · QR 확인 · 연장하기 */}
                    {actions.cancel || actions.pay || actions.extend || actions.qr === 'locked' ? (
                        <div className={`${pageStyles.footer} ${actions.cancel ? pageStyles.footerSplit : ''}`}>
                            {actions.cancel ? <Button variant="danger" size="lg" full onClick={openCancel}>취소</Button> : null}
                            {actions.pay ? <Button variant="primary" size="lg" full onClick={() => setPaying(true)} disabled={paying}>결제하기</Button> : null}
                            {!actions.pay && actions.qr === 'locked' ? <Button size="lg" full disabled>QR 확인 ({toKst(detail.start_at, 'HH:mm')}부터)</Button> : null}
                            {!actions.pay && actions.extend ? <Link href={`${detailPath}extension/`} className={buttonClass({variant: 'primary', size: 'lg', full: true})}>연장하기</Link> : null}
                        </div>
                    ) : null}

                    {/* 취소 사유 */}
                    <ReasonModal open={cancelOpen} title="예약 취소" description={cancelNotice || undefined} label="취소 사유" name="cancel_reason" maxLength={255} confirmLabel="취소하기" danger busy={canceling} onConfirm={cancel} onClose={() => setCancelOpen(false)} />
                </>
            ) : null}
        </div>
    );
}

/**
 * 칸 옆에 보일 검증 오류가 있는지 — 있으면 취소 창을 그대로 둔다
 *
 * @param error 잡은 오류
 */
function hasFieldErrors(error: unknown): boolean {
    return error instanceof ApiError && Array.isArray(error.body.validation_errors) && error.body.validation_errors.length > 0;
}

/**
 * 상태 띠 한 줄 — 확정 · 이용 중은 시각, 취소는 취소한 쪽(결제 대기의 마감 · 남은 시간은 화면이 그린다 — 만료 처리가 ref 를 써서 render 중 함수에 넘기면 React Compiler 가 건너뛴다)
 *
 * @param detail 예약 상세
 */
function bandText(detail: ReservationDetailResultDto): React.ReactNode {
    switch (detail.reservation_state_id) {
        case RESERVATION_STATE.PENDING:
            return '결제 시간이 지났어요.';
        case RESERVATION_STATE.CONFIRMED:
            return `${formatDateTime(detail.start_at)}부터 이용할 수 있어요`;
        case RESERVATION_STATE.CHECKED_IN:
            return `${formatDateTime(detail.end_at)}까지 이용할 수 있어요`;
        case RESERVATION_STATE.COMPLETED:
            return '이용이 끝난 예약이에요';
        case RESERVATION_STATE.CANCELED:
            return `${detail.cancel_actor ? lookupName('cancel_actor', detail.cancel_actor) : ''}가 취소한 예약이에요`;
        default:
            return '결제 시간이 지나 만료된 예약이에요';
    }
}
```

화면 조각 — 시안 U7 그대로. 영수증 링크는 `https://` 만 연다.

```tsx
// src/app/(user)/reservation/[reservation_id]/_components/ReservationQr.tsx
import { QRCodeSVG } from 'qrcode.react';
import { ReservationQrResultDto } from '@/contracts/reservation/dto/reservation-qr.dto';
import { formatDateTime } from '@/shared/utils/format';
import pageStyles from '@/app/css/user/ReservationPage.module.css';
import styles from '@/app/css/user/ReservationDetailContent.module.css';

type ReservationQrProps = {
    qr: ReservationQrResultDto; // QR(32자) · 유효 끝
    roomName: string;           // 호실
};

/** QR 크기 — 시안 200px */
const QR_SIZE = 200;

/** 시계 — 유효 끝 */
const CLOCK_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;

/**
 * 이용 중 QR — 문 옆 리더기에 대는 QR · 유효 끝(시안 user.html U7-in-use)
 *
 * @param param0
 * @returns
 */
export default function ReservationQr({qr, roomName}: ReservationQrProps): React.ReactNode {
    return (
        // QR
        <section className={`${pageStyles.card} ${pageStyles.hero} ${styles.qrCard}`} aria-labelledby="reservation-qr-title">
            <h2 id="reservation-qr-title" className={pageStyles.cardTitle}>{roomName} 문 QR</h2>
            <div className={styles.qrBox}>
                <QRCodeSVG value={qr.qr} size={QR_SIZE} title={`${roomName} 문 QR`} />
            </div>
            <p className={styles.qrText}>문 옆 리더기에 QR 을 대 주세요</p>
            <span className={styles.qrEnds}>{CLOCK_ICON}QR 유효 끝 {formatDateTime(qr.qr_ends_at)}</span>
        </section>
    );
}
```

```tsx
// src/app/(user)/reservation/[reservation_id]/_components/QrLocked.tsx
import Timer from '@/shared/components/Timer';
import { toKst } from '@/shared/utils/format';
import pageStyles from '@/app/css/user/ReservationPage.module.css';
import styles from '@/app/css/user/ReservationDetailContent.module.css';

type QrLockedProps = {
    startAt: string;      // 이용 시작
    startsSoon: boolean;  // 1시간 안 — 남은 시간
};

/** 자물쇠 — 시안 U7-before */
const LOCK_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;

/**
 * 이용 전 QR 잠김 — 시작 1시간 안이면 남은 시간(시작 시각에 상세를 다시 부르는 것은 화면의 시각표 — screenSchedule)(시안 user.html U7-before)
 *
 * @param param0
 * @returns
 */
export default function QrLocked({startAt, startsSoon}: QrLockedProps): React.ReactNode {
    return (
        // QR 잠김
        <section className={`${pageStyles.card} ${pageStyles.hero}`}>
            <span className={`${pageStyles.icon} ${pageStyles.icon48} ${pageStyles.primary}`}>{LOCK_ICON}</span>
            <h2 className={styles.lockTitle}>시작 시각부터 QR 이 열립니다</h2>
            {startsSoon ? (
                <div className={styles.countdown}>
                    <span className={styles.countdownLabel}>이용 시작까지</span>
                    <strong className={styles.countdownTime}><Timer time={startAt} /></strong>
                </div>
            ) : null}
            <p className={pageStyles.note}>{toKst(startAt, 'HH:mm')}이 되면 이 화면에 QR 이 나타나요.</p>
        </section>
    );
}
```

```tsx
// src/app/(user)/reservation/[reservation_id]/_components/ReservationSegments.tsx
import { PAYMENT_STATE } from '@/contracts/common/reservation.constants';
import { ReservationSegmentResultDto } from '@/contracts/reservation/dto/reservation-detail.dto';
import Badge from '@/shared/components/ui/display/Badge';
import { formatPrice, formatTimeRange, toKst } from '@/shared/utils/format';
import { paymentStateTone } from '../../reservation-state';
import pageStyles from '@/app/css/user/ReservationPage.module.css';
import styles from '@/app/css/user/ReservationDetailContent.module.css';

type ReservationSegmentsProps = {
    segments: Array<ReservationSegmentResultDto>; // 구간(시작 순)
};

/** 바깥 링크 — 영수증 */
const EXTERNAL_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;

/**
 * 결제 구간 — 구간마다 종류 · 시간 · 금액 · 결제 상태 · 영수증 · 결제 / 환불 정보(시안 user.html U7)
 *
 * @param param0
 * @returns
 */
export default function ReservationSegments({segments}: ReservationSegmentsProps): React.ReactNode {
    return (
        // 결제 구간
        <section className={pageStyles.card} aria-labelledby="reservation-segments-title">
            <h2 id="reservation-segments-title" className={pageStyles.cardTitle}>결제 구간</h2>
            {segments.map((segment) => (
                <div key={segment.reservation_detail_id} className={styles.segment}>
                    {/* 종류 · 시간 · 금액 */}
                    <div className={styles.segmentRow}>
                        <span className={styles.segmentName}><strong>{segment.reservation_detail_type_name}</strong> <span className={styles.muted}>{formatTimeRange(segment.start_at, segment.end_at)}</span></span>
                        <strong className={styles.segmentPrice}>{formatPrice(segment.price)}</strong>
                    </div>

                    {/* 결제 상태 · 영수증 · 결제 마감 */}
                    <div className={styles.segmentRowCenter}>
                        <Badge tone={paymentStateTone(segment.payment.payment_state_id)}>{segment.payment.payment_state_name}</Badge>
                        {segment.payment.receipt_url && segment.payment.receipt_url.startsWith('https://') ? (
                            <a className={styles.receipt} href={segment.payment.receipt_url} target="_blank" rel="noopener noreferrer">영수증 보기{EXTERNAL_ICON}</a>
                        ) : null}
                        {!segment.payment.receipt_url && segment.payment.payment_state_id === PAYMENT_STATE.READY && segment.expires_at ? (
                            <span className={styles.muted}>결제 마감 {toKst(segment.expires_at, 'HH:mm')}</span>
                        ) : null}
                    </div>

                    {/* 결제 · 환불 정보 */}
                    {segmentNote(segment) ? <span className={styles.muted}>{segmentNote(segment)}</span> : null}
                </div>
            ))}
        </section>
    );
}

/**
 * 구간 아래 줄 — 환불이면 '환불 65,000원 · 11월 9일 18:24 환불 완료', 결제 완료면 '카드 · 11월 10일 14:13 결제'
 *
 * @param segment 구간
 */
function segmentNote(segment: ReservationSegmentResultDto): string {
    const {payment} = segment;
    if (payment.refund_amount !== null) {
        return `환불 ${formatPrice(payment.refund_amount)}${payment.refunded_at ? ` · ${toKst(payment.refunded_at, 'M월 D일 HH:mm')} 환불 완료` : ''}`;
    }

    if (payment.approved_at) {
        return `${payment.method ?? '결제'} · ${toKst(payment.approved_at, 'M월 D일 HH:mm')} 결제`;
    }

    return '';
}
```

```tsx
// src/app/(user)/reservation/[reservation_id]/_components/RefundGuideCard.tsx
import pageStyles from '@/app/css/user/ReservationPage.module.css';
import styles from '@/app/css/user/ReservationDetailContent.module.css';
import { RefundGuideType } from '../reservation-rules';

type RefundGuideCardProps = {
    guide: RefundGuideType; // 줄 또는 문구 + 설명
};

/**
 * 환불 안내 — 지금 해당하는 줄 강조 · 시작 뒤 불가는 빨강(시안 user.html U7)
 *
 * @param param0
 * @returns
 */
export default function RefundGuideCard({guide}: RefundGuideCardProps): React.ReactNode {
    return (
        // 환불 안내
        <section className={pageStyles.card} aria-labelledby="reservation-refund-title">
            <h2 id="reservation-refund-title" className={pageStyles.cardTitle}>환불 안내</h2>

            {/* 줄 — 마감 전 · 마감 뒤 · 시작 뒤 */}
            {guide.rows.length > 0 ? (
                <div className={styles.refundRows}>
                    {guide.rows.map((row) => (
                        <div key={row.label} className={row.current ? `${styles.refundRow} ${styles.refundCurrent}` : styles.refundRow}>
                            <span>{row.label}{row.current ? ' · 지금' : ''}</span>
                            <span className={row.danger ? styles.refundDanger : styles.refundValue}>{row.value}</span>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* 문구 · 설명 */}
            {guide.message ? <p className={styles.refundMessage}>{guide.message}</p> : null}
            {guide.note ? <p className={pageStyles.note}>{guide.note}</p> : null}
        </section>
    );
}
```

### 1-3. 이용 중 취소 동의 — `CancelRequestContent`

답할 수 있는지는 받은 직후 한 번 판단하고, 이후 만료는 남은 시간 표시가 알린다. 거절 결과는 DTO 가 없어 done · pending 이 같다.

```tsx
// src/app/(user)/reservation/[reservation_id]/cancel-request/CancelRequestContent.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { approveCancelRequest, getCancelRequest, rejectCancelRequest } from '@/contracts/reservation/api';
import { ReservationCancelRequestApproveResultDto } from '@/contracts/reservation/dto/reservation-cancel-request-approve.dto';
import { ReservationCancelRequestResultDto } from '@/contracts/reservation/dto/reservation-cancel-request.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import { ApiError } from '@/shared/api/request';
import Timer from '@/shared/components/Timer';
import Button from '@/shared/components/ui/button/Button';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatDateTime, formatPrice, toKst } from '@/shared/utils/format';
import UserTopBar from '../../../_components/UserTopBar';
import { canAnswerCancelRequest } from '../reservation-rules';
import pageStyles from '@/app/css/user/ReservationPage.module.css';
import styles from '@/app/css/user/CancelRequestContent.module.css';

type CancelRequestContentProps = {
    reservationId: string; // 주소의 예약 ID
};

/** 답할 수 없는 요청(처리됨 · 만료 · 없음) */
const CANCEL_REQUEST_CLOSED_MESSAGE = '이미 처리되었거나 만료된 요청이에요.';

/** 남은 시간이 다 됨 */
const CANCEL_REQUEST_EXPIRED_MESSAGE = '요청이 만료되었어요. 예약은 그대로 이어져요.';

/** 거절 뒤 */
const CANCEL_REQUEST_REJECTED_MESSAGE = '취소 요청을 거절했어요. 예약은 그대로 이어져요.';

/** 경고 — 시안 U8 */
const ALERT_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5" /><path d="M12 16.5v.01" /></svg>;

/**
 * U8 이용 중 취소 동의 — 업체 사유 · 환불 금액 · 남은 시간, 요청 중이고 만료 전일 때만 승인 · 거절
 *
 * @param param0
 * @returns
 */
export default function CancelRequestContent({reservationId}: CancelRequestContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                                                       // 답한 뒤 · 못 하면 U7
    const auth = useContext(AuthContext);                                             // 이용자 토큰
    const detailPath = `/reservation/${encodeURIComponent(reservationId)}/`;          // U7
    const loadRequest = useEffectEvent((signal: AbortSignal) => getCancelRequest(auth, reservationId, signal)); // 그때의 auth 로
    const leave = useEffectEvent((message: string): void => {
        showErrorPopup(message);
        router.replace(detailPath);
    });                                                                               // 안내 뒤 U7

    // 상태
    const [request, setRequest] = useState<ReservationCancelRequestResultDto | null>(null); // 답할 수 있는 요청
    const [busy, setBusy] = useState<boolean>(false);                                       // 승인 · 거절 중

    // 효과
    useEffect(() => {
        // ① · ② 요청 — 답할 수 없으면(처리됨 · 만료 · 없음) 안내 뒤 U7
        const controller = new AbortController();
        loadRequest(controller.signal).then((next) => {
            if (controller.signal.aborted) {
                return;
            }

            if (!next || !canAnswerCancelRequest(next, new Date().toISOString())) {
                leave(CANCEL_REQUEST_CLOSED_MESSAGE);
                return;
            }

            setRequest(next);
        }).catch((error: unknown) => {
            if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
                leave(CANCEL_REQUEST_CLOSED_MESSAGE);
                return;
            }

            handleApiError(error);
        });

        return () => {
            controller.abort();
        };
    }, [reservationId]);

    // 함수
    async function approve(): Promise<void> {
        // ③ 승인 — 큐 → 환불 금액 안내 → U7
        setBusy(true);
        let result: ReservationCancelRequestApproveResultDto | null;
        try {
            result = await approveCancelRequest(auth, reservationId);
        } catch (error) {
            setBusy(false);
            handleApiError(error);
            return;
        }

        showErrorPopup(result ? `취소를 승인했어요. ${formatPrice(result.refund_amount)}을 환불해 드려요.` : QUEUE_PENDING_MESSAGE);
        router.replace(detailPath);
    }

    async function reject(): Promise<void> {
        // ③ 거절 — 큐(결과 null — done · pending 같음) → U7
        setBusy(true);
        try {
            await rejectCancelRequest(auth, reservationId);
        } catch (error) {
            setBusy(false);
            handleApiError(error);
            return;
        }

        showErrorPopup(CANCEL_REQUEST_REJECTED_MESSAGE);
        router.replace(detailPath);
    }

    function expire(): void {
        // ④ 남은 시간이 다 됨 — 승인 · 거절 중이면 그 결과 안내 · 이동에 맡긴다
        if (busy) {
            return;
        }

        showErrorPopup(CANCEL_REQUEST_EXPIRED_MESSAGE);
        router.replace(detailPath);
    }

    return (
        // 취소 동의
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="취소 동의" backHref={detailPath} />

            {request ? (
                <>
                    <div className={pageStyles.body}>
                        {/* 요청 안내 · 남은 시간 */}
                        <section className={`${pageStyles.card} ${styles.lead}`}>
                            <span className={`${pageStyles.icon} ${pageStyles.icon44} ${pageStyles.warn}`}>{ALERT_ICON}</span>
                            <h2 className={styles.title}>업체가 예약 취소를 요청했어요</h2>
                            <p className={pageStyles.heroText}>승인하면 예약이 취소되고 결제 금액 전액을 돌려받아요. 거절하면 예약은 그대로 이어져요.</p>
                            <div className={styles.deadline}>
                                <span>{toKst(request.expires_at, 'HH:mm')}까지 답해 주세요</span>
                                <strong className={styles.deadlineTime}><Timer time={request.expires_at} closeFunc={expire} /> 남음</strong>
                            </div>
                        </section>

                        {/* 요청 내용 */}
                        <section className={pageStyles.card} aria-labelledby="cancel-request-title">
                            <h2 id="cancel-request-title" className={pageStyles.cardTitle}>요청 내용</h2>
                            <dl className={pageStyles.dl}>
                                <dt>업체</dt><dd>{request.store_name}</dd>
                                <dt>호실</dt><dd>{request.room_name}</dd>
                                <dt>요청 시각</dt><dd>{formatDateTime(request.created_at)}</dd>
                            </dl>
                            <div className={styles.reason}>
                                <span className={styles.reasonLabel}>업체가 적은 사유</span>
                                <p className={styles.reasonText}>{request.cancel_reason}</p>
                            </div>
                            <div className={pageStyles.total}>
                                <span className={pageStyles.totalLabel}>환불 금액 (전액)</span>
                                <strong className={pageStyles.totalValue}>{formatPrice(request.refund_amount)}</strong>
                            </div>
                        </section>

                        {/* 만료 안내 */}
                        <p className={pageStyles.note}>{toKst(request.expires_at, 'HH:mm')}가 지나면 요청이 만료되고 예약은 그대로 이어져요.</p>
                    </div>

                    {/* 거절 · 승인 */}
                    <div className={`${pageStyles.footer} ${pageStyles.footerHalf}`}>
                        <Button size="lg" full disabled={busy} onClick={reject}>거절</Button>
                        <Button variant="primary" size="lg" full disabled={busy} onClick={approve}>승인</Button>
                    </div>
                </>
            ) : null}
        </div>
    );
}
```

### 1-4. 연장 — `ExtensionContent`

상세 · 연장 조회는 `Promise.allSettled` 로 함께 — 연장 조회만 실패하면 안내만 하고 상세는 그린다(형제 Phase 6 `StoreDetailContent`).

```tsx
// src/app/(user)/reservation/[reservation_id]/extension/ExtensionContent.tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { RESERVATION_PAYMENT_PENDING_MINUTES } from '@/contracts/common/reservation.constants';
import { getExtension, getReservation, requestExtension } from '@/contracts/reservation/api';
import { ReservationDetailResultDto } from '@/contracts/reservation/dto/reservation-detail.dto';
import { ReservationExtendResultDto } from '@/contracts/reservation/dto/reservation-extend.dto';
import { ReservationExtensionResultDto } from '@/contracts/reservation/dto/reservation-extension.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import { ApiError } from '@/shared/api/request';
import TossPaymentWidget from '@/shared/components/payment/TossPaymentWidget';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatDateTime, formatMonthDayWeek, formatPrice, formatTimeRange, toKst } from '@/shared/utils/format';
import MemberStateBand from '../../../_components/MemberStateBand';
import { UserMeContext } from '../../../_components/UserMeProvider';
import UserTopBar from '../../../_components/UserTopBar';
import { RESERVATION_NOT_FOUND_MESSAGE, extensionLengthLabel } from '../reservation-rules';
import pageStyles from '@/app/css/user/ReservationPage.module.css';
import styles from '@/app/css/user/ExtensionContent.module.css';

type ExtensionContentProps = {
    reservationId: string; // 주소의 예약 ID
};

/** 연장을 막는 회원 상태 — 이용 제한 · 탈퇴 대기(서버도 400) */
const BLOCKED_MEMBER_STATES = ['BLOCK', 'LEAVE_WAIT'];

/** 요금 상품 → 글자(DTO — HOURLY 시간 이용 요금, NIGHT 1박 요금) */
const RATE_LABEL = new Map<string, string>([['HOURLY', '시간 이용 요금'], ['NIGHT', '1박 요금']]);

/** 아이콘 — 시안 U9 */
const ARROW_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>;
const CLOCK_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
const INFO_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5v.01" /></svg>;

/**
 * U9 연장 — 가능하면 새 끝 · 추가 금액 · 연장 신청(큐) → 결제위젯, 불가면 사유
 *
 * @param param0
 * @returns
 */
export default function ExtensionContent({reservationId}: ExtensionContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                                                                  // 없는 예약이면 목록
    const auth = useContext(AuthContext);                                                        // 이용자 토큰
    const {me} = useContext(UserMeContext);                                                      // 회원 상태
    const detailPath = `/reservation/${encodeURIComponent(reservationId)}/`;                     // U7 — 결제 뒤 돌아올 곳(결제 대기 연장 구간을 거기서 다시 결제)
    const load = useEffectEvent((signal: AbortSignal) => Promise.allSettled([getReservation(auth, reservationId, signal), getExtension(auth, reservationId, signal)])); // 상세 · 연장 조회
    const leaveNotFound = useEffectEvent((): void => {
        showErrorPopup(RESERVATION_NOT_FOUND_MESSAGE);
        router.replace('/reservation/');
    });                                                                                          // 없는 예약

    // 상태
    const [detail, setDetail] = useState<ReservationDetailResultDto | null>(null);           // 예약 — 업체 · 객실 · 지금 끝
    const [extension, setExtension] = useState<ReservationExtensionResultDto | null>(null);  // 연장 조회
    const [extensionFailed, setExtensionFailed] = useState<boolean>(false);                   // 연장 조회를 못 함 — 다시 불러오기
    const [reloadKey, setReloadKey] = useState<number>(0);                                    // 다시 조회
    const [submitting, setSubmitting] = useState<boolean>(false);                             // 연장 신청 중
    const [payment, setPayment] = useState<ReservationExtendResultDto | null>(null);          // 연장 결제 — 있으면 결제 칸

    // 계산 값
    const blocked = BLOCKED_MEMBER_STATES.includes(me?.state_id ?? '');                       // 이용 제한 · 탈퇴 대기
    const available = extension?.is_extendable === 1;                                         // 연장할 수 있는지
    const startDate = extension?.start_at ? toKst(extension.start_at, 'YYYY-MM-DD') : '';     // 지금 끝 날짜

    // 효과
    useEffect(() => {
        // ① 상세 · 연장 조회를 함께 — 없는 예약이면 목록, 연장 조회 실패는 안내만(떠나면 취소)
        const controller = new AbortController();
        load(controller.signal).then(([nextDetail, nextExtension]) => {
            if (controller.signal.aborted) {
                return;
            }

            if (nextDetail.status === 'rejected' || !nextDetail.value) {
                if (nextDetail.status === 'fulfilled' || (nextDetail.reason instanceof ApiError && (nextDetail.reason.status === 404 || nextDetail.reason.status === 400))) {
                    leaveNotFound();
                } else {
                    handleApiError(nextDetail.reason);
                }
                return;
            }

            setDetail(nextDetail.value);
            setExtensionFailed(nextExtension.status === 'rejected');
            if (nextExtension.status === 'fulfilled') {
                setExtension(nextExtension.value);
            } else {
                setExtension(null); // 옛 연장 정보(금액)를 남기지 않는다
                handleApiError(nextExtension.reason);
            }
        });

        return () => {
            controller.abort();
        };
    }, [reservationId, reloadKey]);

    // 함수
    async function submit(): Promise<void> {
        // ③ 연장 신청 — 큐 → 결제 칸. 실패 · 늦어짐이면 다시 조회
        if (!available || blocked || submitting) {
            return;
        }

        setSubmitting(true);
        let result: ReservationExtendResultDto | null;
        try {
            result = await requestExtension(auth, reservationId);
        } catch (error) {
            setSubmitting(false);
            handleApiError(error);
            setReloadKey((key) => key + 1);
            return;
        }

        setSubmitting(false);
        if (!result) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
            setReloadKey((key) => key + 1);
            return;
        }

        setPayment(result);
    }

    function reload(): void {
        // 다시 조회
        setReloadKey((key) => key + 1);
    }

    function expirePayment(): void {
        // 결제 마감 — 다시 조회(그 예약은 다시 연장할 수 없다 — 서버가 사유로 알려 준다)
        setPayment(null);
        setReloadKey((key) => key + 1);
    }

    return (
        // 연장
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="연장" backHref={detailPath} />

            {/* 연장 조회 실패 */}
            {detail && !extension && extensionFailed ? (
                <div className={pageStyles.body}>
                    <section className={`${pageStyles.card} ${styles.lead}`}>
                        <h2 className={styles.title}>연장 정보를 불러오지 못했어요</h2>
                        <p className={pageStyles.note}>잠시 뒤 다시 불러와 주세요.</p>
                        <Button size="lg" full onClick={reload}>다시 불러오기</Button>
                    </section>
                </div>
            ) : null}

            {detail && extension ? (
                <>
                    <div className={pageStyles.body}>
                        {/* ② 가능 — 지금 끝 → 연장 뒤 끝 · 추가 금액 */}
                        {available && !payment ? (
                            <section className={`${pageStyles.card} ${styles.wide}`}>
                                <div className={styles.titleBlock}>
                                    <h2 className={pageStyles.cardTitle}>{detail.store_name}</h2>
                                    <span className={styles.muted}>{detail.room_group_name} · {detail.room_name} · {detail.room_plan_type_name}</span>
                                </div>
                                <div className={styles.compare}>
                                    <div className={styles.box}>
                                        <span className={styles.boxLabel}>지금 이용 끝</span>
                                        <strong className={styles.boxTime}>{toKst(extension.start_at, 'HH:mm')}</strong>
                                        <span className={styles.boxSub}>{startDate ? formatMonthDayWeek(startDate) : ''}</span>
                                    </div>
                                    <span className={styles.arrow}>{ARROW_ICON}</span>
                                    <div className={`${styles.box} ${styles.boxNext}`}>
                                        <span className={styles.boxLabel}>연장 뒤 끝</span>
                                        <strong className={styles.boxTime}>{toKst(extension.end_at, 'HH:mm')}</strong>
                                        <span className={styles.boxSub}>{extensionLengthLabel(extension.start_at, extension.end_at)}</span>
                                    </div>
                                </div>
                                <div className={pageStyles.total}>
                                    <span className={styles.totalLabel}>추가 금액 <span className={styles.muted}>{RATE_LABEL.get(extension.room_plan_type_id ?? '') ?? ''}</span></span>
                                    <strong className={pageStyles.totalValue}>{formatPrice(extension.amount)}</strong>
                                </div>
                            </section>
                        ) : null}
                        {available && !payment ? (
                            <p className={styles.warnBox}>{CLOCK_ICON}<span>연장 신청 뒤 {RESERVATION_PAYMENT_PENDING_MINUTES}분 안에 결제해 주세요. 결제하지 않고 {RESERVATION_PAYMENT_PENDING_MINUTES}분이 지나면 이 예약은 다시 연장할 수 없어요.</span></p>
                        ) : null}

                        {/* ③ 연장 결제 */}
                        {payment ? (
                            <section className={pageStyles.card} aria-labelledby="extension-payment-title">
                                <h2 id="extension-payment-title" className={pageStyles.cardTitle}>연장 결제</h2>
                                <dl className={pageStyles.dl}>
                                    <dt>연장</dt><dd>{formatTimeRange(payment.start_at, payment.end_at)}</dd>
                                    <dt>주문명</dt><dd>{payment.order_name}</dd>
                                </dl>
                                <TossPaymentWidget payment={payment} returnUrl={detailPath} onExpired={expirePayment} />
                            </section>
                        ) : null}

                        {/* ④ 불가 — 사유 */}
                        {!available ? (
                            <section className={`${pageStyles.card} ${styles.lead}`}>
                                <span className={`${pageStyles.icon} ${pageStyles.icon44} ${pageStyles.neutral}`}>{INFO_ICON}</span>
                                <h2 className={styles.title}>연장할 수 없어요</h2>
                                <p className={styles.reason}>{extension.reason ?? '지금은 연장할 수 없어요.'}</p>
                                <div className={styles.endRow}>
                                    <span className={styles.muted}>지금 이용 끝</span>
                                    <strong className={styles.endTime}>{formatDateTime(detail.end_at)}</strong>
                                </div>
                            </section>
                        ) : null}
                        {!available ? <p className={pageStyles.note}>연장은 이용 중에만, 같은 호실의 바로 다음 시간이 비어 있을 때 할 수 있어요.</p> : null}

                        {/* ④ 회원 상태 */}
                        <MemberStateBand me={me} />
                    </div>

                    {/* 아래 — 가능: 결제 금액 · 연장 신청 / 불가: 예약으로 · 막힌 연장 신청 */}
                    {available && !payment ? (
                        <div className={`${pageStyles.footer} ${pageStyles.footerCol}`}>
                            <div className={styles.amountRow}>
                                <span className={styles.amountLabel}>결제 금액</span>
                                <strong className={styles.amount}>{formatPrice(extension.amount)}</strong>
                            </div>
                            <Button variant="primary" size="lg" full disabled={blocked || submitting} onClick={submit}>연장 신청</Button>
                        </div>
                    ) : null}
                    {!available ? (
                        <div className={`${pageStyles.footer} ${pageStyles.footerSplit}`}>
                            <Link href={detailPath} className={buttonClass({size: 'lg', full: true})}>예약으로</Link>
                            <Button size="lg" full disabled>연장 신청</Button>
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}
```

---

## 2. 계산 함수

### 2-1. 예약 화면의 버튼과 QR · 취소하면 돌려받는 금액 안내 · 취소 뒤 안내 문구 · 취소 요청에 답할 수 있는지 · 연장 길이 글자 — `reservation-rules.ts`

지금 시각은 인자로 받는다(테스트에 가짜 타이머가 필요 없다). 환불 안내 금액은 원 아래 내림.

```ts
// src/app/(user)/reservation/[reservation_id]/reservation-rules.ts
import { RESERVATION_CANCEL_REQUEST_STATE, RESERVATION_STATE } from '@/contracts/common/reservation.constants';
import { ReservationCancelRequestResultDto } from '@/contracts/reservation/dto/reservation-cancel-request.dto';
import { ReservationDetailResultDto, ReservationSegmentResultDto } from '@/contracts/reservation/dto/reservation-detail.dto';
import { formatDateTime, formatDateTimeRange, formatPrice } from '@/shared/utils/format';

/** U7 버튼 · QR — qr: none 없음 · locked 이용 전(잠김) · open 이용 중 */
export type ReservationActionsType = {
    cancel: boolean;                     // 취소
    pay: boolean;                        // 결제하기(마감 전 결제 대기 구간)
    qr: 'none' | 'locked' | 'open';      // QR
    startsSoon: boolean;                 // 이용 시작이 1시간 안(남은 시간을 보여 줌)
    extend: boolean;                     // 연장하기
};

/** 환불 안내 한 줄 */
export type RefundRowType = {
    label: string;    // 언제 취소하면
    value: string;    // 얼마 환불
    current: boolean; // 지금 해당하는 줄
    danger: boolean;  // 취소할 수 없음
};

/** 환불 안내 — 줄 또는 문구 + 아래 설명 */
export type RefundGuideType = {
    rows: Array<RefundRowType>; // 마감 전 · 마감 뒤 · 시작 뒤
    message: string;            // 줄 대신 문구(이용 중 · 사용중지)
    note: string;               // 아래 설명
};

type ActionsDetailType = Pick<ReservationDetailResultDto, 'reservation_state_id' | 'start_at' | 'is_room_disabled'> & {segments: Array<Pick<ReservationSegmentResultDto, 'reservation_state_id' | 'expires_at'>>};

type RefundDetailType = Pick<ReservationDetailResultDto, 'reservation_state_id' | 'start_at' | 'refund_deadline_at' | 'late_refund_percent' | 'total_price' | 'is_room_disabled'>;

/** 없는 · 남의 · 만료된 결제 대기 예약(U7 · U9) */
export const RESERVATION_NOT_FOUND_MESSAGE = '예약을 찾을 수 없습니다.';

/** 결제 대기 마감이 지남 — 만료된 결제 대기는 상세가 404 라 다시 부르지 않고 이 안내 뒤 목록으로 */
export const PENDING_EXPIRED_MESSAGE = '결제 시간이 지나 예약이 만료됐어요.';

/** U7 을 다시 맞출 시각(ms) — refreshAt: 기준 시각만 새로(버튼 · 환불 안내 · 남은 시간), reloadAt: 상세를 다시 */
export type ScreenScheduleType = {
    refreshAt: Array<number>; // 환불 마감 · 시작 1시간 전
    reloadAt: Array<number>;  // 시작 · 끝 · 시작 뒤 다시
};

/** 이 시간 안에 시작하면 남은 시간을 보여 준다(Timer 는 분:초) */
const STARTS_SOON_MS = 60 * 60 * 1000;

/** 시작이 지났는데 아직 확정이면(백엔드 반영이 늦음) 다시 부르는 간격 · 그만두는 때 */
const START_RETRY_MS = 10 * 1000;
const START_RETRY_LIMIT_MS = 5 * 60 * 1000;

/** setTimeout 이 받는 가장 긴 지연(약 24.8일) — 더 길면 바로 불려 버린다 */
const MAX_TIMER_MS = 2 ** 31 - 1;

/** 전액(%) */
const FULL_PERCENT = 100;

/** 끝난 예약 — 아무것도 */
const NO_ACTIONS: ReservationActionsType = {cancel: false, pay: false, qr: 'none', startsSoon: false, extend: false};

const PENDING_NOTE = '결제 전에 취소하면 환불할 금액 없이 취소돼요.';
const CONFIRMED_NOTE = '예약한 호실이 사용중지되면 이용 중이어도 끝나기 전까지 전액 환불로 취소할 수 있어요.';
const CHECKED_IN_MESSAGE = '이용이 시작되어 취소할 수 없어요.';
const CHECKED_IN_NOTE = '예약한 호실이 사용중지되면 끝나기 전까지 전액 환불로 취소할 수 있어요.';
const ROOM_DISABLED_MESSAGE = '예약한 호실이 사용중지되어 끝나기 전까지 전액 환불로 취소할 수 있어요.';

/**
 * 마감 전 결제 대기 구간 — 결제하기에 쓴다(없으면 null)
 *
 * @param detail 예약 상세
 * @param nowIso 지금
 */
export function pendingSegment<T extends Pick<ReservationSegmentResultDto, 'reservation_state_id' | 'expires_at'>>(detail: {segments: Array<T>}, nowIso: string): T | null {
    const now = Date.parse(nowIso);
    return detail.segments.find((segment) => segment.reservation_state_id === RESERVATION_STATE.PENDING && segment.expires_at !== null && Date.parse(segment.expires_at) > now) ?? null;
}

/**
 * U7 버튼 · QR — 결제 대기 취소 · 결제, 확정은 시작 전 취소 · QR 잠김, 이용 중은 QR · 연장, 사용중지 호실은 끝 전 취소, 끝난 예약은 없음
 *
 * @param detail 예약 상세
 * @param nowIso 지금
 */
export function reservationActions(detail: ActionsDetailType, nowIso: string): ReservationActionsType {
    const untilStart = Date.parse(detail.start_at) - Date.parse(nowIso);
    const disabledRoom = detail.is_room_disabled === 1;
    const pay = pendingSegment(detail, nowIso) !== null;

    switch (detail.reservation_state_id) {
        case RESERVATION_STATE.PENDING:
            return {cancel: true, pay, qr: 'none', startsSoon: false, extend: false};
        case RESERVATION_STATE.CONFIRMED:
            return {cancel: untilStart > 0 || disabledRoom, pay, qr: 'locked', startsSoon: untilStart <= STARTS_SOON_MS, extend: false};
        case RESERVATION_STATE.CHECKED_IN:
            return {cancel: disabledRoom, pay, qr: 'open', startsSoon: false, extend: true};
        default:
            return NO_ACTIONS;
    }
}

/**
 * U7 환불 안내 — 결제 대기 · 확정은 마감 전 전액 / 마감 ~ 시작 비율 / 시작 뒤 불가(지금 줄 강조, 확정이면 금액), 이용 중 · 사용중지는 문구, 끝난 예약은 null
 *
 * @param detail 예약 상세
 * @param nowIso 지금
 */
export function refundGuide(detail: RefundDetailType, nowIso: string): RefundGuideType | null {
    const state = detail.reservation_state_id;
    if (state !== RESERVATION_STATE.PENDING && state !== RESERVATION_STATE.CONFIRMED && state !== RESERVATION_STATE.CHECKED_IN) {
        return null;
    }

    if (detail.is_room_disabled === 1 && state !== RESERVATION_STATE.PENDING) {
        return {rows: [], message: ROOM_DISABLED_MESSAGE, note: ''};
    }

    if (state === RESERVATION_STATE.CHECKED_IN) {
        return {rows: [], message: CHECKED_IN_MESSAGE, note: CHECKED_IN_NOTE};
    }

    const now = Date.parse(nowIso);
    const start = Date.parse(detail.start_at);
    const deadline = Date.parse(detail.refund_deadline_at);
    const late = detail.late_refund_percent;
    const amount = (percent: number, current: boolean): string => (state === RESERVATION_STATE.CONFIRMED && current ? ` · ${formatPrice(Math.floor((detail.total_price * percent) / FULL_PERCENT))}` : '');
    const rows: Array<RefundRowType> = [];

    if (late >= FULL_PERCENT || deadline >= start) {
        rows.push({label: `${formatDateTime(detail.start_at)} 이용 시작 전 취소`, value: `전액 환불${amount(FULL_PERCENT, now < start)}`, current: now < start, danger: false});
    } else {
        const beforeDeadline = now < deadline;
        const afterDeadline = deadline <= now && now < start;
        rows.push({label: `${formatDateTime(detail.refund_deadline_at)} 전 취소`, value: `전액 환불${amount(FULL_PERCENT, beforeDeadline)}`, current: beforeDeadline, danger: false});
        rows.push({label: `${formatDateTimeRange(detail.refund_deadline_at, detail.start_at)} 취소`, value: late <= 0 ? '환불 없음' : `${late}% 환불${amount(late, afterDeadline)}`, current: afterDeadline, danger: false});
    }

    rows.push({label: `${formatDateTime(detail.start_at)} 이용 시작 뒤`, value: '취소할 수 없음', current: now >= start, danger: true});
    return {rows, message: '', note: state === RESERVATION_STATE.PENDING ? PENDING_NOTE : CONFIRMED_NOTE};
}

/**
 * U7 을 다시 맞출 시각 — 결제 대기 · 확정은 환불 마감 · 시작 1시간 전에 기준 시각만 새로, 확정은 시작에 · 확정 · 이용 중은 끝에 상세를 다시.
 * 시작이 지났는데 아직 확정이면 10초 뒤 다시(5분까지). 지난 시각 · 너무 먼 시각은 뺀다
 *
 * @param detail 예약 상세
 * @param nowMs 지금(ms)
 */
export function screenSchedule(detail: Pick<ReservationDetailResultDto, 'reservation_state_id' | 'start_at' | 'end_at' | 'refund_deadline_at'>, nowMs: number): ScreenScheduleType {
    const state = detail.reservation_state_id;
    const start = Date.parse(detail.start_at);
    const end = Date.parse(detail.end_at);
    const upcoming = (at: number): boolean => at > nowMs && at - nowMs <= MAX_TIMER_MS;
    const refreshAt: Array<number> = [];
    const reloadAt: Array<number> = [];

    if (state === RESERVATION_STATE.PENDING || state === RESERVATION_STATE.CONFIRMED) {
        refreshAt.push(Date.parse(detail.refund_deadline_at), start - STARTS_SOON_MS);
    }

    if (state === RESERVATION_STATE.CONFIRMED) {
        reloadAt.push(start);
        if (nowMs >= start && nowMs - start < START_RETRY_LIMIT_MS) {
            reloadAt.push(nowMs + START_RETRY_MS);
        }
    }

    if (state === RESERVATION_STATE.CONFIRMED || state === RESERVATION_STATE.CHECKED_IN) {
        reloadAt.push(end);
    }

    return {refreshAt: refreshAt.filter(upcoming), reloadAt: reloadAt.filter(upcoming)};
}

/**
 * 취소 결과 안내 — null(결제 대기 취소)은 금액 없이, 0 은 환불 없음, 그 밖은 금액
 *
 * @param refundAmount 환불 금액
 */
export function cancelResultMessage(refundAmount: number | null): string {
    if (refundAmount === null) {
        return '예약을 취소했어요.';
    }

    return refundAmount === 0 ? '예약을 취소했어요. 환불할 금액은 없어요.' : `예약을 취소했어요. ${formatPrice(refundAmount)}을 환불해 드려요.`;
}

/**
 * 이용 중 취소 요청에 답할 수 있는지 — 요청 중이고 만료 시각 전
 *
 * @param request 취소 요청
 * @param nowIso 지금
 */
export function canAnswerCancelRequest(request: Pick<ReservationCancelRequestResultDto, 'reservation_cancel_request_state_id' | 'expires_at'>, nowIso: string): boolean {
    return request.reservation_cancel_request_state_id === RESERVATION_CANCEL_REQUEST_STATE.REQUESTED && Date.parse(nowIso) < Date.parse(request.expires_at);
}

/**
 * 연장 길이 — 24시간 배수는 '1일 더', 그 밖은 '3시간 더' · '1시간 30분 더' · '30분 더'
 *
 * @param startIso 연장 시작
 * @param endIso 연장 뒤 끝
 */
export function extensionLengthLabel(startIso: string | null, endIso: string | null): string {
    const minutes = Math.round((Date.parse(endIso ?? '') - Date.parse(startIso ?? '')) / 60000);
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return '';
    }

    if (minutes % (24 * 60) === 0) {
        return `${minutes / (24 * 60)}일 더`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `${[hours > 0 ? `${hours}시간` : '', rest > 0 ? `${rest}분` : ''].filter(Boolean).join(' ')} 더`;
}
```

---

## 4. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| DTO 사본 9개 | Phase 7 과 함께 `copy-dto.js` 로 그대로 | `src/contracts/user/dto/user-token-refresh.dto.ts:5` |
| `getMyReservations(auth, query, signal?)` | `withAuth` + `request` GET `/user-service/reservation`, query `page · size` | `src/contracts/user/api.ts:66` |
| `getReservation` · `getReservationQr` · `getCancelRequest` · `getExtension`(auth, reservation_id, signal?) | `withAuth` + `request` GET `/user-service/reservation/<id>` · `/qr` · `/cancel-request` · `/extension`, ID 는 `encodeURIComponent` | `src/contracts/discovery/api.ts:26` |
| `cancelReservation(auth, id, dto)` · `approveCancelRequest` · `rejectCancelRequest` · `requestExtension`(auth, id) | `withAuth` + `callQueue` PATCH `/cancel` · PATCH `/cancel-request/approve` · `/cancel-request/reject`(결과 DTO 없음 → `Promise<null>`) · POST `/extension` | `src/contracts/user/api.ts:76` · `:87` |
| page.tsx 4개 | 얇은 page — `params.reservation_id` 를 Content 로, `<AuthGuard>` 로 감쌈 | `src/app/(user)/phone-verification/page.tsx:11` |
| 예약 · 결제 상태 색 | Phase 7 `reservation-state.ts` | `booking-payment-plan.md` 3-3 |

---

## 5. 스타일 — 시안 값

카드 · 히어로 · dl · 합계 · 아래 영역은 Phase 7 `ReservationPage.module.css` 를 같이 쓰고, 화면에만 있는 것만 싣는다.

```css
/* src/app/css/user/MyReservationContent.module.css — 시안 user.html U6(:1022-1087) */
.card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px;
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--fg);
    text-decoration: none;
}

.head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.store {
    font-size: 16px;
    font-weight: 700;
}

.meta {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
}

.date {
    font-size: 14px;
    font-variant-numeric: tabular-nums;
}

.total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
}

.price {
    font-size: 15px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.alert {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
    padding: 8px 10px;
    border-radius: var(--radius);
    background: var(--danger-soft);
    color: var(--danger);
    font-size: 13px;
    font-weight: 500;
}

.alert svg {
    flex-shrink: 0;
}
```

```css
/* src/app/css/user/ReservationDetailContent.module.css — 시안 user.html U7(:1113-1371) */
.content {
    display: flex;
    flex: 1;
    flex-direction: column;
}

/* 상태 띠 — 색은 ReservationPage 의 .primary · .warn · .ok · .danger · .neutral */
.band {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px 16px;
}

.bandTitle {
    font-size: 16px;
    font-weight: 700;
}

.bandText {
    font-size: 13px;
    line-height: 1.5;
    color: var(--fg);
    font-variant-numeric: tabular-nums;
}

.bandTime {
    color: var(--warn);
}

.relaxed {
    line-height: 1.5;
}

/* QR */
.qrCard {
    gap: 12px;
}

.qrBox {
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
}

.qrText {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
}

.qrEnds {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
}

/* QR 잠김 */
.lockTitle {
    margin: 4px 0 0;
    font-size: 16px;
    font-weight: 700;
}

.countdown {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.countdownLabel {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
}

.countdownTime {
    font-size: 28px;
    font-weight: 700;
    color: var(--primary-strong);
    font-variant-numeric: tabular-nums;
}

/* 결제 구간 */
.segment {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    font-variant-numeric: tabular-nums;
}

.segmentRow {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
}

.segmentRowCenter {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.segmentName {
    font-size: 14px;
}

.segmentPrice {
    font-size: 15px;
    font-weight: 700;
}

.receipt {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    font-size: 13px;
    font-weight: 700;
    color: var(--primary);
    text-decoration: none;
}

.muted {
    font-size: 13px;
    color: var(--muted);
}

/* 환불 안내 */
.refundRows {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
}

.refundRow {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 10px;
    color: var(--muted);
}

.refundCurrent {
    align-items: center;
    border-radius: var(--radius);
    background: var(--primary-soft);
    color: var(--primary-strong);
    font-weight: 700;
}

.refundValue {
    font-weight: 700;
}

.refundDanger {
    font-weight: 700;
    color: var(--danger);
}

.refundMessage {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
}
```

```css
/* src/app/css/user/CancelRequestContent.module.css — 시안 user.html U8(:1372-1416) */
.lead {
    gap: 10px;
    padding: 20px 16px;
}

.title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
}

.deadline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--warn-soft);
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
}

.deadlineTime {
    font-size: 16px;
    font-weight: 700;
    color: var(--warn);
}

.reason {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--surface-2);
}

.reasonLabel {
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
}

.reasonText {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
}
```

```css
/* src/app/css/user/ExtensionContent.module.css — 시안 user.html U9(:1417-1487) */
.wide {
    gap: 16px;
}

.titleBlock {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.muted {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
}

.compare {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 32px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    font-variant-numeric: tabular-nums;
}

.box {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--surface-2);
}

.boxNext {
    background: var(--primary-soft);
    color: var(--primary-strong);
}

.boxLabel {
    font-size: 12px;
    font-weight: 500;
}

.boxTime {
    font-size: 20px;
    font-weight: 700;
}

.boxSub {
    font-size: 12px;
}

.arrow {
    justify-self: center;
    color: var(--muted);
}

.totalLabel {
    font-size: 15px;
    font-weight: 500;
}

.warnBox {
    display: flex;
    gap: 8px;
    margin: 0;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--warn-soft);
    color: var(--fg);
    font-size: 13px;
    line-height: 1.5;
}

.warnBox svg {
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--warn);
}

.lead {
    gap: 12px;
    padding: 20px 16px;
}

.title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
}

.reason {
    margin: 0;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--surface-2);
    font-size: 15px;
    line-height: 1.5;
}

.endRow {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid var(--line);
    font-variant-numeric: tabular-nums;
}

.endTime {
    font-size: 16px;
    font-weight: 700;
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


## 테스트

spec 의 "결과" 표에서 ✓ 표시된 7건과 "계산 규칙" 표 17건을 그대로 테스트로 옮긴다. 여기에는 추가분만 적는다(ship 리뷰 `main-review-261118.md` 의 회귀).

| 종류 | 대상 | 이유 |
|---|---|---|
| 화면 회귀 | `ReservationDetailContent` — 이용 중 사용중지 호실 취소 뒤 QR 을 또 부르지 않는다 | P8-1: 다시 부를 때 옛 상세로 QR 을 불러 오류 팝업이 환불 안내를 덮었다 |
| 계산 회귀 | `screenSchedule` 3건 — 확정 · 이용 중 · 시작 뒤에도 확정 | P8-2 · P8-3: 기준 시각이 화면을 열 때만 바뀌어 시작 · 끝에 QR · 버튼이 맞지 않았다 |

테스트 모양(형제 `src/test/app/(user)/stores/[store_id]/StoreDetailContent.test.tsx`):
- `reservation-rules.test.ts` — 지금을 `'2026-11-12T07:00:00.000Z'`(한국 16:00) 같은 고정 ISO 로 넘기고, 시각은 그 기준 상대값으로 만든다. 환불 안내 줄은 `toMatchObject`.
- 화면 — `@/contracts/reservation/api` · `next/navigation`(`replace`) · `@/shared/utils/error-popup` · `TossPaymentWidget`(받은 props 잡기) mock, `RootLayoutProvider`(로그인함)로 감쌈. `qrcode.react` 는 실제(`svg` · `title` 확인). 취소 · 연장 화면은 `UserMeContext.Provider` 로 회원 상태.

## 만드는 순서

1. `qrcode.react@4.2.0` 설치 → 2. 계산 함수(`reservation-rules`)와 그 테스트 → 3. contracts 함수 9개 → 4. 화면(목록 → 예약 1건 → 취소 동의 → 연장)과 화면 테스트 → 5. 스타일 → 6. 문서(`docs/integrations.md` — 결제하기 · 연장 결제의 `returnUrl`, 결제 성공은 결제 결과 → 예약 1건)
