'use client';
import { useContext, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { STORE_STATE } from '@/contracts/common/store.constants';
import { updateStoreState } from '@/contracts/store/api';
import { StoreDetailResultDto } from '@/contracts/store/dto/store-detail.dto';
import { StoreStateDto } from '@/contracts/store/dto/store-state.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import Field from '@/shared/components/ui/form/Field';
import Textarea from '@/shared/components/ui/form/Textarea';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import { STORE_STATE_TONE } from '../../store-format';
import styles from '@/app/css/admin/AdminDetail.module.css';

type StoreStateCardProps = {
    store: StoreDetailResultDto; // 업체 상세 — 지금 상태
    locked: boolean;             // 탈퇴 — 잠금
    onChanged: () => void;       // 바꾼 뒤 상세 다시
};

/** 정지 사유 최대 글자 수 — StoreStateDto */
const SUSPEND_COMMENT_MAX = 255;

/** 바꿀 상태 — 시안 A4 라디오(설명) */
const STATE_OPTIONS = [
    {value: STORE_STATE.ACTIVE, description: '이용자 지도에 나오고 예약을 받습니다.'},
    {value: STORE_STATE.SUSPEND, description: '지도에서 빠집니다. 사유는 업체 관리자의 내 업체 화면에 보입니다.'},
    {value: STORE_STATE.LEAVE, description: '되돌릴 수 없습니다. 이 업체의 업체 관리자 계정이 모두 정지됩니다.'},
] as const;

/**
 * 업체 상태 — 바꿀 상태(지금과 다르면 켜짐) · 정지 사유(영업중지만) · 탈퇴는 확인 뒤 → 상태 변경(큐)
 *
 * @param param0
 * @returns
 */
export default function StoreStateCard({store, locked, onChanged}: StoreStateCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰

    // 상태
    const [stateId, setStateId] = useState<string>(store.store_state_id); // ④ 고른 상태 — 처음은 지금 상태
    const [comment, setComment] = useState<string>('');                  // ④ 정지 사유
    const [confirming, setConfirming] = useState<boolean>(false);        // ④ 탈퇴 확인 대화상자
    const [busy, setBusy] = useState<boolean>(false);                    // 바꾸는 중

    // 계산 값
    const changed = stateId !== store.store_state_id;   // ④ 지금과 다르면 "상태 변경" 켜짐
    const suspending = stateId === STORE_STATE.SUSPEND; // ④ 정지 사유 칸 켜짐

    // 함수 — send 를 submit 보다 먼저(아래에 선언된 함수를 부르면 React Compiler 가 건너뛴다)
    async function send(): Promise<void> {
        // ④ 검사 → 상태 변경(큐) → 상세 다시(이 칸은 key 로 새로 — 고른 값 · 사유가 비워진다)
        const dto = Object.assign(new StoreStateDto(), {store_state_id: stateId, suspend_comment: suspending ? comment.trim() || undefined : undefined});
        if (busy || locked || !changed || !(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateStoreState(auth, store.store_id, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setConfirming(false);
        if (failure) {
            handleApiError(failure.error); // 같은 상태 — 400 "이미 같은 상태입니다."
            return;
        }

        onChanged();
    }

    async function submit(): Promise<void> {
        // ④ 탈퇴는 확인 대화상자 뒤, 그 밖은 바로
        if (stateId === STORE_STATE.LEAVE) {
            setConfirming(true);
            return;
        }

        await send();
    }

    return (
        // 업체 상태
        <Card title="업체 상태" actions={<Badge tone={STORE_STATE_TONE[store.store_state_id] ?? 'neutral'}>{lookupName('store_state_id', store.store_state_id)}</Badge>}>
            {/* ④ 바꿀 상태 */}
            <Field label="바꿀 상태" name="store_state_id" group>
                <div className={styles.radios}>
                    {STATE_OPTIONS.map((option) => (
                        <label key={option.value} className={styles.radio}>
                            <input type="radio" name="store-state" value={option.value} checked={stateId === option.value} disabled={locked} onChange={() => setStateId(option.value)} />
                            <span><strong>{lookupName('store_state_id', option.value)}</strong><span className={styles.muted}>{option.description}</span></span>
                        </label>
                    ))}
                </div>
            </Field>

            {/* ④ 정지 사유 — 영업중지만 */}
            <Field label="정지 사유" name="suspend_comment" htmlFor="store-suspend-comment" hint={`${comment.length} / ${SUSPEND_COMMENT_MAX}`}>
                <Textarea id="store-suspend-comment" rows={3} maxLength={SUSPEND_COMMENT_MAX} placeholder="영업중지를 고를 때만 남습니다." disabled={!suspending || locked} value={comment} onChange={(event) => setComment(event.target.value)} />
            </Field>
            <div className={styles.cardActions}><Button variant="primary" disabled={!changed || busy || locked} onClick={submit}>{busy ? '처리 중…' : '상태 변경'}</Button></div>

            {/* ④ 탈퇴 확인 */}
            <ConfirmModal open={confirming} title="업체를 탈퇴 처리할까요?" message={`${store.store_name} 업체를 탈퇴 처리합니다. 되돌릴 수 없고, 이 업체의 업체 관리자 계정이 모두 정지되며, 이용자 지도에서 빠집니다.`} confirmLabel="탈퇴 처리" danger busy={busy} onConfirm={send} onClose={() => setConfirming(false)} />
        </Card>
    );
}
