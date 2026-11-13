import type { ComponentProps } from 'react';
import styles from '@/shared/css/ui/form/Input.module.css';

type TextareaProps = ComponentProps<'textarea'> & {
    invalid?: boolean; // 오류 테두리
};

/**
 * 여러 줄 입력 — 한 줄 입력과 같은 모양
 *
 * @param param0
 * @returns
 */
export default function Textarea({invalid = false, className, ...rest}: TextareaProps): React.ReactNode {
    // 변수
    const classNames = [styles.input, styles.textarea, invalid ? styles.invalid : '', className ?? ''].filter(Boolean).join(' '); // 기본 · 여러 줄 · 오류 · 밖에서 넘긴 클래스

    return (
        // 여러 줄 입력
        <textarea className={classNames} aria-invalid={invalid || undefined} {...rest} />
    );
}
