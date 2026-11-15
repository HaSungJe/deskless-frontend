/** 지도 위 한 지점 — WGS84 */
export type MapPointType = {
    latitude: number;  // 위도
    longitude: number; // 경도
};

/** 지도 마커 — 업체 한 곳 */
export type MapMarkerType = MapPointType & {
    id: string;    // 업체 ID — 누르면 onMarkerClick(id)
    title: string; // 업체 이름 — 마우스를 올리면 보인다
};
