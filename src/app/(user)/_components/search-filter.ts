import { DiscoveryDetailFilterItemResultDto } from '@/contracts/discovery/dto/discovery-detail-filter.dto';

/** 거리(km) — DiscoveryStoreListDto.radius_km 의 값, ALL 은 거리 제한 없음(가까운 순 300곳 — frontend/changes/2026-11-22-discovery-filter.md) */
export const RADIUS_OPTIONS = [5, 10, 20, 50, 'ALL'] as const;

/** 거리 하나 */
export type RadiusType = typeof RADIUS_OPTIONS[number];

/** 처음 거리 — 사용자 결정 2026-11-16 · 검색필터 "초기화"도 이 값(사용자 결정 2026-11-24) */
export const DEFAULT_RADIUS: RadiusType = 20;

/** 검색필터 이름 — 지도 위 버튼 · 팝업 제목 */
export const SEARCH_FILTER_NAME = '검색필터';

/** 체크 항목 묶음 — 묶음 값 · 제목 · 항목(받은 순서) */
export type DetailFilterGroupType = {
    group: string;                                    // 묶음 값(ROOM_GROUP · STORE · 처음 보는 묶음은 ETC)
    name: string;                                     // 묶음 제목
    items: Array<DiscoveryDetailFilterItemResultDto>; // 항목(받은 순서)
};

/** 아는 묶음의 제목 — Map 이라 상속 이름에 속지 않는다 */
const GROUP_NAMES = new Map<string, string>([['ROOM_GROUP', '객실'], ['STORE', '편의시설']]);

/** 처음 보는 묶음 — 맨 뒤에 모은다(백엔드가 묶음을 더해도 항목이 사라지지 않게) */
const OTHER_GROUP: Omit<DetailFilterGroupType, 'items'> = {group: 'ETC', name: '기타'};

/**
 * 거리 칩 글자 — 5km · … · 제한 없음
 *
 * @param option 거리
 */
export function radiusLabel(option: RadiusType): string {
    return option === 'ALL' ? '제한 없음' : `${option}km`;
}

/**
 * 검색필터 버튼 글자 — 거리를 정해 두면 "N km 이내", 체크한 것이 있으면 "편의시설 N개"(객실 항목도 합쳐 센다 — 사용자 결정 2026-11-24), 둘 다 없으면 "검색필터"
 *
 * @param radiusKm 적용 중인 거리
 * @param checkedCount 적용 중인 체크 수
 */
export function searchFilterLabel(radiusKm: RadiusType, checkedCount: number): string {
    const parts = [radiusKm === 'ALL' ? '' : `${radiusKm}km 이내`, checkedCount > 0 ? `편의시설 ${checkedCount}개` : ''].filter(Boolean);
    return [SEARCH_FILTER_NAME, ...parts].join(' · ');
}

/**
 * 체크 항목을 묶음으로 — 아는 묶음은 처음 나온 순서대로, 처음 보는 묶음의 항목은 맨 뒤 "기타", 빈 묶음은 없다
 *
 * @param items 받은 체크 항목(보일 순서)
 */
export function groupDetailFilters(items: Array<DiscoveryDetailFilterItemResultDto>): Array<DetailFilterGroupType> {
    const known: Array<DetailFilterGroupType> = [];
    const others: Array<DiscoveryDetailFilterItemResultDto> = [];
    for (const item of items) {
        const name = GROUP_NAMES.get(item.group);
        if (name === undefined) {
            others.push(item);
            continue;
        }

        const found = known.find((group) => group.group === item.group);
        if (found) {
            found.items.push(item);
        } else {
            known.push({group: item.group, name, items: [item]});
        }
    }

    return others.length > 0 ? [...known, {...OTHER_GROUP, items: others}] : known;
}
