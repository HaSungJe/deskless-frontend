import { ChangeEvent, ChangeEventHandler, Dispatch, SetStateAction, useState } from 'react';

export type UseInputTimeType = {
    value: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
    setValue: Dispatch<SetStateAction<string>>;
    resetValue: () => void;
};

/**
 * 시간 입력 — 숫자만 받아 HH:mm:ss 로 잇는다. level 로 입력 자리수(시 · 분 · 초)를 정한다
 *
 * @param level 입력 자리
 * @param initValue 처음 값 · 초기화 값
 */
export default function useInputTime(level: 'HOUR' | 'MINUTE' | 'SECOND', initValue: string = ''): UseInputTimeType {
    // 변수
    const size: number = level === 'HOUR' ? 2 : (level === 'MINUTE' ? 4 : 6); // 받을 숫자 수

    // 상태
    const [value, setValue] = useState<string>(initValue); // 입력 값

    // 함수
    function onCreate(changeValue: string): string {
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
    }

    function onChange(event: ChangeEvent<HTMLInputElement>): void {
        setValue(onCreate(event.target.value));
    }

    function resetValue(): void {
        setValue(onCreate(initValue));
    }

    return {value, onChange, setValue, resetValue};
}
