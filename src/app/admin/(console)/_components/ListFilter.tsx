'use client';
import { useState } from 'react';
import Button from '@/shared/components/ui/button/Button';
import Chip from '@/shared/components/ui/form/Chip';
import Input from '@/shared/components/ui/form/Input';
import styles from '@/app/css/admin/ListFilter.module.css';

/** 목록 거르기 · 쪽 — 상태(null 이 전체) · 제출한 검색어 · 쪽 */
export type ListQueryType = {
    state: string | null; // 상태 칩
    keyword: string;      // 조회한 검색어(앞뒤 빈칸 뗌)
    page: number;         // 보는 쪽
};

/** 처음 목록 — 전체 · 검색어 없음 · 1쪽 */
export const FIRST_LIST_QUERY: ListQueryType = {state: null, keyword: '', page: 1};

/** 검색어 최대 글자 수 — StoreApplicationListDto · StoreListDto */
const KEYWORD_MAX = 100;

type ListFilterProps = {
    stateLabel: string;                                            // 칩 묶음 이름 — "신청 상태"
    states: ReadonlyArray<{value: string | null; label: string}>; // 칩(null 이 전체)
    placeholder: string;                                           // 검색 칸 안내 — "상호명 · 사업자등록번호"
    query: ListQueryType;                                          // 지금 거르기
    onChange: (next: ListQueryType) => void;                       // 바뀐 거르기 — 쪽은 1로
};

/**
 * 관리자 목록 거르기 — 상태 칩 · 검색어(시안 A3 · A4 목록 위 줄)
 *
 * @param param0
 * @returns
 */
export default function ListFilter({stateLabel, states, placeholder, query, onChange}: ListFilterProps): React.ReactNode {
    // 상태
    const [keywordInput, setKeywordInput] = useState<string>(query.keyword); // 검색 칸

    // 함수
    function pickState(state: string | null): void {
        // ② 상태 칩 → 1쪽부터
        onChange({...query, state, page: 1});
    }

    function search(event: React.FormEvent<HTMLFormElement>): void {
        // ② 검색어 → 1쪽부터
        event.preventDefault();
        onChange({...query, keyword: keywordInput.trim(), page: 1});
    }

    return (
        // 거르기 줄
        <div className={styles.bar}>
            {/* 상태 칩 */}
            <div role="group" aria-label={stateLabel} className={styles.chips}>
                <span className={styles.label}>상태</span>
                {states.map((option) => <Chip key={option.label} pressed={query.state === option.value} onClick={() => pickState(option.value)}>{option.label}</Chip>)}
            </div>

            {/* 검색 */}
            <form role="search" className={styles.search} onSubmit={search}>
                <Input type="search" aria-label="검색어" placeholder={placeholder} maxLength={KEYWORD_MAX} value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} />
                <Button type="submit">조회</Button>
            </form>
        </div>
    );
}
