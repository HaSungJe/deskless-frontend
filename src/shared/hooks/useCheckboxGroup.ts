'use client';
import { ChangeEvent, ChangeEventHandler, useState } from 'react';

type CheckboxValue = string | number;

export type UseCheckboxGroupType = {
    isAllSelected: boolean;
    selected: Array<CheckboxValue>;
    toggle: ChangeEventHandler<HTMLInputElement>;
    toggleAll: ChangeEventHandler<HTMLInputElement>;
};

/**
 * 체크박스 그룹 체크/체크해제
 * - 각 체크박스에 data-id={item[key]} 를 붙인다. data-id 는 문자열이라, 목록의 원래 값(숫자 등)으로 바꿔서 selected 에 담는다
 * - 목록이 바뀌면 선택을 비운다
 *
 * @param list 목록
 * @param key 목록 항목에서 값으로 쓸 키
 */
export default function useCheckboxGroup<T extends Record<string, unknown>>(list: Array<T>, key: keyof T & string): UseCheckboxGroupType {
    // 상태
    const [isAllSelected, setIsAllSelected] = useState<boolean>(false); // 전체 선택여부
    const [selected, setSelected] = useState<Array<CheckboxValue>>([]); // 선택된 값
    const [prevList, setPrevList] = useState<Array<T>>(list);           // 직전 목록 — 바뀌면 선택을 비운다

    // 목록이 바뀌면 선택 초기화 — 렌더 중에 맞춘다(effect 로 하면 한 번 더 그린다)
    if (list !== prevList) {
        setPrevList(list);
        setIsAllSelected(false);
        setSelected([]);
    }

    // 함수
    function toggle(event: ChangeEvent<HTMLInputElement>): void {
        const id = event.target.dataset.id;
        if (selected.some((value) => String(value) === id)) {
            setIsAllSelected(false);
            setSelected(selected.filter((value) => String(value) !== id));
        } else {
            const item = list.find((e) => String(e[key]) === id);
            const value = (item ? item[key] : id) as CheckboxValue;
            setIsAllSelected(list.length === selected.length + 1);
            setSelected([...selected, value]);
        }
    }

    function toggleAll(): void {
        if (isAllSelected) {
            setIsAllSelected(false);
            setSelected([]);
        } else {
            setIsAllSelected(true);
            setSelected(list.map((e) => e[key] as CheckboxValue));
        }
    }

    return {isAllSelected, selected, toggle, toggleAll};
}
