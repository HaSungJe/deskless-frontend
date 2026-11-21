'use client';
import { useContext, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { updateMyStoreProfile } from '@/contracts/store/api';
import { StoreMineProfileDto } from '@/contracts/store/dto/store-mine-profile.dto';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import CopyButton from '@/shared/components/ui/button/CopyButton';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Textarea from '@/shared/components/ui/form/Textarea';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatBusinessNumber } from '@/shared/utils/format';
import { digitsOnly } from '@/shared/utils/util';
import { validateAction } from '@/shared/utils/validation';
import { storeConsoleLoginUrl } from '../../../manager-auth';
import { isStoreSuspended } from '../../manager-console-context';
import styles from '@/app/css/manager/StoreProfileTab.module.css';

type StoreProfileTabProps = {
    store: StoreMineResultDto;    // 내 업체 상세
    onSaved: () => Promise<void>; // 저장 뒤 다시 읽기
};

/** 업체 소개 최대 글자 수 — StoreMineProfileDto */
const INTRODUCTION_MAX = 2000;

/** 업체 연락처 최대 자리 — StoreMineProfileDto(8 ~ 11) */
const PHONE_MAX = 11;

/**
 * 기본 정보 탭 — 업체코드 · 로그인 주소 복사 · 상태 · 사업자 정보는 읽기만, 소개 · 연락처 저장
 *
 * @param param0
 * @returns
 */
export default function StoreProfileTab({store, onSaved}: StoreProfileTabProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                    // 매니저 토큰
    const loginUrl = storeConsoleLoginUrl(store.store_code); // ② 업체 로그인 주소

    // 상태
    const [introduction, setIntroduction] = useState<string>(store.introduction ?? ''); // 소개
    const [phone, setPhone] = useState<string>(store.phone);                            // 연락처(숫자만)
    const [saving, setSaving] = useState<boolean>(false);                               // 저장 중

    // 계산 값
    const suspended = isStoreSuspended(store); // 영업중지 — 상태 배지 색

    // 함수
    async function save(): Promise<void> {
        // ③ 소개(비우면 없앰) · 연락처 검사 → 저장(큐) → ④ 다시 읽기
        const dto = Object.assign(new StoreMineProfileDto(), {introduction: introduction.trim(), phone});
        if (saving || !(await validateAction(dto))) {
            return;
        }

        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateMyStoreProfile(auth, dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setSaving(false);
            handleApiError(failure.error);
            return;
        }

        await onSaved();
        setSaving(false);
    }

    return (
        // 기본 정보
        <div className={styles.cols}>
            {/* ② 업체 정보 — 읽기만 */}
            <Card title="업체 정보">
                <dl className={styles.dl}>
                    <dt>업체 로그인 주소</dt>
                    <dd>
                        <div className={styles.loginUrl}><CopyButton text={loginUrl} label="로그인 주소 복사" size="sm" /></div>
                        <p className={styles.hint}>업체 관리자에게 이 주소를 알려 주세요 — 업체 관리자 등록 문자에는 업체코드만 가고 로그인 주소는 가지 않습니다.</p>
                    </dd>
                    <dt>상태</dt><dd><Badge tone={suspended ? 'danger' : 'ok'}>{lookupName('store_state_id', store.store_state_id)}</Badge></dd>
                    <dt>상호명</dt><dd>{store.store_name}</dd>
                    <dt>사업자등록번호</dt><dd className={styles.mono}>{formatBusinessNumber(store.business_number)}</dd>
                    <dt>대표자명</dt><dd>{store.owner_name}</dd>
                    <dt>주소</dt><dd>{store.address}{store.address_detail ? <><br /><span className={styles.muted}>{store.address_detail}</span></> : null}</dd>
                    <dt>위치(위도 · 경도)</dt><dd className={styles.mono}>{store.latitude} · {store.longitude}</dd>
                </dl>
                <p className={styles.hint}>상호명 · 주소 · 위치 · 사업자 정보는 총관리자가 바꿉니다.</p>
            </Card>

            {/* ③ 소개 · 연락처 */}
            <Card title="소개 · 연락처">
                <Field label="업체 소개(선택)" name="introduction" htmlFor="store-introduction" hint={`${introduction.length.toLocaleString('ko-KR')} / ${INTRODUCTION_MAX.toLocaleString('ko-KR')}`}>
                    <Textarea id="store-introduction" rows={6} maxLength={INTRODUCTION_MAX} value={introduction} onChange={(event) => setIntroduction(event.target.value)} />
                </Field>
                <Field label="업체 연락처" name="phone" htmlFor="store-phone" hint="숫자만 8 ~ 11자리 — 이용자 화면 업체 상세에 보입니다.">
                    <Input id="store-phone" type="tel" inputMode="numeric" className={styles.phone} value={phone} onChange={(event) => setPhone(digitsOnly(event.target.value, PHONE_MAX))} />
                </Field>
                <div className={styles.actions}><Button variant="primary" disabled={saving} onClick={save}>{saving ? '처리 중…' : '저장'}</Button></div>
            </Card>
        </div>
    );
}
