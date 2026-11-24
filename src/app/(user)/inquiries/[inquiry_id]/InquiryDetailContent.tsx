'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getMyInquiry } from '@/contracts/inquiry/api';
import { InquiryDetailResultDto } from '@/contracts/inquiry/dto/inquiry-detail.dto';
import { INQUIRY_STATE } from '@/contracts/inquiry/inquiry.constants';
import { inquiryStateTone } from '@/contracts/inquiry/inquiry-state';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatDateTime } from '@/shared/utils/format';
import UserTopBar from '../../_components/UserTopBar';
import { INQUIRY_LIST_PATH, inquiryTargetName } from '../inquiry-format';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/InquiryDetailContent.module.css';

type InquiryDetailContentProps = {
    inquiryId: string; // 주소의 문의 ID
};

/** 블라인드 안내 — 요청서 문구 그대로(사용자 결정 2026-11-24) */
const BLIND_NOTICE = '스팸/반복성 문의로 블라인드 된 문의입니다.';

/**
 * 내 문의 상세 — 블라인드 안내 · 상태 · 카테고리 · 대상 · 제목 · 내용 · 답변
 *
 * @param param0
 * @returns
 */
export default function InquiryDetailContent({inquiryId}: InquiryDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                              // 이용자 토큰
    const loadInquiry = useEffectEvent((signal: AbortSignal) => getMyInquiry(auth, inquiryId, signal)); // 그때의 auth 로

    // 상태
    const [inquiry, setInquiry] = useState<InquiryDetailResultDto | null>(null); // ① 상세
    const [failed, setFailed] = useState<boolean>(false);                         // ① 못 읽음

    // 효과
    useEffect(() => {
        // ① 상세(문의가 바뀌면 다시 · 떠나면 결과를 버린다)
        const controller = new AbortController();
        loadInquiry(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setInquiry(next);
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
    }, [inquiryId]);

    return (
        // 내 문의 상세
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="문의 상세" parents={[{label: '내 정보', href: '/me/'}, {label: '문의', href: INQUIRY_LIST_PATH}]} />

            <div className={pageStyles.body}>
                {/* ① 못 읽음 */}
                {!inquiry && failed ? <EmptyState title="문의를 불러오지 못했어요" description="없는 문의이거나 잠시 연결이 안 돼요." action={<Link href={INQUIRY_LIST_PATH} className={buttonClass({size: 'sm'})}>문의 목록</Link>} /> : null}

                {inquiry ? (
                    <>
                        {/* ② 블라인드 안내 — 내용은 그대로 */}
                        {inquiry.inquiry_state_id === INQUIRY_STATE.BLIND ? <Band tone="warn">{BLIND_NOTICE}</Band> : null}

                        {/* ③ 문의 */}
                        <section className={pageStyles.card} aria-labelledby="inquiry-title">
                            <div className={styles.head}><Badge tone={inquiryStateTone(inquiry.inquiry_state_id)}>{inquiry.inquiry_state_name}</Badge><span className={styles.category}>{inquiry.inquiry_category_name}</span></div>
                            <h2 id="inquiry-title" className={styles.title}>{inquiry.title}</h2>
                            <dl className={pageStyles.dl}>
                                <dt>문의 대상</dt><dd>{inquiryTargetName(inquiry.store_name)}</dd>
                                <dt>문의일</dt><dd>{formatDateTime(inquiry.created_at)}</dd>
                            </dl>
                            <p className={styles.content}>{inquiry.content}</p>
                        </section>

                        {/* ③ 답변 */}
                        <section className={pageStyles.card} aria-labelledby="inquiry-answer-title">
                            <h2 id="inquiry-answer-title" className={pageStyles.cardTitle}>답변</h2>
                            {inquiry.answer_content ? (
                                <>
                                    <p className={styles.content}>{inquiry.answer_content}</p>
                                    <span className={styles.answeredAt}>{formatDateTime(inquiry.answered_at)}</span>
                                </>
                            ) : <p className={styles.muted}>아직 답변이 없어요</p>}
                        </section>
                    </>
                ) : null}
            </div>
        </div>
    );
}
