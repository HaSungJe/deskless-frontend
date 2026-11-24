/**
 * AI 대화 값 — 질문 보내기 스트림 이벤트 · 진행 단계 · 말한 쪽(frontend/changes/2026-11-25-chat-ai-search.md)
 */

/** 질문 보내기 스트림 이벤트 — 요청서 "스트림 읽기" 순서(progress → stores → delta … → done, 실패면 failed) */
export const CHAT_STREAM_EVENT = {PROGRESS: 'progress', STORES: 'stores', DELTA: 'delta', DONE: 'done', FAILED: 'failed'} as const;

/** 진행 단계 — progress 이벤트의 phase(웹 검색 · 업체 찾기 · 답 쓰기) */
export const CHAT_PHASE = {SEARCHING_WEB: 'SEARCHING_WEB', SEARCHING_STORES: 'SEARCHING_STORES', ANSWERING: 'ANSWERING'} as const;

/** 말한 쪽 — 대화 보기 messages 의 role */
export const CHAT_ROLE = {USER: 'USER', AI: 'AI'} as const;
