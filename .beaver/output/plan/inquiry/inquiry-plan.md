# Plan — 문의 — 이용자 문의와 업체 · 관리자 답변

> 무엇을·왜는 [spec](../../spec/inquiry/inquiry-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 진입점마다 비즈니스 로직 전체 ② 계산 함수 ③ 규약만으로 예측할 수 없는 데이터 규칙
> **싣지 않는 것** page 껍데기, DTO 사본, 형제와 같은 contracts 함수 · 메뉴 줄 — 따르는 패턴을 표 한 줄로 가리킨다

백엔드 수정 요청 `frontend/changes/2026-11-24-inquiry.md` 를 이 plan 하나로 만든다(로드맵 밖 — Phase 18 이라 부른다). 이용자 화면은 입점 신청(`src/app/(user)/store-applications/`) · 내 예약 칩(`reservation/MyReservationContent.tsx`), 콘솔 화면은 관리자 이용자 목록 · 상세(`src/app/admin/(console)/users/`)와 같은 모양이다. 업체 관리자 · 관리자 화면은 한 벌(`src/app/_console/inquiries/`)을 두 영역이 같이 쓴다(사용자 결정).

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/contracts/discovery/dto/discovery-store-search.dto.ts` · `src/contracts/inquiry/inquiry.constants.ts` · `src/contracts/inquiry/dto/inquiry-category-list` · `inquiry` · `inquiry-list` · `inquiry-detail` · `inquiry-manage-list` · `inquiry-manage-detail` · `inquiry-answer` · `inquiry-blind` · `inquiry-unblind.dto.ts` | 신규 | 요청서 DTO 사본 11개 | 생략 (아래 4) |
| `src/contracts/discovery/api.ts` | 수정 | `searchStores` — 업체 이름 검색(로그인 없음) | 생략 (아래 4) |
| `src/contracts/inquiry/api.ts` | 신규 | 문의 API 14개(카테고리 1 · 이용자 3 · 업체 관리자 `/mine` 5 · 관리자 5) | 생략 (아래 4) |
| `src/contracts/inquiry/inquiry-state.ts` | 신규 | 상태 칩 순서 · 상태 배지 색(이용자 · 콘솔 함께) | 아래 3-1 |
| `src/contracts/common/lookup.ts` | 수정 | `inquiry_state_id` 이름(칩이 목록보다 먼저 그린다) | 아래 3-1 |
| `src/shared/components/console/ListFilter.tsx` · `FilterChips.tsx` · `FilterSelect.tsx` · `src/shared/css/console/ListFilter.module.css` | 이동 | 관리자 `_components` 에서 — 업체 관리자 문의 목록도 쓴다 | 아래 3-2 |
| `src/app/admin/(console)/_components/ListFilter.tsx` · `FilterChips.tsx` · `FilterSelect.tsx` · `src/app/css/admin/ListFilter.module.css` | 삭제 | 옮긴 원본 | 아래 3-2 |
| `src/app/admin/(console)/store-applications/AdminApplicationListContent.tsx` · `stores/AdminStoreListContent.tsx` · `managers/AdminManagerListContent.tsx` · `users/AdminUserListContent.tsx` | 수정 | 옮긴 거르기 부품 import | 아래 3-2 |
| `src/app/(user)/inquiries/page.tsx` · `InquiryListContent.tsx` | 신규 | 내 문의 목록 | 아래 1-1 |
| `src/app/(user)/inquiries/inquiry-format.ts` | 신규 | 주소 · 문의 대상 이름 · 업체 상세 → 고른 업체 | 아래 2-2 · 3-3 |
| `src/app/(user)/inquiries/new/page.tsx` · `InquiryFormContent.tsx` · `_components/StorePicker.tsx` · `_components/StoreMapModal.tsx` | 신규 | 문의하기 · 업체 고르기 · 지도 팝업 | 아래 1-2 |
| `src/app/(user)/inquiries/[inquiry_id]/page.tsx` · `InquiryDetailContent.tsx` | 신규 | 내 문의 상세 | 아래 1-3 |
| `src/app/(user)/me/MyPageContent.tsx` | 수정 | 메뉴에 "문의" 줄 | 아래 3-4 |
| `src/app/(user)/stores/[store_id]/StoreDetailContent.tsx` | 수정 | "이 업체에 문의" 링크 | 아래 3-4 |
| `src/app/_console/inquiries/inquiry-manage.ts` | 신규 | 영역별 API · 주소 · 안내 · 상세에서 할 수 있는 일 | 아래 2-1 · 3-5 |
| `src/app/_console/inquiries/InquiryManageList.tsx` · `InquiryManageDetail.tsx` | 신규 | 문의 관리 목록 · 상세(두 영역이 같이) | 아래 1-4 · 1-5 |
| `src/app/manager/(console)/inquiries/page.tsx` · `ManagerInquiryListContent.tsx` · `[inquiry_id]/page.tsx` · `ManagerInquiryDetailContent.tsx` | 신규 | 업체 관리자 — 한 벌에 `scope="manager"` | 생략 (아래 4) |
| `src/app/admin/(console)/inquiries/page.tsx` · `AdminInquiryListContent.tsx` · `[inquiry_id]/page.tsx` · `AdminInquiryDetailContent.tsx` | 신규 | 관리자 — 한 벌에 `scope="admin"` | 생략 (아래 4) |
| `src/app/manager/(console)/manager-menu.tsx` · `src/app/admin/(console)/admin-menu.tsx` · `admin-paths.ts` | 수정 | 메뉴 "문의" · 관리자 문의 주소 | 생략 (아래 4) |
| `src/app/css/user/InquiryListContent.module.css` · `InquiryFormContent.module.css` · `StorePicker.module.css` · `InquiryDetailContent.module.css` · `src/app/css/console/InquiryManageList.module.css` · `InquiryManageDetail.module.css` | 신규 | 화면 스타일(시안 없음 — 형제 값) | 아래 5 |
| 테스트 7파일 + 픽스처 | 신규 | spec 19건 | 아래 테스트 |
| `AGENTS.md` · `docs/architecture.md` · `docs/conventions.md` · `docs/data-layer.md` | 수정 | 문의 화면 · 콘솔 공통 화면 폴더 · 거르기 부품 위치 · 반영한 수정 요청 | 만드는 순서 9 |

---

## 1. 비즈니스 로직 — 화면별 코드

### 1-1. 내 문의 목록 — `InquiryListContent`

카테고리는 목록과 따로 한 번만 읽는다(칩이 바뀌어도 다시 읽지 않는다). 칩 두 줄은 같은 `query` 를 바꿔 1쪽부터 다시 읽는다.

```tsx
// src/app/(user)/inquiries/InquiryListContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { getInquiryCategories, getMyInquiries } from '@/contracts/inquiry/api';
import { InquiryCategoryItemResultDto } from '@/contracts/inquiry/dto/inquiry-category-list.dto';
import { InquiryListDto, InquiryListItemResultDto } from '@/contracts/inquiry/dto/inquiry-list.dto';
import { INQUIRY_STATE_FILTERS, inquiryStateTone } from '@/contracts/inquiry/inquiry-state';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Chip from '@/shared/components/ui/form/Chip';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { PaginationType } from '@/shared/types/pagination';
import { formatKoreanDate } from '@/shared/utils/format';
import UserTopBar from '../_components/UserTopBar';
import { INQUIRY_NEW_PATH, inquiryPath, inquiryTargetName } from './inquiry-format';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/InquiryListContent.module.css';

/** 한 쪽 문의 수 */
const PAGE_SIZE = 20;

/** 목록 거르기 · 쪽 */
type InquiryQueryType = {
    category: string | null; // 카테고리 칩(null 이 전체)
    state: string | null;    // 상태 칩(null 이 전체)
    page: number;            // 보는 쪽
};

/** 받은 한 쪽 — 응답에 data 가 없으면 빈 목록 */
type InquiryPageType = {
    list: Array<InquiryListItemResultDto>; // 문의(최신순)
    pagination: PaginationType | null;     // 페이지
};

/** 처음 거르기 — 전체 · 1쪽 */
const FIRST_QUERY: InquiryQueryType = {category: null, state: null, page: 1};

/**
 * 내 문의 목록 — 문의하기 · 카테고리 · 상태 칩 · 카드(번호 없음) · 페이지
 *
 * @returns
 */
export default function InquiryListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 이용자 토큰
    const loadPage = useEffectEvent((query: InquiryQueryType, signal: AbortSignal) => getMyInquiries(auth, new InquiryListDto({page: query.page, size: PAGE_SIZE, inquiry_category_id: query.category, inquiry_state_id: query.state}), signal)); // 그때의 auth 로

    // 상태
    const [query, setQuery] = useState<InquiryQueryType>(FIRST_QUERY);                   // ③④ 칩 · 쪽
    const [categories, setCategories] = useState<Array<InquiryCategoryItemResultDto>>([]); // ② 카테고리 칩
    const [result, setResult] = useState<InquiryPageType | null>(null);                  // ② 목록 — 불러오기 전 null

    // 계산 값
    const inquiries = result?.list ?? [];                               // 문의
    const filtered = query.category !== null || query.state !== null;   // 거른 뒤 — 빈 안내 문구

    // 효과
    useEffect(() => {
        // ② 카테고리 — 한 번(떠나면 결과를 버린다)
        const controller = new AbortController();
        getInquiryCategories(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setCategories(next?.list ?? []);
            }
        }).catch((error: unknown) => handleApiError(error));

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        // ②③④ 그 칩 · 쪽 목록(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadPage(query, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult({list: next?.list ?? [], pagination: next?.pagination ?? null});
            }
        }).catch((error: unknown) => handleApiError(error));

        return () => {
            controller.abort();
        };
    }, [query]);

    return (
        // 내 문의 목록
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="문의" parents={[{label: '내 정보', href: '/me/'}]} />

            <div className={pageStyles.body}>
                {/* ⑤ 문의하기 */}
                <Link href={INQUIRY_NEW_PATH} className={buttonClass({variant: 'primary', full: true})}>문의하기</Link>

                {/* ③ 카테고리 · 상태 칩 — 전체는 값을 빼고 부른다 */}
                <div role="group" aria-label="카테고리" className={styles.chips}>
                    <Chip pressed={query.category === null} onClick={() => setQuery((prev) => ({...prev, category: null, page: 1}))}>전체</Chip>
                    {categories.map((item) => <Chip key={item.inquiry_category_id} pressed={query.category === item.inquiry_category_id} onClick={() => setQuery((prev) => ({...prev, category: item.inquiry_category_id, page: 1}))}>{item.inquiry_category_name}</Chip>)}
                </div>
                <div role="group" aria-label="문의 상태" className={styles.chips}>
                    {INQUIRY_STATE_FILTERS.map((value) => <Chip key={value ?? 'ALL'} pressed={query.state === value} onClick={() => setQuery((prev) => ({...prev, state: value, page: 1}))}>{value ? lookupName('inquiry_state_id', value) : '전체'}</Chip>)}
                </div>

                {/* ② 빈 목록 · 카드 */}
                {result && inquiries.length === 0 ? (filtered
                    ? <EmptyState title="조건에 맞는 문의가 없어요" description="다른 조건을 골라 보세요." />
                    : <EmptyState title="아직 문의가 없어요" description="위의 문의하기로 시작해요." />) : null}
                {inquiries.map((item) => (
                    <Link key={item.inquiry_id} href={inquiryPath(item.inquiry_id)} className={styles.card}>
                        <div className={styles.head}><strong className={styles.title}>{item.title}</strong><Badge tone={inquiryStateTone(item.inquiry_state_id)}>{item.inquiry_state_name}</Badge></div>
                        <span className={styles.meta}>{item.inquiry_category_name} · {inquiryTargetName(item.store_name)}</span>
                        <span className={styles.date}>문의 {formatKoreanDate(item.created_at)}{item.answered_at ? ` · 답변 ${formatKoreanDate(item.answered_at)}` : ''}</span>
                    </Link>
                ))}

                {/* ④ 페이지 — 항상 아래쪽 */}
                <div className={pageStyles.pager}><Pagination pagination={result?.pagination ?? null} movePage={(next) => setQuery((prev) => ({...prev, page: Number(next)}))} label="문의 페이지" /></div>
            </div>
        </div>
    );
}
```

### 1-2. 문의하기 — `InquiryFormContent` · `StorePicker` · `StoreMapModal`

검사 순서가 중요하다 — `validateAction(dto)` 가 먼저 칸 오류를 모두 지우고 DTO 오류를 그린 뒤, 동의 오류를 `showValidationErrors` 로 **지우지 않고 더한다**(반대로 하면 동의 문구가 지워진다). 동의 값은 DTO 에 없어 서버로 가지 않는다(보내면 400). 고른 업체 ID 는 "업체에 문의"일 때만 넣고, `undefined` 는 JSON 에서 빠진다.

```tsx
// src/app/(user)/inquiries/new/InquiryFormContent.tsx
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
        }).catch((error: unknown) => handleApiError(error));

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
            store_id: target === 'STORE' ? store?.store_id : undefined, // 바로방이면 보내지 않는다
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

                {/* ③ 동의 — 화면에서만 확인 */}
                <section className={styles.section} aria-labelledby="inquiry-consent-title">
                    <h2 id="inquiry-consent-title" className={styles.sectionTitle}>개인정보 수집 · 이용 동의</h2>
                    <Field label="개인정보 수집 · 이용 동의" name={CONSENT_FIELD} htmlFor="inquiry-agree" required>
                        <div className={styles.consent}>
                            <label className={styles.check}><input id="inquiry-agree" type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />개인정보 수집 · 이용에 동의합니다(필수)</label>
                            <button type="button" className={styles.consentToggle} aria-expanded={consentOpen} onClick={() => setConsentOpen((open) => !open)}>{consentOpen ? '닫기' : '내용 보기'}</button>
                        </div>
                    </Field>
                    {consentOpen ? (
                        <dl className={styles.consentItems}>
                            {CONSENT_ITEMS.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                        </dl>
                    ) : null}
                </section>
            </div>

            {/* ④⑤ 등록 — 업체를 고르지 않았으면 꺼 둔다 */}
            <div className={pageStyles.footer}>
                <Button variant="primary" size="lg" full disabled={submitting || storeMissing} onClick={submit}>문의 등록</Button>
            </div>
        </div>
    );
}
```

`StorePicker` — 검색은 버튼 · Enter(폼 제출)로만 부른다. 결과 줄의 버튼은 검색 폼 **밖**에 둔다(폼 안이면 `type` 없는 버튼이 다시 검색을 제출한다).

```tsx
// src/app/(user)/inquiries/new/_components/StorePicker.tsx
'use client';
import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { searchStores } from '@/contracts/discovery/api';
import { DiscoveryStoreSearchDto, DiscoveryStoreSearchItemResultDto, DiscoveryStoreSearchResultDto } from '@/contracts/discovery/dto/discovery-store-search.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { validateAction } from '@/shared/utils/validation';
import StoreMapModal from './StoreMapModal';
import styles from '@/app/css/user/StorePicker.module.css';

