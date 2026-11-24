import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import HomeContent from '@/app/(user)/HomeContent';
import { DiscoveryDetailFilterItemResultDto } from '@/contracts/discovery/dto/discovery-detail-filter.dto';
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

const {getNearbyStores, getDetailFilters, push, showErrorPopup, mapProps} = vi.hoisted(() => ({
    getNearbyStores: vi.fn(),
    getDetailFilters: vi.fn(),
    push: vi.fn(),
    showErrorPopup: vi.fn(),
    mapProps: {current: null as MapPropsType | null},
}));

vi.mock('next/navigation', () => ({useRouter: () => ({push})}));
vi.mock('@/contracts/discovery/api', () => ({getNearbyStores, getDetailFilters}));
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

/** 검색필터 체크 항목 — 객실 4개 다음 편의시설 7개(받은 순서) */
const FILTER_ITEMS: Array<DiscoveryDetailFilterItemResultDto> = [
    {key: 'room_count', name: '방 2개 이상', group: 'ROOM_GROUP'},
    {key: 'has_shower', name: '샤워실', group: 'ROOM_GROUP'},
    {key: 'has_tv', name: 'TV', group: 'ROOM_GROUP'},
    {key: 'has_pc', name: 'PC', group: 'ROOM_GROUP'},
    {key: 'has_convenience_store', name: '편의점', group: 'STORE'},
    {key: 'has_cafe', name: '카페', group: 'STORE'},
    {key: 'has_hot_spring', name: '온천', group: 'STORE'},
    {key: 'is_pet_allowed', name: '반려동물 동반', group: 'STORE'},
    {key: 'has_meal', name: '식사 제공', group: 'STORE'},
    {key: 'is_delivery_allowed', name: '배달 음식', group: 'STORE'},
    {key: 'has_parking', name: '주차', group: 'STORE'},
];

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

/**
 * 지도 위 검색필터 버튼을 눌러 팝업을 열고, 열린 팝업을 돌려준다
 *
 * @param label 버튼 글자
 */
async function openSearchFilter(label: string): Promise<ReturnType<typeof within>> {
    await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: label}));
    });
    return within(document.querySelector('dialog[open]') as HTMLElement);
}

/**
 * 팝업의 적용을 누른다
 *
 * @param dialog 열린 팝업
 */
async function applySearchFilter(dialog: ReturnType<typeof within>): Promise<void> {
    await act(async () => {
        fireEvent.click(dialog.getByRole('button', {name: '적용'}));
    });
}

beforeEach(() => {
    getNearbyStores.mockReset();
    getDetailFilters.mockReset().mockResolvedValue({list: FILTER_ITEMS});
    push.mockClear();
    showErrorPopup.mockClear();
    mapProps.current = null;
});

