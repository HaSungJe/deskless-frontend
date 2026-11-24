# 업체 편의시설 — 프론트 수정 요청 (2026-11-24)

- 백엔드: spec `.beaver/output/spec/store/store-facility-spec.md` · plan `.beaver/output/plan/store/store-facility-plan.md` · 커밋 2026.11.24
- 반영 순서: **프론트와 함께** — 추가정보 필터 항목 주소가 바뀐다(옛 `GET …/discovery/room-group-detail-filter` 가 사라지고 `GET …/discovery/detail-filter` 로). 백엔드만 먼저 나가면 지도 필터 팝업의 항목 목록이 404 로 비고, 나머지(업체 상세 · 내 업체 설정 · 업체 관리)는 응답에 칸이 하나 늘 뿐이라 그대로 동작한다.

## 바뀐 이유
업체 단위로 내세울 편의시설(편의점 · 카페 · 온천 · 반려동물 동반 · 식사 제공 · 배달 음식 · 주차)이 없었다. 업체 관리자가 이 7개를 켜고 끄고, 이용자는 업체 상세에서 보고 지도 검색 필터로 고른다(사용자 요청 — 다음 작업인 AI 대화형 업체 검색이 이 값을 쓴다). 지금의 객실 항목(방 2개 이상 · 샤워실 · TV · PC)은 그대로 두고 그 **위에 더한다**.

## 영향 화면
- **U1 지도 · 주변 업체** — 추가정보 필터 팝업: 항목 목록 주소가 바뀌고, 업체 편의시설 7개가 객실 항목 4개 다음에 묶음(`group`)으로 붙는다
- **U2 업체 상세** — 응답에 `store_detail`(편의시설 7개) — 보여 주기
- **M7 내 업체 설정** — 편의시설 7개 켜고 끄기(새 API), 조회 응답에 `store_detail`
- **A4 업체 관리** — 업체 상세 응답에 `store_detail`(보기만)

## API 변경
| 구분 | 메서드 · 주소 | 방식 | 바뀐 점(요청 · 응답 · 실패 · 로그인) |
|---|---|---|---|
| 추가 | `PUT /api/v1/admin-service/store/mine/detail` | 큐(SSE) · 매니저 | 내 업체 편의시설 설정 — **통째로 교체**. 본문 `{has_convenience_store?, has_cafe?, has_hot_spring?, is_pet_allowed?, has_meal?, is_delivery_allowed?, has_parking?}` 모두 선택 · 값 `0` · `1`, **빠진 항목은 없음(0)으로 저장**된다(빈 본문 `{}` = 전부 끔). done data 없음. 값이 0 · 1 이 아니면 400(그 항목 — 예: `온천 여부가 올바르지 않습니다.`), 선언 안 된 항목을 보내면 400. 소속 업체가 탈퇴 · 삭제됐으면 failed 404 `소속 업체를 찾을 수 없습니다.` |
| 추가 | `GET /api/v1/user-service/discovery/detail-filter` | 동기 · 로그인 없음 | 추가정보 필터 항목 `{list: [{key, name, group}]}` — 보일 순서. 객실(`group: ROOM_GROUP`) `room_count` 방 2개 이상 · `has_shower` 샤워실 · `has_tv` TV · `has_pc` PC, 다음 업체(`group: STORE`) `has_convenience_store` 편의점 · `has_cafe` 카페 · `has_hot_spring` 온천 · `is_pet_allowed` 반려동물 동반 · `has_meal` 식사 제공 · `is_delivery_allowed` 배달 음식 · `has_parking` 주차. 실패는 공통(503 · 500) |
| 삭제 | `GET /api/v1/user-service/discovery/room-group-detail-filter` | — | 위 `detail-filter` 로 바뀐다(404) |
| 변경 | `GET /api/v1/user-service/discovery/store` | 동기 · 로그인 없음 | query `detail_filter` 에 **업체 편의시설 키도 섞어 넣을 수 있다**(예: `has_pc,has_hot_spring,is_pet_allowed`). 객실 키는 "고른 조건을 모두 갖춘 객실 그룹이 있는 업체", 업체 키는 "그 시설이 있는 업체" — 고른 것을 모두 만족하는 업체만. 목록에 없는 키는 지금처럼 400 `추가정보 필터가 올바르지 않습니다.`. 응답은 그대로 |
| 변경 | `GET /api/v1/user-service/discovery/store/:store_id` | 동기 · 로그인 없음 | 응답에 `store_detail: {has_convenience_store, has_cafe, has_hot_spring, is_pet_allowed, has_meal, is_delivery_allowed, has_parking}`(각 0 · 1 — 설정 안 한 업체는 모두 0) — `introduction` 다음 |
| 변경 | `GET /api/v1/admin-service/store/mine` | 동기 · 매니저 | 응답에 `store_detail`(같은 7개) |
| 변경 | `GET /api/v1/admin-service/store/:store_id` | 동기 · 관리자 | 응답에 `store_detail`(같은 7개 — 보기만, 관리자가 바꾸는 API 는 없다) |

