'use client';
import { useContext, useState } from 'react';
import { updateStoreOpen } from '@/contracts/store/api';
import { StoreDetailResultDto } from '@/contracts/store/dto/store-detail.dto';
import { StoreOpenDto } from '@/contracts/store/dto/store-open.dto';
import { handleApiError } from '@/shared/api/error';
import Card from '@/shared/components/ui/display/Card';
import Switch from '@/shared/components/ui/form/Switch';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import styles from '@/app/css/admin/AdminDetail.module.css';

type StoreOpenCardProps = {
    store: StoreDetailResultDto; // 업체 상세 — 지금 영업중 여부
    locked: boolean;             // 탈퇴 — 잠금
    onChanged: () => void;       // 바꾼 뒤 상세 다시
};

/**
 * 영업중 — 스위치를 누르면 바로 영업중 여부 변경(큐)
 *
 * @param param0
 * @returns
 */
export default function StoreOpenCard({store, locked, onChanged}: StoreOpenCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰

    // 상태
    const [busy, setBusy] = useState<boolean>(false); // 바꾸는 중

    // 함수
    async function toggle(checked: boolean): Promise<void> {
        // ⑤ 영업중 여부 변경(큐) → 상세 다시
        const dto = Object.assign(new StoreOpenDto(), {is_open: checked ? 1 : 0});
        if (busy || locked || !(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateStoreOpen(auth, store.store_id, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        onChanged();
    }

    return (
        // 영업중
        <Card title="영업중">
            <Switch label="영업중" checked={store.is_open === 1} disabled={busy || locked} onChange={toggle} />
            <p className={styles.muted}>끄면 영업시간 · 연중무휴와 관계없이 영업중이 아닌 것(영업준비)으로 보입니다. 바로 저장됩니다.</p>
        </Card>
    );
}
