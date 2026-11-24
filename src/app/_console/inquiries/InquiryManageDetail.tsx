'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { InquiryAnswerDto } from '@/contracts/inquiry/dto/inquiry-answer.dto';
import { InquiryManageDetailResultDto } from '@/contracts/inquiry/dto/inquiry-manage-detail.dto';
import { inquiryStateTone } from '@/contracts/inquiry/inquiry-state';
import { handleApiError } from '@/shared/api/error';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Field from '@/shared/components/ui/form/Field';
import Textarea from '@/shared/components/ui/form/Textarea';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { INQUIRY_MANAGE, inquiryActionsOf, InquiryScopeType } from './inquiry-manage';
import styles from '@/app/css/console/InquiryManageDetail.module.css';

type InquiryManageDetailProps = {
    scope: InquiryScopeType; // 업체 관리자(/mine) · 관리자
    inquiryId: string;       // 주소의 문의 ID
};

/** 답변 최대 글자 수 — InquiryAnswerDto */
const ANSWER_MAX = 2000;

/**
 * 문의 관리 상세 — 문의 내용 · 답변 등록 · 수정 · 블라인드 · 해제(확인 창)
 * - 답변 칸은 상세를 읽을 때마다 받은 답변으로 다시 채운다(답변 뒤 다시 읽으면 저장된 답변이 남는다)
 * - 블라인드 · 해제는 같은 버튼 · 같은 확인 창 — 부를 API 만 할 수 있는 일(blinded)로 고른다
 *
 * @param param0
 * @returns
 */
