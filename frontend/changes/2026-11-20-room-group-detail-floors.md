# 객실 그룹 상세 · 호실 목록에 값 추가 — 프론트 수정 요청 (2026-11-20)

- 백엔드: revision `.beaver/output/revision/room/room-manage-revision-261120-1.md` · 커밋 2026.11.20
- 요청: 프론트(deskless-frontend) Phase 12 상품 · 객실 — "객실 그룹 상세 · 호실 목록에 값 추가"(2026-11-20)
- 반영 순서: 백엔드 배포 먼저 — 응답에 필드를 더할 뿐이라 지금 화면은 그대로 동작한다

## 바뀐 이유
시안(M5 객실 그룹 상세 · M4 호실)에 있는 값 3개가 응답에 없어 화면을 열 때마다 API 를 여러 번 불러야 했다. 응답에 넣었다.

## 영향 화면
- M5 객실 그룹 상세 `/manager/room-groups/[room_group_id]` — 그룹 상품 표의 "기간 가격" 칸, 맨 위 설명 줄 "호실 3개(203호 · 301호 · 302호)"
- M4 호실 `/manager/rooms` — 층 거르기 선택지

## API 변경
| 구분 | 메서드 · 주소 | 방식 | 바뀐 점 |
|---|---|---|---|
| 변경 | `GET /api/v1/admin-service/room/group/:room_group_id` | 동기 | `plans[]` 항목에 **`price_count`**(그 상품의 기간 가격 수 — 지워지지 않은 것, 지난 기간 포함), 응답에 **`room_count`**(지워지지 않은 호실 수 — 그룹 목록의 `room_count` 와 같은 값) · **`rooms`**(`[{room_id, room_name, floor}]` — 층 · 호실명 순). 나머지 · 실패는 그대로 |
| 변경 | `GET /api/v1/admin-service/room` | 동기 | 응답에 **`floors: number[]`** — 내 업체의 지워지지 않은 호실이 있는 층 전부, 오름차순(지하는 음수 — B1 = -1). 거르기(`floor` · `room_group_id`) · 페이지와 상관없이 늘 전부. 따로 API 는 만들지 않았다 |

## 화면 구성과 쓰는 API 의 변경
- M5 그룹 상품 표 "기간 가격" 칸: `plans[].price_count` 를 그대로("2개" 처럼). 0 이면 기간 가격 없음. 상품마다 기간 가격 목록 API 를 따로 부르지 않아도 된다.
- M5 맨 위 설명 줄: `room_count` 와 `rooms[].room_name` 으로 "호실 3개(203호 · 301호 · 302호)". 호실이 없으면 `room_count: 0` · `rooms: []`. 호실 전체 목록 API 를 따로 부르지 않아도 된다.
- M4 층 거르기: `floors` 로 "전체 · 2층 · 3층 · 4층" 선택지를 만든다(지하는 "B1" 처럼 바꿔 보여 준다). 거르기 · 페이지를 바꿔도 같은 값이 온다 — 처음 응답의 `floors` 를 써도 된다.

## 바뀐 DTO (Swagger 데코레이터를 뺀 사본)

contracts/room/dto/room-group-detail.dto.ts — 바뀐 클래스만
```ts
/**
 * 그룹 상품 — 그룹 × 상품 종류의 사용 여부 · 기본 요금
 */
export class RoomGroupDetailPlanResultDto {
    // 상품 종류 ID (HOURLY: 시간 이용, NIGHT: 1박, LONG: 연박)
    room_plan_type_id: string;

    // 상품 종류명
    room_plan_type_name: string;

    // 사용 여부 (0: 이 그룹은 팔지 않음, 1: 판매 — 업체 상품 설정도 사용 중이어야 판다)
    is_used: number;

    // 기본 요금(원) — 시간 이용 1회 · 1박 · 연박 1박당
    price: number;

    // 이 상품의 기간 가격 수 (지워지지 않은 것 — 지난 기간 포함)  ← 추가
    price_count: number;
}

/**
 * 객실 그룹 상세의 호실 — 지워지지 않은 호실  ← 새 클래스
 */
export class RoomGroupDetailRoomResultDto {
    // 호실 ID
    room_id: string;

    // 호실명 (예: 101호)
    room_name: string;

    // 층 (지하는 음수, B1 = -1)
    floor: number;
}

/**
 * 객실 그룹 상세 — 그룹 정보 · 상세정보 · 사진 · 그룹 상품 3개
 */
export class RoomGroupDetailResultDto {
    // 객실 그룹 ID
    room_group_id: string;

    // 그룹명
    room_group_name: string;

    // 설명
    description: string | null;

    // 상세정보 (항목 모두)
    room_group_detail: RoomGroupDetailValueResultDto;

    // 사진 (정렬 순서)
    images: RoomGroupDetailImageResultDto[];

    // 그룹 상품 (HOURLY · NIGHT · LONG 순)
    plans: RoomGroupDetailPlanResultDto[];

    // 호실 수 (지워지지 않은 호실) — 그룹 목록의 room_count 와 같은 값  ← 추가
    room_count: number;

    // 이 그룹의 호실 (지워지지 않은 호실, 층 · 호실명 순)  ← 추가
    rooms: RoomGroupDetailRoomResultDto[];

    // 등록일시 (ISO 8601)
    created_at: string;

    // 수정일시 (ISO 8601)
    updated_at: string;
}
```

contracts/room/dto/room-list.dto.ts — `RoomListResultDto`
```ts
/**
 * 호실 목록
 */
export class RoomListResultDto {
    // 목록 (층 · 호실명 순)
    list: RoomListItemResultDto[];

    // 페이지 정보
    pagination: PaginationResultDto;

    // 내 업체 호실이 있는 층 전부 (오름차순 — 거르기 · 페이지와 상관없이, 층 거르기 선택지)  ← 추가
    floors: number[];
}
```
