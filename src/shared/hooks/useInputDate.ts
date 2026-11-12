import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useCallback, useState } from "react";

type DatePart = 'Y' | 'M' | 'D';

export type UseInputDateType = {
    value: string;
    filter: DatePart[];
    onChange: ChangeEventHandler<HTMLInputElement>;
    setValue: Dispatch<SetStateAction<string>>;
    resetValue: () => void;
}

// 날짜 입력 — 숫자만 받아 YYYYMMDD 를 dot 구분자로 잇는다. filter 로 쓸 자리(년 · 월 · 일)를 고른다
export default function useInputDate(dot: string, filter: DatePart[], initValue: string = ""): UseInputDateType {
    const [value, setValue] = useState<string>(initValue);

    // 값 생성
    const onCreate = useCallback((changeValue: string) => {
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
    }, []);

    // 값 변경
    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setValue(onCreate(event.target.value));
    }, []);

    // 값 초기화
    const resetValue = useCallback(() => {
        setValue(onCreate(initValue));
    }, []);

    return {value, filter, onChange, setValue, resetValue};
}
