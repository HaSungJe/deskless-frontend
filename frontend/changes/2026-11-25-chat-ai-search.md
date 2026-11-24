# AI 대화형 업체 검색 — 프론트 수정 요청 (2026-11-25)

- 백엔드: spec `.beaver/output/spec/chat/chat-ai-search-spec.md` · plan `.beaver/output/plan/chat/chat-ai-search-plan.md` · 커밋 2026.11.25
- 반영 순서: **백엔드 배포 먼저** — 새 API 만 더하고 지금 API 는 그대로라, 백엔드가 먼저 나가도 지금 화면은 그대로 돈다. 프론트는 그 뒤 AI 검색을 붙인다.

## 바뀐 이유
이용자가 말로 여행지 · 숙소를 찾게 한다(사용자 요청). 예: "온천 가고 싶은데 근처에 갈 만한 데 있을까?" → AI 가 웹 검색으로 온천 지역을 찾고 그 주변 업체를 추천, 이어서 "반려동물도 데려가야 해" → 반려동물 동반이 되는 업체로 다시 추천. AI 는 Google Gemini, 업체 고르기는 업체 정보 벡터 검색 + 편의시설 · 객실 조건이다. 메인 화면의 "가까운 순" 글자는 빼고 그 자리에 AI 검색을 넣는다.

## 영향 화면
- **U1 지도 · 주변 업체(`/`)** — "가까운 순" 글자를 빼고 AI 검색 진입(입력창 또는 버튼)을 넣는다. 로그인 안 한 이용자가 누르면 U5 로그인으로
- **새 화면 — AI 대화(예: `/chat`)** — 대화 보기 · 질문 보내기(글자 단위로 답이 흘러옴) · 추천 업체 카드 최대 3곳 · 오늘 남은 질문 수 · 대화 초기화. 주소는 프론트가 정한다
- **U2 업체 상세** — 카드를 누르면 가는 곳(변경 없음)

## API 변경
| 구분 | 메서드 · 주소 | 방식 | 바뀐 점(요청 · 응답 · 실패 · 로그인) |
|---|---|---|---|
| 추가 | `GET /api/v1/user-service/chat` | 동기 · 이용자 | 대화 보기 `{messages, quota}` — `messages` 는 7일 안 내 대화 **오래된 순**(질문 한 건이 `USER` · `AI` 두 메시지로 펼쳐진다, 최근 질문 50건(메시지 100개)까지), 대화한 적이 없거나 초기화했으면 빈 배열. `quota` 는 아래 남은 질문 수와 같은 모양. 실패는 공통(401 · 503 Redis · 500) |
| 추가 | `GET /api/v1/user-service/chat/quota` | 동기 · 이용자 | 남은 질문 수 `{daily_limit, used_count, remaining_count, resets_at, is_answering}` — 하루 한도(서버 설정 — 지금 5) · 오늘(한국 날짜) 답을 받은 수 · 남은 수 · 다시 채워지는 시각(ISO 8601 — 다음 날 한국 00:00) · 다른 질문에 답하는 중인지(0 · 1). 실패는 공통 |
| 추가 | `POST /api/v1/user-service/chat/message` | **스트림(SSE — 새 방식)** · 이용자 | 질문 보내기. 본문 `{content}`(1 ~ 100자). 응답은 `text/event-stream` — 아래 "스트림 읽기". **시작 전 실패는 일반 HTTP 응답**(JSON 본문): 400 `content` 필드 오류(`질문을 입력해주세요.` · `질문은 100자 이내로 입력해주세요.`) · 401 · 409 `이전 질문에 답하는 중입니다. 답이 끝난 뒤 다시 보내주세요.` · 429 `오늘 질문을 모두 사용했습니다. 자정(한국 시각)에 다시 채워집니다.`(본문에 `resets_at` 더함) · 503(Redis). **시작 뒤 실패는 `failed` 이벤트**(대개 503 `AI 답을 만들지 못했습니다. 잠시 후 다시 시도해주세요.`) — 이때는 저장 · 횟수 없음 |
| 추가 | `DELETE /api/v1/user-service/chat` | 큐(SSE) · 이용자 | 대화 초기화 — 내 대화 이력을 바로 모두 지운다. done data 없음. **오늘 쓴 질문 수는 그대로**(초기화해도 한도가 다시 차지 않는다) |

