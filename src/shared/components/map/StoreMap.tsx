'use client';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { MapMarkerType, MapPointType } from '@/shared/types/map';
import { loadKakaoMap } from '@/shared/utils/kakao-map';
import styles from '@/shared/css/map/StoreMap.module.css';

/** 카카오 지도 객체 중 쓰는 부분 */
type KakaoMapType = {
    getCenter: () => {getLat: () => number; getLng: () => number};
    setCenter: (latLng: unknown) => void;
    getLevel: () => number;
    setLevel: (level: number) => void;
};

/** 카카오 마커 중 쓰는 부분 */
type KakaoMarkerType = {
    setMap: (map: KakaoMapType | null) => void;
};

type StoreMapProps = {
    center: MapPointType;                    // 지도 중심 — 바뀌면 그쪽으로 옮긴다
    markers: Array<MapMarkerType>;           // 업체 마커
    level?: number;                          // 확대 단계(1 가까움 ~ 14 멂)
    onIdle?: (center: MapPointType) => void; // 지도가 멈추면 — 지금 중심
    onMarkerClick?: (id: string) => void;    // 마커를 누르면 — 업체 ID
};

/** 같은 좌표로 보는 차이 — 이보다 작으면 옮기지 않는다(idle 이 다시 오지 않게) */
const SAME_POINT_EPSILON = 0.0000001;

/**
 * 업체 지도 — 여러 마커 · 멈추면 중심 좌표 알림 · 마커 누름 알림
 * - 높이는 감싼 요소의 CSS 변수 --store-map-h (기본 320px)
 * - idle 은 처음 그릴 때 · center 로 옮겼을 때도 온다 — 화면은 onIdle 에서만 조회하면 된다(onIdle 값을 center 로 되돌려 넣지 않는다)
 * - 한 업체 위치(U2)는 마커 하나 · onIdle 없이
 *
 * @param param0
 * @returns
 */
export default function StoreMap({center, markers, level = 5, onIdle, onMarkerClick}: StoreMapProps): React.ReactNode {
    // 변수
    const {latitude, longitude} = center;                       // 지금 받은 중심
    const containerRef = useRef<HTMLDivElement>(null);          // 지도를 그릴 요소
    const mapRef = useRef<KakaoMapType | null>(null);            // 만든 지도
    const createMap = useEffectEvent((container: HTMLDivElement): KakaoMapType => (
        new window.kakao.maps.Map(container, {center: toLatLng({latitude, longitude}), level})
    ));                                                          // 그때의 center · level 로 지도 만들기(효과를 다시 걸지 않는다)
    const notifyIdle = useEffectEvent((): void => {
        const point = mapRef.current?.getCenter();
        if (point) {
            onIdle?.({latitude: point.getLat(), longitude: point.getLng()});
        }
    });                                                          // 멈춤 알림 — 그때의 onIdle
    const notifyMarkerClick = useEffectEvent((id: string): void => {
        onMarkerClick?.(id);
    });                                                          // 마커 누름 알림 — 그때의 onMarkerClick

    // 상태
    const [mapVersion, setMapVersion] = useState<number>(0); // 지도를 만든 횟수 — 0 이면 아직, 늘면 중심 · 마커 효과가 다시 돈다

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
        // level 이 바뀌면 확대 단계를 바꾼다
        const map = mapRef.current;
        if (map && map.getLevel() !== level) {
            map.setLevel(level);
        }
    }, [mapVersion, level]);

    useEffect(() => {
        // 마커를 다시 찍는다 — 이전 마커는 지운다
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const created: Array<KakaoMarkerType> = markers.map((marker) => {
            const kakaoMarker: KakaoMarkerType = new window.kakao.maps.Marker({map, position: toLatLng(marker), title: marker.title, clickable: true});
            window.kakao.maps.event.addListener(kakaoMarker, 'click', () => notifyMarkerClick(marker.id));
            return kakaoMarker;
        });

        return () => {
            created.forEach((kakaoMarker) => kakaoMarker.setMap(null));
        };
    }, [mapVersion, markers]);

    return (
        // 지도 자리 — 높이는 --store-map-h
        <div ref={containerRef} className={styles.map} />
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