## 화면 구성과 쓰는 API 의 변경
- **U1 추가정보 필터 팝업**: 팝업을 열 때 `GET …/discovery/detail-filter` 를 부른다(옛 `room-group-detail-filter` 대신). `group` 으로 두 묶음을 나눠 보여 준다 — 예: "객실"(`ROOM_GROUP`) · "편의시설"(`STORE`). 항목은 지금처럼 **하드코딩하지 않는다**(목록 순서 그대로). 체크한 `key` 를 묶음과 상관없이 쉼표로 이어 `detail_filter` 하나에 넣는다 — 호출 방식은 지금과 같다.
- **U2 업체 상세**: `store_detail` 에서 값이 1 인 항목만 아이콘 · 칩 등으로 보여 준다(이름은 위 필터 항목의 `name` 과 같은 말 — 편의점 · 카페 · 온천 · 반려동물 동반 · 식사 제공 · 배달 음식 · 주차). 모두 0 이면 그 칸을 숨긴다.
- **M7 내 업체 설정**: 편의시설 7개를 켜고 끄는 칸(체크박스 · 토글)을 둔다. 처음 값은 `GET …/store/mine` 의 `store_detail`. 저장은 `PUT …/store/mine/detail` 에 **7개를 모두** 보낸다(빠진 항목은 꺼진다 — 통째로 교체). 소개 · 연락처 저장(`PATCH …/mine/profile`)과는 따로다 — 그쪽 본문에 `store_detail` 을 넣지 않는다. 큐 경로라 `accepted` → `done`/`failed`/`pending` SSE, done 이면 내 업체를 다시 불러 맞춘다.
- **A4 업체 관리 상세**: `store_detail` 을 보기만 한다(값이 1 인 항목).

## 바뀐 DTO (Swagger 데코레이터를 뺀 사본)

contracts/store/dto/store-mine-detail.dto.ts — 새 파일
```ts
import {IsIn, IsOptional} from 'class-validator';

/**
 * 내 업체 편의시설 설정 (업체 관리자) — 통째로 교체. 항목은 모두 선택이고 빠진 항목은 없음(0)으로 저장한다. 선언하지 않은 항목은 400(forbidNonWhitelisted).
 */
export class StoreMineDetailDto {
    // 편의점 (0: 없음, 1: 있음)
    @IsOptional()
    @IsIn([0, 1], {message: '편의점 여부가 올바르지 않습니다.'})
    has_convenience_store?: number;

    // 카페 (0: 없음, 1: 있음)
    @IsOptional()
    @IsIn([0, 1], {message: '카페 여부가 올바르지 않습니다.'})
    has_cafe?: number;

    // 온천 (0: 없음, 1: 있음)
    @IsOptional()
    @IsIn([0, 1], {message: '온천 여부가 올바르지 않습니다.'})
    has_hot_spring?: number;

    // 반려동물 동반 가능 (0: 없음, 1: 있음)
    @IsOptional()
    @IsIn([0, 1], {message: '반려동물 동반 가능 여부가 올바르지 않습니다.'})
    is_pet_allowed?: number;

    // 식사 제공 (0: 없음, 1: 있음)
    @IsOptional()
    @IsIn([0, 1], {message: '식사 제공 여부가 올바르지 않습니다.'})
    has_meal?: number;

    // 배달 음식 가능 (0: 없음, 1: 있음)
    @IsOptional()
    @IsIn([0, 1], {message: '배달 음식 가능 여부가 올바르지 않습니다.'})
    is_delivery_allowed?: number;

    // 주차 가능 (0: 없음, 1: 있음)
    @IsOptional()
    @IsIn([0, 1], {message: '주차 가능 여부가 올바르지 않습니다.'})
    has_parking?: number;
}
```