describe('HomeContent', () => {
    it('[SUCCESS] 지도가 멈추면 그 중심 + 처음 거리 20km 로 조회 → 카드 · 핀, 핀을 누르면 업체 상세로', async () => {
        getNearbyStores.mockResolvedValue({list: [STORE], is_truncated: 0} satisfies DiscoveryStoreListResultDto);
        renderHome();

        await idle({latitude: 37.5, longitude: 127.03});

        expect(getNearbyStores).toHaveBeenCalledTimes(1);
        expect(getNearbyStores.mock.calls[0][0]).toMatchObject({latitude: '37.500000', longitude: '127.030000', radius_km: '20', detail_filter: null});
        expect(getNearbyStores.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
        expect(mapProps.current?.radiusKm).toBe(20);
        expect(mapProps.current?.myLocation).toEqual({latitude: 37.5, longitude: 127.03});
        expect(mapProps.current?.markers).toEqual([{id: STORE_ID, title: STORE.store_name, label: STORE.store_name, latitude: 37.501, longitude: 127.031, muted: false}]);
        expect(screen.getByRole('button', {name: '검색필터 · 20km 이내'}).getAttribute('aria-pressed')).toBe('false');
        expect(screen.queryByRole('button', {name: '5km'})).toBeNull();

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

    it('[SUCCESS] 검색필터에서 거리 10km · "PC"(객실) · "온천"(편의시설)을 고르고 적용한다 → 항목 1번(새 주소) · 거리 · 객실 · 편의시설 묶음 → 업체 검색 1번(10km · has_pc,has_hot_spring) → 버튼 글자', async () => {
        getNearbyStores.mockResolvedValue({list: [STORE], is_truncated: 0});
        renderHome();
        await idle({latitude: 37.5, longitude: 127.03});

        const dialog = await openSearchFilter('검색필터 · 20km 이내');
        expect(getDetailFilters).toHaveBeenCalledTimes(1);
        expect(dialog.getByRole('heading', {name: '검색필터'})).toBeTruthy();

        // 거리 한 줄 · 묶음마다 체크박스(받은 순서)
        expect(within(dialog.getByRole('group', {name: '거리'})).getAllByRole('button').map((chip) => chip.textContent)).toEqual(['5km', '10km', '20km', '50km', '제한 없음']);
        expect(dialog.getByRole('button', {name: '20km'}).getAttribute('aria-pressed')).toBe('true');
        expect(within(dialog.getByRole('group', {name: '객실'})).getAllByRole('checkbox').map((box) => box.closest('label')?.textContent)).toEqual(['방 2개 이상', '샤워실', 'TV', 'PC']);
        expect(within(dialog.getByRole('group', {name: '편의시설'})).getAllByRole('checkbox').map((box) => box.closest('label')?.textContent)).toEqual(['편의점', '카페', '온천', '반려동물 동반', '식사 제공', '배달 음식', '주차']);

        // 고르는 동안은 부르지 않는다
        fireEvent.click(dialog.getByRole('button', {name: '10km'}));
        fireEvent.click(dialog.getByRole('checkbox', {name: '온천'}));
        fireEvent.click(dialog.getByRole('checkbox', {name: 'PC'}));
        expect(getNearbyStores).toHaveBeenCalledTimes(1);
        await applySearchFilter(dialog);

        expect(getNearbyStores).toHaveBeenCalledTimes(2);
        expect(getNearbyStores.mock.calls[1][0]).toMatchObject({latitude: '37.500000', longitude: '127.030000', radius_km: '10', detail_filter: 'has_pc,has_hot_spring'});
        expect(mapProps.current?.radiusKm).toBe(10);
        expect(document.querySelector('dialog[open]')).toBeNull();
        expect(screen.getByRole('button', {name: '검색필터 · 10km 이내 · 편의시설 2개'}).getAttribute('aria-pressed')).toBe('true');
    });

    it('[SUCCESS] 다시 열어 "초기화" 뒤 적용한다 → 거리 20km · 체크 해제 → 업체 검색(20km · 필터 없이) · 항목은 다시 읽지 않는다', async () => {
        getNearbyStores.mockResolvedValue({list: [STORE], is_truncated: 0});
        renderHome();
        await idle({latitude: 37.5, longitude: 127.03});

        let dialog = await openSearchFilter('검색필터 · 20km 이내');
        fireEvent.click(dialog.getByRole('button', {name: '50km'}));
        fireEvent.click(dialog.getByRole('checkbox', {name: '주차'}));
        await applySearchFilter(dialog);
        expect(getNearbyStores.mock.calls[1][0]).toMatchObject({radius_km: '50', detail_filter: 'has_parking'});

        // 다시 열면 적용 중인 값 → 초기화 → 적용
        dialog = await openSearchFilter('검색필터 · 50km 이내 · 편의시설 1개');
        expect(dialog.getByRole('button', {name: '50km'}).getAttribute('aria-pressed')).toBe('true');
        expect((dialog.getByRole('checkbox', {name: '주차'}) as HTMLInputElement).checked).toBe(true);
        fireEvent.click(dialog.getByRole('button', {name: '초기화'}));
        expect(dialog.getByRole('button', {name: '20km'}).getAttribute('aria-pressed')).toBe('true');
        expect((dialog.getByRole('checkbox', {name: '주차'}) as HTMLInputElement).checked).toBe(false);
        await applySearchFilter(dialog);

        expect(getDetailFilters).toHaveBeenCalledTimes(1);
        expect(getNearbyStores).toHaveBeenCalledTimes(3);
        expect(getNearbyStores.mock.calls[2][0]).toMatchObject({latitude: '37.500000', longitude: '127.030000', radius_km: '20', detail_filter: null});
        expect(screen.getByRole('button', {name: '검색필터 · 20km 이내'}).getAttribute('aria-pressed')).toBe('false');
    });

    it('[SUCCESS] 검색필터에서 "제한 없음"을 골라 적용하면 같은 중심 · radius_km ALL 로 한 번 더 — 반경 원은 그리지 않는다', async () => {
        getNearbyStores.mockResolvedValue({list: [STORE], is_truncated: 0});
        renderHome();
        await idle({latitude: 37.5, longitude: 127.03});

        const dialog = await openSearchFilter('검색필터 · 20km 이내');
        fireEvent.click(dialog.getByRole('button', {name: '제한 없음'}));
        await applySearchFilter(dialog);

        expect(getNearbyStores).toHaveBeenCalledTimes(2);
        expect(getNearbyStores.mock.calls[1][0]).toMatchObject({latitude: '37.500000', longitude: '127.030000', radius_km: 'ALL', detail_filter: null});
        expect(mapProps.current?.radiusKm).toBeUndefined();
        expect(screen.getByRole('button', {name: '검색필터'})).toBeTruthy();
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

    it('[FAIL:error] 실패하면 안내하고, 같은 중심으로 다시 멈추면 다시 부른다 — 검색필터로 거리를 바꾸면 내 위치가 아니라 지도 중심으로', async () => {
        getNearbyStores
            .mockRejectedValueOnce(new ApiError(500, {message: '잠시 뒤 다시 시도해 주세요.', validation_errors: null}))
            .mockResolvedValue({list: [STORE], is_truncated: 0});
        renderHome();

        await idle({latitude: 37.6, longitude: 127.1});
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('잠시 뒤 다시 시도해 주세요.');

        await idle({latitude: 37.6, longitude: 127.1});
        const dialog = await openSearchFilter('검색필터 · 20km 이내');
        fireEvent.click(dialog.getByRole('button', {name: '10km'}));
        await applySearchFilter(dialog);

        expect(getNearbyStores).toHaveBeenCalledTimes(3);
        expect(getNearbyStores.mock.calls[1][0]).toMatchObject({latitude: '37.600000', longitude: '127.100000', radius_km: '20'});
        expect(getNearbyStores.mock.calls[2][0]).toMatchObject({latitude: '37.600000', longitude: '127.100000', radius_km: '10'});
    });

    it('[FAIL:truncated] 300곳을 넘어 잘렸으면 검색필터에서 거리를 줄이거나 조건을 더하라는 안내', async () => {
        getNearbyStores.mockResolvedValue({list: [STORE], is_truncated: 1});
        renderHome();

        await idle({latitude: 37.5, longitude: 127.03});

        expect(screen.getByText('업체가 많아 가까운 300곳만 보여요. 검색필터에서 거리를 줄이거나 조건을 더해 보세요.')).toBeTruthy();
    });

    it('[FAIL:empty] 빈 목록이면 빈 안내 — 카드 없음', async () => {
        getNearbyStores.mockResolvedValue({list: [], is_truncated: 0});
        renderHome();

        await idle({latitude: 37.5, longitude: 127.03});

        expect(screen.getByText('이 거리 안에 업체가 없어요')).toBeTruthy();
        expect(screen.getByText('검색필터에서 거리를 넓히거나 지도를 옮겨 보세요.')).toBeTruthy();
        expect(screen.queryByRole('link', {name: /스테이/})).toBeNull();
    });
});
