# Plan — 여행 도우미 — AI 대화로 숙소 찾기

> 무엇을·왜는 [spec](../../spec/chat/chat-ai-search-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 진입점마다 비즈니스 로직 전체 ② 계산 함수 ③ 규약만으로 예측할 수 없는 데이터 규칙
> **싣지 않는 것** DTO 사본, 형제와 같은 contracts 함수 · page 껍데기 · 카드 — 따르는 패턴을 표 한 줄로 가리킨다

백엔드 수정 요청 `frontend/changes/2026-11-25-chat-ai-search.md` 를 이 plan 하나로 만든다(로드맵 밖). 새로 생기는 것은 세 가지 — 여러 이벤트를 받는 스트림 함수(`src/shared/api/stream.ts`), 첫 실제 경로 모달(`/chat/` — 지도에서 열면 팝업), 대화 화면(`src/app/(user)/chat/`).

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/shared/api/stream.ts` | 신규 | `callStream` — 시작 전 실패는 `ApiError`, 이벤트는 오는 대로 넘김 | 아래 3-1 |
| `src/contracts/chat/dto/chat-message.dto.ts` · `chat-detail.dto.ts` · `chat-quota.dto.ts` | 신규 | 요청서 DTO 사본 | 생략 (아래 4) |
| `src/contracts/chat/chat.constants.ts` | 신규 | 스트림 이벤트 · 진행 단계 · 말한 쪽 값 | 아래 3-2 |
| `src/contracts/chat/api.ts` | 신규 | 대화 보기 · 남은 질문 수 · 질문 보내기(스트림) · 초기화(큐) | 아래 3-2 (보내기) · 생략 (아래 4) |
| `src/app/(user)/chat/chat-format.ts` | 신규 | 이름 · 주소 · 스트림으로 답 만들기 · 막는 이유 · 굵게 · 목록 · 말풍선 변환 | 아래 2 · 3-3 |
| `src/app/(user)/chat/page.tsx` · `ChatContent.tsx` | 신규 | 대화 화면(보통 페이지 — 새로고침 · 직접 접속) | 아래 1-2 |
| `src/app/(user)/chat/_components/ChatBubble.tsx` · `ChatStoreCard.tsx` | 신규 | 말풍선(굵게 · 목록 · 진행 · 카드) · 업체 카드 | 아래 1-3 · 생략 (아래 4) |
| `src/app/@modal/(.)chat/page.tsx` · `src/app/@modal/page.tsx` | 신규 | 지도 위 팝업(가로채기) · 홈에서 슬롯 비우기 | 아래 3-4 |
| `src/app/(user)/HomeContent.tsx` · `src/app/css/user/HomeContent.module.css` | 수정 | "가까운 순" → "여행 도우미" 버튼 | 아래 1-1 |
| `src/app/css/user/ChatContent.module.css` · `ChatBubble.module.css` · `ChatStoreCard.module.css` | 신규 | 대화 화면 스타일 | 아래 5 |
| 테스트 새 3파일 · 고친 1파일(아래 테스트) | 신규 · 수정 | spec 18건 + 스트림 함수 2건 | 아래 테스트 |
| `AGENTS.md` · `docs/architecture.md` · `docs/data-layer.md` · `docs/conventions.md` | 수정 | 스트림 함수 · 첫 경로 모달 · 여행 도우미 · 반영한 수정 요청 | 만드는 순서 8 |

---

## 1. 비즈니스 로직 — 화면별 코드

### 1-1. 지도 여행 도우미 버튼 — `HomeContent`

```tsx
// src/app/(user)/HomeContent.tsx — import
import { buttonClass } from '@/shared/components/ui/button/Button';
import { CHAT_NAME, CHAT_PATH } from './chat/chat-format';

// JSX — 목록 머리(가까운 순 글자를 지운다)
                <div className={styles.listHead}>
                    <h2 id="home-list-title" className={styles.listTitle}>주변 업체</h2>
                    {/* ① 여행 도우미 — 로그인했으면 대화창(지도 위 팝업), 아니면 로그인 뒤 대화창으로 */}
                    <Link href={auth.isLogin ? CHAT_PATH : loginUrl('user', CHAT_PATH)} className={buttonClass({size: 'sm'})}>{CHAT_NAME}</Link>
                </div>
```

`HomeContent.module.css` — `.listSort` 지우고 `.listHead` 의 `align-items: baseline` → `center`(버튼 높이). 위 계산 값 주석 "업체 목록(가까운 순 — 응답 그대로)" 은 응답 순서 설명이라 그대로 둔다.

### 1-2. 여행 도우미 대화 — `ChatContent`

대화 보기 · 질문 보내기 · 초기화가 한 화면이다. 스트림 콜백은 try **밖**에서 만들고(React Compiler — try 안에는 await 만), 답은 지역 객체(`current`)에 쌓아 말풍선 하나만 바꾼다. 시작 전 실패와 도중 실패는 "이벤트를 하나라도 받았는지"로 가른다(3-3).

```tsx
// src/app/(user)/chat/ChatContent.tsx
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
 *
 * @param param0
 * @returns
 */
export default function ChatContent({inModal = false}: ChatContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                    // 이용자 토큰
    const abortRef = useRef<AbortController | null>(null);                                                   // 답을 받는 중 요청 — 떠나면 끊는다
    const listRef = useRef<HTMLDivElement | null>(null);                                                     // 말풍선 목록 — 새 글이면 아래로
    const loadChat = useEffectEvent((signal: AbortSignal) => getChat(auth, signal));                         // 그때의 auth 로
    const loadQuota = useEffectEvent((signal: AbortSignal) => (abortRef.current ? Promise.resolve(null) : getChatQuota(auth, signal))); // 받는 중이면 다시 읽지 않는다

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                 // ② 다시 불러오기 · ④ 초기화 뒤
    const [bubbles, setBubbles] = useState<Array<ChatBubbleType>>([]);     // ② 말풍선(오래된 순)
    const [quota, setQuota] = useState<ChatQuotaType | null>(null);        // ② 남은 질문 수 — 읽기 전 null
    const [failed, setFailed] = useState<boolean>(false);                  // ② 대화를 못 읽음
    const [question, setQuestion] = useState<string>('');                  // ③ 입력칸
    const [answering, setAnswering] = useState<boolean>(false);            // ③ 이 화면에서 답을 받는 중
    const [confirmingReset, setConfirmingReset] = useState<boolean>(false); // ④ 확인 창
    const [resetting, setResetting] = useState<boolean>(false);            // ④ 초기화 중

    // 계산 값
    const lock = quota ? chatSendLock(quota, answering) : null;                  // ③ 보내기를 막는 이유
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
            // ② 시작 전 거절 — 저장되지 않았으니 두 말풍선을 지우고 질문을 칸에 돌려둔다, 429 면 남은 0 으로 막는다(오류 팝업 없이)
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
```

### 1-3. 말풍선 — `ChatBubble`

굵게 · 목록은 `answerBlocks`(2-3)가 나눈 덩어리를 React 요소로만 그린다(HTML 문자열을 넣지 않는다 — `<b>` 같은 글자는 글자 그대로). 받는 중이면 진행 문구를 보이고, 카드는 글 아래.

```tsx
// src/app/(user)/chat/_components/ChatBubble.tsx
'use client';
import { answerBlocks, ChatBubbleType, InlineType } from '../chat-format';
import ChatStoreCard from './ChatStoreCard';
import styles from '@/app/css/user/ChatBubble.module.css';

type ChatBubbleProps = {
    bubble: ChatBubbleType; // 말풍선 — 질문 · 답(받는 중 · 완료 · 실패)
};

/**
 * 글 조각 — 굵은 조각은 strong
 *
 * @param inlines 조각들
 */
function inlineNodes(inlines: Array<InlineType>): React.ReactNode {
    return inlines.map((inline, index) => (inline.bold ? <strong key={index}>{inline.text}</strong> : <span key={index}>{inline.text}</span>));
}

/**
 * 말풍선 — 질문은 오른쪽 글자 그대로, 답은 왼쪽 진행 문구 · 굵게 · 목록 · 업체 카드(최대 3곳)
 *
 * @param param0
 * @returns
 */
export default function ChatBubble({bubble}: ChatBubbleProps): React.ReactNode {
    // 계산 값
    const blocks = bubble.role === 'AI' && bubble.status !== 'failed' ? answerBlocks(bubble.content) : []; // 답 글 덩어리

    if (bubble.role === 'USER') {
        return (
            // 내 질문
            <div className={`${styles.bubble} ${styles.user}`}>{bubble.content}</div>
        );
    }

    return (
        // AI 답
        <div className={`${styles.bubble} ${styles.ai}`}>
            {/* 진행 — 받는 중 */}
            {bubble.progress ? <p className={styles.progress}>{bubble.progress}</p> : null}

            {/* 글 — 실패면 실패 문구 */}
            {bubble.status === 'failed' ? <p className={styles.failed}>{bubble.content}</p> : null}
            {blocks.map((block, index) => (block.type === 'paragraph'
                ? <p key={index} className={styles.paragraph}>{inlineNodes(block.inlines)}</p>
                : block.ordered
                    ? <ol key={index} className={styles.list}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{inlineNodes(item)}</li>)}</ol>
                    : <ul key={index} className={styles.list}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{inlineNodes(item)}</li>)}</ul>))}

            {/* 업체 카드 */}
            {bubble.stores.length > 0 ? (
                <ul className={styles.cards} aria-label="추천 업체">
                    {bubble.stores.map((store) => <li key={store.store_id}><ChatStoreCard store={store} /></li>)}
                </ul>
            ) : null}
        </div>
    );
}
```

---

## 2. 계산 함수 — `src/app/(user)/chat/chat-format.ts`

### 2-1. 스트림으로 답 만들기 — `applyChatEvent`

```ts
/** 스트림으로 만드는 AI 답 */
export type ChatAnswerType = {
    progress: string | null;               // 진행 문구 — 받는 중에만
    stores: Array<ChatCardType>;           // 업체 카드(추천 순서)
    text: string;                          // 답 글(이어 붙인 것 · 완료면 저장된 글 · 실패면 실패 문구)
    status: 'streaming' | 'done' | 'failed'; // 받는 중 · 완료 · 실패
    quota: ChatQuotaType | null;           // 완료 때 받은 남은 질문 수
};

