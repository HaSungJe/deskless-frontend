import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Pagination from './Pagination';
import { PaginationType } from '@/shared/types/pagination';

const pagination: PaginationType = {
    totalCount: 50,
    page: 2,
    maxPage: 5,
    pageRange: {start: 1, end: 5},
    content_start_number: 11,
    content_start_number_reverse: 40,
};

describe('Pagination', () => {
    it('[SUCCESS] 페이지 번호를 누르면 그 번호를 문자열로 넘긴다', () => {
        const movePage = vi.fn();
        render(<Pagination pagination={pagination} movePage={movePage} />);

        fireEvent.click(screen.getByRole('button', {name: '4'}));

        expect(movePage).toHaveBeenCalledTimes(1);
        expect(movePage).toHaveBeenCalledWith('4');
    });

    it('[SUCCESS] 이전 · 다음은 현재 페이지 앞뒤 번호를 넘긴다', () => {
        const movePage = vi.fn();
        render(<Pagination pagination={pagination} movePage={movePage} />);

        fireEvent.click(screen.getByRole('button', {name: '이전페이지로'}));
        fireEvent.click(screen.getByRole('button', {name: '다음페이지로'}));

        expect(movePage).toHaveBeenNthCalledWith(1, '1');
        expect(movePage).toHaveBeenNthCalledWith(2, '3');
    });

    it('[FAIL:current] 현재 페이지 버튼은 눌러도 이동하지 않는다', () => {
        const movePage = vi.fn();
        render(<Pagination pagination={pagination} movePage={movePage} />);

        fireEvent.click(screen.getByRole('button', {name: '2'}));

        expect(movePage).not.toHaveBeenCalled();
    });

    it('[FAIL:empty] pagination 이 없으면 아무것도 그리지 않는다', () => {
        const {container} = render(<Pagination pagination={null} movePage={vi.fn()} />);

        expect(container.childElementCount).toBe(0);
    });
});
