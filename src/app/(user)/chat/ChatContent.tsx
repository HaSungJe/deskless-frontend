'use client';
import { FormEvent, useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import { getChat, getChatQuota, resetChat, sendChatMessage } from '@/contracts/chat/api';
import { ChatMessageDto } from '@/contracts/chat/dto/chat-message.dto';
import { handleApiError } from '@/shared/api/error';
import { isAbortError } from '@/shared/api/request';
import { StreamEventType } from '@/shared/api/stream';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import UserTopBar from '../_components/UserTopBar';
import ChatBubble from './_components/ChatBubble';
import { applyChatEvent, bubbleOfAnswer, bubblesOf, CHAT_NAME, ChatBubbleType, ChatQuotaType, chatSendLock, EMPTY_ANSWER, finishAnswer, quotaAfterFailure, userBubble } from './chat-format';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/ChatContent.module.css';

type ChatContentProps = {
    inModal?: boolean; // 지도 위 팝업 안 — 머리(UserTopBar)는 팝업 제목이 대신한다
};

/** 질문 최대 글자 수 — ChatMessageDto */
const QUESTION_MAX = 100;

/** 첫 안내의 예시 질문 — 누르면 입력칸에 채운다 */
const EXAMPLE_QUESTIONS: ReadonlyArray<string> = ['온천 가고 싶은데 갈 만한 데 있을까?', '강아지랑 같이 묵을 수 있는 곳 찾아줘', '주차되는 조용한 숙소 추천해줘'];

/**
 * 여행 도우미 — 대화 보기 · 질문 보내기(스트림) · 남은 질문 수 · 대화 초기화
 * - 답을 받는 중에 화면을 떠나면 요청을 끊는다(서버도 멈추고 저장 · 횟수 없음)
 * - 시작 전 거절과 도중 실패는 이벤트를 하나라도 받았는지로 가른다(시작 전이면 저장되지 않았으니 말풍선을 지운다)
 *
 * @param param0
 * @returns
 */
export default function ChatContent({inModal = false}: ChatContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                               // 이용자 토큰
    const abortRef = useRef<AbortController | null>(null);                                                                              // 답을 받는 중 요청 — 떠나면 끊는다
    const listRef = useRef<HTMLDivElement | null>(null);                                                                                // 말풍선 목록 — 새 글이면 아래로
    const loadChat = useEffectEvent((signal: AbortSignal) => getChat(auth, signal));                                                    // 그때의 auth 로
    const loadQuota = useEffectEvent((signal: AbortSignal) => (abortRef.current ? Promise.resolve(null) : getChatQuota(auth, signal))); // 받는 중이면 다시 읽지 않는다

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                  // ② 다시 불러오기 · ④ 초기화 뒤
    const [bubbles, setBubbles] = useState<Array<ChatBubbleType>>([]);      // ② 말풍선(오래된 순)
    const [quota, setQuota] = useState<ChatQuotaType | null>(null);         // ② 남은 질문 수 — 읽기 전 null
    const [failed, setFailed] = useState<boolean>(false);                   // ② 대화를 못 읽음
    const [question, setQuestion] = useState<string>('');                   // ③ 입력칸
    const [answering, setAnswering] = useState<boolean>(false);             // ③ 이 화면에서 답을 받는 중
    const [confirmingReset, setConfirmingReset] = useState<boolean>(false); // ④ 확인 창
    const [resetting, setResetting] = useState<boolean>(false);             // ④ 초기화 중

    // 계산 값
    const lock = quota ? chatSendLock(quota, answering) : null;                // ③ 보내기를 막는 이유
    const canSend = quota !== null && lock === null && question.trim() !== ''; // ③ 보내기 버튼

    // 효과
    useEffect(() => {
        // ② 대화 읽기 — 처음 · 다시 불러오기 · 초기화 뒤(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadChat(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setBubbles(bubblesOf(next?.messages ?? []));
                setQuota(next?.quota ?? null);
                setFailed(next === null);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setFailed(true);
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [reloadKey]);

    useEffect(() => {
        // ② 다른 탭에서 돌아오면 남은 질문 수만 다시(답을 받는 중이면 건너뛴다)
        let controller: AbortController | null = null; // 진행 중 다시 읽기
        function refresh(): void {
            if (document.visibilityState !== 'visible') {
                return;
            }

            controller?.abort();
            const current = new AbortController();
            controller = current;
            loadQuota(current.signal).then((next) => {
                if (!current.signal.aborted && next) {
                    setQuota(next);
                }
            }).catch((error: unknown) => {
                if (!current.signal.aborted) {
                    handleApiError(error);
                }
            });
        }

        document.addEventListener('visibilitychange', refresh);
        return () => {
            document.removeEventListener('visibilitychange', refresh);
            controller?.abort();
        };
    }, []);

    useEffect(() => () => {
        // ⑤ 화면을 떠나면 답을 받는 중 요청을 끊는다
        abortRef.current?.abort();
    }, []);

    useEffect(() => {
        // 새 말풍선 · 글 조각이면 맨 아래로
        listRef.current?.scrollTo?.({top: listRef.current.scrollHeight});
    }, [bubbles]);

    // 함수
    function updateBubble(id: string, next: ChatBubbleType | null): void {
        // 말풍선 하나 바꾸기(null 이면 지우기)
        setBubbles((prev) => prev.flatMap((bubble) => (bubble.id !== id ? [bubble] : next ? [next] : [])));
    }

    async function send(event: FormEvent<HTMLFormElement>): Promise<void> {
        // ①② 검사(칸 옆) → 내 말풍선 · 빈 답 말풍선 → ③ 스트림 → ④ 완료 · 남은 질문 수
        event.preventDefault();
        if (!canSend) {
            return;
        }

        const dto = Object.assign(new ChatMessageDto(), {content: question.trim()});
        if (!(await validateAction(dto))) {
            return;
        }

        const stamp = String(Date.now());                        // 이번 질문의 말풍선 키
        const userId = `user-${stamp}`;
        const aiId = `ai-${stamp}`;
        const current = {answer: EMPTY_ANSWER, received: false}; // 쌓이는 답 · 이벤트를 하나라도 받았는지
        const controller = new AbortController();
        const onEvent = (streamEvent: StreamEventType): void => {
            // ③ 이벤트마다 답을 쌓아 AI 말풍선 하나만 바꾼다
            current.received = true;
            current.answer = applyChatEvent(current.answer, streamEvent);
            updateBubble(aiId, bubbleOfAnswer(aiId, current.answer));
        };

        abortRef.current = controller;
        setBubbles((prev) => [...prev, userBubble(userId, dto.content), bubbleOfAnswer(aiId, EMPTY_ANSWER)]);
        setQuestion('');
        setAnswering(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await sendChatMessage(auth, dto, onEvent, controller.signal);
        } catch (error) {
            failure = {error};
        }

        abortRef.current = null;
        setAnswering(false);
        if (failure && isAbortError(failure.error)) {
            return; // ⑤ 떠났다 — 그릴 화면이 없다
        }

        if (failure && !current.received) {
            // ② 시작 전 거절 — 저장되지 않았으니 두 말풍선을 지운다, 429 면 남은 0 으로 막고(오류 팝업 없이) 그 밖은 질문을 칸에 돌려두고 받은 문구
            updateBubble(userId, null);
            updateBubble(aiId, null);
            const nextQuota = quotaAfterFailure(quota, failure.error);
            if (nextQuota) {
                setQuota(nextQuota);
                return;
            }

            setQuestion(dto.content);
            handleApiError(failure.error);
            return;
        }

        // ④ 완료 — 끝까지 done · failed 가 없었거나 도중에 끊겼으면 실패 말풍선
        const finished = finishAnswer(current.answer);
        updateBubble(aiId, bubbleOfAnswer(aiId, finished));
        if (finished.quota) {
            setQuota(finished.quota);
        }
    }

    async function confirmReset(): Promise<void> {
        // ④ 확인 → 초기화(큐) → 대화 다시 읽기(done · pending 이 같은 null — 다시 읽어 맞춘다)
        if (resetting) {
            return;
        }

        setResetting(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await resetChat(auth);
        } catch (error) {
            failure = {error};
        }

        setResetting(false);
        setConfirmingReset(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        setReloadKey((key) => key + 1);
    }

    return (
        // 여행 도우미
        <div className={inModal ? styles.modal : pageStyles.page}>
            {/* 머리 — 보통 화면만(팝업은 팝업 제목) */}
            {inModal ? null : <UserTopBar title={CHAT_NAME} />}

            <div className={inModal ? styles.chatInModal : styles.chat}>
                {/* ② 남은 질문 수 · ④ 초기화 */}
                <div className={styles.head}>
                    <span className={styles.quota}>{quota ? `오늘 남은 질문 ${quota.remaining_count}회` : ''}</span>
                    <Button size="sm" disabled={answering || resetting || bubbles.length === 0} onClick={() => setConfirmingReset(true)}>대화 초기화</Button>
                </div>

                {/* ② 말풍선 · 첫 안내 · 못 읽음 */}
                <div ref={listRef} className={styles.messages} aria-live="polite">
                    {failed && !quota ? <EmptyState title="대화를 불러오지 못했어요" description="잠시 뒤 다시 불러와 주세요." action={<Button size="sm" onClick={() => setReloadKey((key) => key + 1)}>다시 불러오기</Button>} /> : null}
                    {quota && bubbles.length === 0 ? (
                        <div className={styles.welcome}>
                            <strong className={styles.welcomeTitle}>어디로 떠나고 싶으세요?</strong>
                            <p className={styles.welcomeText}>가고 싶은 곳 · 함께 가는 사람 · 필요한 시설을 말해 주면 지역과 숙소를 찾아 드려요.</p>
                            <div className={styles.examples}>
                                {EXAMPLE_QUESTIONS.map((example) => <button key={example} type="button" className={styles.example} onClick={() => setQuestion(example)}>{example}</button>)}
                            </div>
                        </div>
                    ) : null}
                    {bubbles.map((bubble) => <ChatBubble key={bubble.id} bubble={bubble} />)}
                </div>

                {/* ①③ 입력 — 막는 이유가 있으면 칸 · 버튼을 막고 그 이유 */}
                <form className={styles.form} onSubmit={send}>
                    {lock ? <Band tone={answering ? 'info' : 'warn'} role="status">{lock}</Band> : null}
                    <Field label="질문" name="content" htmlFor="chat-question" hint={<span>{question.length} / {QUESTION_MAX}</span>}>
                        <div className={styles.inputRow}>
                            <Input id="chat-question" placeholder="예: 온천 가고 싶은데 갈 만한 데 있을까?" maxLength={QUESTION_MAX} value={question} disabled={quota === null || lock !== null} onChange={(event) => setQuestion(event.target.value)} />
                            <Button type="submit" variant="primary" disabled={!canSend}>보내기</Button>
                        </div>
                    </Field>
                    <p className={styles.note}>대화는 7일 뒤 저절로 지워져요.</p>
                </form>
            </div>

            {/* ④ 확인 창 */}
            <ConfirmModal open={confirmingReset} title="대화 초기화" message="대화를 모두 지울까요? 오늘 남은 질문 수는 그대로예요." confirmLabel="초기화" danger busy={resetting} onConfirm={confirmReset} onClose={() => setConfirmingReset(false)} />
        </div>
    );
}
