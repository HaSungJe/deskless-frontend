import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import BookingContent from '@/app/(user)/stores/[store_id]/booking/BookingContent';
import { DiscoveryStoreDetailResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import { ReservationAvailabilityDto, ReservationAvailabilityResultDto } from '@/contracts/reservation/dto/reservation-availability.dto';
import { ReservationResultDto } from '@/contracts/reservation/dto/reservation.dto';
import { ApiError } from '@/shared/api/request';
import { TossPaymentType } from '@/shared/components/payment/TossPaymentWidget';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {getStoreDetail, getAvailability, createReservation, push, replace, showErrorPopup, widgetProps} = vi.hoisted(() => ({
    getStoreDetail: vi.fn(),
    getAvailability: vi.fn(),
    createReservation: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    showErrorPopup: vi.fn(),
    widgetProps: vi.fn(),
}));

vi.mock('next/navigation', () => ({useRouter: () => ({push, replace})}));
vi.mock('@/contracts/discovery/api', () => ({getStoreDetail}));
vi.mock('@/contracts/reservation/api', () => ({getAvailability, createReservation}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));
vi.mock('@/shared/components/payment/TossPaymentWidget', () => ({
    default: (props: {payment: TossPaymentType; returnUrl?: string | null}) => {
        widgetProps(props);
        return <div data-testid="toss-widget" />;
    },
}));
vi.mock('@/app/(user)/stores/[store_id]/booking/_components/RoomGroupCarousel', () => ({
    default: ({groups}: {groups: Array<{room_group_name: string}>}) => <div>{groups.map((item) => item.room_group_name).join(', ')}</div>,
}));

const STORE_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
const GROUP_ID = 'f0e1d2c3b4a5968778695a4b3c2d1e0f';
const ROOM_ID = '0123456789abcdef0123456789abcdef';

/** 오늘 — 11월 10일(화) 한국 14:00 */
const NOW = '2026-11-10T05:00:00.000Z';

/** 업체 — 시간 이용(매일 · 3시간)만, 72시간 앞까지 예약 */
const DETAIL = {
    store_id: STORE_ID,
    store_name: '스테이 리프 강남역점',
    booking_open_hours: 72,
    plans: [{room_plan_type_id: 'HOURLY', room_plan_type_name: '시간 이용', days_of_week: 127, usage_hours: 3, check_in_time: null, check_out_time: null, min_nights: null, max_nights: null, is_extendable: 1, max_extensions: 2}],
} as unknown as DiscoveryStoreDetailResultDto;

/** 예약 가능 시간 — 그룹 하나 · 14:30 시간대 · 301호 */
const AVAILABILITY: ReservationAvailabilityResultDto = {
    room_plan_type_id: 'HOURLY',
    date: '2026-11-10',
    nights: null,
    list: [{
        room_group_id: GROUP_ID,
        room_group_name: '스탠다드 더블',
        price: 15000,
        slots: [{start_at: '2026-11-10T05:30:00.000Z', end_at: '2026-11-10T08:30:00.000Z', is_now: 0, rooms: [{room_id: ROOM_ID, room_name: '301호', floor: 3}]}],
    }],
};

/** 예약 생성 done — 결제 정보 */
const RESERVATION: ReservationResultDto = {
    reservation_id: 'r'.repeat(32),
    payment_id: 'p'.repeat(32),
    order_name: '스테이 리프 강남역점 301호',
    amount: 15000,
    expires_at: '2026-11-10T05:05:00.000Z',
    start_at: '2026-11-10T05:30:00.000Z',
    end_at: '2026-11-10T08:30:00.000Z',
};

/** 로그인한 이용자 */
const AUTH: AuthContextType = {area: 'user', token: 'user-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/**
 * 예약 화면을 그리고 업체 · 예약 가능 시간 조회를 기다린다
 */
async function renderBooking(): Promise<void> {
    await act(async () => {
        render(
            <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                <BookingContent storeId={STORE_ID} roomGroupId={null} />
            </RootLayoutProvider>,
        );
    });
}

/**
 * 14:30 시간대 · 301호를 고르고 예약하기
 */
async function chooseAndSubmit(): Promise<void> {
    fireEvent.click(screen.getByRole('button', {name: /^14:30/}));
    fireEvent.click(screen.getByRole('button', {name: /301호/}));
    await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: '예약하기'}));
    });
}

