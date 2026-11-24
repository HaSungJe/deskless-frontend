// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { groupDetailFilters, searchFilterLabel } from '@/app/(user)/_components/search-filter';
import { DiscoveryDetailFilterItemResultDto } from '@/contracts/discovery/dto/discovery-detail-filter.dto';

/** 객실 항목 4개 — 받은 순서 */
const ROOM_ITEMS: Array<DiscoveryDetailFilterItemResultDto> = [
    {key: 'room_count', name: '방 2개 이상', group: 'ROOM_GROUP'},
    {key: 'has_shower', name: '샤워실', group: 'ROOM_GROUP'},
    {key: 'has_tv', name: 'TV', group: 'ROOM_GROUP'},
    {key: 'has_pc', name: 'PC', group: 'ROOM_GROUP'},
];

/** 편의시설 항목 7개 — 받은 순서 */
const STORE_ITEMS: Array<DiscoveryDetailFilterItemResultDto> = [
    {key: 'has_convenience_store', name: '편의점', group: 'STORE'},
    {key: 'has_cafe', name: '카페', group: 'STORE'},
    {key: 'has_hot_spring', name: '온천', group: 'STORE'},
    {key: 'is_pet_allowed', name: '반려동물 동반', group: 'STORE'},
    {key: 'has_meal', name: '식사 제공', group: 'STORE'},
    {key: 'is_delivery_allowed', name: '배달 음식', group: 'STORE'},
    {key: 'has_parking', name: '주차', group: 'STORE'},
];

describe('searchFilterLabel — 검색필터 버튼 글자', () => {
    it('[SUCCESS] 거리만 정해 두면 거리만 붙는다', () => {
        expect(searchFilterLabel(20, 0)).toBe('검색필터 · 20km 이내');
    });

    it('[SUCCESS] 거리 제한이 없으면 고른 수만 붙는다', () => {
        expect(searchFilterLabel('ALL', 3)).toBe('검색필터 · 편의시설 3개');
    });

    it('[SUCCESS] 객실 항목도 편의시설 수에 합쳐 센다', () => {
        // 객실 1개(PC) + 편의시설 2개(온천 · 주차) = 체크 3개
        expect(searchFilterLabel(20, ['has_pc', 'has_hot_spring', 'has_parking'].length)).toBe('검색필터 · 20km 이내 · 편의시설 3개');
    });

    it('[SUCCESS] 거리 제한도 체크도 없으면 이름만 보인다', () => {
        expect(searchFilterLabel('ALL', 0)).toBe('검색필터');
    });
});

describe('groupDetailFilters — 필터 항목 묶음 나누기', () => {
    it('[SUCCESS] 객실과 편의시설 항목이 함께 오면 두 묶음으로 나뉜다', () => {
        const groups = groupDetailFilters([...ROOM_ITEMS, ...STORE_ITEMS]);

        expect(groups.map((group) => group.name)).toEqual(['객실', '편의시설']);
        expect(groups[0].items).toEqual(ROOM_ITEMS);
        expect(groups[1].items).toEqual(STORE_ITEMS);
    });

    it('[SUCCESS] 한 묶음만 오면 그 묶음 하나만 보인다', () => {
        const groups = groupDetailFilters(ROOM_ITEMS);

        expect(groups).toHaveLength(1);
        expect(groups[0]).toEqual({group: 'ROOM_GROUP', name: '객실', items: ROOM_ITEMS});
    });

    it('[SUCCESS] 처음 보는 묶음의 항목은 맨 뒤 기타에 모인다', () => {
        const unknown: DiscoveryDetailFilterItemResultDto = {key: 'has_sauna', name: '사우나', group: 'SPA'};
        const groups = groupDetailFilters([unknown, ROOM_ITEMS[0]]);

        expect(groups.map((group) => group.name)).toEqual(['객실', '기타']);
        expect(groups[0].items).toEqual([ROOM_ITEMS[0]]);
        expect(groups[1].items).toEqual([unknown]);
    });
});
