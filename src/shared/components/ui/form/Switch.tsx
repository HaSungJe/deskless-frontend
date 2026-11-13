import styles from '@/shared/css/ui/form/Switch.module.css';

type SwitchProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
};

/**
 * 켜기 · 끄기 스위치 (role="switch")
 *
 * @param param0
 * @returns
 */
export default function Switch({checked, onChange, label, disabled = false}: SwitchProps): React.ReactNode {
    // 함수
    function toggle(): void {
        onChange(!checked);
    }

    return (
        // 라벨로 감싼 스위치 — 글자를 눌러도 바뀐다
        <label className={styles.wrap}>
            {/* 스위치 */}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                className={styles.switch}
                onClick={toggle}
            />

            {/* 이름 */}
            <span>{label}</span>
        </label>
    );
}
