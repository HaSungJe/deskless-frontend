'use client';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { getStoreDetail } from '@/contracts/discovery/api';
import { DiscoveryStoreSearchItemResultDto } from '@/contracts/discovery/dto/discovery-store-search.dto';
import { createInquiry, getInquiryCategories } from '@/contracts/inquiry/api';
import { InquiryCategoryItemResultDto } from '@/contracts/inquiry/dto/inquiry-category-list.dto';
import { InquiryDto, InquiryResultDto } from '@/contracts/inquiry/dto/inquiry.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import Button from '@/shared/components/ui/button/Button';
import Chip from '@/shared/components/ui/form/Chip';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Segmented, { SegmentedOptionType } from '@/shared/components/ui/form/Segmented';
import Textarea from '@/shared/components/ui/form/Textarea';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { SITE_NAME } from '@/shared/utils/site';
import { showValidationErrors, validateAction } from '@/shared/utils/validation';
import UserTopBar from '../../_components/UserTopBar';
import { INQUIRY_LIST_PATH, inquiryPath, storeItemOf } from '../inquiry-format';
import StorePicker from './_components/StorePicker';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/InquiryFormContent.module.css';

/** 문의 대상 — 바로방 · 업체 */
type TargetType = 'SITE' | 'STORE';

/** 입력 — 칸 이름이 DTO 필드 */
type InquiryFormType = {
    inquiry_category_id: string; // 고른 카테고리(비면 검증에 걸린다)
    title: string;               // 제목
    content: string;             // 내용
};

type InquiryFormContentProps = {
    storeId: string | null; // 업체 상세의 "이 업체에 문의" — ?store_id=
};

/** 대상 고르기 */
const TARGET_OPTIONS: Array<SegmentedOptionType<TargetType>> = [{value: 'SITE', label: `${SITE_NAME}에 문의`}, {value: 'STORE', label: '업체에 문의'}];

/** 빈 입력 */
const EMPTY_FORM: InquiryFormType = {inquiry_category_id: '', title: '', content: ''};

/** 제목 · 내용 최대 글자 수 — InquiryDto */
const TITLE_MAX = 100;
const CONTENT_MAX = 2000;

/** 동의 칸 이름 — 오류 span 의 data-id(DTO 필드가 아니다 — 서버로 보내지 않는다) */
const CONSENT_FIELD = 'agree';

/** 동의하지 않았을 때 */
const CONSENT_REQUIRED_MESSAGE = '개인정보 수집 · 이용에 동의해주세요.';

/** 동의 안내 — 보관 기간은 임시 문구(정책이 정해지면 문구만 바꾼다 — 사용자 결정 2026-11-24) */
const CONSENT_ITEMS: ReadonlyArray<[string, string]> = [
    ['수집 항목', '회원 정보(닉네임) · 문의 내용'],
    ['이용 목적', '문의 확인 · 답변'],
    ['보관 기간', '탈퇴 시까지'],
];

/**
 * 문의하기 — 대상(바로방 · 업체 검색) · 카테고리 · 제목 · 내용 · 동의 → 등록(큐) → 상세
 * - 검사는 DTO(칸 오류를 지우고 그린다) → 동의(지우지 않고 더한다) 순서 — 반대면 동의 문구가 지워진다
 *
 * @param param0
 * @returns
 */