type StorePickerProps = {
    value: DiscoveryStoreSearchItemResultDto | null;                   // 고른 업체
    onPick: (store: DiscoveryStoreSearchItemResultDto | null) => void; // 고름 · 다시 고르기(null)
};

/** 검색어 최대 글자 수 — DiscoveryStoreSearchDto */
const KEYWORD_MAX = 50;

/** 사진 없음 — 홈 업체 카드와 같은 그림 */
const PHOTO_ICON = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" /></svg>;

/**
 * 업체 고르기 — 이름 검색 → 결과(사진 · 상호명 · 주소 · 지도 · 고르기), 고른 뒤에는 그 업체 · 다시 고르기
 *
 * @param param0
 * @returns
 */
export default function StorePicker({value, onPick}: StorePickerProps): React.ReactNode {
    // 상태
    const [keyword, setKeyword] = useState<string>('');                                             // 검색 칸
    const [results, setResults] = useState<Array<DiscoveryStoreSearchItemResultDto> | null>(null); // 검색 결과 — 검색 전 null
    const [searching, setSearching] = useState<boolean>(false);                                     // 검색 중
    const [mapStore, setMapStore] = useState<DiscoveryStoreSearchItemResultDto | null>(null);       // 지도 팝업의 업체

    // 함수
    async function search(event: FormEvent<HTMLFormElement>): Promise<void> {
        // ② 검색 — 검색어 검사(칸 옆) 뒤 부른다
        event.preventDefault();
        const dto = new DiscoveryStoreSearchDto({keyword: keyword.trim()});
        if (searching || !(await validateAction(dto))) {
            return;
        }

        setSearching(true);
        let found: DiscoveryStoreSearchResultDto | null = null; // 검색 결과
        let failure: {error: unknown} | null = null;            // 실패 — 처리는 try 밖에서
        try {
            found = await searchStores(dto);
        } catch (error) {
            failure = {error};
        }

        setSearching(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        setResults(found?.list ?? []);
    }

    function storeRow(store: DiscoveryStoreSearchItemResultDto, actions: React.ReactNode): React.ReactNode {
        // 업체 한 줄 — 사진(없으면 그림) · 상호명 · 주소 · 버튼
        return (
            <div className={styles.row}>
                <div className={styles.thumb}>{store.image_url ? <Image src={store.image_url} alt="" fill sizes="56px" unoptimized className={styles.thumbImg} /> : PHOTO_ICON}</div>
                <div className={styles.info}><strong className={styles.name}>{store.store_name}</strong><span className={styles.address}>{store.address}</span></div>
                <div className={styles.actions}>{actions}</div>
            </div>
        );
    }

    return (
        // 업체 고르기
        <div className={styles.picker}>
            {value ? (
                // 고른 업체 · 다시 고르기
                storeRow(value, <><Button size="sm" onClick={() => setMapStore(value)}>지도</Button><Button size="sm" onClick={() => onPick(null)}>다시 고르기</Button></>)
            ) : (
                <>
                    {/* ② 검색 — 버튼 · Enter */}
                    <form role="search" className={styles.search} onSubmit={search}>
                        <Field label="업체 이름" name="keyword" htmlFor="inquiry-store-keyword">
                            <Input id="inquiry-store-keyword" type="search" placeholder="상호명으로 검색" maxLength={KEYWORD_MAX} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
                        </Field>
                        <Button type="submit" disabled={searching}>검색</Button>
                    </form>

                    {/* ② 결과 · 없음 */}
                    {results && results.length === 0 ? <p className={styles.empty}>검색 결과가 없어요</p> : null}
                    {results && results.length > 0 ? (
                        <ul className={styles.results} aria-label="검색 결과">
                            {results.map((store) => <li key={store.store_id}>{storeRow(store, <><Button size="sm" onClick={() => setMapStore(store)}>지도</Button><Button size="sm" variant="primary" onClick={() => onPick(store)}>고르기</Button></>)}</li>)}
                        </ul>
                    ) : null}
                </>
            )}

            {/* ② 지도 팝업 */}
            <StoreMapModal store={mapStore} onClose={() => setMapStore(null)} />
        </div>
    );
}
```

```tsx
// src/app/(user)/inquiries/new/_components/StoreMapModal.tsx
'use client';
import { DiscoveryStoreSearchItemResultDto } from '@/contracts/discovery/dto/discovery-store-search.dto';
import StoreMap from '@/shared/components/map/StoreMap';
import Modal from '@/shared/components/ui/modal/Modal';
import { MapMarkerType } from '@/shared/types/map';
import styles from '@/app/css/user/StorePicker.module.css';

type StoreMapModalProps = {
    store: DiscoveryStoreSearchItemResultDto | null; // 지도로 볼 업체 — null 이면 닫힘
    onClose: () => void;                              // 닫기
};

/** 지도 확대 단계 — 업체 상세 위치 지도와 같다 */
const LOCATION_MAP_LEVEL = 4;

/**
 * 업체 위치 팝업 — 핀 하나 · 끌기 · 확대 끔(업체 상세 위치 지도와 같은 부품)
 *
 * @param param0
 * @returns
 */
export default function StoreMapModal({store, onClose}: StoreMapModalProps): React.ReactNode {
    // 계산 값
    const markers: Array<MapMarkerType> = store ? [{id: store.store_id, title: store.store_name, latitude: store.latitude, longitude: store.longitude}] : []; // 핀 하나

    return (
        // 지도 팝업
        <Modal open={store !== null} title={store?.store_name ?? '업체 위치'} onClose={onClose}>
            {store ? (
                <>
                    <p className={styles.address}>{store.address}</p>
                    <div className={styles.map}><StoreMap center={{latitude: store.latitude, longitude: store.longitude}} markers={markers} level={LOCATION_MAP_LEVEL} locked /></div>
                </>
            ) : null}
        </Modal>
    );
}
```

### 1-3. 내 문의 상세 — `InquiryDetailContent`

```tsx
// src/app/(user)/inquiries/[inquiry_id]/InquiryDetailContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getMyInquiry } from '@/contracts/inquiry/api';
import { InquiryDetailResultDto } from '@/contracts/inquiry/dto/inquiry-detail.dto';
import { INQUIRY_STATE } from '@/contracts/inquiry/inquiry.constants';
import { inquiryStateTone } from '@/contracts/inquiry/inquiry-state';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatDateTime } from '@/shared/utils/format';
import UserTopBar from '../../_components/UserTopBar';
import { INQUIRY_LIST_PATH, inquiryTargetName } from '../inquiry-format';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/InquiryDetailContent.module.css';