beforeEach(() => {
    vi.useFakeTimers({now: new Date(NOW), toFake: ['Date']});
    getStoreDetail.mockReset().mockResolvedValue(DETAIL);
    getAvailability.mockReset().mockResolvedValue(AVAILABILITY);
    createReservation.mockReset();
    push.mockClear();
    replace.mockClear();
    showErrorPopup.mockClear();
    widgetProps.mockClear();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('BookingContent', () => {
    it('[SUCCESS] 상품 · 날짜 · 시간대 · 호수를 골라 예약한다 → 예약(큐) 1번 → 결제 대기, 결제위젯에 결제 정보와 돌아올 곳(그 예약 1건)', async () => {
        createReservation.mockResolvedValue(RESERVATION);

        await renderBooking();

        expect(getStoreDetail).toHaveBeenCalledTimes(1);
        expect(getStoreDetail.mock.calls[0][0]).toBe(STORE_ID);
        expect(getAvailability).toHaveBeenCalledTimes(1);
        const query = getAvailability.mock.calls[0][0] as ReservationAvailabilityDto;
        expect({...query}).toEqual({store_id: STORE_ID, date: '2026-11-10', room_plan_type_id: 'HOURLY', nights: null, room_group_id: null});

        await chooseAndSubmit();

        expect(createReservation).toHaveBeenCalledTimes(1);
        expect(createReservation.mock.calls[0][0]).toMatchObject({token: 'user-token', isLogin: true});
        expect({...createReservation.mock.calls[0][1]}).toEqual({room_id: ROOM_ID, room_plan_type_id: 'HOURLY', date: '2026-11-10', start_time: '14:30'});
        expect(screen.getByTestId('toss-widget')).toBeTruthy();
        expect(widgetProps).toHaveBeenLastCalledWith(expect.objectContaining({payment: RESERVATION, returnUrl: `/reservation/${RESERVATION.reservation_id}/`}));
        expect(showErrorPopup).not.toHaveBeenCalled();
        expect(push).not.toHaveBeenCalled();
    });

    it('[FAIL:conflict] 그 사이 다른 사람이 같은 시간대를 잡았다 → 실패 사유 팝업 → 빈 시간을 다시 불러온다', async () => {
        createReservation.mockRejectedValue(new ApiError(400, {message: '이미 예약된 시간입니다.', validation_errors: null}));

        await renderBooking();
        await chooseAndSubmit();

        expect(createReservation).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('이미 예약된 시간입니다.');
        expect(getAvailability).toHaveBeenCalledTimes(2);
        expect(screen.queryByTestId('toss-widget')).toBeNull();
        expect(widgetProps).not.toHaveBeenCalled();
    });

    it('[FAIL:same-date] 이미 고른 날짜를 다시 눌러도 시간대가 그대로 남고 다시 부르지 않는다(리뷰 P7-1)', async () => {
        await renderBooking();

        fireEvent.click(screen.getByRole('button', {name: '11월 10일(화)'}));

        expect(getAvailability).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', {name: /^14:30/})).toBeTruthy();
        expect(screen.queryByText('예약할 수 있는 시간을 불러오고 있어요.')).toBeNull();
    });

    it('[FAIL:busy] 예약 요청 중에 다른 호수를 눌러도 결제 화면은 누른 때의 호실로 그린다(리뷰 P7-2)', async () => {
        const slot = AVAILABILITY.list[0].slots[0];
        getAvailability.mockResolvedValue({...AVAILABILITY, list: [{...AVAILABILITY.list[0], slots: [{...slot, rooms: [...slot.rooms, {room_id: 'f'.repeat(32), room_name: '302호', floor: 3}]}]}]});
        let resolveReservation: (value: ReservationResultDto) => void = () => undefined;
        createReservation.mockReturnValue(new Promise<ReservationResultDto>((resolve) => {
            resolveReservation = resolve;
        }));

        await renderBooking();
        await chooseAndSubmit();
        fireEvent.click(screen.getByRole('button', {name: /302호/}));
        await act(async () => {
            resolveReservation(RESERVATION);
        });

        expect(createReservation).toHaveBeenCalledTimes(1);
        expect(createReservation.mock.calls[0][1]).toMatchObject({room_id: ROOM_ID});
        expect(screen.getByTestId('toss-widget')).toBeTruthy();
        expect(screen.getByText('스탠다드 더블 · 301호')).toBeTruthy();
        expect(screen.queryByText('스탠다드 더블 · 302호')).toBeNull();
    });
});