/** 아직 아무 이벤트도 받지 않은 답 */
export const EMPTY_ANSWER: ChatAnswerType = {progress: null, stores: [], text: '', status: 'streaming', quota: null};

/** 답을 받지 못함 — 도중 실패 · 끝까지 완료가 없음 */
export const ANSWER_FAILED_MESSAGE = '답을 받지 못했어요. 잠시 후 다시 물어봐 주세요.';

/** 진행 단계 → 문구 — Map 이라 상속 이름에 속지 않는다 */
const PHASE_LABELS = new Map<string, string>([
    [CHAT_PHASE.SEARCHING_WEB, '웹에서 찾고 있어요…'],
    [CHAT_PHASE.SEARCHING_STORES, '숙소를 고르고 있어요…'],
    [CHAT_PHASE.ANSWERING, '답을 쓰고 있어요…'],
]);

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
        return {progress: null, stores: done?.message.stores ?? answer.stores, text: done?.message.content ?? answer.text, status: 'done', quota: done?.quota ?? null};
    }

    if (event.event === CHAT_STREAM_EVENT.FAILED) {
        return {progress: null, stores: [], text: ANSWER_FAILED_MESSAGE, status: 'failed', quota: null};
    }

    return answer;
}
```

### 2-2. 보내기를 막는 이유 — `chatSendLock`

```ts
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
```

### 2-3. 답 글 굵게 · 목록 — `answerBlocks`

```ts
/** 글 조각 — 굵게 여부 */
export type InlineType = {
    text: string;  // 글자
    bold: boolean; // **굵게**
};