export default function InquiryManageDetail({scope, inquiryId}: InquiryManageDetailProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                // 그 영역 토큰
    const manage = INQUIRY_MANAGE[scope];                                                                // 부를 API · 링크
    const loadInquiry = useEffectEvent((signal: AbortSignal) => manage.detail(auth, inquiryId, signal)); // 그때의 auth 로
    const applyInquiry = useEffectEvent((next: InquiryManageDetailResultDto | null) => {                  // 받은 상세 — 답변 칸은 처음 · 저장된 답변이 바뀔 때만 다시 채운다(블라인드 · 해제 뒤에는 쓰던 글이 남는다)
        if (inquiry === null || next?.inquiry_id !== inquiry.inquiry_id || next?.answer_content !== inquiry.answer_content) {
            setAnswer(next?.answer_content ?? '');
        }

        setInquiry(next);
        setFailed(next === null);
    });

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                             // ③④ 다시 읽기
    const [inquiry, setInquiry] = useState<InquiryManageDetailResultDto | null>(null); // ① 상세
    const [failed, setFailed] = useState<boolean>(false);                               // ① 못 읽음
    const [answer, setAnswer] = useState<string>('');                                   // ③ 답변 칸
    const [busy, setBusy] = useState<boolean>(false);                                   // ③④ 보내는 중
    const [confirming, setConfirming] = useState<boolean>(false);                       // ④ 확인 창
    const [notice, setNotice] = useState<string | null>(null);                          // ③ 답변 안내

    // 계산 값
    const actions = inquiry ? inquiryActionsOf(inquiry) : null; // ② 할 수 있는 일

    // 효과
    useEffect(() => {
        // ① 상세(문의가 바뀌거나 다시 읽을 때 · 떠나면 결과를 버린다)
        const controller = new AbortController();
        loadInquiry(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                applyInquiry(next);
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
    }, [inquiryId, reloadKey]);

    // 함수
    function reload(): void {
        // ③④ 상세 다시
        setReloadKey((key) => key + 1);
    }

    async function send(call: () => Promise<null>): Promise<boolean> {
        // 큐 호출 — 실패는 받은 문구(칸 오류는 칸 옆), 성공이면 true
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await call();
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error);
            return false;
        }

        return true;
    }

    async function submitAnswer(): Promise<void> {
        // ③ 답변 — 검사(칸 옆) → 답변(큐) → 띠 · 상세 다시
        if (!inquiry || !actions || busy || actions.answerLock) {
            return;
        }

        const dto = Object.assign(new InquiryAnswerDto(), {answer_content: answer.trim()});
        if (!(await validateAction(dto))) {
            return;
        }

        const id = inquiry.inquiry_id;                                                                  // 답변할 문의
        const message = actions.answerLabel === '답변 등록' ? '답변을 등록했어요.' : '답변을 고쳤어요.'; // 누를 때의 버튼으로
        if (await send(() => manage.answer(auth, id, dto))) {
            setNotice(message);
            reload();
        }
    }

    async function confirmBlind(): Promise<void> {
        // ④ 확인 → 블라인드 · 해제(큐) → 상세 다시
        if (!inquiry || !actions || busy) {
            return;
        }

        const id = inquiry.inquiry_id;          // 블라인드 · 해제할 문의
        const unblinding = actions.blinded;     // 누를 때의 버튼으로
        const done = await send(() => (unblinding ? manage.unblind(auth, id) : manage.blind(auth, id)));
        setConfirming(false);
        if (done) {
            setNotice(null);
            reload();
        }
    }

    if (!inquiry || !actions) {
        return failed ? (
            // ① 못 읽음
            <EmptyState title="문의를 불러오지 못했어요" description="없는 문의이거나 잠시 연결이 안 됩니다." action={<Link href={manage.listPath} className={buttonClass({size: 'sm'})}>문의 목록</Link>} />
        ) : null;
    }

    return (
        // 문의 관리 상세
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <p className={styles.crumb}><Link href={manage.listPath}>문의 목록</Link></p>
                <h1 className={styles.title}>{inquiry.title}<Badge tone={inquiryStateTone(inquiry.inquiry_state_id)}>{inquiry.inquiry_state_name}</Badge></h1>
                <p className={styles.sub}>{inquiry.user_nickname} · {inquiry.inquiry_category_name} · {toKst(inquiry.created_at, 'YYYY-MM-DD HH:mm')}</p>
            </div>

            <div className={styles.cols}>
                {/* ① 문의 내용 */}
                <Card title="문의 내용">
                    <div className={styles.cardBody}>
                        <dl className={styles.dl}>
                            <dt>작성자</dt><dd>{inquiry.user_nickname}</dd>
                            <dt>카테고리</dt><dd>{inquiry.inquiry_category_name}</dd>
                            <dt>상태</dt><dd><Badge tone={inquiryStateTone(inquiry.inquiry_state_id)}>{inquiry.inquiry_state_name}</Badge></dd>
                            <dt>문의일시</dt><dd className={styles.mono}>{toKst(inquiry.created_at, 'YYYY-MM-DD HH:mm')}</dd>
                            <dt>블라인드</dt><dd className={styles.mono}>{inquiry.blinded_at ? toKst(inquiry.blinded_at, 'YYYY-MM-DD HH:mm') : '—'}</dd>
                        </dl>
                        <p className={styles.content}>{inquiry.content}</p>
                    </div>
                </Card>

                {/* ②③ 답변 */}
                <Card title="답변">
                    <div className={styles.cardBody}>
                        {notice ? <Band tone="ok" role="status">{notice}</Band> : null}
                        {actions.answerLock ? <Band tone="warn">{actions.answerLock}</Band> : null}
                        <Field label="답변" name="answer_content" htmlFor="inquiry-answer" hint={<span>{answer.length} / {ANSWER_MAX}</span>}>
                            <Textarea id="inquiry-answer" rows={8} maxLength={ANSWER_MAX} value={answer} disabled={actions.answerLock !== null || busy} onChange={(event) => setAnswer(event.target.value)} />
                        </Field>
                        {inquiry.answered_at ? <p className={styles.muted}>마지막 답변 {inquiry.answer_user_name ?? '—'} · {toKst(inquiry.answered_at, 'YYYY-MM-DD HH:mm')}</p> : null}
                        <div><Button variant="primary" disabled={actions.answerLock !== null || busy} onClick={submitAnswer}>{actions.answerLabel}</Button></div>
                    </div>
                </Card>
            </div>

            {/* ②④ 블라인드 · 해제 — 버튼 하나 */}
            <Card title="블라인드">
                <div className={styles.cardBody}>
                    <p className={styles.muted}>스팸 · 도배처럼 부적절한 문의를 블라인드합니다. 이용자에게 블라인드 안내가 보이고, 답변은 지우지 않습니다.</p>
                    <div><Button variant={actions.blinded ? 'default' : 'danger'} disabled={busy} onClick={() => setConfirming(true)}>{actions.blindLabel}</Button></div>
                </div>
            </Card>

            {/* ④ 확인 창 */}
            <ConfirmModal
                open={confirming}
                title={actions.blindLabel}
                message={actions.blinded ? '이 문의의 블라인드를 해제할까요? 답변이 있던 문의는 답변완료, 없던 문의는 접수로 돌아갑니다.' : '이 문의를 블라인드할까요? 이용자에게 블라인드 안내가 보이고, 해제하기 전까지 답변할 수 없습니다.'}
                confirmLabel={actions.blindLabel}
                danger={!actions.blinded}
                busy={busy}
                onConfirm={confirmBlind}
                onClose={() => setConfirming(false)}
            />
        </div>
    );
}
