import type { ComponentProps } from 'react';
import styles from '@/shared/css/ui/form/Input.module.css';

type InputProps = ComponentProps<'input'> & {
    invalid?: boolean; // 오류 테두리
};

/**
 * 한 줄 입력
 *
 * @param param0
 * @returns
 */
export default function Input({invalid = false, className, ...rest}: InputProps): React.ReactNode {
    // 변수
    const classNames = [styles.input, invalid ? styles.invalid : '', className ?? ''].filter(Boolean).join(' '); // 기본 · 오류 · 밖에서 넘긴 클래스

    return (
        // 한 줄 입력
        <input className={classNames} aria-invalid={invalid || undefined} {...rest} />
    );
}
