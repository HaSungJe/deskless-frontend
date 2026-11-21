import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 업체 관리자 상세 path param (총관리자 · 관리자)
 */
export class ManagerAccountDetailParamDto {
    /** 업체 총관리자 · 업체 관리자 회원 ID */
    @Matches(/^[a-f0-9]{32}$/, {message: '회원 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '회원 ID를 입력해주세요.'})
    user_id: string;
}

/**
 * 업체 관리자 상세 (총관리자 · 관리자)
 */
export class ManagerAccountDetailResultDto {
    /** 회원 ID */
    user_id: string;

    /** 업체 ID */
    store_id: string;

    /** 상호명 */
    store_name: string;

    /** 업체코드 */
    store_code: string;

    /** 업체 상태 (ACTIVE · SUSPEND · LEAVE) */
    store_state_id: string;

    /** 로그인 아이디 */
    login_id: string;

    /** 이름 */
    name: string;

    /** 휴대폰 번호 (없으면 null) */
    phone: string | null;

    /** 성별 (M · F) */
    gender: string;

    /** 생년월일 (YYYY-MM-DD) */
    birth: string;

    /** 권한 (HEAD_MANAGER: 업체 총관리자, MANAGER: 업체 관리자) */
    auth_id: string;

    /** 상태 (ACTIVE: 정상, BLOCK: 정지) */
    state_id: string;

    /** 정지 사유 (없으면 null) */
    block_comment: string | null;

    /** 비밀번호 변경 필요 여부(0: 불필요, 1: 필요 — 임시 비밀번호) */
    is_password_change_required: number;

    /** 등록일시 (ISO 8601) */
    created_at: string;
}