### 스트림 읽기 — `POST …/chat/message`
- `EventSource` 는 POST · `Authorization` 헤더를 못 쓰므로 **`fetch` 로 보내고 `response.body` 를 읽는다**(`getReader()` + `TextDecoder`). 큐 경로 SSE 와 같은 모양이다 — 빈 줄(`\n\n`)로 나눈 덩어리마다 `event: <이름>` · `data: <JSON>` 한 줄씩.
- 먼저 `response.ok` 를 본다 — 아니면 스트림이 아니라 JSON 실패 본문이다(위 400 · 401 · 409 · 429 · 503).
- 이벤트 순서:
  1. `progress {phase}` — `SEARCHING_WEB`(요청 읽기 · 웹 검색) → `SEARCHING_STORES`(업체 찾기 — 숙소를 찾을 때만) → `ANSWERING`(답 쓰기). "웹에서 찾는 중…" 같은 진행 표시용
  2. `stores {list}` — 추천 업체 카드 0 ~ 3곳(**숙소를 찾을 때만 온다** — 지역 추천 · 되묻기 · 여행과 무관한 말에는 이 이벤트가 없다). 받으면 바로 카드를 그린다
  3. `delta {text}` — 답 글 조각, 여러 번. 이어 붙이며 보여 준다
  4. `done {message, quota}` — 저장된 AI 답 전체(`message.content` — 이어 붙인 글과 같다, `message.stores` = 카드) · 이번 질문까지 센 남은 질문 수. 이걸로 화면 값을 맞춘다
  - 실패면 중간에 `failed {status_code, message, validation_errors}` 가 오고 끝난다 — 그동안 보여 준 조각은 지우거나 "답을 받지 못했다" 로 바꾸고, 질문 수는 줄지 않았다
- 답은 10 ~ 30초 걸릴 수 있다(웹 검색). 화면을 떠나면 `AbortController` 로 요청을 끊는다 — 서버도 멈추고 저장 · 횟수 없음.

## 화면 구성과 쓰는 API 의 변경
- **U1**: "가까운 순" 글자를 뺀다. AI 검색 진입을 둔다 — 로그인했으면 AI 대화 화면으로(입력창에서 바로 질문을 넘겨도 된다), 아니면 U5 로그인.
- **AI 대화 화면**
  - 들어올 때 `GET …/chat` 한 번 — 이전 대화와 남은 질문 수를 그린다. 질문 수만 다시 볼 때(예: 화면 복귀)는 `GET …/chat/quota`.
  - 입력창: **100자 제한**(글자 수 표시), 빈 값이면 보내기 막기. `remaining_count` 가 0 이면 입력을 막고 "오늘 질문을 모두 사용했어요 — `resets_at`(한국 시각 자정)에 다시 채워져요" 안내. `is_answering` 1 이거나 이 화면에서 답을 받는 중이면 보내기 막기(다른 기기 · 탭에서 보낸 질문도 409 로 막힌다).
  - 보내면: 내 질문을 바로 말풍선으로 → `progress` 로 진행 표시 → `stores` 로 카드 → `delta` 로 답 글을 이어 붙임 → `done` 의 `quota` 로 "오늘 남은 질문 N회" 를 바꾼다. 409 · 429 · 400 은 그 메시지를 보여 준다(429 는 `resets_at` 도).
  - **업체 카드**(최대 3곳): 대표 사진 `image_url`(null 이면 기본 그림) · `store_name` · `address` · 있는 편의시설 · 객실 항목 `facilities`(`name` 칩 — 업체 편의시설 다음 객실 항목, `group` 으로 나눠 보여 줘도 된다). 누르면 U2 업체 상세(`/stores/[store_id]`). `latitude` · `longitude` 로 작은 지도 · 길찾기를 붙여도 된다. 이미 대화에서 추천한 업체는 다시 나오지 않는다(마음에 안 든다고 하면 다른 곳을 찾는다).
  - **대화 초기화** 버튼: 확인 후 `DELETE …/chat`(큐 — `accepted` → `done`/`failed`/`pending`), done 이면 대화를 비운다. 남은 질문 수는 그대로라는 안내를 곁들인다.
  - 대화는 7일 지나면 저절로 지워진다(안내 문구로 충분).

## 바뀐 DTO (Swagger 데코레이터를 뺀 사본)

