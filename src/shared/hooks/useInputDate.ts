import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useState } from 'react';

type DatePart = 'Y' | 'M' | 'D';

export type UseInputDateType = {
    value: string;
    filter: DatePart[];
    onChange: ChangeEventHandler<HTMLInputElement>;
    setValue: Dispatch<SetStateAction<string>>;
    resetValue: () => void;
};

/**
 * 날짜 입력 — 숫자만 받아 YYYYMMDD 를 dot 구분자로 잇는다. filter 로 쓸 자리(년 · 월 · 일)를 고른다
 *
 * @param dot 구분자
 * @param filter 쓸 자리
 * @param initValue 처음 값 · 초기화 값
 */
export default function useInputDate(dot: string, filter: DatePart[], initValue: string = ''): UseInputDateType {
    // 상태
    const [value, setValue] = useState<string>(initValue); // 입력 값

    // 함수
    function onCreate(changeValue: string): string {
        const digits = changeValue.toString().replace(/[^0-9]/g, '').substring(0, 8);
        const year = digits.substring(0, 4);
        const month = digits.substring(4, 6);
        const day = digits.substring(6, 8);

        const result: Array<string> = [];
        if (year && filter.includes('Y')) {
            result.push(year);
        }
        if (month && filter.includes('M')) {
            result.push(month);
        }
        if (day && filter.includes('D')) {
            result.push(day);
        }

        return result.join(dot);
    }

    function onChange(event: ChangeEvent<HTMLInputElement>): void {
        setValue(onCreate(event.target.value));
    }

    function resetValue(): void {
        setValue(onCreate(initValue));
    }

    return {value, filter, onChange, setValue, resetValue};
}
