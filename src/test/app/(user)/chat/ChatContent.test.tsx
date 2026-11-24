import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import ChatContent from '@/app/(user)/chat/ChatContent';
import { ChatCardType, ChatQuotaType } from '@/app/(user)/chat/chat-format';
import { ChatDetailResultDto } from '@/contracts/chat/dto/chat-detail.dto';
import { ChatMessageDto } from '@/contracts/chat/dto/chat-message.dto';
import { ApiError } from '@/shared/api/request';
import { StreamEventType } from '@/shared/api/stream';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {getChat, getChatQuota, sendChatMessage, resetChat, showErrorPopup} = vi.hoisted(() => ({
    getChat: vi.fn(),
    getChatQuota: vi.fn(),
    sendChatMessage: vi.fn(),
    resetChat: vi.fn(),
    showErrorPopup: vi.fn(),
}));

vi.mock('@/contracts/chat/api', () => ({getChat, getChatQuota, sendChatMessage, resetChat}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

/** 로그인한 이용자 */
const AUTH: AuthContextType = {area: 'user', token: 'user-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/** 업체 ID */
const STORE_ID = 'c1'.repeat(16);

/** 추천 업체 카드 — 사진 없음 · 온천 · PC */
const CARD: ChatCardType = {
    store_id: STORE_ID,
    store_name: '해운대 온천 스테이',
    address: '부산광역시 해운대구 중동 1',
    latitude: 35.16,
    longitude: 129.16,
    image_url: null,
    facilities: [{key: 'has_hot_spring', name: '온천', group: 'STORE'}, {key: 'has_pc', name: 'PC', group: 'ROOM_GROUP'}],
};

/**
 * 남은 질문 수
 *
 * @param remaining 남은 수
 */
function quotaOf(remaining: number): ChatQuotaType {
    return {daily_limit: 5, used_count: 5 - remaining, remaining_count: remaining, resets_at: '2026-11-25T15:00:00.000Z', is_answering: 0};
}

/** 이전 대화 — 질문 한 건(USER · AI) */
const SAVED_CHAT: ChatDetailResultDto = {
    messages: [
        {role: 'USER', content: '부산 온천 숙소 있어?', stores: [], created_at: '2026-11-24T03:00:00.000Z'},
        {role: 'AI', content: '**해운대**에 온천 숙소가 있어요.', stores: [CARD], created_at: '2026-11-24T03:00:20.000Z'},
    ],
    quota: quotaOf(3),
};

/** 대화한 적 없음 */
const EMPTY_CHAT: ChatDetailResultDto = {messages: [], quota: quotaOf(3)};

/**
 * 대화 화면을 그리고 대화를 기다린다
 */
async function renderChat(): Promise<{unmount: () => void}> {
    let rendered: {unmount: () => void} = {unmount: () => undefined};
    await act(async () => {
        rendered = render(
            <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                <ChatContent />
            </RootLayoutProvider>,
        );
    });
    return rendered;
}

/**
 * 질문을 쓰고 보낸다
 *
 * @param text 질문
 */
async function ask(text: string): Promise<void> {
    fireEvent.change(screen.getByRole('textbox', {name: '질문'}), {target: {value: text}});
    await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: '보내기'}));
    });
}

beforeEach(() => {
    getChat.mockReset().mockResolvedValue(SAVED_CHAT);
    getChatQuota.mockReset();
    sendChatMessage.mockReset();
    resetChat.mockReset().mockResolvedValue(null);
    showErrorPopup.mockClear();
});