contracts/discovery/dto/discovery-detail-filter.dto.ts — 새 파일
```ts
/**
 * 추가정보 필터 항목 — 체크박스 1개
 */
export class DiscoveryDetailFilterItemResultDto {
    // 항목 키 — 업체 검색 detail_filter 에 쉼표로 넣는다 (예: has_pc · has_hot_spring)
    key: string;

    // 체크박스 이름 (예: PC · 온천)
    name: string;

    // 묶음 (ROOM_GROUP: 객실 — 조건을 갖춘 객실 그룹이 있는 업체, STORE: 업체 편의시설)
    group: string;
}

/**
 * 추가정보 필터 항목 목록 — 객실 항목 다음 업체 편의시설 항목, 보일 순서
 */
export class DiscoveryDetailFilterListResultDto {
    // 필터 항목 (보일 순서 — 객실 다음 업체)
    list: DiscoveryDetailFilterItemResultDto[];
}
```

contracts/discovery/dto/discovery-room-group-detail-filter.dto.ts — **삭제**(`DiscoveryRoomGroupDetailFilterItemResultDto` · `DiscoveryRoomGroupDetailFilterListResultDto` → 위 `DiscoveryDetailFilter…`)

contracts/discovery/dto/discovery-store-list.dto.ts — `DiscoveryStoreListDto` 의 `detail_filter` 설명만 바뀐다(검증 · 메시지 그대로)
```ts
    // 추가정보 필터 — 항목 키를 쉼표로(항목은 GET /api/v1/user-service/discovery/detail-filter). 객실 항목은 고른 조건을 모두 갖춘 객실 그룹이 있는 업체만, 업체 편의시설 항목은 그 시설이 있는 업체만
    @IsOptional()
    @Matches(/^[a-z_]+(,[a-z_]+)*$/, {message: '추가정보 필터가 올바르지 않습니다.'})
    @MaxLength(200, {message: '추가정보 필터가 올바르지 않습니다.'})
    detail_filter: string | null;
```

contracts/discovery/dto/discovery-store-detail.dto.ts — `DiscoveryStoreDetailResultDto` 에 한 칸(`introduction` 다음) + 새 클래스
```ts
export class DiscoveryStoreDetailResultDto {
    // … (지금 칸 그대로)

    // 소개 (없으면 null)
    introduction: string | null;

    // 편의시설 (편의점 · 카페 · 온천 · 반려동물 동반 · 식사 제공 · 배달 음식 · 주차 — 0: 없음, 1: 있음)
    store_detail: DiscoveryStoreFacilityResultDto;

    // … (지금 칸 그대로 — is_open 부터)
}

/**
 * 업체 편의시설 (이용자 업체 상세) — 7개 항목(저장 안 된 항목은 없음 0)
 */
export class DiscoveryStoreFacilityResultDto {
    // 편의점 (0: 없음, 1: 있음)
    has_convenience_store: number;

    // 카페 (0: 없음, 1: 있음)
    has_cafe: number;

    // 온천 (0: 없음, 1: 있음)
    has_hot_spring: number;

    // 반려동물 동반 가능 (0: 없음, 1: 있음)
    is_pet_allowed: number;

    // 식사 제공 (0: 없음, 1: 있음)
    has_meal: number;

    // 배달 음식 가능 (0: 없음, 1: 있음)
    is_delivery_allowed: number;

    // 주차 가능 (0: 없음, 1: 있음)
    has_parking: number;
}
```

contracts/store/dto/store-mine.dto.ts — `StoreMineResultDto` 에 한 칸(`introduction` 다음) + 새 클래스 `StoreMineFacilityResultDto`(칸 7개 — 위 `DiscoveryStoreFacilityResultDto` 와 같다)
```ts
    // 편의시설 (편의점 · 카페 · 온천 · 반려동물 동반 · 식사 제공 · 배달 음식 · 주차 — 0: 없음, 1: 있음)
    store_detail: StoreMineFacilityResultDto;
```

contracts/store/dto/store-detail.dto.ts — `StoreDetailResultDto` 에 한 칸(`introduction` 다음) + 새 클래스 `StoreDetailFacilityResultDto`(칸 7개 — 위와 같다)
```ts
    // 편의시설 (편의점 · 카페 · 온천 · 반려동물 동반 · 식사 제공 · 배달 음식 · 주차 — 0: 없음, 1: 있음)
    store_detail: StoreDetailFacilityResultDto;
```

## 테스트 데이터
샘플 업체 10곳에 편의시설 값이 들어 있다(온천은 서울이라 모두 없음) — 백엔드 `docs/guides/sample-data.md` "넣는 것". 이미 시드가 들어간 개발 DB 는 고정 ID 행을 건너뛰므로 값이 0 으로 보인다 — 새 DB 에서 넣거나 M7 화면으로 켠다.
