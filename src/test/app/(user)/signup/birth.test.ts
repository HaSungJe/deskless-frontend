// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatBirthInput } from '@/app/(user)/signup/birth';

describe('formatBirthInput', () => {
    it('[SUCCESS] 숫자 자리 수에 따라 연 · 연-월 · 연-월-일', () => {
        expect(formatBirthInput('1998')).toBe('1998');
        expect(formatBirthInput('19980')).toBe('1998-0');
        expect(formatBirthInput('199803')).toBe('1998-03');
        expect(formatBirthInput('19980314')).toBe('1998-03-14');
    });

    it('[SUCCESS] 숫자 아닌 글자는 버리고 다시 모양을 맞춘다', () => {
        expect(formatBirthInput('1998.03.14')).toBe('1998-03-14');
        expect(formatBirthInput('1998-03-14')).toBe('1998-03-14');
    });

    it('[FAIL:length] 8자리 넘는 숫자는 자르고, 빈 칸은 빈 칸', () => {
        expect(formatBirthInput('199803141')).toBe('1998-03-14');
        expect(formatBirthInput('')).toBe('');
    });
});
