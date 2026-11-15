'use client';
import { useEffect, useRef } from "react";

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 카카오 지도 SDK 전역(타입 패키지 없음)
        kakao: any;
    }
}

type KakaoMapProps = {
    width?: string | number;
    height?: string | number;
    lat: number;
    lon: number;
    text: string;
    textLink: string;
    zoomLevel?: number;
    markerWidth?: number | string;
}

const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk';

/**
 * 카카오 지도 SDK 로드 — 페이지에 한 번만 붙이고, 이미 붙어 있으면 로드가 끝나기를 기다린다
 */
function loadKakaoMapScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.kakao?.maps) {
            window.kakao.maps.load(() => resolve());
            return;
        }

        let script = document.getElementById(KAKAO_MAP_SCRIPT_ID) as HTMLScriptElement | null;
        if (!script) {
            script = document.createElement('script');
            script.id = KAKAO_MAP_SCRIPT_ID;
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_DAUM_MAP_API_KEY}&autoload=false`;
            script.async = true;
            document.head.appendChild(script);
        }

        script.addEventListener('load', () => window.kakao.maps.load(() => resolve()), { once: true });
        script.addEventListener('error', () => reject(new Error('카카오 지도 스크립트를 불러오지 못했습니다.')), { once: true });
    });
}

/**
 * 카카오 지도 — 한 지점에 마커와 링크 인포윈도우
 *
 * @param param0
 * @returns
 */
export default function KakaoMap({width = 'auto', height = 'auto', lat, lon, text, textLink, zoomLevel = 3, markerWidth = 'auto'}: KakaoMapProps): React.ReactNode {
    // 변수
    const mapRef = useRef<HTMLDivElement>(null); // 지도를 그릴 요소

    // 효과
    useEffect(() => {
        // SDK 를 불러온 뒤 지도 · 마커 · 인포윈도우를 그린다(사라지면 그리지 않는다)
        let cancelled = false;

        loadKakaoMapScript().then(() => {
            if (cancelled || !mapRef.current) {
                return;
            }

            const position = new window.kakao.maps.LatLng(lat, lon);
            const map = new window.kakao.maps.Map(mapRef.current, {
                center: position, // 지도의 중심좌표
                level: zoomLevel, // 지도의 확대 레벨
            });

            // 마커
            const marker = new window.kakao.maps.Marker({ position });
            marker.setMap(map);

            // 인포윈도우 — text · textLink 를 HTML 문자열로 넣지 않고 요소로 만든다
            const content = document.createElement('div');
            content.style.textAlign = 'center';
            content.style.padding = '3px';
            content.style.width = typeof markerWidth === 'number' ? `${markerWidth}px` : markerWidth;

            const link = document.createElement('a');
            link.href = textLink;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = text;
            content.appendChild(link);

            const infowindow = new window.kakao.maps.InfoWindow({ position, content });
            infowindow.open(map, marker);
        }).catch((error: Error) => {
            console.error(error.message);
        });

        return () => {
            cancelled = true;
        };
    }, [lat, lon, text, textLink, zoomLevel, markerWidth]);

    return (
        // 지도 자리
        <div
            ref={mapRef}
            style={{width: width, height: height}}
        />
    );
}
