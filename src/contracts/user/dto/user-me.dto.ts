/**
 * 내 정보 — 로그인한 이용자 본인의 회원 정보(마이페이지). 입력 없음(로그인 회원은 게이트웨이가 actor 로 넘긴다)
 */
export class UserMeResultDto {
    /** 회원 ID */
    user_id: string;

    /** 회원 식별 코드 (고객 문의 때 알려 주는 코드) */
    user_search_code: string;

    /** 닉네임 */
    nickname: string;

    /** 성별 (M: 남, F: 여) */
    gender: string;

    /** 생년월일 (YYYY-MM-DD) */
    birth: string;

    /** 가입한 SNS (KAKAO · NAVER, 없으면 null) */
    sns_id: string | null;

    /** 휴대폰 번호 (숫자만, 미인증 null) */
    phone: string | null;

    /** 휴대폰 SMS 인증 여부 (0: 미인증, 1: 인증) */
    is_phone_verified: number;

    /** 회원 상태 (ACTIVE: 정상, BLOCK: 이용 제한, LEAVE_WAIT: 탈퇴 대기) */
    state_id: string;

    /** 이용 제한 사유 (이용 제한이 아니면 null) */
    block_comment: string | null;

    /** 탈퇴 예정 시각 (YYYY-MM-DD HH:mm:ss 한국 시각, 탈퇴 대기가 아니면 null) */
    leave_reserved_at: string | null;

    /** 가입일시 (ISO 8601) */
    created_at: string;
}
