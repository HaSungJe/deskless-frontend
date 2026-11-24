'use client';
import { useState } from 'react';
import Button from '@/shared/components/ui/button/Button';
import Input from '@/shared/components/ui/form/Input';
import FilterChips, { FilterOptionType } from './FilterChips';
import styles from '@/shared/css/console/ListFilter.module.css';

/** 목록 거르기 · 쪽 — 상태(null 이 전체) · 제출한 검색어 · 쪽 */
export type ListQueryType = {
    state: string | null; // 상태 칩
    keyword: string;      // 조회한 검색어(앞뒤 빈칸 뗌)
    page: number;         // 보는 쪽
};

/** 처음 목록 — 전체 · 검색어 없음 · 1쪽 */
export const FIRST_LIST_QUERY: ListQueryType = {state: null, keyword: '', page: 1};

/** 검색어 최대 글자 수 — 콘솔 목록 DTO 의 keyword(입점 신청 · 업체 · 업체 관리자 · 이용자 · 문의) */
const KEYWORD_MAX = 100;

type ListFilterProps<T extends ListQueryType> = {
    stateLabel: string;                      // 상태 칩 묶음 이름 — "신청 상태"
    states: ReadonlyArray<FilterOptionType>; // 상태 칩(null 이 전체)
    placeholder: string;                     // 검색 칸 안내 — "상호명 · 사업자등록번호"
    query: T;                                // 지금 거르기 — 화면이 더한 값(업체 · 권한 · SNS)도 함께
    onChange: (next: T) => void;             // 바뀐 거르기 — 쪽은 1로
    leading?: React.ReactNode;               // 상태 칩 앞 거르기 — 업체 · 권한(A5) · 카테고리(문의)
    trailing?: React.ReactNode;              // 상태 칩 뒤 거르기 — SNS(A6)
};

/**
 * 콘솔 목록 거르기 — (앞 거르기) · 상태 칩 · (뒤 거르기) · 검색어(관리자 시안 A3 · A4 · A5 · A6 목록 위 줄 · 업체 관리자 · 관리자 문의 목록)
 *
 * @param param0
 * @returns
 */
export default function ListFilter<T extends ListQueryType>({stateLabel, states, placeholder, query, onChange, leading, trailing}: ListFilterProps<T>): React.ReactNode {
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
            {/* 거르기 — 앞 · 상태 칩 · 뒤 */}
            <div className={styles.filters}>
                {leading}
                <FilterChips label="상태" groupLabel={stateLabel} options={states} value={query.state} onPick={pickState} />
                {trailing}
            </div>

            {/* 검색 */}
            <form role="search" className={styles.search} onSubmit={search}>
                <Input type="search" aria-label="검색어" placeholder={placeholder} maxLength={KEYWORD_MAX} value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} />
                <Button type="submit">조회</Button>
            </form>
        </div>
    );
}
