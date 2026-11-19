import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import StoreHoursTab from '@/app/manager/(console)/store/_components/StoreHoursTab';
import { renderWithManager, storeMine } from '../store-fixture';

const {updateMyStoreHours, updateMyStoreBreaks} = vi.hoisted(() => ({updateMyStoreHours: vi.fn(), updateMyStoreBreaks: vi.fn()}));

vi.mock('@/contracts/store/api', () => ({updateMyStoreHours, updateMyStoreBreaks}));

const onSaved = vi.fn();

beforeEach(() => {
    updateMyStoreHours.mockReset().mockResolvedValue(null);
    updateMyStoreBreaks.mockReset().mockResolvedValue(null);
    onSaved.mockReset().mockResolvedValue(undefined);
});

describe('StoreHoursTab', () => {
    it('[SUCCESS] 요일별 영업시간을 고쳐 저장한다 → 영업시간 저장(큐) 1번(24시간 아님 · 일 ~ 토 7개, 휴무 요일은 시각 없이) → 다시 읽기', async () => {
        renderWithManager(<StoreHoursTab store={storeMine()} onSaved={onSaved} />);

        fireEvent.change(screen.getByLabelText('금요일 닫는 시각'), {target: {value: '02:00'}});
        expect(screen.getByText('다음 날 02:00까지')).toBeTruthy();
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '영업시간 저장'}));
        });

        expect(updateMyStoreHours).toHaveBeenCalledTimes(1);
        expect(updateMyStoreHours.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        const dto = updateMyStoreHours.mock.calls[0][1];
        expect(dto.is_always_open).toBe(0);
        expect(dto.hours.map((hour: object) => ({...hour}))).toEqual([
            {day_of_week: 0, is_closed: 0, open_time: '10:00', close_time: '23:00'},
            {day_of_week: 1, is_closed: 1},
            {day_of_week: 2, is_closed: 0, open_time: '10:00', close_time: '23:00'},
            {day_of_week: 3, is_closed: 0, open_time: '10:00', close_time: '23:00'},
            {day_of_week: 4, is_closed: 0, open_time: '10:00', close_time: '23:00'},
            {day_of_week: 5, is_closed: 0, open_time: '10:00', close_time: '02:00'},
            {day_of_week: 6, is_closed: 0, open_time: '10:00', close_time: '23:00'},
        ]);
        expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it('[FAIL:validation] 휴무가 아닌 요일의 닫는 시각을 비운다 → 그 요일 칸 아래 "휴무가 아니면 영업 마감 시각을 입력해주세요.", 저장 0번', async () => {
        const container = renderWithManager(<StoreHoursTab store={storeMine()} onSaved={onSaved} />);

        fireEvent.change(screen.getByLabelText('수요일 닫는 시각'), {target: {value: ''}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '영업시간 저장'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="hours.3.close_time"]') as HTMLElement).innerText).toBe('휴무가 아니면 영업 마감 시각을 입력해주세요.');
        expect(updateMyStoreHours).not.toHaveBeenCalled();
        expect(onSaved).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 브레이크를 하나 더해 저장한다 → 브레이크 저장(큐) 1번(줄 전부) → 다시 읽기', async () => {
        renderWithManager(<StoreHoursTab store={storeMine()} onSaved={onSaved} />);

        fireEvent.click(screen.getByRole('button', {name: '브레이크 추가'}));
        fireEvent.change(screen.getByLabelText('브레이크 2 시작 시각'), {target: {value: '23:00'}});
        fireEvent.change(screen.getByLabelText('브레이크 2 마감 시각'), {target: {value: '01:00'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '브레이크 저장'}));
        });

        expect(updateMyStoreBreaks).toHaveBeenCalledTimes(1);
        expect(updateMyStoreBreaks.mock.calls[0][1].breaks.map((item: object) => ({...item}))).toEqual([
            {start_time: '12:00', end_time: '13:00'},
            {start_time: '23:00', end_time: '01:00'},
        ]);
        expect(updateMyStoreHours).not.toHaveBeenCalled();
        expect(onSaved).toHaveBeenCalledTimes(1);
    });
});
