'use client';
import Chip from '@/shared/components/ui/form/Chip';
import styles from '@/shared/css/console/ListFilter.module.css';

/** 거르기 값 하나 — 값(null 이 전체) · 이름 */
export type FilterOptionType = {
    value: string | null; // 보낼 값 — null 이면 보내지 않는다(전체)
    label: string;        // 칩 · 고르기 글자
};

type FilterChipsProps = {
    label: string;                            // 칩 앞 글자 — "상태"
    groupLabel: string;                       // 칩 묶음 이름(aria-label) — "회원 상태"
    options: ReadonlyArray<FilterOptionType>; // 칩(null 이 전체)
    value: string | null;                     // 고른 값
    onPick: (value: string | null) => void;   // 고름
};

/**
 * 콘솔 목록 칩 묶음 — 앞 글자 · 칩(시안 목록 위 줄)
 *
 * @param param0
 * @returns
 */
export default function FilterChips({label, groupLabel, options, value, onPick}: FilterChipsProps): React.ReactNode {
    return (
        // 칩 묶음
        <div role="group" aria-label={groupLabel} className={styles.chips}>
            <span className={styles.label}>{label}</span>
            {options.map((option) => <Chip key={option.label} pressed={value === option.value} onClick={() => onPick(option.value)}>{option.label}</Chip>)}
        </div>
    );
}
