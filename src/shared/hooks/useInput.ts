import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useState } from 'react';

export type UseInputType = {
    value: string;
    onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
    setValue: Dispatch<SetStateAction<string>>;
    resetValue: () => void;
};

/**
 * 글자 입력
 *
 * @param initValue 처음 값 · 초기화 값
 */
export default function useInput(initValue: string = ''): UseInputType {
    // 상태
    const [value, setValue] = useState<string>(initValue); // 입력 값

    // 함수
    function onChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void {
        setValue(event.target.value);
    }

    function resetValue(): void {
        setValue(initValue);
    }

    return {value, onChange, setValue, resetValue};
}
