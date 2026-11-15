import { useEffect, useState } from 'react';
import { MapPointType } from '@/shared/types/map';

export type UseMyLocationType = {
    location: MapPointType | null; // 내 위치 — 확인 중이면 null
    isDefault: boolean;            // 기본 위치(서울시청)인지 — 거부 · 지원 안 함 · 시간 초과 · 오류
    loading: boolean;              // 확인 중인지
};

type MyLocationType = {
    location: MapPointType; // 읽은 위치 또는 기본 위치
    isDefault: boolean;     // 기본 위치인지
};

/** 위치를 못 읽을 때 — 서울시청 (사용자 결정 2026-11-16) */
export const DEFAULT_LOCATION: MapPointType = {latitude: 37.5665, longitude: 126.978};

/** 위치 읽기 시간 초과 — 브라우저 timeout 은 권한 창이 떠 있는 시간을 세지 않아 자체 타이머로도 끊는다 */
export const LOCATION_TIMEOUT_MS = 10 * 1000;

/** 이 시간 안에 읽은 위치는 다시 쓴다 */
const LOCATION_MAX_AGE_MS = 60 * 1000;

/**
 * 내 위치 — 위치 권한을 묻고, 못 읽으면 기본 위치(서울시청)
 *
 * @returns
 */
export default function useMyLocation(): UseMyLocationType {
    // 상태
    const [result, setResult] = useState<MyLocationType | null>(null); // 읽은 위치 — 확인 중이면 null

    // 계산 값
    const location = result?.location ?? null;    // 내 위치
    const isDefault = result?.isDefault ?? false; // 기본 위치인지
    const loading = result === null;              // 확인 중인지

    // 효과
    useEffect(() => {
        // 처음 한 번 위치를 읽는다(사라지면 결과를 버린다)
        let active = true;
        readMyLocation().then((next) => {
            if (active) {
                setResult(next);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    return {location, isDefault, loading};
}

/**
 * 브라우저 위치 읽기 — 실패는 던지지 않고 기본 위치
 * - 권한 창에 답이 없으면 브라우저가 콜백을 부르지 않으므로 10초 뒤 기본 위치로 끝낸다(늦게 온 위치는 버린다)
 */
function readMyLocation(): Promise<MyLocationType> {
    return new Promise((resolve) => {
        const fallback: MyLocationType = {location: DEFAULT_LOCATION, isDefault: true};
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            resolve(fallback);
            return;
        }

        const timer = setTimeout(() => resolve(fallback), LOCATION_TIMEOUT_MS);
        const finish = (next: MyLocationType): void => {
            clearTimeout(timer);
            resolve(next);
        };

        navigator.geolocation.getCurrentPosition(
            (position) => finish({location: {latitude: position.coords.latitude, longitude: position.coords.longitude}, isDefault: false}),
            () => finish(fallback),
            {timeout: LOCATION_TIMEOUT_MS, maximumAge: LOCATION_MAX_AGE_MS},
        );
    });
}
