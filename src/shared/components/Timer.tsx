'use client';
import { useEffect, useEffectEvent, useState } from 'react';
import dayjs from 'dayjs';

type TimerProps = {
    time: string;            // 끝나는 시각
    closeFunc?: () => void;  // 시간이 다 되면 호출
};

/**
 * 남은 시간(mm:ss) 표시
 *
 * @param param0
 * @returns
 */
export default function Timer({time, closeFunc}: TimerProps): React.ReactNode {
    // 변수
    const onTimeUp = useEffectEvent(() => closeFunc?.()); // 시간이 다 됐을 때 — 그때의 closeFunc(효과를 다시 걸지 않는다)

    // 상태
    const [text, setText] = useState<string>('00:00'); // 남은 시간 mm:ss

    // 효과
    useEffect(() => {
        // 0.3초마다 남은 시간을 다시 그리고, 다 되면 멈추고 closeFunc 를 time 마다 한 번
        const interval = setInterval(() => {
            const remainSeconds = dayjs(time).diff(dayjs(), 'second');
            if (remainSeconds >= 0) {
                const minute = Math.floor(remainSeconds / 60).toString().padStart(2, '0');
                const second = Math.floor(remainSeconds % 60).toString().padStart(2, '0');
                setText(`${minute}:${second}`);
            } else {
                clearInterval(interval);
                onTimeUp();
            }
        }, 300);

        return () => {
            clearInterval(interval);
        };
    }, [time]);

    return (
        // 남은 시간
        <span style={{padding: '5px'}}>{text}</span>
    );
}
