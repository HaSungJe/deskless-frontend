import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import UserTopBar from '@/app/(user)/_components/UserTopBar';
import { UserHistoryContext } from '@/app/(user)/_components/user-history';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('UserTopBar', () => {
    it('[SUCCESS] 하위 화면 — 왼쪽 이전 화면 · 바로방(홈으로), 오른쪽 "내 예약 › 예약 상세 › 연장", 앞 단계는 그 화면 링크', () => {
        render(<UserTopBar title="연장" parents={[{label: '내 예약', href: '/reservation/'}, {label: '예약 상세', href: '/reservation/r1/'}]} />);

        const bar = within(screen.getByRole('banner'));
        expect(bar.getByRole('link', {name: '바로방'}).getAttribute('href')).toBe('/');
        expect(bar.getByRole('link', {name: '이전 화면으로'}).getAttribute('href')).toBe('/reservation/r1/');
        const trail = within(screen.getByRole('navigation', {name: '현재 위치'}));
        expect(trail.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['내 예약›', '예약 상세›', '연장']);
        expect(trail.getByRole('link', {name: '내 예약'}).getAttribute('href')).toBe('/reservation/');
        expect(trail.getByRole('link', {name: '예약 상세'}).getAttribute('href')).toBe('/reservation/r1/');
        expect(trail.getByRole('heading', {level: 1}).textContent).toBe('연장');
        expect(trail.queryByRole('link', {name: '연장'})).toBeNull();
    });

    it('[SUCCESS] 앞 단계가 없는 화면(내 예약 · 결제 결과) — 이전 화면(돌아갈 곳이 없으면 홈) · 바로방 · 지금 화면 이름', () => {
        render(<UserTopBar title="내 예약" />);

        const bar = within(screen.getByRole('banner'));
        expect(bar.getAllByRole('link').map((link) => link.getAttribute('aria-label') ?? link.textContent)).toEqual(['이전 화면으로', '바로방']);
        expect(bar.getByRole('link', {name: '이전 화면으로'}).getAttribute('href')).toBe('/');
        expect(bar.getByRole('heading', {level: 1}).textContent).toBe('내 예약');
    });

    it('[SUCCESS] 이 사이트 안에서 옮겨 온 화면 — 이전 화면을 누르면 브라우저 뒤로 1번(링크 이동은 막음)', () => {
        const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
        render(
            <UserHistoryContext.Provider value={{moved: true}}>
                <UserTopBar title="예약 상세" parents={[{label: '내 예약', href: '/reservation/'}]} />
            </UserHistoryContext.Provider>,
        );

        const clicked = fireEvent.click(screen.getByRole('link', {name: '이전 화면으로'}));

        expect(back).toHaveBeenCalledTimes(1);
        expect(clicked).toBe(false);
    });
});
