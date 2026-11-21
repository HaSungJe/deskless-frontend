'use client';
import { useEffect, useId, useState } from 'react';
import Input from './Input';
import styles from '@/shared/css/ui/form/SearchSelect.module.css';

/** 고를 것 하나 — 값 · 글자 */
export type SearchSelectOptionType = {
    value: string; // 고른 값 — '' 를 "전체" 같은 빈 값으로 써도 된다
    label: string; // 목록 · 칸 글자(검색 대상)
};

type SearchSelectProps = {
    id: string;                                     // 입력 칸 id
    label: string;                                  // 칸 이름(aria-label) — 보이는 라벨 없이 쓸 때도 읽힌다
    options: ReadonlyArray<SearchSelectOptionType>; // 고를 것(이 순서대로)
    value: string;                                  // 고른 값
    onChange: (value: string) => void;              // 고름 — 같은 것을 다시 고르면 부르지 않는다
    placeholder?: string;                           // 고른 것이 없을 때 칸 안내
    emptyText?: string;                             // 검색 결과가 없을 때
};

/**
 * 검색 고르기 — 칸에 글자를 쳐서 목록을 거르고 고른다(select2 처럼). 고르기 상자(Select)와 같은 모양
 * - 칸을 누르면 목록이 열리고 칸은 비워진다(지금 고른 것은 안내 글자로), 치면 글자가 들어간 것만 남는다
 * - 키보드 ↑ ↓ 로 줄 이동 · Enter 로 고름 · Esc 로 닫음, 칸을 떠나면 닫는다(고른 값은 그대로)
 *
 * @param param0
 * @returns
 */
export default function SearchSelect({id, label, options, value, onChange, placeholder = '', emptyText = '검색 결과가 없어요'}: SearchSelectProps): React.ReactNode {
    // 변수
    const listId = useId(); // 목록 id — aria-controls · 줄 id 머리

    // 상태
    const [open, setOpen] = useState<boolean>(false); // 목록 열림
    const [query, setQuery] = useState<string>('');   // 연 뒤 친 검색어
    const [active, setActive] = useState<number>(0);  // 키보드로 가리킨 줄

    // 계산 값
    const selected = options.find((option) => option.value === value) ?? null;                                    // 고른 것
    const keyword = query.trim().toLowerCase();                                                                    // 비교할 검색어(대소문자 무시)
    const filtered = keyword ? options.filter((option) => option.label.toLowerCase().includes(keyword)) : options; // 보이는 줄
    const activeIndex = Math.min(active, filtered.length - 1);                                                     // 가리킨 줄 — 줄이 줄어도 안에(없으면 -1)
    const activeId = open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined;                           // 가리킨 줄 id — aria-activedescendant

    // 효과
    useEffect(() => {
        // 키보드로 옮긴 줄이 목록 밖이면 보이게 굴린다(jsdom 등 scrollIntoView 없는 곳은 건너뜀)
        if (activeId) {
            document.getElementById(activeId)?.scrollIntoView?.({block: 'nearest'});
        }
    }, [activeId]);

    // 함수
    function openList(): void {
        // 열기 — 검색어를 비워 전부 보이고, 고른 줄을 가리킨다
        setOpen(true);
        setQuery('');
        setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    }

    function closeList(): void {
        // 닫기 — 검색어를 버린다(칸에는 고른 글자가 돌아온다)
        setOpen(false);
        setQuery('');
    }

    function choose(option: SearchSelectOptionType): void {
        // 고름 — 닫고, 바뀌었을 때만 알린다
        closeList();
        if (option.value !== value) {
            onChange(option.value);
        }
    }

    function typeQuery(text: string): void {
        // 치는 동안 — 열고 첫 줄을 가리킨다
        setOpen(true);
        setQuery(text);
        setActive(0);
    }

    function moveActive(step: number): void {
        // ↑ ↓ — 끝에서 반대 끝으로
        if (filtered.length > 0) {
            setActive((Math.max(activeIndex, 0) + step + filtered.length) % filtered.length);
        }
    }

    function keyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
        // 키보드 — ↑ ↓ 이동(닫혀 있으면 열기) · Enter 고름 · Esc 닫기
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (open) {
                moveActive(event.key === 'ArrowDown' ? 1 : -1);
            } else {
                openList();
            }
            return;
        }

        if (event.key === 'Enter' && open && activeIndex >= 0) {
            event.preventDefault();
            choose(filtered[activeIndex]);
            return;
        }

        if (event.key === 'Escape' && open) {
            event.preventDefault();
            closeList();
        }
    }

    return (
        // 검색 고르기
        <div className={styles.wrap}>
            {/* 칸 — 열면 검색어, 닫히면 고른 글자 */}
            <Input
                id={id}
                role="combobox"
                aria-label={label}
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                autoComplete="off"
                className={styles.input}
                placeholder={open ? (selected?.label ?? placeholder) : placeholder}
                value={open ? query : (selected?.label ?? '')}
                onClick={() => {
                    if (!open) {
                        openList();
                    }
                }}
                onChange={(event) => typeQuery(event.target.value)}
                onKeyDown={keyDown}
                onBlur={closeList}
            />
            <span className={styles.arrow} aria-hidden="true">▾</span>

            {/* 목록 — 누르는 동안 칸이 포커스를 잃지 않게(mousedown 막음) */}
            {open ? (
                <ul id={listId} role="listbox" aria-label={label} className={styles.list}>
                    {filtered.map((option, index) => (
                        <li
                            key={option.value}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={option.value === value}
                            className={[styles.option, index === activeIndex ? styles.active : '', option.value === value ? styles.selected : ''].filter(Boolean).join(' ')}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setActive(index)}
                            onClick={() => choose(option)}
                        >
                            {option.label}
                        </li>
                    ))}
                    {filtered.length === 0 ? <li className={styles.empty}>{emptyText}</li> : null}
                </ul>
            ) : null}
        </div>
    );
}
