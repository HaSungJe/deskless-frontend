import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 휴대폰 인증번호 발송 입력 (로그인 회원 — 가입 후 본인 휴대폰 인증)
 */
export class UserPhoneVerificationDto {
    /** 휴대폰 번호 (숫자만) */
    @Matches(/^01[016789]\d{7,8}$/, {message: '휴대폰 번호를 숫자만 정확히 입력해주세요.'})
    @IsNotEmpty({message: '휴대폰 번호를 입력해주세요.'})
    phone: string;
}

/**
 * 휴대폰 인증번호 발송 결과
 */
export class UserPhoneVerificationResultDto {
    /** 인증 ID — 확인할 때 인증번호와 함께 보낸다 */
    sms_verification_id: string;

    /** 인증번호 만료일시 (ISO 8601) — 발송 후 5분 */
    expires_at: string;
}
