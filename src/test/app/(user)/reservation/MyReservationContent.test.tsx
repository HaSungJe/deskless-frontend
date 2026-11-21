import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import MyReservationContent from '@/app/(user)/reservation/MyReservationContent';
import { ReservationListDto, ReservationListItemResultDto } from '@/contracts/reservation/dto/reservation-list.dto';
import RootLayoutProvider from '@/shared/providers/RootLayoutProvider';
import { USER_AUTH } from './reservation-fixtures';

const {getMyReservations} = vi.hoisted(() => ({getMyReservations: vi.fn()}));

vi.mock('@/contracts/reservation/api', () => ({getMyReservations}));

const CONFIRMED_ID = 'a'.repeat(32);
const COMPLETED_ID = 'b'.repeat(32);

/**
 * 목록 항목 — 시간 이용 3시간
 *
 * @param id 예약 ID
 * @param storeName 업체
 * @param state 상태 · 이름
 * @param disabled 호실 사용중지
 */
function item(id: string, storeName: string, state: [string, string], disabled: number): ReservationListItemResultDto {
    return {
        reservation_id: id,
        store_id: 's'.repeat(32),
        store_name: storeName,
        room_id: 'r'.repeat(32),
        room_name: '301호',
        room_group_name: '스탠다드 더블',
        room_plan_type_id: 'HOURLY',
        room_plan_type_name: '시간 이용',
        reservation_state_id: state[0],
        reservation_state_name: state[1],
        start_at: '2026-11-10T05:30:00.000Z',
        end_at: '2026-11-10T08:30:00.000Z',
        total_price: 15000,
        refund_deadline_at: '2026-11-10T04:30:00.000Z',
        is_room_disabled: disabled,
        created_at: '2026-11-09T05:00:00.000Z',
    };
}

beforeEach(() => {
    getMyReservations.mockReset();
});

describe('MyReservationContent', () => {
    it('[SUCCESS] 예약이 있다 → 1쪽 카드(업체 · 상태 · 이용 시간 · 합계), 카드 링크는 예약 1건, 사용중지 호실이면 경고', async () => {
        getMyReservations.mockResolvedValue({
            list: [item(CONFIRMED_ID, '스테이 리프 강남역점', ['CONFIRMED', '예약 확정'], 1), item(COMPLETED_ID, '스테이 리프 홍대점', ['COMPLETED', '이용 완료'], 1)],
            pagination: {all_search_yn: 'N', total_count: 2, page: 1, max_page: 1, page_range: {start: 1, end: 1}, content_start_number: 1, content_start_number_reverse: 2},
        });

        await act(async () => {
            render(
                <RootLayoutProvider rootLayoutLoading={false} auth={USER_AUTH}>
                    <MyReservationContent />
                </RootLayoutProvider>,
            );
        });

        expect(getMyReservations).toHaveBeenCalledTimes(1);
        expect(getMyReservations.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(getMyReservations.mock.calls[0][1]).toBeInstanceOf(ReservationListDto);
        expect(getMyReservations.mock.calls[0][1]).toMatchObject({page: 1, size: 20});
        expect(getMyReservations.mock.calls[0][2]).toBeInstanceOf(AbortSignal);

        const confirmed = screen.getByRole('link', {name: /스테이 리프 강남역점/});
        expect(confirmed.getAttribute('href')).toBe(`/reservation/${CONFIRMED_ID}/`);
        expect(confirmed.textContent).toContain('예약 확정');
        expect(confirmed.textContent).toContain('11월 10일(화) 14:30 ~ 17:30');
        expect(confirmed.textContent).toContain('15,000원');
        expect(screen.getByRole('link', {name: /스테이 리프 홍대점/}).getAttribute('href')).toBe(`/reservation/${COMPLETED_ID}/`);

        // 사용중지 경고는 확정 · 이용 중 예약에만
        expect(screen.getAllByText('예약한 호실이 사용중지되어 전액 환불로 취소할 수 있어요')).toHaveLength(1);
        expect(confirmed.textContent).toContain('예약한 호실이 사용중지되어 전액 환불로 취소할 수 있어요');
    });

    it('[SUCCESS] "취소" 칩을 고른다 → 1쪽부터 상태 거르기(CANCELED) — 없으면 "취소 예약이 없어요", "전체" 로 돌아가면 거르기 없이', async () => {
        getMyReservations.mockResolvedValue({list: [item(CONFIRMED_ID, '스테이 리프 강남역점', ['CONFIRMED', '예약 확정'], 0)], pagination: {all_search_yn: 'N', total_count: 1, page: 1, max_page: 1, page_range: {start: 1, end: 1}, content_start_number: 1, content_start_number_reverse: 1}});
        await act(async () => {
            render(
                <RootLayoutProvider rootLayoutLoading={false} auth={USER_AUTH}>
                    <MyReservationContent />
                </RootLayoutProvider>,
            );
        });
        expect({...getMyReservations.mock.calls[0][1]}).toMatchObject({page: 1, size: 20, reservation_state_id: null});
        expect(within(screen.getByRole('group', {name: '예약 상태'})).getAllByRole('button').map((chip) => chip.textContent)).toEqual(['전체', '결제 대기', '예약 확정', '이용 중', '이용 완료', '취소']);

        getMyReservations.mockResolvedValueOnce({list: [], pagination: null});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '취소'}));
        });

        expect(getMyReservations).toHaveBeenCalledTimes(2);
        expect({...getMyReservations.mock.calls[1][1]}).toMatchObject({page: 1, size: 20, reservation_state_id: 'CANCELED'});
        expect(screen.getByText('취소 예약이 없어요')).toBeTruthy();
        expect(screen.queryByRole('link', {name: '지도에서 찾기'})).toBeNull();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '전체'}));
        });

        expect(getMyReservations).toHaveBeenCalledTimes(3);
        expect({...getMyReservations.mock.calls[2][1]}).toMatchObject({page: 1, reservation_state_id: null});
        expect(screen.getByRole('button', {name: '전체'}).getAttribute('aria-pressed')).toBe('true');
    });
});
