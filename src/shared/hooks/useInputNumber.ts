import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useState } from 'react';

export type UseInputNumberType = {
    value: string | number;
    onChange: ChangeEventHandler<HTMLInputElement>;
    setValue: Dispatch<SetStateAction<string | number>>;
    resetValue: () => void;
};

/**
 * 정수 입력 (숫자 외 문자는 지운다)
 *
 * @param isNumberString 문자열로 들고 있을지
 * @param initValue 처음 값 · 초기화 값
 */
export default function useInputNumber(isNumberString: boolean, initValue: string | number = 0): UseInputNumberType {
    // 상태
    const [value, setValue] = useState<string | number>(initValue); // 입력 값

    // 함수
    function onCreate(changeValue: string | number): void {
        const digits = changeValue.toString().replace(/[^0-9]/g, '');
        if (digits === '') {
            setValue(0);
        } else if (isNumberString) {
            setValue(digits);
        } else {
            setValue(parseInt(digits, 10));
        }
    }

    function onChange(event: ChangeEvent<HTMLInputElement>): void {
        onCreate(event.target.value);
    }

    function resetValue(): void {
        onCreate(initValue);
    }

    return {value, onChange, setValue, resetValue};
}
