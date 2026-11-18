'use client';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { createStoreApplication } from '@/contracts/store/api';
import { StoreApplicationDto, StoreApplicationResultDto } from '@/contracts/store/dto/store-application.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Textarea from '@/shared/components/ui/form/Textarea';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { AddressWithCoordsType, preloadAddressSearch, searchAddressWithCoords } from '@/shared/utils/address';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { digitsOnly } from '@/shared/utils/util';
import { validateAction } from '@/shared/utils/validation';
import UserTopBar from '../../_components/UserTopBar';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/StoreApplicationFormContent.module.css';

/** 입력 — 칸 이름이 DTO 필드 */
type ApplicationFormType = {
    store_name: string;            // 상호명
    business_number: string;       // 사업자등록번호(숫자)
    phone: string;                 // 업체 연락처(숫자)
    address: string;               // 주소 검색으로 고른 주소
    address_detail: string;        // 상세 주소
    latitude: number | null;       // 위도 — 주소 검색이 채운다
    longitude: number | null;      // 경도
    owner_name: string;            // 대표자명
    owner_phone: string;           // 대표자 휴대폰(숫자)
    head_manager_login_id: string; // 업체 총관리자 아이디
    head_manager_login_pw: string; // 업체 총관리자 비밀번호
    application_comment: string;   // 남길 말
};

/** 빈 입력 */
const EMPTY_FORM: ApplicationFormType = {store_name: '', business_number: '', phone: '', address: '', address_detail: '', latitude: null, longitude: null, owner_name: '', owner_phone: '', head_manager_login_id: '', head_manager_login_pw: '', application_comment: ''};

/** 숫자만 받는 칸 → 자릿수(DTO) */
const DIGIT_FIELDS = new Map<string, number>([['business_number', 10], ['phone', 11], ['owner_phone', 11]]);

/** 남길 말 최대 글자 수 — StoreApplicationDto */
const COMMENT_MAX = 500;

/** 신청 목록 — 늦어지면 여기로 */
const LIST_PATH = '/store-applications/';

/**
 * U11 입점 신청 작성 — 업체 정보 · 대표자 · 총관리자 계정 · 남길 말 → 신청(큐) → 상세
 *
 * @returns
 */
