import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useState } from 'react';

export type UseInputFloatType = {
    value: string | number;
    onChange: ChangeEventHandler<HTMLInputElement>;
    setValue: Dispatch<SetStateAction<string | number>>;
    resetValue: () => void;
};

/**
 * 실수 입력 (숫자 · 소수점 하나만 허용)
 *
 * @param isNumberString 문자열로 들고 있을지
 * @param initValue 처음 값 · 초기화 값
 */
export default function useInputFloat(isNumberString: boolean, initValue: string | number = 0): UseInputFloatType {
    // 상태
    const [value, setValue] = useState<string | number>(initValue); // 입력 값

    // 함수
    function onCreate(changeValue: string | number): void {
        const text = changeValue.toString().replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        if (text === '' || text === '.') {
            setValue(0);
        } else if (isNumberString || /\.(\d*0)?$/.test(text)) {
            // 문자열로 받거나, 입력 중인 소수("1." · "1.0")는 숫자로 바꾸면 점 · 0 이 사라지므로 그대로 둔다
            setValue(text);
        } else {
            setValue(parseFloat(text));
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
