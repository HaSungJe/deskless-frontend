'use client';
import { useContext, useEffect, useState } from 'react';
import { updateStore } from '@/contracts/store/api';
import { StoreDetailResultDto } from '@/contracts/store/dto/store-detail.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { AddressWithCoordsType, preloadAddressSearch, searchAddressWithCoords } from '@/shared/utils/address';
import { digitsOnly } from '@/shared/utils/util';
import { validateAction } from '@/shared/utils/validation';
import { StoreFormType, storeFormOf, toStoreUpdateDto } from '../../store-format';
import styles from '@/app/css/admin/AdminDetail.module.css';

type StoreInfoCardProps = {
    store: StoreDetailResultDto; // 업체 상세 — 처음 칸 값
    locked: boolean;             // 탈퇴 — 잠금
    onSaved: () => void;         // 저장 뒤 상세 다시
};

/** 연락처 최대 자리 — StoreUpdateDto(8 ~ 11) */
const PHONE_MAX = 11;

/**
 * 업체 정보 — 상호명 · 사업자등록번호(읽기만) · 대표자 · 연락처 · 주소(주소 검색) · 상세주소 · 위도 · 경도 → 정보 수정(큐)
 *
 * @param param0
 * @returns
 */
export default function StoreInfoCard({store, locked, onSaved}: StoreInfoCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰

    // 상태
    const [form, setForm] = useState<StoreFormType>(() => storeFormOf(store)); // ① 칸 — 처음은 받은 값
    const [saving, setSaving] = useState<boolean>(false);                       // ③ 저장 중

    // 효과
    useEffect(() => {
        // ② 주소 검색 스크립트를 미리 — 버튼을 누른 직후 팝업을 열어야 브라우저가 막지 않는다
        preloadAddressSearch();
    }, []);

    // 함수
    function change(patch: Partial<StoreFormType>): void {
        // 칸 하나 바꾸기
        setForm((prev) => ({...prev, ...patch}));
    }

    async function searchAddress(): Promise<void> {
        // ② 주소 검색 — 고른 주소 · 좌표로 칸을 채운다(닫으면 그대로)
        let found: AddressWithCoordsType | null = null; // 고른 주소
        let failure: {error: unknown} | null = null;    // 스크립트를 못 불러옴 — 처리는 try 밖에서
        try {
            found = await searchAddressWithCoords();
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
            return;
        }

        const picked = found;
        if (picked) {
            change({address: picked.address, latitude: String(picked.latitude), longitude: String(picked.longitude)});
        }
    }

    async function save(): Promise<void> {
        // ③ 검사(틀린 칸 옆) → 정보 수정(큐) → 상세 다시
        const dto = toStoreUpdateDto(form);
        if (saving || locked || !(await validateAction(dto))) {
            return;
        }

        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateStore(auth, store.store_id, dto);
        } catch (error) {
            failure = {error};
        }

        setSaving(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        onSaved();
    }

    return (
        // 업체 정보
        <Card title="업체 정보">
            <p className={styles.muted}>상호명 · 대표자 · 연락처 · 주소 · 좌표를 고칩니다. 사업자등록번호는 바꾸지 않습니다.</p>

            {/* ①② 칸 */}
            <div className={styles.formGrid}>
                <Field label="상호명" name="store_name" htmlFor="store-name" required><Input id="store-name" maxLength={100} disabled={locked} value={form.store_name} onChange={(event) => change({store_name: event.target.value})} /></Field>
                <Field label="사업자등록번호" name="business_number" htmlFor="store-business" hint="사업자등록번호는 바꿀 수 없습니다."><Input id="store-business" readOnly value={store.business_number} /></Field>
                <Field label="대표자명" name="owner_name" htmlFor="store-owner" required><Input id="store-owner" maxLength={50} disabled={locked} value={form.owner_name} onChange={(event) => change({owner_name: event.target.value})} /></Field>
                <Field label="업체 연락처" name="phone" htmlFor="store-phone" hint="숫자만 8 ~ 11자리" required><Input id="store-phone" type="tel" inputMode="numeric" disabled={locked} value={form.phone} onChange={(event) => change({phone: digitsOnly(event.target.value, PHONE_MAX)})} /></Field>
                <Field label="주소" name="address" htmlFor="store-address" required>
                    <div className={styles.addressRow}><Input id="store-address" maxLength={255} disabled={locked} value={form.address} onChange={(event) => change({address: event.target.value})} /><Button disabled={locked} onClick={searchAddress}>주소 검색</Button></div>
                </Field>
                <Field label="상세주소" name="address_detail" htmlFor="store-address-detail" hint="비우고 저장하면 지워집니다."><Input id="store-address-detail" maxLength={255} disabled={locked} value={form.address_detail} onChange={(event) => change({address_detail: event.target.value})} /></Field>
                <Field label="위도" name="latitude" htmlFor="store-latitude" required><Input id="store-latitude" inputMode="decimal" disabled={locked} value={form.latitude} onChange={(event) => change({latitude: event.target.value})} /></Field>
                <Field label="경도" name="longitude" htmlFor="store-longitude" required><Input id="store-longitude" inputMode="decimal" disabled={locked} value={form.longitude} onChange={(event) => change({longitude: event.target.value})} /></Field>
            </div>

            {/* ③ 저장 */}
            <div className={styles.cardActions}><Button variant="primary" disabled={saving || locked} onClick={save}>{saving ? '처리 중…' : '정보 저장'}</Button></div>
        </Card>
    );
}
