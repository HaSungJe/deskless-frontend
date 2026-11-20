import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import StoreSettingsContent from '@/app/manager/(console)/store/StoreSettingsContent';
import { ManagerConsoleContext } from '@/app/manager/(console)/manager-console-context';
import { renderWithManager, storeMine } from './store-fixture';

vi.mock('@/contracts/store/api', () => ({updateMyStoreProfile: vi.fn()}));

describe('StoreSettingsContent', () => {
    it('[SUCCESS] 업체 관리자가 연다 → 문 연동 탭이 없다(탭 5개), 기본 정보 탭 · 머리(상태 · 영업중)', () => {
        renderWithManager(
            <ManagerConsoleContext.Provider value={{store: storeMine(), account: {login_id: 'leaf_front01', auth_id: 'MANAGER'}, accountLoaded: true, reloadStore: vi.fn()}}>
                <StoreSettingsContent />
            </ManagerConsoleContext.Provider>,
        );

        const tabs = within(screen.getByRole('navigation', {name: '내 업체 설정'}));
        expect(tabs.getAllByRole('button').map((tab) => tab.textContent)).toEqual(['기본 정보', '사진', '영업시간 · 브레이크', '운영 규정', '일시 예약불가']);
        expect(tabs.queryByRole('button', {name: '문 연동'})).toBeNull();
        expect(screen.getByRole('heading', {level: 1}).textContent).toBe('내 업체 설정활성영업중');
        expect(screen.getByRole('heading', {name: '업체 정보'})).toBeTruthy();
    });
});
