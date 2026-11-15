'use client';
import { PaginationType } from '@/shared/types/pagination';
import styles from '@/shared/css/ui/nav/Pagination.module.css';

type PaginationProps = {
    pagination: PaginationType | null; // 목록 응답의 pagination — 없으면 그리지 않는다
    movePage: (page: string) => void;  // 고른 페이지 번호(문자열) — 목록 화면의 setPage 를 그대로
    label?: string;                    // 탭 묶음 이름 (기본 '페이지')
};

/**
 * 페이지 탭 — ‹ 번호 › (시안 .pager)
 * - 현재 페이지는 aria-current 이고 눌러도 이동하지 않는다. 1쪽이면 이전, 마지막 쪽이면 다음이 막힌다
 *
 * @param param0
 * @returns
 */
export default function Pagination({pagination, movePage, label = '페이지'}: PaginationProps): React.ReactNode {
    // 변수
    const page = pagination?.page ?? 1;          // 현재 페이지
    const maxPage = pagination?.max_page ?? 1;   // 마지막 페이지
    const numbers = pageNumbers(pagination);     // 탭에 보일 번호들

    // 함수
    function movePrev(): void {
        if (page > 1) {
            movePage(String(page - 1));
        }
    }

    function moveNext(): void {
        if (page < maxPage) {
            movePage(String(page + 1));
        }
    }

    if (!pagination) {
        return null;
    }

    return (
        // 페이지 탭
        <nav className={styles.pager} aria-label={label}>
            {/* 이전 */}
            <button type="button" className={styles.item} aria-label="이전 페이지" disabled={page <= 1} onClick={movePrev}>‹</button>

            {/* 번호 — 현재 페이지는 이동하지 않는다 */}
            {numbers.map((number) => (
                number === page ? (
                    <button key={number} type="button" className={`${styles.item} ${styles.current}`} aria-current="page">{number}</button>
                ) : (
                    <button key={number} type="button" className={styles.item} onClick={() => movePage(String(number))}>{number}</button>
                )
            ))}

            {/* 다음 */}
            <button type="button" className={styles.item} aria-label="다음 페이지" disabled={page >= maxPage} onClick={moveNext}>›</button>
        </nav>
    );
}

/**
 * 탭에 보일 페이지 번호 — page_range.start ~ end
 *
 * @param pagination 목록 응답의 pagination
 */
function pageNumbers(pagination: PaginationType | null): Array<number> {
    const numbers: Array<number> = [];
    if (pagination) {
        for (let number = pagination.page_range.start; number <= pagination.page_range.end; number++) {
            numbers.push(number);
        }
    }

    return numbers;
}
