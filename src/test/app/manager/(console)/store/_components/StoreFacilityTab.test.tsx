import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import StoreFacilityTab from '@/app/manager/(console)/store/_components/StoreFacilityTab';
import { StoreMineDetailDto } from '@/contracts/store/dto/store-mine-detail.dto';
import { renderWithManager, storeMine } from '../store-fixture';

const {updateMyStoreFacility} = vi.hoisted(() => ({updateMyStoreFacility: vi.fn()}));

vi.mock('@/contracts/store/api', () => ({updateMyStoreFacility}));

const onSaved = vi.fn();

beforeEach(() => {
    updateMyStoreFacility.mockReset().mockResolvedValue(null);
    onSaved.mockReset().mockResolvedValue(undefined);
});

describe('StoreFacilityTab', () => {
    it('[SUCCESS] 편의점만 켜진 업체에서 온천을 켜고 저장한다 → 편의시설 설정(큐) 1번 — 7개 모두(편의점 1 · 온천 1 · 나머지 0) → 내 업체 다시 읽기 1번', async () => {
        const store = storeMine();
        renderWithManager(<StoreFacilityTab store={{...store, store_detail: {...store.store_detail, has_convenience_store: 1}}} onSaved={onSaved} />);

        // 처음 값 — 정한 순서 · 편의점만 켜짐
        const switches = within(screen.getByRole('group', {name: '편의시설'})).getAllByRole('switch');
        expect(switches.map((item) => item.closest('label')?.textContent)).toEqual(['편의점', '카페', '온천', '반려동물 동반', '식사 제공', '배달 음식', '주차']);
        expect(switches.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false', 'false', 'false', 'false', 'false']);

        fireEvent.click(screen.getByRole('switch', {name: '온천'}));
        expect(updateMyStoreFacility).not.toHaveBeenCalled();
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '저장'}));
        });

        expect(updateMyStoreFacility).toHaveBeenCalledTimes(1);
        expect(updateMyStoreFacility.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(updateMyStoreFacility.mock.calls[0][1]).toBeInstanceOf(StoreMineDetailDto);
        expect({...updateMyStoreFacility.mock.calls[0][1]}).toEqual({has_convenience_store: 1, has_cafe: 0, has_hot_spring: 1, is_pet_allowed: 0, has_meal: 0, is_delivery_allowed: 0, has_parking: 0});
        expect(onSaved).toHaveBeenCalledTimes(1);
    });
});
