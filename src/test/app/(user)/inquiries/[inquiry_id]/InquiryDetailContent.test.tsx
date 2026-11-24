import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import InquiryDetailContent from '@/app/(user)/inquiries/[inquiry_id]/InquiryDetailContent';
import { InquiryDetailResultDto } from '@/contracts/inquiry/dto/inquiry-detail.dto';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {getMyInquiry} = vi.hoisted(() => ({getMyInquiry: vi.fn()}));

vi.mock('@/contracts/inquiry/api', () => ({getMyInquiry}));

/** 로그인한 이용자 */
const AUTH: AuthContextType = {area: 'user', token: 'user-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/** 문의 ID */
const INQUIRY_ID = 'a'.repeat(32);

/** 블라인드 안내 */
const BLIND_NOTICE = '스팸/반복성 문의로 블라인드 된 문의입니다.';

/**
 * 문의 상세
 *
 * @param extra 바꿀 값
 */
function detail(extra: Partial<InquiryDetailResultDto>): InquiryDetailResultDto {
    return {
        inquiry_id: INQUIRY_ID,
        store_id: 'c'.repeat(32),
        store_name: '스테이 리프 강남역점',
        inquiry_category_id: 'PAYMENT',
        inquiry_category_name: '결제/환불',
        title: '환불은 언제 되나요?',
        content: '어제 취소한 예약의\n환불 날짜가 궁금해요.',
        inquiry_state_id: 'ANSWERED',
        inquiry_state_name: '답변완료',
        answer_content: '카드사 사정에 따라 3~5일 걸려요.',
        answered_at: '2026-11-21T05:30:00.000Z',
        created_at: '2026-11-20T03:00:00.000Z',
        ...extra,
    };
}

/**
 * 상세 화면을 그린다
 */
async function renderDetail(): Promise<void> {
    await act(async () => {
        render(
            <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                <InquiryDetailContent inquiryId={INQUIRY_ID} />
            </RootLayoutProvider>,
        );
    });
}

beforeEach(() => {
    getMyInquiry.mockReset();
});

describe('InquiryDetailContent', () => {
    it('[SUCCESS] 답변이 달린 업체 문의를 연다 → 상세 1번, 답변완료 · 카테고리 · 상호명 · 제목 · 내용 · 답변 · 답변일', async () => {
        getMyInquiry.mockResolvedValue(detail({}));
        await renderDetail();

        expect(getMyInquiry).toHaveBeenCalledTimes(1);
        expect(getMyInquiry.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(getMyInquiry.mock.calls[0][1]).toBe(INQUIRY_ID);

        const text = document.body.textContent ?? '';
        expect(screen.getByRole('heading', {name: '환불은 언제 되나요?'})).toBeTruthy();
        expect(text).toContain('답변완료');
        expect(text).toContain('결제/환불');
        expect(screen.getByText('문의 대상').nextElementSibling?.textContent).toBe('스테이 리프 강남역점');
        expect(text).toContain('어제 취소한 예약의\n환불 날짜가 궁금해요.');
        expect(text).toContain('카드사 사정에 따라 3~5일 걸려요.');
        expect(text).toContain('11월 21일(토) 14:30');
        expect(text).not.toContain(BLIND_NOTICE);
        expect(text).not.toContain('아직 답변이 없어요');
        expect(text).not.toContain(INQUIRY_ID);
    });

    it('[SUCCESS] 블라인드된 문의를 연다 → "스팸/반복성 문의로 블라인드 된 문의입니다." 띠 · 내용은 그대로', async () => {
        getMyInquiry.mockResolvedValue(detail({store_id: null, store_name: null, inquiry_state_id: 'BLIND', inquiry_state_name: '블라인드', answer_content: null, answered_at: null}));
        await renderDetail();

        const text = document.body.textContent ?? '';
        expect(screen.getByText(BLIND_NOTICE)).toBeTruthy();
        expect(text).toContain('블라인드');
        expect(text).toContain('어제 취소한 예약의\n환불 날짜가 궁금해요.');
        expect(text).toContain('아직 답변이 없어요');
        expect(screen.getByText('문의 대상').nextElementSibling?.textContent).toBe('바로방');
    });
});
