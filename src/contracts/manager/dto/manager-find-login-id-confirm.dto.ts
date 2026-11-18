import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 매니저 아이디 찾기 — 인증번호 확인 입력 (발송 결과의 인증 ID + 인증번호)
 */
export class ManagerFindLoginIdConfirmDto {
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
 * 매니저 아이디 찾기 결과 — 아이디 · 등록일시
 */
export class ManagerFindLoginIdConfirmResultDto {
    /** 로그인 아이디 */
    login_id: string;

    /** 계정 등록일시 (ISO 8601) */
    created_at: string;
}
