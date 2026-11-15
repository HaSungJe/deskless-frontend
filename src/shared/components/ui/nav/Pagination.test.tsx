import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Pagination from './Pagination';
import { PaginationType } from '@/shared/types/pagination';

/**
 * 5쪽짜리 목록(100건, 20건씩)의 pagination
 *
 * @param page 현재 페이지
 */
function paginationAt(page: number): PaginationType {
    return {
        all_search_yn: 'N',
        total_count: 100,
        page,
        max_page: 5,
        page_range: {start: 1, end: 5},
        content_start_number: 100 - (page - 1) * 20,
        content_start_number_reverse: (page - 1) * 20 + 1,
    };
}

describe('Pagination', () => {
    it('[SUCCESS] 페이지 번호를 누르면 그 번호를 문자열로 한 번 넘긴다', () => {
        const movePage = vi.fn();
        render(<Pagination pagination={paginationAt(2)} movePage={movePage} />);

        fireEvent.click(screen.getByRole('button', {name: '4'}));

        expect(movePage).toHaveBeenCalledTimes(1);
        expect(movePage).toHaveBeenCalledWith('4');
    });

    it('[SUCCESS] 이전 · 다음은 현재 페이지 앞뒤 번호를 넘긴다', () => {
        const movePage = vi.fn();
        render(<Pagination pagination={paginationAt(2)} movePage={movePage} />);

        fireEvent.click(screen.getByRole('button', {name: '이전 페이지'}));
        fireEvent.click(screen.getByRole('button', {name: '다음 페이지'}));

        expect(movePage).toHaveBeenCalledTimes(2);
        expect(movePage).toHaveBeenNthCalledWith(1, '1');
        expect(movePage).toHaveBeenNthCalledWith(2, '3');
    });

    it('[FAIL:current] 현재 페이지 버튼은 aria-current 이고 눌러도 이동하지 않는다', () => {
        const movePage = vi.fn();
        render(<Pagination pagination={paginationAt(2)} movePage={movePage} />);
        const current = screen.getByRole('button', {name: '2'});

        fireEvent.click(current);

        expect(current.getAttribute('aria-current')).toBe('page');
        expect(movePage).not.toHaveBeenCalled();
    });

    it('[FAIL:first] 1쪽이면 이전 버튼이 막혀 눌러도 이동하지 않는다', () => {
        const movePage = vi.fn();
        render(<Pagination pagination={paginationAt(1)} movePage={movePage} />);
        const prev = screen.getByRole('button', {name: '이전 페이지'}) as HTMLButtonElement;

        fireEvent.click(prev);

        expect(prev.disabled).toBe(true);
        expect(movePage).not.toHaveBeenCalled();
    });

    it('[FAIL:last] 마지막 쪽이면 다음 버튼이 막혀 눌러도 이동하지 않는다', () => {
        const movePage = vi.fn();
        render(<Pagination pagination={paginationAt(5)} movePage={movePage} />);
        const next = screen.getByRole('button', {name: '다음 페이지'}) as HTMLButtonElement;

        fireEvent.click(next);

        expect(next.disabled).toBe(true);
        expect(movePage).not.toHaveBeenCalled();
    });

    it('[FAIL:empty] pagination 이 없으면 아무것도 그리지 않는다', () => {
        const {container} = render(<Pagination pagination={null} movePage={vi.fn()} />);

        expect(container.childElementCount).toBe(0);
    });
});
