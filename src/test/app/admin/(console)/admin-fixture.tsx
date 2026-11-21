import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { PaginationResultDto } from '@/contracts/common/pagination.dto';
import { ManagerAccountDetailResultDto } from '@/contracts/manager/dto/manager-account-detail.dto';
import { ManagerAccountListResultDto } from '@/contracts/manager/dto/manager-account-list.dto';
import { StatsResultDto } from '@/contracts/stats/dto/stats.dto';
import { StoreApplicationDetailResultDto } from '@/contracts/store/dto/store-application-detail.dto';
import { StoreApplicationListResultDto } from '@/contracts/store/dto/store-application-list.dto';
import { StoreDetailResultDto } from '@/contracts/store/dto/store-detail.dto';
import { StoreListResultDto } from '@/contracts/store/dto/store-list.dto';
import { UserDetailResultDto } from '@/contracts/user/dto/user-detail.dto';
import { UserListResultDto } from '@/contracts/user/dto/user-list.dto';
import { UserReservationListResultDto } from '@/contracts/user/dto/user-reservation-list.dto';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

/** 로그인한 관리자 */
export const ADMIN_AUTH: AuthContextType = {area: 'admin', token: 'admin-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/** 입점 신청 ID · 업체 ID · 업체코드 · 신청자 ID */
export const APPLICATION_ID = 'a'.repeat(32);
export const STORE_ID = '3b9e5c1a7d2f4e8b9c0a6d1e2f3b4c5d';
export const STORE_CODE = '7a4c9e2b5d1f4e8a9c3b6d0e2f5a8c1d';
export const APPLICANT_ID = 'u'.repeat(32);

/** 업체 관리자 ID · 이용자 ID · 영업중지 업체 ID */
export const MANAGER_ID = 'm'.repeat(32);
export const USER_ID = '7c1e9a3f5b2d4e6c8a0f1b3d5e7c9a2b';
export const SUSPENDED_STORE_ID = 'd8b1f3a5c7e94b2d6f8a0c2e4b6d8f0a';

/** 한 쪽 — 14건 중 1쪽(번호 14 부터 내려간다) */
const FIRST_PAGE: PaginationResultDto = {all_search_yn: 'N', total_count: 14, page: 1, max_page: 2, page_range: {start: 1, end: 2}, content_start_number: 14, content_start_number_reverse: 1};

/**
 * 관리자 토큰 Provider 로 그린다
 *
 * @param ui 화면
 * @returns container
 */
export function renderWithAdmin(ui: React.ReactNode): HTMLElement {
    return render(<RootLayoutProvider rootLayoutLoading={false} auth={ADMIN_AUTH}>{ui}</RootLayoutProvider>).container;
}

/**
 * 입점 신청 목록 — 대기 1건 · 승인 1건(만든 업체)
 */
export function applicationList(): StoreApplicationListResultDto {
    return {
        list: [
            {store_application_id: APPLICATION_ID, user_id: APPLICANT_ID, store_application_state_id: 'WAIT', store_name: '무인텔 온담 홍대점', business_number: '2148712345', owner_name: '박진우', store_id: null, reviewed_at: null, created_at: '2026-11-09T12:14:00.000Z'},
            {store_application_id: 'b'.repeat(32), user_id: APPLICANT_ID, store_application_state_id: 'APPROVED', store_name: '스테이 리프 강남역점', business_number: '1208845678', owner_name: '김현석', store_id: STORE_ID, reviewed_at: '2026-11-04T05:05:00.000Z', created_at: '2026-11-03T00:15:00.000Z'},
        ],
        pagination: FIRST_PAGE,
    };
}

/**
 * 입점 신청 상세 — 대기 · 사업자등록증 1장 · 업체 사진 1장 · 신청자 있음
 *
 * @param extra 바꿀 값
 */
export function applicationDetail(extra: Partial<StoreApplicationDetailResultDto> = {}): StoreApplicationDetailResultDto {
    return {
        store_application_id: APPLICATION_ID,
        user_id: APPLICANT_ID,
        store_application_state_id: 'WAIT',
        store_id: null,
        store_code: null,
        store_name: '무인텔 온담 홍대점',
        business_number: '2148712345',
        owner_name: '박진우',
        owner_phone: '01023456789',
        head_manager_login_id: 'ondam_hongdae',
        phone: '023324567',
        address: '서울특별시 마포구 어울마당로 123',
        address_detail: '3층 ~ 5층',
        latitude: 37.553612,
        longitude: 126.922734,
        application_comment: '객실 18개로 운영할 예정입니다.',
        reject_comment: null,
        reviewed_at: null,
        created_at: '2026-11-09T12:14:00.000Z',
        applicant: {user_id: APPLICANT_ID, name: '박진우', nickname: '홍대밤산책', phone: '01023456789'},
        files: [
            {store_file_id: 'f1', store_file_purpose_id: 'BUSINESS_LICENSE', file_name: '사업자등록증_온담홍대점.jpg', content_type: 'image/jpeg', is_private: 1, file_url: 'https://files.example.com/license.jpg?sig=1', created_at: '2026-11-09T12:16:00.000Z'},
            {store_file_id: 'f2', store_file_purpose_id: 'STORE_IMAGE', file_name: '외관_정면.jpg', content_type: 'image/jpeg', is_private: 0, file_url: 'https://cdn.example.com/outside.jpg', created_at: '2026-11-09T12:17:00.000Z'},
        ],
        ...extra,
    };
}

/**
 * 업체 목록 — 활성 1곳 · 탈퇴 1곳(사업자등록번호 DELETE_…)
 */
export function storeList(): StoreListResultDto {
    return {
        list: [
            {store_id: STORE_ID, store_code: STORE_CODE, store_state_id: 'ACTIVE', store_name: '스테이 리프 강남역점', business_number: '1208845678', owner_name: '김현석', phone: '025550123', address: '서울특별시 강남구 강남대로 123', is_open: 1, created_at: '2026-11-04T05:05:00.000Z'},
            {store_id: 'e'.repeat(32), store_code: '9d7b5f3a1c8e4d6b2f0a8c6e4b2d0f1c', store_state_id: 'LEAVE', store_name: '리프룸 광안리점', business_number: `DELETE_${'e'.repeat(32)}`, owner_name: '조은우', phone: '0517559900', address: '부산광역시 수영구 광안해변로 177', is_open: 0, created_at: '2026-10-01T05:05:00.000Z'},
        ],
        pagination: FIRST_PAGE,
    };
}

/**
 * 업체 상세 — 활성 · 영업중 · 사업자등록증 1장 · 사진 1장
 *
 * @param extra 바꿀 값
 */
export function storeDetail(extra: Partial<StoreDetailResultDto> = {}): StoreDetailResultDto {
    return {
        store_id: STORE_ID,
        store_code: STORE_CODE,
        store_state_id: 'ACTIVE',
        store_name: '스테이 리프 강남역점',
        business_number: '1208845678',
        owner_name: '김현석',
        phone: '025550123',
        address: '서울특별시 강남구 강남대로 123',
        address_detail: '리프빌딩 4층 ~ 9층',
        latitude: 37.497942,
        longitude: 127.027621,
        introduction: '강남역 11번 출구에서 걸어서 3분.',
        is_always_open: 0,
        is_open: 1,
        maintenance_minutes: 30,
        booking_open_hours: 72,
        refund_deadline_minutes: 120,
        late_refund_percent: 50,
        suspend_comment: null,
        created_at: '2026-11-04T05:05:00.000Z',
        updated_at: '2026-11-08T00:40:00.000Z',
        files: [
            {store_file_id: 'g1', store_file_purpose_id: 'BUSINESS_LICENSE', file_name: '사업자등록증_리프강남.pdf', content_type: 'application/pdf', is_private: 1, file_url: 'https://files.example.com/license.pdf?sig=1', sort_order: 0, created_at: '2026-11-03T00:18:00.000Z'},
            {store_file_id: 'g2', store_file_purpose_id: 'STORE_IMAGE', file_name: '외관.jpg', content_type: 'image/jpeg', is_private: 0, file_url: 'https://cdn.example.com/outside.jpg', sort_order: 0, created_at: '2026-11-03T00:19:00.000Z'},
        ],
        ...extra,
    };
}

/**
 * 한 달 통계 — 수익은 결제액 − 환불액
 *
 * @param month YYYY-MM
 * @param paid 결제액
 * @param refund 환불액
 */
function statsMonth(month: string, paid: number, refund: number): StatsResultDto['monthly'][number] {
    return {month, user_count: 120, completed_count: 150, paid_amount: paid, refund_amount: refund, profit: paid - refund};
}

/**
 * 전체 통계 — 3개월 · 실결제, 업체별 2곳(하나는 수익 음수 · 영업중지)
 *
 * @param extra 바꿀 값
 */
export function statsResult(extra: Partial<StatsResultDto> = {}): StatsResultDto {
    return {
        period: {start_month: '2026-09', end_month: '2026-11', environment: 'LIVE'},
        total: {user_count: 302, completed_count: 450, paid_amount: 30500000, refund_amount: 1500000, profit: 29000000},
        monthly: [statsMonth('2026-09', 9800000, 400000), statsMonth('2026-10', 10200000, 500000), statsMonth('2026-11', 10500000, 600000)],
        stores: {
            list: [
                {store_id: STORE_ID, store_name: '스테이 리프 강남역점', store_code: STORE_CODE, store_state_id: 'ACTIVE', user_count: 80, completed_count: 95, paid_amount: 8200000, refund_amount: 300000, profit: 7900000},
                {store_id: SUSPENDED_STORE_ID, store_name: '무인텔 하루 대전역점', store_code: SUSPENDED_STORE_ID, store_state_id: 'SUSPEND', user_count: 3, completed_count: 3, paid_amount: 60000, refund_amount: 380000, profit: -320000},
            ],
            pagination: FIRST_PAGE,
        },
        ...extra,
    };
}

/**
 * 업체 관리자 목록 — 영업중지 업체의 정지된 총괄매니저(임시 비밀번호) · 휴대폰 없는 매니저
 */
export function managerList(): ManagerAccountListResultDto {
    return {
        list: [
            {user_id: MANAGER_ID, store_id: SUSPENDED_STORE_ID, store_name: '무인텔 하루 대전역점', store_code: SUSPENDED_STORE_ID, store_state_id: 'SUSPEND', login_id: 'haru_daejeon', name: '한지호', phone: '01067890123', auth_id: 'HEAD_MANAGER', state_id: 'BLOCK', is_password_change_required: 1, created_at: '2026-10-20T03:00:00.000Z'},
            {user_id: 'n'.repeat(32), store_id: STORE_ID, store_name: '스테이 리프 강남역점', store_code: STORE_CODE, store_state_id: 'ACTIVE', login_id: 'sm_night', name: '박재훈', phone: null, auth_id: 'MANAGER', state_id: 'ACTIVE', is_password_change_required: 0, created_at: '2026-11-01T09:44:00.000Z'},
        ],
        pagination: FIRST_PAGE,
    };
}

/**
 * 업체 관리자 상세 — 활성 업체의 매니저 · 휴대폰 있음
 *
 * @param extra 바꿀 값
 */
export function managerDetail(extra: Partial<ManagerAccountDetailResultDto> = {}): ManagerAccountDetailResultDto {
    return {
        user_id: MANAGER_ID,
        store_id: STORE_ID,
        store_name: '스테이 리프 강남역점',
        store_code: STORE_CODE,
        store_state_id: 'ACTIVE',
        login_id: 'gn_front01',
        name: '이서연',
        phone: '01045678901',
        gender: 'F',
        birth: '1996-04-12',
        auth_id: 'MANAGER',
        state_id: 'ACTIVE',
        block_comment: null,
        is_password_change_required: 0,
        created_at: '2026-11-06T01:20:00.000Z',
        ...extra,
    };
}

/**
 * 이용자 목록 — 미인증 정상 · 인증한 정상 · 탈퇴(휴대폰 없음)
 */
export function userList(): UserListResultDto {
    return {
        list: [
            {user_id: 'p'.repeat(32), user_search_code: '0e2c4a6b8d1f3e5c7a9b2d4f6e8a0c3b', nickname: '새벽기차', name: '정민지', phone: null, sns_id: 'KAKAO', state_id: 'ACTIVE', is_phone_verified: 0, created_at: '2026-11-09T23:12:00.000Z'},
            {user_id: USER_ID, user_search_code: USER_ID, nickname: '여행하는고양이', name: '김하늘', phone: '01012345678', sns_id: 'NAVER', state_id: 'ACTIVE', is_phone_verified: 1, created_at: '2026-08-14T01:15:00.000Z'},
            {user_id: 'q'.repeat(32), user_search_code: 'c7a5e3b1f9d74c2a0e8b6f4d2a0c8e6b', nickname: '느린걸음', name: '장예린', phone: null, sns_id: 'KAKAO', state_id: 'LEAVE', is_phone_verified: 0, created_at: '2026-06-11T03:20:00.000Z'},
        ],
        pagination: FIRST_PAGE,
    };
}

/**
 * 이용자 상세 — 정상 · 카카오 · 휴대폰 인증
 *
 * @param extra 바꿀 값
 */
export function userDetail(extra: Partial<UserDetailResultDto> = {}): UserDetailResultDto {
    return {
        user_id: USER_ID,
        user_search_code: USER_ID,
        nickname: '여행하는고양이',
        name: '김하늘',
        gender: 'F',
        birth: '1995-03-21',
        phone: '01012345678',
        phone_verified_at: '2026-08-14T01:22:00.000Z',
        sns_id: 'KAKAO',
        state_id: 'ACTIVE',
        block_comment: null,
        leave_reserved_at: null,
        created_at: '2026-08-14T01:15:00.000Z',
        reservation_summary: {total: 23, in_progress: 2, completed: 18, canceled: 3},
        ...extra,
    };
}

/**
 * 이용자 예약 이력 — 확정 1건 · 이용자가 취소한 1건
 */
export function userReservations(): UserReservationListResultDto {
    return {
        list: [
            {reservation_id: 'r'.repeat(32), store_id: STORE_ID, store_name: '스테이 리프 강남역점', room_name: '301호', room_group_name: '스탠다드 더블', room_plan_type_id: 'HOURLY', room_plan_type_name: '시간 이용', reservation_state_id: 'CONFIRMED', reservation_state_name: '예약 확정', start_at: '2026-11-14T06:00:00.000Z', end_at: '2026-11-14T09:00:00.000Z', total_price: 18000, canceled_at: null, cancel_actor: null, created_at: '2026-11-09T11:31:00.000Z'},
            {reservation_id: 's'.repeat(32), store_id: STORE_ID, store_name: '스테이 리프 강남역점', room_name: '305호', room_group_name: '스탠다드 더블', room_plan_type_id: 'HOURLY', room_plan_type_name: '시간 이용', reservation_state_id: 'CANCELED', reservation_state_name: '취소', start_at: '2026-10-18T11:00:00.000Z', end_at: '2026-10-18T14:00:00.000Z', total_price: 18000, canceled_at: '2026-10-18T08:42:00.000Z', cancel_actor: 'USER', created_at: '2026-10-17T11:00:00.000Z'},
        ],
        pagination: FIRST_PAGE,
    };
}
