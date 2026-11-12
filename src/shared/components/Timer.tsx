'use client';
import { useEffect, useRef, useState } from "react";
import dayjs from 'dayjs';

type TimerProps = {
    time: string; // 끝나는 시각
    closeFunc?: () => void; // 시간이 다 되면 호출
}

/**
 * 남은 시간(mm:ss) 표시
 *
 * @param param0
 * @returns
 */
export default function Timer({time, closeFunc}: TimerProps): React.ReactNode {
    const [text, setText] = useState('00:00');
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(createText, 300);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [time]);

    // 시간 정보 생성
    function createText() {
        const remainSeconds = dayjs(time).diff(dayjs(), 'second');
        if (remainSeconds >= 0) {
            const minute = Math.floor(remainSeconds / 60).toString().padStart(2, '0');
            const second = Math.floor(remainSeconds % 60).toString().padStart(2, '0');
            setText(`${minute}:${second}`);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            if (closeFunc) {
                closeFunc();
            }
        }
    }

    return (
        <span style={{padding: '5px'}}>{text}</span>
    )
}
