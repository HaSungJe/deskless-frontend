'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useRef, useState } from 'react';
import { getNearbyStores, getRoomGroupDetailFilters } from '@/contracts/discovery/api';
import { DiscoveryRoomGroupDetailFilterItemResultDto, DiscoveryRoomGroupDetailFilterListResultDto } from '@/contracts/discovery/dto/discovery-room-group-detail-filter.dto';
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
import { SITE_NAME } from '@/shared/utils/site';
import DetailFilterModal from './_components/DetailFilterModal';
import { formatDistance } from './distance';
import styles from '@/app/css/user/HomeContent.module.css';

/** 반경(km) — DiscoveryStoreListDto.radius_km 의 값, ALL 은 거리 제한 없음(가까운 순 300곳 — frontend/changes/2026-11-22-discovery-filter.md) */
const RADIUS_OPTIONS = [5, 10, 20, 50, 'ALL'] as const;

type RadiusType = typeof RADIUS_OPTIONS[number];

/** 처음 반경 — 사용자 결정 2026-11-16 */
const DEFAULT_RADIUS: RadiusType = 20;

/** 같은 중심으로 보는 차이(도 — 약 11m) — 반경 맞춤(setBounds) 뒤 중심이 조금 흔들려도 같은 조회를 또 부르지 않게 */
const SAME_CENTER_EPSILON = 0.0001;

/** 조회 결과가 비었을 때(본문 없음) */
const EMPTY_RESULT: DiscoveryStoreListResultDto = {list: [], is_truncated: 0};

/** 사진 자리 아이콘 — 시안 user.html:415 */
const PHOTO_ICON = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" /></svg>;

/** 조회 중심 · 반경 */
type StoreQueryType = MapPointType & {
    radiusKm: RadiusType;  // 반경(km) · ALL
    detailFilter: string; // 추가정보 필터 키(쉼표 — 항목 순서), 없으면 ''
};

/**
 * U1 지도 · 주변 업체 — 내 위치 · 지도 중심 · 반경(제한 없음 포함) · 추가정보 필터로 주변 업체를 불러 지도 핀과 목록에 그린다
 *
 * @returns
 */
