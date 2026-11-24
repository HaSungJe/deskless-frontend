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
