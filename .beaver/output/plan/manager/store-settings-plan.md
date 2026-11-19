# Plan — 내 업체 설정 — 기본 정보 · 사진 · 영업 규정

> 무엇을·왜는 [spec](../../spec/manager/store-settings-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 탭마다 비즈니스 로직 전체 ② 계산 함수 ③ 규약만으로 예측할 수 없는 부분(줄 단위 검증 · 공용 함수 옮기기)
> **싣지 않는 것** page 껍데기, DTO 사본, 형제와 같은 contracts 함수 — 따르는 패턴을 표 한 줄로 가리킨다

로드맵 Phase 11(#37 ~ #42)을 이 plan 하나로 만든다. 화면은 `/manager/store` 한 주소 — 콘솔 틀(`manager/(console)/layout.tsx`) 안이라 로그인 가드 · 내 업체 상세(`ManagerConsoleContext`)는 이미 있다.

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/app/manager/(console)/store/page.tsx` | 신규 | 얇은 page | 생략 |
| `src/app/manager/(console)/store/StoreSettingsContent.tsx` | 신규 | 머리 · 영업중지 띠 · 탭 · 다시 읽기 | 아래 1-0 |
| `src/app/manager/(console)/store/_components/StoreProfileTab.tsx` | 신규 | 기본 정보 탭 | 아래 1-1 |
| `src/app/manager/(console)/store/_components/StorePhotosTab.tsx` | 신규 | 사진 탭 | 아래 1-2 |
| `src/app/manager/(console)/store/_components/StoreHoursTab.tsx` | 신규 | 영업시간 · 브레이크 탭 | 아래 1-3 |
| `src/app/manager/(console)/store/_components/StorePolicyTab.tsx` | 신규 | 운영 규정 탭 | 아래 1-4 |
| `src/app/manager/(console)/store/_components/StoreUnavailableTab.tsx` | 신규 | 일시 예약불가 탭 | 아래 1-5 |
| `src/app/manager/(console)/store/_components/StoreDoorTab.tsx` | 신규 | 문 연동 탭 | 아래 1-6 |
| `src/app/manager/(console)/store/store-settings-format.ts` | 신규 | 영업시간 보낼 값 · 다음 날 표시 · 일시 글자 · 규정 요약 · 탭 · 요일 이름 | 아래 2 |
| `src/shared/utils/validation.ts` | 수정 | `validateActionRows(dtos, path)` — 줄마다 DTO 검사, 칸 이름은 `<path>.<줄>.<필드>` | 아래 3-1 |
| `src/shared/components/ui/form/FieldError.tsx` · `Field.tsx` | 신규 · 수정 | 라벨 없는 칸(표 · 줄)의 오류 span — `Field` 도 이걸 그린다 | 아래 3-2 |
| `src/app/manager/manager-auth.ts` · `src/app/(user)/store-applications/store-application-format.ts` · U11 화면 2개 | 수정 | `managerLoginUrl` · `storeConsoleLoginUrl` 를 매니저 쪽으로 옮김 | 아래 3-3 |
| `src/contracts/store/dto/` 14개(`store-mine-profile` · `-file-upload-url` · `-file` · `-file-order` · `-file-delete` · `-hours` · `-breaks` · `-maintenance` · `-open` · `-reservation-policy` · `-unavailable-period-list` · `-unavailable-period` · `-unavailable-period-delete` · `-door-secret`) | 신규 | 지침서 사본 | 생략 |
| `src/contracts/store/api.ts` | 수정 | 내 업체 쓰기 · 일시 예약불가 함수 14개 | 생략 |
| `src/app/css/manager/StoreSettingsContent.module.css` · `Store*Tab.module.css` 6개 | 신규 | 시안 값 | 아래 5 |
| 테스트 — `store-settings-format.test.ts` · 탭 6개 · `StoreSettingsContent` · `manager-auth.test.ts`(옮긴 테스트) | 신규 · 수정 | spec 25건 | 아래 테스트 |
| `AGENTS.md` · `docs/conventions.md` · `docs/integrations.md` | 수정 | `validateActionRows` · `FieldError` · 업체 사진 올리기 | 만드는 순서 7 |

---

## 1. 비즈니스 로직 — 탭별 코드

모든 쓰기는 같은 모양: 검사 → 큐(`try` 안은 `await` 만, 실패는 `handleApiError`) → `onSaved()`(콘솔 Context 의 `reloadStore` — 못 읽으면 안내). 큐 결과가 null(완료 · 늦어짐 같음)이어도 다시 읽어 서버 값을 본다(spec 결정).

### 1-0. 머리 · 탭 — `StoreSettingsContent`

```tsx
// src/app/manager/(console)/store/StoreSettingsContent.tsx
'use client';
import { useContext, useState } from 'react';
import { AUTH_ID } from '@/contracts/common/roles';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Tabs from '@/shared/components/ui/nav/Tabs';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { toKst } from '@/shared/utils/format';
import { ManagerConsoleContext } from '../manager-console-context';
import StoreDoorTab from './_components/StoreDoorTab';
import StoreHoursTab from './_components/StoreHoursTab';
import StorePhotosTab from './_components/StorePhotosTab';
import StorePolicyTab from './_components/StorePolicyTab';
import StoreProfileTab from './_components/StoreProfileTab';
import StoreUnavailableTab from './_components/StoreUnavailableTab';
import { STORE_TABS, StoreTabType } from './store-settings-format';
import styles from '@/app/css/manager/StoreSettingsContent.module.css';

/** 저장 뒤 내 업체를 다시 읽지 못함 */
const RELOAD_FAILED_MESSAGE = '저장했지만 내 업체 정보를 다시 불러오지 못했어요. 잠시 뒤 다시 들어와 확인해 주세요.';

/** 영업중지 업체 상태 */
const STORE_SUSPENDED = 'SUSPEND';

/**
 * M7 내 업체 설정 — 머리(상태 · 영업중 · 마지막 수정) · 영업중지 띠 · 탭 6개(문 연동은 업체 총관리자만)
 * - 내 업체 상세는 콘솔 틀이 읽은 값, 저장 뒤 reloadStore — 상단 바 · 대시보드도 같은 값을 본다
 *
 * @returns
 */
export default function StoreSettingsContent(): React.ReactNode {
    // 변수
    const {store, account, reloadStore} = useContext(ManagerConsoleContext); // 내 업체 · 계정 · 다시 읽기

    // 상태
    const [tab, setTab] = useState<StoreTabType>('profile'); // 지금 탭 — 화면 상태(사용자 결정)
    const [reloading, setReloading] = useState<boolean>(false); // 다시 불러오는 중

    // 계산 값
    const isHeadManager = account?.auth_id === AUTH_ID.HEAD_MANAGER;                        // ⑥ 문 연동 탭 — 업체 총관리자만(모르면 숨김)
    const tabs = STORE_TABS.filter((item) => item.value !== 'door' || isHeadManager);       // 보일 탭
    const activeTab = tabs.some((item) => item.value === tab) ? tab : 'profile';            // 숨긴 탭이면 기본 정보
    const suspended = store?.store_state_id === STORE_SUSPENDED;                            // 영업중지

    // 함수
    async function onSaved(): Promise<void> {
        // 저장 뒤 — 내 업체를 다시 읽고, 못 읽으면 안내(리뷰 261118-5 #6 — 부르는 화면이 안내)
        const next = await reloadStore();
        if (!next) {
            showErrorPopup(RELOAD_FAILED_MESSAGE);
        }
    }

    async function retry(): Promise<void> {
        // 내 업체를 못 읽었을 때 다시 불러오기
        setReloading(true);
        await reloadStore();
        setReloading(false);
    }

    if (!store) {
        return (
            // 내 업체를 아직 · 못 읽음
            <EmptyState title="내 업체 정보를 불러오지 못했어요" description="잠시 뒤 다시 불러와 주세요." action={<Button size="sm" disabled={reloading} onClick={retry}>다시 불러오기</Button>} />
        );
    }

    return (
        // 내 업체 설정
        <div className={styles.page}>
            {/* ① 머리 — 상태 · 영업중 · 마지막 수정 */}
            <div>
                <h1 className={styles.title}>
                    내 업체 설정
                    <Badge tone={suspended ? 'danger' : 'ok'}>{suspended ? '영업중지' : '활성'}</Badge>
                    <Badge tone={store.is_open === 1 ? 'primary' : 'neutral'}>{store.is_open === 1 ? '영업중' : '영업 안 함'}</Badge>
                </h1>
                <p className={styles.subtitle}>마지막 수정 {toKst(store.updated_at, 'YYYY-MM-DD HH:mm')}</p>
            </div>

            {/* ① 영업중지 띠 */}
            {suspended ? <Band tone="danger" title="영업중지된 업체입니다.">사유: {store.suspend_comment ?? '-'}</Band> : null}

            {/* 탭 — 화면 상태 */}
            <Tabs label="내 업체 설정" items={tabs} value={activeTab} onChange={setTab} />

            {/* 지금 탭 */}
            {activeTab === 'profile' ? <StoreProfileTab store={store} onSaved={onSaved} /> : null}
            {activeTab === 'photos' ? <StorePhotosTab store={store} onSaved={onSaved} /> : null}
            {activeTab === 'hours' ? <StoreHoursTab store={store} onSaved={onSaved} /> : null}
            {activeTab === 'policy' ? <StorePolicyTab store={store} onSaved={onSaved} /> : null}
            {activeTab === 'unavailable' ? <StoreUnavailableTab /> : null}
            {activeTab === 'door' ? <StoreDoorTab store={store} onSaved={onSaved} /> : null}
        </div>
    );
}
```

### 1-1. 기본 정보 탭 — `StoreProfileTab`

```tsx
// src/app/manager/(console)/store/_components/StoreProfileTab.tsx
'use client';
import { useContext, useState } from 'react';
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
import styles from '@/app/css/manager/StoreProfileTab.module.css';

type StoreProfileTabProps = {
    store: StoreMineResultDto;        // 내 업체 상세
    onSaved: () => Promise<void>;     // 저장 뒤 다시 읽기
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
                    <dt>업체코드</dt><dd className={styles.mono}>{store.store_code}</dd>
                    <dt>업체 로그인 주소</dt>
                    <dd>
                        <div className={styles.loginUrl}><code>{loginUrl}</code><CopyButton text={loginUrl} label="로그인 주소 복사" size="sm" /></div>
                        <p className={styles.hint}>업체 관리자에게 이 주소를 알려 주세요 — 업체 관리자 등록 문자에는 업체코드만 가고 로그인 주소는 가지 않습니다.</p>
                    </dd>
                    <dt>상태</dt><dd><Badge tone={store.store_state_id === 'SUSPEND' ? 'danger' : 'ok'}>{store.store_state_id === 'SUSPEND' ? '영업중지' : '활성'}</Badge></dd>
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
```

### 1-2. 사진 탭 — `StorePhotosTab`

`ImageUploader` 는 `onUpload` 가 던진 오류를 다시 던진다(`src/shared/components/upload/ImageUploader.tsx:77-86`) — 이 탭이 잡아 `handleApiError` 한다.

```tsx
// src/app/manager/(console)/store/_components/StorePhotosTab.tsx
'use client';
import { useContext, useState } from 'react';
import { deleteMyStoreFile, issueMyStoreFileUrl, registerMyStoreFile, reorderMyStoreFiles } from '@/contracts/store/api';
import { StoreMineFileOrderDto } from '@/contracts/store/dto/store-mine-file-order.dto';
import { StoreMineFileUploadUrlDto } from '@/contracts/store/dto/store-mine-file-upload-url.dto';
import { StoreMineFileDto, StoreMineFileResultDto } from '@/contracts/store/dto/store-mine-file.dto';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { handleApiError } from '@/shared/api/error';
import { uploadFile, UploadStepsType } from '@/shared/api/upload';
import ImageUploader, { UploaderImageType } from '@/shared/components/upload/ImageUploader';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { STORE_FILE_PURPOSE, STORE_IMAGE_MAX } from '../store-settings-format';
import styles from '@/app/css/manager/StorePhotosTab.module.css';

type StorePhotosTabProps = {
    store: StoreMineResultDto;    // 내 업체 상세 — files
    onSaved: () => Promise<void>; // 올리기 · 순서 · 삭제 뒤 다시 읽기
};

/**
 * 사진 탭 — 업체 사진(5장 · 첫 장 대표) 올리기 · 끌어서 순서 · 삭제, 사업자등록증은 보기만
 *
 * @param param0
 * @returns
 */
export default function StorePhotosTab({store, onSaved}: StorePhotosTabProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [busy, setBusy] = useState<boolean>(false);                 // 순서 · 삭제 중
    const [deleting, setDeleting] = useState<string | null>(null);    // 지울 사진 ID — 확인 창

    // 계산 값
    const images: Array<UploaderImageType> = store.files
        .filter((file) => file.store_file_purpose_id === STORE_FILE_PURPOSE.IMAGE)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((file) => ({id: file.store_file_id, image_url: file.file_url, alt: file.file_name})); // ① 업체 사진 — 순서대로
    const license = store.files.find((file) => file.store_file_purpose_id === STORE_FILE_PURPOSE.LICENSE) ?? null; // ⑤ 사업자등록증

    // 함수
    async function upload(file: File): Promise<void> {
        // ② 업로드 주소 발급 → PUT → 등록(큐) → 다시 읽기 — 실패는 여기서 안내(부품이 다시 던지지 않게)
        const steps: UploadStepsType<StoreMineFileResultDto> = {
            issue: (content_type) => issueMyStoreFileUrl(auth, Object.assign(new StoreMineFileUploadUrlDto(), {content_type})),
            register: (uploaded) => registerMyStoreFile(auth, Object.assign(new StoreMineFileDto(), uploaded)),
        };
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await uploadFile(file, steps);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
        }
        await onSaved();
    }

    async function reorder(ids: Array<string>): Promise<void> {
        // ③ 사진 ID 전부를 바꾼 순서로 저장(큐) → 다시 읽기(실패해도 서버 순서로 되돌린다)
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await reorderMyStoreFiles(auth, Object.assign(new StoreMineFileOrderDto(), {store_file_ids: ids}));
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
        }
        await onSaved();
        setBusy(false);
    }

    async function confirmDelete(): Promise<void> {
        // ④ 확인 뒤 삭제(큐) → 다시 읽기
        const target = deleting;
        if (!target) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteMyStoreFile(auth, target);
        } catch (error) {
            failure = {error};
        }

        setDeleting(null);
        if (failure) {
            handleApiError(failure.error);
        }
        await onSaved();
        setBusy(false);
    }

    return (
        // 사진
        <div className={styles.tab}>
            {/* ①②③④ 업체 사진 */}
            <Card title={`업체 사진 ${images.length} / ${STORE_IMAGE_MAX}`}>
                <p className={styles.hint}>끌어서 순서를 바꾸면 그 순서로 저장합니다. 첫 번째가 대표 사진(이용자 화면 지도 · 목록에 나옵니다).</p>
                <ImageUploader images={images} max={STORE_IMAGE_MAX} onUpload={upload} onDelete={setDeleting} onReorder={reorder} disabled={busy} />
                <p className={styles.hint}>입점 승인 때 넘어온 사진도 5장에 포함됩니다.</p>
            </Card>

            {/* ⑤ 사업자등록증 — 보기만 */}
            <Card title="사업자등록증" actions={<Badge>보기만</Badge>}>
                {license ? (
                    <div className={styles.license}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- 10분짜리 서명 주소(next/image 원격 허용 밖) */}
                        <img className={styles.licenseImage} src={license.file_url} alt="사업자등록증" />
                        <div className={styles.licenseText}>
                            <b>{license.file_name}</b>
                            <span className={styles.hint}>등록 {toKst(license.created_at, 'YYYY-MM-DD')} · 비공개 파일 — 열어 보기 주소는 10분 동안만 열립니다.</span>
                            <a className={styles.open} href={license.file_url} target="_blank" rel="noopener noreferrer">열어 보기</a>
                            <span className={styles.hint}>바꾸거나 지울 수 없습니다. 바꿔야 하면 총관리자에게 요청합니다.</span>
                        </div>
                    </div>
                ) : <p className={styles.hint}>사업자등록증이 없습니다.</p>}
            </Card>

            {/* ④ 삭제 확인 */}
            <ConfirmModal open={deleting !== null} title="사진 지우기" message="이 사진을 지울까요?" confirmLabel="지우기" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </div>
    );
}
```

### 1-3. 영업시간 · 브레이크 탭 — `StoreHoursTab`

표 · 줄의 칸 오류는 칸 이름을 백엔드 점 경로(`hours.3.close_time` · `breaks.1.end_time`)로 둔다 — 화면 검사(`validateActionRows`)와 큐 failed 의 `validation_errors` 가 같은 칸에 붙는다(지침서 M7 "점 경로를 그 요일 칸 아래에").

```tsx
// src/app/manager/(console)/store/_components/StoreHoursTab.tsx
'use client';
import { useContext, useState } from 'react';
import { updateMyStoreBreaks, updateMyStoreHours } from '@/contracts/store/api';
import { StoreMineBreakDto, StoreMineBreaksDto } from '@/contracts/store/dto/store-mine-breaks.dto';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import Table from '@/shared/components/ui/display/Table';
import FieldError from '@/shared/components/ui/form/FieldError';
import Input from '@/shared/components/ui/form/Input';
import Switch from '@/shared/components/ui/form/Switch';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { resetValidationError, validateActionRows } from '@/shared/utils/validation';
import { BREAK_MAX, BreakRowType, DAY_NAMES, HourRowType, hourRowsOf, overnightLabel, toHoursDto } from '../store-settings-format';
import styles from '@/app/css/manager/StoreHoursTab.module.css';

