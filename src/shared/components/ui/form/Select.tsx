import type { ComponentProps } from 'react';
import styles from '@/shared/css/ui/form/Input.module.css';

type SelectProps = ComponentProps<'select'> & {
    invalid?: boolean; // 오류 테두리
};

/**
 * 고르기 상자 — 한 줄 입력과 같은 모양(화살표는 브라우저 기본)
 *
 * @param param0
 * @returns
 */
export default function Select({invalid = false, className, ...rest}: SelectProps): React.ReactNode {
    // 변수
    const classNames = [styles.input, invalid ? styles.invalid : '', className ?? ''].filter(Boolean).join(' '); // 기본 · 오류 · 밖에서 넘긴 클래스

    return (
        // 고르기 상자
        <select className={classNames} aria-invalid={invalid || undefined} {...rest} />
    );
}
