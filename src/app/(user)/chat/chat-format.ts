import { CHAT_PHASE, CHAT_ROLE, CHAT_STREAM_EVENT } from '@/contracts/chat/chat.constants';
import { ChatDetailCardResultDto, ChatDetailMessageResultDto } from '@/contracts/chat/dto/chat-detail.dto';
import { ChatMessageDeltaResultDto, ChatMessageDoneResultDto, ChatMessageProgressResultDto, ChatMessageStoresResultDto } from '@/contracts/chat/dto/chat-message.dto';
import { ChatQuotaResultDto } from '@/contracts/chat/dto/chat-quota.dto';
import { ApiError } from '@/shared/api/request';
import { StreamEventType } from '@/shared/api/stream';
import { formatDateTime } from '@/shared/utils/format';

/** 여행 도우미 — 지도 버튼 · 대화창 제목(사용자 결정 2026-11-25) */
export const CHAT_NAME = '여행 도우미';

/** 대화창 주소 — 지도에서 열면 지도 위 팝업(경로 모달) */
export const CHAT_PATH = '/chat/';

/** 답을 받지 못함 — 도중 실패 · 끝까지 완료가 없음 */
export const ANSWER_FAILED_MESSAGE = '답을 받지 못했어요. 잠시 후 다시 물어봐 주세요.';

/** 업체 카드 — 대화 보기 · 스트림 카드가 같은 모양 */
export type ChatCardType = ChatDetailCardResultDto;

/** 남은 질문 수 — 대화 보기 · 남은 질문 수 · done 이 같은 모양 */
export type ChatQuotaType = ChatQuotaResultDto;

/** 스트림으로 만드는 AI 답 */
export type ChatAnswerType = {
    progress: string | null;                 // 진행 문구 — 받는 중에만
    stores: Array<ChatCardType>;             // 업체 카드(추천 순서)
    text: string;                            // 답 글(이어 붙인 것 · 완료면 저장된 글 · 실패면 실패 문구)
    status: 'streaming' | 'done' | 'failed'; // 받는 중 · 완료 · 실패
    quota: ChatQuotaType | null;             // 완료 때 받은 남은 질문 수
};

/** 말풍선 하나 */
export type ChatBubbleType = {
    id: string;                              // key — 받은 대화는 순서, 이번 질문은 보낸 시각
    role: 'USER' | 'AI';                     // 질문 · 답
    content: string;                         // 글(실패면 실패 문구)
    stores: Array<ChatCardType>;             // 업체 카드(답에만)
    progress: string | null;                 // 진행 문구 — 받는 중에만
    status: 'streaming' | 'done' | 'failed'; // 받는 중 · 완료 · 실패
};

/** 글 조각 — 굵게 여부 */
export type InlineType = {
    text: string;  // 글자
    bold: boolean; // **굵게**
};

/** 답 글 덩어리 — 문단 · 목록 */
export type AnswerBlockType =
    | {type: 'paragraph'; inlines: Array<InlineType>}                     // 문단(줄바꿈은 글자 안 \n — pre-wrap)
    | {type: 'list'; ordered: boolean; items: Array<Array<InlineType>>}; // 목록(- · * · • 또는 1. · 1))

/** 아직 아무 이벤트도 받지 않은 답 */
export const EMPTY_ANSWER: ChatAnswerType = {progress: null, stores: [], text: '', status: 'streaming', quota: null};

/** 진행 단계 → 문구 — Map 이라 상속 이름에 속지 않는다 */
const PHASE_LABELS = new Map<string, string>([
    [CHAT_PHASE.SEARCHING_WEB, '웹에서 찾고 있어요…'],
    [CHAT_PHASE.SEARCHING_STORES, '숙소를 고르고 있어요…'],
    [CHAT_PHASE.ANSWERING, '답을 쓰고 있어요…'],
]);

/** 목록 줄 — 줄머리 `- ` · `* ` · `• ` 또는 `1. ` · `1) ` */
const LIST_LINE = /^\s*(?:([-*•])|(\d+)[.)])\s+(.*)$/;

/** 굵게 — **글자** */
const BOLD = /\*\*(.+?)\*\*/g;

/**
 * 스트림 이벤트 하나를 답에 반영 — 진행 문구 · 카드 · 글 조각 이어 붙이기 · 완료(저장된 답 · 남은 질문 수) · 실패(실패 문구만)
 * - 완료 · 실패 뒤에 온 이벤트 · 모르는 이벤트는 무시한다
 *
 * @param answer 지금까지의 답
 * @param event 받은 이벤트(data 는 JSON 으로 읽은 값)
 */
export function applyChatEvent(answer: ChatAnswerType, event: StreamEventType): ChatAnswerType {
    if (answer.status !== 'streaming') {
        return answer;
    }

    if (event.event === CHAT_STREAM_EVENT.PROGRESS) {
        const phase = (event.data as ChatMessageProgressResultDto | null)?.phase ?? '';
        return {...answer, progress: PHASE_LABELS.get(phase) ?? answer.progress};
    }

    if (event.event === CHAT_STREAM_EVENT.STORES) {
        return {...answer, stores: (event.data as ChatMessageStoresResultDto | null)?.list ?? []};
    }

    if (event.event === CHAT_STREAM_EVENT.DELTA) {
        return {...answer, text: answer.text + ((event.data as ChatMessageDeltaResultDto | null)?.text ?? '')};
    }

    if (event.event === CHAT_STREAM_EVENT.DONE) {
        const done = event.data as ChatMessageDoneResultDto | null;
        return {progress: null, stores: done?.message?.stores ?? answer.stores, text: done?.message?.content ?? answer.text, status: 'done', quota: done?.quota ?? null};
    }

    if (event.event === CHAT_STREAM_EVENT.FAILED) {
        return {progress: null, stores: [], text: ANSWER_FAILED_MESSAGE, status: 'failed', quota: null};
    }

    return answer;
}

