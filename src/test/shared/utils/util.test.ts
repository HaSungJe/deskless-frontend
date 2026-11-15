import { describe, expect, it } from 'vitest';
import { createQueryString } from '@/shared/utils/util';

describe('createQueryString', () => {
    it('[SUCCESS] 키 · 값을 encodeURIComponent 로 바꿔 ? 뒤에 잇는다', () => {
        expect(createQueryString({page: 1, keyword: '강남 역'})).toBe('?page=1&keyword=%EA%B0%95%EB%82%A8%20%EC%97%AD');
    });

    it('[SUCCESS] null · undefined · 빈 문자열은 뺀다', () => {
        expect(createQueryString({page: 1, a: null, b: undefined, c: ''})).toBe('?page=1');
    });

    it('[SUCCESS] 남는 값이 없으면 빈 문자열', () => {
        expect(createQueryString({a: null})).toBe('');
        expect(createQueryString({})).toBe('');
    });
});
