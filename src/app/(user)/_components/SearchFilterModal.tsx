'use client';
import { useState } from 'react';
import { DiscoveryDetailFilterItemResultDto } from '@/contracts/discovery/dto/discovery-detail-filter.dto';
import Button from '@/shared/components/ui/button/Button';
import Chip from '@/shared/components/ui/form/Chip';
import Modal from '@/shared/components/ui/modal/Modal';
import { DEFAULT_RADIUS, groupDetailFilters, RADIUS_OPTIONS, radiusLabel, RadiusType, SEARCH_FILTER_NAME } from './search-filter';
import styles from '@/app/css/user/SearchFilterModal.module.css';

type SearchFilterModalProps = {
    open: boolean;                                                // 열림
    items: Array<DiscoveryDetailFilterItemResultDto> | null;      // 체크 항목(백엔드가 준 순서) — 받기 전 · 못 받았으면 null
    failed: boolean;                                              // 체크 항목을 못 받음
    radiusKm: RadiusType;                                         // 적용 중인 거리
    selected: Array<string>;                                      // 적용 중인 항목 키
    onApply: (radiusKm: RadiusType, keys: Array<string>) => void; // 적용 — 거리 · 항목 순서대로 고른 키(없으면 빈 배열)
    onClose: () => void;                                          // 닫기 — 아무것도 바꾸지 않는다
};

type SearchFilterBodyProps = Omit<SearchFilterModalProps, 'open'>;

/** 체크 항목 안내 — 객실 · 편의시설이 거르는 방식이 다르다(frontend/changes/2026-11-24-store-facility.md) */
const ITEMS_DESCRIPTION = '객실 조건은 그 조건을 모두 갖춘 객실이 있는 업체, 편의시설은 그 시설이 있는 업체만 보여요.';

/**
 * 검색필터 팝업 — 맨 위 거리 한 줄, 아래 백엔드가 준 체크 항목을 묶음(객실 · 편의시설)마다(항목은 화면에 적지 않는다 — frontend/changes/2026-11-22-discovery-filter.md)
 *
 * @param param0
 * @returns
 */
export default function SearchFilterModal({open, onClose, ...bodyProps}: SearchFilterModalProps): React.ReactNode {
    return (
        // 팝업 — 열릴 때마다 본문을 새로 그려 고르던 값이 적용 중인 값으로 돌아간다
        <Modal open={open} title={SEARCH_FILTER_NAME} onClose={onClose}>
            <SearchFilterBody onClose={onClose} {...bodyProps} />
        </Modal>
    );
}

/**
 * 검색필터 본문 — 거리 · 묶음 체크박스 · 닫기 · 초기화 · 적용
 *
 * @param param0
 * @returns
 */
function SearchFilterBody({items, failed, radiusKm, selected, onApply, onClose}: SearchFilterBodyProps): React.ReactNode {
    // 상태
    const [radius, setRadius] = useState<RadiusType>(radiusKm);      // 고르는 중인 거리 — 처음은 적용 중인 값
    const [checked, setChecked] = useState<Array<string>>(selected); // 고르는 중인 항목 키 — 처음은 적용 중인 값

    // 계산 값
    const groups = items ? groupDetailFilters(items) : null; // ③ 객실 · 편의시설 묶음(받은 순서) — 받기 전 null

    // 함수
    function toggle(key: string, on: boolean): void {
        // ③ 체크박스 하나
        setChecked((prev) => (on ? [...prev, key] : prev.filter((item) => item !== key)));
    }

    function reset(): void {
        // ③ 초기화 — 거리 20km · 체크 해제(적용을 눌러야 검색)
        setRadius(DEFAULT_RADIUS);
        setChecked([]);
    }

    function apply(): void {
        // ④ 거리 · 항목 순서대로 고른 키를 넘긴다(묶음과 상관없이)
        onApply(radius, (items ?? []).map((item) => item.key).filter((key) => checked.includes(key)));
    }

    return (
        // 본문
        <>
            {/* ③ 거리 — 한 줄 */}
            <div className={styles.section} role="group" aria-labelledby="search-filter-radius">
                <h3 id="search-filter-radius" className={styles.sectionTitle}>거리</h3>
                <div className={styles.radius}>
                    {RADIUS_OPTIONS.map((option) => <Chip key={option} pressed={option === radius} onClick={() => setRadius(option)}>{radiusLabel(option)}</Chip>)}
                </div>
            </div>

            {/* ③ 체크 항목 — 묶음마다 제목 · 아래로 */}
            <p className={styles.description}>{ITEMS_DESCRIPTION}</p>
            {groups === null ? <p className={styles.state}>{failed ? '항목을 불러오지 못했어요. 닫고 다시 열어 주세요.' : '항목을 불러오고 있어요'}</p> : null}
            {groups?.map((group) => (
                <div key={group.group} className={styles.section} role="group" aria-labelledby={`search-filter-${group.group}`}>
                    <h3 id={`search-filter-${group.group}`} className={styles.sectionTitle}>{group.name}</h3>
                    <div className={styles.list}>
                        {group.items.map((item) => (
                            <label key={item.key} className={styles.item}>
                                <input type="checkbox" checked={checked.includes(item.key)} onChange={(event) => toggle(item.key, event.target.checked)} />
                                {item.name}
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            {/* 버튼 줄 — 항목을 못 읽어도 거리만 골라 적용할 수 있다 */}
            <div className={styles.actions}>
                <Button onClick={onClose}>닫기</Button>
                <Button onClick={reset}>초기화</Button>
                <Button variant="primary" onClick={apply}>적용</Button>
            </div>
        </>
    );
}
