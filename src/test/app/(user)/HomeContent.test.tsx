import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import HomeContent from '@/app/(user)/HomeContent';
import { DiscoveryStoreItemResultDto, DiscoveryStoreListResultDto } from '@/contracts/discovery/dto/discovery-store-list.dto';
import { ApiError } from '@/shared/api/request';
import RootLayoutProvider from '@/shared/providers/RootLayoutProvider';
import { MapMarkerType, MapPointType } from '@/shared/types/map';

/** StoreMap 에 넘긴 props 중 테스트가 보는 것 */
type MapPropsType = {
    markers: Array<MapMarkerType>;
    radiusKm?: number;
    myLocation?: MapPointType | null;
    onIdle?: (center: MapPointType) => void;
    onMarkerClick?: (id: string) => void;
};

const {getNearbyStores, getRoomGroupDetailFilters, push, showErrorPopup, mapProps} = vi.hoisted(() => ({
    getNearbyStores: vi.fn(),
    getRoomGroupDetailFilters: vi.fn(),
    push: vi.fn(),
    showErrorPopup: vi.fn(),
    mapProps: {current: null as MapPropsType | null},
}));

vi.mock('next/navigation', () => ({useRouter: () => ({push})}));
vi.mock('@/contracts/discovery/api', () => ({getNearbyStores, getRoomGroupDetailFilters}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));
vi.mock('@/shared/hooks/useMyLocation', () => ({default: () => ({location: {latitude: 37.5, longitude: 127.03}, isDefault: false, loading: false})}));
vi.mock('@/shared/components/map/StoreMap', () => ({
    default: (props: MapPropsType) => {
        mapProps.current = props;
        return <div data-testid="store-map" />;
    },
}));

const STORE_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

/** 반경 업체 1곳 — 영업중 · 1박은 팔지 않음 */
const STORE: DiscoveryStoreItemResultDto = {
    store_id: STORE_ID,
    store_name: '스테이 리프 강남역점',
    address: '서울특별시 강남구 역삼로12길 34',
    latitude: 37.501,
    longitude: 127.031,
    distance_m: 420,
    image_url: null,
    is_open: 1,
    is_always_open: 0,
    min_hourly_price: 18000,
    min_night_price: null,
};

/**
 * 로그인 안 한 상태로 그린다
 */
function renderHome(): void {
    render(
        <RootLayoutProvider rootLayoutLoading={false} auth={{area: 'user', token: null, isLogin: false, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()}}>
            <HomeContent />
        </RootLayoutProvider>,
    );
}

/**
 * 지도가 멈춘 것처럼 onIdle 을 부르고 조회가 끝나기를 기다린다
 *
 * @param center 지도 중심
 */
async function idle(center: MapPointType): Promise<void> {
    await act(async () => {
        mapProps.current?.onIdle?.(center);
    });
}

beforeEach(() => {
    getNearbyStores.mockReset();
    getRoomGroupDetailFilters.mockReset().mockResolvedValue({list: [{key: 'room_count', name: '방 2개 이상'}, {key: 'has_shower', name: '샤워실'}, {key: 'has_tv', name: 'TV'}, {key: 'has_pc', name: 'PC'}]});
    push.mockClear();
    showErrorPopup.mockClear();
    mapProps.current = null;
});

