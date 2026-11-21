# Plan — 업체 둘러보기 (Phase 6)

## Feature Summary
- **Feature**: 이용자 업체 둘러보기 — U1 지도 · 반경 · 주변 업체 목록, U2 업체 상세(사진 · 영업시간 · 판매 상품 · 규정 · 객실 그룹)
- **Entry point**: `PAGE · MODULE / (HomeContent) · /stores/[store_id] (StoreDetailContent) · GET discovery/store · GET discovery/store/:store_id · GET discovery/store/:store_id/room-group`
- **Domain**: discovery (spec: `.beaver/output/spec/discovery/store-discovery-spec.md` · 로드맵 Phase 6 — #19 · #20)

---

## File List

| File | Action |
|------|------|
| `package.json` · `package-lock.json` | modified — build 때 `npm install swiper@14.4.0`(사진 넘기기 — 사용자 결정) |
| `src/contracts/discovery/dto/discovery-store-list.dto.ts` · `discovery-store-detail.dto.ts` · `discovery-room-group-list.dto.ts` | new — 지침서 사본(`copy-dto.js` 로 그대로) |
| `src/contracts/discovery/api.ts` | new — `getNearbyStores` · `getStoreDetail` · `getStoreRoomGroups` |
| `src/shared/types/map.ts` | modified — `MapMarkerType.label` · `muted` |
| `src/shared/components/map/StoreMap.tsx` | modified — 핀 오버레이(기본 마커 대신) · 반경 원(`radiusKm`) · 내 위치 점 + 버튼(`myLocation`) · `locked` |
| `src/shared/css/map/StoreMap.module.css` | modified — 핀 · 이름표 · 회색 · 내 위치 점 · 버튼 · 모서리 변수 |
| `src/shared/utils/format.ts` | modified — `formatDays` 3일 이상 이어지면 범위 |
| `src/app/(user)/HomeContent.tsx` | rewritten — U1 지도 · 반경 · 목록(머리는 그대로) |
| `src/app/(user)/distance.ts` | new — `formatDistance` |
| `src/app/(user)/stores/[store_id]/page.tsx` · `StoreDetailContent.tsx` · `store-detail-format.ts` | new — U2 · 안내 문장 계산 함수 |
| `src/app/(user)/stores/[store_id]/_components/StoreImageSlider.tsx` | new — swiper 사진 넘기기 + 현재 / 전체 |
| `src/app/css/user/HomeContent.module.css` | rewritten — 지도 자리 · 반경 · 목록 카드(`.placeholder` 삭제) |
| `src/app/css/user/StoreDetailContent.module.css` · `StoreImageSlider.module.css` | new |
| `src/test/shared/utils/format.test.ts` · `src/test/app/(user)/distance.test.ts` · `src/test/app/(user)/stores/[store_id]/store-detail-format.test.ts` | new — TDD |
| `src/test/app/(user)/HomeContent.test.tsx` · `src/test/app/(user)/stores/[store_id]/StoreDetailContent.test.tsx` | new — 화면 |
| `AGENTS.md` · `docs/data-layer.md` · `docs/integrations.md` | modified — `formatDays` 범위 · `StoreMap` 새 속성 |
| `src/app/dev/infra/InfraPreviewContent.tsx` | 그대로 — `StoreMap` 새 속성은 모두 선택(핀 모양만 바뀜) |

---

## Design

> ship 리뷰(`.beaver/output/review/main-review-261117.md`)에서 고친 곳 — `HomeContent.search`(try 안 값 갈래 · 중심 ref · 거름 0.0001°), `StoreMap` 핀(내용 키 · span · 탭 순서), `StoreDetailContent`(`allSettled` · 효과 이벤트 · 영업 안 함 카드), `StoreImageSlider`(Keyboard · A11y) — 아래 코드보다 실제 코드가 기준.

### 계약 — DTO 사본 · contracts 함수 (#19 · #20)

DTO 3개는 `copy-dto.js` 로 `frontend/dto/discovery.md` 블록을 그대로 옮긴다(Phase 3 · 5 와 같은 방식 — 파일 이름 유지). 함수는 형제 `refreshUserToken`(`src/contracts/user/api.ts`)처럼 `request` 를 부르기만 — 공개 API 라 토큰 없음, 취소 신호를 넘긴다(`src/shared/api/request.ts:165`).

```bash
node <scratchpad>/copy-dto.js . discovery/discovery-store-list.dto.ts discovery/discovery-store-detail.dto.ts discovery/discovery-room-group-list.dto.ts
```

```ts
// src/contracts/discovery/api.ts
import { request } from '@/shared/api/request';
import { DiscoveryRoomGroupListResultDto } from './dto/discovery-room-group-list.dto';
import { DiscoveryStoreDetailResultDto } from './dto/discovery-store-detail.dto';
import { DiscoveryStoreListDto, DiscoveryStoreListResultDto } from './dto/discovery-store-list.dto';

/**
 * 반경 업체 조회 — 동기 · 공개 (GET /user-service/discovery/store)
 *
 * @param query 중심 위경도 · 반경(문자열)
 * @param signal 다음 조회를 시작하거나 화면을 떠날 때 취소
 */
export function getNearbyStores(query: DiscoveryStoreListDto, signal?: AbortSignal): Promise<DiscoveryStoreListResultDto | null> {
    return request<DiscoveryStoreListResultDto>({
        path: '/user-service/discovery/store',
        query: {latitude: query.latitude, longitude: query.longitude, radius_km: query.radius_km},
        signal,
    });
}

/**
 * 업체 상세 — 동기 · 공개 (GET /user-service/discovery/store/:store_id)
 *
 * @param store_id 업체 ID(주소에서 — 경로에 넣을 때 encode)
 * @param signal 화면을 떠날 때 취소
 */
export function getStoreDetail(store_id: string, signal?: AbortSignal): Promise<DiscoveryStoreDetailResultDto | null> {
    return request<DiscoveryStoreDetailResultDto>({path: `/user-service/discovery/store/${encodeURIComponent(store_id)}`, signal});
}

/**
 * 업체의 객실 그룹 목록 — 동기 · 공개 (GET /user-service/discovery/store/:store_id/room-group)
 *
 * @param store_id 업체 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getStoreRoomGroups(store_id: string, signal?: AbortSignal): Promise<DiscoveryRoomGroupListResultDto | null> {
    return request<DiscoveryRoomGroupListResultDto>({path: `/user-service/discovery/store/${encodeURIComponent(store_id)}/room-group`, signal});
}
```

### 공통 — 요일 표시 `formatDays` (사용자 결정 — 이어지면 범위)

화면에서 아직 쓰는 곳이 없다(`grep formatDays src` — `format.ts` 뿐). `bitsToDays`(일 → 토)로 이어진 묶음을 자르고, 토 · 일이 둘 다 있으면 마지막 묶음 뒤에 첫 묶음을 붙인다(주를 넘어 이어짐).

```ts
// src/shared/utils/format.ts — formatDays 바꿈(위 상수 · bitsToDays 는 그대로)
/** 범위로 묶는 최소 날 수 — 이보다 짧게 이어지면 나열 */
const DAY_RANGE_MIN = 3;

/**
 * 비트합 → 요일 표시 — 127 은 '매일', 3일 이상 이어지면 '일 ~ 목'(토 → 일로 주를 넘어도), 그 밖은 '월 · 수 · 금'
 * - 묶음은 시작 요일 순
 *
 * @param bits days_of_week 응답 값
 */
export function formatDays(bits: number): string {
    if (bits === EVERY_DAY_BITS) {
        return '매일';
    }

    // 이어진 묶음 — 일 → 토 순서로 자른다
    const runs: Array<Array<number>> = [];
    for (const day of bitsToDays(bits)) {
        const last = runs[runs.length - 1];
        if (last && last[last.length - 1] === day - 1) {
            last.push(day);
        } else {
            runs.push([day]);
        }
    }

    // 토 다음은 일 — 첫 묶음이 일로 시작하고 마지막 묶음이 토로 끝나면 이어 붙인다
    if (runs.length > 1 && runs[0][0] === 0 && runs[runs.length - 1][runs[runs.length - 1].length - 1] === 6) {
        const first = runs.shift() as Array<number>;
        runs[runs.length - 1].push(...first);
    }

    return runs
        .sort((a, b) => a[0] - b[0])
        .map((run) => (run.length >= DAY_RANGE_MIN ? `${DAY_NAMES[run[0]]} ~ ${DAY_NAMES[run[run.length - 1]]}` : run.map((day) => DAY_NAMES[day]).join(' · ')))
        .join(' · ');
}
```

### 공통 — 지도 `StoreMap` (사용자 결정 — 시안대로)

형제: Phase 4 `StoreMap`(`src/shared/components/map/StoreMap.tsx`) — SDK 는 효과 안에서만, 그때의 콜백은 `useEffectEvent`, 지도 객체는 `mapRef`, 사라질 때 듣기 · 오버레이를 지운다. 같은 나눔으로 넓힌다. 기본 카카오 마커(`:126-134`)는 시안 핀(`CustomOverlay` — DOM 요소를 직접 만들고 글자는 `textContent`, 정적인 SVG 만 문자열)으로 바꾸며 지운다.

```ts
// src/shared/types/map.ts
/** 지도 위 한 지점 — WGS84 */
export type MapPointType = {
    latitude: number;  // 위도
    longitude: number; // 경도
};

/** 지도 마커 — 업체 한 곳 */
export type MapMarkerType = MapPointType & {
    id: string;      // 업체 ID — 누르면 onMarkerClick(id)
    title: string;   // 업체 이름 — 핀의 aria-label · 마우스를 올리면 보인다
    label?: string;  // 핀 위 이름표 — 없으면 핀만(U2 위치)
    muted?: boolean; // 회색 핀 — 지금 영업 안 함
};
```

```tsx
// src/shared/components/map/StoreMap.tsx
'use client';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { MapMarkerType, MapPointType } from '@/shared/types/map';
import { loadKakaoMap } from '@/shared/utils/kakao-map';
import styles from '@/shared/css/map/StoreMap.module.css';

/** 카카오 좌표 중 쓰는 부분 */
type KakaoLatLngType = {
    getLat: () => number;
    getLng: () => number;
};

/** 카카오 지도 객체 중 쓰는 부분 */
type KakaoMapType = {
    getCenter: () => KakaoLatLngType;
    setCenter: (latLng: unknown) => void;
    panTo: (latLng: unknown) => void;
    getLevel: () => number;
    setLevel: (level: number) => void;
    setBounds: (bounds: unknown) => void;
    setDraggable: (draggable: boolean) => void;
    setZoomable: (zoomable: boolean) => void;
};

/** 카카오 오버레이(핀 · 내 위치 점) 중 쓰는 부분 */
type KakaoOverlayType = {
    setMap: (map: KakaoMapType | null) => void;
};

/** 카카오 원 중 쓰는 부분 */
type KakaoCircleType = {
    setMap: (map: KakaoMapType | null) => void;
    setPosition: (latLng: unknown) => void;
    getBounds: () => unknown;
};

type StoreMapProps = {
    center: MapPointType;                    // 지도 중심 — 바뀌면 그쪽으로 옮긴다
    markers: Array<MapMarkerType>;           // 업체 핀
    level?: number;                          // 확대 단계(1 가까움 ~ 14 멂) — radiusKm 가 있으면 원에 맞춘 단계가 이긴다
    radiusKm?: number;                       // 반경 원(km) — 지도 중심을 따라가고, 바뀌면 원이 다 보이게 확대 단계를 맞춘다
    myLocation?: MapPointType | null;        // 내 위치 — 점 + "내 위치로 이동" 버튼(없으면 둘 다 없음)
    locked?: boolean;                        // 끌기 · 확대 끔(U2 위치 — 화면 스크롤을 잡아먹지 않게)
    onIdle?: (center: MapPointType) => void; // 지도가 멈추면 — 지금 중심
    onMarkerClick?: (id: string) => void;    // 핀을 누르면 — 업체 ID
};

/** 같은 좌표로 보는 차이 — 이보다 작으면 옮기지 않는다(idle 이 다시 오지 않게) */
const SAME_POINT_EPSILON = 0.0000001;

/** km → m */
const METERS_PER_KM = 1000;

/** 반경 원 모양 — 시안 user.html:369(점선 · 옅은 채움). 색은 --primary 를 읽어 넣는다(카카오 옵션은 CSS 변수를 못 받음) */
const CIRCLE_STYLE = {strokeWeight: 1.5, strokeOpacity: 0.4, strokeStyle: 'dash', fillOpacity: 0.05};

/** 핀 모양 — 시안 user.html:383(정적 SVG — 사용자 값 없음) */
const PIN_SVG = '<svg width="28" height="34" viewBox="0 0 28 34" aria-hidden="true"><path d="M14 33s11-10.2 11-19A11 11 0 0 0 3 14c0 8.8 11 19 11 19z" stroke-width="2"></path><circle cx="14" cy="14" r="4"></circle></svg>';

/**
 * 업체 지도 — 핀 · 반경 원 · 내 위치 · 멈추면 중심 좌표 알림 · 핀 누름 알림
 * - 높이는 감싼 요소의 CSS 변수 --store-map-h (기본 320px), 모서리는 --store-map-radius (기본 --radius)
 * - idle 은 처음 그릴 때 · center 로 옮겼을 때 · 반경에 맞춰 확대했을 때도 온다 — 화면은 onIdle 에서만 조회하면 된다(onIdle 값을 center 로 되돌려 넣지 않는다)
 * - 한 업체 위치(U2)는 핀 하나 · onIdle 없이 · locked
 *
 * @param param0
 * @returns
 */
export default function StoreMap({center, markers, level = 5, radiusKm, myLocation = null, locked = false, onIdle, onMarkerClick}: StoreMapProps): React.ReactNode {
    // 변수
    const {latitude, longitude} = center;                       // 지금 받은 중심
    const myLatitude = myLocation?.latitude;                    // 내 위치 위도 — 값이 바뀔 때만 점을 다시 찍는다
    const myLongitude = myLocation?.longitude;                  // 내 위치 경도
    const containerRef = useRef<HTMLDivElement>(null);          // 지도를 그릴 요소
    const mapRef = useRef<KakaoMapType | null>(null);            // 만든 지도
    const circleRef = useRef<KakaoCircleType | null>(null);      // 반경 원 — 멈출 때마다 중심을 따라간다
    const createMap = useEffectEvent((container: HTMLDivElement): KakaoMapType => {
        const map: KakaoMapType = new window.kakao.maps.Map(container, {center: toLatLng({latitude, longitude}), level});
        if (locked) {
            map.setDraggable(false);
            map.setZoomable(false);
        }
        return map;
    });                                                          // 그때의 center · level · locked 로 지도 만들기(효과를 다시 걸지 않는다)
    const notifyIdle = useEffectEvent((): void => {
        const point = mapRef.current?.getCenter();
        if (point) {
            circleRef.current?.setPosition(point);
            onIdle?.({latitude: point.getLat(), longitude: point.getLng()});
        }
    });                                                          // 멈춤 — 원을 중심으로 옮기고 그때의 onIdle
    const notifyMarkerClick = useEffectEvent((id: string): void => {
        onMarkerClick?.(id);
    });                                                          // 핀 누름 알림 — 그때의 onMarkerClick

    // 상태
    const [mapVersion, setMapVersion] = useState<number>(0); // 지도를 만든 횟수 — 0 이면 아직, 늘면 중심 · 핀 · 원 효과가 다시 돈다

    // 효과
    useEffect(() => {
        // SDK 를 불러와 지도를 한 번 만들고 멈춤(idle)을 듣는다 — 사라지면 듣기를 끊고 지도 DOM 을 비운다(다시 돌아도 지도가 겹치지 않게)
        const container = containerRef.current;
        if (!container) {
            return;
        }

        let cancelled = false;
        let createdMap: KakaoMapType | null = null;
        const handleIdle = (): void => notifyIdle();

        loadKakaoMap().then(() => {
            if (cancelled) {
                return;
            }

            createdMap = createMap(container);
            window.kakao.maps.event.addListener(createdMap, 'idle', handleIdle);
            mapRef.current = createdMap;
            setMapVersion((version) => version + 1);
        }).catch((error: Error) => {
            console.error(error.message);
        });

        return () => {
            cancelled = true;
            mapRef.current = null;
            if (createdMap) {
                window.kakao.maps.event.removeListener(createdMap, 'idle', handleIdle);
                container.replaceChildren();
            }
        };
    }, []);

    useEffect(() => {
        // center 가 바뀌면 그쪽으로 옮긴다 — 이미 거기면 그대로(idle 이 다시 오지 않게)
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const now = map.getCenter();
        if (Math.abs(now.getLat() - latitude) < SAME_POINT_EPSILON && Math.abs(now.getLng() - longitude) < SAME_POINT_EPSILON) {
            return;
        }

        map.setCenter(toLatLng({latitude, longitude}));
    }, [mapVersion, latitude, longitude]);

    useEffect(() => {
        // level 이 바뀌면 확대 단계를 바꾼다(반경 원 효과보다 먼저 — 원이 있으면 원에 맞춘 단계가 이긴다)
        const map = mapRef.current;
        if (map && map.getLevel() !== level) {
            map.setLevel(level);
        }
    }, [mapVersion, level]);

    useEffect(() => {
        // 반경 원 — 지금 중심에 그리고 원이 다 보이게 확대 단계를 맞춘다(바뀌면 다시)
        const map = mapRef.current;
        if (!map || !radiusKm) {
            return;
        }

        const circle: KakaoCircleType = new window.kakao.maps.Circle({map, center: map.getCenter(), radius: radiusKm * METERS_PER_KM, ...circleStyle()});
        circleRef.current = circle;
        map.setBounds(circle.getBounds());

        return () => {
            circle.setMap(null);
            circleRef.current = null;
        };
    }, [mapVersion, radiusKm]);

    useEffect(() => {
        // 핀을 다시 찍는다 — 이전 핀은 지운다
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const created: Array<KakaoOverlayType> = markers.map((marker) => new window.kakao.maps.CustomOverlay({
            map,
            position: toLatLng(marker),
            content: createPin(marker, () => notifyMarkerClick(marker.id)),
            xAnchor: 0.5,
            yAnchor: 1,
            clickable: true,
        }));

        return () => {
            created.forEach((overlay) => overlay.setMap(null));
        };
    }, [mapVersion, markers]);

    useEffect(() => {
        // 내 위치 점 — 바뀌면 다시 찍는다
        const map = mapRef.current;
        if (!map || myLatitude === undefined || myLongitude === undefined) {
            return;
        }

        const dot = document.createElement('span');
        dot.className = styles.myLocation;
        dot.setAttribute('aria-hidden', 'true');
        const overlay: KakaoOverlayType = new window.kakao.maps.CustomOverlay({map, position: toLatLng({latitude: myLatitude, longitude: myLongitude}), content: dot, xAnchor: 0.5, yAnchor: 0.5});

        return () => {
            overlay.setMap(null);
        };
    }, [mapVersion, myLatitude, myLongitude]);

    // 함수
    function moveToMyLocation(): void {
        // 내 위치로 — 움직이면 idle 이 와서 화면이 다시 조회한다
        if (mapRef.current && myLocation) {
            mapRef.current.panTo(toLatLng(myLocation));
        }
    }

    return (
        // 지도 — 높이는 --store-map-h
        <div className={styles.wrap}>
            {/* 지도 자리 */}
            <div ref={containerRef} className={styles.map} />

            {/* 내 위치로 이동 — 내 위치가 있을 때만 */}
            {myLocation ? (
                <button type="button" className={styles.myLocationButton} aria-label="내 위치로 이동" onClick={moveToMyLocation}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" /></svg>
                </button>
            ) : null}
        </div>
    );
}

/**
 * 좌표 → 카카오 LatLng
 *
 * @param point 좌표
 */
function toLatLng(point: MapPointType): unknown {
    return new window.kakao.maps.LatLng(point.latitude, point.longitude);
}

/**
 * 반경 원 옵션 — 선 · 채움 색은 --primary 값
 */
function circleStyle(): Record<string, unknown> {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    return {...CIRCLE_STYLE, strokeColor: color, fillColor: color};
}

/**
 * 핀 요소 — 이름표(있으면) + 핀, 누르면 onClick. 글자는 textContent 로만(업체 이름이 HTML 로 읽히지 않게)
 *
 * @param marker 업체 핀
 * @param onClick 눌렀을 때
 */
function createPin(marker: MapMarkerType, onClick: () => void): HTMLButtonElement {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = marker.muted ? `${styles.pin} ${styles.muted}` : styles.pin;
    pin.title = marker.title;
    pin.setAttribute('aria-label', marker.title);
    if (marker.label) {
        const label = document.createElement('span');
        label.className = styles.pinLabel;
        label.textContent = marker.label;
        pin.append(label);
    }

    pin.insertAdjacentHTML('beforeend', PIN_SVG);
    pin.addEventListener('click', onClick);
    return pin;
}
```

```css
/* src/shared/css/map/StoreMap.module.css — 시안 user.html:363-401 */
.wrap {
    position: relative;
}

.map {
    width: 100%;
    height: var(--store-map-h, 320px);
    border-radius: var(--store-map-radius, var(--radius));
    background: var(--map-bg);
    overflow: hidden;
}

/* 업체 핀 — 이름표 + 핀 */
.pin {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    cursor: pointer;
}

.pinLabel {
    max-width: 120px;
    padding: 2px 8px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--fg);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pin path {
    fill: var(--primary);
    stroke: var(--surface);
}

.pin circle {
    fill: var(--surface);
}

/* 지금 영업 안 함 — 회색 */
.muted .pinLabel {
    color: var(--neutral-fg);
}

.muted path {
    fill: var(--faint);
}

/* 내 위치 점 — 시안 :390 */
.myLocation {
    display: block;
    width: 16px;
    height: 16px;
    border: 3px solid var(--surface);
    border-radius: 999px;
    background: var(--primary);
    box-shadow: 0 0 0 6px var(--primary-halo);
}

/* 내 위치로 이동 — 시안 :400 */
.myLocationButton {
    position: absolute;
    right: 12px;
    bottom: 12px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--fg);
    cursor: pointer;
}
```

### U1 지도 · 주변 업체 (#19)

조회는 `StoreMap.onIdle` 에서만(`StoreMap.tsx` 머리 주석 — Phase 4 전제), 반경을 바꾸면 마지막 중심으로 바로. 같은 조회는 거르고 이전 요청은 취소. 실패는 `handleApiError`(취소는 무시), 실패한 조회는 다음 idle 에 다시 부를 수 있게 마지막 조회를 비운다. 반경 고르기는 공통 `Chip`(`src/shared/components/ui/form/Chip.tsx` — "반경 고르기" 용).

```ts
// src/app/(user)/distance.ts
/** km 로 쓰기 시작하는 거리(m) */
const KM_FROM_METERS = 1000;

/**
 * 거리(m) → 카드 글자 — 1km 아래는 '420m', 1km 부터는 100m 단위 반올림 '11.3km'(소수 한 자리 — 시안 '12.0km')
 *
 * @param meters 중심에서 거리(m — 응답 distance_m)
 */
export function formatDistance(meters: number): string {
    if (meters < KM_FROM_METERS) {
        return `${Math.round(meters)}m`;
    }

    return `${(Math.round(meters / 100) / 10).toFixed(1)}km`;
}
```

```tsx
// src/app/(user)/HomeContent.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useRef, useState } from 'react';
import { getNearbyStores } from '@/contracts/discovery/api';
import { DiscoveryStoreItemResultDto, DiscoveryStoreListDto, DiscoveryStoreListResultDto } from '@/contracts/discovery/dto/discovery-store-list.dto';
import { handleApiError } from '@/shared/api/error';
import StoreMap from '@/shared/components/map/StoreMap';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Chip from '@/shared/components/ui/form/Chip';
import useMyLocation from '@/shared/hooks/useMyLocation';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { MapMarkerType, MapPointType } from '@/shared/types/map';
import { loginUrl } from '@/shared/utils/area';
import { formatPrice } from '@/shared/utils/format';
import { formatDistance } from './distance';
import styles from '@/app/css/user/HomeContent.module.css';

/** 반경(km) — DiscoveryStoreListDto.radius_km 의 값 */
const RADIUS_OPTIONS = [5, 10, 20, 50] as const;

type RadiusType = typeof RADIUS_OPTIONS[number];

/** 처음 반경 — 사용자 결정 2026-11-16 */
const DEFAULT_RADIUS: RadiusType = 20;

/** 같은 중심으로 보는 차이 — 반경 맞춤 뒤 idle 이 같은 조회를 또 부르지 않게 */
const SAME_CENTER_EPSILON = 0.000001;

/** 조회 결과가 비었을 때(본문 없음) */
const EMPTY_RESULT: DiscoveryStoreListResultDto = {list: [], is_truncated: 0};

/** 사진 자리 아이콘 — 시안 user.html:415 */
const PHOTO_ICON = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" /></svg>;

/** 조회 중심 · 반경 */
type StoreQueryType = MapPointType & {
    radiusKm: RadiusType; // 반경(km)
};

/**
 * U1 지도 · 주변 업체 — 내 위치 · 지도 중심 · 반경으로 주변 업체를 불러 지도 핀과 목록에 그린다
 *
 * @returns
 */
export default function HomeContent(): React.ReactNode {
    // 변수
    const router = useRouter();                                    // 핀을 누르면 업체 상세로
    const auth = useContext(AuthContext);                          // 로그인했으면 "내 예약", 아니면 "로그인"
    const {location, isDefault, loading} = useMyLocation();        // 내 위치 — 못 읽으면 서울시청
    const lastQueryRef = useRef<StoreQueryType | null>(null);      // 마지막 조회 — 같은 조회를 거르고, 반경만 바꿀 때 그 중심을 쓴다
    const abortRef = useRef<AbortController | null>(null);          // 진행 중 조회 — 새 조회가 시작되면 취소

    // 상태
    const [radiusKm, setRadiusKm] = useState<RadiusType>(DEFAULT_RADIUS);           // 고른 반경
    const [result, setResult] = useState<DiscoveryStoreListResultDto | null>(null); // 마지막 조회 결과 — 아직 없으면 null

    // 계산 값
    const stores = result?.list ?? [];                     // 업체 목록(가까운 순 — 응답 그대로)
    const markers: Array<MapMarkerType> = stores.map(toMarker); // 지도 핀
    const myLocation = isDefault ? null : location;        // 내 위치 점 — 기본 위치(서울시청)면 그리지 않음

    // 효과
    useEffect(() => () => {
        // 화면을 떠나면 진행 중 조회를 취소한다
        abortRef.current?.abort();
    }, []);

    // 함수
    async function search(query: StoreQueryType): Promise<void> {
        // 조회 — 같은 중심 · 반경이면 거르고, 이전 요청은 취소(늦게 온 결과가 덮지 않게)
        if (isSameQuery(lastQueryRef.current, query)) {
            return;
        }

        lastQueryRef.current = query;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const dto = new DiscoveryStoreListDto({latitude: query.latitude.toFixed(6), longitude: query.longitude.toFixed(6), radius_km: String(query.radiusKm)});

        try {
            const found = await getNearbyStores(dto, controller.signal);
            if (!controller.signal.aborted) {
                setResult(found ?? EMPTY_RESULT);
            }
        } catch (error) {
            if (lastQueryRef.current === query) {
                lastQueryRef.current = null; // 실패한 조회는 다음 idle 에 다시
            }
            handleApiError(error);
        }
    }

    function idle(center: MapPointType): void {
        // 지도가 멈춤 — 그 중심 + 고른 반경으로
        search({...center, radiusKm});
    }

    function changeRadius(next: RadiusType): void {
        // 반경 — 마지막 중심(없으면 내 위치)으로 바로 다시. 지도는 StoreMap 이 원에 맞춰 확대하고, 그 뒤 idle 은 같은 조회라 걸러진다
        setRadiusKm(next);
        const center = lastQueryRef.current ?? location;
        if (center) {
            search({latitude: center.latitude, longitude: center.longitude, radiusKm: next});
        }
    }

    function openStore(id: string): void {
        // 핀 → 업체 상세
        router.push(storePath(id));
    }

    return (
        // 지도 · 주변 업체
        <div className={styles.home}>
            {/* 머리 — deskless · 로그인 / 내 예약 */}
            <header className={styles.header}>
                <strong className={styles.brand}>deskless</strong>
                {auth.isLogin
                    ? <Link href="/reservation/" className={styles.headerLink}>내 예약</Link>
                    : <Link href={loginUrl('user', '/')} className={styles.headerLink}>로그인</Link>}
            </header>

            {/* 지도 · 반경 */}
            <section className={styles.mapArea} aria-label="지도">
                {loading || !location
                    ? <div className={styles.locating}>내 위치를 확인하고 있어요</div>
                    : <StoreMap center={location} markers={markers} radiusKm={radiusKm} myLocation={myLocation} onIdle={idle} onMarkerClick={openStore} />}
                <div className={styles.radius} role="group" aria-label="반경">
                    {RADIUS_OPTIONS.map((option) => (
                        <Chip key={option} pressed={option === radiusKm} onClick={() => changeRadius(option)}>{option}km</Chip>
                    ))}
                </div>
            </section>

            {/* 300곳 넘음 */}
            {result?.is_truncated === 1 ? <Band tone="info">업체가 많아 가까운 300곳만 보여요. 반경을 줄여 주세요.</Band> : null}

            {/* 주변 업체 */}
            <section className={styles.list} aria-labelledby="home-list-title">
                <div className={styles.listHead}>
                    <h2 id="home-list-title" className={styles.listTitle}>주변 업체</h2>
                    <span className={styles.listSort}>가까운 순</span>
                </div>

                {/* 빈 목록 */}
                {result && stores.length === 0 ? <EmptyState title="이 반경에 업체가 없어요" description="반경을 넓히거나 지도를 옮겨 보세요." /> : null}

                {/* 업체 카드 */}
                {stores.map((store) => (
                    <Link key={store.store_id} href={storePath(store.store_id)} className={styles.card}>
                        <div className={styles.thumb}>
                            {store.image_url
                                ? <Image src={store.image_url} alt="" fill sizes="88px" unoptimized className={styles.thumbImg} />
                                : <>{PHOTO_ICON}<span>업체 사진</span></>}
                        </div>
                        <div className={styles.cardBody}>
                            <strong className={styles.cardName}>{store.store_name}</strong>
                            <div className={styles.badges}>
                                {store.is_open === 1 ? <Badge tone="ok">영업중</Badge> : <Badge>지금 영업 안 함</Badge>}
                                {store.is_always_open === 1 ? <Badge tone="primary">24시간</Badge> : null}
                            </div>
                            <span className={styles.cardMeta}>{formatDistance(store.distance_m)} · {store.address}</span>
                            <div className={styles.prices}>
                                {minPrice('시간 이용', store.min_hourly_price)}
                                {minPrice('1박', store.min_night_price)}
                            </div>
                        </div>
                    </Link>
                ))}
            </section>
        </div>
    );
}

/**
 * 업체 상세 주소
 *
 * @param id 업체 ID
 */
function storePath(id: string): string {
    return `/stores/${encodeURIComponent(id)}/`;
}

/**
 * 업체 → 지도 핀 — 이름표는 이름 전체(길면 말줄임), 지금 영업 안 함이면 회색
 *
 * @param store 반경 업체 1개
 */
function toMarker(store: DiscoveryStoreItemResultDto): MapMarkerType {
    return {id: store.store_id, title: store.store_name, label: store.store_name, latitude: store.latitude, longitude: store.longitude, muted: store.is_open !== 1};
}

/**
 * 같은 조회인지 — 반경이 같고 중심 차이가 SAME_CENTER_EPSILON 미만
 *
 * @param last 마지막 조회
 * @param next 새 조회
 */
function isSameQuery(last: StoreQueryType | null, next: StoreQueryType): boolean {
    return last !== null
        && last.radiusKm === next.radiusKm
        && Math.abs(last.latitude - next.latitude) < SAME_CENTER_EPSILON
        && Math.abs(last.longitude - next.longitude) < SAME_CENTER_EPSILON;
}

/**
 * 최저가 한 칸 — 팔지 않으면(null) "<상품> 판매 안 함"
 *
 * @param label 상품 이름
 * @param price 최저가(원)
 */
function minPrice(label: string, price: number | null): React.ReactNode {
    if (price === null) {
        return <span className={styles.muted}>{label} 판매 안 함</span>;
    }

    return <span><span className={styles.muted}>{label}</span> <strong>{formatPrice(price)}~</strong></span>;
}
```

```css
/* src/app/css/user/HomeContent.module.css — 시안 user.html:351-455 */
.home {
    display: flex;
    flex: 1;
    flex-direction: column;
    background: var(--bg);
}

.header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 8px 0 16px;
    border-bottom: 1px solid var(--line);
    background: var(--surface);
}

.brand {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary);
}

.headerLink {
    display: inline-flex;
    align-items: center;
    height: 44px;
    padding: 0 12px;
    font-size: 14px;
    font-weight: 700;
    color: var(--primary);
    text-decoration: none;
}

/* 지도 — 화면 너비 꽉, 모서리 없음 */
.mapArea {
    --store-map-h: 320px;
    --store-map-radius: 0;
    position: relative;
    flex-shrink: 0;
}

.locating {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--store-map-h);
    background: var(--map-bg);
    color: var(--muted);
    font-size: 14px;
}

.radius {
    position: absolute;
    top: 12px;
    right: 16px;
    left: 16px;
    z-index: 2;
    display: flex;
    gap: 8px;
}

/* 목록 */
.list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
}

.listHead {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
}

.listTitle {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
}

.listSort {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
}

.card {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--fg);
    text-decoration: none;
}

.thumb {
    position: relative;
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 88px;
    height: 88px;
    border-radius: var(--radius);
    background: var(--neutral-bg);
    color: var(--neutral-fg);
    font-size: 12px;
    font-weight: 500;
    overflow: hidden;
}

.thumbImg {
    object-fit: cover;
}

.cardBody {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.cardName {
    font-size: 16px;
    font-weight: 700;
}

.badges {
    display: flex;
    gap: 4px;
}

.cardMeta {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
}

.prices {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
}

.muted {
    color: var(--muted);
}
```

### U2 업체 상세 + 객실 그룹 (#20)

두 API 를 `Promise.all` 로 함께, 떠나면 취소(형제 `UserMeProvider` 처럼 효과 본문에서 바로 setState 하지 않고 Promise 뒤). 상세 · 객실 그룹 404 · 400 은 없는 업체 — 팝업 뒤 `/`. 안내 문장은 계산 함수(TDD)로 빼고 화면은 그리기만.

```ts
// src/app/(user)/stores/[store_id]/store-detail-format.ts
import { DiscoveryRoomGroupDetailResultDto, DiscoveryRoomGroupPeriodPriceResultDto, DiscoveryRoomGroupPlanResultDto } from '@/contracts/discovery/dto/discovery-room-group-list.dto';
import { DiscoveryStoreDetailResultDto, DiscoveryStoreHourResultDto, DiscoveryStorePlanResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import { EVERY_DAY_BITS, formatDays, formatPrice } from '@/shared/utils/format';

/** 휴무 · 영업시간을 알 수 없는 요일 */
const CLOSED_LABEL = '휴무';

/** 1시간(분) */
const MINUTES_PER_HOUR = 60;

/** 마감 뒤에도 전액 환불(%) */
const FULL_REFUND_PERCENT = 100;

/**
 * 요일 하나의 영업시간 한 줄 — '09:00 ~ 21:00', 닫는 시각이 이르거나 같으면 '09:00 ~ 다음 날 01:00', 휴무 · 시각 없음은 '휴무'
 *
 * @param hour 요일 영업시간
 */
export function formatHourRange(hour: Pick<DiscoveryStoreHourResultDto, 'is_closed' | 'open_time' | 'close_time'>): string {
    const {is_closed, open_time, close_time} = hour;
    if (is_closed === 1 || !open_time || !close_time) {
        return CLOSED_LABEL;
    }

    return `${open_time} ~ ${close_time <= open_time ? '다음 날 ' : ''}${close_time}`;
}

/**
 * 판매 상품 한 줄 — 시간 이용 '이용 3시간 · 매일 · 연장 최대 2회', 1박 '입실 20:00 · 퇴실 다음 날 11:00 · …', 연박 '2박 ~ 7박 · 입실 · 퇴실 · 일 ~ 목 입실 · …'
 *
 * @param plan 판매 중인 상품 설정
 */
export function describePlan(plan: DiscoveryStorePlanResultDto): string {
    const extension = plan.is_extendable === 1 ? `연장 최대 ${plan.max_extensions}회` : '연장 안 됨';

    switch (plan.room_plan_type_id) {
        case 'HOURLY':
            return joinParts([`이용 ${plan.usage_hours}시간`, formatDays(plan.days_of_week), extension]);
        case 'NIGHT':
            return joinParts([`입실 ${plan.check_in_time}`, `퇴실 다음 날 ${plan.check_out_time}`, checkInDays(plan.days_of_week), extension]);
        case 'LONG':
            return joinParts([nightsLabel(plan.min_nights, plan.max_nights), `입실 ${plan.check_in_time}`, `퇴실 ${plan.check_out_time}`, checkInDays(plan.days_of_week), extension]);
        default:
            return joinParts([formatDays(plan.days_of_week), extension]);
    }
}

/**
 * 예약 · 환불 규정 문장들 — 예약 시작 · 환불(마감 · 마감 뒤 비율) · 시작 뒤 취소 불가
 *
 * @param store 업체 상세의 규정 값
 */
export function describeBookingPolicy(store: Pick<DiscoveryStoreDetailResultDto, 'booking_open_hours' | 'refund_deadline_minutes' | 'late_refund_percent'>): Array<string> {
    return [
        `이용 시작 ${store.booking_open_hours}시간 전부터 예약할 수 있어요.`,
        refundLine(store.refund_deadline_minutes, store.late_refund_percent),
        '이용이 시작되면 취소할 수 없어요.',
    ];
}

/**
 * 객실 그룹 가격 앞 상품 이름 — 연박은 1박당 요금이라 '연박 1박당', 그 밖은 종류명 그대로
 *
 * @param plan 그룹 상품
 */
export function planPriceLabel(plan: Pick<DiscoveryRoomGroupPlanResultDto, 'room_plan_type_id' | 'room_plan_type_name'>): string {
    return plan.room_plan_type_id === 'LONG' ? `${plan.room_plan_type_name} 1박당` : plan.room_plan_type_name;
}

/**
 * 기간 가격 한 줄 — '12월 24일 ~ 12월 25일 1박 79,000원 (성탄 연휴)', 하루면 날짜 하나, 메모가 없거나 비면 괄호 없음
 *
 * @param period 기간 가격
 * @param planLabel 상품 이름(planPriceLabel)
 */
export function formatPeriodPrice(period: DiscoveryRoomGroupPeriodPriceResultDto, planLabel: string): string {
    const start = formatMonthDay(period.start_date);
    const dates = period.start_date === period.end_date ? start : `${start} ~ ${formatMonthDay(period.end_date)}`;
    const memo = period.memo ? ` (${period.memo})` : '';
    return `${dates} ${planLabel} ${formatPrice(period.price)}${memo}`;
}

/**
 * 편의시설 칩 글자 — 방 개수(1개 이상) · 샤워 · TV · PC 중 있는 것만, 이 순서로
 *
 * @param detail 객실 그룹 상세정보
 */
export function amenityLabels(detail: DiscoveryRoomGroupDetailResultDto): Array<string> {
    return [
        detail.room_count > 0 ? `방 ${detail.room_count}개` : '',
        detail.has_shower === 1 ? '샤워 시설' : '',
        detail.has_tv === 1 ? 'TV' : '',
        detail.has_pc === 1 ? 'PC' : '',
    ].filter(Boolean);
}

/**
 * 빈 조각을 빼고 ' · ' 로
 *
 * @param parts 조각들
 */
function joinParts(parts: Array<string>): string {
    return parts.filter(Boolean).join(' · ');
}

/**
 * 1박 · 연박 입실 요일 — 매일은 '매일', 그 밖은 '금 · 토 입실'
 *
 * @param bits 예약 가능 요일 비트
 */
function checkInDays(bits: number): string {
    const days = formatDays(bits);
    if (bits === EVERY_DAY_BITS || !days) {
        return days;
    }

    return `${days} 입실`;
}

/**
 * 연박 박수 — 같으면 '3박', 다르면 '2박 ~ 7박'
 *
 * @param min 최소 박수
 * @param max 최대 박수
 */
function nightsLabel(min: number | null, max: number | null): string {
    return min === max ? `${min}박` : `${min}박 ~ ${max}박`;
}

/**
 * 환불 문장 — 마감 0분 · 마감 뒤 100% 는 시작 전까지 전액, 마감 뒤 0% 는 환불 없음, 그 밖은 비율
 *
 * @param deadlineMinutes 100% 환불 마감(분)
 * @param latePercent 마감 뒤 환불 비율(%)
 */
function refundLine(deadlineMinutes: number, latePercent: number): string {
    if (deadlineMinutes <= 0 || latePercent >= FULL_REFUND_PERCENT) {
        return '이용 시작 전까지 취소하면 전액 환불해요.';
    }

    const deadline = `이용 시작 ${formatMinutes(deadlineMinutes)} 전까지 취소하면 전액`;
    if (latePercent <= 0) {
        return `${deadline} 환불해요. 그 뒤에는 환불되지 않아요.`;
    }

    return `${deadline}, 그 뒤 시작 전까지는 ${latePercent}% 환불해요.`;
}

/**
 * 분 → '1시간'(60으로 나누어떨어지면) · '90분'
 *
 * @param minutes 분
 */
function formatMinutes(minutes: number): string {
    return minutes % MINUTES_PER_HOUR === 0 ? `${minutes / MINUTES_PER_HOUR}시간` : `${minutes}분`;
}

/**
 * 'YYYY-MM-DD' → 'M월 D일' — 날짜 문자열을 시간대 없이 그대로 읽는다
 *
 * @param date 날짜
 */
function formatMonthDay(date: string): string {
    const [, month, day] = date.split('-');
    return `${Number(month)}월 ${Number(day)}일`;
}
```

```tsx
// src/app/(user)/stores/[store_id]/page.tsx
import StoreDetailContent from './StoreDetailContent';

// U2 업체 상세 + 객실 그룹 — /stores/[store_id]
export default async function StoreDetail({params}: PageProps<'/stores/[store_id]'>): Promise<React.ReactNode> {
    const {store_id} = await params;

    return (
        // 업체 상세 화면
        <StoreDetailContent storeId={store_id} />
    );
}
```

```tsx
// src/app/(user)/stores/[store_id]/_components/StoreImageSlider.tsx
'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { DiscoveryStoreImageResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import styles from '@/app/css/user/StoreImageSlider.module.css';

type StoreImageSliderProps = {
    images: Array<DiscoveryStoreImageResultDto>; // 업체 사진(정렬 순서)
    alt: string;                                 // 사진 설명 앞부분 — 업체 이름
};

/**
 * 업체 사진 넘기기 — swiper 가로 넘기기 + 오른쪽 아래 "현재 / 전체", 사진이 없으면 자리 표시
 * - swiper 는 window 를 쓰기 전에 typeof window 를 확인해(node_modules/swiper/shared/swiper-core.mjs) 서버 렌더에서도 안전 — next/dynamic 없이
 *
 * @param param0
 * @returns
 */
export default function StoreImageSlider({images, alt}: StoreImageSliderProps): React.ReactNode {
    // 상태
    const [index, setIndex] = useState<number>(0); // 보고 있는 사진(0부터)

    // 사진 없음
    if (images.length === 0) {
        return (
            // 사진 자리
            <div className={styles.empty}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" /></svg>
                <span>업체 사진</span>
            </div>
        );
    }

    return (
        // 사진 넘기기
        <div className={styles.slider}>
            <Swiper className={styles.swiper} onSlideChange={(swiper) => setIndex(swiper.activeIndex)}>
                {images.map((image, order) => (
                    <SwiperSlide key={image.image_url}>
                        <div className={styles.slide}>
                            <Image src={image.image_url} alt={`${alt} 사진 ${order + 1}`} fill sizes="480px" unoptimized className={styles.img} />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* 현재 / 전체 */}
            <span className={styles.count}>{index + 1} / {images.length}</span>
        </div>
    );
}
```

```tsx
// src/app/(user)/stores/[store_id]/StoreDetailContent.tsx
'use client';
import dayjs from 'dayjs';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useEffectEvent, useState } from 'react';
import { getStoreDetail, getStoreRoomGroups } from '@/contracts/discovery/api';
import { DiscoveryRoomGroupItemResultDto } from '@/contracts/discovery/dto/discovery-room-group-list.dto';
import { DiscoveryStoreDetailResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import { handleApiError } from '@/shared/api/error';
import { ApiError } from '@/shared/api/request';
import StoreMap from '@/shared/components/map/StoreMap';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import { MapMarkerType } from '@/shared/types/map';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { DAY_NAMES, formatPrice, todayKst } from '@/shared/utils/format';
import UserTopBar from '../../_components/UserTopBar';
import StoreImageSlider from './_components/StoreImageSlider';
import { amenityLabels, describeBookingPolicy, describePlan, formatHourRange, formatPeriodPrice, planPriceLabel } from './store-detail-format';
import styles from '@/app/css/user/StoreDetailContent.module.css';

type StoreDetailContentProps = {
    storeId: string; // 주소의 업체 ID
};

/** 없는 업체 · 잘못된 업체 ID */
export const STORE_NOT_FOUND_MESSAGE = '업체를 찾을 수 없습니다.';

/** 위치 지도 확대 단계 — 동네가 보이는 정도 */
const LOCATION_MAP_LEVEL = 4;

/** 주소 아이콘 — 시안 user.html:472 */
const PLACE_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.icon}><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>;

/** 전화 아이콘 — 시안 user.html:473 */
const PHONE_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>;

/**
 * U2 업체 상세 + 객실 그룹 — 상세 · 객실 그룹을 함께 불러 그리고, 없는 업체면 첫 화면으로
 *
 * @param param0
 * @returns
 */
export default function StoreDetailContent({storeId}: StoreDetailContentProps): React.ReactNode {
    // 변수
    const router = useRouter(); // 없는 업체면 첫 화면으로
    const failLoad = useEffectEvent((error: unknown): void => {
        if (isNotFound(error)) {
            showErrorPopup(STORE_NOT_FOUND_MESSAGE);
            router.replace('/');
            return;
        }

        handleApiError(error);
    });                         // 불러오기 실패 — 없는 업체면 안내 뒤 첫 화면(그때의 router — 효과를 다시 걸지 않는다)

    // 상태
    const [store, setStore] = useState<DiscoveryStoreDetailResultDto | null>(null);                 // 업체 상세 — 불러오기 전 null
    const [roomGroups, setRoomGroups] = useState<Array<DiscoveryRoomGroupItemResultDto>>([]);         // 객실 그룹(그룹명 순)

    // 계산 값
    const today = dayjs(todayKst()).day();                                                     // 오늘 요일(한국) — 영업시간 줄 강조
    const bookingPath = `/stores/${encodeURIComponent(storeId)}/booking/`;                     // U3(Phase 7)
    const address = store?.address_detail ? `${store.address}, ${store.address_detail}` : store?.address ?? ''; // 주소 + 상세주소
    const policies = store ? describeBookingPolicy(store) : [];                                 // 예약 · 환불 규정 문장
    const storeMarkers: Array<MapMarkerType> = store ? [{id: store.store_id, title: store.store_name, latitude: store.latitude, longitude: store.longitude}] : []; // 위치 핀 하나

    // 효과
    useEffect(() => {
        // 상세 · 객실 그룹을 함께 부른다 — 없는 업체면 안내 뒤 첫 화면, 떠나면 취소
        const controller = new AbortController();

        Promise.all([getStoreDetail(storeId, controller.signal), getStoreRoomGroups(storeId, controller.signal)])
            .then(([detail, groups]) => {
                setStore(detail);
                setRoomGroups(groups?.list ?? []);
            })
            .catch((error: unknown) => failLoad(error));

        return () => {
            controller.abort();
        };
    }, [storeId]);

    return (
        // 업체 상세
        <div className={styles.page}>
            {/* 상단 바 */}
            <UserTopBar title="업체 상세" backHref="/" />

            {store ? (
                <>
                    <div className={styles.body}>
                        {/* 사진 · 이름 · 주소 · 전화 · 소개 · 위치 */}
                        <div className={styles.summary}>
                            <StoreImageSlider images={store.images} alt={store.store_name} />
                            <div className={styles.info}>
                                <h2 className={styles.name}>{store.store_name}</h2>
                                <div className={styles.badges}>
                                    {store.is_open === 1 ? <Badge tone="ok">영업중</Badge> : <Badge>지금 영업 안 함</Badge>}
                                    {store.is_always_open === 1 ? <Badge tone="primary">24시간</Badge> : null}
                                </div>
                                <div className={styles.contact}>
                                    <span className={styles.contactRow}>{PLACE_ICON}{address}</span>
                                    <a className={styles.phone} href={`tel:${store.phone}`}>{PHONE_ICON}{store.phone}</a>
                                </div>
                                {store.introduction ? <p className={styles.intro}>{store.introduction}</p> : null}
                                <div className={styles.locationMap}>
                                    <StoreMap center={{latitude: store.latitude, longitude: store.longitude}} markers={storeMarkers} level={LOCATION_MAP_LEVEL} locked />
                                </div>
                            </div>
                        </div>

                        {/* 영업시간 · 브레이크 */}
                        <section className={styles.section} aria-labelledby="store-hours-title">
                            <h3 id="store-hours-title" className={styles.sectionTitle}>영업시간</h3>
                            {store.is_always_open === 1 ? <p className={styles.text}>24시간 연중무휴</p> : (
                                <div className={styles.hours}>
                                    {store.hours.map((hour) => (
                                        <div key={hour.day_of_week} className={hour.day_of_week === today ? `${styles.hour} ${styles.today}` : styles.hour}>
                                            <span className={styles.day}>{DAY_NAMES[hour.day_of_week]}</span>
                                            <span>{formatHourRange(hour)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {store.breaks.length > 0 ? (
                                <div className={styles.breaks}>
                                    <span className={styles.breakTitle}>브레이크타임</span>
                                    <span className={styles.muted}>매일 {store.breaks.map((item) => `${item.start_time} ~ ${item.end_time}`).join(', ')}</span>
                                </div>
                            ) : null}
                        </section>

                        {/* 판매 상품 */}
                        <section className={styles.section} aria-labelledby="store-plans-title">
                            <h3 id="store-plans-title" className={styles.sectionTitle}>판매 상품</h3>
                            <div className={styles.plans}>
                                {store.plans.map((plan) => (
                                    <Fragment key={plan.room_plan_type_id}>
                                        <span className={styles.planBadge}><Badge>{plan.room_plan_type_name}</Badge></span>
                                        <span>{describePlan(plan)}</span>
                                    </Fragment>
                                ))}
                            </div>
                        </section>

                        {/* 예약 · 환불 규정 */}
                        <section className={styles.section} aria-labelledby="store-policy-title">
                            <h3 id="store-policy-title" className={styles.sectionTitle}>예약 · 환불 규정</h3>
                            <ul className={styles.policies}>
                                {policies.map((policy) => <li key={policy}>{policy}</li>)}
                            </ul>
                        </section>

                        {/* 객실 그룹 */}
                        <section className={styles.section} aria-labelledby="store-groups-title">
                            <h3 id="store-groups-title" className={styles.sectionTitle}>객실 그룹</h3>
                            {roomGroups.length === 0 ? <p className={styles.muted}>예약할 수 있는 객실이 아직 없어요.</p> : null}
                            {roomGroups.map((group) => (
                                <Link key={group.room_group_id} href={`${bookingPath}?room_group_id=${encodeURIComponent(group.room_group_id)}`} className={styles.group}>
                                    <div className={styles.groupHead}>
                                        <div className={styles.groupThumb}>
                                            {group.images[0] ? <Image src={group.images[0].image_url} alt="" fill sizes="72px" unoptimized className={styles.img} /> : '객실 사진'}
                                        </div>
                                        <div className={styles.groupText}>
                                            <strong className={styles.groupName}>{group.room_group_name}</strong>
                                            {group.description ? <span className={styles.groupDesc}>{group.description}</span> : null}
                                            <span className={styles.roomCount}>예약 받는 호실 {group.room_count}개</span>
                                        </div>
                                    </div>
                                    <div className={styles.amenities}>
                                        {amenityLabels(group.room_group_detail).map((label) => <span key={label} className={styles.amenity}>{label}</span>)}
                                    </div>
                                    <div className={styles.prices}>
                                        {group.plans.map((plan) => (
                                            <div key={plan.room_plan_type_id} className={styles.price}>
                                                <span className={styles.priceLabel}>{planPriceLabel(plan)}</span>
                                                <strong className={styles.priceValue}>{formatPrice(plan.price)}</strong>
                                            </div>
                                        ))}
                                    </div>
                                    {group.plans.flatMap((plan) => plan.period_prices.map((period) => (
                                        <p key={`${plan.room_plan_type_id}-${period.start_date}-${period.end_date}`} className={styles.period}>기간 가격 · {formatPeriodPrice(period, planPriceLabel(plan))}</p>
                                    )))}
                                </Link>
                            ))}
                        </section>
                    </div>

                    {/* 예약하기 — 지금 영업하지 않으면 막음 */}
                    <div className={styles.footer}>
                        {store.is_open === 1
                            ? <Link href={bookingPath} className={buttonClass({variant: 'primary', size: 'lg', full: true})}>예약하기</Link>
                            : <Button variant="primary" size="lg" full disabled>지금은 예약할 수 없어요</Button>}
                    </div>
                </>
            ) : null}
        </div>
    );
}

/**
 * 없는 업체인지 — 상세 · 객실 그룹이 404(없음) · 400(ID 모양)
 *
 * @param error 잡은 오류
 */
function isNotFound(error: unknown): boolean {
    return error instanceof ApiError && (error.status === 404 || error.status === 400);
}
```

```css
/* src/app/css/user/StoreImageSlider.module.css — 시안 user.html:466-470 */
.slider,
.empty {
    position: relative;
    height: 140px;
    background: var(--neutral-bg);
}

.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--neutral-fg);
    font-size: 13px;
    font-weight: 500;
}

.swiper {
    height: 100%;
}

.slide {
    position: relative;
    height: 100%;
}

.img {
    object-fit: cover;
}

.count {
    position: absolute;
    right: 12px;
    bottom: 12px;
    z-index: 2;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--fg);
    color: var(--surface);
    font-size: 12px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
}
```

```css
/* src/app/css/user/StoreDetailContent.module.css — 시안 user.html:456-579 */
.page {
    display: flex;
    flex: 1;
    flex-direction: column;
    background: var(--bg);
}

.body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
}

.summary {
    display: flex;
    flex-direction: column;
    background: var(--surface);
}

.info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
}

.name {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
}

.badges {
    display: flex;
    gap: 4px;
}

.contact {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
}

.contactRow {
    display: flex;
    align-items: center;
    gap: 6px;
}

.icon {
    flex-shrink: 0;
    color: var(--muted);
}

.phone {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    color: var(--primary);
    text-decoration: none;
}

.intro {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
}

/* 위치 지도 — 시안 72px · 모서리 */
.locationMap {
    --store-map-h: 72px;
}

.section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    background: var(--surface);
}

.sectionTitle {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
}

.text {
    margin: 0;
    font-size: 14px;
}

/* 영업시간 — 2열, 위에서 아래로 */
.hours {
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(4, auto);
    gap: 6px 12px;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
}

.hour {
    display: flex;
    gap: 8px;
}

.day {
    width: 16px;
    font-weight: 700;
}

.today {
    color: var(--primary-strong);
    font-weight: 700;
}

.breaks {
    display: flex;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
}

.breakTitle {
    font-weight: 700;
}

/* 판매 상품 — 배지 열 + 설명 열 */
.plans {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    align-items: start;
    gap: 10px 8px;
    font-size: 14px;
    line-height: 1.5;
    font-variant-numeric: tabular-nums;
}

.planBadge {
    justify-self: start;
}

.policies {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding-left: 18px;
    font-size: 14px;
    line-height: 1.5;
}

/* 객실 그룹 카드 */
.group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    color: var(--fg);
    text-decoration: none;
}

.groupHead {
    display: flex;
    gap: 12px;
}

.groupThumb {
    position: relative;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    border-radius: var(--radius);
    background: var(--neutral-bg);
    color: var(--neutral-fg);
    font-size: 12px;
    font-weight: 500;
    overflow: hidden;
}

.img {
    object-fit: cover;
}

.groupText {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.groupName {
    font-size: 16px;
    font-weight: 700;
}

.groupDesc {
    font-size: 13px;
    color: var(--muted);
}

.roomCount {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
}

.amenities {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.amenity {
    display: inline-flex;
    align-items: center;
    height: var(--badge-h);
    padding: 0 10px;
    border-radius: 999px;
    background: var(--bg);
    color: var(--neutral-fg);
    font-size: 12px;
    font-weight: 500;
}

.prices {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    font-variant-numeric: tabular-nums;
}

.price {
    display: flex;
    flex-direction: column;
}

.priceLabel {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
}

.priceValue {
    font-size: 15px;
    font-weight: 700;
}

.period {
    margin: 0;
    padding: 6px 10px;
    border-radius: var(--radius);
    background: var(--surface-2);
    color: var(--muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
}

.muted {
    margin: 0;
    color: var(--muted);
}

.footer {
    position: sticky;
    bottom: 0;
    padding: 12px 16px 16px;
    border-top: 1px solid var(--line);
    background: var(--surface);
}
```

### 지우는 것
- `src/shared/components/map/StoreMap.tsx` 의 기본 카카오 마커(`new window.kakao.maps.Marker` · `KakaoMarkerType` — 핀 오버레이로 바뀜).
- `src/app/(user)/HomeContent.tsx` 의 자리 표시 "지도 · 주변 업체" · `src/app/css/user/HomeContent.module.css` 의 `.placeholder`.

### 문서
- AGENTS.md "Conventions" 표시 형식 줄 — `formatDays`(요일 비트합 → `월 · 수 · 금`, 3일 이상 이어지면 `일 ~ 목`, 127 → `매일`).
- `docs/data-layer.md:42` — `formatDays(31)` → `일 ~ 목` 예 더함.
- `docs/integrations.md` 지도 — `StoreMap` 속성에 `markers[].label · muted` · `radiusKm` · `myLocation` · `locked`, 핀은 `CustomOverlay`(글자는 `textContent`), 반경 원 색은 `--primary` 를 읽음, U1 조회 흐름(같은 조회 거름 · 이전 요청 취소).
- 새 규약 영역 없음(지도 · 외부 연동은 Phase 4 문서) — 초안 표시 없이 build 가 코드에 맞춰 고친다.

---

## Test Cases
```
[ABOUT:formatDays] 예약 가능 요일 비트(일 1 · 월 2 · … · 토 64)를 읽을 글자로 바꾼다 // 127 은 "매일", 3일 이상 이어진 요일(토 → 일로 주를 넘어도)은 "시작 ~ 끝", 1 ~ 2일은 " · " 나열, 묶음은 시작 요일 순
[CASES:formatDays] `127` → `'매일'` // 모든 요일
[CASES:formatDays] `0` → `''` // 요일이 없으면 빈 글자
[CASES:formatDays] `42` → `'월 · 수 · 금'` // 이어지지 않은 요일은 나열
[CASES:formatDays] `31` → `'일 ~ 목'` // 다섯 날이 이어짐 — 범위(시안 연박)
[CASES:formatDays] `62` → `'월 ~ 금'` // 평일 — 범위
[CASES:formatDays] `6` → `'월 · 화'` // 이틀만 이어지면 범위로 쓰지 않음
[CASES:formatDays] `97` → `'금 ~ 일'` // 금 · 토 · 일 — 토 다음은 일, 주를 넘어 이어짐
[CASES:formatDays] `65` → `'토 · 일'` // 주를 넘는 이틀 — 나열, 시작 요일(토)부터
[CASES:formatDays] `29` → `'일 · 화 ~ 목'` // 따로 떨어진 하루 + 이어진 사흘
[CASES:formatDays] `125` → `'화 ~ 일'` // 월만 빠짐 — 화부터 일까지 이어짐
[ABOUT:formatDistance] 중심에서 업체까지 거리(m)를 카드에 쓸 글자로 바꾼다 // 1km 아래는 m 정수, 1km 부터는 100m 단위 반올림한 km 소수 한 자리(시안 "12.0km")
[CASES:formatDistance] `420` → `'420m'` // 1km 아래는 m
[CASES:formatDistance] `0` → `'0m'` // 바로 그 자리
[CASES:formatDistance] `999` → `'999m'` // 1km 바로 아래까지 m
[CASES:formatDistance] `1000` → `'1.0km'` // 1km 부터 km, 소수 한 자리
[CASES:formatDistance] `1049` → `'1.0km'` // 100m 단위 반올림 — 내림
[CASES:formatDistance] `1050` → `'1.1km'` // 100m 단위 반올림 — 올림
[CASES:formatDistance] `11300` → `'11.3km'` // 시안 예
[CASES:formatDistance] `12000` → `'12.0km'` // 딱 떨어져도 소수 한 자리(시안 예)
[CASES:formatDistance] `49960` → `'50.0km'` // 반올림으로 자리가 올라감
[ABOUT:formatHourRange] 요일 하나의 영업시간을 한 줄로 쓴다 // 휴무 · 시각 없음은 "휴무", 닫는 시각이 여는 시각보다 이르거나 같으면 "다음 날"
[CASES:formatHourRange] `{is_closed: 0, open_time: '09:00', close_time: '21:00'}` → `'09:00 ~ 21:00'` // 같은 날 닫음
[CASES:formatHourRange] `{is_closed: 0, open_time: '09:00', close_time: '01:00'}` → `'09:00 ~ 다음 날 01:00'` // 닫는 시각이 이르면 다음 날(시안)
[CASES:formatHourRange] `{is_closed: 0, open_time: '00:00', close_time: '00:00'}` → `'00:00 ~ 다음 날 00:00'` // 같으면 하루를 꼬박 — 다음 날
[CASES:formatHourRange] `{is_closed: 1, open_time: null, close_time: null}` → `'휴무'` // 휴무 요일
[CASES:formatHourRange] `{is_closed: 0, open_time: null, close_time: '21:00'}` → `'휴무'` // 시각이 빠지면 영업시간을 알 수 없음 — 휴무로
[ABOUT:describePlan] 판매 상품 설정 하나를 한 줄 설명으로 쓴다 // 시간 이용은 이용 시간, 1박은 입실 · 퇴실 "다음 날", 연박은 박수 범위 · 입실 · 퇴실, 1박 · 연박 요일은 "입실"을 붙이되 매일은 그대로, 끝에 연장
[CASES:describePlan] `HOURLY · usage_hours 3 · days 127 · 연장 1 · 최대 2` → `'이용 3시간 · 매일 · 연장 최대 2회'` // 시안 시간 이용
[CASES:describePlan] `HOURLY · usage_hours 2 · days 62 · 연장 0` → `'이용 2시간 · 월 ~ 금 · 연장 안 됨'` // 연장 불가 · 요일 범위
[CASES:describePlan] `NIGHT · 입실 20:00 · 퇴실 11:00 · days 127 · 연장 1 · 최대 1` → `'입실 20:00 · 퇴실 다음 날 11:00 · 매일 · 연장 최대 1회'` // 시안 1박 — 매일엔 "입실" 없음
[CASES:describePlan] `NIGHT · 입실 21:00 · 퇴실 10:00 · days 96 · 연장 0` → `'입실 21:00 · 퇴실 다음 날 10:00 · 금 · 토 입실 · 연장 안 됨'` // 요일이 정해지면 입실 요일
[CASES:describePlan] `LONG · 2 ~ 7박 · 입실 20:00 · 퇴실 11:00 · days 31 · 연장 0` → `'2박 ~ 7박 · 입실 20:00 · 퇴실 11:00 · 일 ~ 목 입실 · 연장 안 됨'` // 시안 연박 — 여러 밤이라 "다음 날" 없음
[CASES:describePlan] `LONG · 3 ~ 3박 · 입실 15:00 · 퇴실 11:00 · days 127 · 연장 1 · 최대 3` → `'3박 · 입실 15:00 · 퇴실 11:00 · 매일 · 연장 최대 3회'` // 최소 = 최대면 박수 하나
[ABOUT:describeBookingPolicy] 예약 · 환불 규정 값을 안내 문장들로 쓴다 // 예약 시작 시간, 전액 환불 마감 · 마감 뒤 비율(0% · 100% · 마감 0분은 다르게), 시작 뒤 취소 불가 — 분은 60으로 나누어떨어지면 시간
[CASES:describeBookingPolicy] `{booking_open_hours: 72, refund_deadline_minutes: 60, late_refund_percent: 50}` → `['이용 시작 72시간 전부터 예약할 수 있어요.', '이용 시작 1시간 전까지 취소하면 전액, 그 뒤 시작 전까지는 50% 환불해요.', '이용이 시작되면 취소할 수 없어요.']` // 시안 규정(60분은 1시간으로)
[CASES:describeBookingPolicy] `{…, refund_deadline_minutes: 90, late_refund_percent: 30}` 둘째 줄 → `'이용 시작 90분 전까지 취소하면 전액, 그 뒤 시작 전까지는 30% 환불해요.'` // 60으로 나누어떨어지지 않으면 분
[CASES:describeBookingPolicy] `{…, refund_deadline_minutes: 1440, late_refund_percent: 0}` 둘째 줄 → `'이용 시작 24시간 전까지 취소하면 전액 환불해요. 그 뒤에는 환불되지 않아요.'` // 마감 뒤 0% — 비율 대신 환불 없음
[CASES:describeBookingPolicy] `{…, refund_deadline_minutes: 60, late_refund_percent: 100}` 둘째 줄 → `'이용 시작 전까지 취소하면 전액 환불해요.'` // 마감 뒤도 100% — 마감이 의미 없음
[CASES:describeBookingPolicy] `{…, refund_deadline_minutes: 0, late_refund_percent: 50}` 둘째 줄 → `'이용 시작 전까지 취소하면 전액 환불해요.'` // 마감 0분 — 시작 직전까지 전액
[ABOUT:planPriceLabel] 객실 그룹 가격 앞에 붙일 상품 이름을 정한다 // 연박은 1박당 요금이라 "1박당"을 붙이고, 그 밖은 상품 종류명 그대로
[CASES:planPriceLabel] `{room_plan_type_id: 'HOURLY', room_plan_type_name: '시간 이용'}` → `'시간 이용'` // 1회 요금
[CASES:planPriceLabel] `{room_plan_type_id: 'NIGHT', room_plan_type_name: '1박'}` → `'1박'` // 1박 요금
[CASES:planPriceLabel] `{room_plan_type_id: 'LONG', room_plan_type_name: '연박'}` → `'연박 1박당'` // 연박 가격은 1박당(DTO)
[ABOUT:formatPeriodPrice] 기간 가격 하나를 카드 아래 한 줄로 쓴다 // "M월 D일 ~ M월 D일 <상품> <가격>원 (메모)" — 하루면 날짜 하나, 메모가 없거나 비면 괄호 없음, 날짜 문자열은 시간대 없이 그대로 읽음
[CASES:formatPeriodPrice] `({start_date: '2026-12-24', end_date: '2026-12-25', price: 79000, memo: '성탄 연휴'}, '1박')` → `'12월 24일 ~ 12월 25일 1박 79,000원 (성탄 연휴)'` // 시안 예
[CASES:formatPeriodPrice] `({start_date: '2026-12-24', end_date: '2026-12-24', price: 25000, memo: '성탄 전야'}, '시간 이용')` → `'12월 24일 시간 이용 25,000원 (성탄 전야)'` // 하루짜리 기간
[CASES:formatPeriodPrice] `({…'2026-08-01' ~ '2026-08-31', price: 65000, memo: null}, '연박 1박당')` → `'8월 1일 ~ 8월 31일 연박 1박당 65,000원'` // 메모 없음 — 괄호 없음
[CASES:formatPeriodPrice] `({…, memo: ''}, '1박')` → 괄호 없음 // 빈 메모도 없음과 같음
[CASES:formatPeriodPrice] `({start_date: '2026-12-31', end_date: '2027-01-02', price: 89000, memo: '새해'}, '1박')` → `'12월 31일 ~ 1월 2일 1박 89,000원 (새해)'` // 해를 넘어도 달 · 일만(끝 날짜가 오늘 이후인 가격만 옴)
[ABOUT:amenityLabels] 객실 그룹 편의시설을 칩 글자 목록으로 바꾼다 // 방 개수(1개 이상일 때) · 샤워 · TV · PC 중 있는 것만, 이 순서로
[CASES:amenityLabels] `{room_count: 1, has_shower: 1, has_tv: 1, has_pc: 0}` → `['방 1개', '샤워 시설', 'TV']` // 시안 스탠다드 더블
[CASES:amenityLabels] `{room_count: 2, has_shower: 1, has_tv: 1, has_pc: 1}` → `['방 2개', '샤워 시설', 'TV', 'PC']` // 모두 있음
[CASES:amenityLabels] `{room_count: 0, has_shower: 0, has_tv: 0, has_pc: 0}` → `[]` // 없는 것은 칩을 만들지 않음
[ABOUT:HomeContent] 내 위치 · 지도 중심 · 반경으로 주변 업체를 불러 지도와 목록에 그린다 // 지도가 멈출 때와 반경을 바꿀 때만 부르고, 같은 중심 · 반경은 다시 부르지 않으며 이전 요청은 취소
[SUCCESS] HomeContent — 지도 멈춤 `{37.5, 127.03}` → `getNearbyStores` 1회 `{latitude: '37.500000', longitude: '127.030000', radius_km: '20'}` → 카드(이름 · 영업중 · `420m · 주소` · 가격) · 카드 링크 `/stores/<id>/` // 처음 반경 20km(사용자 결정)로 지도 중심 조회
[SUCCESS] HomeContent — "5km" 누름 → 같은 중심 · `radius_km: '5'` 로 1회 더 // 반경을 바꾸면 다시 조회
[FAIL:same-query] HomeContent — 같은 중심으로 지도 멈춤 한 번 더 → 추가 호출 0 // 반경 맞춤 뒤 idle 이 같은 조회를 또 부르지 않게
[FAIL:truncated] HomeContent — `is_truncated: 1` → "가까운 300곳만 보여요" 안내 // 잘린 결과임을 알림
[FAIL:empty] HomeContent — 빈 목록 → "이 반경에 업체가 없어요" // 빈 화면 대신 안내
[FAIL:stale] HomeContent — 첫 조회가 둘째 조회보다 늦게 옴 → 둘째 결과만 그림 · 첫 요청 신호 취소됨 // 늦게 온 이전 결과가 덮지 않게(ship 리뷰)
[FAIL:error] HomeContent — 조회 500 → `message` 팝업 1회, 같은 중심으로 다시 멈추면 다시 부름, 반경을 바꾸면 지도 중심(내 위치 아님)으로 // 실패한 조회는 다음 idle 에 다시(ship 리뷰)
[ABOUT:StoreDetailContent] 업체 상세 · 객실 그룹을 함께 불러 그리고, 없는 업체면 첫 화면으로 돌린다 // 두 API 를 한 번씩, 상세 404 · 400 이면 안내 뒤 / 로
[SUCCESS] StoreDetailContent — 두 API 각 1회(`store_id`) → 이름 · "24시간 연중무휴" 또는 영업시간 줄 · 판매 상품 줄 · 규정 · 그룹 카드(기간 가격 줄 · 예약 링크 `?room_group_id=`) // 지침서 U2 구성
[FAIL:not-found] StoreDetailContent — 상세 404 → "업체를 찾을 수 없습니다." 팝업 1회 · `router.replace('/')` 1회 // 없는 업체에서 머물지 않음
[FAIL:empty-body] StoreDetailContent — 상세 본문 없음(null) → "업체를 찾을 수 없습니다." · `/` // 빈 화면에 머물지 않음(ship 리뷰)
[FAIL:groups] StoreDetailContent — 객실 그룹만 500 → 업체 정보는 그림 · `message` 팝업 1회 · 이동 0 // 하나가 실패해도 다른 하나는 씀(ship 리뷰)
[FAIL:closed] StoreDetailContent — `is_open: 0` → "예약하기" 막힘 · "지금은 예약할 수 없어요" · 객실 그룹 카드도 링크 없음 // DTO — 지금 영업하지 않으면 예약 불가

테스트 생략(위임형): contracts `discovery/api.ts`(request 를 부르기만) · DTO 사본 · `page.tsx` · `StoreMap` 의 카카오 SDK 호출(오버레이 · 원 · `setBounds` — SDK 를 부르기만, 화면 테스트는 `StoreMap` 을 mock) · `StoreImageSlider`(swiper 를 감싸기만)
```

테스트 모양(형제 `src/test/app/(user)/login/LoginContent.test.tsx` · `signup/SignupContent.test.tsx`):
- 계산 함수 — `src/test/shared/utils/format.test.ts`(`formatDays`) · `src/test/app/(user)/distance.test.ts` · `src/test/app/(user)/stores/[store_id]/store-detail-format.test.ts` — 위 `[CASES]` 를 `it.each` 없이 케이스마다 `expect`, 설명 앞에 `[SUCCESS]` · `[FAIL:<이유>]`.
- `HomeContent.test.tsx` — `vi.mock('@/shared/components/map/StoreMap')`(받은 props 를 잡아 두고 `onIdle` · `onMarkerClick` 을 직접 부름), `vi.mock('@/shared/hooks/useMyLocation')`(`{37.5, 127.03}` · 기본 아님 · 확인 끝), `vi.mock('@/contracts/discovery/api')`, `next/navigation` `useRouter` → `{push}`, `RootLayoutProvider` 로 감싸 그림. 호출 인자는 `toMatchObject({latitude: '37.500000', …})` + 두 번째 인자 `AbortSignal`. 핀 누름 → `push('/stores/<id>/')` 1회도 [SUCCESS] 에서.
- `StoreDetailContent.test.tsx` — contracts · `StoreMap` · `StoreImageSlider` · `next/navigation`(`replace`) · `@/shared/utils/error-popup` mock. 404 는 `new ApiError(404, {message: '…', validation_errors: null})`.

---

## Response Codes
| Code | Cause |
|------|------|
| 200 `{list, is_truncated}` | U1 반경 업체 — 카드 · 핀, `is_truncated` 1 이면 안내 띠, 빈 목록이면 빈 안내 |
| 200 `DiscoveryStoreDetailResultDto` + 200 `{list}` | U2 업체 상세 · 객실 그룹 — 그대로 그림(그룹 없으면 "예약할 수 있는 객실이 아직 없어요") |
| 404 · 400 (상세 · 객실 그룹) | 없는 업체 · 업체 ID 모양 — "업체를 찾을 수 없습니다." 팝업 → `/` |
| 4xx · 5xx 그 밖 | `handleApiError` — `message` 팝업(U1 은 다음 idle 에 다시 부를 수 있게 마지막 조회를 비움) |
| 응답 없음 | `NetworkError` → 네트워크 문구 팝업 |
| 취소(`AbortError`) | 아무것도 — 새 조회 · 화면 떠남 |
