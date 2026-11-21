import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import StoreDetailContent from '@/app/(user)/stores/[store_id]/StoreDetailContent';
import { DiscoveryRoomGroupListResultDto } from '@/contracts/discovery/dto/discovery-room-group-list.dto';
import { DiscoveryStoreDetailResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import { ApiError } from '@/shared/api/request';

const {getStoreDetail, getStoreRoomGroups, replace, showErrorPopup} = vi.hoisted(() => ({
    getStoreDetail: vi.fn(),
    getStoreRoomGroups: vi.fn(),
    replace: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/discovery/api', () => ({getStoreDetail, getStoreRoomGroups}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));
vi.mock('@/shared/components/map/StoreMap', () => ({default: () => <div data-testid="store-map" />}));
vi.mock('@/app/(user)/stores/[store_id]/_components/StoreImageSlider', () => ({default: () => <div data-testid="store-images" />}));

const STORE_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
const GROUP_ID = 'f0e1d2c3b4a5968778695a4b3c2d1e0f';

/** 업체 상세 — 24시간 · 영업중 · 시간 이용 하나 */
const DETAIL: DiscoveryStoreDetailResultDto = {
    store_id: STORE_ID,
    store_name: '스테이 리프 강남역점',
    phone: '02-1234-5678',
    address: '서울특별시 강남구 역삼로12길 34',
    address_detail: '3층',
    latitude: 37.501,
    longitude: 127.031,
    introduction: '강남역 3번 출구 도보 5분',
    is_open: 1,
    is_always_open: 1,
    booking_open_hours: 72,
    refund_deadline_minutes: 60,
    late_refund_percent: 50,
    images: [],
    hours: [],
    breaks: [{start_time: '11:00', end_time: '12:00'}],
    plans: [{room_plan_type_id: 'HOURLY', room_plan_type_name: '시간 이용', days_of_week: 127, usage_hours: 3, check_in_time: null, check_out_time: null, min_nights: null, max_nights: null, is_extendable: 1, max_extensions: 2}],
};

/** 객실 그룹 하나 — 1박 기간 가격 */
const GROUPS: DiscoveryRoomGroupListResultDto = {
    list: [{
        room_group_id: GROUP_ID,
        room_group_name: '스탠다드 더블',
        description: '더블 침대 1개',
        room_group_detail: {room_count: 1, has_shower: 1, has_tv: 1, has_pc: 0},
        room_count: 6,
        images: [],
        plans: [{room_plan_type_id: 'NIGHT', room_plan_type_name: '1박', price: 59000, period_prices: [{start_date: '2026-12-24', end_date: '2026-12-25', price: 79000, memo: '성탄 연휴'}]}],
    }],
};

/**
 * 그리고 두 조회가 끝나기를 기다린다
 */
async function renderDetail(): Promise<void> {
    await act(async () => {
        render(<StoreDetailContent storeId={STORE_ID} />);
    });
}

beforeEach(() => {
    getStoreDetail.mockReset();
    getStoreRoomGroups.mockReset();
    replace.mockClear();
    showErrorPopup.mockClear();
});

describe('StoreDetailContent', () => {
    it('[SUCCESS] 상세 · 객실 그룹을 한 번씩 → 이름 · 24시간 · 판매 상품 · 규정 · 그룹 카드(기간 가격 · 예약 링크)', async () => {
        getStoreDetail.mockResolvedValue(DETAIL);
        getStoreRoomGroups.mockResolvedValue(GROUPS);

        await renderDetail();

        expect(getStoreDetail).toHaveBeenCalledTimes(1);
        expect(getStoreDetail.mock.calls[0][0]).toBe(STORE_ID);
        expect(getStoreDetail.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
        expect(getStoreRoomGroups).toHaveBeenCalledTimes(1);
        expect(getStoreRoomGroups.mock.calls[0][0]).toBe(STORE_ID);

        expect(screen.getByRole('heading', {name: '스테이 리프 강남역점'})).toBeTruthy();
        expect(screen.getByText('서울특별시 강남구 역삼로12길 34, 3층')).toBeTruthy();
        expect(screen.getByRole('link', {name: /02-1234-5678/}).getAttribute('href')).toBe('tel:02-1234-5678');
        expect(screen.getByText('24시간 연중무휴')).toBeTruthy();
        expect(screen.getByText('매일 11:00 ~ 12:00')).toBeTruthy();
        expect(screen.getByText('이용 3시간 · 매일 · 연장 최대 2회')).toBeTruthy();
        expect(screen.getByText('이용 시작 1시간 전까지 취소하면 전액, 그 뒤 시작 전까지는 50% 환불해요.')).toBeTruthy();

        const group = screen.getByRole('link', {name: /스탠다드 더블/});
        expect(group.getAttribute('href')).toBe(`/stores/${STORE_ID}/booking/?room_group_id=${GROUP_ID}`);
        expect(screen.getByText('예약 받는 호실 6개')).toBeTruthy();
        expect(screen.getByText('샤워실')).toBeTruthy();
        expect(screen.getByText('59,000원')).toBeTruthy();
        expect(screen.getByText('기간 가격 · 12월 24일 ~ 12월 25일 1박 79,000원 (성탄 연휴)')).toBeTruthy();
        expect(screen.getByRole('link', {name: '예약하기'}).getAttribute('href')).toBe(`/stores/${STORE_ID}/booking/`);
        expect(showErrorPopup).not.toHaveBeenCalled();
    });

    it('[FAIL:not-found] 상세가 404 면 안내 뒤 첫 화면으로', async () => {
        getStoreDetail.mockRejectedValue(new ApiError(404, {message: '업체를 찾을 수 없습니다.', validation_errors: null}));
        getStoreRoomGroups.mockResolvedValue(GROUPS);

        await renderDetail();

        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('업체를 찾을 수 없습니다.');
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith('/');
        expect(screen.queryByRole('link', {name: '예약하기'})).toBeNull();
    });

    it('[FAIL:empty-body] 상세 본문이 비면 없는 업체로 — 안내 뒤 첫 화면', async () => {
        getStoreDetail.mockResolvedValue(null);
        getStoreRoomGroups.mockResolvedValue(GROUPS);

        await renderDetail();

        expect(showErrorPopup).toHaveBeenCalledWith('업체를 찾을 수 없습니다.');
        expect(replace).toHaveBeenCalledWith('/');
    });

    it('[FAIL:groups] 객실 그룹만 실패하면 업체 정보는 그리고 안내만 — 첫 화면으로 보내지 않는다', async () => {
        getStoreDetail.mockResolvedValue(DETAIL);
        getStoreRoomGroups.mockRejectedValue(new ApiError(500, {message: '잠시 뒤 다시 시도해 주세요.', validation_errors: null}));

        await renderDetail();

        expect(screen.getByRole('heading', {name: '스테이 리프 강남역점'})).toBeTruthy();
        expect(screen.getByText('예약할 수 있는 객실이 아직 없어요.')).toBeTruthy();
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('잠시 뒤 다시 시도해 주세요.');
        expect(replace).not.toHaveBeenCalled();
    });

    it('[FAIL:closed] 지금 영업하지 않으면 예약하기를 막고 객실 그룹 카드도 예약 링크 없이', async () => {
        getStoreDetail.mockResolvedValue({...DETAIL, is_open: 0});
        getStoreRoomGroups.mockResolvedValue(GROUPS);

        await renderDetail();

        expect(screen.getByText('지금 영업 안 함')).toBeTruthy();
        expect((screen.getByRole('button', {name: '지금은 예약할 수 없어요'}) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.queryByRole('link', {name: '예약하기'})).toBeNull();
        expect(screen.getByText('스탠다드 더블')).toBeTruthy();
        expect(screen.queryByRole('link', {name: /스탠다드 더블/})).toBeNull();
    });
});
