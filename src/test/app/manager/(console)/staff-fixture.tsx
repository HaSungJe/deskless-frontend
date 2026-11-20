import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { ManagerConsoleContext } from '@/app/manager/(console)/manager-console-context';
import { PaginationResultDto } from '@/contracts/common/pagination.dto';
import { ManagerStaffDetailResultDto } from '@/contracts/manager/dto/manager-staff-detail.dto';
import { ManagerStaffListResultDto } from '@/contracts/manager/dto/manager-staff-list.dto';
import RootLayoutProvider from '@/shared/providers/RootLayoutProvider';
import { MANAGER_AUTH, storeMine } from './store/store-fixture';

/** 업체 관리자 회원 ID */
export const STAFF_ID = 'b2c3d4e5f60718293a4b5c6d7e8f9a01';

/** 한 쪽짜리 페이지 정보 */
const ONE_PAGE: PaginationResultDto = {all_search_yn: 'N', total_count: 2, page: 1, max_page: 1, page_range: {start: 1, end: 1}, content_start_number: 2, content_start_number_reverse: 1};

/**
 * 업체 관리자 목록 한 쪽 — 업체 총관리자(내 계정) · 업체 관리자 1명(임시 비밀번호)
 */
export function staffList(): ManagerStaffListResultDto {
    return {
        list: [
            {user_id: 'h'.repeat(32), login_id: 'leaf_gangnam', name: '윤서진', phone: '01024681357', auth_id: 'HEAD_MANAGER', state_id: 'ACTIVE', is_password_change_required: 0, created_at: '2026-02-20T03:00:00.000Z'},
            {user_id: STAFF_ID, login_id: 'leaf_front01', name: '문태오', phone: '01012345678', auth_id: 'MANAGER', state_id: 'ACTIVE', is_password_change_required: 1, created_at: '2026-03-02T00:14:00.000Z'},
        ],
        pagination: ONE_PAGE,
    };
}

/**
 * 업체 관리자 상세 — 문태오(정상 · 남 · 1995-04-17)
 *
 * @param extra 바꿀 값
 */
export function staffDetail(extra: Partial<ManagerStaffDetailResultDto> = {}): ManagerStaffDetailResultDto {
    return {
        user_id: STAFF_ID,
        login_id: 'leaf_front01',
        name: '문태오',
        phone: '01012345678',
        gender: 'M',
        birth: '1995-04-17',
        auth_id: 'MANAGER',
        state_id: 'ACTIVE',
        block_comment: null,
        is_password_change_required: 0,
        created_at: '2026-03-02T00:14:00.000Z',
        updated_at: '2026-11-02T09:05:00.000Z',
        ...extra,
    };
}

/**
 * 매니저 토큰 · 콘솔 계정(권한)으로 감싸 그린다
 *
 * @param node 그릴 화면
 * @param authId 로그인 때 기억한 권한 — HEAD_MANAGER · MANAGER, null 이면 계정 쿠키를 아직 읽는 중
 */
export function renderAsAccount(node: React.ReactNode, authId: string | null): HTMLElement {
    const account = authId === null ? null : {login_id: 'leaf_gangnam', auth_id: authId};
    return render(
        <RootLayoutProvider rootLayoutLoading={false} auth={MANAGER_AUTH}>
            <ManagerConsoleContext.Provider value={{store: storeMine(), account, accountLoaded: authId !== null, reloadStore: vi.fn()}}>
                {node}
            </ManagerConsoleContext.Provider>
        </RootLayoutProvider>,
    ).container;
}
