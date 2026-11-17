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
