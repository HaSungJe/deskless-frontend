# 업체 검색 거리 제한 없음 · 추가정보 필터 — 프론트 수정 요청 (2026-11-22)

- 백엔드: revision `.beaver/output/revision/discovery/discovery-revision-261122-1.md` · 커밋 2026.11.22
- 반영 순서: 백엔드 배포 먼저 — `radius_km` 기존 값 · `detail_filter` 없음은 지금과 같아 지금 화면은 그대로 동작한다

## 바뀐 이유
업체 검색에 ① 거리 제한 없이 찾는 선택지와 ② 객실 그룹 상세(PC · TV · 샤워실 · 방 개수)로 거르는 추가정보 필터를 더한다(사용자 요청). 객실 그룹 상세에 항목이 새로 생기면 필터에도 저절로 더해진다.

## 영향 화면
- 이용자 지도 · 업체 목록(업체 검색) — 반경 선택에 "제한 없음", 추가정보 필터 팝업

## API 변경
| 구분 | 메서드 · 주소 | 방식 | 바뀐 점 |
|---|---|---|---|
| 변경 | `GET /api/v1/user-service/discovery/store` | 동기 · 로그인 없음 | `radius_km` 에 **`ALL`**(거리 제한 없음 — 중심에서 가까운 순 최대 300개, 넘으면 `is_truncated` 1). query **`detail_filter`**(선택) — 추가정보 항목 키를 쉼표로(`has_pc,has_shower`), **고른 조건을 모두 갖춘 객실 그룹이 하나라도 있는 업체만**(예약할 수 있는 객실 그룹 — 업체 상세의 객실 그룹 목록에 보이는 그룹 기준). 모르는 항목 · 모양이 틀린 값은 400 `{message: '추가정보 필터가 올바르지 않습니다.', validation_errors: [{property: 'detail_filter', …}]}`. `radius_km` 목록 밖 값의 메시지는 `반경은 5 · 10 · 20 · 50km · 제한 없음(ALL) 중에서 골라주세요.` 로 바뀐다. 응답은 그대로 |
| 추가 | `GET /api/v1/user-service/discovery/room-group-detail-filter` | 동기 · 로그인 없음 | 추가정보 필터 항목 목록 `{list: [{key, name}]}` — 보일 순서. 지금은 `room_count` 방 2개 이상 · `has_shower` 샤워실 · `has_tv` TV · `has_pc` PC. 실패는 공통(503 · 500) |

## 화면 구성과 쓰는 API 의 변경
- 반경 선택(5 · 10 · 20 · 50km)에 **"제한 없음"** 을 더하고 `radius_km=ALL` 로 부른다. 결과가 300개를 넘으면(`is_truncated` 1) 지도를 옮기거나 추가정보 필터를 더하라고 안내한다.
- **추가정보 필터는 팝업에서 체크박스로 고르게 한다**(사용자 요청). 팝업을 열 때 `GET …/room-group-detail-filter` 를 불러 `list` 의 항목마다 체크박스 하나(이름 `name`)를 그린다 — **항목을 화면에 하드코딩하지 않는다**(백엔드에 항목이 늘면 목록에 저절로 나온다). 체크한 항목의 `key` 를 쉼표로 이어 `detail_filter` 에 넣어 업체 검색을 다시 부른다. 아무것도 체크하지 않으면 `detail_filter` 를 빼고 부른다.
- 목록은 자주 바뀌지 않으니 화면이 열려 있는 동안 한 번 받아 두고 써도 된다.

## 바뀐 DTO (Swagger 데코레이터를 뺀 사본)

contracts/discovery/dto/discovery-store-list.dto.ts — `DiscoveryStoreListDto`(결과 DTO 는 그대로)
```ts
import {IsIn, IsLatitude, IsLongitude, IsNotEmpty, IsOptional, Matches, MaxLength} from 'class-validator';

/**
 * 반경 업체 조회 query — 지도 중심(처음엔 내 위치) 위경도 + 반경(ALL — 거리 제한 없음) + 추가정보 필터(선택). 쿼리 값은 문자열이다.
 */
export class DiscoveryStoreListDto {
    // 중심 위도 (WGS84 — 지도 중심 · 내 위치)
    @IsLatitude({message: '위도가 올바르지 않습니다.'})
    @IsNotEmpty({message: '위도를 입력해주세요.'})
    latitude: string;

    // 중심 경도 (WGS84)
    @IsLongitude({message: '경도가 올바르지 않습니다.'})
    @IsNotEmpty({message: '경도를 입력해주세요.'})
    longitude: string;

    // 반경(km) — 5 · 10 · 20 · 50, ALL: 거리 제한 없음(가까운 순 300개)
    @IsIn(['5', '10', '20', '50', 'ALL'], {message: '반경은 5 · 10 · 20 · 50km · 제한 없음(ALL) 중에서 골라주세요.'})
    @IsNotEmpty({message: '반경을 입력해주세요.'})
    radius_km: string;

    // 추가정보 필터 — 객실 그룹 상세 항목 키를 쉼표로(항목은 GET /api/v1/user-service/discovery/room-group-detail-filter). 고른 조건을 모두 갖춘 객실 그룹이 있는 업체만
    @IsOptional()
    @Matches(/^[a-z_]+(,[a-z_]+)*$/, {message: '추가정보 필터가 올바르지 않습니다.'})
    @MaxLength(200, {message: '추가정보 필터가 올바르지 않습니다.'})
    detail_filter: string | null;

    /**
     * @param data 요청 쿼리 — 빠진 필수 값은 빈 문자열(검증에서 걸린다), 빠진 필터는 null
     */
    constructor(data?: Partial<DiscoveryStoreListDto>) {
        this.latitude = data?.latitude ?? '';
        this.longitude = data?.longitude ?? '';
        this.radius_km = data?.radius_km ?? '';
        this.detail_filter = data?.detail_filter ?? null;
    }
}
```

contracts/discovery/dto/discovery-room-group-detail-filter.dto.ts — 새 파일
```ts
/**
 * 추가정보 필터 항목 — 체크박스 1개
 */
export class DiscoveryRoomGroupDetailFilterItemResultDto {
    // 항목 키 — 업체 검색 detail_filter 에 쉼표로 넣는다 (예: has_pc)
    key: string;

    // 체크박스 이름 (예: PC · 방 2개 이상)
    name: string;
}

/**
 * 추가정보 필터 항목 목록 — 객실 그룹 상세 항목마다 1개, 보일 순서
 */
export class DiscoveryRoomGroupDetailFilterListResultDto {
    // 필터 항목 (보일 순서)
    list: DiscoveryRoomGroupDetailFilterItemResultDto[];
}
```
