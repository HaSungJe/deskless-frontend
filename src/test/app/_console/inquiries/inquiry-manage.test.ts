import { describe, expect, it } from 'vitest';
import { ANSWER_LOCK_MESSAGE, inquiryActionsOf } from '@/app/_console/inquiries/inquiry-manage';

describe('inquiryActionsOf — 관리 상세에서 할 수 있는 일', () => {
    it('[SUCCESS] 아직 답변이 없는 문의는 답변을 등록하고 블라인드할 수 있다', () => {
        expect(inquiryActionsOf({inquiry_state_id: 'RECEIVED', answer_content: null})).toEqual({answerLabel: '답변 등록', answerLock: null, blindLabel: '블라인드', blinded: false});
    });

    it('[SUCCESS] 답변한 문의는 답변을 고치고 블라인드할 수 있다', () => {
        expect(inquiryActionsOf({inquiry_state_id: 'ANSWERED', answer_content: '확인해 드렸어요.'})).toEqual({answerLabel: '답변 수정', answerLock: null, blindLabel: '블라인드', blinded: false});
    });

    it('[SUCCESS] 블라인드된 문의는 답변을 막고 해제만 보인다', () => {
        const actions = inquiryActionsOf({inquiry_state_id: 'BLIND', answer_content: '확인해 드렸어요.'});

        expect(actions.answerLock).toBe('블라인드된 문의에는 답변할 수 없어요. 블라인드를 해제한 뒤 답변하세요.');
        expect(actions.answerLock).toBe(ANSWER_LOCK_MESSAGE);
        expect(actions.blindLabel).toBe('블라인드 해제');
        expect(actions.blinded).toBe(true);
    });
});
