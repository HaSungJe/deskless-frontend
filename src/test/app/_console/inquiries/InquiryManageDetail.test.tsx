import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import InquiryManageDetail from '@/app/_console/inquiries/InquiryManageDetail';
import { InquiryScopeType } from '@/app/_console/inquiries/inquiry-manage';
import { INQUIRY_ID, manageDetail, renderInScope } from './inquiry-fixture';

const api = vi.hoisted(() => ({
    getInquiryCategories: vi.fn(),
    getStoreInquiries: vi.fn(),
    getStoreInquiry: vi.fn(),
    answerStoreInquiry: vi.fn(),
    blindStoreInquiry: vi.fn(),
    unblindStoreInquiry: vi.fn(),
    getInquiries: vi.fn(),
    getInquiry: vi.fn(),
    answerInquiry: vi.fn(),
    blindInquiry: vi.fn(),
    unblindInquiry: vi.fn(),
}));

vi.mock('@/contracts/inquiry/api', () => api);

/** 저장된 답변 */
const ANSWER = '카드사 사정에 따라 3~5일 걸려요.';

/**
 * 상세를 그리고 상세를 기다린다
 *
 * @param scope 영역
 */
async function renderDetail(scope: InquiryScopeType): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = renderInScope(scope, <InquiryManageDetail scope={scope} inquiryId={INQUIRY_ID} />);
    });
    return container;
}

/**
 * 열린 확인 창
 */
function openDialog(): ReturnType<typeof within> {
    return within(document.querySelector('dialog[open]') as HTMLElement);
}

beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.getStoreInquiry.mockResolvedValue(manageDetail());
    api.getInquiry.mockResolvedValue(manageDetail());
    api.answerStoreInquiry.mockResolvedValue(null);
    api.blindInquiry.mockResolvedValue(null);
    api.unblindStoreInquiry.mockResolvedValue(null);
});