export default function HomeContent(): React.ReactNode {
    // 변수
    const router = useRouter();                                    // 핀을 누르면 업체 상세로
    const auth = useContext(AuthContext);                          // 로그인했으면 "내 예약", 아니면 "로그인"
    const {location, isDefault, loading} = useMyLocation();        // 내 위치 — 못 읽으면 서울시청
    const lastQueryRef = useRef<StoreQueryType | null>(null);      // 마지막 조회 — 같은 조회를 거른다(실패하면 비워 다음에 다시)
    const centerRef = useRef<MapPointType | null>(null);           // 마지막으로 멈춘 지도 중심 — 반경만 바꿀 때 쓴다(실패해도 둔다)
    const abortRef = useRef<AbortController | null>(null);          // 진행 중 조회 — 새 조회가 시작되면 취소

    // 상태
    const [radiusKm, setRadiusKm] = useState<RadiusType>(DEFAULT_RADIUS);                                            // 고른 반경
    const [result, setResult] = useState<DiscoveryStoreListResultDto | null>(null);                                  // 마지막 조회 결과 — 아직 없으면 null
    const [detailKeys, setDetailKeys] = useState<Array<string>>([]);                                                 // 적용 중인 추가정보 필터 키(항목 순서)
    const [filterOpen, setFilterOpen] = useState<boolean>(false);                                                    // 추가정보 필터 팝업
    const [filterItems, setFilterItems] = useState<Array<DiscoveryRoomGroupDetailFilterItemResultDto> | null>(null); // 필터 항목 — 처음 열 때 한 번 받는다
    const [filterFailed, setFilterFailed] = useState<boolean>(false);                                                // 필터 항목을 못 받음

    // 계산 값
    const stores = result?.list ?? [];                          // 업체 목록(가까운 순 — 응답 그대로)
    const markers: Array<MapMarkerType> = stores.map(toMarker); // 지도 핀
    const myLocation = isDefault ? null : location;             // 내 위치 점 — 기본 위치(서울시청)면 그리지 않음
    const detailFilter = detailKeys.join(',');                  // 조회에 넣을 추가정보 필터
    const circleKm = radiusKm === 'ALL' ? undefined : radiusKm; // 반경 원 — 제한 없음이면 그리지 않는다

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
        const dto = new DiscoveryStoreListDto({latitude: query.latitude.toFixed(6), longitude: query.longitude.toFixed(6), radius_km: String(query.radiusKm), detail_filter: query.detailFilter || null});

        // try 안에는 await 만 — 값 갈래(??, ?:)가 try 안에 있으면 React Compiler 가 이 컴포넌트를 건너뛴다
        let found: DiscoveryStoreListResultDto | null;
        try {
            found = await getNearbyStores(dto, controller.signal);
        } catch (error) {
            if (lastQueryRef.current === query) {
                lastQueryRef.current = null; // 실패한 조회는 다음 idle 에 다시
            }
            handleApiError(error);
            return;
        }

        if (!controller.signal.aborted) {
            setResult(found ?? EMPTY_RESULT);
        }
    }

    function idle(center: MapPointType): void {
        // 지도가 멈춤 — 그 중심 + 고른 반경 · 추가정보 필터로
        centerRef.current = center;
        search({...center, radiusKm, detailFilter});
    }

    function changeRadius(next: RadiusType): void {
        // 반경 — 마지막으로 멈춘 중심(없으면 내 위치)으로 바로 다시. 지도는 StoreMap 이 원에 맞춰 확대하고, 그 뒤 idle 은 같은 조회라 걸러진다
        setRadiusKm(next);
        const center = centerRef.current ?? location;
        if (center) {
            search({latitude: center.latitude, longitude: center.longitude, radiusKm: next, detailFilter});
        }
    }

    async function openFilter(): Promise<void> {
        // 추가정보 필터 팝업 — 항목은 처음 열 때 한 번(못 받았으면 다음에 열 때 다시)
        setFilterOpen(true);
        if (filterItems) {
            return;
        }

        setFilterFailed(false);
        let found: DiscoveryRoomGroupDetailFilterListResultDto | null = null; // 필터 항목
        let failure: {error: unknown} | null = null;                         // 실패 — 처리는 try 밖에서
        try {
            found = await getRoomGroupDetailFilters();
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setFilterFailed(true);
            handleApiError(failure.error);
            return;
        }

        setFilterItems(found?.list ?? []);
    }

    function applyFilter(keys: Array<string>): void {
        // 추가정보 필터 적용 — 마지막으로 멈춘 중심(없으면 내 위치)으로 바로 다시, 아무것도 고르지 않으면 필터 없이
        setDetailKeys(keys);
        setFilterOpen(false);
        const center = centerRef.current ?? location;
        if (center) {
            search({latitude: center.latitude, longitude: center.longitude, radiusKm, detailFilter: keys.join(',')});
        }
    }

    function openStore(id: string): void {
        // 핀 → 업체 상세
        router.push(storePath(id));
    }

    return (
        // 지도 · 주변 업체
        <div className={styles.home}>
            {/* 머리 — 서비스 이름 · 로그인(로그인 전만 — 내 예약 · 내 정보는 하단 탭, 머리 오른쪽은 다른 화면에서 "지금 위치" 자리라 바로가기를 두지 않는다) */}
            <header className={styles.header}>
                <strong className={styles.brand}>{SITE_NAME}</strong>
                {auth.isLogin ? null : <Link href={loginUrl('user', '/')} className={styles.headerLink}>로그인</Link>}
            </header>

            {/* 지도 · 반경 */}
            <section className={styles.mapArea} aria-label="지도">
                {loading || !location
                    ? <div className={styles.locating}>내 위치를 확인하고 있어요</div>
                    : <StoreMap center={location} markers={markers} radiusKm={circleKm} myLocation={myLocation} onIdle={idle} onMarkerClick={openStore} />}
                <div className={styles.radius}>
                    {/* 추가정보 필터 — 맨 앞(반경 칩이 가로로 밀려도 보이게) */}
                    <Chip pressed={detailKeys.length > 0} onClick={openFilter}>{detailKeys.length > 0 ? `추가정보 ${detailKeys.length}` : '추가정보'}</Chip>
                    <div className={styles.radiusChips} role="group" aria-label="반경">
                        {RADIUS_OPTIONS.map((option) => (
                            <Chip key={option} pressed={option === radiusKm} onClick={() => changeRadius(option)}>{radiusLabel(option)}</Chip>
                        ))}
                    </div>
                </div>
            </section>

            {/* 300곳 넘음 */}
            {result?.is_truncated === 1 ? <Band tone="info">업체가 많아 가까운 300곳만 보여요. {radiusKm === 'ALL' ? '지도를 옮기거나' : '반경을 줄이거나'} 추가정보 필터를 더해 보세요.</Band> : null}

            {/* 주변 업체 */}
            <section className={styles.list} aria-labelledby="home-list-title">
                <div className={styles.listHead}>
                    <h2 id="home-list-title" className={styles.listTitle}>주변 업체</h2>
                    <span className={styles.listSort}>가까운 순</span>
                </div>

                {/* 빈 목록 */}
                {result && stores.length === 0 ? <EmptyState title={detailKeys.length > 0 ? '조건에 맞는 업체가 없어요' : '이 반경에 업체가 없어요'} description={detailKeys.length > 0 ? '추가정보 필터를 줄이거나 반경을 넓혀 보세요.' : '반경을 넓히거나 지도를 옮겨 보세요.'} /> : null}

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

            {/* 추가정보 필터 */}
            <DetailFilterModal open={filterOpen} items={filterItems} failed={filterFailed} selected={detailKeys} onApply={applyFilter} onClose={() => setFilterOpen(false)} />
        </div>
    );
}

/**
 * 반경 칩 글자 — 5km · … · 제한 없음
 *
 * @param option 반경
 */
function radiusLabel(option: RadiusType): string {
    return option === 'ALL' ? '제한 없음' : `${option}km`;
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
 * 같은 조회인지 — 반경 · 추가정보 필터가 같고 중심 차이가 SAME_CENTER_EPSILON 미만
 *
 * @param last 마지막 조회
 * @param next 새 조회
 */
function isSameQuery(last: StoreQueryType | null, next: StoreQueryType): boolean {
    return last !== null
        && last.radiusKm === next.radiusKm
        && last.detailFilter === next.detailFilter
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