describe('ChatContent', () => {
    it('[SUCCESS] 이전 대화가 있는 이용자가 연다 → 대화 보기 1번 → 질문 · 답 말풍선(굵게) · 업체 카드(칩 · 업체 상세 링크) · 오늘 남은 질문 3회', async () => {
        await renderChat();

        expect(getChat).toHaveBeenCalledTimes(1);
        expect(getChat.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(screen.getByText('부산 온천 숙소 있어?')).toBeTruthy();
        expect(screen.getByText('해운대').tagName).toBe('STRONG');
        const card = within(screen.getByRole('list', {name: '추천 업체'})).getByRole('link', {name: /해운대 온천 스테이/});
        expect(card.getAttribute('href')).toBe(`/stores/${STORE_ID}/`);
        expect(card.textContent).toContain('부산광역시 해운대구 중동 1');
        expect(card.textContent).toContain('온천');
        expect(card.textContent).toContain('PC');
        expect(screen.getByText('오늘 남은 질문 3회')).toBeTruthy();
        expect(screen.queryByText('어디로 떠나고 싶으세요?')).toBeNull();
        expect(document.body.textContent).not.toContain(STORE_ID);
    });

    it('[SUCCESS] "온천 가고 싶은데 갈 만한 데 있을까?" 를 보낸다 → 질문 보내기 1번 → 내 말풍선 · 진행 표시 → 카드 · 글 이어 붙임 → 완료 · 오늘 남은 질문 2회 · 입력칸 비움', async () => {
        getChat.mockResolvedValue(EMPTY_CHAT);
        let resume: () => void = () => undefined;
        sendChatMessage.mockImplementation(async (_auth: unknown, _dto: unknown, onEvent: (event: StreamEventType) => void) => {
            onEvent({event: 'progress', data: {phase: 'SEARCHING_WEB'}});
            await new Promise<void>((resolve) => {
                resume = resolve;
            });
            onEvent({event: 'stores', data: {list: [CARD]}});
            onEvent({event: 'delta', data: {text: '온천은 '}});
            onEvent({event: 'delta', data: {text: '**해운대**가 좋아요.'}});
            onEvent({event: 'done', data: {message: {role: 'AI', content: '온천은 **해운대**가 좋아요.', stores: [CARD], created_at: '2026-11-25T03:00:00.000Z'}, quota: quotaOf(2)}});
        });
        await renderChat();

        await ask('  온천 가고 싶은데 갈 만한 데 있을까?  ');

        // 받는 중 — 내 말풍선 · 진행 표시 · 보내기 막힘
        expect(sendChatMessage).toHaveBeenCalledTimes(1);
        expect(sendChatMessage.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(sendChatMessage.mock.calls[0][1]).toBeInstanceOf(ChatMessageDto);
        expect({...sendChatMessage.mock.calls[0][1]}).toEqual({content: '온천 가고 싶은데 갈 만한 데 있을까?'});
        expect(sendChatMessage.mock.calls[0][3]).toBeInstanceOf(AbortSignal);
        expect(screen.getByText('온천 가고 싶은데 갈 만한 데 있을까?')).toBeTruthy();
        expect(screen.getByText('웹에서 찾고 있어요…')).toBeTruthy();
        expect(screen.getByRole('status').textContent).toBe('답을 받고 있어요.');
        expect((screen.getByRole('button', {name: '보내기'}) as HTMLButtonElement).disabled).toBe(true);

        // 완료 — 글 · 카드 · 남은 질문 수 · 입력칸
        await act(async () => {
            resume();
        });

        expect(screen.queryByText('웹에서 찾고 있어요…')).toBeNull();
        expect(screen.getByText('해운대').tagName).toBe('STRONG');
        expect(within(screen.getByRole('list', {name: '추천 업체'})).getByRole('link', {name: /해운대 온천 스테이/}).getAttribute('href')).toBe(`/stores/${STORE_ID}/`);
        expect(screen.getByText('오늘 남은 질문 2회')).toBeTruthy();
        expect((screen.getByRole('textbox', {name: '질문'}) as HTMLInputElement).value).toBe('');
        expect(screen.queryByRole('status')).toBeNull();
        expect(showErrorPopup).not.toHaveBeenCalled();
    });

    it('[FAIL:quota] 오늘 질문을 다 쓴 뒤 보낸다(429) → 입력칸 · 버튼 막힘 · 다시 채워지는 시각 안내 · 내 말풍선 지움 · 오류 팝업 없음', async () => {
        getChat.mockResolvedValue(EMPTY_CHAT);
        sendChatMessage.mockRejectedValue(new ApiError(429, {message: '오늘 질문을 모두 사용했습니다. 자정(한국 시각)에 다시 채워집니다.', validation_errors: null, resets_at: '2026-11-25T15:00:00.000Z'} as ConstructorParameters<typeof ApiError>[1]));
        await renderChat();

        await ask('부산 숙소 하나 더 찾아줘');

        expect(sendChatMessage).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('status').textContent).toBe('오늘 질문을 모두 사용했어요. 11월 26일(목) 00:00에 다시 채워져요.');
        expect((screen.getByRole('textbox', {name: '질문'}) as HTMLInputElement).disabled).toBe(true);
        expect((screen.getByRole('button', {name: '보내기'}) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.queryByText('부산 숙소 하나 더 찾아줘')).toBeNull();
        expect(screen.getByText('오늘 남은 질문 0회')).toBeTruthy();
        expect(showErrorPopup).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 답을 받는 중에 대화창을 닫는다 → 요청 끊김(취소 신호)', async () => {
        getChat.mockResolvedValue(EMPTY_CHAT);
        let received: AbortSignal | null = null;
        sendChatMessage.mockImplementation((_auth: unknown, _dto: unknown, _onEvent: unknown, signal: AbortSignal) => {
            received = signal;
            return new Promise<void>(() => undefined);
        });
        const {unmount} = await renderChat();

        await ask('강아지랑 같이 묵을 수 있는 곳 찾아줘');
        expect(received).not.toBeNull();
        expect((received as unknown as AbortSignal).aborted).toBe(false);

        act(() => {
            unmount();
        });

        expect((received as unknown as AbortSignal).aborted).toBe(true);
    });

    it('[SUCCESS] 대화가 있는 이용자가 초기화를 확인한다 → 확인 창 → 대화 초기화(큐) 1번 → 대화 다시 읽기 · 말풍선 없음 · 첫 안내 · 남은 질문 수 그대로', async () => {
        getChat.mockResolvedValueOnce(SAVED_CHAT).mockResolvedValueOnce(EMPTY_CHAT);
        await renderChat();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '대화 초기화'}));
        });
        expect(resetChat).not.toHaveBeenCalled();
        const dialog = within(document.querySelector('dialog[open]') as HTMLElement);
        expect(dialog.getByText('대화를 모두 지울까요? 오늘 남은 질문 수는 그대로예요.')).toBeTruthy();
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '초기화'}));
        });

        expect(resetChat).toHaveBeenCalledTimes(1);
        expect(resetChat.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(getChat).toHaveBeenCalledTimes(2);
        expect(screen.queryByText('부산 온천 숙소 있어?')).toBeNull();
        expect(screen.getByText('어디로 떠나고 싶으세요?')).toBeTruthy();
        expect(screen.getByText('오늘 남은 질문 3회')).toBeTruthy();
        expect(document.querySelector('dialog[open]')).toBeNull();
    });
});
