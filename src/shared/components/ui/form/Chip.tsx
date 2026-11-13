import type { ComponentProps } from 'react';
import styles from '@/shared/css/ui/form/Chip.module.css';

type ChipProps = ComponentProps<'button'> & {
    pressed: boolean; // 눌린 상태 (aria-pressed)
};

/**
 * 칩 — 누름 상태가 있는 작은 둥근 버튼 (시간대 · 반경 · 요일 고르기)
 *
 * @param param0
 * @returns
 */
export default function Chip({pressed, type = 'button', className, ...rest}: ChipProps): React.ReactNode {
    // 변수
    const classNames = [styles.chip, className ?? ''].filter(Boolean).join(' '); // 칩 · 밖에서 넘긴 클래스

    return (
        // 칩
        <button type={type} aria-pressed={pressed} className={classNames} {...rest} />
    );
}