contracts/chat/dto/chat-message.dto.ts — 새 파일
```ts
import {IsNotEmpty, MaxLength} from 'class-validator';

/**
 * 메시지 보내기 — 질문 하나(100자). 응답은 SSE 스트림(progress → stores → delta … → done).
 */
export class ChatMessageDto {
    // 질문 (1 ~ 100자) — 예: 온천 가고 싶은데 반려동물이랑 같이 묵을 곳 있을까?
    @MaxLength(100, {message: '질문은 100자 이내로 입력해주세요.'})
    @IsNotEmpty({message: '질문을 입력해주세요.'})
    content: string;
}

/**
 * 업체 카드 편의시설 · 객실 항목 — 추가정보 필터 항목과 같은 이름(GET /discovery/detail-filter)
 */
export class ChatMessageCardFacilityResultDto {
    key: string; // 항목 키 (예: has_hot_spring · has_pc)
    name: string; // 이름 (예: 온천 · PC)
    group: string; // 묶음 — STORE: 업체 편의시설, ROOM_GROUP: 그 업체 객실 그룹에 있는 항목
}

/**
 * 추천 업체 카드 — 누르면 업체 상세(U2)로
 */
export class ChatMessageCardResultDto {
    store_id: string; // 업체 ID
    store_name: string; // 상호명
    address: string; // 주소
    latitude: number; // 위도
    longitude: number; // 경도
    image_url: string | null; // 대표 사진 공개 주소 (없으면 null)
    facilities: ChatMessageCardFacilityResultDto[]; // 있는 편의시설 · 객실 항목 (업체 편의시설 다음 객실 항목)
}

/**
 * stores 이벤트 data — 추천 업체 카드 0 ~ 3곳
 */
export class ChatMessageStoresResultDto {
    list: ChatMessageCardResultDto[]; // 업체 카드 (추천 순서)
}

/**
 * progress 이벤트 data — 진행 단계
 */
export class ChatMessageProgressResultDto {
    phase: string; // SEARCHING_WEB: 요청 읽기 · 웹 검색, SEARCHING_STORES: 업체 찾기, ANSWERING: 답 쓰기
}

/**
 * delta 이벤트 data — 답 글 조각(이어 붙이면 답 전체)
 */
export class ChatMessageDeltaResultDto {
    text: string; // 답 글 조각
}

/**
 * 대화에 저장된 AI 답 한 개
 */
export class ChatMessageItemResultDto {
    role: string; // AI
    content: string; // 답 글 전체
    stores: ChatMessageCardResultDto[]; // 추천 업체 카드 (없으면 빈 배열)
    created_at: string; // 답한 시각 (ISO 8601)
}

/**
 * done 이벤트의 남은 질문 수 — 이번 질문까지 센 값
 */
export class ChatMessageQuotaResultDto {
    daily_limit: number; // 하루 질문 한도 (서버 설정 — 기본 5)
    used_count: number; // 오늘(한국 날짜) 답을 받은 질문 수 — 이번 질문 포함
    remaining_count: number; // 오늘 남은 질문 수
    resets_at: string; // 다시 채워지는 시각 (ISO 8601 — 다음 날 한국 00:00)
    is_answering: number; // 다른 질문에 답하는 중인지 (0 · 1 — 끝난 뒤라 0)
}

/**
 * done 이벤트 data — 저장된 AI 답 · 남은 질문 수
 */
export class ChatMessageDoneResultDto {
    message: ChatMessageItemResultDto; // 저장된 AI 답
    quota: ChatMessageQuotaResultDto; // 남은 질문 수
}
```

contracts/chat/dto/chat-detail.dto.ts — 새 파일
```ts
/**
 * 대화 보기 업체 카드 편의시설 · 객실 항목
 */
export class ChatDetailCardFacilityResultDto {
    key: string; // 항목 키 (예: has_hot_spring · has_pc)
    name: string; // 이름 (예: 온천 · PC)
    group: string; // 묶음 — STORE: 업체 편의시설, ROOM_GROUP: 그 업체 객실 그룹에 있는 항목
}

/**
 * 대화 보기 업체 카드 — 그 답에 붙었던 추천 업체(답한 때의 값)
 */
export class ChatDetailCardResultDto {
    store_id: string; // 업체 ID
    store_name: string; // 상호명
    address: string; // 주소
    latitude: number; // 위도
    longitude: number; // 경도
    image_url: string | null; // 대표 사진 공개 주소 (없으면 null)
    facilities: ChatDetailCardFacilityResultDto[]; // 있는 편의시설 · 객실 항목
}

/**
 * 대화 메시지 한 개 — 질문 한 건이 USER · AI 두 메시지로 펼쳐진다
 */
export class ChatDetailMessageResultDto {
    role: string; // USER: 이용자 질문, AI: 답
    content: string; // 글
    stores: ChatDetailCardResultDto[]; // 추천 업체 카드 (AI 답에만, 없으면 빈 배열)
    created_at: string; // 시각 (ISO 8601 — 질문은 물은 시각, 답은 답한 시각)
}

/**
 * 대화 보기의 남은 질문 수
 */
export class ChatDetailQuotaResultDto {
    daily_limit: number; // 하루 질문 한도 (서버 설정 — 기본 5)
    used_count: number; // 오늘(한국 날짜) 답을 받은 질문 수
    remaining_count: number; // 오늘 남은 질문 수
    resets_at: string; // 다시 채워지는 시각 (ISO 8601 — 다음 날 한국 00:00)
    is_answering: number; // 다른 질문에 답하는 중인지 (0 · 1)
}

/**
 * 대화 보기 — 내 대화 이력(7일 안, 오래된 순) · 남은 질문 수
 */
export class ChatDetailResultDto {
    messages: ChatDetailMessageResultDto[]; // 대화 (오래된 순 — 대화한 적이 없거나 초기화했으면 빈 배열)
    quota: ChatDetailQuotaResultDto; // 남은 질문 수
}
```

contracts/chat/dto/chat-quota.dto.ts — 새 파일
```ts
/**
 * 남은 질문 수 — 하루(한국 날짜) 한도 · 오늘 쓴 수 · 남은 수 · 초기화 시각 · 답하는 중인지
 */
export class ChatQuotaResultDto {
    daily_limit: number; // 하루 질문 한도 (서버 설정 — 기본 5)
    used_count: number; // 오늘(한국 날짜) 답을 받은 질문 수
    remaining_count: number; // 오늘 남은 질문 수 (0 이면 질문할 수 없다)
    resets_at: string; // 다시 채워지는 시각 (ISO 8601 — 다음 날 한국 00:00)
    is_answering: number; // 다른 질문에 답하는 중인지 (0 · 1 — 1 이면 메시지 보내기가 409)
}
```
