import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useContext } from 'react';
import UserHistoryProvider from '@/app/(user)/_components/UserHistoryProvider';
import { UserHistoryContext } from '@/app/(user)/_components/user-history';

const nav = vi.hoisted(() => ({pathname: '/reservation/r1/'}));

vi.mock('next/navigation', () => ({usePathname: () => nav.pathname}));

/**
 * Context 값 보기 — canGoBack 을 글자로
 */
function Probe(): React.ReactNode {
    const {canGoBack} = useContext(UserHistoryContext);
    return <span data-testid="can-go-back">{String(canGoBack)}</span>;
}

/**
 * 처음 들어올 때의 referrer 를 정한다
 *
 * @param referrer document.referrer
 */
function setReferrer(referrer: string): void {
    Object.defineProperty(document, 'referrer', {value: referrer, configurable: true});
}

afterEach(() => {
    setReferrer('');
    nav.pathname = '/reservation/r1/';
});

describe('UserHistoryProvider', () => {
    it('[SUCCESS] 주소로 바로 들어오면 뒤로 안 됨 → 이 사이트 안에서 다른 화면으로 옮기면 뒤로 됨(referrer 는 처음 한 번만 본다)', () => {
        setReferrer('');
        const {rerender} = render(<UserHistoryProvider><Probe /></UserHistoryProvider>);
        expect(screen.getByTestId('can-go-back').textContent).toBe('false');

        nav.pathname = '/reservation/';
        rerender(<UserHistoryProvider><Probe /></UserHistoryProvider>);
        expect(screen.getByTestId('can-go-back').textContent).toBe('true');
    });

    it('[SUCCESS] 처음 들어올 때 직전 주소가 같은 사이트면 바로 뒤로 됨, 다른 사이트면 안 됨', () => {
        setReferrer(`${window.location.origin}/me/`);
        const {unmount} = render(<UserHistoryProvider><Probe /></UserHistoryProvider>);
        expect(screen.getByTestId('can-go-back').textContent).toBe('true');
        unmount();

        setReferrer('https://pay.toss.im/checkout');
        render(<UserHistoryProvider><Probe /></UserHistoryProvider>);
        expect(screen.getByTestId('can-go-back').textContent).toBe('false');
    });
});
