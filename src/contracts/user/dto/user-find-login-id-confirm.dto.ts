import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 아이디 찾기 — 인증번호 확인 입력 (발송 결과의 인증 ID + 인증번호)
 */
export class UserFindLoginIdConfirmDto {
    /** 인증 ID (발송 결과의 sms_verification_id) */
    @Matches(/^[a-f0-9]{32}$/, {message: '인증 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '인증 ID를 입력해주세요.'})
    sms_verification_id: string;

    /** 인증번호 6자리 */
    @Matches(/^\d{6}$/, {message: '인증번호 6자리를 입력해주세요.'})
    @IsNotEmpty({message: '인증번호를 입력해주세요.'})
    code: string;
}

/**
 * 아이디 찾기 결과 — 일반 계정은 login_id, SNS 계정은 sns_id (다른 쪽은 null), 그리고 가입일시
 */
export class UserFindLoginIdConfirmResultDto {
    /** 로그인 아이디 (SNS 계정이면 null) */
    login_id: string | null;

    /** 가입한 SNS (NAVER · KAKAO, 일반 계정이면 null) */
    sns_id: string | null;

    /** 가입일시 (ISO 8601) */
    created_at: string;
}
