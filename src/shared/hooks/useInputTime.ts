import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useCallback, useState } from "react";

export type UseInputTimeType = {
    value: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
    setValue: Dispatch<SetStateAction<string>>;
    resetValue: () => void;
}

// 시간 입력 — 숫자만 받아 HH:mm:ss 로 잇는다. level 로 입력 자리수(시 · 분 · 초)를 정한다
export default function useInputTime(level: 'HOUR' | 'MINUTE' | 'SECOND', initValue: string = ""): UseInputTimeType {
    const size: number = level === 'HOUR' ? 2 : (level === 'MINUTE' ? 4 : 6);
    const [value, setValue] = useState<string>(initValue);

    // 값 생성
    const onCreate = useCallback((changeValue: string) => {
        const digits = changeValue.toString().replace(/[^0-9]/g, '').substring(0, size);
        const hour = digits.substring(0, 2);
        const minute = digits.substring(2, 4);
        const second = digits.substring(4, 6);

        const result: Array<string> = [];
        if (hour) {
            result.push(hour);
        }
        if (minute) {
            result.push(minute);
        }
        if (second) {
            result.push(second);
        }

        return result.join(':');
    }, []);

    // 값 변경
    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setValue(onCreate(event.target.value));
    }, []);

    // 값 초기화
    const resetValue = useCallback(() => {
        setValue(onCreate(initValue));
    }, []);

    return {value, onChange, setValue, resetValue};
}
