'use client';
import { useContext, useState } from 'react';
import { updateMyDoorSecret } from '@/contracts/store/api';
import { StoreMineDoorSecretDto } from '@/contracts/store/dto/store-mine-door-secret.dto';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { validateAction } from '@/shared/utils/validation';
import styles from '@/app/css/manager/StoreDoorTab.module.css';

type StoreDoorTabProps = {
    store: StoreMineResultDto;    // 내 업체 상세 — is_door_secret_set · store_id
    onSaved: () => Promise<void>; // 저장 뒤 다시 읽기
};

/** 시크릿을 바꾼 뒤 — 시안 문구 */
const DOOR_SECRET_CHANGED_MESSAGE = '시크릿을 바꿨습니다. 문 쪽 프로그램에 새 시크릿을 넣어 다시 연결해주세요.';

/**
 * 문 연동 탭 — 업체 총관리자만(탭은 머리가 숨긴다). 설정 여부 · 업체 ID, 새 시크릿(원문은 다시 볼 수 없다)
 *
 * @param param0
 * @returns
 */
export default function StoreDoorTab({store, onSaved}: StoreDoorTabProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [secret, setSecret] = useState<string>('');     // 새 시크릿
    const [saving, setSaving] = useState<boolean>(false); // 저장 중

    // 계산 값
    const isSet = store.is_door_secret_set === 1; // ② 설정함

    // 함수
    async function save(): Promise<void> {
        // ④ 검사 → 시크릿 저장(큐) → 칸 비움 · 안내 → 다시 읽기
        const dto = Object.assign(new StoreMineDoorSecretDto(), {door_secret: secret.trim()});
        if (saving || !(await validateAction(dto))) {
            return;
        }

        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateMyDoorSecret(auth, dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setSaving(false);
            handleApiError(failure.error);
            return;
        }

        setSecret('');
        showErrorPopup(DOOR_SECRET_CHANGED_MESSAGE);
        await onSaved();
        setSaving(false);
    }

    return (
        // 문 연동
        <div className={styles.cols}>
            {/* ② 연결 */}
            <Card title="문 쪽 프로그램 연결">
                <dl className={styles.dl}>
                    <dt>시크릿</dt><dd><Badge tone={isSet ? 'ok' : 'neutral'}>{isSet ? '설정함' : '설정 안 함'}</Badge></dd>
                    <dt>업체 ID</dt><dd className={styles.mono}>{store.store_id}</dd>
                </dl>
                <p className={styles.hint}>{isSet ? '문 쪽 프로그램은 업체 ID 와 시크릿으로 접속합니다. 시크릿 원문은 다시 볼 수 없습니다 — 잊었으면 새로 정해 문 쪽 프로그램에도 넣어 주세요.' : '시크릿을 정해야 문 쪽 프로그램이 접속할 수 있습니다.'}</p>
            </Card>

            {/* ③④ 새 시크릿 */}
            <Card title="새 시크릿">
                <Band tone="warn">시크릿을 바꾸면 지금 연결된 문 쪽 프로그램이 끊깁니다. 새 시크릿으로 다시 연결하기 전까지 QR 로 문을 열 수 없습니다.</Band>
                <Field label="시크릿" name="door_secret" htmlFor="store-door-secret" hint="영문 · 숫자 16 ~ 64자">
                    <Input id="store-door-secret" autoComplete="off" spellCheck={false} value={secret} onChange={(event) => setSecret(event.target.value)} />
                </Field>
                <div className={styles.actions}><Button variant="primary" disabled={saving} onClick={save}>{saving ? '처리 중…' : isSet ? '시크릿 바꾸기' : '시크릿 정하기'}</Button></div>
            </Card>
        </div>
    );
}
