import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

/** 로그인한 매니저 */
export const MANAGER_AUTH: AuthContextType = {area: 'manager', token: 'manager-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout: vi.fn()};

/** 업체코드 · 업체 ID */
export const STORE_CODE = '3f9a2c7e5b1d4a8e9c0f6b2d7e4a1c21';
export const STORE_ID = '3b9e5c1a7d2f4e8b9c0a6d1e2f3b4c5d';

/**
 * 내 업체 상세 — 활성 · 영업중 · 일 ~ 토 10:00 ~ 23:00(월 휴무) · 브레이크 1개 · 사진 2장 + 사업자등록증
 *
 * @param extra 바꿀 값
 */
export function storeMine(extra: Partial<StoreMineResultDto> = {}): StoreMineResultDto {
    return {
        store_id: STORE_ID,
        store_code: STORE_CODE,
        store_state_id: 'ACTIVE',
        store_name: '스테이 리프 강남역점',
        business_number: '1234567890',
        owner_name: '윤서진',
        phone: '0212345678',
        address: '서울특별시 강남구 강남대로 123길 45',
        address_detail: '3층',
        latitude: 37.4979,
        longitude: 127.0276,
        introduction: '강남역 11번 출구에서 걸어서 3분.',
        store_detail: {has_convenience_store: 0, has_cafe: 0, has_hot_spring: 0, is_pet_allowed: 0, has_meal: 0, is_delivery_allowed: 0, has_parking: 0},
        is_always_open: 0,
        is_open: 1,
        maintenance_minutes: 30,
        booking_open_hours: 720,
        refund_deadline_minutes: 60,
        late_refund_percent: 50,
        is_door_secret_set: 1,
        suspend_comment: null,
        hours: [0, 1, 2, 3, 4, 5, 6].map((day) => (day === 1
            ? {day_of_week: day, is_closed: 1, open_time: null, close_time: null}
            : {day_of_week: day, is_closed: 0, open_time: '10:00', close_time: '23:00'})),
        breaks: [{store_break_id: 'b'.repeat(32), start_time: '12:00', end_time: '13:00'}],
        files: [
            {store_file_id: 'a'.repeat(32), store_file_purpose_id: 'STORE_IMAGE', file_name: '입구.jpg', content_type: 'image/jpeg', is_private: 0, file_url: 'https://cdn.example.com/2.jpg', sort_order: 2, created_at: '2026-11-01T03:00:00.000Z'},
            {store_file_id: 'c'.repeat(32), store_file_purpose_id: 'STORE_IMAGE', file_name: '외관.jpg', content_type: 'image/jpeg', is_private: 0, file_url: 'https://cdn.example.com/1.jpg', sort_order: 1, created_at: '2026-11-01T03:00:00.000Z'},
            {store_file_id: 'd'.repeat(32), store_file_purpose_id: 'BUSINESS_LICENSE', file_name: '사업자등록증.jpg', content_type: 'image/jpeg', is_private: 1, file_url: 'https://s3.example.com/license.jpg', sort_order: 1, created_at: '2026-02-18T03:00:00.000Z'},
        ],
        updated_at: '2026-11-08T07:20:00.000Z',
        ...extra,
    } as StoreMineResultDto;
}

/**
 * 매니저 토큰 Context 로 감싸 그린다
 *
 * @param node 그릴 탭
 */
export function renderWithManager(node: React.ReactNode): HTMLElement {
    return render(<RootLayoutProvider rootLayoutLoading={false} auth={MANAGER_AUTH}>{node}</RootLayoutProvider>).container;
}
