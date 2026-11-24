import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import InquiryFormContent from '@/app/(user)/inquiries/new/InquiryFormContent';
import { DiscoveryStoreSearchDto, DiscoveryStoreSearchItemResultDto } from '@/contracts/discovery/dto/discovery-store-search.dto';
import { InquiryDto } from '@/contracts/inquiry/dto/inquiry.dto';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {createInquiry, getInquiryCategories, getStoreDetail, searchStores, replace, showErrorPopup} = vi.hoisted(() => ({
    createInquiry: vi.fn(),
    getInquiryCategories: vi.fn(),
    getStoreDetail: vi.fn(),
    searchStores: vi.fn(),
    replace: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/inquiry/api', () => ({createInquiry, getInquiryCategories}));
vi.mock('@/contracts/discovery/api', () => ({getStoreDetail, searchStores}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));
vi.mock('@/shared/components/map/StoreMap', () => ({default: () => <div data-testid="store-map" />}));

/** 로그인한 이용자 */
const AUTH: AuthContextType = {area: 'user', token: 'user-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/** 업체 ID — 32자리 16진수(InquiryDto 검증) */
const STORE_ID = 'a1'.repeat(16);

/** 등록된 문의 ID */
const INQUIRY_ID = 'b'.repeat(32);

/** 검색 결과 한 줄 */
const STORE_ITEM: DiscoveryStoreSearchItemResultDto = {store_id: STORE_ID, store_name: '스테이 리프 강남역점', address: '서울특별시 강남구 테헤란로 1', latitude: 37.498, longitude: 127.0276, image_url: null};

/**
 * 문의하기 화면을 그린다
 *
 * @param storeId 업체 상세에서 왔을 때의 업체 ID
 */
async function renderForm(storeId: string | null = null): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = render(
            <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                <InquiryFormContent storeId={storeId} />
            </RootLayoutProvider>,
        ).container;
    });
    return container;
}

/**
 * 오류 span 글자
 *
 * @param container 화면
 * @param name 칸 이름
 */
function alertText(container: HTMLElement, name: string): string {
    return (container.querySelector(`[data-type="validation-alert"][data-id="${name}"]`) as HTMLElement).innerText;
}

/**
 * 카테고리를 뺀 칸 채우기 — 제목 · 내용(앞뒤 공백 포함)
 */
function fillText(): void {
    fireEvent.change(screen.getByRole('textbox', {name: /제목/}), {target: {value: ' 환불은 언제 되나요? '}});
    fireEvent.change(screen.getByRole('textbox', {name: /내용/}), {target: {value: '어제 취소한 예약의 환불 날짜가 궁금해요.'}});
}

/**
 * 카테고리 고르기
 *
 * @param name 칩 이름
 */
function pickCategory(name: string): void {
    fireEvent.click(screen.getByRole('button', {name}));
}

/**
 * 동의 체크
 */
function agree(): void {
    fireEvent.click(screen.getByRole('checkbox', {name: '개인정보 수집 · 이용에 동의합니다'}));
}

/**
 * 문의 등록 누르기
 */
async function submit(): Promise<void> {
    await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: '문의 등록'}));
    });
}

beforeEach(() => {
    createInquiry.mockReset().mockResolvedValue({inquiry_id: INQUIRY_ID});
    getInquiryCategories.mockReset().mockResolvedValue({list: [{inquiry_category_id: 'RESERVATION', inquiry_category_name: '예약'}, {inquiry_category_id: 'PAYMENT', inquiry_category_name: '결제/환불'}]});
    getStoreDetail.mockReset();
    searchStores.mockReset().mockResolvedValue({list: [STORE_ITEM]});
    replace.mockClear();
    showErrorPopup.mockClear();
});

