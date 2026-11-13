import styles from '@/shared/css/ui/form/Segmented.module.css';

export type SegmentedOptionType<T extends string> = {
    value: T;
    label: string;
};

type SegmentedProps<T extends string> = {
    options: Array<SegmentedOptionType<T>>;
    value: T;
    onChange: (value: T) => void;
    label: string; // 묶음 이름 (aria-label)
};

/**
 * 선택 버튼 묶음 — 여러 개 중 하나 (role="radiogroup")
 *
 * @param param0
 * @returns
 */
export default function Segmented<T extends string>({options, value, onChange, label}: SegmentedProps<T>): React.ReactNode {
    // 함수
    function select(option: SegmentedOptionType<T>): void {
        if (option.value !== value) {
            onChange(option.value);
        }
    }

    return (
        // 선택 버튼 묶음
        <div role="radiogroup" aria-label={label} className={styles.segmented}>
            {/* 선택지 */}
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={option.value === value}
                    className={styles.option}
                    onClick={() => select(option)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
