import { describe, expect, it } from 'vitest';
import { createQueryString, digitsOnly } from '@/shared/utils/util';

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

describe('digitsOnly — 입력 칸 숫자만 남기기', () => {
    it('[SUCCESS] 하이픈 · 공백을 넣어 붙여 넣어도 숫자만 남긴다', () => {
        expect(digitsOnly('010-1234 5678', 11)).toBe('01012345678');
    });

    it('[SUCCESS] 자릿수를 넘으면 앞에서부터 자른다', () => {
        expect(digitsOnly('123456789012', 10)).toBe('1234567890');
    });

    it('[FAIL:no-digit] 숫자가 없으면 빈 글자다', () => {
        expect(digitsOnly('abc', 10)).toBe('');
    });
});
