import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useCallback, useState } from "react";

export type UseInputNumberType = {
    value: string | number;
    onChange: ChangeEventHandler<HTMLInputElement>;
    setValue: Dispatch<SetStateAction<string | number>>;
    resetValue: () => void;
}

// 정수 입력 (숫자 외 문자는 지운다)
export default function useInputNumber(isNumberString: boolean, initValue: string | number = 0): UseInputNumberType {
    const [value, setValue] = useState<string | number>(initValue);

    // 값 생성
    const onCreate = useCallback((changeValue: string | number) => {
        const digits = changeValue.toString().replace(/[^0-9]/g, '');
        if (digits === '') {
            setValue(0);
        } else if (isNumberString) {
            setValue(digits);
        } else {
            setValue(parseInt(digits, 10));
        }
    }, []);

    // 값 변경
    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        onCreate(event.target.value);
    }, []);

    // 값 초기화
    const resetValue = useCallback(() => {
        onCreate(initValue);
    }, []);

    return {value, onChange, setValue, resetValue};
}