describe('HomeContent', () => {
    it('[SUCCESS] 지도가 멈추면 그 중심 + 처음 반경 20km 로 조회 → 카드 · 핀, 핀을 누르면 업체 상세로', async () => {
        getNearbyStores.mockResolvedValue({list: [STORE], is_truncated: 0} satisfies DiscoveryStoreListResultDto);
        renderHome();

        await idle({latitude: 37.5, longitude: 127.03});

        expect(getNearbyStores).toHaveBeenCalledTimes(1);
        expect(getNearbyStores.mock.calls[0][0]).toMatchObject({latitude: '37.500000', longitude: '127.030000', radius_km: '20', detail_filter: null});
        expect(getNearbyStores.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
        expect(mapProps.current?.radiusKm).toBe(20);
        expect(mapProps.current?.myLocation).toEqual({latitude: 37.5, longitude: 127.03});
        expect(mapProps.current?.markers).toEqual([{id: STORE_ID, title: STORE.store_name, label: STORE.store_name, latitude: 37.501, longitude: 127.031, muted: false}]);

        const card = screen.getByRole('link', {name: /스테이 리프 강남역점/});
        expect(card.getAttribute('href')).toBe(`/stores/${STORE_ID}/`);
        expect(screen.getByText('영업중')).toBeTruthy();
        expect(screen.getByText('420m · 서울특별시 강남구 역삼로12길 34')).toBeTruthy();
        expect(screen.getByText('18,000원~')).toBeTruthy();
        expect(screen.getByText('1박 판매 안 함')).toBeTruthy();

        act(() => {
            mapProps.current?.onMarkerClick?.(STORE_ID);
        });
        expect(push).toHaveBeenCalledTimes(1);
        expect(push).toHaveBeenCalledWith(`/stores/${STORE_ID}/`);
    });

    it('[SUCCESS] 반경을 바꾸면 같은 중심 · 새 반경으로 한 번 더', async () => {
        getNearbyStores.mockResolvedValue({list: [STORE], is_truncated: 0});
        renderHome();
        await idle({latitude: 37.5, longitude: 127.03});

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '5km'}));
        });

        expect(getNearbyStores).toHaveBeenCalledTimes(2);
        expect(getNearbyStores.mock.calls[1][0]).toMatchObject({latitude: '37.500000', longitude: '127.030000', radius_km: '5'});
        expect(screen.getByRole('button', {name: '5km'}).getAttribute('aria-pressed')).toBe('true');
        expect(mapProps.current?.radiusKm).toBe(5);
    });

    it('[SUCCESS] "제한 없음"을 고르면 같은 중심 · radius_km ALL 로 한 번 더 — 반경 원은 그리지 않는다', async () => {
        getNearbyStores.mockResolvedValue({list: [STORE], is_truncated: 0});
        renderHome();
        await idle({latitude: 37.5, longitude: 127.03});

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '제한 없음'}));
        });

        expect(getNearbyStores).toHaveBeenCalledTimes(2);
        expect(getNearbyStores.mock.calls[1][0]).toMatchObject({latitude: '37.500000', longitude: '127.030000', radius_km: 'ALL', detail_filter: null});
        expect(screen.getByRole('button', {name: '제한 없음'}).getAttribute('aria-pressed')).toBe('true');
        expect(mapProps.current?.radiusKm).toBeUndefined();
    });

    it('[SUCCESS] 추가정보 필터 팝업에서 두 개를 고르고 적용한다 → 항목 1번 · 업체 검색(항목 순서로 쉼표) → 다시 열어 초기화하면 필터 없이', async () => {
        getNearbyStores.mockResolvedValue({list: [STORE], is_truncated: 0});
        renderHome();
        await idle({latitude: 37.5, longitude: 127.03});

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '추가정보'}));
        });
        expect(getRoomGroupDetailFilters).toHaveBeenCalledTimes(1);
        let dialog = within(document.querySelector('dialog[open]') as HTMLElement);
        expect(dialog.getAllByRole('checkbox').map((box) => box.closest('label')?.textContent)).toEqual(['방 2개 이상', '샤워실', 'TV', 'PC']);
        fireEvent.click(dialog.getByRole('checkbox', {name: 'PC'}));
        fireEvent.click(dialog.getByRole('checkbox', {name: '샤워실'}));
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '적용'}));
        });

        expect(getNearbyStores).toHaveBeenCalledTimes(2);
        expect(getNearbyStores.mock.calls[1][0]).toMatchObject({latitude: '37.500000', longitude: '127.030000', radius_km: '20', detail_filter: 'has_shower,has_pc'});
        expect(document.querySelector('dialog[open]')).toBeNull();
        expect(screen.getByRole('button', {name: '추가정보 2'}).getAttribute('aria-pressed')).toBe('true');

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '추가정보 2'}));
        });
        dialog = within(document.querySelector('dialog[open]') as HTMLElement);
        expect((dialog.getByRole('checkbox', {name: 'PC'}) as HTMLInputElement).checked).toBe(true);
        fireEvent.click(dialog.getByRole('button', {name: '초기화'}));
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '적용'}));
        });

        expect(getRoomGroupDetailFilters).toHaveBeenCalledTimes(1);
        expect(getNearbyStores).toHaveBeenCalledTimes(3);
        expect(getNearbyStores.mock.calls[2][0]).toMatchObject({radius_km: '20', detail_filter: null});
        expect(screen.getByRole('button', {name: '추가정보'}).getAttribute('aria-pressed')).toBe('false');
    });

    it('[FAIL:same-query] 거의 같은 중심(약 11m 안)으로 다시 멈추면 부르지 않는다', async () => {
        getNearbyStores.mockResolvedValue({list: [STORE], is_truncated: 0});
        renderHome();
        await idle({latitude: 37.5, longitude: 127.03});

        await idle({latitude: 37.50005, longitude: 127.03005});

        expect(getNearbyStores).toHaveBeenCalledTimes(1);
    });

    it('[FAIL:stale] 늦게 온 이전 결과는 그리지 않는다 — 이전 요청은 취소', async () => {
        let finishFirst: (result: DiscoveryStoreListResultDto) => void = () => undefined;
        getNearbyStores
            .mockImplementationOnce(() => new Promise<DiscoveryStoreListResultDto>((resolve) => {
                finishFirst = resolve;
            }))
            .mockResolvedValueOnce({list: [{...STORE, store_id: 'b'.repeat(32), store_name: '두 번째 업체'}], is_truncated: 0});
        renderHome();

        await idle({latitude: 37.5, longitude: 127.03});
        await idle({latitude: 37.6, longitude: 127.1});
        await act(async () => {
            finishFirst({list: [STORE], is_truncated: 0});
        });

        expect(getNearbyStores).toHaveBeenCalledTimes(2);
        expect((getNearbyStores.mock.calls[0][1] as AbortSignal).aborted).toBe(true);
        expect(screen.getByText('두 번째 업체')).toBeTruthy();
        expect(screen.queryByText('스테이 리프 강남역점')).toBeNull();
    });

    it('[FAIL:error] 실패하면 안내하고, 같은 중심으로 다시 멈추면 다시 부른다 — 반경을 바꾸면 내 위치가 아니라 지도 중심으로', async () => {
        getNearbyStores
            .mockRejectedValueOnce(new ApiError(500, {message: '잠시 뒤 다시 시도해 주세요.', validation_errors: null}))
            .mockResolvedValue({list: [STORE], is_truncated: 0});
        renderHome();

        await idle({latitude: 37.6, longitude: 127.1});
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('잠시 뒤 다시 시도해 주세요.');

        await idle({latitude: 37.6, longitude: 127.1});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '10km'}));
        });

        expect(getNearbyStores).toHaveBeenCalledTimes(3);
        expect(getNearbyStores.mock.calls[1][0]).toMatchObject({latitude: '37.600000', longitude: '127.100000', radius_km: '20'});
        expect(getNearbyStores.mock.calls[2][0]).toMatchObject({latitude: '37.600000', longitude: '127.100000', radius_km: '10'});
    });

    it('[FAIL:truncated] 300곳을 넘어 잘렸으면 반경을 줄이거나 추가정보 필터를 더하라는 안내', async () => {
        getNearbyStores.mockResolvedValue({list: [STORE], is_truncated: 1});
        renderHome();

        await idle({latitude: 37.5, longitude: 127.03});

        expect(screen.getByText('업체가 많아 가까운 300곳만 보여요. 반경을 줄이거나 추가정보 필터를 더해 보세요.')).toBeTruthy();
    });

    it('[FAIL:empty] 빈 목록이면 빈 안내 — 카드 없음', async () => {
        getNearbyStores.mockResolvedValue({list: [], is_truncated: 0});
        renderHome();

        await idle({latitude: 37.5, longitude: 127.03});

        expect(screen.getByText('이 반경에 업체가 없어요')).toBeTruthy();
        expect(screen.queryByRole('link', {name: /스테이/})).toBeNull();
    });
});
