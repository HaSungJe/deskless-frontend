import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 문의 블라인드 path param — 상세에서 본 문의 한 건, 내 범위만(아니면 404). 이미 블라인드면 400.
 */
export class InquiryBlindParamDto {
    // 문의 ID
    @Matches(/^[a-f0-9]{32}$/, {message: '문의 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '문의 ID를 입력해주세요.'})
    inquiry_id: string;
}
