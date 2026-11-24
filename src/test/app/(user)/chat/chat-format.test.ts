// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { answerBlocks, applyChatEvent, ChatAnswerType, ChatCardType, ChatQuotaType, chatSendLock, EMPTY_ANSWER } from '@/app/(user)/chat/chat-format';

/** 업체 카드 하나 */
function card(id: string, name: string): ChatCardType {
    return {store_id: id, store_name: name, address: '부산광역시 해운대구 1', latitude: 35.16, longitude: 129.16, image_url: null, facilities: [{key: 'has_hot_spring', name: '온천', group: 'STORE'}]};
}

/** 남은 질문 수 — 기본 남은 3 · 답하는 중 아님 */
function quota(extra: Partial<ChatQuotaType> = {}): ChatQuotaType {
    return {daily_limit: 5, used_count: 2, remaining_count: 3, resets_at: '2026-11-25T15:00:00.000Z', is_answering: 0, ...extra};
}

describe('applyChatEvent — 스트림으로 답 만들기', () => {
    it('[SUCCESS] 진행 단계가 오면 그 단계의 문구가 보인다', () => {
        const answer = applyChatEvent(EMPTY_ANSWER, {event: 'progress', data: {phase: 'SEARCHING_WEB'}});

        expect(answer.progress).toBe('웹에서 찾고 있어요…');
        expect(answer.status).toBe('streaming');
    });

    it('[SUCCESS] 업체 카드가 오면 카드가 붙는다', () => {
        const answer = applyChatEvent(EMPTY_ANSWER, {event: 'stores', data: {list: [card('a'.repeat(32), '해운대 스테이'), card('b'.repeat(32), '동래 온천장')]}});

        expect(answer.stores.map((store) => store.store_name)).toEqual(['해운대 스테이', '동래 온천장']);
        expect(answer.text).toBe('');
    });

    it('[SUCCESS] 글 조각이 오면 이어 붙는다', () => {
        let answer: ChatAnswerType = applyChatEvent(EMPTY_ANSWER, {event: 'delta', data: {text: '온천은 '}});
        answer = applyChatEvent(answer, {event: 'delta', data: {text: '부산 쪽이에요'}});

        expect(answer.text).toBe('온천은 부산 쪽이에요');
    });

    it('[SUCCESS] 완료되면 저장된 답과 남은 질문 수로 맞춘다', () => {
        let answer: ChatAnswerType = applyChatEvent(EMPTY_ANSWER, {event: 'progress', data: {phase: 'ANSWERING'}});
        answer = applyChatEvent(answer, {event: 'delta', data: {text: '온천은'}});
        answer = applyChatEvent(answer, {event: 'done', data: {message: {role: 'AI', content: '온천은 부산 해운대가 좋아요.', stores: [card('a'.repeat(32), '해운대 스테이')], created_at: '2026-11-25T03:00:00.000Z'}, quota: quota({remaining_count: 2, used_count: 3})}});

        expect(answer.status).toBe('done');
        expect(answer.text).toBe('온천은 부산 해운대가 좋아요.');
        expect(answer.stores.map((store) => store.store_name)).toEqual(['해운대 스테이']);
        expect(answer.progress).toBeNull();
        expect(answer.quota?.remaining_count).toBe(2);
    });

    it('[FAIL:failed] 도중에 실패하면 실패 문구만 남는다', () => {
        let answer: ChatAnswerType = applyChatEvent(EMPTY_ANSWER, {event: 'stores', data: {list: [card('a'.repeat(32), '해운대 스테이')]}});
        answer = applyChatEvent(answer, {event: 'delta', data: {text: '온천은 '}});
        answer = applyChatEvent(answer, {event: 'failed', data: {status_code: 503, message: 'AI 답을 만들지 못했습니다. 잠시 후 다시 시도해주세요.', validation_errors: null}});

        expect(answer.status).toBe('failed');
        expect(answer.stores).toEqual([]);
        expect(answer.text).toBe('답을 받지 못했어요. 잠시 후 다시 물어봐 주세요.');
        expect(answer.quota).toBeNull();
    });
});

describe('chatSendLock — 보내기를 막는 이유', () => {
    it('[FAIL:answering] 이 화면에서 답을 받는 중이면 막는다', () => {
        expect(chatSendLock(quota(), true)).toBe('답을 받고 있어요.');
    });

    it('[FAIL:quota] 오늘 다 썼으면 다시 채워지는 시각을 알린다', () => {
        expect(chatSendLock(quota({remaining_count: 0, used_count: 5}), false)).toBe('오늘 질문을 모두 사용했어요. 11월 26일(목) 00:00에 다시 채워져요.');
    });

    it('[FAIL:elsewhere] 다른 곳에서 보낸 질문에 답하는 중이면 막는다', () => {
        expect(chatSendLock(quota({is_answering: 1}), false)).toBe('다른 곳에서 보낸 질문에 답하고 있어요. 답이 끝난 뒤 보내 주세요.');
    });

    it('[SUCCESS] 막을 이유가 없으면 보낼 수 있다', () => {
        expect(chatSendLock(quota(), false)).toBeNull();
    });
});

describe('answerBlocks — 답 글 굵게 · 목록', () => {
    it('[SUCCESS] 별표 두 개로 감싼 말은 굵게 보인다', () => {
        expect(answerBlocks('부산 **해운대** 온천')).toEqual([
            {type: 'paragraph', inlines: [{text: '부산 ', bold: false}, {text: '해운대', bold: true}, {text: ' 온천', bold: false}]},
        ]);
    });

    it('[SUCCESS] 줄머리 표시가 있는 줄은 목록이 된다', () => {
        expect(answerBlocks('추천:\n- 해운대\n- 동래')).toEqual([
            {type: 'paragraph', inlines: [{text: '추천:', bold: false}]},
            {type: 'list', ordered: false, items: [[{text: '해운대', bold: false}], [{text: '동래', bold: false}]]},
        ]);
    });

    it('[SUCCESS] 태그처럼 보이는 글자도 글자 그대로다', () => {
        expect(answerBlocks('<b>굵게</b>')).toEqual([
            {type: 'paragraph', inlines: [{text: '<b>굵게</b>', bold: false}]},
        ]);
    });
});