describe('InquiryManageDetail', () => {
    it('[SUCCESS] 업체 관리자가 답변 없는 문의에 답변을 쓰고 "답변 등록"을 누른다 → 답변(큐) 1번(/mine · 다듬은 답변) → "답변을 등록했어요." 띠 → 상세 다시(상세 2번)', async () => {
        api.getStoreInquiry.mockResolvedValueOnce(manageDetail()).mockResolvedValueOnce(manageDetail({inquiry_state_id: 'ANSWERED', inquiry_state_name: '답변완료', answer_content: ANSWER, answer_user_name: '강남역점 총관리자', answered_at: '2026-11-21T05:30:00.000Z'}));
        await renderDetail('manager');

        expect(api.getStoreInquiry).toHaveBeenCalledTimes(1);
        expect(api.getStoreInquiry.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(api.getStoreInquiry.mock.calls[0][1]).toBe(INQUIRY_ID);
        expect(api.getInquiry).not.toHaveBeenCalled();

        fireEvent.change(screen.getByLabelText('답변'), {target: {value: `  ${ANSWER}  `}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '답변 등록'}));
        });

        expect(api.answerStoreInquiry).toHaveBeenCalledTimes(1);
        expect(api.answerStoreInquiry.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(api.answerStoreInquiry.mock.calls[0][1]).toBe(INQUIRY_ID);
        expect({...api.answerStoreInquiry.mock.calls[0][2]}).toEqual({answer_content: ANSWER});
        expect(api.answerInquiry).not.toHaveBeenCalled();
        expect(screen.getByRole('status').textContent).toBe('답변을 등록했어요.');
        expect(api.getStoreInquiry).toHaveBeenCalledTimes(2);

        // 다시 읽은 상세 — 저장된 답변 · 수정 버튼 · 마지막 답변
        expect((screen.getByLabelText('답변') as HTMLTextAreaElement).value).toBe(ANSWER);
        expect(screen.getByRole('button', {name: '답변 수정'})).toBeTruthy();
        expect(document.body.textContent).toContain('마지막 답변 강남역점 총관리자 · 2026-11-21 14:30');
    });

    it('[FAIL:validation] 답변을 비우고 누른다 → 칸 옆 "답변을 입력해주세요.", 답변 0번', async () => {
        const container = await renderDetail('manager');

        fireEvent.change(screen.getByLabelText('답변'), {target: {value: '   '}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '답변 등록'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="answer_content"]') as HTMLElement).innerText).toBe('답변을 입력해주세요.');
        expect(api.answerStoreInquiry).not.toHaveBeenCalled();
        expect(api.getStoreInquiry).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('[SUCCESS] 관리자가 "블라인드"를 누르고 확인한다 → 확인 창 → 블라인드(큐) 1번(관리자 경로) → 상세 다시(상세 2번)', async () => {
        api.getInquiry.mockResolvedValue(manageDetail({inquiry_state_id: 'ANSWERED', inquiry_state_name: '답변완료', answer_content: ANSWER, answer_user_name: '운영팀', answered_at: '2026-11-21T05:30:00.000Z'}));
        await renderDetail('admin');

        expect(api.getInquiry).toHaveBeenCalledTimes(1);
        expect(api.getInquiry.mock.calls[0][0]).toMatchObject({token: 'admin-token'});
        expect(api.getStoreInquiry).not.toHaveBeenCalled();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '블라인드'}));
        });
        expect(api.blindInquiry).not.toHaveBeenCalled();
        const dialog = openDialog();
        expect(dialog.getByText('이 문의를 블라인드할까요? 이용자에게 블라인드 안내가 보이고, 해제하기 전까지 답변할 수 없습니다.')).toBeTruthy();
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '블라인드'}));
        });

        expect(api.blindInquiry).toHaveBeenCalledTimes(1);
        expect(api.blindInquiry.mock.calls[0][0]).toMatchObject({token: 'admin-token'});
        expect(api.blindInquiry.mock.calls[0][1]).toBe(INQUIRY_ID);
        expect(api.blindStoreInquiry).not.toHaveBeenCalled();
        expect(api.unblindInquiry).not.toHaveBeenCalled();
        expect(api.getInquiry).toHaveBeenCalledTimes(2);
        expect(document.querySelector('dialog[open]')).toBeNull();
    });

    it('[SUCCESS] 블라인드된 문의에서 "블라인드 해제"를 누르고 확인한다 → 확인 창 → 해제(큐) 1번(/unblind) → 상세 다시(상세 2번)', async () => {
        api.getStoreInquiry.mockResolvedValue(manageDetail({inquiry_state_id: 'BLIND', inquiry_state_name: '블라인드', blinded_at: '2026-11-21T07:00:00.000Z'}));
        await renderDetail('manager');

        // 블라인드면 답변 칸 · 버튼이 막혀 있다
        expect((screen.getByLabelText('답변') as HTMLTextAreaElement).disabled).toBe(true);
        expect(screen.getByText('블라인드된 문의에는 답변할 수 없어요. 블라인드를 해제한 뒤 답변하세요.')).toBeTruthy();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '블라인드 해제'}));
        });
        expect(api.unblindStoreInquiry).not.toHaveBeenCalled();
        const dialog = openDialog();
        expect(dialog.getByText('이 문의의 블라인드를 해제할까요? 답변이 있던 문의는 답변완료, 없던 문의는 접수로 돌아갑니다.')).toBeTruthy();
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '블라인드 해제'}));
        });

        expect(api.unblindStoreInquiry).toHaveBeenCalledTimes(1);
        expect(api.unblindStoreInquiry.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(api.unblindStoreInquiry.mock.calls[0][1]).toBe(INQUIRY_ID);
        expect(api.blindStoreInquiry).not.toHaveBeenCalled();
        expect(api.getStoreInquiry).toHaveBeenCalledTimes(2);
        expect(document.querySelector('dialog[open]')).toBeNull();
    });
});