describe('InquiryFormContent', () => {
    it('[SUCCESS] "업체에 문의" → "강남"으로 검색해 고르고 카테고리 · 제목 · 내용 · 동의를 채워 등록한다 → 검색 1번 · 등록(큐) 1번(동의 값 없음) → 그 문의 상세로', async () => {
        await renderForm();

        // 대상 — 업체 고르기 전에는 등록 버튼이 꺼져 있다
        fireEvent.click(screen.getByRole('radio', {name: '업체에 문의'}));
        expect((screen.getByRole('button', {name: '문의 등록'}) as HTMLButtonElement).disabled).toBe(true);

        // 업체 검색 → 고르기
        fireEvent.change(screen.getByRole('searchbox', {name: '업체 이름'}), {target: {value: ' 강남 '}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '검색'}));
        });
        expect(searchStores).toHaveBeenCalledTimes(1);
        expect(searchStores.mock.calls[0][0]).toBeInstanceOf(DiscoveryStoreSearchDto);
        expect(searchStores.mock.calls[0][0]).toEqual({keyword: '강남'});
        expect(screen.getByRole('list', {name: '검색 결과'}).textContent).toContain('서울특별시 강남구 테헤란로 1');
        fireEvent.click(screen.getByRole('button', {name: '고르기'}));
        expect(screen.getByRole('button', {name: '다시 고르기'})).toBeTruthy();

        // 내용 · 동의 → 등록
        pickCategory('결제/환불');
        fillText();
        agree();
        await submit();

        expect(createInquiry).toHaveBeenCalledTimes(1);
        expect(createInquiry.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(createInquiry.mock.calls[0][1]).toBeInstanceOf(InquiryDto);
        expect(JSON.parse(JSON.stringify(createInquiry.mock.calls[0][1]))).toEqual({store_id: STORE_ID, inquiry_category_id: 'PAYMENT', title: '환불은 언제 되나요?', content: '어제 취소한 예약의 환불 날짜가 궁금해요.'});
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith(`/inquiries/${INQUIRY_ID}/`);
        expect(getStoreDetail).not.toHaveBeenCalled();
    });

    it('[SUCCESS] "바로방에 문의"로 등록한다 → 등록(큐) 1번 — store_id 없이', async () => {
        await renderForm();

        expect(screen.getByRole('radio', {name: '바로방에 문의'}).getAttribute('aria-checked')).toBe('true');
        pickCategory('예약');
        fillText();
        agree();
        await submit();

        expect(createInquiry).toHaveBeenCalledTimes(1);
        expect(createInquiry.mock.calls[0][1].store_id).toBeUndefined();
        expect(JSON.parse(JSON.stringify(createInquiry.mock.calls[0][1]))).toEqual({inquiry_category_id: 'RESERVATION', title: '환불은 언제 되나요?', content: '어제 취소한 예약의 환불 날짜가 궁금해요.'});
        expect(searchStores).not.toHaveBeenCalled();
        expect(replace).toHaveBeenCalledWith(`/inquiries/${INQUIRY_ID}/`);
    });

    it('[SUCCESS] 업체 상세의 "이 업체에 문의"로 들어온다 → 업체 상세 1번 → 대상 "업체에 문의" · 그 업체(사진 · 상호명 · 주소)가 골라져 있다', async () => {
        getStoreDetail.mockResolvedValue({store_id: STORE_ID, store_name: '스테이 리프 강남역점', address: '서울특별시 강남구 테헤란로 1', address_detail: '3층', latitude: 37.498, longitude: 127.0276, images: [{image_url: 'https://cdn.deskless.kr/store/a.jpg', sort_order: 0}, {image_url: 'https://cdn.deskless.kr/store/b.jpg', sort_order: 1}]});
        const container = await renderForm(STORE_ID);

        expect(getStoreDetail).toHaveBeenCalledTimes(1);
        expect(getStoreDetail.mock.calls[0][0]).toBe(STORE_ID);
        expect(screen.getByRole('radio', {name: '업체에 문의'}).getAttribute('aria-checked')).toBe('true');
        expect(screen.getByText('스테이 리프 강남역점')).toBeTruthy();
        expect(screen.getByText('서울특별시 강남구 테헤란로 1')).toBeTruthy();
        expect(container.querySelector('img')?.getAttribute('src')).toBe('https://cdn.deskless.kr/store/a.jpg');
        expect(screen.queryByRole('searchbox', {name: '업체 이름'})).toBeNull();
        expect((screen.getByRole('button', {name: '문의 등록'}) as HTMLButtonElement).disabled).toBe(false);
        expect(searchStores).not.toHaveBeenCalled();
    });

    it('[FAIL:consent] 동의에 체크하지 않고 등록한다 → 동의 칸 옆 "개인정보 수집 · 이용에 동의해주세요.", 등록 0번', async () => {
        const container = await renderForm();

        pickCategory('예약');
        fillText();
        await submit();

        expect(alertText(container, 'agree')).toBe('개인정보 수집 · 이용에 동의해주세요.');
        expect(createInquiry).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });

    it('[FAIL:validation] 카테고리를 고르지 않고 등록한다 → 카테고리 칸 옆 "카테고리를 선택해주세요.", 등록 0번', async () => {
        const container = await renderForm();

        fillText();
        agree();
        await submit();

        expect(alertText(container, 'inquiry_category_id')).toBe('카테고리를 선택해주세요.');
        expect(alertText(container, 'agree')).toBe('');
        expect(createInquiry).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    });
});
