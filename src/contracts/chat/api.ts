import { AuthType, withAuth } from '@/shared/api/auth';
import { callQueue } from '@/shared/api/queue';
import { request } from '@/shared/api/request';
import { callStream, StreamEventType } from '@/shared/api/stream';
import { ChatDetailResultDto } from './dto/chat-detail.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatQuotaResultDto } from './dto/chat-quota.dto';

/** AI 대화 주소 — 이용자 */
const CHAT_PATH = '/user-service/chat';

/**
 * 대화 보기 — 동기 · 이용자 (GET /user-service/chat) — 7일 안 내 대화(오래된 순, 질문 한 건이 USER · AI 두 메시지) · 남은 질문 수
 *
 * @param auth AuthContext 값
 * @param signal 화면을 떠나거나 다시 읽을 때 취소
 */
export function getChat(auth: AuthType, signal?: AbortSignal): Promise<ChatDetailResultDto | null> {
    return withAuth(auth, (token) => request<ChatDetailResultDto>({path: CHAT_PATH, token, signal}));
}

/**
 * 남은 질문 수 — 동기 · 이용자 (GET /user-service/chat/quota) — 하루 한도 · 오늘 쓴 수 · 남은 수 · 다시 채워지는 시각 · 답하는 중인지
 *
 * @param auth AuthContext 값
 * @param signal 화면을 떠나거나 다시 읽을 때 취소
 */
export function getChatQuota(auth: AuthType, signal?: AbortSignal): Promise<ChatQuotaResultDto | null> {
    return withAuth(auth, (token) => request<ChatQuotaResultDto>({path: `${CHAT_PATH}/quota`, token, signal}));
}

/**
 * 질문 보내기 — 스트림 · 이용자 (POST /user-service/chat/message) — progress → stores(숙소를 찾을 때만) → delta … → done, 도중 실패는 failed 이벤트
 * - 시작 전 실패(400 · 409 · 429 · 503)는 ApiError, 401 이면 재발급 뒤 한 번 더(스트림 시작 전이라 안전)
 *
 * @param auth AuthContext 값
 * @param dto 질문(1 ~ 100자)
 * @param onEvent 이벤트마다
 * @param signal 화면을 떠나면 끊는다 — 서버도 멈추고 저장 · 횟수 없음
 */
export function sendChatMessage(auth: AuthType, dto: ChatMessageDto, onEvent: (event: StreamEventType) => void, signal?: AbortSignal): Promise<void> {
    return withAuth(auth, (token) => callStream({method: 'POST', path: `${CHAT_PATH}/message`, body: dto, token, signal, onEvent}));
}

/**
 * 대화 초기화 — 큐 · 이용자 (DELETE /user-service/chat) — 내 대화 이력을 모두 지운다(오늘 쓴 질문 수는 그대로), 결과 DTO 가 없어 done · pending 이 같다
 *
 * @param auth AuthContext 값
 */
export function resetChat(auth: AuthType): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'DELETE', path: CHAT_PATH, token}));
}