type StoreHoursTabProps = {
    store: StoreMineResultDto;    // 내 업체 상세 — is_always_open · hours · breaks
    onSaved: () => Promise<void>; // 저장 뒤 다시 읽기
};

/**
 * 영업시간 · 브레이크 탭 — 둘 다 통째로 저장(보낸 목록이 전부)
 *
 * @param param0
 * @returns
 */
export default function StoreHoursTab({store, onSaved}: StoreHoursTabProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [alwaysOpen, setAlwaysOpen] = useState<boolean>(store.is_always_open === 1);                                                    // ① 24시간 연중무휴
    const [hours, setHours] = useState<Array<HourRowType>>(() => hourRowsOf(store.hours));                                                 // ① 일 ~ 토 7줄
    const [breaks, setBreaks] = useState<Array<BreakRowType>>(() => store.breaks.map((item) => ({start_time: item.start_time, end_time: item.end_time}))); // ③ 브레이크 줄
    const [saving, setSaving] = useState<'hours' | 'breaks' | null>(null);                                                                 // 저장 중인 카드

    // 함수
    function changeHour(index: number, patch: Partial<HourRowType>): void {
        // 한 요일 줄 고치기
        setHours((rows) => rows.map((row, at) => (at === index ? {...row, ...patch} : row)));
    }

    function changeBreak(index: number, patch: Partial<BreakRowType>): void {
        // 한 브레이크 줄 고치기
        setBreaks((rows) => rows.map((row, at) => (at === index ? {...row, ...patch} : row)));
    }

    async function saveHours(): Promise<void> {
        // ② 휴무가 아닌 요일 시각 검사(그 요일 칸 아래) → 영업시간 통째로 저장(큐) → 다시 읽기
        const dto = toHoursDto(alwaysOpen, hours);
        resetValidationError();
        if (saving || !(await validateActionRows(dto.hours, 'hours', false))) {
            return;
        }

        setSaving('hours');
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateMyStoreHours(auth, dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setSaving(null);
            handleApiError(failure.error);
            return;
        }

        await onSaved();
        setSaving(null);
    }

    async function saveBreaks(): Promise<void> {
        // ④ 줄 검사(칸 아래) → 브레이크 통째로 저장(큐 — 빈 목록이면 모두 지움) → 다시 읽기
        const rows = breaks.map((row) => Object.assign(new StoreMineBreakDto(), row));
        resetValidationError();
        if (saving || !(await validateActionRows(rows, 'breaks', false))) {
            return;
        }

        setSaving('breaks');
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateMyStoreBreaks(auth, Object.assign(new StoreMineBreaksDto(), {breaks: rows}));
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setSaving(null);
            handleApiError(failure.error);
            return;
        }

        await onSaved();
        setSaving(null);
    }

    return (
        // 영업시간 · 브레이크
        <div className={styles.cols}>
            {/* ①② 영업시간 */}
            <Card title="영업시간" actions={<span className={styles.switchLabel}>24시간 연중무휴<Switch label="24시간 연중무휴" checked={alwaysOpen} onChange={setAlwaysOpen} /></span>}>
                {alwaysOpen ? <p className={styles.alwaysOpen}>24시간 연중무휴로 영업합니다.</p> : (
                    <Table>
                        <thead><tr><th scope="col">요일</th><th scope="col">휴무</th><th scope="col">여는 시각</th><th scope="col">닫는 시각</th><th scope="col"><span className={styles.srOnly}>안내</span></th></tr></thead>
                        <tbody>
                            {hours.map((row, index) => (
                                <tr key={row.day_of_week}>
                                    <th scope="row">{DAY_NAMES[row.day_of_week]}</th>
                                    <td><Switch label={`${DAY_NAMES[row.day_of_week]}요일 휴무`} checked={row.is_closed} onChange={(checked) => changeHour(index, {is_closed: checked})} /></td>
                                    <td>
                                        <Input type="time" className={styles.time} aria-label={`${DAY_NAMES[row.day_of_week]}요일 여는 시각`} disabled={row.is_closed} value={row.open_time} onChange={(event) => changeHour(index, {open_time: event.target.value})} />
                                        <FieldError name={`hours.${index}.open_time`} />
                                    </td>
                                    <td>
                                        <Input type="time" className={styles.time} aria-label={`${DAY_NAMES[row.day_of_week]}요일 닫는 시각`} disabled={row.is_closed} value={row.close_time} onChange={(event) => changeHour(index, {close_time: event.target.value})} />
                                        <FieldError name={`hours.${index}.close_time`} />
                                    </td>
                                    <td className={styles.muted}>{row.is_closed ? <Badge>휴무</Badge> : overnightLabel(row.open_time, row.close_time)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
                <div className={styles.footer}>
                    <span className={styles.hint}>7요일을 통째로 저장합니다. 24시간을 켜면 요일 표를 숨기고 빈 목록으로 보냅니다.</span>
                    <Button variant="primary" disabled={saving !== null} onClick={saveHours}>{saving === 'hours' ? '처리 중…' : '영업시간 저장'}</Button>
                </div>
            </Card>

            {/* ③④ 브레이크타임 */}
            <Card title={`브레이크타임 ${breaks.length} / ${BREAK_MAX}`}>
                <p className={styles.hint}>매일 같은 시각에 예약을 받지 않습니다. 서로 겹치면 안 되고(끝점이 맞닿는 것은 됩니다), 마감이 시작보다 이르면 다음 날까지입니다.</p>
                <div className={styles.breaks}>
                    {breaks.map((row, index) => (
                        // eslint-disable-next-line react/no-array-index-key -- 줄은 ID 가 없고 순서가 곧 칸 이름(breaks.<줄>)
                        <div key={index} className={styles.breakRow}>
                            <div><Input type="time" className={styles.time} aria-label={`브레이크 ${index + 1} 시작 시각`} value={row.start_time} onChange={(event) => changeBreak(index, {start_time: event.target.value})} /><FieldError name={`breaks.${index}.start_time`} /></div>
                            <span className={styles.muted}>~</span>
                            <div><Input type="time" className={styles.time} aria-label={`브레이크 ${index + 1} 마감 시각`} value={row.end_time} onChange={(event) => changeBreak(index, {end_time: event.target.value})} /><FieldError name={`breaks.${index}.end_time`} /></div>
                            <span className={styles.muted}>{overnightLabel(row.start_time, row.end_time)}</span>
                            <Button size="sm" variant="danger" icon aria-label={`브레이크 ${index + 1} 삭제`} onClick={() => setBreaks((rows) => rows.filter((_, at) => at !== index))}>×</Button>
                        </div>
                    ))}
                </div>
                <div className={styles.footer}>
                    <Button disabled={breaks.length >= BREAK_MAX} onClick={() => setBreaks((rows) => [...rows, {start_time: '', end_time: ''}])}>브레이크 추가</Button>
                    <Button variant="primary" disabled={saving !== null} onClick={saveBreaks}>{saving === 'breaks' ? '처리 중…' : '브레이크 저장'}</Button>
                </div>
            </Card>
        </div>
    );
}
```

### 1-4. 운영 규정 탭 — `StorePolicyTab`

영업중은 스위치를 바꾸면 바로 저장한다(spec 결정 — 시안). 요약 문장은 지금 저장된 값(`store`)으로 쓴다.

```tsx
// src/app/manager/(console)/store/_components/StorePolicyTab.tsx
'use client';
import { useContext, useState } from 'react';
import { updateMyStoreMaintenance, updateMyStoreOpen, updateMyStorePolicy } from '@/contracts/store/api';
import { StoreMineMaintenanceDto } from '@/contracts/store/dto/store-mine-maintenance.dto';
import { StoreMineOpenDto } from '@/contracts/store/dto/store-mine-open.dto';
import { StoreMineReservationPolicyDto } from '@/contracts/store/dto/store-mine-reservation-policy.dto';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Switch from '@/shared/components/ui/form/Switch';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import { numberOf, policySummary } from '../store-settings-format';
import styles from '@/app/css/manager/StorePolicyTab.module.css';

type StorePolicyTabProps = {
    store: StoreMineResultDto;    // 내 업체 상세 — is_open · maintenance_minutes · 규정
    onSaved: () => Promise<void>; // 저장 뒤 다시 읽기
};

/**
 * 운영 규정 탭 — 영업중(바로 저장) · 정비시간 · 예약 · 환불 규정, 저장 단위가 셋이라 카드도 셋
 *
 * @param param0
 * @returns
 */
export default function StorePolicyTab({store, onSaved}: StorePolicyTabProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [maintenance, setMaintenance] = useState<string>(String(store.maintenance_minutes));       // ② 정비시간(분)
    const [openHours, setOpenHours] = useState<string>(String(store.booking_open_hours));           // ③ 예약 가능 시작(시간)
    const [deadline, setDeadline] = useState<string>(String(store.refund_deadline_minutes));        // ③ 100% 환불 마감(분)
    const [latePercent, setLatePercent] = useState<string>(String(store.late_refund_percent));      // ③ 마감 뒤 환불 비율(%)
    const [saving, setSaving] = useState<'open' | 'maintenance' | 'policy' | null>(null);          // 저장 중인 카드

    // 계산 값
    const summary = policySummary(store.booking_open_hours, store.refund_deadline_minutes, store.late_refund_percent); // ③ 지금 규정 한 문장

    // 함수
    async function send(kind: 'open' | 'maintenance' | 'policy', call: () => Promise<null>): Promise<void> {
        // 저장(큐) 공통 — 실패면 안내, 끝나면 다시 읽기(①②③)
        setSaving(kind);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await call();
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
        }
        await onSaved();
        setSaving(null);
    }

    async function toggleOpen(checked: boolean): Promise<void> {
        // ① 영업중 — 바꾸면 바로 저장
        if (saving) {
            return;
        }

        await send('open', () => updateMyStoreOpen(auth, Object.assign(new StoreMineOpenDto(), {is_open: checked ? 1 : 0})));
    }

    async function saveMaintenance(): Promise<void> {
        // ② 정비시간 검사 → 저장
        const dto = Object.assign(new StoreMineMaintenanceDto(), {maintenance_minutes: numberOf(maintenance)});
        if (saving || !(await validateAction(dto))) {
            return;
        }

        await send('maintenance', () => updateMyStoreMaintenance(auth, dto));
    }

    async function savePolicy(): Promise<void> {
        // ③ 예약 · 환불 규정 검사 → 저장
        const dto = Object.assign(new StoreMineReservationPolicyDto(), {booking_open_hours: numberOf(openHours), refund_deadline_minutes: numberOf(deadline), late_refund_percent: numberOf(latePercent)});
        if (saving || !(await validateAction(dto))) {
            return;
        }

        await send('policy', () => updateMyStorePolicy(auth, dto));
    }

    return (
        // 운영 규정
        <div className={styles.tab}>
            <div className={styles.cols}>
                {/* ① 영업중 */}
                <Card title="영업중" actions={<Switch label="영업중" checked={store.is_open === 1} disabled={saving !== null} onChange={toggleOpen} />}>
                    <p className={styles.hint}>끄면 영업시간 · 24시간 설정과 관계없이 새 예약을 받지 않습니다. 바꾸면 바로 저장합니다.</p>
                </Card>

                {/* ② 정비시간 */}
                <Card title="정비시간">
                    <Field label="퇴실 뒤 다음 이용까지 호실을 막는 시간" name="maintenance_minutes" htmlFor="store-maintenance" hint="예약 현황 막대 뒤 점선 꼬리(점유 끝)가 이 시간입니다.">
                        <span className={styles.unit}><Input id="store-maintenance" type="number" inputMode="numeric" min={0} max={240} value={maintenance} onChange={(event) => setMaintenance(event.target.value)} /><span>분 (0 ~ 240)</span></span>
                    </Field>
                    <div className={styles.actions}><Button variant="primary" disabled={saving !== null} onClick={saveMaintenance}>{saving === 'maintenance' ? '처리 중…' : '저장'}</Button></div>
                </Card>
            </div>

            {/* ③ 예약 · 환불 규정 */}
            <Card title="예약 · 환불 규정">
                <Band tone="info">예약할 때의 환불 마감 · 비율을 예약에 저장하므로, 바꿔도 이미 받은 예약은 그때 규정을 따릅니다.</Band>
                <div className={styles.grid}>
                    <Field label="예약 가능 시작" name="booking_open_hours" htmlFor="store-open-hours" hint="1 ~ 4,320시간">
                        <span className={styles.unit}><span>이용 시작</span><Input id="store-open-hours" type="number" inputMode="numeric" value={openHours} onChange={(event) => setOpenHours(event.target.value)} /><span>시간 전부터</span></span>
                    </Field>
                    <Field label="100% 환불 마감" name="refund_deadline_minutes" htmlFor="store-deadline" hint="0 ~ 10,080분">
                        <span className={styles.unit}><span>이용 시작</span><Input id="store-deadline" type="number" inputMode="numeric" value={deadline} onChange={(event) => setDeadline(event.target.value)} /><span>분 전까지</span></span>
                    </Field>
                    <Field label="마감 뒤 환불 비율" name="late_refund_percent" htmlFor="store-late-percent">
                        <span className={styles.unit}><Input id="store-late-percent" type="number" inputMode="numeric" value={latePercent} onChange={(event) => setLatePercent(event.target.value)} /><span>%</span></span>
                    </Field>
                </div>
                <p className={styles.summary}>지금 규정: {summary}</p>
                <div className={styles.actions}><Button variant="primary" disabled={saving !== null} onClick={savePolicy}>{saving === 'policy' ? '처리 중…' : '저장'}</Button></div>
            </Card>
        </div>
    );
}
```

### 1-5. 일시 예약불가 탭 — `StoreUnavailableTab`

목록은 이 탭만 쓰므로 탭이 직접 불러온다(형제 — 내 예약 목록 `src/app/(user)/reservation/MyReservationContent.tsx:39-61`의 쪽 · 효과 모양).

```tsx
// src/app/manager/(console)/store/_components/StoreUnavailableTab.tsx
'use client';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { createMyUnavailablePeriod, deleteMyUnavailablePeriod, getMyUnavailablePeriods } from '@/contracts/store/api';
import { StoreMineUnavailablePeriodListDto, StoreMineUnavailablePeriodListResultDto } from '@/contracts/store/dto/store-mine-unavailable-period-list.dto';
import { StoreMineUnavailablePeriodDto } from '@/contracts/store/dto/store-mine-unavailable-period.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { toPeriodText } from '../store-settings-format';
import styles from '@/app/css/manager/StoreUnavailableTab.module.css';

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 메모 최대 글자 수 — StoreMineUnavailablePeriodDto */
const MEMO_MAX = 30;

/**
 * 일시 예약불가 탭 — 끝나지 않은 기간 목록(시작 순) · 추가 · 삭제
 *
 * @returns
 */
export default function StoreUnavailableTab(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰
    const loadPage = useEffectEvent((page: number, signal: AbortSignal) => getMyUnavailablePeriods(auth, new StoreMineUnavailablePeriodListDto({page, size: PAGE_SIZE}), signal)); // 그때의 auth 로

    // 상태
    const [page, setPage] = useState<number>(1);                                                  // 보는 쪽
    const [reloadKey, setReloadKey] = useState<number>(0);                                        // 다시 불러오기(추가 · 삭제 뒤)
    const [result, setResult] = useState<StoreMineUnavailablePeriodListResultDto | null>(null);   // ① 목록
    const [startsAt, setStartsAt] = useState<string>('');                                         // ② 시작 일시(달력 칸)
    const [endsAt, setEndsAt] = useState<string>('');                                             // ② 종료 일시(달력 칸)
    const [memo, setMemo] = useState<string>('');                                                 // ② 메모
    const [busy, setBusy] = useState<boolean>(false);                                             // 추가 · 삭제 중
    const [deleting, setDeleting] = useState<string | null>(null);                                // 지울 기간 ID — 확인 창

    // 효과
    useEffect(() => {
        // ① 그 쪽 목록(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadPage(page, controller.signal).then((next) => {
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
    }, [page, reloadKey]);

    // 함수
    function reloadFirstPage(): void {
        // ④ 1쪽 다시
        setPage(1);
        setReloadKey((key) => key + 1);
    }

    async function add(): Promise<void> {
        // ② 일시를 "날짜 시각" 모양으로 바꿔 검사 → 등록(큐) → ④ 칸 비우고 1쪽 다시
        const dto = Object.assign(new StoreMineUnavailablePeriodDto(), {starts_at: toPeriodText(startsAt), ends_at: toPeriodText(endsAt), memo: memo.trim() || undefined});
        if (busy || !(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await createMyUnavailablePeriod(auth, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        setStartsAt('');
        setEndsAt('');
        setMemo('');
        reloadFirstPage();
    }

    async function confirmDelete(): Promise<void> {
        // ③ 확인 뒤 삭제(큐) → ④ 1쪽 다시
        const target = deleting;
        if (!target) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteMyUnavailablePeriod(auth, target);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setDeleting(null);
        if (failure) {
            handleApiError(failure.error);
        }
        reloadFirstPage();
    }

    return (
        // 일시 예약불가
        <div className={styles.tab}>
            {/* ② 추가 */}
            <Card title="일시 예약불가 추가">
                <p className={styles.hint}>이 기간에는 업체 전체가 예약을 받지 않습니다. 종료 일시부터 다시 받습니다.</p>
                <div className={styles.form}>
                    <Field label="시작 일시" name="starts_at" htmlFor="unavailable-start"><Input id="unavailable-start" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></Field>
                    <Field label="종료 일시" name="ends_at" htmlFor="unavailable-end"><Input id="unavailable-end" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></Field>
                    <Field label="메모(선택 · 30자)" name="memo" htmlFor="unavailable-memo"><Input id="unavailable-memo" maxLength={MEMO_MAX} value={memo} onChange={(event) => setMemo(event.target.value)} /></Field>
                    <Button variant="primary" disabled={busy} onClick={add}>추가</Button>
                </div>
            </Card>

            {/* ① 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="예정된 일시 예약불가가 없습니다." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">시작</th><th scope="col">종료</th><th scope="col">메모</th><th scope="col">등록일</th><th scope="col">작업</th></tr></thead>
                    <tbody>
                        {result.list.map((item) => (
                            <tr key={item.store_unavailable_period_id}>
                                <td className={styles.number}>{toKst(item.starts_at, 'YYYY-MM-DD HH:mm')}</td>
                                <td className={styles.number}>{toKst(item.ends_at, 'YYYY-MM-DD HH:mm')}</td>
                                <td>{item.memo ?? '-'}</td>
                                <td className={`${styles.number} ${styles.muted}`}>{toKst(item.created_at, 'YYYY-MM-DD')}</td>
                                <td><Button size="sm" variant="danger" disabled={busy} onClick={() => setDeleting(item.store_unavailable_period_id)}>삭제</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="일시 예약불가 페이지" />

            {/* ③ 삭제 확인 */}
            <ConfirmModal open={deleting !== null} title="일시 예약불가 지우기" message="이 기간을 지울까요? 지우면 그 기간에도 예약을 받습니다." confirmLabel="지우기" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </div>
    );
}
```

### 1-6. 문 연동 탭 — `StoreDoorTab`

```tsx
// src/app/manager/(console)/store/_components/StoreDoorTab.tsx
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
    const [secret, setSecret] = useState<string>('');       // 새 시크릿
    const [saving, setSaving] = useState<boolean>(false);   // 저장 중

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
```

---

## 2. 계산 함수 — `src/app/manager/(console)/store/store-settings-format.ts`

spec 계산 규칙 4개(영업시간 보낼 값 · 다음 날 표시 · 일시 예약불가 일시 글자 · 규정 요약 문장) + 탭 · 요일 이름 · 화면 상수. React 를 쓰지 않는다.

```ts
// src/app/manager/(console)/store/store-settings-format.ts
import { StoreMineHourDto, StoreMineHoursDto } from '@/contracts/store/dto/store-mine-hours.dto';
import { StoreMineHourItemResultDto } from '@/contracts/store/dto/store-mine.dto';
import { TabItemType } from '@/shared/components/ui/nav/Tabs';

/** 내 업체 설정 탭 */
export type StoreTabType = 'profile' | 'photos' | 'hours' | 'policy' | 'unavailable' | 'door';

/** 탭 6개 — 문 연동은 업체 총관리자에게만(머리가 거른다) */
export const STORE_TABS: Array<TabItemType<StoreTabType>> = [
    {value: 'profile', label: '기본 정보'},
    {value: 'photos', label: '사진'},
    {value: 'hours', label: '영업시간 · 브레이크'},
    {value: 'policy', label: '운영 규정'},
    {value: 'unavailable', label: '일시 예약불가'},
    {value: 'door', label: '문 연동'},
];

/** 요일 이름 — 0 일 ~ 6 토 */
export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 업체 정보 파일 용도 */
export const STORE_FILE_PURPOSE = {LICENSE: 'BUSINESS_LICENSE', IMAGE: 'STORE_IMAGE'} as const;

/** 업체 사진 최대 장수 — StoreMineFileOrderDto */
export const STORE_IMAGE_MAX = 5;

/** 브레이크타임 최대 개수 — StoreMineBreaksDto */
export const BREAK_MAX = 10;

/** 요일 영업시간 칸 한 줄 */
export type HourRowType = {
    day_of_week: number; // 0 일 ~ 6 토
    is_closed: boolean;  // 휴무
    open_time: string;   // 여는 시각(HH:mm — 비었으면 '')
    close_time: string;  // 닫는 시각
};

/** 브레이크타임 칸 한 줄 */
export type BreakRowType = {
    start_time: string; // 시작 시각(HH:mm)
    end_time: string;   // 마감 시각
};

/**
 * 받은 요일 영업시간 → 일 ~ 토 7줄(없는 요일 · 24시간이라 빈 목록이면 빈 시각의 영업 줄)
 *
 * @param hours 내 업체 상세 hours
 */
export function hourRowsOf(hours: Array<StoreMineHourItemResultDto>): Array<HourRowType> {
    const byDay = new Map(hours.map((hour) => [hour.day_of_week, hour]));
    return DAY_NAMES.map((_, day) => {
        const hour = byDay.get(day);
        return {day_of_week: day, is_closed: hour?.is_closed === 1, open_time: hour?.open_time ?? '', close_time: hour?.close_time ?? ''};
    });
}

/**
 * 영업시간 보낼 값 — 24시간이면 빈 목록, 아니면 일 ~ 토 7개(요일 순), 휴무 요일은 시각 없이
 *
 * @param isAlwaysOpen 24시간 연중무휴
 * @param rows 요일 줄
 */
export function toHoursDto(isAlwaysOpen: boolean, rows: Array<HourRowType>): StoreMineHoursDto {
    const hours = isAlwaysOpen ? [] : [...rows]
        .sort((a, b) => a.day_of_week - b.day_of_week)
        .map((row) => Object.assign(new StoreMineHourDto(), row.is_closed
            ? {day_of_week: row.day_of_week, is_closed: 1}
            : {day_of_week: row.day_of_week, is_closed: 0, open_time: row.open_time, close_time: row.close_time}));
    return Object.assign(new StoreMineHoursDto(), {is_always_open: isAlwaysOpen ? 1 : 0, hours});
}

/**
 * 다음 날 표시 — 닫는 시각이 여는 시각보다 이르거나 같으면 "다음 날 HH:mm까지", 늦거나 비었으면 ''
 *
 * @param openTime 여는 · 시작 시각(HH:mm)
 * @param closeTime 닫는 · 마감 시각(HH:mm)
 */
export function overnightLabel(openTime: string, closeTime: string): string {
    if (!openTime || !closeTime) {
        return '';
    }

    return closeTime <= openTime ? `다음 날 ${closeTime}까지` : '';
}

/**
 * 일시 예약불가 일시 글자 — 달력 칸 값(YYYY-MM-DDTHH:mm[:ss]) → 백엔드 모양(YYYY-MM-DD HH:mm), 빈 값은 ''
 *
 * @param value datetime-local 칸 값
 */
export function toPeriodText(value: string): string {
    return value ? value.replace('T', ' ').slice(0, 16) : '';
}

/**
 * 규정 요약 문장 — 예약 시작(하루 단위면 일수) · 100% 환불 마감 · 마감 뒤 비율(0 이면 환불 없이 취소)
 *
 * @param bookingOpenHours 예약 가능 시작(시간)
 * @param refundDeadlineMinutes 100% 환불 마감(분)
 * @param lateRefundPercent 마감 뒤 환불 비율(%)
 */
export function policySummary(bookingOpenHours: number, refundDeadlineMinutes: number, lateRefundPercent: number): string {
    const days = bookingOpenHours % 24 === 0 ? `(${(bookingOpenHours / 24).toLocaleString('ko-KR')}일)` : '';
    const late = lateRefundPercent === 0 ? '그 뒤 시작 전까지 취소하면 환불 없이 취소됩니다.' : `그 뒤 시작 전까지 취소하면 ${lateRefundPercent}%를 환불합니다.`;
    return `이용 시작 ${bookingOpenHours.toLocaleString('ko-KR')}시간${days} 전부터 예약을 받고, 시작 ${refundDeadlineMinutes.toLocaleString('ko-KR')}분 전까지 취소하면 전액, ${late}`;
}

/**
 * 숫자 칸 값 → DTO 숫자 — 비었으면 undefined(IsNotEmpty 문구), 숫자가 아니면 NaN(IsInt 문구)
 *
 * @param value 칸 값
 */
export function numberOf(value: string): number | undefined {
    return value.trim() === '' ? undefined : Number(value);
}
```

---

## 3. 공용 부품 · 규약만으로 예측할 수 없는 부분

### 3-1. 줄 단위 검사 — `validateActionRows` (`src/shared/utils/validation.ts`)

`validateAction(부모 DTO)` 는 중첩 DTO 오류를 칸에 붙이지 못한다(부모 오류는 `constraints` 가 없어 `toValidationErrors` 가 건너뛴다 — `src/shared/utils/validation.ts:65-78`). 줄마다 검사하고 칸 이름을 백엔드 점 경로로 붙여, 화면 검사와 큐 failed 의 `validation_errors`(`hours.3.close_time`)가 같은 span 을 쓴다(`findValidationAlert` 는 점이 든 이름을 escape 한다 — 같은 파일 `:11-23`). `validateActionChildren(dto, key)`(미적용)는 이 규칙으로 대신한다.

```ts
// src/shared/utils/validation.ts — 더함
import { validate } from 'class-validator';

/**
 * 줄마다 Validation 체크 — 칸 이름은 `<path>.<줄>.<필드>`(백엔드 점 경로와 같다 — hours.3.close_time)
 * - 표 · 줄 목록(영업시간 · 브레이크)처럼 같은 DTO 가 여러 줄일 때. 맞는 칸이 없으면 첫 오류를 팝업으로
 *
 * @param dtos 줄 DTO 들(순서 = 줄 번호)
 * @param path 목록 칸 이름(hours · breaks)
 * @param reset 기존 오류 표시를 지울지
 */
export async function validateActionRows(dtos: Array<object>, path: string, reset: boolean = true): Promise<boolean> {
    if (reset) {
        resetValidationError();
    }

    const errors: Array<ValidationErrorType> = [];
    for (const [index, dto] of dtos.entries()) {
        const found = toValidationErrors(await validate(dto));
        errors.push(...found.map((error) => ({...error, property: `${path}.${index}.${error.property}`})));
    }

    if (errors.length === 0) {
        return true;
    }

    if (showValidationErrors(errors) === 0) {
        showErrorPopup(errors[0].message);
    }
    return false;
}
```

### 3-2. 라벨 없는 칸의 오류 — `FieldError` (`src/shared/components/ui/form/FieldError.tsx`)

표 칸 · 줄 칸은 라벨을 따로 그리지 않고(`aria-label`) 오류 span 만 필요하다 — `Field` 의 span 을 부품으로 빼 `Field` 도 이걸 그린다(같은 모양 한 곳).

```tsx
// src/shared/components/ui/form/FieldError.tsx
import styles from '@/shared/css/ui/form/Field.module.css';

type FieldErrorProps = {
    name: string;     // 칸 이름 — data-id(백엔드 점 경로 hours.3.close_time 도 된다)
    dataKey?: string; // 중첩 DTO 키 — validateActionChildren 의 key
};

/**
 * 칸 오류 span — validation.ts 가 채우고 지운다(Field 안 · 표 칸 · 줄 칸)
 *
 * @param param0
 * @returns
 */
export default function FieldError({name, dataKey}: FieldErrorProps): React.ReactNode {
    return (
        // 오류 span
        <span className={styles.error} data-type="validation-alert" data-id={name} data-key={dataKey} />
    );
}

// src/shared/components/ui/form/Field.tsx — 오류 span 두 곳을 <FieldError name={name} dataKey={dataKey} /> 로
```

### 3-3. 업체 로그인 주소를 매니저 쪽으로 — `managerLoginUrl` · `storeConsoleLoginUrl`

입점 신청(U11)과 내 업체 설정 두 곳에서 쓰게 되어(AGENTS.md "두 곳 이상 → 옮긴다") `src/app/(user)/store-applications/store-application-format.ts:22-40` 의 두 함수를 `src/app/manager/manager-auth.ts` 로 옮긴다 — 업체 로그인 주소(`managerStorePath`)와 같은 파일. 본문은 그대로, U11 의 `ApplicationCard.tsx` · `StoreApplicationDetailContent.tsx` import 를 고치고, 테스트 3건(`store-application-format.test.ts` 의 `managerLoginUrl`)을 `src/test/app/manager/manager-auth.test.ts` 로 옮긴다. `store-application-format.ts` 에는 상태 · 파일 용도 · 최대 장수만 남는다.

```ts
// src/app/manager/manager-auth.ts — 옮겨 옴(본문 그대로)
export function managerLoginUrl(storeCode: string, serverUrl: string, basePath: string): string {
    return `${serverUrl.replace(/\/+$/, '')}${basePath}/manager/${encodeURIComponent(storeCode)}/login/`;
}

export function storeConsoleLoginUrl(storeCode: string): string {
    return managerLoginUrl(storeCode, process.env.NEXT_PUBLIC_SERVER_URL ?? '', process.env.NEXT_PUBLIC_LOCAL_SERVER_PREFIX ?? '');
}
```

---

## 4. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| DTO 사본 14개(`store-mine-*`) | 지침서 블록 그대로(`copy-dto.js`), 상대 import(`../../common/pagination.dto`) 유지 | `src/contracts/store/dto/store-mine.dto.ts` |
| `updateMyStoreProfile` · `updateMyStoreMaintenance` · `updateMyStoreOpen` · `updateMyStorePolicy` · `updateMyDoorSecret`(`Promise<null>`) | `withAuth` + `callQueue<null>` PATCH `/admin-service/store/mine/profile` · `/maintenance` · `/open` · `/reservation-policy` · `/door-secret` | `src/contracts/manager/api.ts` `changeManagerPassword` |
| `updateMyStoreHours` · `updateMyStoreBreaks` · `reorderMyStoreFiles`(`Promise<null>`) | `withAuth` + `callQueue<null>` PUT `/admin-service/store/mine/hours` · `/breaks` · `/file/order` | 같음 |
| `issueMyStoreFileUrl(auth, dto)` | 업로드 주소는 **동기** — `withAuth` + `request` POST `/admin-service/store/mine/file/upload-url` | `src/contracts/store/api.ts` `issueStoreApplicationFileUrl` |
| `registerMyStoreFile(auth, dto)` · `deleteMyStoreFile(auth, id)`(`Promise<null>`) | `withAuth` + `callQueue` POST `/file` · DELETE `/file/<id>`(`encodeURIComponent`) | `src/contracts/store/api.ts` `registerStoreApplicationFile` · `deleteStoreApplicationFile` |
| `getMyUnavailablePeriods(auth, query, signal?)` | `withAuth` + `request` GET `/admin-service/store/mine/unavailable-period`(query `page · size`) | `src/contracts/reservation/api.ts` `getMyReservations` |
| `createMyUnavailablePeriod(auth, dto)` · `deleteMyUnavailablePeriod(auth, id)`(`Promise<null>`) | `withAuth` + `callQueue` POST · DELETE `/unavailable-period/<id>` | 같음(`cancelReservation`) |
| `src/app/manager/(console)/store/page.tsx` | 얇은 page — `<StoreSettingsContent />`(로그인 가드는 콘솔 layout) | `src/app/manager/(console)/page.tsx` |

## 5. 스타일 — 시안 값

시안 `frontend/design/manager.html` M7(`.phd` · `.cols` · `.dl` · `.unit` · `.fg` · `.time` · `.swl` · `.img`)을 토큰으로. 크기는 콘솔(`data-area="console"`).

```css
/* StoreSettingsContent.module.css — 머리 */
.page { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.title { margin: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 22px; font-weight: 700; }
.subtitle { margin: 6px 0 0; font-size: 13px; color: var(--muted); }

/* 탭들 공통 모양(각 Store*Tab.module.css) — 시안 .cols · .dl · .unit · .fg */
.cols { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; }
.cols > * { flex: 1 1 420px; min-width: 0; }
.tab { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.dl { margin: 0; display: grid; grid-template-columns: minmax(110px, 160px) 1fr; gap: 12px 16px; font-size: 14px; }
.dl dt { font-size: 13px; font-weight: 700; color: var(--muted); }
.dl dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.mono { font-variant-numeric: tabular-nums; }
.muted { color: var(--muted); }
.hint { margin: 0; font-size: 13px; line-height: 1.6; color: var(--muted); }
.actions { display: flex; justify-content: flex-end; }
.footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.unit { display: flex; align-items: center; gap: 8px; }
.unit input { width: 120px; }
.unit > span { font-size: 14px; color: var(--muted); white-space: nowrap; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.time { width: 120px; }
.summary { margin: 0; padding: 12px 16px; border-radius: var(--radius); background: var(--surface-2); font-size: 13px; line-height: 1.7; }

/* 기본 정보 — 로그인 주소 */
.loginUrl { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.loginUrl code { min-width: 0; padding: 6px 10px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface-2); font-family: inherit; font-size: 13px; overflow-wrap: anywhere; }
.phone { max-width: 240px; }

/* 사진 — 사업자등록증 */
.license { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
.licenseImage { width: 140px; aspect-ratio: 3 / 4; object-fit: cover; border-radius: var(--radius); background: var(--neutral-bg); }
.licenseText { display: flex; flex-direction: column; gap: 8px; min-width: 0; }

/* 영업시간 — 브레이크 줄 · 24시간 */
.switchLabel { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; }
.alwaysOpen { margin: 0; padding: 16px; border-radius: var(--radius); background: var(--surface-2); font-size: 14px; }
.breaks { display: flex; flex-direction: column; gap: 10px; }
.breakRow { display: flex; align-items: flex-start; gap: 8px; }
.srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* 일시 예약불가 — 추가 줄 · 표 숫자 */
.form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
.number { font-variant-numeric: tabular-nums; }
```

## 테스트

spec 의 "결과" 표에서 ✓ 표시된 14건과 "계산 규칙" 표 11건을 그대로 테스트로 옮긴다. 여기에는 추가분만 적는다.

| 종류 | 대상 | 이유 |
|---|---|---|
| 옮긴 테스트 | `managerLoginUrl` 3건 — `store-application-format.test.ts` → `src/test/app/manager/manager-auth.test.ts` | 함수가 옮겨 가므로 테스트도 같은 경로로(새 테스트 아님) |

테스트 파일과 경계 mock:
- 계산 — `src/test/app/manager/(console)/store/store-settings-format.test.ts`(영업시간 보낼 값 3 · 다음 날 표시 3 · 일시 글자 2 · 규정 요약 3)
- 화면 — 탭마다 `src/test/app/manager/(console)/store/_components/Store*Tab.test.tsx`(`@/contracts/store/api` mock, `RootLayoutProvider` 로 매니저 토큰, `onSaved` 는 `vi.fn` — 저장 1번 · 인자 · 다시 읽기 1번 / 검증 실패면 저장 0번 · 칸 옆 `.innerText`). 사진 탭은 `ImageUploader` 를 버튼 두 개짜리로 mock(올리기 · 순서 바꾸기 — dnd 를 jsdom 에서 끌지 않는다), 올리기는 `uploadFile` mock 이 `issue` · `register` 를 부른다(입점 신청 상세 테스트 모양).
- 문 연동 탭 숨김 — `src/test/app/manager/(console)/store/StoreSettingsContent.test.tsx`(`ManagerConsoleContext` 에 업체 관리자 계정 → 탭 5개 · "문 연동" 없음).
- React Compiler 회귀 테스트(`src/test/react-compiler.test.ts`)가 새 컴포넌트를 모두 컴파일하는지 함께 본다.

## 만드는 순서

1. DTO 사본 14개 → `src/contracts/store/api.ts` 함수 14개
2. 계산 함수 + 테스트 — `store-settings-format.ts`(2)
3. 공용 — `validateActionRows`(3-1) · `FieldError` + `Field` 정리(3-2) · `managerLoginUrl` 옮기기 + U11 import · 테스트 옮기기(3-3)
4. 탭 화면 — 기본 정보(1-1) → 사진(1-2) → 영업시간(1-3) → 운영 규정(1-4) → 일시 예약불가(1-5) → 문 연동(1-6) + css + 테스트
5. 머리 · 탭(1-0) + page + css + 테스트
6. `npx next typegen && npx tsc --noEmit` · `npx vitest run`(AGENTS.md 가 허용)
7. 문서 — AGENTS.md(공통 부품 줄에 `FieldError`, Validation 줄에 `validateActionRows` — `validateActionChildren` 대신), `docs/conventions.md`(줄 단위 검사 · 칸 이름 점 경로), `docs/integrations.md`(업체 사진 올리기 — 내 업체)
