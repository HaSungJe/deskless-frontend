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
    const drawPins = useEffectEvent((map: KakaoMapType): Array<KakaoOverlayType> => markers.map((marker) => new window.kakao.maps.CustomOverlay({
        map,
        position: toLatLng(marker),
        content: createPin(marker, onMarkerClick ? () => notifyMarkerClick(marker.id) : null),
        xAnchor: 0.5,
        yAnchor: 1,
        clickable: Boolean(onMarkerClick),
    })));                                                        // 그때의 markers 로 핀 찍기 — 효과는 markersKey 가 바뀔 때만

    // 상태
    const [mapVersion, setMapVersion] = useState<number>(0); // 지도를 만든 횟수 — 0 이면 아직, 늘면 중심 · 핀 · 원 효과가 다시 돈다

    // 계산 값
    const markersKey = markers.map(markerKey).join('|'); // 핀 내용 — 배열이 새로 만들어져도 내용이 같으면 다시 찍지 않는다

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
        // 핀 내용이 바뀌면 다시 찍는다 — 이전 핀은 지운다
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const created = drawPins(map);

        return () => {
            created.forEach((overlay) => overlay.setMap(null));
        };
    }, [mapVersion, markersKey]);

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
 * 핀 내용 키 — id · 좌표 · 회색 · 이름표가 같으면 같은 핀
 *
 * @param marker 업체 핀
 */
function markerKey(marker: MapMarkerType): string {
    return [marker.id, marker.latitude, marker.longitude, marker.muted ? 1 : 0, marker.label ?? ''].join(':');
}

/**
 * 핀 요소 — 이름표(있으면) + 핀. 글자는 textContent 로만(업체 이름이 HTML 로 읽히지 않게)
 * - 누를 수 있으면 버튼(탭 순서에서는 뺀다 — 같은 업체로 가는 목록 링크가 키보드 길), 없으면 span(U2 위치)
 *
 * @param marker 업체 핀
 * @param onClick 눌렀을 때 — 없으면 누를 수 없는 핀
 */
function createPin(marker: MapMarkerType, onClick: (() => void) | null): HTMLElement {
    const pin = document.createElement(onClick ? 'button' : 'span');
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
    if (onClick) {
        (pin as HTMLButtonElement).type = 'button';
        pin.tabIndex = -1;
        pin.addEventListener('click', onClick);
    }
    return pin;
}
