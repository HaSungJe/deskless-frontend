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