export default function InquiryFormContent({storeId}: InquiryFormContentProps): React.ReactNode {
    // 변수
    const router = useRouter();           // 등록 뒤 상세 · 목록
    const auth = useContext(AuthContext); // 이용자 토큰

    // 상태
    const [target, setTarget] = useState<TargetType>(storeId ? 'STORE' : 'SITE');          // ② 대상
    const [store, setStore] = useState<DiscoveryStoreSearchItemResultDto | null>(null);     // ② 고른 업체
    const [categories, setCategories] = useState<Array<InquiryCategoryItemResultDto>>([]); // ③ 카테고리 칩
    const [form, setForm] = useState<InquiryFormType>(EMPTY_FORM);                          // ③ 입력
    const [agreed, setAgreed] = useState<boolean>(false);                                   // ③ 동의 체크
    const [consentOpen, setConsentOpen] = useState<boolean>(false);                         // ③ 동의 안내 펼침
    const [submitting, setSubmitting] = useState<boolean>(false);                           // ⑤ 등록 중 — 이동할 때까지 막아 둔다

    // 계산 값
    const storeMissing = target === 'STORE' && store === null; // 업체를 아직 고르지 않음 — 등록 버튼 끔

    // 효과
    useEffect(() => {
        // ③ 카테고리 — 한 번(떠나면 결과를 버린다)
        const controller = new AbortController();
        getInquiryCategories(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setCategories(next?.list ?? []);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        // ① 업체 상세에서 왔으면 그 업체를 골라 둔다(못 읽으면 받은 문구 · 고르기 전 상태)
        if (!storeId) {
            return;
        }

        const controller = new AbortController();
        getStoreDetail(storeId, controller.signal).then((detail) => {
            if (!controller.signal.aborted && detail) {
                setStore(storeItemOf(detail));
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [storeId]);

    // 함수
    function change(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        // ③ 칸 이름(DTO 필드)으로
        const {name, value} = event.target;
        setForm((prev) => ({...prev, [name]: value}));
    }

    async function submit(): Promise<void> {
        // ④ 검사 — DTO(칸 옆, 먼저 지우고 그린다) → 동의(지우지 않고 더한다)
        if (submitting || storeMissing) {
            return;
        }

        const dto = Object.assign(new InquiryDto(), {
            store_id: target === 'STORE' ? store?.store_id : undefined, // 바로방이면 보내지 않는다(undefined 는 JSON 에서 빠진다)
            inquiry_category_id: form.inquiry_category_id,
            title: form.title.trim(),                                   // 공백뿐이면 비어 있음으로 걸린다
            content: form.content.trim(),
        });
        const valid = await validateAction(dto);
        if (!agreed) {
            showValidationErrors([{property: CONSENT_FIELD, message: CONSENT_REQUIRED_MESSAGE}]);
        }

        if (!valid || !agreed) {
            return;
        }

        // ⑤ 등록(큐) — 동의 값은 보내지 않는다
        setSubmitting(true);
        let result: InquiryResultDto | null = null;  // 등록 결과
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            result = await createInquiry(auth, dto);
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
            router.replace(INQUIRY_LIST_PATH);
            return;
        }

        router.replace(inquiryPath(result.inquiry_id));
    }

    return (
        // 문의하기
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="문의하기" parents={[{label: '내 정보', href: '/me/'}, {label: '문의', href: INQUIRY_LIST_PATH}]} />

            <div className={styles.body}>
                {/* ② 대상 — 바로방 · 업체(검색 · 지도) */}
                <section className={styles.section} aria-labelledby="inquiry-target-title">
                    <h2 id="inquiry-target-title" className={styles.sectionTitle}>문의 대상</h2>
                    <Segmented label="문의 대상" options={TARGET_OPTIONS} value={target} onChange={setTarget} />
                    {target === 'STORE' ? <StorePicker value={store} onPick={setStore} /> : null}
                </section>

                {/* ③ 카테고리 · 제목 · 내용 */}
                <section className={styles.section} aria-labelledby="inquiry-content-title">
                    <h2 id="inquiry-content-title" className={styles.sectionTitle}>문의 내용</h2>
                    <Field label="카테고리" name="inquiry_category_id" group required>
                        <div className={styles.chips}>
                            {categories.map((item) => <Chip key={item.inquiry_category_id} pressed={form.inquiry_category_id === item.inquiry_category_id} onClick={() => setForm((prev) => ({...prev, inquiry_category_id: item.inquiry_category_id}))}>{item.inquiry_category_name}</Chip>)}
                        </div>
                    </Field>
                    <Field label="제목" name="title" htmlFor="inquiry-title" required hint={<span>{form.title.length} / {TITLE_MAX}</span>}>
                        <Input id="inquiry-title" name="title" maxLength={TITLE_MAX} value={form.title} onChange={change} />
                    </Field>
                    <Field label="내용" name="content" htmlFor="inquiry-content" required hint={<span>{form.content.length} / {CONTENT_MAX}</span>}>
                        <Textarea id="inquiry-content" name="content" rows={8} maxLength={CONTENT_MAX} value={form.content} onChange={change} />
                    </Field>
                </section>

                {/* ③ 동의 — 화면에서만 확인(서버로 보내지 않는다) */}
                <section className={styles.section} aria-labelledby="inquiry-consent-title">
                    <h2 id="inquiry-consent-title" className={styles.sectionTitle}>개인정보 수집 · 이용 동의</h2>
                    <Field label="필수 동의" name={CONSENT_FIELD} group required>
                        <div className={styles.consent}>
                            <label className={styles.check}><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />개인정보 수집 · 이용에 동의합니다</label>
                            <button type="button" className={styles.consentToggle} aria-expanded={consentOpen} onClick={() => setConsentOpen((open) => !open)}>{consentOpen ? '닫기' : '내용 보기'}</button>
                        </div>
                        {consentOpen ? (
                            <dl className={styles.consentItems}>
                                {CONSENT_ITEMS.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                            </dl>
                        ) : null}
                    </Field>
                </section>
            </div>

            {/* ④⑤ 등록 — 업체를 고르지 않았으면 꺼 둔다 */}
            <div className={pageStyles.footer}>
                <Button variant="primary" size="lg" full disabled={submitting || storeMissing} onClick={submit}>문의 등록</Button>
            </div>
        </div>
    );
}
