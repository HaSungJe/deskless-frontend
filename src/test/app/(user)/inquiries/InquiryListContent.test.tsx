import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import InquiryListContent from '@/app/(user)/inquiries/InquiryListContent';
import { InquiryListDto, InquiryListItemResultDto } from '@/contracts/inquiry/dto/inquiry-list.dto';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {getInquiryCategories, getMyInquiries} = vi.hoisted(() => ({getInquiryCategories: vi.fn(), getMyInquiries: vi.fn()}));

vi.mock('@/contracts/inquiry/api', () => ({getInquiryCategories, getMyInquiries}));

/** 로그인한 이용자 */
const AUTH: AuthContextType = {area: 'user', token: 'user-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/** 받은 카테고리 */
const CATEGORIES = [
    {inquiry_category_id: 'RESERVATION', inquiry_category_name: '예약'},
    {inquiry_category_id: 'PAYMENT', inquiry_category_name: '결제/환불'},
];

/** 한 쪽 페이지 정보 */
const PAGINATION = {all_search_yn: 'N', total_count: 2, page: 1, max_page: 1, page_range: {start: 1, end: 1}, content_start_number: 2, content_start_number_reverse: 1};

/**
 * 문의 한 건
 *
 * @param id 문의 ID
 * @param extra 바꿀 값
 */
function inquiry(id: string, extra: Partial<InquiryListItemResultDto>): InquiryListItemResultDto {
    return {inquiry_id: id, store_id: null, store_name: null, inquiry_category_id: 'PAYMENT', inquiry_category_name: '결제/환불', title: '환불은 언제 되나요?', inquiry_state_id: 'RECEIVED', inquiry_state_name: '접수', answered_at: null, created_at: '2026-11-20T03:00:00.000Z', ...extra};
}

beforeEach(() => {
    getInquiryCategories.mockReset().mockResolvedValue({list: CATEGORIES});
    getMyInquiries.mockReset().mockResolvedValue({
        list: [
            inquiry('a'.repeat(32), {store_id: 'c'.repeat(32), store_name: '스테이 리프 강남역점', inquiry_state_id: 'ANSWERED', inquiry_state_name: '답변완료', answered_at: '2026-11-21T03:00:00.000Z'}),
            inquiry('b'.repeat(32), {title: '쿠폰은 어디서 받나요?'}),
        ],
        pagination: PAGINATION,
    });
});

describe('InquiryListContent', () => {
    it('[SUCCESS] 들어온 뒤 "결제/환불" · "답변완료" 칩을 누른다 → 카테고리 1번 · 처음 목록(값 없이 · 1쪽) → 목록 다시(PAYMENT · ANSWERED · 1쪽), 카드는 상태 · 카테고리 · 제목 · 대상 · 문의일 · 답변일', async () => {
        await act(async () => {
            render(
                <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                    <InquiryListContent />
                </RootLayoutProvider>,
            );
        });

        // 처음 — 카테고리 1번 · 목록 1번(전체 · 1쪽)
        expect(getInquiryCategories).toHaveBeenCalledTimes(1);
        expect(getMyInquiries).toHaveBeenCalledTimes(1);
        expect(getMyInquiries.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(getMyInquiries.mock.calls[0][1]).toBeInstanceOf(InquiryListDto);
        expect(getMyInquiries.mock.calls[0][1]).toMatchObject({page: 1, size: 20, inquiry_category_id: null, inquiry_state_id: null});

        // 카드 — 업체 문의(상호명 · 답변일) · 바로방 문의(사이트 이름)
        const answered = screen.getByRole('link', {name: /환불은 언제 되나요\?/});
        expect(answered.getAttribute('href')).toBe(`/inquiries/${'a'.repeat(32)}/`);
        expect(answered.textContent).toContain('답변완료');
        expect(answered.textContent).toContain('결제/환불 · 스테이 리프 강남역점');
        expect(answered.textContent).toContain('문의 2026년 11월 20일 · 답변 2026년 11월 21일');

        const received = screen.getByRole('link', {name: /쿠폰은 어디서 받나요\?/});
        expect(received.textContent).toContain('접수');
        expect(received.textContent).toContain('결제/환불 · 바로방');
        expect(received.textContent).not.toContain('답변 ');
        expect(screen.getByRole('link', {name: '문의하기'}).getAttribute('href')).toBe('/inquiries/new/');

        // 칩 — 카테고리 · 상태를 바꾸면 1쪽부터 다시
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '결제/환불'}));
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '답변완료'}));
        });

        expect(getInquiryCategories).toHaveBeenCalledTimes(1);
        expect(getMyInquiries).toHaveBeenCalledTimes(3);
        expect(getMyInquiries.mock.calls[1][1]).toMatchObject({page: 1, inquiry_category_id: 'PAYMENT', inquiry_state_id: null});
        expect(getMyInquiries.mock.calls[2][1]).toMatchObject({page: 1, size: 20, inquiry_category_id: 'PAYMENT', inquiry_state_id: 'ANSWERED'});
        expect(screen.getByRole('button', {name: '결제/환불'}).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('button', {name: '답변완료'}).getAttribute('aria-pressed')).toBe('true');
    });
});
