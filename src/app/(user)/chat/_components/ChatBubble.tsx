'use client';
import { answerBlocks, ChatBubbleType, InlineType } from '../chat-format';
import ChatStoreCard from './ChatStoreCard';
import styles from '@/app/css/user/ChatBubble.module.css';

type ChatBubbleProps = {
    bubble: ChatBubbleType; // 말풍선 — 질문 · 답(받는 중 · 완료 · 실패)
};

/**
 * 글 조각 — 굵은 조각은 strong(HTML 문자열을 넣지 않는다 — 태그처럼 보이는 글자도 글자 그대로)
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