export default function StoreApplicationFormContent(): React.ReactNode {
    // 변수
    const router = useRouter();            // 신청 뒤 상세 · 목록
    const auth = useContext(AuthContext);  // 이용자 토큰

    // 상태
    const [form, setForm] = useState<ApplicationFormType>(EMPTY_FORM); // 입력
    const [submitting, setSubmitting] = useState<boolean>(false);       // 신청 중 — 이동할 때까지 막아 둔다

    // 효과
    useEffect(() => {
        // 주소 검색 스크립트를 미리 — 버튼을 누른 직후 팝업을 열어야 브라우저가 막지 않는다
        preloadAddressSearch();
    }, []);

    // 함수
    function change(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        // ① 칸 이름(DTO 필드)으로 — 번호 칸은 숫자만, 남길 말은 500자까지
        const {name, value} = event.target;
        const max = DIGIT_FIELDS.get(name);
        const next = max === undefined ? value : digitsOnly(value, max);
        setForm((prev) => ({...prev, [name]: name === 'application_comment' ? next.slice(0, COMMENT_MAX) : next}));
    }

    async function searchAddress(): Promise<void> {
        // ② 주소 검색 — 고른 주소와 좌표를 함께(고르지 않고 닫으면 그대로)
        let found: AddressWithCoordsType | null;
        try {
            found = await searchAddressWithCoords();
        } catch (error) {
            handleApiError(error);
            return;
        }

        const picked = found;
        if (picked) {
            setForm((prev) => ({...prev, address: picked.address, latitude: picked.latitude, longitude: picked.longitude}));
        }
    }

    async function submit(): Promise<void> {
        // ③ 신청 — DTO 검증(틀린 칸 옆) → 큐 → ④ 상세로(사업자등록증 올리기), 늦어지면 목록
        const dto = Object.assign(new StoreApplicationDto(), {
            ...form,
            store_name: form.store_name.trim(),                       // 공백뿐이면 비어 있음으로 걸린다
            owner_name: form.owner_name.trim(),
            head_manager_login_id: form.head_manager_login_id.trim(),
            address_detail: form.address_detail.trim() || undefined,
            application_comment: form.application_comment.trim() || undefined,
            latitude: form.latitude ?? undefined,
            longitude: form.longitude ?? undefined,
        });
        if (submitting || !(await validateAction(dto))) {
            return;
        }

        setSubmitting(true);
        let result: StoreApplicationResultDto | null = null; // 신청 결과
        let failure: {error: unknown} | null = null;         // 실패 — 처리는 try 밖에서
        try {
            result = await createStoreApplication(auth, dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setSubmitting(false);
            handleApiError(failure.error);
            return;
        }

        if (!result) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
            router.replace(LIST_PATH);
            return;
        }

        router.replace(`${LIST_PATH}${encodeURIComponent(result.store_application_id)}/`);
    }

    return (
        // 입점 신청 작성
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="입점 신청 작성" backHref={LIST_PATH} />

            <div className={styles.body}>
                {/* 안내 */}
                <Band tone="info">승인되면 업체코드와 여기서 정한 아이디 · 비밀번호로 업체 콘솔에 로그인해요.</Band>

                {/* ① 업체 정보 */}
                <section className={styles.section} aria-labelledby="apply-store-title">
                    <h2 id="apply-store-title" className={styles.sectionTitle}>업체 정보</h2>
                    <Field label="상호명" name="store_name" htmlFor="apply-store-name" required>
                        <Input id="apply-store-name" name="store_name" maxLength={100} value={form.store_name} onChange={change} />
                    </Field>
                    <Field label="사업자등록번호" name="business_number" htmlFor="apply-business-number" required hint="숫자 10자리">
                        <Input id="apply-business-number" name="business_number" inputMode="numeric" value={form.business_number} onChange={change} />
                    </Field>
                    <Field label="업체 연락처" name="phone" htmlFor="apply-phone" required>
                        <Input id="apply-phone" name="phone" type="tel" inputMode="numeric" value={form.phone} onChange={change} />
                    </Field>
                    {/* ② 주소 — 주소 검색으로만 */}
                    <Field label="주소" name="address" htmlFor="apply-address" required hint="주소 검색으로 고르면 지도 위치(위도 · 경도)도 함께 저장돼요.">
                        <div className={styles.addressRow}>
                            <Input id="apply-address" name="address" readOnly className={styles.readonly} value={form.address} placeholder="주소 검색을 눌러 고르세요" />
                            <Button onClick={searchAddress}>주소 검색</Button>
                        </div>
                    </Field>
                    <Field label="상세 주소" name="address_detail" htmlFor="apply-address-detail">
                        <Input id="apply-address-detail" name="address_detail" maxLength={255} value={form.address_detail} onChange={change} />
                    </Field>
                </section>

                {/* ① 대표자 · 업체 총관리자 계정 */}
                <section className={styles.section} aria-labelledby="apply-owner-title">
                    <h2 id="apply-owner-title" className={styles.sectionTitle}>대표자 · 업체 총관리자 계정</h2>
                    <Field label="대표자명" name="owner_name" htmlFor="apply-owner-name" required>
                        <Input id="apply-owner-name" name="owner_name" maxLength={50} value={form.owner_name} onChange={change} />
                    </Field>
                    <Field label="대표자 휴대폰 번호" name="owner_phone" htmlFor="apply-owner-phone" required>
                        <Input id="apply-owner-phone" name="owner_phone" type="tel" inputMode="numeric" value={form.owner_phone} onChange={change} />
                    </Field>
                    <Field label="업체 총관리자 아이디" name="head_manager_login_id" htmlFor="apply-login-id" required hint="영문 · 숫자 · _ 4~30자">
                        <Input id="apply-login-id" name="head_manager_login_id" autoComplete="off" maxLength={30} value={form.head_manager_login_id} onChange={change} />
                    </Field>
                    <Field label="비밀번호" name="head_manager_login_pw" htmlFor="apply-login-pw" required hint="8~20자, 영문과 숫자를 꼭 넣어요. 특수문자는 !@#$%^&* 만 쓸 수 있어요.">
                        <Input id="apply-login-pw" name="head_manager_login_pw" type="password" autoComplete="new-password" maxLength={20} value={form.head_manager_login_pw} onChange={change} />
                    </Field>
                </section>

                {/* ① 남길 말 */}
                <section className={styles.section} aria-labelledby="apply-comment-title">
                    <h2 id="apply-comment-title" className={styles.sectionTitle}>남길 말<span className={styles.optional}>선택</span></h2>
                    <Field label="관리자에게 남길 말" name="application_comment" htmlFor="apply-comment" hint={<span className={styles.count}>{form.application_comment.length}/{COMMENT_MAX}</span>}>
                        <Textarea id="apply-comment" name="application_comment" rows={3} maxLength={COMMENT_MAX} value={form.application_comment} onChange={change} />
                    </Field>
                </section>

                {/* 사업자등록증 안내 */}
                <p className={styles.note}>신청 뒤 사업자등록증 사진을 꼭 올려 주세요. 사진이 없으면 승인할 수 없어요.</p>
            </div>

            {/* ③ 신청하기 */}
            <div className={pageStyles.footer}>
                <Button variant="primary" size="lg" full disabled={submitting} onClick={submit}>신청하기</Button>
            </div>
        </div>
    );
}
