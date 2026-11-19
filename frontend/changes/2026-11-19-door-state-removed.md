# 문 열림 · 닫힘 상태 없앰, 마지막으로 연 시각만 — 프론트 수정 요청 (2026-11-19)

- 백엔드: revision `.beaver/output/revision/door/door-state-revision-261119-1.md` · 커밋 2026.11.19
- 반영 순서: **프론트와 함께** — 백엔드가 먼저 나가면 호실 목록의 문 상태 칸이 비고(`door_state` · `door_changed_at` 이 없어진다), 바로 열기 응답 모양이 바뀐다. 프론트가 아래처럼 고친 뒤 같이 배포한다

## 바뀐 이유
서버가 기록하던 문 상태(열림 · 닫힘)는 실제 문을 비추지 못했다 — "열림" 은 문이 실제로 열린 때가 아니라 서버가 "열어도 됨"을 답한 때, "닫힘" 은 문 프로그램이 잠금을 알려 줄 때만 바뀌었다. 그래서 열림 · 닫힘을 없애고(닫기 · 잠금 알림 없음), **문마다 마지막으로 연 시각**만 남긴다. 연 시각은 이용자의 QR 확인이 맞았을 때와 업체 관리자가 바로 열기를 했을 때 바뀐다.

## 영향 화면
- M4 호실 `/manager/rooms` — 호실 표의 문 상태 · 바뀐 시각 칸, 줄마다의 문 열기

## API 변경
| 구분 | 메서드 · 주소 | 방식 | 바뀐 점 |
|---|---|---|---|
| 변경 | `GET /api/v1/admin-service/room` | 동기 | 목록 항목에서 `door_state` · `door_changed_at` **삭제**, **`door_opened_at` 추가** — 문을 마지막으로 연 시각(한국 시각 `yyyyMMddHHmmss`, 예 `20261119143005`), 연 적 없으면 `null`. 나머지 필드 · 페이지 · 실패(503 포함)는 그대로 |
| 변경 | `POST /api/v1/admin-service/room/:room_id/door-open` | 동기 | 성공 응답이 `{room_id, door_state, door_changed_at}` → **`{room_id, door_opened_at}`**(방금 연 시각). 실패는 그대로 — 404(소속 업체 · 호실 없음) · 400(호실 ID 모양) · 401 · 503(상태 저장소에 닿지 못함) |

## 화면 구성과 쓰는 API 의 변경
- 호실 표의 **문 상태(열림 · 닫힘) 칸을 빼고**, 그 자리에 **"마지막으로 연 시각"**(`door_opened_at`)을 보여 준다. `null` 이면 "-" 처럼 연 적 없음으로 둔다. 시각은 한국 시각 `yyyyMMddHHmmss` 문자열이라 `YYYY-MM-DD HH:mm:ss` 처럼 바꿔 보여 준다(시간대 변환 없이 그대로 — 이미 한국 시각이다).
- 이 시각은 실제로 문이 열린 시각이 아니라 **서버가 열기를 허락(QR 확인이 맞음) · 명령(바로 열기)한 시각**이다 — 화면 이름도 "마지막으로 연 시각" 정도로 둔다.
- 줄마다의 **문 열기**는 그대로 — `POST …/door-open` 이 200 이면 응답의 `door_opened_at` 으로 그 줄의 시각을 바꾼다. 503 은 그대로 "잠시 뒤 다시" 안내 — 문 쪽 프로그램이 연결돼 있어야 실제로 열린다(서버는 명령을 보낸다).
- 이용자 화면(내 예약 QR)은 바뀌지 않는다.

## 바뀐 DTO (Swagger 데코레이터를 뺀 사본)

contracts/room/dto/room-list.dto.ts — `RoomListItemResultDto`
```ts
/**
 * 호실 목록 항목
 */
export class RoomListItemResultDto {
    // 호실 ID
    room_id: string;

    // 객실 그룹 ID
    room_group_id: string;

    // 그룹명
    room_group_name: string;

    // 호실명 (예: 101호)
    room_name: string;

    // 층 (지하는 음수, B1 = -1)
    floor: number;

    // 호실 상태 (AVAILABLE: 예약가능, RESERVED: 예약완료, IN_USE: 사용중, MAINTENANCE: 정비중, DISABLED: 사용중지)
    room_state_id: string;

    // 호실 상태명
    room_state_name: string;

    // 등록일시 (ISO 8601)
    created_at: string;

    // 문을 마지막으로 연 시각 — 한국 시각 yyyyMMddHHmmss(QR 확인이 맞았거나 바로 열기를 한 때 — 실제로 문이 열린 시각은 아니다), 연 적 없으면 null
    door_opened_at: string | null;

    // 삭제: door_state · door_changed_at
}
```

contracts/room/dto/room-door-open.dto.ts
```ts
import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 호실 문 바로 열기 path — 내 업체의 지워지지 않은 호실만(없으면 404)
 */
export class RoomDoorOpenParamDto {
    // 호실 ID
    @Matches(/^[a-f0-9]{32}$/, {message: '호실 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '호실 ID를 입력해주세요.'})
    room_id: string;
}

/**
 * 바로 열기 결과 — 서버는 마지막으로 연 시각을 쓰고 그 업체 문 소켓에 열기 명령(door.open)을 보낸다. 실제 문은 문 쪽 프로그램이 연다(열림 · 닫힘 상태는 두지 않는다)
 */
export class RoomDoorOpenResultDto {
    // 연 문의 호실 ID
    room_id: string;

    // 문을 마지막으로 연 시각 — 한국 시각 yyyyMMddHHmmss(방금 바로 열기를 한 시각)
    door_opened_at: string;

    // 삭제: door_state · door_changed_at
}
```
