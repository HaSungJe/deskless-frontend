# Plan — 업체 편의시설 — 켜고 끄기 · 보기 · 검색필터

> 무엇을·왜는 [spec](../../spec/store/store-facility-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 진입점마다 비즈니스 로직 전체 ② 계산 함수 ③ 규약만으로 예측할 수 없는 데이터 규칙
> **싣지 않는 것** DTO 사본, 형제와 같은 contracts 함수 · 탭 등록 — 따르는 패턴을 표 한 줄로 가리킨다

백엔드 수정 요청 `frontend/changes/2026-11-24-store-facility.md` 를 이 plan 하나로 만든다(로드맵 밖). 지도의 "추가정보" 팝업은 거리까지 담은 "검색필터" 팝업이 되고(사용자 요청), 편의시설 순서 · 이름은 객실 옵션(`ROOM_GROUP_OPTIONS`)과 같은 모양의 표 하나를 세 화면이 같이 쓴다.

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/contracts/store/dto/store-mine-detail.dto.ts` · `src/contracts/discovery/dto/discovery-detail-filter.dto.ts` | 신규 | 요청서 DTO 사본 | 생략 (아래 4) |
| `src/contracts/discovery/dto/discovery-room-group-detail-filter.dto.ts` | 삭제 | 옛 필터 항목(백엔드가 주소를 없앤다) | — |
| `src/contracts/discovery/dto/discovery-store-detail.dto.ts` · `src/contracts/store/dto/store-mine.dto.ts` · `store-detail.dto.ts` · `src/contracts/discovery/dto/discovery-store-list.dto.ts` | 수정 | `store_detail` 칸 + 편의시설 클래스, `detail_filter` 설명 | 생략 (아래 4) |
| `src/contracts/discovery/api.ts` | 수정 | `getRoomGroupDetailFilters` → `getDetailFilters`(`/user-service/discovery/detail-filter`) | 생략 (아래 4) |
| `src/contracts/store/api.ts` | 수정 | `updateMyStoreFacility` — PUT `/admin-service/store/mine/detail`(큐) | 생략 (아래 4) |
| `src/contracts/common/store.constants.ts` | 수정 | 편의시설 순서 · 이름 표 · `storeFacilityLabels` | 아래 2-3 · 3-1 |
| `src/contracts/common/room.constants.ts` | 수정 | 주석 — "반려동물 동반 · 배달 가능"은 업체 편의시설로 갔다 | 아래 3-1 |
| `src/app/(user)/_components/search-filter.ts` | 신규 | 거리 값 · 글자(HomeContent 에서 옮김) · 버튼 글자 · 묶음 나누기 | 아래 2-1 · 2-2 · 3-3 |
| `src/app/(user)/_components/DetailFilterModal.tsx` → `SearchFilterModal.tsx` · `src/app/css/user/DetailFilterModal.module.css` → `SearchFilterModal.module.css` | 이름 바꿈 · 수정 | "검색필터" 팝업 — 거리 한 줄 · 묶음 체크 | 아래 1-1 |
| `src/app/(user)/HomeContent.tsx` · `src/app/css/user/HomeContent.module.css` | 수정 | 거리 칩 줄 → 검색필터 버튼 하나, 적용 한 곳 | 아래 1-1 |
| `src/app/(user)/stores/[store_id]/StoreDetailContent.tsx` | 수정 | 소개 아래 편의시설 칩 | 아래 1-2 |
| `src/app/manager/(console)/store/_components/StoreFacilityTab.tsx` · `src/app/css/manager/StoreFacilityTab.module.css` | 신규 | 편의시설 탭 — 스위치 7개 · 저장 | 아래 1-3 · 5 |
| `src/app/manager/(console)/store/store-settings-format.ts` | 수정 | 탭 "편의시설" · 칸 ↔ 보낼 값 | 아래 3-2 |
| `src/app/manager/(console)/store/StoreSettingsContent.tsx` | 수정 | 편의시설 탭 그리기 | 생략 (아래 4) |
| `src/app/admin/(console)/stores/[store_id]/AdminStoreDetailContent.tsx` | 수정 | 운영 규정 카드 "편의시설" 한 줄 | 아래 1-4 |
| 테스트 새 3파일 · 고친 5파일(아래 테스트) | 신규 · 수정 | spec 13건 · 바뀐 화면의 기존 기대값 | 아래 테스트 |
| `AGENTS.md` · `docs/data-layer.md` · `docs/architecture.md` | 수정 | 편의시설 표 위치 · 반영한 수정 요청 · 검색필터 팝업 이름 | 만드는 순서 8 |

---

## 1. 비즈니스 로직 — 화면별 코드

### 1-1. 지도 검색필터 — `HomeContent` · `SearchFilterModal`

홈은 버튼 하나와 적용 한 곳만 남는다 — 거리 칩 줄(`changeRadius`)을 지우고, 거리 · 체크를 팝업에서 함께 받아 한 번 검색한다. 아래는 바뀌는 부분만(그 밖은 그대로).

```tsx
// src/app/(user)/HomeContent.tsx — import
import { getDetailFilters, getNearbyStores } from '@/contracts/discovery/api';
import { DiscoveryDetailFilterItemResultDto, DiscoveryDetailFilterListResultDto } from '@/contracts/discovery/dto/discovery-detail-filter.dto';
import SearchFilterModal from './_components/SearchFilterModal';
import { DEFAULT_RADIUS, RadiusType, searchFilterLabel } from './_components/search-filter';
// RADIUS_OPTIONS · RadiusType · DEFAULT_RADIUS · radiusLabel 정의는 search-filter.ts 로 옮기고 여기서 지운다

// 상태 — 필터 항목 타입만 바뀐다
    const [filterItems, setFilterItems] = useState<Array<DiscoveryDetailFilterItemResultDto> | null>(null); // 검색필터 체크 항목 — 처음 열 때 한 번 받는다

// 계산 값 — 한 줄 더함
    const filterLabel = searchFilterLabel(radiusKm, detailKeys.length); // ① 검색필터 버튼 글자

// 함수 — changeRadius 는 지운다(거리는 팝업에서 적용과 함께)
    async function openFilter(): Promise<void> {
        // ② 검색필터 팝업 — 체크 항목은 처음 열 때 한 번(못 받았으면 다음에 열 때 다시)
        setFilterOpen(true);
        if (filterItems) {
            return;
        }

        setFilterFailed(false);
        let found: DiscoveryDetailFilterListResultDto | null = null; // 체크 항목
        let failure: {error: unknown} | null = null;                 // 실패 — 처리는 try 밖에서
        try {
            found = await getDetailFilters();
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

    function applyFilter(nextRadius: RadiusType, keys: Array<string>): void {
        // ④ 검색필터 적용 — 거리 · 체크를 한 번에, 마지막으로 멈춘 중심(없으면 내 위치)으로. 지도는 StoreMap 이 원에 맞춰 확대하고, 그 뒤 idle 은 같은 조회라 걸러진다
        setRadiusKm(nextRadius);
        setDetailKeys(keys);
        setFilterOpen(false);
        const center = centerRef.current ?? location;
        if (center) {
            search({latitude: center.latitude, longitude: center.longitude, radiusKm: nextRadius, detailFilter: keys.join(',')});
        }
    }

// JSX — 지도 위 줄 · 안내 문구 · 팝업
                <div className={styles.filterBar}>
                    {/* ① 검색필터 — 거리 · 체크는 팝업 안(눌린 표시는 체크가 있을 때) */}
                    <Chip pressed={detailKeys.length > 0} onClick={openFilter}>{filterLabel}</Chip>
                </div>

            {/* 300곳 넘음 */}
            {result?.is_truncated === 1 ? <Band tone="info">업체가 많아 가까운 300곳만 보여요. {radiusKm === 'ALL' ? '검색필터에서 조건을 더하거나 지도를 옮겨 보세요.' : '검색필터에서 거리를 줄이거나 조건을 더해 보세요.'}</Band> : null}

                {/* 빈 목록 */}
                {result && stores.length === 0 ? <EmptyState title={detailKeys.length > 0 ? '조건에 맞는 업체가 없어요' : '이 거리 안에 업체가 없어요'} description={detailKeys.length > 0 ? '검색필터에서 조건을 줄이거나 거리를 넓혀 보세요.' : '검색필터에서 거리를 넓히거나 지도를 옮겨 보세요.'} /> : null}

            {/* 검색필터 */}
            <SearchFilterModal open={filterOpen} items={filterItems} failed={filterFailed} radiusKm={radiusKm} selected={detailKeys} onApply={applyFilter} onClose={() => setFilterOpen(false)} />
```

`DEFAULT_RADIUS` 는 처음 상태(`useState<RadiusType>(DEFAULT_RADIUS)`)에 그대로 쓴다.

팝업 — 열릴 때마다 본문을 새로 그려 고르던 값이 적용 중인 값으로 돌아간다(지금 구조 그대로). 항목을 못 읽어도 거리만 골라 적용할 수 있게 "적용"을 막지 않는다.

```tsx
// src/app/(user)/_components/SearchFilterModal.tsx (DetailFilterModal.tsx 에서 이름 바꿈)
'use client';
import { useState } from 'react';
import { DiscoveryDetailFilterItemResultDto } from '@/contracts/discovery/dto/discovery-detail-filter.dto';
import Button from '@/shared/components/ui/button/Button';
import Chip from '@/shared/components/ui/form/Chip';
import Modal from '@/shared/components/ui/modal/Modal';
import { DEFAULT_RADIUS, groupDetailFilters, RADIUS_OPTIONS, radiusLabel, RadiusType, SEARCH_FILTER_NAME } from './search-filter';
import styles from '@/app/css/user/SearchFilterModal.module.css';

type SearchFilterModalProps = {
    open: boolean;                                           // 열림
    items: Array<DiscoveryDetailFilterItemResultDto> | null; // 체크 항목(백엔드가 준 순서) — 받기 전 · 못 받았으면 null
    failed: boolean;                                         // 체크 항목을 못 받음
    radiusKm: RadiusType;                                    // 적용 중인 거리
    selected: Array<string>;                                 // 적용 중인 항목 키
    onApply: (radiusKm: RadiusType, keys: Array<string>) => void; // 적용 — 거리 · 항목 순서대로 고른 키(없으면 빈 배열)
    onClose: () => void;                                     // 닫기 — 아무것도 바꾸지 않는다
};

type SearchFilterBodyProps = Omit<SearchFilterModalProps, 'open'>;

/** 체크 항목 안내 — 객실 · 편의시설이 거르는 방식이 다르다(요청서) */
const ITEMS_DESCRIPTION = '객실 조건은 그 조건을 모두 갖춘 객실이 있는 업체, 편의시설은 그 시설이 있는 업체만 보여요.';

/**
 * 검색필터 팝업 — 맨 위 거리 한 줄, 아래 백엔드가 준 체크 항목을 묶음(객실 · 편의시설)마다(항목은 화면에 적지 않는다)
 *
 * @param param0
 * @returns
 */
export default function SearchFilterModal({open, onClose, ...bodyProps}: SearchFilterModalProps): React.ReactNode {
    return (
        // 팝업 — 열릴 때마다 본문을 새로 그려 고르던 값이 적용 중인 값으로 돌아간다
        <Modal open={open} title={SEARCH_FILTER_NAME} onClose={onClose}>
            <SearchFilterBody onClose={onClose} {...bodyProps} />
        </Modal>
    );
}

/**
 * 검색필터 본문 — 거리 · 묶음 체크박스 · 닫기 · 초기화 · 적용
 *
 * @param param0
 * @returns
 */
function SearchFilterBody({items, failed, radiusKm, selected, onApply, onClose}: SearchFilterBodyProps): React.ReactNode {
    // 상태
    const [radius, setRadius] = useState<RadiusType>(radiusKm);      // 고르는 중인 거리 — 처음은 적용 중인 값
    const [checked, setChecked] = useState<Array<string>>(selected); // 고르는 중인 항목 키 — 처음은 적용 중인 값

    // 계산 값
    const groups = items ? groupDetailFilters(items) : null; // ③ 객실 · 편의시설 묶음(받은 순서) — 받기 전 null

    // 함수
    function toggle(key: string, on: boolean): void {
        // ③ 체크박스 하나
        setChecked((prev) => (on ? [...prev, key] : prev.filter((item) => item !== key)));
    }

    function reset(): void {
        // ③ 초기화 — 거리 20km · 체크 해제(적용을 눌러야 검색)
        setRadius(DEFAULT_RADIUS);
        setChecked([]);
    }

    function apply(): void {
        // ④ 거리 · 항목 순서대로 고른 키를 넘긴다(묶음과 상관없이)
        onApply(radius, (items ?? []).map((item) => item.key).filter((key) => checked.includes(key)));
    }

    return (
        // 본문
        <>
            {/* ③ 거리 — 한 줄 */}
            <div className={styles.section} role="group" aria-labelledby="search-filter-radius">
                <h3 id="search-filter-radius" className={styles.sectionTitle}>거리</h3>
                <div className={styles.radius}>
                    {RADIUS_OPTIONS.map((option) => <Chip key={option} pressed={option === radius} onClick={() => setRadius(option)}>{radiusLabel(option)}</Chip>)}
                </div>
            </div>

            {/* ③ 체크 항목 — 묶음마다 제목 · 아래로 */}
            <p className={styles.description}>{ITEMS_DESCRIPTION}</p>
            {groups === null ? <p className={styles.state}>{failed ? '항목을 불러오지 못했어요. 닫고 다시 열어 주세요.' : '항목을 불러오고 있어요'}</p> : null}
            {groups?.map((group) => (
                <div key={group.group} className={styles.section} role="group" aria-labelledby={`search-filter-${group.group}`}>
                    <h3 id={`search-filter-${group.group}`} className={styles.sectionTitle}>{group.name}</h3>
                    <div className={styles.list}>
                        {group.items.map((item) => (
                            <label key={item.key} className={styles.item}>
                                <input type="checkbox" checked={checked.includes(item.key)} onChange={(event) => toggle(item.key, event.target.checked)} />
                                {item.name}
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            {/* 버튼 줄 — 항목을 못 읽어도 거리만 골라 적용할 수 있다 */}
            <div className={styles.actions}>
                <Button onClick={onClose}>닫기</Button>
                <Button onClick={reset}>초기화</Button>
                <Button variant="primary" onClick={apply}>적용</Button>
            </div>
        </>
    );
}
```

### 1-2. 업체 상세 편의시설 — `StoreDetailContent`

```tsx
// src/app/(user)/stores/[store_id]/StoreDetailContent.tsx
import { storeFacilityLabels } from '@/contracts/common/store.constants';

// 계산 값 — 한 줄 더함(storeMarkers 다음)
    const facilities = store ? storeFacilityLabels(store.store_detail) : []; // ② 켜진 편의시설 이름(정한 순서)

// JSX — 소개 다음, 위치 지도 앞(객실 옵션 칩과 같은 css)
                                {/* ③ 편의시설 — 켜진 것만, 없으면 칸 숨김 */}
                                {facilities.length > 0 ? (
                                    <div className={styles.options} role="group" aria-label="편의시설">
                                        {facilities.map((label) => <span key={label} className={styles.option}>{label}</span>)}
                                    </div>
                                ) : null}
```

### 1-3. 내 업체 설정 편의시설 탭 — `StoreFacilityTab`

저장 · 다시 읽기는 기본 정보 탭(`StoreProfileTab.tsx:51` `save`)과 같다. 칸은 스위치라 값이 0 · 1 밖으로 나갈 수 없지만, 규약대로 보내기 전에 `validateAction` 을 부른다(칸 옆 자리가 없으니 걸리면 오류 팝업).

```tsx
// src/app/manager/(console)/store/_components/StoreFacilityTab.tsx
'use client';
import { useContext, useState } from 'react';
import { STORE_FACILITY_OPTIONS } from '@/contracts/common/store.constants';
import { updateMyStoreFacility } from '@/contracts/store/api';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import Switch from '@/shared/components/ui/form/Switch';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import { facilityDtoOf, facilityFormOf, FacilityFormType } from '../store-settings-format';
import styles from '@/app/css/manager/StoreFacilityTab.module.css';

type StoreFacilityTabProps = {
    store: StoreMineResultDto;    // 내 업체 상세 — store_detail 이 처음 값
    onSaved: () => Promise<void>; // 저장 뒤 다시 읽기
};

/**
 * 편의시설 탭 — 스위치 7개(편의점 · 카페 · 온천 · 반려동물 동반 · 식사 제공 · 배달 음식 · 주차) · 저장(7개 모두 — 통째로 교체)
 *
 * @param param0
 * @returns
 */
export default function StoreFacilityTab({store, onSaved}: StoreFacilityTabProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [form, setForm] = useState<FacilityFormType>(() => facilityFormOf(store.store_detail)); // ② 스위치 — 처음은 내 업체 값
    const [saving, setSaving] = useState<boolean>(false);                                         // 저장 중

    // 함수
    async function save(): Promise<void> {
        // ③ 7개 모두 0 · 1 → 저장(큐) → ④ 다시 읽기
        const dto = facilityDtoOf(form);
        if (saving || !(await validateAction(dto))) {
            return;
        }

        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateMyStoreFacility(auth, dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setSaving(false);
            handleApiError(failure.error);
            return;
        }

        await onSaved();
        setSaving(false);
    }

    return (
        // 편의시설
        <Card title="편의시설">
            <div className={styles.body}>
                {/* 안내 */}
                <p className={styles.hint}>켜 둔 편의시설이 이용자 화면의 업체 상세에 보이고, 지도 검색필터로 찾을 수 있습니다.</p>

                {/* ② 스위치 7개 — 정한 순서 */}
                <div className={styles.switches} role="group" aria-label="편의시설">
                    {STORE_FACILITY_OPTIONS.map((option) => <Switch key={option.key} label={option.label} checked={form[option.key]} onChange={(checked) => setForm((prev) => ({...prev, [option.key]: checked}))} />)}
                </div>

                {/* ③ 저장 */}
                <div className={styles.actions}><Button variant="primary" disabled={saving} onClick={save}>{saving ? '처리 중…' : '저장'}</Button></div>
            </div>
        </Card>
    );
}
```

### 1-4. 관리자 업체 상세 편의시설 — `AdminStoreDetailContent`

```tsx
// src/app/admin/(console)/stores/[store_id]/AdminStoreDetailContent.tsx — 운영 규정 dl 의 업체 소개 다음 한 줄
import { STORE_STATE, storeFacilityLabels } from '@/contracts/common/store.constants';

                        <dt>편의시설</dt><dd>{storeFacilityLabels(store.store_detail).join(' · ') || '—'}</dd>
```

---

## 2. 계산 함수

### 2-1. 검색필터 버튼 글자 — `src/app/(user)/_components/search-filter.ts` `searchFilterLabel`

```ts
/**
 * 검색필터 버튼 글자 — 거리를 정해 두면 "N km 이내", 체크한 것이 있으면 "편의시설 N개"(객실 항목도 합쳐 센다 — 사용자 결정), 둘 다 없으면 "검색필터"
 *
 * @param radiusKm 적용 중인 거리
 * @param checkedCount 적용 중인 체크 수
 */
export function searchFilterLabel(radiusKm: RadiusType, checkedCount: number): string {
    const parts = [radiusKm === 'ALL' ? '' : `${radiusKm}km 이내`, checkedCount > 0 ? `편의시설 ${checkedCount}개` : ''].filter(Boolean);
    return [SEARCH_FILTER_NAME, ...parts].join(' · ');
}
```

### 2-2. 필터 항목 묶음 나누기 — `src/app/(user)/_components/search-filter.ts` `groupDetailFilters`

```ts
/** 체크 항목 묶음 — 묶음 값 · 제목 · 항목(받은 순서) */
export type DetailFilterGroupType = {
    group: string;                                  // 묶음 값(ROOM_GROUP · STORE · 처음 보는 묶음은 ETC)
    name: string;                                   // 묶음 제목
    items: Array<DiscoveryDetailFilterItemResultDto>; // 항목(받은 순서)
};

/** 아는 묶음의 제목 — Map 이라 상속 이름에 속지 않는다 */
const GROUP_NAMES = new Map<string, string>([['ROOM_GROUP', '객실'], ['STORE', '편의시설']]);

/** 처음 보는 묶음 — 맨 뒤에 모은다(백엔드가 묶음을 더해도 항목이 사라지지 않게) */
const OTHER_GROUP: Omit<DetailFilterGroupType, 'items'> = {group: 'ETC', name: '기타'};

/**
 * 체크 항목을 묶음으로 — 아는 묶음은 처음 나온 순서대로, 처음 보는 묶음의 항목은 맨 뒤 "기타", 빈 묶음은 없다
 *
 * @param items 받은 체크 항목(보일 순서)
 */
export function groupDetailFilters(items: Array<DiscoveryDetailFilterItemResultDto>): Array<DetailFilterGroupType> {
    const known: Array<DetailFilterGroupType> = [];
    const others: Array<DiscoveryDetailFilterItemResultDto> = [];
    for (const item of items) {
        const name = GROUP_NAMES.get(item.group);
        if (name === undefined) {
            others.push(item);
            continue;
        }

        const found = known.find((group) => group.group === item.group);
        if (found) {
            found.items.push(item);
        } else {
            known.push({group: item.group, name, items: [item]});
        }
    }

    return others.length > 0 ? [...known, {...OTHER_GROUP, items: others}] : known;
}
```

### 2-3. 편의시설 이름 목록 — `src/contracts/common/store.constants.ts` `storeFacilityLabels`

```ts
/**
 * 켜진 편의시설 이름 — STORE_FACILITY_OPTIONS 순서, 값이 1인 것만(업체 상세 칩 · 관리자 업체 상세)
 * - store_detail 이 없는 응답(백엔드 배포 전)은 빈 목록 — 칸을 숨긴다
 *
 * @param detail 응답의 store_detail
 */
export function storeFacilityLabels(detail: StoreFacilityValuesType | null | undefined): Array<string> {
    return STORE_FACILITY_OPTIONS.filter((option) => detail?.[option.key] === 1).map((option) => option.label);
}
```

---

## 3. 데이터 규칙 — 규약만으로 예측할 수 없는 부분

### 3-1. 편의시설 순서 · 이름 표 — `src/contracts/common/store.constants.ts`

세 영역(이용자 업체 상세 · 업체 관리자 탭 · 관리자 상세)이 같은 이름 · 순서를 써야 해서 contracts 공통에 둔다 — 객실 옵션(`src/contracts/common/room.constants.ts:11` `ROOM_GROUP_OPTIONS`)과 같은 모양. 검색필터 체크 항목은 이 표를 쓰지 않는다(받은 목록 그대로 — 요청서).

```ts
// src/contracts/common/store.constants.ts — 더함
/**
 * 업체 편의시설 — store_detail 의 켜고 끄는 항목(0 · 1), 이 순서로 보인다 — 이용자 업체 상세 · 업체 관리자 편의시설 탭 · 관리자 업체 상세
 * - 백엔드가 항목을 더하면(frontend/changes) 여기 한 줄과 DTO 사본 네 곳(discovery-store-detail · store-mine · store-detail · store-mine-detail)에 필드를 더한다
 */
export const STORE_FACILITY_OPTIONS = [
    {key: 'has_convenience_store', label: '편의점'},
    {key: 'has_cafe', label: '카페'},
    {key: 'has_hot_spring', label: '온천'},
    {key: 'is_pet_allowed', label: '반려동물 동반'},
    {key: 'has_meal', label: '식사 제공'},
    {key: 'is_delivery_allowed', label: '배달 음식'},
    {key: 'has_parking', label: '주차'},
] as const;

/** 편의시설 키 — store_detail 필드 이름 */
export type StoreFacilityKeyType = (typeof STORE_FACILITY_OPTIONS)[number]['key'];

/** 편의시설 값 — 응답 store_detail(세 DTO 의 편의시설 클래스가 같은 모양) */
export type StoreFacilityValuesType = Record<StoreFacilityKeyType, number>;

// storeFacilityLabels — 위 2-3
```

```ts
// src/contracts/common/room.constants.ts:9 — 주석만
 * - 백엔드가 객실 항목을 더하면(frontend/changes) 여기 한 줄과 DTO 사본에 필드를 더한다 — 업체 단위 시설은 store.constants.ts STORE_FACILITY_OPTIONS
```

### 3-2. 편의시설 칸 ↔ 보낼 값 — `src/app/manager/(console)/store/store-settings-format.ts`

저장은 통째로 교체라 **꺼진 항목도 0 으로 7개 모두** 보낸다(빠지면 0 으로 저장되긴 하지만, 보낸 값이 화면과 같아야 테스트 · 디버깅이 쉽다 — 요청서도 "7개를 모두"). 처음 값은 응답에 `store_detail` 이 없으면(백엔드 배포 전) 모두 끔.

```ts
// src/app/manager/(console)/store/store-settings-format.ts — 탭 · 함수 더함
import { STORE_FACILITY_OPTIONS, StoreFacilityKeyType, StoreFacilityValuesType } from '@/contracts/common/store.constants';
import { StoreMineDetailDto } from '@/contracts/store/dto/store-mine-detail.dto';

/** 내 업체 설정 탭 */
export type StoreTabType = 'profile' | 'facility' | 'photos' | 'hours' | 'policy' | 'unavailable' | 'door';

/** 탭 7개 — 문 연동은 업체 총관리자에게만(머리가 거른다), 편의시설은 기본 정보 다음(사용자 결정) */
export const STORE_TABS: Array<TabItemType<StoreTabType>> = [
    {value: 'profile', label: '기본 정보'},
    {value: 'facility', label: '편의시설'},
    {value: 'photos', label: '사진'},
    {value: 'hours', label: '영업시간 · 브레이크'},
    {value: 'policy', label: '운영 규정'},
    {value: 'unavailable', label: '일시 예약불가'},
    {value: 'door', label: '문 연동'},
];

/** 편의시설 스위치 — 켜짐 여부 */
export type FacilityFormType = Record<StoreFacilityKeyType, boolean>;

/**
 * 받은 편의시설 → 스위치 — 1 이면 켜짐, 응답에 없으면(백엔드 배포 전) 모두 끔
 *
 * @param detail 내 업체의 store_detail
 */
export function facilityFormOf(detail: StoreFacilityValuesType | null | undefined): FacilityFormType {
    return Object.fromEntries(STORE_FACILITY_OPTIONS.map((option) => [option.key, detail?.[option.key] === 1])) as FacilityFormType;
}

/**
 * 스위치 → 보낼 값 — 7개 모두 0 · 1(통째로 교체라 꺼진 것도 보낸다)
 *
 * @param form 스위치
 */
export function facilityDtoOf(form: FacilityFormType): StoreMineDetailDto {
    return Object.assign(new StoreMineDetailDto(), Object.fromEntries(STORE_FACILITY_OPTIONS.map((option) => [option.key, form[option.key] ? 1 : 0])));
}
```

### 3-3. 거리 값 · 글자를 팝업 쪽으로 — `src/app/(user)/_components/search-filter.ts`

거리 칩이 팝업으로 들어가 홈 · 팝업이 함께 쓰므로 `HomeContent.tsx:26-31` 의 `RADIUS_OPTIONS` · `RadiusType` · `DEFAULT_RADIUS` 와 `:241` `radiusLabel` 을 옮긴다(값 · 글자 그대로). 홈은 `RadiusType` · `DEFAULT_RADIUS` · `searchFilterLabel` 만 가져간다.

```ts
// src/app/(user)/_components/search-filter.ts
import { DiscoveryDetailFilterItemResultDto } from '@/contracts/discovery/dto/discovery-detail-filter.dto';

/** 거리(km) — DiscoveryStoreListDto.radius_km 의 값, ALL 은 거리 제한 없음(가까운 순 300곳 — frontend/changes/2026-11-22-discovery-filter.md) */
export const RADIUS_OPTIONS = [5, 10, 20, 50, 'ALL'] as const;

/** 거리 하나 */
export type RadiusType = typeof RADIUS_OPTIONS[number];

/** 처음 거리 — 사용자 결정 2026-11-16 · 검색필터 "초기화"도 이 값(사용자 결정 2026-11-24) */
export const DEFAULT_RADIUS: RadiusType = 20;

/** 검색필터 이름 — 지도 위 버튼 · 팝업 제목 */
export const SEARCH_FILTER_NAME = '검색필터';

/**
 * 거리 칩 글자 — 5km · … · 제한 없음
 *
 * @param option 거리
 */
export function radiusLabel(option: RadiusType): string {
    return option === 'ALL' ? '제한 없음' : `${option}km`;
}

// searchFilterLabel — 위 2-1, DetailFilterGroupType · groupDetailFilters — 위 2-2
```

버튼 글자(2-1)와 팝업 제목(1-1)이 같은 `SEARCH_FILTER_NAME` 을 쓴다.

---

## 4. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| `store-mine-detail.dto.ts` · `discovery-detail-filter.dto.ts` | 요청서 코드 그대로(새 파일 — `//` 주석 사본) | `src/contracts/discovery/dto/discovery-room-group-detail-filter.dto.ts` (지울 파일 — 같은 사본 모양) |
| `discovery-store-detail.dto.ts` · `store-mine.dto.ts` · `store-detail.dto.ts` 의 `store_detail` 칸 + `DiscoveryStoreFacilityResultDto` · `StoreMineFacilityResultDto` · `StoreDetailFacilityResultDto` | `introduction` 다음 한 칸 + 파일 맨 아래 클래스 — 그 파일의 `/** */` 주석 모양에 맞춘다 | `src/contracts/store/dto/store-mine.dto.ts:98` |
| `discovery-store-list.dto.ts` `detail_filter` 주석 | 요청서 문구로(검증 그대로) | `src/contracts/discovery/dto/discovery-store-list.dto.ts:22` |
| `getDetailFilters(signal?)` | 로그인 없는 동기 조회 — `getRoomGroupDetailFilters` 자리를 바꾼다 | `src/contracts/discovery/api.ts:27` |
| `updateMyStoreFacility(auth, dto)` | `withAuth` + `callQueue` PUT `${MY_STORE_PATH}/detail`, `Promise<null>` | `src/contracts/store/api.ts:147` `updateMyStoreProfile` |
| `StoreSettingsContent` 편의시설 탭 | `{activeTab === 'facility' ? <StoreFacilityTab store={store} onSaved={onSaved} /> : null}` 한 줄 + import, 머리 주석 "탭 7개" | `src/app/manager/(console)/store/StoreSettingsContent.tsx:87` |

## 5. 스타일 — 형제 값

시안이 없다(요청서 — 배치는 프론트). 색 · 크기는 토큰만.

- `src/app/css/user/SearchFilterModal.module.css` — `DetailFilterModal.module.css` 그대로 옮기고 `.section`(묶음 — 아래 간격 16px) · `.sectionTitle`(13px · 700 · `--muted` — 콘솔 거르기 줄 `.label` 과 같은 값) · `.radius`(칩 한 줄 — `display: flex; gap: 6px; overflow-x: auto` · 칩 `flex-shrink: 0` — 내 예약 상태 칩 `.states` 값)를 더한다. `.description` 은 체크 항목 위 안내로 그대로.
- `src/app/css/user/HomeContent.module.css` — `.radius` 를 `.filterBar`(지도 위 왼쪽 위 칩 하나 — 같은 `position` · `top` · `left` · `padding` · `pointer-events`)로, `.radiusChips` · 가로 스크롤 규칙은 지운다(칩이 하나라 밀릴 일이 없다).
- `src/app/css/manager/StoreFacilityTab.module.css` — `.body`(세로 16px) · `.hint`(`StoreProfileTab.module.css` `.hint` 값) · `.switches`(`display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px 24px`) · `.actions`(`StoreProfileTab.module.css` `.actions` 값).
- 업체 상세 칩은 지금 `.options` · `.option`(`StoreDetailContent.module.css:221`) 그대로 — css 바꾸지 않는다.

## 테스트

spec의 "결과" 표에서 ✓ 표시된 4건과 "계산 규칙" 표 9건을 그대로 테스트로 옮긴다. 여기에는 추가분만 적는다.

| 종류 | 대상 | 이유 |
|---|---|---|
| 파일 배치 | 계산 — `src/test/app/(user)/_components/search-filter.test.ts`(버튼 글자 4 · 묶음 3) · `src/test/contracts/common/store.constants.test.ts`(이름 목록 2), 화면 — `src/test/app/(user)/HomeContent.test.tsx`(검색필터 ✓ 2 — 지금 추가정보 테스트를 바꾼다) · `src/test/app/(user)/stores/[store_id]/StoreDetailContent.test.tsx`(칩 ✓ 1 더함) · `src/test/app/manager/(console)/store/_components/StoreFacilityTab.test.tsx`(새 — 저장 ✓ 1) | 규약(src 와 같은 경로) |
| 기존 테스트 고침 | `HomeContent.test.tsx` — 거리 칩을 지도에서 누르던 3건(`반경을 바꾸면` · `"제한 없음"` · 실패 뒤 `10km`)을 팝업 안 거리 → 적용으로, 안내 문구 2건(300곳 · 빈 목록)을 새 문구로, mock 을 `getDetailFilters`(`group` 포함 11개)로 | 지도 위 거리 칩이 없어져 그대로면 실패한다 — 동작(같은 중심 · 새 거리 한 번 · 제한 없음이면 원 없음 · 실패 뒤 지도 중심)은 그대로 지킨다 |
| 기존 테스트 고침 | `StoreSettingsContent.test.tsx:18` 탭 목록에 "편의시설"(기본 정보 다음), 픽스처 `store-fixture.tsx` `storeMine` · `admin-fixture.tsx` `storeDetail` · `StoreDetailContent.test.tsx` `DETAIL` 에 `store_detail`(모두 0 — 칩 테스트만 편의점 · 주차 1) | 응답 모양이 늘었다 — 편의시설 탭 · 칩이 없는 칸을 읽지 않게 |
| mock 경계 | `@/contracts/discovery/api`(`getNearbyStores` · `getDetailFilters`) · `@/contracts/store/api`(`updateMyStoreFacility`) | 실제 네트워크 금지(규약) — 저장은 호출 횟수 · 7개 모두의 인자 · 다시 읽기까지 |

## 만드는 순서

1. DTO 사본 · 고침(새 2 · 고침 4 · 옛 필터 DTO 삭제) → 2. contracts 함수(`getDetailFilters` · `updateMyStoreFacility`) · `store.constants.ts` 표 · `room.constants.ts` 주석 → 3. 계산 함수(`searchFilterLabel` · `groupDetailFilters` · `storeFacilityLabels`)와 그 테스트 — `search-filter.ts` 로 거리 값 · 글자 옮김 → 4. 검색필터 팝업(이름 바꿈 · css) · 홈(버튼 · 적용 · 문구 · css)과 홈 테스트 고침 → 5. 업체 상세 칩과 테스트 → 6. 편의시설 탭(`store-settings-format.ts` · 탭 · css · `StoreSettingsContent`)과 테스트 · 탭 목록 테스트 → 7. 관리자 업체 상세 한 줄 · 픽스처 → 8. 문서 — `AGENTS.md`(편의시설 표 `store.constants.ts` · 지도 검색필터 팝업) · `docs/data-layer.md`(반영한 수정 요청 `2026-11-24-store-facility.md`) · `docs/architecture.md`(이용자 `_components` 목록에 `SearchFilterModal` · `search-filter.ts`가 있으면 이름 바꿈)
