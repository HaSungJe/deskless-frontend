// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { storeFacilityLabels, StoreFacilityValuesType } from '@/contracts/common/store.constants';

/** 편의시설 모두 없음 */
const NONE: StoreFacilityValuesType = {has_convenience_store: 0, has_cafe: 0, has_hot_spring: 0, is_pet_allowed: 0, has_meal: 0, is_delivery_allowed: 0, has_parking: 0};

describe('storeFacilityLabels — 편의시설 이름 목록', () => {
    it('[SUCCESS] 켜진 것만 정한 순서로 나온다', () => {
        expect(storeFacilityLabels({...NONE, has_parking: 1, has_convenience_store: 1})).toEqual(['편의점', '주차']);
    });

    it('[SUCCESS] 하나도 없으면 빈 목록이다', () => {
        expect(storeFacilityLabels(NONE)).toEqual([]);
    });
});
