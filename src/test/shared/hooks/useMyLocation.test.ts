import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useMyLocation, { DEFAULT_LOCATION, LOCATION_TIMEOUT_MS } from '@/shared/hooks/useMyLocation';

/**
 * navigator.geolocation 바꾸기 — jsdom 에는 없다
 *
 * @param geolocation 넣을 값(없으면 undefined)
 */
function setGeolocation(geolocation: Partial<Geolocation> | undefined): void {
    Object.defineProperty(navigator, 'geolocation', {value: geolocation, configurable: true});
}

afterEach(() => {
    Reflect.deleteProperty(navigator, 'geolocation');
});

describe('useMyLocation', () => {
    it('[SUCCESS] 위치를 받으면 그 좌표 · 기본 위치 아님 — 읽기 전에는 확인 중', async () => {
        const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>((success) => {
            success({coords: {latitude: 37.5559, longitude: 126.9236}} as GeolocationPosition);
        });
        setGeolocation({getCurrentPosition});

        const {result} = renderHook(() => useMyLocation());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.location).toEqual({latitude: 37.5559, longitude: 126.9236});
        expect(result.current.isDefault).toBe(false);
        expect(getCurrentPosition).toHaveBeenCalledTimes(1);
        expect(getCurrentPosition.mock.calls[0][2]).toEqual(expect.objectContaining({timeout: 10000}));
    });

    it('[FAIL:denied] 위치 권한을 거부하면 서울시청 · 기본 위치', async () => {
        const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>((_success, error) => {
            error?.({code: 1, message: 'User denied Geolocation'} as GeolocationPositionError);
        });
        setGeolocation({getCurrentPosition});

        const {result} = renderHook(() => useMyLocation());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.location).toEqual({latitude: 37.5665, longitude: 126.978});
        expect(result.current.location).toEqual(DEFAULT_LOCATION);
        expect(result.current.isDefault).toBe(true);
    });

    it('[FAIL:timeout] 권한 창에 답이 없어 콜백이 오지 않으면 10초 뒤 서울시청 · 기본 위치', async () => {
        vi.useFakeTimers();
        try {
            setGeolocation({getCurrentPosition: vi.fn()});

            const {result} = renderHook(() => useMyLocation());
            expect(result.current.loading).toBe(true);

            await act(async () => {
                vi.advanceTimersByTime(LOCATION_TIMEOUT_MS);
            });

            expect(result.current.loading).toBe(false);
            expect(result.current.location).toEqual(DEFAULT_LOCATION);
            expect(result.current.isDefault).toBe(true);
        } finally {
            vi.useRealTimers();
        }
    });

    it('[FAIL:unsupported] navigator.geolocation 이 없으면 서울시청 · 기본 위치', async () => {
        setGeolocation(undefined);

        const {result} = renderHook(() => useMyLocation());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.location).toEqual(DEFAULT_LOCATION);
        expect(result.current.isDefault).toBe(true);
    });
});
