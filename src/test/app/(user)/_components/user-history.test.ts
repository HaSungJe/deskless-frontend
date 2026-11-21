// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { canGoHistoryBack } from '@/app/(user)/_components/user-history';

/** 이 사이트 */
const ORIGIN = 'https://deskless.kr';

describe('canGoHistoryBack — 이전 화면 버튼이 브라우저 뒤로를 쓸지', () => {
    it('[SUCCESS] 이 사이트 안에서 다른 화면으로 옮겨 왔으면 뒤로', () => {
        expect(canGoHistoryBack(true, '', ORIGIN)).toBe(true);
    });

    it('[SUCCESS] 처음 화면이라도 직전 주소가 같은 사이트면 뒤로', () => {
        expect(canGoHistoryBack(false, `${ORIGIN}/me/`, ORIGIN)).toBe(true);
    });

    it('[FAIL:external] 다른 사이트에서 왔거나(결제 · 검색) 주소로 바로 들어왔으면 뒤로를 쓰지 않는다', () => {
        expect(canGoHistoryBack(false, 'https://pay.toss.im/checkout', ORIGIN)).toBe(false);
        expect(canGoHistoryBack(false, '', ORIGIN)).toBe(false);
    });
});
