'use client';
import { ChangeEvent, ChangeEventHandler, useCallback, useEffect, useState } from "react";

type CheckboxValue = string | number;

export type UseCheckboxGroupType = {
    isAllSelected: boolean;
    selected: Array<CheckboxValue>;
    toggle: ChangeEventHandler<HTMLInputElement>;
    toggleAll: ChangeEventHandler<HTMLInputElement>;
}

/**
 * 체크박스 그룹 체크/체크해제
 * - 각 체크박스에 data-id={item[key]} 를 붙인다. data-id 는 문자열이라, 목록의 원래 값(숫자 등)으로 바꿔서 selected 에 담는다
 *
 * @param list 목록
 * @param key 목록 항목에서 값으로 쓸 키
 */
export default function useCheckboxGroup<T extends Record<string, any>>(list: Array<T>, key: keyof T & string): UseCheckboxGroupType {
    const [isAllSelected, setIsAllSelected] = useState<boolean>(false); // 전체 선택여부
    const [selected, setSelected] = useState<Array<CheckboxValue>>([]); // 선택된 값

    // 목록 변경시, 선택값 초기화
    useEffect(() => {
        setIsAllSelected(false);
        setSelected([]);
    }, [list]);

    // 선택/선택해제
    const toggle = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const id = event.target.dataset.id;
        if (selected.some((value) => String(value) === id)) {
            setIsAllSelected(false);
            setSelected(selected.filter((value) => String(value) !== id));
        } else {
            const item = list.find((e) => String(e[key]) === id);
            const value: CheckboxValue = item ? item[key] : id;
            setIsAllSelected(list.length === selected.length + 1);
            setSelected([...selected, value]);
        }
    }, [list, key, selected]);

    // 전체 선택/선택해제
    const toggleAll = useCallback(() => {
        if (isAllSelected) {
            setIsAllSelected(false);
            setSelected([]);
        } else {
            setIsAllSelected(true);
            setSelected(list.map((e) => e[key]));
        }
    }, [list, key, isAllSelected]);

    return { isAllSelected, selected, toggle, toggleAll }
}
