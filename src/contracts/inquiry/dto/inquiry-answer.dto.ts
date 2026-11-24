import {IsNotEmpty, Matches, MaxLength} from 'class-validator';

/**
 * 문의 답변 path param — 내 범위 문의만(아니면 404)
 */
export class InquiryAnswerParamDto {
    // 문의 ID
    @Matches(/^[a-f0-9]{32}$/, {message: '문의 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '문의 ID를 입력해주세요.'})
    inquiry_id: string;
}

/**
 * 문의 답변 — 문의당 1개, 다시 보내면 통째로 고쳐 쓴다(답변완료). 블라인드된 문의에는 답변할 수 없다.
 */
export class InquiryAnswerDto {
    // 답변 (2000자까지)
    @MaxLength(2000, {message: '답변은 2000자 이내로 입력해주세요.'})
    @IsNotEmpty({message: '답변을 입력해주세요.'})
    answer_content: string;
}
