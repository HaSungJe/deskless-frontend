'use client';
import Select from '@/shared/components/ui/form/Select';
import { FilterOptionType } from './FilterChips';
import styles from '@/app/css/admin/ListFilter.module.css';

type FilterSelectProps = {
    id: string;                               // 고르기 상자 id — 앞 글자가 가리킨다
    label: string;                            // 앞 글자 — "업체"
    options: ReadonlyArray<FilterOptionType>; // 고를 것(null 이 전체 — 맨 앞)
    value: string | null;                     // 고른 값
    onPick: (value: string | null) => void;   // 고름
};

/**
 * 관리자 목록 고르기 상자 — 앞 글자 · 고르기(업체 · SNS). 전체는 빈 값 option
 *
 * @param param0
 * @returns
 */
export default function FilterSelect({id, label, options, value, onPick}: FilterSelectProps): React.ReactNode {
    return (
        // 고르기
        <div className={styles.select}>
            <label htmlFor={id} className={styles.label}>{label}</label>
            <Select id={id} value={value ?? ''} onChange={(event) => onPick(event.target.value || null)}>
                {options.map((option) => <option key={option.value ?? ''} value={option.value ?? ''}>{option.label}</option>)}
            </Select>
        </div>
    );
}
