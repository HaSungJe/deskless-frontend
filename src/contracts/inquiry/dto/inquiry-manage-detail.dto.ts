import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 문의 관리 상세 path param — 내 범위(업체 관리자는 소속 업체, 관리자는 바로방) 문의만(아니면 404)
 */
export class InquiryManageDetailParamDto {
    // 문의 ID
    @Matches(/^[a-f0-9]{32}$/, {message: '문의 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '문의 ID를 입력해주세요.'})
    inquiry_id: string;
}

/**
 * 문의 관리 상세 — 작성자 · 카테고리 · 내용 · 답변 · 블라인드
 */
export class InquiryManageDetailResultDto {
    // 문의 ID
    inquiry_id: string;

    // 작성 이용자 ID
    user_id: string;

    // 작성 이용자 닉네임
    user_nickname: string;

    // 문의한 업체 ID (바로방 문의면 null)
    store_id: string | null;

    // 카테고리 ID
    inquiry_category_id: string;

    // 카테고리 이름
    inquiry_category_name: string;

    // 제목
    title: string;

    // 내용
    content: string;

    // 상태 (RECEIVED: 접수, ANSWERED: 답변완료, BLIND: 블라인드)
    inquiry_state_id: string;

    // 상태 이름
    inquiry_state_name: string;

    // 답변 (답변 전 null)
    answer_content: string | null;

    // 마지막으로 답변(수정)한 계정 이름 (답변 전 null)
    answer_user_name: string | null;

    // 마지막으로 답변(수정)한 일시 (ISO 8601, 답변 전 null)
    answered_at: string | null;

    // 블라인드한 일시 (ISO 8601, 블라인드가 아니면 null)
    blinded_at: string | null;

    // 문의일시 (ISO 8601)
    created_at: string;
}
