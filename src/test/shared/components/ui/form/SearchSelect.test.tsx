import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import SearchSelect, { SearchSelectOptionType } from '@/shared/components/ui/form/SearchSelect';

/** 고를 것 — 전체(빈 값) · 업체 셋 */
const OPTIONS: Array<SearchSelectOptionType> = [
    {value: '', label: '전체 업체'},
    {value: 'a', label: '스테이 리프 강남역점'},
    {value: 'b', label: '리프룸 잠실새내점'},
    {value: 'c', label: '슬립인 서면점'},
];

/**
 * 검색 고르기를 그린다
 *
 * @param value 고른 값
 * @param onChange 고름
 */
function renderSelect(value: string, onChange = vi.fn()): HTMLInputElement {
    render(<SearchSelect id="store" label="업체" options={OPTIONS} value={value} placeholder="업체 검색" onChange={onChange} />);
    return screen.getByRole('combobox', {name: '업체'}) as HTMLInputElement;
}

/**
 * 열린 목록의 줄 글자
 */
function optionTexts(): Array<string> {
    return within(screen.getByRole('listbox', {name: '업체'})).getAllByRole('option').map((option) => option.textContent ?? '');
}

describe('SearchSelect', () => {
    it('[SUCCESS] 닫혀 있으면 고른 글자를 보이고, 누르면 칸을 비우고 전부 연다', () => {
        const input = renderSelect('a');
        expect(input.value).toBe('스테이 리프 강남역점');
        expect(screen.queryByRole('listbox')).toBeNull();

        fireEvent.click(input);

        expect(input.value).toBe('');
        expect(input.placeholder).toBe('스테이 리프 강남역점');
        expect(input.getAttribute('aria-expanded')).toBe('true');
        expect(optionTexts()).toEqual(['전체 업체', '스테이 리프 강남역점', '리프룸 잠실새내점', '슬립인 서면점']);
    });

    it('[SUCCESS] 글자를 치면 그 글자가 들어간 줄만 남고, 줄을 누르면 그 값을 한 번 알리고 닫는다', () => {
        const onChange = vi.fn();
        const input = renderSelect('', onChange);

        fireEvent.click(input);
        fireEvent.change(input, {target: {value: '리프'}});
        expect(optionTexts()).toEqual(['스테이 리프 강남역점', '리프룸 잠실새내점']);

        fireEvent.click(screen.getByRole('option', {name: '리프룸 잠실새내점'}));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('b');
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('[SUCCESS] 키보드 — ↓ 로 열고 옮긴 뒤 Enter 로 고른다', () => {
        const onChange = vi.fn();
        const input = renderSelect('', onChange);

        fireEvent.keyDown(input, {key: 'ArrowDown'});
        expect(optionTexts()).toHaveLength(4);
        fireEvent.change(input, {target: {value: '서면'}});
        fireEvent.keyDown(input, {key: 'Enter'});

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('c');
    });

    it('[FAIL:no-match] 맞는 줄이 없으면 안내만 보이고 Enter 로 아무것도 고르지 않는다', () => {
        const onChange = vi.fn();
        const input = renderSelect('a', onChange);

        fireEvent.click(input);
        fireEvent.change(input, {target: {value: '부산'}});

        expect(within(screen.getByRole('listbox', {name: '업체'})).queryAllByRole('option')).toHaveLength(0);
        expect(screen.getByText('검색 결과가 없어요')).toBeTruthy();
        fireEvent.keyDown(input, {key: 'Enter'});
        expect(onChange).not.toHaveBeenCalled();
    });

    it('[FAIL:escape] Esc · 칸 떠남은 고르지 않고 닫아 원래 글자로 돌아간다', () => {
        const onChange = vi.fn();
        const input = renderSelect('a', onChange);

        fireEvent.click(input);
        fireEvent.change(input, {target: {value: '서면'}});
        fireEvent.keyDown(input, {key: 'Escape'});
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(input.value).toBe('스테이 리프 강남역점');

        fireEvent.click(input);
        fireEvent.blur(input);
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(onChange).not.toHaveBeenCalled();
    });
});
