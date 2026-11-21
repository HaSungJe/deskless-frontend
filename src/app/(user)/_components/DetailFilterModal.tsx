'use client';
import { useState } from 'react';
import { DiscoveryRoomGroupDetailFilterItemResultDto } from '@/contracts/discovery/dto/discovery-room-group-detail-filter.dto';
import Button from '@/shared/components/ui/button/Button';
import Modal from '@/shared/components/ui/modal/Modal';
import styles from '@/app/css/user/DetailFilterModal.module.css';

type DetailFilterModalProps = {
    open: boolean;                                                    // 열림
    items: Array<DiscoveryRoomGroupDetailFilterItemResultDto> | null; // 항목(백엔드가 준 순서) — 받기 전 · 못 받았으면 null
    failed: boolean;                                                  // 항목을 못 받음
    selected: Array<string>;                                          // 적용 중인 항목 키
    onApply: (keys: Array<string>) => void;                           // 적용 — 항목 순서대로 고른 키(없으면 빈 배열)
    onClose: () => void;                                              // 닫기
};

type DetailFilterBodyProps = Omit<DetailFilterModalProps, 'open'>;

/**
 * 추가정보 필터 팝업 — 백엔드가 준 항목마다 체크박스(화면에 항목을 적어 두지 않는다 — frontend/changes/2026-11-22-discovery-filter.md)
 *
 * @param param0
 * @returns
 */
export default function DetailFilterModal({open, onClose, ...bodyProps}: DetailFilterModalProps): React.ReactNode {
    return (
        // 팝업 — 열릴 때마다 본문을 새로 그려 고르던 값이 적용 중인 값으로 돌아간다
        <Modal open={open} title="추가정보 필터" onClose={onClose}>
            <DetailFilterBody onClose={onClose} {...bodyProps} />
        </Modal>
    );
}

/**
 * 추가정보 필터 본문 — 체크박스 · 초기화 · 적용
 *
 * @param param0
 * @returns
 */
function DetailFilterBody({items, failed, selected, onApply, onClose}: DetailFilterBodyProps): React.ReactNode {
    // 상태
    const [checked, setChecked] = useState<Array<string>>(selected); // 고르는 중인 항목 키 — 처음은 적용 중인 값

    // 함수
    function toggle(key: string, on: boolean): void {
        // 체크박스 하나
        setChecked((prev) => (on ? [...prev, key] : prev.filter((item) => item !== key)));
    }

    function apply(): void {
        // 항목 순서대로 고른 키를 넘긴다
        onApply((items ?? []).map((item) => item.key).filter((key) => checked.includes(key)));
    }

    return (
        // 본문
        <>
            {/* 안내 · 항목 */}
            <p className={styles.description}>고른 조건을 모두 갖춘 객실이 있는 업체만 보여요.</p>
            {items === null ? <p className={styles.state}>{failed ? '항목을 불러오지 못했어요. 닫고 다시 열어 주세요.' : '항목을 불러오고 있어요'}</p> : null}
            {items ? (
                <div className={styles.list} role="group" aria-label="추가정보">
                    {items.map((item) => (
                        <label key={item.key} className={styles.item}>
                            <input type="checkbox" checked={checked.includes(item.key)} onChange={(event) => toggle(item.key, event.target.checked)} />
                            {item.name}
                        </label>
                    ))}
                </div>
            ) : null}

            {/* 버튼 줄 */}
            <div className={styles.actions}>
                <Button onClick={onClose}>닫기</Button>
                <Button onClick={() => setChecked([])}>초기화</Button>
                <Button variant="primary" disabled={items === null} onClick={apply}>적용</Button>
            </div>
        </>
    );
}
