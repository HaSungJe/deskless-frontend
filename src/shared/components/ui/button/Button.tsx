import type { ComponentProps } from 'react';
import styles from '@/shared/css/ui/button/Button.module.css';

type ButtonStyleType = {
    variant?: 'default' | 'primary' | 'danger';
    size?: 'md' | 'sm' | 'lg';
    icon?: boolean; // 정사각 아이콘 버튼 — aria-label 을 붙인다
    full?: boolean; // 가로 꽉 채움
};

type ButtonProps = ComponentProps<'button'> & ButtonStyleType;

/**
 * 버튼 클래스 — <Link> 처럼 다른 요소를 버튼 모양으로 그릴 때
 *
 * @param style 모양
 * @returns className
 */
export function buttonClass({variant = 'default', size = 'md', icon = false, full = false}: ButtonStyleType = {}): string {
    return [
        styles.button,
        variant === 'default' ? '' : styles[variant],
        size === 'md' ? '' : styles[size],
        icon ? styles.icon : '',
        full ? styles.full : '',
    ].filter(Boolean).join(' ');
}

/**
 * 버튼 — 기본 · 강조(primary) · 위험(danger), 크기 sm · md · lg
 *
 * @param param0
 * @returns
 */
export default function Button({variant, size, icon, full, type = 'button', className, ...rest}: ButtonProps): React.ReactNode {
    // 변수
    const classNames = [buttonClass({variant, size, icon, full}), className ?? ''].filter(Boolean).join(' '); // 모양 클래스 + 밖에서 넘긴 클래스

    return (
        // 버튼
        <button type={type} className={classNames} {...rest} />
    );
}
