/**
 * 추가정보 필터 항목 — 체크박스 1개
 */
export class DiscoveryDetailFilterItemResultDto {
    // 항목 키 — 업체 검색 detail_filter 에 쉼표로 넣는다 (예: has_pc · has_hot_spring)
    key: string;

    // 체크박스 이름 (예: PC · 온천)
    name: string;

    // 묶음 (ROOM_GROUP: 객실 — 조건을 갖춘 객실 그룹이 있는 업체, STORE: 업체 편의시설)
    group: string;
}

/**
 * 추가정보 필터 항목 목록 — 객실 항목 다음 업체 편의시설 항목, 보일 순서
 */
export class DiscoveryDetailFilterListResultDto {
    // 필터 항목 (보일 순서 — 객실 다음 업체)
    list: DiscoveryDetailFilterItemResultDto[];
}