/** 답 글 덩어리 — 문단 · 목록 */
export type AnswerBlockType =
    | {type: 'paragraph'; inlines: Array<InlineType>}                            // 문단(줄바꿈은 글자 안 \n — pre-wrap)
    | {type: 'list'; ordered: boolean; items: Array<Array<InlineType>>};        // 목록(- · * · • 또는 1. · 1))

/** 목록 줄 — 줄머리 `- ` · `* ` · `• ` 또는 `1. ` · `1) ` */
const LIST_LINE = /^\s*(?:([-*•])|(\d+)[.)])\s+(.*)$/;

/** 굵게 — **글자** */
const BOLD = /\*\*(.+?)\*\*/g;

/**
 * 한 줄을 글 조각으로 — **굵게** 만 굵은 조각, 나머지는 글자 그대로
 *
 * @param line 글
 */
function inlinesOf(line: string): Array<InlineType> {
    const inlines: Array<InlineType> = [];
    let last = 0;
    for (const match of line.matchAll(BOLD)) {
        if (match.index > last) {
            inlines.push({text: line.slice(last, match.index), bold: false});
        }
        inlines.push({text: match[1], bold: true});
        last = match.index + match[0].length;
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
```

---

## 3. 데이터 규칙 — 규약만으로 예측할 수 없는 부분

### 3-1. 스트림 함수 — `src/shared/api/stream.ts` `callStream`

큐(`src/shared/api/queue.ts:27` `callQueue`)는 `done` · `failed` · `pending` 하나를 받으면 끝나는 함수라 여러 이벤트를 차례로 받는 대화에 쓸 수 없다. 같은 모양(시작 전 실패 → `ApiError`, 읽다 끊김 → `NetworkError`, 끝나면 스트림 닫기)에 SSE 자르기(`takeSseEvents`)를 그대로 쓰고, 이벤트 이름의 뜻은 부르는 쪽(contracts · 화면)이 안다 — shared 는 도메인을 모른다.

```ts
// src/shared/api/stream.ts
import { ApiError, asNetworkError, buildHeaders, buildUrl, HttpMethodType, parseJson, sendRequest, toFailBody } from '@/shared/api/request';
import { takeSseEvents } from '@/shared/api/sse';

/** 스트림 이벤트 하나 — 이름 · JSON 으로 읽은 data(읽을 수 없으면 null) */
export type StreamEventType = {
    event: string; // 이벤트 이름 — event: 줄
    data: unknown; // data: 줄을 JSON 으로 읽은 값
};

/** 스트림 요청 옵션 */
export type StreamOptionsType = {
    method: Exclude<HttpMethodType, 'GET'>;      // 보내기
    path: string;                                // /api/v1 뒤 경로
    body?: unknown;                              // JSON 본문
    token?: string | null;                       // 로그인 토큰
    signal?: AbortSignal;                        // 취소 신호 — 화면을 떠나면 끊는다(서버도 멈춘다)
    onEvent: (event: StreamEventType) => void;   // 이벤트마다(받은 순서대로)
};

/**
 * 스트림 API 호출 — 응답이 text/event-stream 이고 이벤트가 여러 번 온다(AI 대화 질문 보내기)
 * - 시작 전 실패(400 · 401 · 409 · 429 · 503)는 일반 JSON 실패 본문 → ApiError(status, 본문 — resets_at 같은 칸도 그대로 남는다)
 * - 이벤트는 오는 대로 onEvent 에 넘기고 스트림이 끝나면 돌아온다 — 이벤트의 뜻(done · failed …)은 부르는 쪽이 안다
 * - 읽다 끊기면 NetworkError, 취소는 AbortError 그대로
 *
 * @param options 메서드 · 경로 · 본문 · 토큰 · 취소 신호 · 이벤트 받기
 */
export async function callStream({method, path, body, token, signal, onEvent}: StreamOptionsType): Promise<void> {
    const hasBody = body !== undefined;
    const response = await sendRequest(buildUrl(path), {
        method,
        headers: buildHeaders(token, hasBody, 'text/event-stream'),
        body: hasBody ? JSON.stringify(body) : undefined,
        signal,
    });

    if (!response.ok) {
        const text = await response.text().catch((error: unknown) => {
            throw asNetworkError(error);
        });
        throw new ApiError(response.status, toFailBody(parseJson(text)));
    }

    if (!response.body) {
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        for (;;) {
            const {value, done} = await reader.read().catch((error: unknown) => {
                throw asNetworkError(error); // 스트림을 읽다 끊겼다(취소면 AbortError 그대로)
            });
            if (done) {
                return;
            }

            const taken = takeSseEvents(buffer + decoder.decode(value, {stream: true}));
            buffer = taken.rest;
            for (const event of taken.events) {
                onEvent({event: event.event, data: parseJson(event.data) ?? null});
            }
        }
    } finally {
        await reader.cancel().catch((): void => undefined); // 끝났거나 실패 — 스트림을 닫는다
    }
}
```

### 3-2. 대화 값 · 질문 보내기 — `src/contracts/chat/chat.constants.ts` · `api.ts` `sendChatMessage`

```ts
// src/contracts/chat/chat.constants.ts
/** 질문 보내기 스트림 이벤트 — 요청서 "스트림 읽기" 순서 */
export const CHAT_STREAM_EVENT = {PROGRESS: 'progress', STORES: 'stores', DELTA: 'delta', DONE: 'done', FAILED: 'failed'} as const;

/** 진행 단계 — progress 이벤트의 phase */
export const CHAT_PHASE = {SEARCHING_WEB: 'SEARCHING_WEB', SEARCHING_STORES: 'SEARCHING_STORES', ANSWERING: 'ANSWERING'} as const;

/** 말한 쪽 — 대화 보기 messages 의 role */
export const CHAT_ROLE = {USER: 'USER', AI: 'AI'} as const;
```

```ts
// src/contracts/chat/api.ts — 질문 보내기(나머지 셋은 아래 4)
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
```

### 3-3. 말풍선 · 실패 갈래 — `src/app/(user)/chat/chat-format.ts`

대화 보기 메시지와 스트림 답을 같은 말풍선 모양으로 맞춘다. 실패는 세 갈래 — 시작 전 거절(저장 안 됨 — 말풍선을 지우고 429 면 남은 0), 도중 `failed`(2-1), 이벤트를 받다가 끊김 · 완료 없이 끝남(`finishAnswer` 가 실패로). 429 본문에는 `resets_at` 이 더 온다(요청서) — `toFailBody` 가 칸을 그대로 남긴다.

```ts
// src/app/(user)/chat/chat-format.ts — 위 2 와 같은 파일
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

/** 업체 카드 — 대화 보기 · 스트림 카드가 같은 모양 */
export type ChatCardType = ChatDetailCardResultDto;

/** 남은 질문 수 — 대화 보기 · 남은 질문 수 · done 이 같은 모양 */
export type ChatQuotaType = ChatQuotaResultDto;

/** 말풍선 하나 */
export type ChatBubbleType = {
    id: string;                              // key — 받은 대화는 순서, 이번 질문은 보낸 시각
    role: 'USER' | 'AI';                     // 질문 · 답
    content: string;                         // 글(실패면 실패 문구)
    stores: Array<ChatCardType>;             // 업체 카드(답에만)
    progress: string | null;                 // 진행 문구 — 받는 중에만
    status: 'streaming' | 'done' | 'failed'; // 받는 중 · 완료 · 실패
};

/**
 * 대화 보기 → 말풍선(오래된 순 그대로)
 *
 * @param messages 대화 보기 messages
 */
export function bubblesOf(messages: Array<ChatDetailMessageResultDto>): Array<ChatBubbleType> {
    return messages.map((message, index) => ({id: `saved-${index}`, role: message.role === CHAT_ROLE.USER ? 'USER' : 'AI', content: message.content, stores: message.stores ?? [], progress: null, status: 'done'}));
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
 * 스트림이 끝났을 때의 답 — 완료 · 실패 없이 끝났거나 읽다 끊겼으면 실패
 *
 * @param answer 지금까지의 답
 */
export function finishAnswer(answer: ChatAnswerType): ChatAnswerType {
    return answer.status === 'streaming' ? applyChatEvent(answer, {event: CHAT_STREAM_EVENT.FAILED, data: null}) : answer;
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

// ChatAnswerType · EMPTY_ANSWER · ANSWER_FAILED_MESSAGE · applyChatEvent — 위 2-1, chatSendLock — 위 2-2, answerBlocks — 위 2-3
```

### 3-4. 경로 모달 — `src/app/@modal/(.)chat/page.tsx` · `src/app/@modal/page.tsx`

첫 실제 경로 모달이다. `docs/architecture.md` "경로 모달" 의 미적용 줄대로 `@modal/page.tsx`(null)를 같이 둔다 — 팝업 안 링크로 홈(`/`)에 가면 `[...catchAll]` 이 `/` 에 맞지 않아 팝업이 남기 때문. 업체 카드로 업체 상세에 가면 `[...catchAll]` 이 슬롯을 비운다.

```tsx
// src/app/@modal/(.)chat/page.tsx
import AuthGuard from '@/shared/components/AuthGuard';
import RouteModal from '@/shared/components/ui/modal/RouteModal';
import { CHAT_NAME } from '@/app/(user)/chat/chat-format';
import ChatContent from '@/app/(user)/chat/ChatContent';

// 여행 도우미 — 지도에서 열면 지도 위 팝업(가로채기), 보통 페이지는 src/app/(user)/chat/page.tsx
export default function ChatIntercept(): React.ReactNode {
    return (
        // 팝업 — 닫으면 지도로(뒤로 가기), 로그인한 이용자만
        <RouteModal title={CHAT_NAME}>
            <AuthGuard>
                <ChatContent inModal />
            </AuthGuard>
        </RouteModal>
    );
}
```

```tsx
// src/app/@modal/page.tsx
// 홈(/)에서는 팝업 슬롯을 비운다 — [...catchAll] 은 / 에 맞지 않는다(팝업 안 링크로 홈에 가도 팝업이 남지 않게)
export default function ModalSlotHome(): null {
    return null;
}
```

---

## 4. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| `chat-message.dto.ts` · `chat-detail.dto.ts` · `chat-quota.dto.ts` | 요청서 코드 그대로(새 파일 — `//` 주석 사본) | `src/contracts/inquiry/dto/inquiry.dto.ts` |
| `getChat(auth, signal)` · `getChatQuota(auth, signal)` | `withAuth` + `request` GET `/user-service/chat` · `/chat/quota` | `src/contracts/inquiry/api.ts` `getMyInquiry` |
| `resetChat(auth)` | `withAuth` + `callQueue` DELETE `/user-service/chat`, `Promise<null>` | `src/contracts/store/api.ts` `cancelStoreApplication` |
| `src/app/(user)/chat/page.tsx` | 서버 page 가 `<AuthGuard>` 로 감싸고 `<ChatContent />` 만 | `src/app/(user)/inquiries/page.tsx` |
| `ChatStoreCard` | `<Link href={/stores/<업체>/}>` 한 줄 — 사진(56px · 없으면 그림) · 상호명 · 주소 · 편의시설 칩(`facilities` 받은 순서 `name`) | `src/app/(user)/inquiries/new/_components/StorePicker.tsx` `storeRow` · `StoreDetailContent.module.css` `.option` |

## 5. 스타일 — 형제 값

시안이 없다(요청서 — 주소 · 배치는 프론트). 색 · 크기는 토큰만.

- `src/app/css/user/ChatContent.module.css` — `.chat`(보통 화면 — `flex: 1` 세로 · 패딩 16px) · `.modal` · `.chatInModal`(팝업 안 — 높이 `min(70vh, 640px)` 세로) · `.head`(남은 질문 수 · 초기화 한 줄 — 양끝) · `.quota`(13px · `--muted`) · `.messages`(`flex: 1; overflow-y: auto` 세로 12px) · `.welcome` · `.welcomeTitle` · `.welcomeText` · `.examples` · `.example`(글자 버튼 칩 — `--surface-2` 바탕 · `--radius-lg`) · `.form`(아래 고정 — `border-top: 1px solid var(--line)`) · `.inputRow`(칸 + 버튼 — 입점 신청 주소 찾기 줄 값) · `.note`(12px · `--muted`).
- `src/app/css/user/ChatBubble.module.css` — `.bubble`(최대 너비 85% · `--radius-lg` · 패딩 10px 14px · 15px · `line-height: 1.6`) · `.user`(오른쪽 · `--primary-soft`) · `.ai`(왼쪽 · `--surface-2`) · `.progress` · `.failed`(13px · `--muted`) · `.paragraph`(`white-space: pre-wrap` · 위아래 0) · `.list`(왼쪽 18px) · `.cards`(세로 8px · 목록 표시 없음).
- `src/app/css/user/ChatStoreCard.module.css` — `StorePicker.module.css` 의 `.row` · `.thumb` · `.thumbImg` · `.info` · `.name` · `.address` 값 + `.chips`(줄바꿈 칩 6px) · `.chip`(`StoreDetailContent.module.css` `.option` 값).
- `src/app/css/user/HomeContent.module.css` — `.listSort` 지움, `.listHead` `align-items: center`.

## 테스트

spec의 "결과" 표에서 ✓ 표시된 6건과 "계산 규칙" 표 12건을 그대로 테스트로 옮긴다. 여기에는 추가분만 적는다.

| 종류 | 대상 | 이유 |
|---|---|---|
| 파일 배치 | 계산 — `src/test/app/(user)/chat/chat-format.test.ts`(12), 화면 — `src/test/app/(user)/chat/ChatContent.test.tsx`(대화 보기 1 · 보내기 1 · 429 1 · 떠나면 끊음 1 · 초기화 1) · `src/test/app/(user)/HomeContent.test.tsx`(버튼 1 — 로그인 · 로그인 전 두 번 그린다) | 규약(src 와 같은 경로) |
| 공통 인프라 | `src/test/shared/api/stream.test.ts` — ① 조각이 나뉘어 와도 이벤트를 받은 순서대로 넘기고 · 요청은 한 번 · `Accept: text/event-stream` · JSON 본문 ② 시작 전 429 는 `ApiError(429)` · 본문 `resets_at` 이 남고 이벤트 0번 | 새 shared 함수 — 큐 테스트(`src/test/shared/api/queue.test.ts`)와 같은 `fetch` stub · `sseResponse` 모양 |
| mock 경계 | `@/contracts/chat/api` 4개 — `sendChatMessage` 는 `onEvent` 를 차례로 부르는 구현(떠나면 끊음은 끝나지 않는 Promise · 받은 `signal` 이 `aborted`) | 실제 네트워크 금지(규약) — 보내기 · 초기화 호출 횟수 · 인자(DTO 종류 · 다듬은 질문 · 토큰) · 대화 다시 읽기 횟수 |

## 만드는 순서

1. 스트림 함수 `stream.ts` 와 그 테스트 → 2. DTO 사본 3개 · `chat.constants.ts` · contracts 4개 → 3. 계산 함수(`applyChatEvent` · `chatSendLock` · `answerBlocks`)와 그 테스트 · 말풍선 변환(3-3) → 4. `ChatBubble` · `ChatStoreCard` · css → 5. `ChatContent` · 보통 page 와 화면 테스트 → 6. 경로 모달(`@modal/(.)chat` · `@modal/page.tsx`) → 7. 홈 버튼 · css 와 홈 테스트 → 8. 문서 — `AGENTS.md`(Data Layer 에 스트림 `callStream` · 여행 도우미 · 첫 경로 모달), `docs/data-layer.md`(스트림 호출 · 반영한 수정 요청 `2026-11-25-chat-ai-search.md`), `docs/architecture.md`(경로 모달 미적용 줄 → 적용 · `(user)/chat/` · `shared/api/stream.ts`), `docs/conventions.md`(필요하면 경로 모달 예시)
