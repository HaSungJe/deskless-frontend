# Plan — 예약 현황 — 호실별 하루 막대 · 업체 취소 · 호실 이동

> 무엇을·왜는 [spec](../../spec/manager/reservation-board-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 화면 · 대화상자 비즈니스 로직 전체 ② 계산 함수 4개 ③ 규약만으로 예측할 수 없는 부분(호실 표시 · 상태 값을 함께 쓰는 곳으로)
> **싣지 않는 것** page 껍데기, 지침서 그대로인 DTO 사본, 형제와 같은 contracts 함수 — 따르는 패턴을 표 한 줄로 가리킨다

로드맵 Phase 13(#47)을 이 plan 하나로 만든다. 화면 `/manager/reservations` 는 콘솔 틀 안이라 로그인 가드 · 메뉴(`manager-menu.tsx`)는 이미 있다. 막대는 라이브러리 없이 CSS 절대 위치(%)로 그린다(spec 결정).

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/contracts/reservation/dto/` 4개(`reservation-store` · `-store-cancel` · `-room-change` · `-use-cancel-request`) | 신규 | 지침서 `frontend/dto/reservation.md` 사본 | 생략 |
| `src/contracts/reservation/api.ts` | 수정 | 현황 · 업체 취소 · 호실 이동 · 이용 중 취소 요청 4개 | 생략 |
| `src/contracts/common/room.constants.ts` | 수정 | 호실 상태 `ROOM_STATE` 를 옮겨 옴(호실 · 예약 현황이 함께 씀) | 아래 3-1 |
| `src/app/manager/(console)/room-display.ts` | 신규 | 호실 상태 배지 색 `ROOM_STATE_TONE` · 층 이름 `floorLabel` 을 옮겨 옴 | 아래 3-1 |
| `src/app/manager/(console)/rooms/room-format.ts` · `RoomsContent.tsx` · `_components/RoomStateModal.tsx` | 수정 | 옮긴 것의 import | 아래 3-1 |
| `src/app/manager/(console)/reservations/page.tsx` | 신규 | 얇은 page | 생략 |
| `src/app/manager/(console)/reservations/ReservationBoardContent.tsx` | 신규 | 날짜 · 현황 · 대화상자 전환 · 안내 띠 | 아래 1-1 |
| `src/app/manager/(console)/reservations/_components/ReservationTimeline.tsx` | 신규 | 눈금 · 호실 줄 · 막대 · 꼬리 · 지금 선 | 아래 1-2 |
| `src/app/manager/(console)/reservations/_components/ReservationMenuModal.tsx` | 신규 | 막대 대화상자 — 예약 정보 · 켜진 작업 버튼 | 아래 1-3 |
| `src/app/manager/(console)/reservations/_components/StoreCancelModal.tsx` · `RoomChangeModal.tsx` · `UseCancelRequestModal.tsx` | 신규 | 업체 취소 · 호실 이동 · 이용 중 취소 요청 | 아래 1-4 · 1-5 · 1-6 |
| `src/app/manager/(console)/reservations/reservation-board-format.ts` | 신규 | 막대 위치 · 글자 · 작업 버튼 · 옮길 호실 · 날짜 넘기기 · 지금 위치 · 막대 색 · 요청 배지 | 아래 2 |
| `src/app/css/manager/ReservationBoardContent.module.css` · `ReservationTimeline.module.css` | 신규 | 시안 값 | 아래 4 |
| 테스트 — `reservations/reservation-board-format.test.ts` · `reservations/ReservationBoardContent.test.tsx` · `reservation-fixture.tsx` · `room-display.test.ts`(옮긴 층 이름 2건) · `rooms/room-format.test.ts`(import) | 신규 · 수정 | spec 19건 | 아래 테스트 |

---

## 1. 비즈니스 로직 — 화면 · 대화상자별 코드

쓰기는 Phase 12 · 14 와 같은 모양: 검사 → 큐(`try` 안은 `await` 만) → 대화상자를 닫고 현황을 다시(`reloadKey`). 대화상자는 한 번에 하나 — 화면이 `target`(누른 막대) · `action`(메뉴 · 업체 취소 · 호실 이동 · 취소 요청)을 들고, 메뉴의 버튼이 `action` 만 바꾼다(spec 결정 — 펼침 창 대신 작은 대화상자).

"지금"은 렌더 중에 읽지 않는다 — 현황을 받은 시각(`loadedAt`, 지금 선)과 막대를 누른 시각(`target.openedAt`, 작업 버튼)을 이벤트 · 효과 안에서 `Date.now()` 로 담는다(React Compiler 가 렌더 값을 캐시해도 시각이 굳지 않게).

### 1-1. 예약 현황 — `ReservationBoardContent`

```tsx
// src/app/manager/(console)/reservations/ReservationBoardContent.tsx
'use client';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getStoreReservations } from '@/contracts/reservation/api';
import { ReservationStoreDto, ReservationStoreResultDto } from '@/contracts/reservation/dto/reservation-store.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Input from '@/shared/components/ui/form/Input';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { todayKst } from '@/shared/utils/format';
import ReservationMenuModal from './_components/ReservationMenuModal';
import ReservationTimeline from './_components/ReservationTimeline';
import RoomChangeModal from './_components/RoomChangeModal';
import StoreCancelModal from './_components/StoreCancelModal';
import UseCancelRequestModal from './_components/UseCancelRequestModal';
import { BoardActionType, BoardTargetType, shiftDate } from './reservation-board-format';
import styles from '@/app/css/manager/ReservationBoardContent.module.css';

/**
 * M3 예약 현황 — 날짜 · 호실별 하루 막대 · 막대 대화상자 → 업체 취소 · 호실 이동 · 이용 중 취소 요청
 *
 * @returns
 */
export default function ReservationBoardContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                                         // 매니저 토큰
    const loadBoard = useEffectEvent((date: string, signal: AbortSignal) => getStoreReservations(auth, new ReservationStoreDto({date}), signal)); // 그때의 auth 로

    // 상태
    const [date, setDate] = useState<string>(() => todayKst());                  // ① 고른 날짜(한국) — 처음은 오늘
    const [reloadKey, setReloadKey] = useState<number>(0);                       // ⑤ 다시 불러오기
    const [result, setResult] = useState<ReservationStoreResultDto | null>(null); // ② 현황
    const [failed, setFailed] = useState<boolean>(false);                        // 못 읽음
    const [loadedAt, setLoadedAt] = useState<number | null>(null);               // ③ 현황을 받은 시각 — 지금 선
    const [target, setTarget] = useState<BoardTargetType | null>(null);          // ④ 누른 막대(호실 · 예약 · 누른 시각)
    const [action, setAction] = useState<BoardActionType | null>(null);          // ④⑤ 열린 대화상자
    const [notice, setNotice] = useState<string | null>(null);                   // 취소 요청을 보낸 안내

    // 효과
    useEffect(() => {
        // ① 그 날짜 현황(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadBoard(date, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult(next);
                setFailed(next === null);
                setLoadedAt(Date.now());
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setFailed(true);
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [date, reloadKey]);

    // 함수
    function moveDay(days: number): void {
        // ① 전날 · 다음 날
        setDate((prev) => shiftDate(prev, days));
    }

    function reload(): void {
        // ⑤ 다시 불러오기
        setReloadKey((key) => key + 1);
    }

    function openMenu(next: Omit<BoardTargetType, 'openedAt'>): void {
        // ④ 막대 → 대화상자(누른 시각으로 작업 버튼을 정한다)
        setTarget({...next, openedAt: Date.now()});
        setAction('menu');
    }

    function close(): void {
        // 대화상자 닫기
        setAction(null);
        setTarget(null);
    }

    function done(message: string | null): void {
        // ⑤ 작업이 끝나면 닫고 다시 — 취소 요청은 안내 띠
        close();
        setNotice(message);
        reload();
    }

    return (
        // 예약 현황
        <div className={styles.page}>
            {/* ① 머리 · 날짜 */}
            <div className={styles.head}>
                <div>
                    <h1 className={styles.title}>예약 현황</h1>
                    <p className={styles.subtitle}>고른 날짜와 겹치는 예약을 호실별로 봅니다. 막대를 누르면 작업 대화상자가 열립니다.</p>
                </div>
                <div className={styles.dateBar}>
                    <Button aria-label="전날" onClick={() => moveDay(-1)}>‹</Button>
                    <Input type="date" aria-label="날짜" className={styles.date} value={date} onChange={(event) => event.target.value && setDate(event.target.value)} />
                    <Button aria-label="다음 날" onClick={() => moveDay(1)}>›</Button>
                    <Button onClick={() => setDate(todayKst())}>오늘</Button>
                    <Button onClick={reload}>다시 불러오기</Button>
                </div>
            </div>

            {/* 취소 요청 안내 */}
            {notice ? <Band tone="ok" role="status">{notice}</Band> : null}

            {/* ② 색 안내 */}
            <div className={styles.legend}>
                <span><i className={`${styles.swatch} ${styles.pend}`} />결제 대기</span>
                <span><i className={`${styles.swatch} ${styles.conf}`} />예약 확정</span>
                <span><i className={`${styles.swatch} ${styles.in}`} />이용 중</span>
                <span><i className={`${styles.swatch} ${styles.done}`} />이용 완료</span>
                <span><i className={`${styles.swatch} ${styles.tail}`} />정비시간(점유 끝까지)</span>
                <span><i className={styles.nowSwatch} />지금</span>
            </div>

            {/* 못 읽음 · ②③ 막대 */}
            {failed && !result ? <EmptyState title="예약 현황을 불러오지 못했어요" description="잠시 뒤 다시 불러와 주세요." action={<Button size="sm" onClick={reload}>다시 불러오기</Button>} /> : null}
            {result ? <ReservationTimeline rooms={result.list} date={date} now={loadedAt} selectedId={target?.reservation.reservation_id ?? null} onSelect={openMenu} /> : null}
            <p className={styles.hint}>날짜 경계를 넘는 예약은 막대 끝에 ‹ · › 로 표시합니다. 이용 중 취소 요청 결과는 막대 위 배지로 봅니다.</p>

            {/* ④⑤ 대화상자 — 한 번에 하나 */}
            {target && action === 'menu' ? <ReservationMenuModal target={target} onClose={close} onChoose={setAction} /> : null}
            {target && action === 'store-cancel' ? <StoreCancelModal target={target} onClose={close} onDone={() => done(null)} /> : null}
            {target && action === 'room-change' && result ? <RoomChangeModal target={target} rooms={result.list} onClose={close} onDone={() => done(null)} /> : null}
            {target && action === 'use-cancel' ? <UseCancelRequestModal target={target} onClose={close} onDone={done} /> : null}
        </div>
    );
}
```

### 1-2. 막대 — `ReservationTimeline`

```tsx
// src/app/manager/(console)/reservations/_components/ReservationTimeline.tsx
import { ReservationStoreItemResultDto, ReservationStoreRoomResultDto } from '@/contracts/reservation/dto/reservation-store.dto';
import { ROOM_STATE } from '@/contracts/common/room.constants';
import Badge from '@/shared/components/ui/display/Badge';
import { toKst } from '@/shared/utils/format';
import { floorLabel, ROOM_STATE_TONE } from '../../room-display';
import { BAR_STATE_CLASS, barGeometry, barLabel, BoardTargetType, CANCEL_REQUEST_BADGE, nowPercent, TICK_HOURS } from '../reservation-board-format';
import styles from '@/app/css/manager/ReservationTimeline.module.css';

type ReservationTimelineProps = {
    rooms: Array<ReservationStoreRoomResultDto>;                       // 현황 호실(층 · 호실명 순)
    date: string;                                                      // 고른 날짜
    now: number | null;                                                // 현황을 받은 시각 — 그날이면 지금 선
    selectedId: string | null;                                         // 대화상자를 연 예약
    onSelect: (target: Omit<BoardTargetType, 'openedAt'>) => void;     // 막대를 눌렀다
};

/**
 * 호실별 하루(0 ~ 24시) 막대 — 눈금 · 지금 선 · 예약 막대(잘림 ‹ ›) · 정비 꼬리 · 이용 중 취소 요청 배지
 *
 * @param param0
 * @returns
 */
export default function ReservationTimeline({rooms, date, now, selectedId, onSelect}: ReservationTimelineProps): React.ReactNode {
    // 계산 값
    const nowAt = now === null ? null : nowPercent(now, date); // ③ 지금 선 — 그날이 아니면 없음

    return (
        // 막대 판(가로로 넘치면 스크롤)
        <div className={styles.wrap}>
            <div className={styles.timeline}>
                {/* 눈금 */}
                <div className={styles.head}>
                    <div className={styles.room}>호실</div>
                    <div className={styles.track}>{TICK_HOURS.map((hour) => <span key={hour} className={styles.tick} style={{left: `${(hour / 24) * 100}%`}}>{hour === 24 ? '24시' : String(hour).padStart(2, '0')}</span>)}</div>
                </div>

                <div className={styles.body}>
                    {/* 눈금선 · ③ 지금 선 */}
                    <div className={styles.grid}>
                        {TICK_HOURS.slice(1, -1).map((hour) => <div key={hour} className={styles.gridLine} style={{left: `${(hour / 24) * 100}%`}} />)}
                        {nowAt !== null && now !== null ? <><div className={styles.now} style={{left: `${nowAt}%`}} /><span className={styles.nowLabel} style={{left: `${nowAt}%`}}>지금 {toKst(new Date(now).toISOString(), 'HH:mm')}</span></> : null}
                    </div>

                    {/* ② 호실 줄 */}
                    {rooms.map((room) => (
                        <div key={room.room_id} className={room.room_state_id === ROOM_STATE.DISABLED ? `${styles.row} ${styles.off}` : styles.row}>
                            <div className={styles.room}>
                                <div className={styles.roomName}>{room.room_name}<Badge tone={ROOM_STATE_TONE[room.room_state_id] ?? 'neutral'}>{room.room_state_name}</Badge></div>
                                <div className={styles.roomSub}>{floorLabel(room.floor)} · {room.room_group_name}</div>
                            </div>
                            <div className={styles.track}>
                                {room.reservations.length === 0 ? <span className={styles.empty}>{room.room_state_id === ROOM_STATE.DISABLED ? '사용중지 — 새 예약을 받지 않습니다' : '예약 없음'}</span> : null}
                                {room.reservations.map((reservation) => <Bar key={reservation.reservation_id} room={room} reservation={reservation} date={date} selected={selectedId === reservation.reservation_id} onSelect={onSelect} />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

type BarProps = {
    room: ReservationStoreRoomResultDto;                           // 그 호실
    reservation: ReservationStoreItemResultDto;                    // 예약
    date: string;                                                  // 고른 날짜
    selected: boolean;                                             // 대화상자를 연 막대
    onSelect: (target: Omit<BoardTargetType, 'openedAt'>) => void; // 눌렀다
};

/**
 * 예약 막대 하나 — 위치 · 길이(barGeometry) · 시간 글자(barLabel) · 정비 꼬리 · 취소 요청 배지
 *
 * @param param0
 * @returns
 */
function Bar({room, reservation, date, selected, onSelect}: BarProps): React.ReactNode {
    // 계산 값
    const geometry = barGeometry(reservation, date);                                                                                                          // 위치 · 길이 · 잘림 · 꼬리
    const badge = reservation.cancel_request_state_id ? CANCEL_REQUEST_BADGE[reservation.cancel_request_state_id] ?? null : null;                              // 취소 요청 배지
    const classNames = [styles.bar, styles[BAR_STATE_CLASS[reservation.reservation_state_id] ?? 'done'], geometry.cutLeft ? styles.cutLeft : '', geometry.cutRight ? styles.cutRight : '', selected ? styles.selected : ''].filter(Boolean).join(' '); // 막대 모양

    return (
        // 막대 · 꼬리 · 배지
        <>
            {badge ? <span className={styles.requestBadge} style={{left: `${geometry.left}%`}}><Badge tone={badge.tone}>{badge.label}</Badge></span> : null}
            <button type="button" className={classNames} style={{left: `${geometry.left}%`, width: `${geometry.width}%`}} onClick={() => onSelect({room, reservation})}>
                <b>{barLabel(reservation, date)}</b>
                <span>{reservation.user_name} · {reservation.room_plan_type_name}</span>
            </button>
            {geometry.tailWidth > 0 ? <div className={styles.tail} style={{left: `${geometry.tailLeft}%`, width: `${geometry.tailWidth}%`}} /> : null}
        </>
    );
}
```

### 1-3. 막대 대화상자 — `ReservationMenuModal`

```tsx
// src/app/manager/(console)/reservations/_components/ReservationMenuModal.tsx
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Modal from '@/shared/components/ui/modal/Modal';
import { formatPhone, formatPrice, toKst } from '@/shared/utils/format';
import { BoardActionType, BoardTargetType, reservationActions } from '../reservation-board-format';
import ReservationSummary from './ReservationSummary';
import styles from '@/app/css/manager/ReservationBoardContent.module.css';

type ReservationMenuModalProps = {
    target: BoardTargetType;                    // 누른 막대
    onClose: () => void;                        // 닫기
    onChoose: (action: BoardActionType) => void; // ⑤ 작업 대화상자로
};

/**
 * 막대 대화상자 — 예약 정보 · 그 예약에 할 수 있는 작업 버튼만 켠다(누른 시각 기준)
 *
 * @param param0
 * @returns
 */
export default function ReservationMenuModal({target, onClose, onChoose}: ReservationMenuModalProps): React.ReactNode {
    // 계산 값
    const actions = reservationActions(target.reservation, target.openedAt); // ④ 켜질 버튼

    return (
        // 막대 대화상자
        <Modal open title={`${target.room.room_name} 예약`} onClose={onClose} footer={<Button onClick={onClose}>닫기</Button>}>
            {/* ④ 예약 정보 */}
            <ReservationSummary target={target} />

            {/* ④ 작업 */}
            <div className={styles.menuActions}>
                <Button variant="danger" disabled={!actions.storeCancel} onClick={() => onChoose('store-cancel')}>업체 취소</Button>
                <Button disabled={!actions.roomChange} onClick={() => onChoose('room-change')}>호실 이동</Button>
                <Button disabled={!actions.useCancelRequest} onClick={() => onChoose('use-cancel')}>이용 중 취소 요청</Button>
            </div>
            <p className={styles.hint}>업체 취소 · 호실 이동은 시작 전 예약에만, 이용 중 취소 요청은 이용 중 예약에만 켜집니다.</p>
        </Modal>
    );
}
```

`ReservationSummary`(같은 폴더)는 대화상자 넷이 함께 쓰는 정보 줄이다 — 호실(`호실 · 층 · 그룹`) · 시간(`YYYY-MM-DD HH:mm ~ HH:mm`, 점유 끝) · 상품 · 예약자(이름 · `formatPhone`) · 상태 배지(+ 취소 요청 배지) · 금액(`formatPrice`). 그리기만 하는 `<dl>` 이라 코드는 생략하고 위 import 로만 둔다.

### 1-4. 업체 취소 — `StoreCancelModal`

```tsx
// src/app/manager/(console)/reservations/_components/StoreCancelModal.tsx
'use client';
import { useContext, useState } from 'react';
import { cancelStoreReservation } from '@/contracts/reservation/api';
import { ReservationStoreCancelDto } from '@/contracts/reservation/dto/reservation-store-cancel.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Field from '@/shared/components/ui/form/Field';
import Textarea from '@/shared/components/ui/form/Textarea';
import Modal from '@/shared/components/ui/modal/Modal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPrice } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { BoardTargetType, CANCEL_REASON_MAX } from '../reservation-board-format';
import ReservationSummary from './ReservationSummary';
import styles from '@/app/css/manager/ReservationBoardContent.module.css';

type StoreCancelModalProps = {
    target: BoardTargetType; // 취소할 예약
    onClose: () => void;     // 닫기
    onDone: () => void;      // 끝나면 — 닫고 현황 다시
};

/**
 * 업체 취소 대화상자 — 사유(예약자 문자에 함께) → 업체 취소(큐, 확정은 전액 환불)
 *
 * @param param0
 * @returns
 */
export default function StoreCancelModal({target, onClose, onDone}: StoreCancelModalProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [reason, setReason] = useState<string>(''); // 취소 사유
    const [busy, setBusy] = useState<boolean>(false); // 보내는 중

    // 함수
    async function submit(): Promise<void> {
        // ② 사유 검사 → 업체 취소(큐) → ③ 닫고 현황 다시
        const dto = Object.assign(new ReservationStoreCancelDto(), {cancel_reason: reason.trim()});
        if (busy || !(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await cancelStoreReservation(auth, target.reservation.reservation_id, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error); // ③ 이미 시작한 예약 — 받은 문구
            return;
        }

        onDone();
    }

    return (
        // 업체 취소
        <Modal open title="업체 취소" onClose={onClose} footer={<><Button onClick={onClose}>닫기</Button><Button variant="danger" disabled={busy} onClick={submit}>{busy ? '처리 중…' : '업체 취소'}</Button></>}>
            <div className={styles.dialog}>
                {/* ① 예약 · 안내 */}
                <ReservationSummary target={target} />
                <Band tone="warn">확정 예약은 결제 금액 전액({formatPrice(target.reservation.total_price)})을 환불합니다. 취소 사유는 예약자에게 가는 문자에 함께 나갑니다.</Band>

                {/* ② 사유 */}
                <Field label="취소 사유" name="cancel_reason" htmlFor="store-cancel-reason" hint={`${reason.length} / ${CANCEL_REASON_MAX}`} required>
                    <Textarea id="store-cancel-reason" rows={3} maxLength={CANCEL_REASON_MAX} value={reason} onChange={(event) => setReason(event.target.value)} />
                </Field>
            </div>
        </Modal>
    );
}
```

### 1-5. 호실 이동 — `RoomChangeModal`

```tsx
// src/app/manager/(console)/reservations/_components/RoomChangeModal.tsx — StoreCancelModal 과 같은 뼈대, 다른 곳만
type RoomChangeModalProps = {
    target: BoardTargetType;                     // 옮길 예약
    rooms: Array<ReservationStoreRoomResultDto>; // 현황 호실 전부 — 옮길 호실 후보
    onClose: () => void;
    onDone: () => void;
};

// 상태
const [roomId, setRoomId] = useState<string>(''); // ③ 고른 호실
const [busy, setBusy] = useState<boolean>(false); // 보내는 중

// 계산 값
const options = roomChangeOptions(rooms, target.room); // ① 같은 그룹 · 지금 호실 빼고 · 사용중지는 못 고름

async function submit(): Promise<void> {
    // ③ 검사 → 호실 이동(큐) → 닫고 현황 다시
    const dto = Object.assign(new ReservationRoomChangeDto(), {room_id: roomId});
    if (busy || !(await validateAction(dto))) {
        return;
    }

    setBusy(true);
    let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
    try {
        await changeReservationRoom(auth, target.reservation.reservation_id, dto);
    } catch (error) {
        failure = {error};
    }

    setBusy(false);
    if (failure) {
        handleApiError(failure.error); // ③ 겹치는 예약 — validation_errors.room_id 는 목록 아래
        return;
    }

    onDone();
}

// JSX — 지금 호실 · 시간 · 예약자, 옮길 호실(라디오 — 사용중지는 disabled + 안내), 없으면 안내, 금액 · 시간 그대로 안내
<Field label={`옮길 호실 (같은 객실 그룹 · ${target.room.room_group_name})`} name="room_id" group required>
    {options.length === 0 ? <p className={styles.hint}>같은 객실 그룹에 옮길 수 있는 호실이 없습니다.</p> : null}
    {options.map((option) => (
        <label key={option.room_id} className={option.disabled ? `${styles.roomOption} ${styles.disabled}` : styles.roomOption}>
            <input type="radio" name="room-change" value={option.room_id} checked={roomId === option.room_id} disabled={option.disabled} onChange={() => setRoomId(option.room_id)} />
            <span><b>{option.room_name}</b> · {floorLabel(option.floor)}{option.disabled ? ' — 사용중지된 호실로는 옮길 수 없습니다.' : ''}</span>
            <Badge tone={ROOM_STATE_TONE[option.room_state_id] ?? 'neutral'}>{option.room_state_name}</Badge>
        </label>
    ))}
</Field>
```

### 1-6. 이용 중 취소 요청 — `UseCancelRequestModal`

```tsx
// src/app/manager/(console)/reservations/_components/UseCancelRequestModal.tsx — StoreCancelModal 과 같은 뼈대, 다른 곳만
type UseCancelRequestModalProps = {
    target: BoardTargetType;                  // 요청할 예약(이용 중)
    onClose: () => void;
    onDone: (message: string) => void;        // 끝나면 — 안내 띠 글자를 넘긴다
};

async function submit(): Promise<void> {
    // ② 사유 검사 → 요청(큐) → ③ 만료 시각 안내 · 닫고 현황 다시
    const dto = Object.assign(new ReservationUseCancelRequestDto(), {cancel_reason: reason.trim()});
    if (busy || !(await validateAction(dto))) {
        return;
    }

    setBusy(true);
    let requested: ReservationUseCancelRequestResultDto | null = null; // 요청 결과 — 늦어지면 null
    let failure: {error: unknown} | null = null;                        // 실패 — 처리는 try 밖에서
    try {
        requested = await requestUseCancel(auth, target.reservation.reservation_id, dto);
    } catch (error) {
        failure = {error};
    }

    setBusy(false);
    if (failure) {
        handleApiError(failure.error); // ③ 이미 진행 중 · 이용 중이 아님 — 받은 문구
        return;
    }

    onDone(useCancelNotice(requested));
}

// JSX — 예약 정보, Band(info) "예약자에게 동의 링크 문자를 보냅니다. 10분 안에(예약 끝이 먼저면 예약 끝까지) 예약자가 승인하면 전액 환불로 취소됩니다. 결과는 예약 현황의 막대 배지로 확인합니다.",
//       Field "취소 사유"(hint "예약자 동의 화면에 그대로 보이고, 승인되면 예약의 취소 사유가 됩니다.") · 버튼 "요청 보내기"
```

---

## 2. 계산 함수 — `src/app/manager/(console)/reservations/reservation-board-format.ts`

"한국 날짜의 0시"는 `Date.parse('<date>T00:00:00+09:00')` — 고른 날짜 하루(24시간)를 100% 로 본다(한국은 서머타임이 없어 하루는 늘 24시간). 위치는 그날 0시부터 몇 % 인지, 그날 밖은 0 · 100% 에서 자른다.

```ts
import { RESERVATION_CANCEL_REQUEST_STATE, RESERVATION_STATE } from '@/contracts/common/reservation.constants';
import { ROOM_STATE } from '@/contracts/common/room.constants';
import { ReservationStoreItemResultDto, ReservationStoreRoomResultDto } from '@/contracts/reservation/dto/reservation-store.dto';
import { ReservationUseCancelRequestResultDto } from '@/contracts/reservation/dto/reservation-use-cancel-request.dto';
import { formatTimeRange, toKst } from '@/shared/utils/format';

/** 하루(ms) */
const DAY_MS = 86_400_000;

/** 눈금 시각 — 0 ~ 24시 두 시간마다 */
export const TICK_HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] as const;

/** 취소 사유 최대 글자 수 — ReservationStoreCancelDto · ReservationUseCancelRequestDto */
export const CANCEL_REASON_MAX = 255;

/** 열린 대화상자 */
export type BoardActionType = 'menu' | 'store-cancel' | 'room-change' | 'use-cancel';

/** 누른 막대 */
export type BoardTargetType = {
    room: ReservationStoreRoomResultDto;         // 그 호실
    reservation: ReservationStoreItemResultDto;  // 예약
    openedAt: number;                            // 누른 시각(ms) — 작업 버튼 판단
};

/** 막대 색 — 시안 M3 .bar(결제 대기 pend · 확정 conf · 이용 중 in · 완료 done) */
export const BAR_STATE_CLASS: Record<string, 'pend' | 'conf' | 'in' | 'done'> = {
    [RESERVATION_STATE.PENDING]: 'pend',
    [RESERVATION_STATE.CONFIRMED]: 'conf',
    [RESERVATION_STATE.CHECKED_IN]: 'in',
    [RESERVATION_STATE.COMPLETED]: 'done',
};

/** 이용 중 취소 요청 배지 — 시안 글자("취소 요청 중" · "취소 요청 거절"), lookup 이름에 "취소 요청"을 붙이면 "취소 요청 요청 중"이 되어 따로 둔다 */
export const CANCEL_REQUEST_BADGE: Record<string, {label: string; tone: 'warn' | 'ok' | 'danger' | 'neutral'}> = {
    [RESERVATION_CANCEL_REQUEST_STATE.REQUESTED]: {label: '취소 요청 중', tone: 'warn'},
    [RESERVATION_CANCEL_REQUEST_STATE.APPROVED]: {label: '취소 요청 승인', tone: 'ok'},
    [RESERVATION_CANCEL_REQUEST_STATE.REJECTED]: {label: '취소 요청 거절', tone: 'danger'},
    [RESERVATION_CANCEL_REQUEST_STATE.EXPIRED]: {label: '취소 요청 만료', tone: 'neutral'},
};

/** 막대 위치 */
export type BarGeometryType = {
    left: number;      // 시작(%)
    width: number;     // 길이(%)
    cutLeft: boolean;  // 전날 시작 — ‹
    cutRight: boolean; // 다음 날 끝 — ›
    tailLeft: number;  // 정비 꼬리 시작(%)
    tailWidth: number; // 정비 꼬리 길이(%) — 0 이면 그리지 않음
};

/** 작업 버튼 켜짐 */
export type ReservationActionsType = {
    storeCancel: boolean;      // 업체 취소
    roomChange: boolean;       // 호실 이동
    useCancelRequest: boolean; // 이용 중 취소 요청
};

/** 옮길 호실 하나 */
export type RoomOptionType = {
    room_id: string;         // 호실 ID
    room_name: string;       // 호실명
    floor: number;           // 층
    room_state_id: string;   // 상태 — 배지 색
    room_state_name: string; // 상태명
    disabled: boolean;       // 고를 수 없음(사용중지)
};

/**
 * 한국 날짜의 0시(ms)
 *
 * @param date YYYY-MM-DD
 */
function dayStartOf(date: string): number {
    return Date.parse(`${date}T00:00:00+09:00`);
}

/**
 * 하루 안 길이(ms) → %
 *
 * @param ms 0시부터의 길이
 */
function percentOf(ms: number): number {
    return (ms / DAY_MS) * 100;
}

/**
 * 막대 위치와 길이 — 그날 밖은 0 · 100% 에서 자르고 잘렸다고 표시, 정비 꼬리(퇴실 ~ 점유 끝)도 그날 안까지만
 *
 * @param item 예약(입실 · 퇴실 · 점유 끝)
 * @param date 고른 날짜(한국)
 */
export function barGeometry(item: Pick<ReservationStoreItemResultDto, 'start_at' | 'end_at' | 'blocked_until'>, date: string): BarGeometryType {
    const dayStart = dayStartOf(date);
    const dayEnd = dayStart + DAY_MS;
    const start = Date.parse(item.start_at);
    const end = Date.parse(item.end_at);
    const from = Math.max(start, dayStart);
    const to = Math.min(end, dayEnd);
    const tailFrom = Math.max(end, dayStart);
    const tailTo = Math.min(Date.parse(item.blocked_until), dayEnd);
    return {
        left: percentOf(from - dayStart),
        width: percentOf(Math.max(to - from, 0)),
        cutLeft: start < dayStart,
        cutRight: end > dayEnd,
        tailLeft: percentOf(Math.min(tailFrom, dayEnd) - dayStart),
        tailWidth: percentOf(Math.max(tailTo - tailFrom, 0)),
    };
}

/**
 * 막대 시간 글자 — 하루 안 "10:00~13:00", 전날 시작 "‹ 11-09 21:00 ~ 11:00", 다음 날 끝 "21:00 ~ 다음 날 11:00 ›"(formatTimeRange), 둘 다면 날짜를 모두
 *
 * @param item 예약(입실 · 퇴실)
 * @param date 고른 날짜(한국)
 */
export function barLabel(item: Pick<ReservationStoreItemResultDto, 'start_at' | 'end_at'>, date: string): string {
    const dayStart = dayStartOf(date);
    const cutLeft = Date.parse(item.start_at) < dayStart;
    const cutRight = Date.parse(item.end_at) > dayStart + DAY_MS;
    if (cutLeft && cutRight) {
        return `‹ ${toKst(item.start_at, 'MM-DD HH:mm')} ~ ${toKst(item.end_at, 'MM-DD HH:mm')} ›`;
    }

    if (cutLeft) {
        return `‹ ${toKst(item.start_at, 'MM-DD HH:mm')} ~ ${toKst(item.end_at, 'HH:mm')}`;
    }

    if (cutRight) {
        return `${formatTimeRange(item.start_at, item.end_at)} ›`;
    }

    return `${toKst(item.start_at, 'HH:mm')}~${toKst(item.end_at, 'HH:mm')}`;
}

/**
 * 작업 버튼 켜짐 — 업체 취소는 시작 전 결제 대기 · 확정, 호실 이동은 시작 전 확정, 이용 중 취소 요청은 이용 중 · 예약자 휴대폰 있음 · 요청 중이 아님
 *
 * @param item 예약
 * @param now 판단 시각(ms) — 막대를 누른 때
 */
export function reservationActions(item: Pick<ReservationStoreItemResultDto, 'reservation_state_id' | 'start_at' | 'user_phone' | 'cancel_request_state_id'>, now: number): ReservationActionsType {
    const beforeStart = Date.parse(item.start_at) > now;
    const state = item.reservation_state_id;
    return {
        storeCancel: beforeStart && (state === RESERVATION_STATE.PENDING || state === RESERVATION_STATE.CONFIRMED),
        roomChange: beforeStart && state === RESERVATION_STATE.CONFIRMED,
        useCancelRequest: state === RESERVATION_STATE.CHECKED_IN && item.user_phone !== null && item.cancel_request_state_id !== RESERVATION_CANCEL_REQUEST_STATE.REQUESTED,
    };
}

/**
 * 옮길 호실 목록 — 같은 객실 그룹, 지금 호실 빼고, 사용중지는 고를 수 없게(현황 순서 그대로 — 층 · 호실명 순)
 *
 * @param rooms 현황 호실 전부
 * @param current 지금 호실
 */
export function roomChangeOptions(rooms: Array<ReservationStoreRoomResultDto>, current: Pick<ReservationStoreRoomResultDto, 'room_id' | 'room_group_id'>): Array<RoomOptionType> {
    return rooms
        .filter((room) => room.room_group_id === current.room_group_id && room.room_id !== current.room_id)
        .map((room) => ({room_id: room.room_id, room_name: room.room_name, floor: room.floor, room_state_id: room.room_state_id, room_state_name: room.room_state_name, disabled: room.room_state_id === ROOM_STATE.DISABLED}));
}

/**
 * 날짜 넘기기 — YYYY-MM-DD 를 일 단위로(시간대와 상관없이 달력 날짜)
 *
 * @param date YYYY-MM-DD
 * @param days 넘길 날 수(전날 -1)
 */
export function shiftDate(date: string, days: number): string {
    return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * 지금 선 위치(%) — 그날이 아니면 null
 *
 * @param now 시각(ms)
 * @param date 고른 날짜(한국)
 */
export function nowPercent(now: number, date: string): number | null {
    const dayStart = dayStartOf(date);
    return now >= dayStart && now < dayStart + DAY_MS ? percentOf(now - dayStart) : null;
}

/**
 * 취소 요청을 보낸 안내 — 만료 시각이 오면 "HH:mm까지", 늦어져 결과가 없으면 시각 없이
 *
 * @param requested 요청 결과
 */
export function useCancelNotice(requested: ReservationUseCancelRequestResultDto | null): string {
    return requested ? `취소 요청을 보냈습니다. ${toKst(requested.expires_at, 'HH:mm')}까지 예약자 동의를 기다립니다.` : '취소 요청을 보냈습니다. 결과는 막대 배지로 확인합니다.';
}
```

---

## 3. 규약만으로 예측할 수 없는 부분

### 3-1. 호실 상태 값 · 표시를 함께 쓰는 곳으로

호실 상태(`ROOM_STATE`) · 배지 색(`ROOM_STATE_TONE`) · 층 이름(`floorLabel`)은 호실 화면 폴더(`rooms/room-format.ts`)에 있는데 예약 현황도 쓴다 — 두 곳이라 옮긴다(AGENTS.md "두 곳 이상에서 쓰게 되면 그때 옮긴다" · 리뷰 261120 #2 와 같은 정리). 상태 값은 백엔드 값이라 `contracts/common/room.constants.ts`(상품 종류 옆), 배지 색 · 층 이름은 화면 표시라 콘솔 화면들이 함께 쓰는 `src/app/manager/(console)/room-display.ts`(콘솔 Context 와 같은 자리).

```ts
// src/contracts/common/room.constants.ts — 더함(rooms/room-format.ts 에서 옮김, 값 그대로)
/** 호실 상태 — room_state_id — 호실 · 예약 현황 */
export const ROOM_STATE = {AVAILABLE: 'AVAILABLE', RESERVED: 'RESERVED', IN_USE: 'IN_USE', MAINTENANCE: 'MAINTENANCE', DISABLED: 'DISABLED'} as const;

// src/app/manager/(console)/room-display.ts — 새로(rooms/room-format.ts 의 ROOM_STATE_TONE · floorLabel 을 본문 그대로 옮김)
import { ROOM_STATE } from '@/contracts/common/room.constants';
export const ROOM_STATE_TONE: Record<string, 'ok' | 'primary' | 'inuse' | 'warn' | 'danger'> = { /* 그대로 */ };
export function floorLabel(floor: number): string { /* 그대로 */ }

// rooms/room-format.ts — ROOM_STATE · ROOM_STATE_TONE · floorLabel 을 지우고 import { ROOM_STATE } from '@/contracts/common/room.constants'
// rooms/RoomsContent.tsx — import { floorLabel, ROOM_STATE_TONE } from '../room-display' · formatOpenedAt 은 './room-format'
// rooms/_components/RoomStateModal.tsx — ROOM_STATE 는 '@/contracts/common/room.constants'
```

---

## 4. 기존 패턴 그대로 · 스타일

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| DTO 사본 4개 | 지침서 블록 그대로(`## reservation/dto/<파일>` → `src/contracts/reservation/dto/<파일>`) | `src/contracts/room/dto/` |
| `getStoreReservations(auth, query, signal?)` | `withAuth` + `request` GET `/admin-service/reservation/store`(query `{date}`) | `src/contracts/room/api.ts` `getRoomPlans` |
| `cancelStoreReservation(auth, id, dto)` · `changeReservationRoom(auth, id, dto)`(PATCH `/admin-service/reservation/<id>/store-cancel` · `/room`) — `Promise<null>` | `withAuth` + `callQueue<null>`, id 는 `encodeURIComponent` | `src/contracts/room/api.ts` `updateRoomState` |
| `requestUseCancel(auth, id, dto)`(POST `/use-cancel-request` — `ReservationUseCancelRequestResultDto \| null`) | `withAuth` + `callQueue<결과 DTO>` | `src/contracts/room/api.ts` `createRoom` |
| `reservations/page.tsx` | 얇은 page — `<ReservationBoardContent />` | `src/app/manager/(console)/rooms/page.tsx` |
| `ReservationSummary`(대화상자 정보 줄) | 그리기만 하는 `<dl>` | `src/app/manager/(console)/staff/[user_id]/_components/StaffInfoCard.tsx` 의 `dl` |

시안 `frontend/design/manager.html` M3(`.legend` · `.tl` · `.tl-h` · `.tl-rm` · `.tl-t` · `.bar` · `.tail` · `.now` · `.cut-l` · `.cut-r` · `.sel`)을 토큰으로. 막대 판은 가로로 넘치면 스크롤(시안 `.tl{min-width:1060px}` · 왼쪽 호실 칸 220px · 줄 72px · 막대 44px — 부품 고유 치수).

```css
/* ReservationTimeline.module.css */
.wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface); }
.timeline { min-width: 1060px; }
.head { display: flex; height: 36px; border-bottom: 1px solid var(--line); background: var(--surface-2); font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.body { position: relative; }
.grid { position: absolute; top: 0; bottom: 0; left: 220px; right: 0; pointer-events: none; }
.gridLine { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--line); }
.now { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--danger); z-index: 1; }
.nowLabel { position: absolute; top: 2px; transform: translateX(-50%); padding: 1px 6px; border-radius: 999px; background: var(--danger); color: var(--on-primary); font-size: 12px; font-weight: 700; white-space: nowrap; z-index: 2; }
.row { display: flex; height: 72px; border-bottom: 1px solid var(--line); }
.row:last-child { border-bottom: 0; }
.off, .off .room { background: var(--surface-2); }
.room { width: 220px; flex: none; padding: 10px 16px; display: flex; flex-direction: column; justify-content: center; gap: 4px; border-right: 1px solid var(--line); background: var(--surface); }
.head .room { background: var(--surface-2); font-weight: 700; }
.roomName { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.roomSub { font-size: 12px; color: var(--muted); }
.track { position: relative; flex: 1; min-width: 0; }
.tick { position: absolute; top: 10px; transform: translateX(-50%); }
.empty { position: absolute; top: 26px; left: 12px; font-size: 13px; color: var(--muted); }
.bar { position: absolute; top: 20px; height: 44px; padding: 4px 8px; border: 1px solid; border-radius: 6px; text-align: left; font: inherit; font-size: 12px; line-height: 1.4; overflow: hidden; cursor: pointer; }
.bar b, .bar span { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bar span { font-weight: 400; color: var(--fg); }
.pend { background: var(--warn-soft); border-color: var(--warn); color: var(--warn); }
.conf { background: var(--primary-soft); border-color: var(--primary); color: var(--primary-strong); }
.in { background: var(--ok-soft); border-color: var(--ok); color: var(--ok); }
.done { background: var(--neutral-bg); border-color: var(--faint); color: var(--neutral-fg); }
.cutLeft { border-left: 0; border-radius: 0 6px 6px 0; }
.cutRight { border-right: 0; border-radius: 6px 0 0 6px; }
.selected { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--primary); }
.tail { position: absolute; top: 20px; height: 44px; border: 1px dashed var(--faint); border-left: 0; border-radius: 0 6px 6px 0; background: var(--surface-2); }
.requestBadge { position: absolute; top: 1px; }

/* ReservationBoardContent.module.css — 머리 · 날짜 줄 · 색 안내(.legend) · 대화상자(정보 dl · 작업 버튼 · 호실 고르기) */
.page { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }
.title { margin: 0; font-size: 22px; font-weight: 700; }
.subtitle { margin: 6px 0 0; font-size: 13px; color: var(--muted); }
.dateBar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.date { width: 170px; }
.legend { display: flex; flex-wrap: wrap; gap: 8px 20px; font-size: 13px; color: var(--muted); }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.swatch { display: inline-block; width: 14px; height: 12px; border-radius: 3px; border: 1px solid transparent; }
.pend { background: var(--warn-soft); border-color: var(--warn); }
.conf { background: var(--primary-soft); border-color: var(--primary); }
.in { background: var(--ok-soft); border-color: var(--ok); }
.done { background: var(--neutral-bg); border-color: var(--faint); }
.tail { background: var(--surface-2); border: 1px dashed var(--faint); }
.nowSwatch { display: inline-block; width: 2px; height: 14px; background: var(--danger); }
.hint { margin: 0; font-size: 13px; line-height: 1.6; color: var(--muted); }
.dialog { display: flex; flex-direction: column; gap: 16px; }
.summary { margin: 0; display: grid; grid-template-columns: 72px 1fr; gap: 6px 12px; font-size: 14px; }
.summary dt { color: var(--muted); font-size: 13px; }
.summary dd { margin: 0; font-variant-numeric: tabular-nums; }
.menuActions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.roomOption { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--radius); }
.disabled { color: var(--muted); background: var(--surface-2); }
```

## 테스트

spec 의 "결과" 표에서 ✓ 표시된 5건과 "계산 규칙" 표 14건을 그대로 테스트로 옮긴다. 추가분은 옮기는 테스트뿐이다.

| 종류 | 대상 | 이유 |
|---|---|---|
| 옮긴 테스트 | 층 이름 2건 — `rooms/room-format.test.ts` → `src/test/app/manager/(console)/room-display.test.ts` | 함수가 옮겨 가므로(새 테스트 아님) |

테스트 파일과 경계 mock:
- 계산 — `src/test/app/manager/(console)/reservations/reservation-board-format.test.ts`(막대 위치 4 · 글자 3 · 작업 버튼 4 · 옮길 호실 3) — 위치는 `toBeCloseTo(…, 2)`, 시각은 ISO(`2026-11-10T01:00:00.000Z` = 한국 10:00).
- 화면 — `reservations/ReservationBoardContent.test.tsx`: `@/contracts/reservation/api` mock, 시계는 `vi.useFakeTimers({toFake: ['Date']})` + `vi.setSystemTime('2026-11-10T05:30:00.000Z')`(한국 14:30 — 오늘 · 지금 선 · 시작 전 판단이 고정, 타이머는 진짜라 큐 · act 는 그대로). 다음 날 → 현황 2번째 호출 `{date: '2026-11-11'}` / 401호 17:00 막대 → 업체 취소 → 사유 → `cancelStoreReservation(auth, id, {cancel_reason})` 1번 · 현황 다시 / 사유 비움 → 칸 문구 · 0번 / 401호 → 호실 이동 → 303호 → `changeReservationRoom(auth, id, {room_id})` 1번 · 현황 다시 / 202호 이용 중 막대 → 이용 중 취소 요청 → 사유 → `requestUseCancel` 1번 → "14:40까지" 띠 · 현황 다시.
- 픽스처 — `src/test/app/manager/(console)/reservation-fixture.tsx`: 11-10 현황(202호 이용 중 · 휴대폰 · 지난 요청 거절 / 303호 예약 없음 / 401호 확정 17:00 / 402호 사용중지 — 303 · 401 · 402 는 같은 그룹, 202호는 다른 그룹).
- React Compiler 회귀 테스트(`src/test/react-compiler.test.ts`)가 새 컴포넌트를 모두 컴파일하는지 함께 본다.

## 만드는 순서

1. DTO 사본 4개 → `src/contracts/reservation/api.ts` 함수 4개
2. 옮기기 — `ROOM_STATE` → `room.constants.ts`, `ROOM_STATE_TONE` · `floorLabel` → `room-display.ts`(3-1) + 호실 화면 import + 층 이름 테스트 옮기기
3. 계산 함수 + 테스트 — `reservation-board-format.ts`(2)
4. `ReservationTimeline`(1-2) → `ReservationSummary` · `ReservationMenuModal`(1-3) → `StoreCancelModal` · `RoomChangeModal` · `UseCancelRequestModal`(1-4 ~ 1-6) → `ReservationBoardContent`(1-1) + page + css + 테스트
5. `npx next typegen && npx tsc --noEmit` · `npx vitest run`(AGENTS.md 가 허용)
6. 문서 — 없음(새 규약 없음 · 옮긴 것은 AGENTS.md 에 이름이 없다)
