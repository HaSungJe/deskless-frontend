import { IsIn, IsNotEmpty, Matches, MaxLength } from 'class-validator';

/**
 * 가입 칸 — 지침서 UserSignDto(src/contracts/user/dto/user-sign.dto.ts)의 gender · birth · nickname 과 같은 규칙 · 메시지
 * - SNS 계정(sns_id · sns_user_id)은 화면이 모르고 서버 route 가 세션에서 붙인다
 */
export class SignupDto {
    /** 성별 — 값: M · F */
    @IsIn(['M', 'F'], {message: '성별이 올바르지 않습니다.'})
    @IsNotEmpty({message: '성별을 입력해주세요.'})
    gender: string;

    /** 생년월일 (YYYY-MM-DD) */
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {message: '생년월일은 YYYY-MM-DD 형식이어야 합니다.'})
    @IsNotEmpty({message: '생년월일을 입력해주세요.'})
    birth: string;

    /** 닉네임 (최대 12자, 특수문자 불가) */
    @MaxLength(12, {message: '닉네임은 최대 12자까지 입력할 수 있습니다.'})
    @Matches(/^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s]+$/, {message: '닉네임에 특수문자는 사용할 수 없습니다.'})
    @IsNotEmpty({message: '닉네임을 입력해주세요.'})
    nickname: string;
}
