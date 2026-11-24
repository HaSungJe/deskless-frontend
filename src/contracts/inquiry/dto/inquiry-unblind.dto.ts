import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 문의 블라인드 해제 path param — 블라인드된 문의 한 건, 내 범위만(아니면 404). 블라인드가 아니면 400.
 */
export class InquiryUnblindParamDto {
    // 문의 ID
    @Matches(/^[a-f0-9]{32}$/, {message: '문의 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '문의 ID를 입력해주세요.'})
    inquiry_id: string;
}