type InquiryDetailContentProps = {
    inquiryId: string; // 주소의 문의 ID
};

/** 블라인드 안내 — 요청서 문구 그대로(사용자 결정 2026-11-24) */
const BLIND_NOTICE = '스팸/반복성 문의로 블라인드 된 문의입니다.';

/**
 * 내 문의 상세 — 블라인드 안내 · 상태 · 카테고리 · 대상 · 제목 · 내용 · 답변
 *
 * @param param0
 * @returns
 */
export default function InquiryDetailContent({inquiryId}: InquiryDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                              // 이용자 토큰
    const loadInquiry = useEffectEvent((signal: AbortSignal) => getMyInquiry(auth, inquiryId, signal)); // 그때의 auth 로

    // 상태
    const [inquiry, setInquiry] = useState<InquiryDetailResultDto | null>(null); // ① 상세
    const [failed, setFailed] = useState<boolean>(false);                         // ① 못 읽음

    // 효과
    useEffect(() => {
        // ① 상세(문의가 바뀌면 다시 · 떠나면 결과를 버린다)
        const controller = new AbortController();
        loadInquiry(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setInquiry(next);
                setFailed(next === null);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setFailed(true);
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [inquiryId]);

    return (
        // 내 문의 상세
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="문의 상세" parents={[{label: '내 정보', href: '/me/'}, {label: '문의', href: INQUIRY_LIST_PATH}]} />

            <div className={pageStyles.body}>
                {/* ① 못 읽음 */}
                {!inquiry && failed ? <EmptyState title="문의를 불러오지 못했어요" description="없는 문의이거나 잠시 연결이 안 돼요." action={<Link href={INQUIRY_LIST_PATH} className={buttonClass({size: 'sm'})}>문의 목록</Link>} /> : null}

                {inquiry ? (
                    <>
                        {/* ② 블라인드 안내 — 내용은 그대로 */}
                        {inquiry.inquiry_state_id === INQUIRY_STATE.BLIND ? <Band tone="warn">{BLIND_NOTICE}</Band> : null}

                        {/* ③ 문의 */}
                        <section className={pageStyles.card} aria-labelledby="inquiry-title">
                            <div className={styles.head}><Badge tone={inquiryStateTone(inquiry.inquiry_state_id)}>{inquiry.inquiry_state_name}</Badge><span className={styles.category}>{inquiry.inquiry_category_name}</span></div>
                            <h2 id="inquiry-title" className={styles.title}>{inquiry.title}</h2>
                            <dl className={pageStyles.dl}>
                                <dt>문의 대상</dt><dd>{inquiryTargetName(inquiry.store_name)}</dd>
                                <dt>문의일</dt><dd>{formatDateTime(inquiry.created_at)}</dd>
                            </dl>
                            <p className={styles.content}>{inquiry.content}</p>
                        </section>

                        {/* ③ 답변 */}
                        <section className={pageStyles.card} aria-labelledby="inquiry-answer-title">
                            <h2 id="inquiry-answer-title" className={pageStyles.cardTitle}>답변</h2>
                            {inquiry.answer_content ? (
                                <>
                                    <p className={styles.content}>{inquiry.answer_content}</p>
                                    <span className={styles.answeredAt}>{formatDateTime(inquiry.answered_at)}</span>
                                </>
                            ) : <p className={styles.muted}>아직 답변이 없어요</p>}
                        </section>
                    </>
                ) : null}
            </div>
        </div>
    );
}
```

### 1-4. 문의 관리 목록 — `InquiryManageList`

두 영역이 같은 화면이다 — 다른 것은 `INQUIRY_MANAGE[scope]`(부를 API · 링크 · 안내, 아래 3-5)뿐. 카테고리 고르기는 `ListFilter` 의 앞자리(`leading`)에 둔다.

```tsx
// src/app/_console/inquiries/InquiryManageList.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { getInquiryCategories } from '@/contracts/inquiry/api';
import { InquiryCategoryItemResultDto } from '@/contracts/inquiry/dto/inquiry-category-list.dto';
import { InquiryManageListDto, InquiryManageListResultDto } from '@/contracts/inquiry/dto/inquiry-manage-list.dto';
import { INQUIRY_STATE_FILTERS, inquiryStateTone } from '@/contracts/inquiry/inquiry-state';
import { handleApiError } from '@/shared/api/error';
import { FilterOptionType } from '@/shared/components/console/FilterChips';
import FilterSelect from '@/shared/components/console/FilterSelect';
import ListFilter, { FIRST_LIST_QUERY, ListQueryType } from '@/shared/components/console/ListFilter';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { listNumber } from '@/shared/utils/util';
import { INQUIRY_MANAGE, inquiryManagePath, InquiryScopeType } from './inquiry-manage';
import styles from '@/app/css/console/InquiryManageList.module.css';

/** 문의 목록 거르기 — 상태 · 검색어 · 쪽 + 카테고리 */
type InquiryQueryType = ListQueryType & {
    category: string | null; // 카테고리(null 이 전체)
};

type InquiryManageListProps = {
    scope: InquiryScopeType; // 업체 관리자(/mine) · 관리자
};

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 상태 칩 — 전체 · 접수 · 답변완료 · 블라인드 */
const STATE_CHIPS: ReadonlyArray<FilterOptionType> = INQUIRY_STATE_FILTERS.map((value) => ({value, label: value ? lookupName('inquiry_state_id', value) : '전체'}));

/**
 * 문의 관리 목록 — 카테고리 · 상태 · 검색 · 표(문의일 최신순). 업체 관리자는 내 업체, 관리자는 바로방 문의
 * - 문의 · 회원 ID 는 보이지 않는다 — 줄 번호는 검색 결과 기준(listNumber)
 *
 * @param param0
 * @returns
 */
export default function InquiryManageList({scope}: InquiryManageListProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);  // 그 영역 토큰
    const manage = INQUIRY_MANAGE[scope];  // 부를 API · 링크 · 안내
    const loadPage = useEffectEvent((query: InquiryQueryType, signal: AbortSignal) => manage.list(auth, new InquiryManageListDto({page: query.page, size: PAGE_SIZE, inquiry_category_id: query.category, inquiry_state_id: query.state, keyword: query.keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [query, setQuery] = useState<InquiryQueryType>({...FIRST_LIST_QUERY, category: null}); // ③④ 카테고리 · 상태 · 검색어 · 쪽
    const [categories, setCategories] = useState<Array<InquiryCategoryItemResultDto>>([]);        // ② 카테고리 고르기
    const [result, setResult] = useState<InquiryManageListResultDto | null>(null);                // ② 목록

    // 계산 값
    const categoryOptions: ReadonlyArray<FilterOptionType> = [{value: null, label: '전체 카테고리'}, ...categories.map((item) => ({value: item.inquiry_category_id, label: item.inquiry_category_name}))]; // ③ 카테고리 고르기

    // 효과
    useEffect(() => {
        // ② 카테고리 — 한 번(떠나면 결과를 버린다)
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
        // ②③④ 그 거르기 · 쪽 목록(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadPage(query, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult(next);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [query]);

    return (
        // 문의 목록
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <h1 className={styles.title}>문의</h1>
                <p className={styles.subtitle}>{manage.subtitle}</p>
            </div>

            {/* ③ 거르기 — 카테고리 · 상태 · 검색 */}
            <ListFilter
                stateLabel="문의 상태"
                states={STATE_CHIPS}
                placeholder="제목 · 내용"
                query={query}
                onChange={setQuery}
                leading={<FilterSelect id="inquiry-category" label="카테고리" options={categoryOptions} value={query.category} onPick={(category) => setQuery((prev) => ({...prev, category, page: 1}))} />}
            />

            {/* ② 표 · 빈 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="조건에 맞는 문의가 없습니다." description="거르기를 풀거나 검색어를 지워 보세요." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">번호</th><th scope="col">카테고리</th><th scope="col">제목</th><th scope="col">작성자</th><th scope="col">상태</th><th scope="col">답변일시</th><th scope="col">문의일시</th></tr></thead>
                    <tbody>
                        {result.list.map((item, index) => (
                            <tr key={item.inquiry_id}>
                                <td className={styles.number}>{listNumber(result.pagination, index)}</td>
                                <td>{item.inquiry_category_name}</td>
                                <td className={styles.titleCell}><Link href={inquiryManagePath(scope, item.inquiry_id)}>{item.title}</Link></td>
                                <td>{item.user_nickname}</td>
                                <td><Badge tone={inquiryStateTone(item.inquiry_state_id)}>{item.inquiry_state_name}</Badge></td>
                                <td className={styles.number}>{item.answered_at ? toKst(item.answered_at, 'YYYY-MM-DD HH:mm') : '—'}</td>
                                <td className={styles.number}>{toKst(item.created_at, 'YYYY-MM-DD HH:mm')}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}

            {/* ④ 페이지 */}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setQuery((prev) => ({...prev, page: Number(next)}))} label="문의 페이지" />
        </div>
    );
}
```

### 1-5. 문의 관리 상세 — `InquiryManageDetail`

답변 칸은 상세를 읽을 때마다 받은 답변으로 다시 채운다(답변 뒤 다시 읽으면 저장된 답변이 칸에 남는다). 블라인드 · 해제는 같은 버튼 · 같은 확인 창이고 부를 API 만 `actions.blinded` 로 고른다. 큐 처리는 이용자 상태 카드(`UserStateCard.tsx:52`)의 `send` 와 같다.

```tsx
// src/app/_console/inquiries/InquiryManageDetail.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { InquiryAnswerDto } from '@/contracts/inquiry/dto/inquiry-answer.dto';
import { InquiryManageDetailResultDto } from '@/contracts/inquiry/dto/inquiry-manage-detail.dto';
import { inquiryStateTone } from '@/contracts/inquiry/inquiry-state';
import { handleApiError } from '@/shared/api/error';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Field from '@/shared/components/ui/form/Field';
import Textarea from '@/shared/components/ui/form/Textarea';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { INQUIRY_MANAGE, inquiryActionsOf, InquiryScopeType } from './inquiry-manage';
import styles from '@/app/css/console/InquiryManageDetail.module.css';

type InquiryManageDetailProps = {
    scope: InquiryScopeType; // 업체 관리자(/mine) · 관리자
    inquiryId: string;       // 주소의 문의 ID
};

/** 답변 최대 글자 수 — InquiryAnswerDto */
const ANSWER_MAX = 2000;

/**
 * 문의 관리 상세 — 문의 내용 · 답변 등록 · 수정 · 블라인드 · 해제(확인 창)
 *
 * @param param0
 * @returns
 */
export default function InquiryManageDetail({scope, inquiryId}: InquiryManageDetailProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                 // 그 영역 토큰
    const manage = INQUIRY_MANAGE[scope];                                                                 // 부를 API · 링크
    const loadInquiry = useEffectEvent((signal: AbortSignal) => manage.detail(auth, inquiryId, signal)); // 그때의 auth 로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                                  // ③④ 다시 읽기
    const [inquiry, setInquiry] = useState<InquiryManageDetailResultDto | null>(null);      // ① 상세
    const [failed, setFailed] = useState<boolean>(false);                                    // ① 못 읽음
    const [answer, setAnswer] = useState<string>('');                                        // ③ 답변 칸
    const [busy, setBusy] = useState<boolean>(false);                                        // ③④ 보내는 중
    const [confirming, setConfirming] = useState<boolean>(false);                            // ④ 확인 창
    const [notice, setNotice] = useState<string | null>(null);                               // ③ 답변 안내

    // 계산 값
    const actions = inquiry ? inquiryActionsOf(inquiry) : null; // ② 할 수 있는 일

    // 효과
    useEffect(() => {
        // ① 상세(문의가 바뀌거나 다시 읽을 때 · 떠나면 결과를 버린다) — 답변 칸은 받은 답변으로
        const controller = new AbortController();
        loadInquiry(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setInquiry(next);
                setAnswer(next?.answer_content ?? '');
                setFailed(next === null);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setFailed(true);
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [inquiryId, reloadKey]);

    // 함수
    function reload(): void {
        // ③④ 상세 다시
        setReloadKey((key) => key + 1);
    }

    async function send(call: () => Promise<null>): Promise<boolean> {
        // 큐 호출 — 실패는 받은 문구(칸 오류는 칸 옆), 성공이면 true
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await call();
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error);
            return false;
        }

        return true;
    }

    async function submitAnswer(): Promise<void> {
        // ③ 답변 — 검사(칸 옆) → 답변(큐) → 띠 · 상세 다시
        if (!inquiry || !actions || busy || actions.answerLock) {
            return;
        }

        const dto = Object.assign(new InquiryAnswerDto(), {answer_content: answer.trim()});
        if (!(await validateAction(dto))) {
            return;
        }

        const message = actions.answerLabel === '답변 등록' ? '답변을 등록했어요.' : '답변을 고쳤어요.'; // 누를 때의 버튼으로
        if (await send(() => manage.answer(auth, inquiry.inquiry_id, dto))) {
            setNotice(message);
            reload();
        }
    }

    async function confirmBlind(): Promise<void> {
        // ④ 확인 → 블라인드 · 해제(큐) → 상세 다시
        if (!inquiry || !actions || busy) {
            return;
        }

        const id = inquiry.inquiry_id;
        const done = await send(() => (actions.blinded ? manage.unblind(auth, id) : manage.blind(auth, id)));
        setConfirming(false);
        if (done) {
            setNotice(null);
            reload();
        }
    }

    if (!inquiry || !actions) {
        return failed ? (
            // ① 못 읽음
            <EmptyState title="문의를 불러오지 못했어요" description="없는 문의이거나 잠시 연결이 안 됩니다." action={<Link href={manage.listPath} className={buttonClass({size: 'sm'})}>문의 목록</Link>} />
        ) : null;
    }

    return (
        // 문의 관리 상세
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <p className={styles.crumb}><Link href={manage.listPath}>문의 목록</Link></p>
                <h1 className={styles.title}>{inquiry.title}<Badge tone={inquiryStateTone(inquiry.inquiry_state_id)}>{inquiry.inquiry_state_name}</Badge></h1>
                <p className={styles.sub}>{inquiry.user_nickname} · {inquiry.inquiry_category_name} · {toKst(inquiry.created_at, 'YYYY-MM-DD HH:mm')}</p>
            </div>

            <div className={styles.cols}>
                {/* ① 문의 내용 */}
                <Card title="문의 내용">
                    <dl className={styles.dl}>
                        <dt>작성자</dt><dd>{inquiry.user_nickname}</dd>
                        <dt>카테고리</dt><dd>{inquiry.inquiry_category_name}</dd>
                        <dt>상태</dt><dd><Badge tone={inquiryStateTone(inquiry.inquiry_state_id)}>{inquiry.inquiry_state_name}</Badge></dd>
                        <dt>문의일시</dt><dd className={styles.mono}>{toKst(inquiry.created_at, 'YYYY-MM-DD HH:mm')}</dd>
                        <dt>블라인드</dt><dd className={styles.mono}>{inquiry.blinded_at ? toKst(inquiry.blinded_at, 'YYYY-MM-DD HH:mm') : '—'}</dd>
                    </dl>
                    <p className={styles.content}>{inquiry.content}</p>
                </Card>

                {/* ②③ 답변 */}
                <Card title="답변">
                    <div className={styles.cardBody}>
                        {notice ? <Band tone="ok" role="status">{notice}</Band> : null}
                        {actions.answerLock ? <Band tone="warn">{actions.answerLock}</Band> : null}
                        <Field label="답변" name="answer_content" htmlFor="inquiry-answer" hint={<span>{answer.length} / {ANSWER_MAX}</span>}>
                            <Textarea id="inquiry-answer" rows={8} maxLength={ANSWER_MAX} value={answer} disabled={actions.answerLock !== null || busy} onChange={(event) => setAnswer(event.target.value)} />
                        </Field>
                        {inquiry.answered_at ? <p className={styles.muted}>마지막 답변 {inquiry.answer_user_name ?? '—'} · {toKst(inquiry.answered_at, 'YYYY-MM-DD HH:mm')}</p> : null}
                        <div><Button variant="primary" disabled={actions.answerLock !== null || busy} onClick={submitAnswer}>{actions.answerLabel}</Button></div>
                    </div>
                </Card>
            </div>

            {/* ②④ 블라인드 · 해제 — 버튼 하나 */}
            <Card title="블라인드">
                <div className={styles.cardBody}>
                    <p className={styles.muted}>스팸 · 도배처럼 부적절한 문의를 블라인드합니다. 이용자에게 블라인드 안내가 보이고, 답변은 지우지 않습니다.</p>
                    <div><Button variant={actions.blinded ? 'default' : 'danger'} disabled={busy} onClick={() => setConfirming(true)}>{actions.blindLabel}</Button></div>
                </div>
            </Card>

            {/* ④ 확인 창 */}
            <ConfirmModal
                open={confirming}
                title={actions.blindLabel}
                message={actions.blinded ? '이 문의의 블라인드를 해제할까요? 답변이 있던 문의는 답변완료, 없던 문의는 접수로 돌아갑니다.' : '이 문의를 블라인드할까요? 이용자에게 블라인드 안내가 보이고, 해제하기 전까지 답변할 수 없습니다.'}
                confirmLabel={actions.blindLabel}
                danger={!actions.blinded}
                busy={busy}
                onConfirm={confirmBlind}
                onClose={() => setConfirming(false)}
            />
        </div>
    );
}
```

---

## 2. 계산 함수

### 2-1. 관리 상세에서 할 수 있는 일 — `src/app/_console/inquiries/inquiry-manage.ts` `inquiryActionsOf`

```ts
/** 관리 상세에서 할 수 있는 일 — 답변 버튼 · 답변을 막는 이유 · 블라인드 버튼 */
export type InquiryActionsType = {
    answerLabel: '답변 등록' | '답변 수정';  // 답변이 없으면 등록, 있으면 수정(같은 API — 통째로 바꾼다)
    answerLock: string | null;               // 답변을 막는 이유 — null 이면 칸 · 버튼이 열린다
    blindLabel: '블라인드' | '블라인드 해제'; // 블라인드 버튼 글자
    blinded: boolean;                        // 블라인드 — 버튼이 해제를 부른다
};

/** 블라인드된 문의의 답변을 막는 이유 — 서버도 400(블라인드된 문의에는 답변할 수 없습니다.) */
export const ANSWER_LOCK_MESSAGE = '블라인드된 문의에는 답변할 수 없어요. 블라인드를 해제한 뒤 답변하세요.';

/**
 * 관리 상세에서 할 수 있는 일 — 블라인드면 답변을 막고 해제만, 아니면 답변 유무에 맞는 답변 버튼과 블라인드
 *
 * @param inquiry 상세의 상태 · 답변
 */
export function inquiryActionsOf(inquiry: Pick<InquiryManageDetailResultDto, 'inquiry_state_id' | 'answer_content'>): InquiryActionsType {
    const blinded = inquiry.inquiry_state_id === INQUIRY_STATE.BLIND;
    return {
        answerLabel: inquiry.answer_content ? '답변 수정' : '답변 등록',
        answerLock: blinded ? ANSWER_LOCK_MESSAGE : null,
        blindLabel: blinded ? '블라인드 해제' : '블라인드',
        blinded,
    };
}
```

### 2-2. 문의 대상 이름 — `src/app/(user)/inquiries/inquiry-format.ts` `inquiryTargetName`

```ts
/**
 * 문의 대상 이름 — 업체에 한 문의는 상호명, 업체가 없는 문의(바로방 문의)는 사이트 이름
 *
 * @param storeName 응답의 store_name (바로방 문의면 null)
 */
export function inquiryTargetName(storeName: string | null): string {
    return storeName ?? SITE_NAME;
}
```

---

## 3. 데이터 규칙 — 규약만으로 예측할 수 없는 부분

### 3-1. 상태 칩 · 배지 색 · 룩업 이름 — `src/contracts/inquiry/inquiry-state.ts` · `src/contracts/common/lookup.ts`

`inquiry.constants.ts` 는 요청서 사본이라 그대로 두고(`../inquiry.constants.js` 같은 import 의 `.js` 만 뗀다 — 다른 사본과 같이), 화면이 함께 쓰는 값은 옆 파일에 둔다. 칩 이름은 목록이 오기 전에도 그려야 해서 응답의 `inquiry_state_name` 대신 룩업을 쓴다.

```ts
// src/contracts/inquiry/inquiry-state.ts
import { INQUIRY_STATE } from './inquiry.constants';

/** 상태 칩 순서 — 전체(null) · 접수 · 답변완료 · 블라인드(이용자 · 콘솔 목록) */
export const INQUIRY_STATE_FILTERS: ReadonlyArray<string | null> = [null, INQUIRY_STATE.RECEIVED, INQUIRY_STATE.ANSWERED, INQUIRY_STATE.BLIND];

/** 상태 배지 색 — 접수 warn(답변 기다림) · 답변완료 ok · 블라인드 neutral, Map 이라 상속 이름에 속지 않는다 */
const INQUIRY_STATE_TONE = new Map<string, 'warn' | 'ok' | 'neutral'>([
    [INQUIRY_STATE.RECEIVED, 'warn'],
    [INQUIRY_STATE.ANSWERED, 'ok'],
    [INQUIRY_STATE.BLIND, 'neutral'],
]);

/**
 * 문의 상태 배지 색
 *
 * @param stateId inquiry_state_id
 */
export function inquiryStateTone(stateId: string): 'warn' | 'ok' | 'neutral' {
    return INQUIRY_STATE_TONE.get(stateId) ?? 'neutral';
}
```

```ts
// src/contracts/common/lookup.ts — LOOKUP 에 한 줄
    inquiry_state_id: {RECEIVED: '접수', ANSWERED: '답변완료', BLIND: '블라인드'},
```

### 3-2. 거르기 부품을 콘솔 공통으로 — `src/shared/components/console/ListFilter.tsx` · `FilterChips.tsx` · `FilterSelect.tsx`

업체 관리자 문의 목록도 같은 거르기 줄을 쓰므로 관리자 `_components` 에서 콘솔 공통(`ConsoleShell` 옆)으로 옮긴다 — 도메인을 모르는 부품이라 shared 에 둘 수 있다(글자 · 칩은 화면이 넘긴다). 내용은 그대로, 바뀌는 것은 위치 · import · 주석뿐이다.

```tsx
// src/shared/components/console/FilterChips.tsx · FilterSelect.tsx — css import 만
import styles from '@/shared/css/console/ListFilter.module.css';

// src/shared/components/console/ListFilter.tsx — css import · 주석
import FilterChips, { FilterOptionType } from './FilterChips';
import styles from '@/shared/css/console/ListFilter.module.css';

/** 검색어 최대 글자 수 — 콘솔 목록 DTO 의 keyword(입점 신청 · 업체 · 업체 관리자 · 이용자 · 문의) */
const KEYWORD_MAX = 100;

/**
 * 콘솔 목록 거르기 — (앞 거르기) · 상태 칩 · (뒤 거르기) · 검색어(관리자 목록 · 문의 목록 위 줄)
 */

// src/app/admin/(console)/users/AdminUserListContent.tsx 외 관리자 목록 3곳 — import 경로만
import { FilterOptionType } from '@/shared/components/console/FilterChips';
import FilterSelect from '@/shared/components/console/FilterSelect';
import ListFilter, { FIRST_LIST_QUERY, ListQueryType } from '@/shared/components/console/ListFilter';
```

원본 3파일과 `src/app/css/admin/ListFilter.module.css` 는 지운다(옮긴 것 — 남기면 두 벌).

### 3-3. 주소 · 업체 상세 → 고른 업체 — `src/app/(user)/inquiries/inquiry-format.ts`

업체 상세에서 들어오면 검색 결과가 없으므로 업체 상세 응답을 검색 결과 한 줄 모양으로 바꿔 고른 업체로 둔다 — 대표 사진은 첫 장(검색 결과의 `image_url` 과 같은 규칙), 주소는 상세 주소를 붙이지 않는다(검색 결과와 같게).

```ts
// src/app/(user)/inquiries/inquiry-format.ts
import { DiscoveryStoreDetailResultDto } from '@/contracts/discovery/dto/discovery-store-detail.dto';
import { DiscoveryStoreSearchItemResultDto } from '@/contracts/discovery/dto/discovery-store-search.dto';
import { SITE_NAME } from '@/shared/utils/site';

/** 내 문의 목록 */
export const INQUIRY_LIST_PATH = '/inquiries/';

/** 문의하기 */
export const INQUIRY_NEW_PATH = '/inquiries/new/';

/**
 * 내 문의 상세
 *
 * @param inquiryId 문의 ID
 */
export function inquiryPath(inquiryId: string): string {
    return `${INQUIRY_LIST_PATH}${encodeURIComponent(inquiryId)}/`;
}

/**
 * 이 업체에 문의 — 업체 상세의 링크(그 업체가 골라진 채 문의하기)
 *
 * @param storeId 업체 ID
 */
export function storeInquiryPath(storeId: string): string {
    return `${INQUIRY_NEW_PATH}?store_id=${encodeURIComponent(storeId)}`;
}

/**
 * 업체 상세 → 고른 업체 — 검색 결과 한 줄과 같은 모양(대표 사진 첫 장 · 주소만)
 *
 * @param detail 업체 상세
 */
export function storeItemOf(detail: DiscoveryStoreDetailResultDto): DiscoveryStoreSearchItemResultDto {
    return {store_id: detail.store_id, store_name: detail.store_name, address: detail.address, latitude: detail.latitude, longitude: detail.longitude, image_url: detail.images[0]?.image_url ?? null};
}

// inquiryTargetName — 위 2-2
```

### 3-4. 진입 링크 — `MyPageContent.tsx` · `StoreDetailContent.tsx`

```tsx
// src/app/(user)/me/MyPageContent.tsx:204 — 내 정보 메뉴(내 예약 · 입점 신청) 아래 한 줄
<Link href={INQUIRY_LIST_PATH} className={styles.menuRow}>문의{CHEVRON_ICON}</Link>

// src/app/(user)/stores/[store_id]/StoreDetailContent.tsx:120 — 전화 아래(로그인 전이면 /inquiries/new/ 의 AuthGuard 가 로그인을 거쳐 돌아온다)
<Link href={storeInquiryPath(store.store_id)} className={buttonClass({size: 'sm'})}>이 업체에 문의</Link>
```

### 3-5. 영역별 문의 관리 — `src/app/_console/inquiries/inquiry-manage.ts` `INQUIRY_MANAGE`

두 영역은 경로(`/mine` 유무) · 토큰 · 링크 · 안내만 다르다. contracts 함수는 형제(`getMyStats` · `getStats` — `src/contracts/stats/api.ts:13,24`)처럼 경로마다 따로 두고, 화면은 이 표로 고른다. 토큰은 `AuthContext` 가 주소의 영역으로 이미 고른다(`areaOf`).

```ts
// src/app/_console/inquiries/inquiry-manage.ts
import { INQUIRY_LIST_PATH as ADMIN_INQUIRY_LIST_PATH } from '@/app/admin/(console)/admin-paths';
import { answerInquiry, answerStoreInquiry, blindInquiry, blindStoreInquiry, getInquiries, getInquiry, getStoreInquiries, getStoreInquiry, unblindInquiry, unblindStoreInquiry } from '@/contracts/inquiry/api';
import { InquiryAnswerDto } from '@/contracts/inquiry/dto/inquiry-answer.dto';
import { InquiryManageDetailResultDto } from '@/contracts/inquiry/dto/inquiry-manage-detail.dto';
import { InquiryManageListDto, InquiryManageListResultDto } from '@/contracts/inquiry/dto/inquiry-manage-list.dto';
import { INQUIRY_STATE } from '@/contracts/inquiry/inquiry.constants';
import { AuthType } from '@/shared/api/auth';
import { SITE_NAME } from '@/shared/utils/site';

/** 문의 관리 영역 — 업체 관리자(소속 업체 문의 · /mine) · 관리자(바로방 문의) */
export type InquiryScopeType = 'manager' | 'admin';

/** 영역마다 다른 것 — 부를 API · 목록 주소 · 안내 */
type InquiryManageType = {
    listPath: string;                                                                                                        // 문의 목록 주소
    subtitle: string;                                                                                                        // 목록 안내
    list: (auth: AuthType, query: InquiryManageListDto, signal?: AbortSignal) => Promise<InquiryManageListResultDto | null>; // 목록
    detail: (auth: AuthType, inquiryId: string, signal?: AbortSignal) => Promise<InquiryManageDetailResultDto | null>;      // 상세
    answer: (auth: AuthType, inquiryId: string, dto: InquiryAnswerDto) => Promise<null>;                                    // 답변(큐)
    blind: (auth: AuthType, inquiryId: string) => Promise<null>;                                                            // 블라인드(큐)
    unblind: (auth: AuthType, inquiryId: string) => Promise<null>;                                                          // 해제(큐)
};

/** 영역별 문의 관리 */
export const INQUIRY_MANAGE: Record<InquiryScopeType, InquiryManageType> = {
    manager: {listPath: '/manager/inquiries/', subtitle: '내 업체로 들어온 문의입니다. 문의일 최신순.', list: getStoreInquiries, detail: getStoreInquiry, answer: answerStoreInquiry, blind: blindStoreInquiry, unblind: unblindStoreInquiry},
    admin: {listPath: ADMIN_INQUIRY_LIST_PATH, subtitle: `업체가 아닌 ${SITE_NAME} 문의입니다. 문의일 최신순.`, list: getInquiries, detail: getInquiry, answer: answerInquiry, blind: blindInquiry, unblind: unblindInquiry},
};

/**
 * 그 영역의 문의 관리 상세 주소
 *
 * @param scope 영역
 * @param inquiryId 문의 ID
 */
export function inquiryManagePath(scope: InquiryScopeType, inquiryId: string): string {
    return `${INQUIRY_MANAGE[scope].listPath}${encodeURIComponent(inquiryId)}/`;
}

// InquiryActionsType · ANSWER_LOCK_MESSAGE · inquiryActionsOf — 위 2-1
```

---

## 4. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| DTO 사본 11개 | 요청서 코드 그대로 — `@app/common/dto/pagination.dto.js` → `../../common/pagination.dto`, `../inquiry.constants.js` → `../inquiry.constants`(`.js` 뗌) | `src/contracts/user/dto/user-list.dto.ts:2` |
| `searchStores(query, signal)` | 로그인 없는 동기 조회 `request` — `query: {keyword}` | `src/contracts/discovery/api.ts:13` `getNearbyStores` |
| `getInquiryCategories(signal)` | 로그인 없는 동기 조회 | `src/contracts/discovery/api.ts:26` `getRoomGroupDetailFilters` |
| `createInquiry(auth, dto)` | `withAuth` + `callQueue` POST, done 이면 `{inquiry_id}` | `src/contracts/store/api.ts:69` `createStoreApplication` |
| `getMyInquiries` · `getMyInquiry` | `withAuth` + `request` — query 는 필드를 하나씩(null 은 빠진다), 경로 값은 `encodeURIComponent` | `src/contracts/store/api.ts:80,91` |
| `getStoreInquiries` · `getStoreInquiry` · `answerStoreInquiry`(PUT) · `blindStoreInquiry` · `unblindStoreInquiry`(PATCH, 본문 없음) — `/admin-service/inquiry/mine…` / `getInquiries` · `getInquiry` · `answerInquiry` · `blindInquiry` · `unblindInquiry` — `/admin-service/inquiry…` | 조회는 `withAuth` + `request`, 쓰기는 `withAuth` + `callQueue` (done data 없음 → `Promise<null>`) | `src/contracts/stats/api.ts:13,24` · `src/contracts/user/api.ts` `updateUserState` |
| `(user)/inquiries/page.tsx` · `new/page.tsx`(`storeId={firstQueryValue(query.store_id)}`) · `[inquiry_id]/page.tsx` | 서버 page 가 `<AuthGuard>` 로 감싸고 Content 만 | `src/app/(user)/phone-verification/page.tsx:5` |
| `manager/(console)/inquiries/…` · `admin/(console)/inquiries/…` page 4개 | 콘솔 page — layout 이 로그인을 감싼다, `params` 의 `inquiry_id` 를 넘긴다 | `src/app/admin/(console)/users/[user_id]/page.tsx:4` |
| `ManagerInquiryListContent` · `ManagerInquiryDetailContent` · `AdminInquiryListContent` · `AdminInquiryDetailContent` | `'use client'` default export 가 한 벌에 `scope` 만 넘긴다(`<InquiryManageList scope="manager" />`) | `src/app/admin/(console)/users/AdminUserListContent.tsx` (Content 규약) |
| 메뉴 "문의" — 업체 관리자(예약 현황 다음, 권한 없음 — 모두) · 관리자(이용자 다음), 말풍선 아이콘 | `ConsoleMenuItemType` 한 줄 | `src/app/manager/(console)/manager-menu.tsx:7` · `src/app/admin/(console)/admin-menu.tsx:9` |
| `admin-paths.ts` `INQUIRY_LIST_PATH` | 목록 주소 상수 | `src/app/admin/(console)/admin-paths.ts:11` |

## 5. 스타일 — 형제 값

시안이 없다(요청서 — 화면 배치는 프론트가 정한다). 색 · 크기는 토큰만, 값은 형제 화면에서 가져온다.

- `src/app/css/user/InquiryListContent.module.css` — `.chips`(가로 스크롤 칩 줄 — `MyReservationContent.module.css` `.states`) · `.card` · `.head` · `.title` · `.meta` · `.date`(카드 — `StoreApplicationListContent.module.css` `.card` · `.head` · `.meta`).
- `src/app/css/user/InquiryFormContent.module.css` — `.body` · `.section` · `.sectionTitle`(`StoreApplicationFormContent.module.css` 같은 이름), `.chips`(줄바꿈 칩), `.consent` · `.check`(체크 상자 + 글자 한 줄) · `.consentToggle`(글자 버튼 — `--primary`) · `.consentItems`(dt 흐리게 `--muted`).
- `src/app/css/user/StorePicker.module.css` — `.picker` · `.search`(칸 + 버튼 한 줄) · `.results` · `.row`(사진 56px · 글자 · 버튼) · `.thumb` · `.thumbImg`(홈 카드 `.thumb` 과 같은 모양, 56px) · `.info` · `.name` · `.address`(`--muted`) · `.actions` · `.empty` · `.map`(`--store-map-h: 280px` — 팝업 지도).
- `src/app/css/user/InquiryDetailContent.module.css` — `.head` · `.category` · `.title` · `.content`(`white-space: pre-wrap` — 줄바꿈 그대로) · `.answeredAt` · `.muted`.
- `src/app/css/console/InquiryManageList.module.css` — `AdminList.module.css` 의 `.page` · `.title` · `.subtitle` · `.number` 과 같은 값 + `.titleCell`(제목 칸 — 최대 너비 · 말줄임).
- `src/app/css/console/InquiryManageDetail.module.css` — `AdminDetail.module.css` 의 `.page` · `.crumb` · `.title` · `.sub` · `.cols` · `.dl` · `.mono` · `.muted` · `.cardBody` 와 같은 값 + `.content`(`white-space: pre-wrap`).
- `src/shared/css/console/ListFilter.module.css` — `src/app/css/admin/ListFilter.module.css` 그대로 옮김.

## 테스트

spec의 "결과" 표에서 ✓ 표시된 14건과 "계산 규칙" 표 5건을 그대로 테스트로 옮긴다. 여기에는 추가분만 적는다.

| 종류 | 대상 | 이유 |
|---|---|---|
| 파일 배치 | `src/test/app/(user)/inquiries/InquiryListContent.test.tsx` · `inquiry-format.test.ts` · `new/InquiryFormContent.test.tsx` · `[inquiry_id]/InquiryDetailContent.test.tsx` · `src/test/app/_console/inquiries/InquiryManageList.test.tsx` · `InquiryManageDetail.test.tsx` · `inquiry-manage.test.ts` + 픽스처 `src/test/app/_console/inquiries/inquiry-fixture.tsx` | 규약(src 와 같은 경로) — 콘솔 두 영역은 `renderWithManager`(`src/test/app/manager/(console)/store/store-fixture.tsx:59`) · `renderWithAdmin`(`src/test/app/admin/(console)/admin-fixture.tsx:39`) 로 토큰 영역을 바꿔 같은 화면을 그린다 |
| mock 경계 | `@/contracts/inquiry/api` · `@/contracts/discovery/api` 함수 · `next/navigation` 라우터 · `StoreMap`(지도 스크립트 — 팝업은 그리지 않는 테스트만) | 실제 네트워크 금지(규약) — 등록 · 답변 · 블라인드는 호출 횟수 · 인자 · 실패 뒤 미호출까지 |
| 검증 문구 | 문의하기의 두 검증 실패 행은 칸 옆 `span[data-id="agree"]` · `span[data-id="inquiry_category_id"]` 의 글자로 확인 | 동의는 DTO 밖 문구라 `showValidationErrors` 가 칸에 붙는지까지 봐야 한다 |
| 거르기 부품 이동 | 기존 관리자 목록 테스트 4파일(입점 신청 · 업체 · 업체 관리자 · 이용자)이 import 경로만 바뀐 채 그대로 통과 | 옮긴 부품의 회귀 — 새 테스트는 만들지 않는다 |

## 만드는 순서

1. DTO 사본 11개 · `inquiry-state.ts` · 룩업 한 줄 → 2. contracts 함수(`searchStores` · 문의 14개) → 3. 계산 함수(`inquiryActionsOf` · `inquiryTargetName`)와 그 테스트 → 4. 거르기 부품 이동(관리자 목록 4곳 import · 원본 삭제) → 5. 이용자 화면(목록 · 문의하기 · `StorePicker` · `StoreMapModal` · 상세 · page 3개)과 그 테스트 → 6. 진입 링크(내 정보 · 업체 상세) → 7. 콘솔 한 벌(`inquiry-manage.ts` · 목록 · 상세)과 그 테스트 → 8. 두 영역 page · Content · 메뉴 · `admin-paths` → 9. 문서 — `AGENTS.md`(이용자 문의 화면 · 콘솔 공통 화면 폴더 `src/app/_console/` · 거르기 부품 `src/shared/components/console/`) · `docs/architecture.md` · `docs/conventions.md`(공통 부품 목록) · `docs/data-layer.md`(반영한 수정 요청 `2026-11-24-inquiry.md`)
