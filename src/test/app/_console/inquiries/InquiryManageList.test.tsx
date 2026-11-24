import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import InquiryManageList from '@/app/_console/inquiries/InquiryManageList';
import { InquiryManageListDto } from '@/contracts/inquiry/dto/inquiry-manage-list.dto';
import { INQUIRY_ID, inquiryCategories, manageList, renderInScope } from './inquiry-fixture';

const api = vi.hoisted(() => ({
    getInquiryCategories: vi.fn(),
    getStoreInquiries: vi.fn(),
    getStoreInquiry: vi.fn(),
    answerStoreInquiry: vi.fn(),
    blindStoreInquiry: vi.fn(),
    unblindStoreInquiry: vi.fn(),
    getInquiries: vi.fn(),
    getInquiry: vi.fn(),
    answerInquiry: vi.fn(),
    blindInquiry: vi.fn(),
    unblindInquiry: vi.fn(),
}));

vi.mock('@/contracts/inquiry/api', () => api);

beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.getInquiryCategories.mockResolvedValue(inquiryCategories());
    api.getStoreInquiries.mockResolvedValue(manageList());
    api.getInquiries.mockResolvedValue(manageList());
});

describe('InquiryManageList', () => {
    it('[SUCCESS] 업체 관리자가 카테고리 · 접수 · 검색어로 조회한다 → 카테고리 1번 · 처음 목록(/mine, 값 없이 · 1쪽) → 목록 다시(/mine, PAYMENT · RECEIVED · 검색어 · 1쪽), 표는 번호 · 카테고리 · 제목 링크 · 작성자 · 상태 · 답변일시 · 문의일시', async () => {
        await act(async () => {
            renderInScope('manager', <InquiryManageList scope="manager" />);
        });

        // 처음 — 카테고리 1번 · 내 업체 목록 1번(전체 · 1쪽)
        expect(api.getInquiryCategories).toHaveBeenCalledTimes(1);
        expect(api.getStoreInquiries).toHaveBeenCalledTimes(1);
        expect(api.getStoreInquiries.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(api.getStoreInquiries.mock.calls[0][1]).toBeInstanceOf(InquiryManageListDto);
        expect({...api.getStoreInquiries.mock.calls[0][1]}).toMatchObject({page: 1, size: 20, inquiry_category_id: null, inquiry_state_id: null, keyword: null});
        expect(api.getInquiries).not.toHaveBeenCalled();

        // 표 — 번호(검색 결과 기준) · ID 글자 없음
        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['14', '결제/환불', '환불은 언제 되나요?', '여행하는고양이', '접수', '—', '2026-11-20 12:00']);
        expect(within(rows[1]).getByRole('link', {name: '환불은 언제 되나요?'}).getAttribute('href')).toBe(`/manager/inquiries/${INQUIRY_ID}/`);
        expect(within(rows[2]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['13', '예약', '연장은 어떻게 하나요?', '새벽기차', '답변완료', '2026-11-19 18:30', '2026-11-19 10:00']);
        expect(document.body.textContent).not.toContain(INQUIRY_ID);

        // 거르기 — 카테고리 · 상태 칩 · 검색어
        await act(async () => {
            fireEvent.change(screen.getByLabelText('카테고리'), {target: {value: 'PAYMENT'}});
        });
        await act(async () => {
            fireEvent.click(within(screen.getByRole('group', {name: '문의 상태'})).getByRole('button', {name: '접수'}));
        });
        fireEvent.change(screen.getByRole('searchbox', {name: '검색어'}), {target: {value: ' 환불 '}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '조회'}));
        });

        expect(api.getInquiryCategories).toHaveBeenCalledTimes(1);
        expect(api.getStoreInquiries).toHaveBeenCalledTimes(4);
        expect({...api.getStoreInquiries.mock.calls[3][1]}).toMatchObject({page: 1, size: 20, inquiry_category_id: 'PAYMENT', inquiry_state_id: 'RECEIVED', keyword: '환불'});
        expect(api.getInquiries).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 관리자가 들어온다 → 같은 화면이 관리자 경로(/mine 없음)로 읽고, 제목 링크가 /admin/inquiries/<문의>/', async () => {
        await act(async () => {
            renderInScope('admin', <InquiryManageList scope="admin" />);
        });

        expect(api.getInquiries).toHaveBeenCalledTimes(1);
        expect(api.getInquiries.mock.calls[0][0]).toMatchObject({token: 'admin-token'});
        expect({...api.getInquiries.mock.calls[0][1]}).toMatchObject({page: 1, size: 20, inquiry_category_id: null, inquiry_state_id: null, keyword: null});
        expect(api.getStoreInquiries).not.toHaveBeenCalled();
        expect(screen.getByRole('link', {name: '환불은 언제 되나요?'}).getAttribute('href')).toBe(`/admin/inquiries/${INQUIRY_ID}/`);
        expect(screen.getByText('업체가 아닌 바로방 문의입니다. 문의일 최신순.')).toBeTruthy();
    });
});
