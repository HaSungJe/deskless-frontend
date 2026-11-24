import { INQUIRY_LIST_PATH as ADMIN_INQUIRY_LIST_PATH } from '@/app/admin/(console)/admin-paths';
import { answerInquiry, answerStoreInquiry, blindInquiry, blindStoreInquiry, getInquiries, getInquiry, getStoreInquiries, getStoreInquiry, unblindInquiry, unblindStoreInquiry } from '@/contracts/inquiry/api';
import { InquiryAnswerDto } from '@/contracts/inquiry/dto/inquiry-answer.dto';
import { InquiryManageDetailResultDto } from '@/contracts/inquiry/dto/inquiry-manage-detail.dto';
import { InquiryManageListDto, InquiryManageListResultDto } from '@/contracts/inquiry/dto/inquiry-manage-list.dto';
import { INQUIRY_STATE } from '@/contracts/inquiry/inquiry.constants';
import { AuthType } from '@/shared/api/auth';
import { SITE_NAME } from '@/shared/utils/site';

/** 문의 관리 영역 — 업체 관리자(소속 업체 문의 · /mine) · 관리자(바로방 문의) */
export type InquiryScopeType = 'manager' | 'admin';

/** 영역마다 다른 것 — 부를 API · 목록 주소 · 안내 */
type InquiryManageType = {
    listPath: string;                                                                                                        // 문의 목록 주소
    subtitle: string;                                                                                                        // 목록 안내
    list: (auth: AuthType, query: InquiryManageListDto, signal?: AbortSignal) => Promise<InquiryManageListResultDto | null>; // 목록
    detail: (auth: AuthType, inquiryId: string, signal?: AbortSignal) => Promise<InquiryManageDetailResultDto | null>;      // 상세
    answer: (auth: AuthType, inquiryId: string, dto: InquiryAnswerDto) => Promise<null>;                                    // 답변(큐)
    blind: (auth: AuthType, inquiryId: string) => Promise<null>;                                                            // 블라인드(큐)
    unblind: (auth: AuthType, inquiryId: string) => Promise<null>;                                                          // 해제(큐)
};

/** 관리 상세에서 할 수 있는 일 — 답변 버튼 · 답변을 막는 이유 · 블라인드 버튼 */
export type InquiryActionsType = {
    answerLabel: '답변 등록' | '답변 수정';  // 답변이 없으면 등록, 있으면 수정(같은 API — 통째로 바꾼다)
    answerLock: string | null;               // 답변을 막는 이유 — null 이면 칸 · 버튼이 열린다
    blindLabel: '블라인드' | '블라인드 해제'; // 블라인드 버튼 글자
    blinded: boolean;                        // 블라인드 — 버튼이 해제를 부른다
};

/** 영역별 문의 관리 — 두 영역은 경로(/mine 유무) · 링크 · 안내만 다르다(토큰은 AuthContext 가 주소의 영역으로 이미 고른다) */
export const INQUIRY_MANAGE: Record<InquiryScopeType, InquiryManageType> = {
    manager: {listPath: '/manager/inquiries/', subtitle: '내 업체로 들어온 문의입니다. 문의일 최신순.', list: getStoreInquiries, detail: getStoreInquiry, answer: answerStoreInquiry, blind: blindStoreInquiry, unblind: unblindStoreInquiry},
    admin: {listPath: ADMIN_INQUIRY_LIST_PATH, subtitle: `업체가 아닌 ${SITE_NAME} 문의입니다. 문의일 최신순.`, list: getInquiries, detail: getInquiry, answer: answerInquiry, blind: blindInquiry, unblind: unblindInquiry},
};

/** 블라인드된 문의의 답변을 막는 이유 — 서버도 400(블라인드된 문의에는 답변할 수 없습니다.) */
export const ANSWER_LOCK_MESSAGE = '블라인드된 문의에는 답변할 수 없어요. 블라인드를 해제한 뒤 답변하세요.';

/**
 * 그 영역의 문의 관리 상세 주소
 *
 * @param scope 영역
 * @param inquiryId 문의 ID
 */
export function inquiryManagePath(scope: InquiryScopeType, inquiryId: string): string {
    return `${INQUIRY_MANAGE[scope].listPath}${encodeURIComponent(inquiryId)}/`;
}

/**
 * 관리 상세에서 할 수 있는 일 — 블라인드면 답변을 막고 해제만, 아니면 답변 유무에 맞는 답변 버튼과 블라인드
 *
 * @param inquiry 상세의 상태 · 답변
 */
export function inquiryActionsOf(inquiry: Pick<InquiryManageDetailResultDto, 'inquiry_state_id' | 'answer_content'>): InquiryActionsType {
    const blinded = inquiry.inquiry_state_id === INQUIRY_STATE.BLIND;
    return {
        answerLabel: inquiry.answer_content ? '답변 수정' : '답변 등록',
        answerLock: blinded ? ANSWER_LOCK_MESSAGE : null,
        blindLabel: blinded ? '블라인드 해제' : '블라인드',
        blinded,
    };
}
