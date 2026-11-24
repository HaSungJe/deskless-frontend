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
