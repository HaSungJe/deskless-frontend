/**
 * 룩업 값 — ID 만 오는 상태 · 종류 값의 한국어 이름 (지침서 frontend/dto/common.md "룩업 값")
 * - 응답에 *_name 이 함께 오면 그 이름을 먼저 쓴다
 */
export const LOOKUP = {
    auth_id: {SUPER_ADMIN: '총괄관리자', ADMIN: '관리자', HEAD_MANAGER: '총괄매니저', MANAGER: '매니저', USER: '이용자'},
    state_id: {ACTIVE: '정상', BLOCK: '정지', LEAVE_WAIT: '탈퇴 대기', LEAVE: '탈퇴'},
    sns_id: {GOOGLE: '구글', FACEBOOK: '페이스북', APPLE: '애플', KAKAO: '카카오', LINE: '라인', NAVER: '네이버'},
    gender: {M: '남', F: '여'},
    store_state_id: {ACTIVE: '활성', SUSPEND: '영업중지', LEAVE: '탈퇴'},
    store_application_state_id: {WAIT: '대기', APPROVED: '승인', REJECTED: '반려'},
    store_file_purpose_id: {BUSINESS_LICENSE: '사업자등록증', STORE_IMAGE: '업체 사진'},
    room_state_id: {AVAILABLE: '예약가능', RESERVED: '예약완료', IN_USE: '사용중', MAINTENANCE: '정비중', DISABLED: '사용중지'},
    door_state: {open: '열림', close: '닫힘'},
    room_plan_type_id: {HOURLY: '시간 이용', NIGHT: '1박', LONG: '연박'},
    reservation_state_id: {PENDING: '결제 대기', CONFIRMED: '예약 확정', CHECKED_IN: '이용 중', COMPLETED: '이용 완료', CANCELED: '취소', EXPIRED: '결제 대기 만료'},
    reservation_detail_type_id: {BASE: '기본', EXTENSION: '연장'},
    cancel_actor: {USER: '이용자', STORE: '업체'},
    cancel_request_state_id: {REQUESTED: '요청 중', APPROVED: '승인', REJECTED: '거절', EXPIRED: '만료'},
    payment_state_id: {READY: '결제 대기', DONE: '결제 완료', FAILED: '결제 실패', EXPIRED: '결제 만료', REFUND_REQUESTED: '환불 신청', REFUNDED: '환불 완료', REFUND_FAILED: '환불 실패'},
    environment: {LIVE: '실결제', TEST: '테스트 결제'},
} as const;

/** 룩업 구분 — 응답 필드 이름 */
export type LookupGroupType = keyof typeof LOOKUP;

/**
 * 상태 · 종류 값의 이름 — 모르는 값은 값 그대로, 빈 값은 ''
 *
 * @param group 응답 필드 이름 (reservation_state_id …)
 * @param value 응답 값 (CONFIRMED …)
 */
export function lookupName(group: LookupGroupType, value: string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const names: Record<string, string> = LOOKUP[group];
    return names[value] ?? value;
}
