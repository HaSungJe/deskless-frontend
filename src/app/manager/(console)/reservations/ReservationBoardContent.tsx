'use client';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getStoreReservations } from '@/contracts/reservation/api';
import { ReservationStoreDto } from '@/contracts/reservation/dto/reservation-store.dto';
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
import { BoardActionType, BoardLoadType, BoardTargetType, shiftDate } from './reservation-board-format';
import styles from '@/app/css/manager/ReservationBoardContent.module.css';

/**
 * M3 예약 현황 — 날짜 · 호실별 하루 막대 · 막대 대화상자 → 업체 취소 · 호실 이동 · 이용 중 취소 요청
 * - "지금"은 렌더 중에 읽지 않는다 — 현황을 받은 시각(지금 선) · 막대를 누른 시각(작업 버튼)을 효과 · 이벤트 안에서 담는다
 * - 현황은 읽은 날짜와 함께 두고 고른 날짜의 것만 그린다 — 날짜를 넘기는 동안 · 못 읽었을 때 전날 막대가 남지 않게
 *
 * @returns
 */
export default function ReservationBoardContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                                         // 매니저 토큰
    const loadBoard = useEffectEvent((date: string, signal: AbortSignal) => getStoreReservations(auth, new ReservationStoreDto({date}), signal)); // 그때의 auth 로

    // 상태
    const [date, setDate] = useState<string>(() => todayKst());         // ① 고른 날짜(한국) — 처음은 오늘
    const [reloadKey, setReloadKey] = useState<number>(0);              // ⑤ 다시 불러오기
    const [board, setBoard] = useState<BoardLoadType | null>(null);     // ②③ 받은 현황 — 읽은 날짜 · 받은 시각(지금 선)과 함께, 못 읽으면 result null
    const [target, setTarget] = useState<BoardTargetType | null>(null); // ④ 누른 막대(호실 · 예약 · 누른 시각)
    const [action, setAction] = useState<BoardActionType | null>(null); // ④⑤ 열린 대화상자
    const [notice, setNotice] = useState<string | null>(null);          // 취소 요청을 보낸 안내

    // 계산 값
    const shown = board !== null && board.date === date ? board : null; // ② 고른 날짜의 현황만 — 다른 날짜를 읽는 중이면 그리지 않는다

    // 효과
    useEffect(() => {
        // ① 그 날짜 현황(떠나면 결과를 버린다) — 못 읽어도 그 날짜의 결과로 담아 빈 안내를 띄운다
        const controller = new AbortController();
        loadBoard(date, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setBoard({date, result: next, loadedAt: Date.now()});
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setBoard({date, result: null, loadedAt: Date.now()});
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

    function changeDate(value: string): void {
        // ① 날짜 칸 — 비우면 그대로
        if (value) {
            setDate(value);
        }
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
                    <Input type="date" aria-label="날짜" className={styles.date} value={date} onChange={(event) => changeDate(event.target.value)} />
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
            {shown && !shown.result ? <EmptyState title="예약 현황을 불러오지 못했어요" description="잠시 뒤 다시 불러와 주세요." action={<Button size="sm" onClick={reload}>다시 불러오기</Button>} /> : null}
            {shown?.result ? <ReservationTimeline rooms={shown.result.list} date={shown.date} now={shown.loadedAt} selectedId={target?.reservation.reservation_id ?? null} onSelect={openMenu} /> : null}
            <p className={styles.hint}>날짜 경계를 넘는 예약은 막대 끝에 ‹ · › 로 표시합니다. 이용 중 취소 요청 결과는 막대 위 배지로 봅니다.</p>

            {/* ④⑤ 대화상자 — 한 번에 하나 */}
            {target && action === 'menu' ? <ReservationMenuModal target={target} onClose={close} onChoose={setAction} /> : null}
            {target && action === 'store-cancel' ? <StoreCancelModal target={target} onClose={close} onDone={() => done(null)} /> : null}
            {target && action === 'room-change' && shown?.result ? <RoomChangeModal target={target} rooms={shown.result.list}onClose={close} onDone={() => done(null)} /> : null}
            {target && action === 'use-cancel' ? <UseCancelRequestModal target={target} onClose={close} onDone={done} /> : null}
        </div>
    );
}
