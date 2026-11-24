import {IsIn, IsNotEmpty, IsOptional, Matches, MaxLength} from 'class-validator';
import {INQUIRY_CATEGORY_IDS} from '../inquiry.constants';

/**
 * 문의 등록 (이용자) — 업체를 고르면 그 업체, 안 고르면 바로방 문의. 동의 항목은 프론트가 등록 전에 체크한다(서버로 보내지 않는다).
 */
export class InquiryDto {
    // 문의할 업체 ID (업체 이름 검색으로 고른다) — 없으면 바로방 문의
    @IsOptional()
    @Matches(/^[a-f0-9]{32}$/, {message: '업체 ID가 올바르지 않습니다.'})
    store_id?: string;

    // 카테고리 ID (항목은 GET /api/v1/user-service/inquiry/category)
    @IsIn(INQUIRY_CATEGORY_IDS, {message: '카테고리가 올바르지 않습니다.'})
    @IsNotEmpty({message: '카테고리를 선택해주세요.'})
    inquiry_category_id: string;

    // 제목 (100자까지)
    @MaxLength(100, {message: '제목은 100자 이내로 입력해주세요.'})
    @IsNotEmpty({message: '제목을 입력해주세요.'})
    title: string;

    // 내용 (2000자까지)
    @MaxLength(2000, {message: '내용은 2000자 이내로 입력해주세요.'})
    @IsNotEmpty({message: '내용을 입력해주세요.'})
    content: string;
}

/**
 * 문의 등록 결과
 */
export class InquiryResultDto {
    // 문의 ID
    inquiry_id: string;
}