/**
 * 스트림이 끝났을 때의 답 — 완료 · 실패 없이 끝났거나 읽다 끊겼으면 실패
 *
 * @param answer 지금까지의 답
 */
export function finishAnswer(answer: ChatAnswerType): ChatAnswerType {
    return answer.status === 'streaming' ? applyChatEvent(answer, {event: CHAT_STREAM_EVENT.FAILED, data: null}) : answer;
}

/**
 * 보내기를 막는 이유 — 이 화면에서 받는 중 → 오늘 다 씀(다시 채워지는 시각) → 다른 곳에서 답하는 중 순서, 없으면 null
 *
 * @param quota 남은 질문 수
 * @param answering 이 화면에서 답을 받는 중
 */
export function chatSendLock(quota: ChatQuotaType, answering: boolean): string | null {
    if (answering) {
        return '답을 받고 있어요.';
    }

    if (quota.remaining_count <= 0) {
        return `오늘 질문을 모두 사용했어요. ${formatDateTime(quota.resets_at)}에 다시 채워져요.`;
    }

    if (quota.is_answering === 1) {
        return '다른 곳에서 보낸 질문에 답하고 있어요. 답이 끝난 뒤 보내 주세요.';
    }

    return null;
}

/**
 * 시작 전 거절 뒤의 남은 질문 수 — 429(오늘 다 씀)면 남은 0 · 본문의 resets_at, 그 밖이면 null(오류 팝업으로)
 *
 * @param quota 지금 남은 질문 수
 * @param error 받은 오류
 */
export function quotaAfterFailure(quota: ChatQuotaType | null, error: unknown): ChatQuotaType | null {
    if (!quota || !(error instanceof ApiError) || error.status !== 429) {
        return null;
    }

    const resetsAt = (error.body as {resets_at?: unknown}).resets_at;
    return {...quota, remaining_count: 0, used_count: quota.daily_limit, resets_at: typeof resetsAt === 'string' ? resetsAt : quota.resets_at};
}

/**
 * 대화 보기 → 말풍선(오래된 순 그대로)
 *
 * @param messages 대화 보기 messages
 */
export function bubblesOf(messages: Array<ChatDetailMessageResultDto>): Array<ChatBubbleType> {
    return messages.map((message, index): ChatBubbleType => ({id: `saved-${index}`, role: message.role === CHAT_ROLE.USER ? 'USER' : 'AI', content: message.content, stores: message.stores ?? [], progress: null, status: 'done'}));
}

/**
 * 내 질문 말풍선
 *
 * @param id 말풍선 키
 * @param content 질문
 */
export function userBubble(id: string, content: string): ChatBubbleType {
    return {id, role: 'USER', content, stores: [], progress: null, status: 'done'};
}

/**
 * 스트림 답 → AI 말풍선
 *
 * @param id 말풍선 키
 * @param answer 지금까지의 답
 */
export function bubbleOfAnswer(id: string, answer: ChatAnswerType): ChatBubbleType {
    return {id, role: 'AI', content: answer.text, stores: answer.stores, progress: answer.progress, status: answer.status};
}

/**
 * 한 줄을 글 조각으로 — **굵게** 만 굵은 조각, 나머지는 글자 그대로
 *
 * @param line 글
 */
function inlinesOf(line: string): Array<InlineType> {
    const inlines: Array<InlineType> = [];
    let last = 0;
    for (const match of line.matchAll(BOLD)) {
        const start = match.index ?? 0;
        if (start > last) {
            inlines.push({text: line.slice(last, start), bold: false});
        }
        inlines.push({text: match[1], bold: true});
        last = start + match[0].length;
    }

    if (last < line.length) {
        inlines.push({text: line.slice(last), bold: false});
    }

    return inlines;
}

/**
 * 답 글 → 덩어리 — 빈 줄로 문단을 나누고, 목록 줄은 이어지는 같은 종류끼리 한 목록, 그 밖의 글자(태그처럼 보여도)는 글자 그대로
 *
 * @param text 답 글
 */
export function answerBlocks(text: string): Array<AnswerBlockType> {
    const blocks: Array<AnswerBlockType> = [];
    let paragraph: Array<string> = []; // 모으는 중인 문단 줄
    const flush = (): void => {
        if (paragraph.length > 0) {
            blocks.push({type: 'paragraph', inlines: inlinesOf(paragraph.join('\n'))});
            paragraph = [];
        }
    };

    for (const line of text.split('\n')) {
        const match = LIST_LINE.exec(line);
        if (match) {
            flush();
            const ordered = match[2] !== undefined;
            const last = blocks.at(-1);
            if (last?.type === 'list' && last.ordered === ordered) {
                last.items.push(inlinesOf(match[3]));
            } else {
                blocks.push({type: 'list', ordered, items: [inlinesOf(match[3])]});
            }
            continue;
        }

        if (line.trim() === '') {
            flush();
            continue;
        }

        paragraph.push(line);
    }

    flush();
    return blocks;
}
