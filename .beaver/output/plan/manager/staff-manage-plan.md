# Plan — 업체 관리자 — 목록 · 등록 · 상세 · 계정 관리

> 무엇을·왜는 [spec](../../spec/manager/staff-manage-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 화면마다 비즈니스 로직 전체 ② 규약만으로 예측할 수 없는 부분(업체 총관리자 판단을 한 곳으로)
> **싣지 않는 것** page 껍데기, 지침서 그대로인 DTO 사본, 형제와 같은 contracts 함수 — 따르는 패턴을 표 한 줄로 가리킨다

로드맵 Phase 14 의 남은 유닛(#49 · #50)을 이 plan 하나로 만든다(#48 M2 대시보드는 Phase 10 과 함께 배포 — `facc5f6`). 화면 2개(`/manager/staff` · `/manager/staff/[user_id]`)는 콘솔 틀 안이라 로그인 가드 · 메뉴(`manager-menu.tsx:12` — 업체 총관리자만)는 이미 있다. 계산 규칙(TDD)은 없다(spec 결정).

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/contracts/manager/dto/manager-staff*.dto.ts` 7개(`-delete` · `-detail` · `-list` · `-password-reset` · `-state` · `-update` · 등록) | 신규 | 지침서 `frontend/dto/manager.md` 사본 | 생략 |
| `src/contracts/manager/api.ts` | 수정 | 업체 관리자 API 7개 | 생략 |
| `src/app/manager/(console)/manager-console-context.ts` · `store/StoreSettingsContent.tsx` | 수정 | `isHeadManager(account)` — 업체 총관리자 판단을 한 곳으로 | 아래 2-1 |
| `src/app/manager/(console)/staff/page.tsx` | 신규 | 얇은 page | 생략 |
| `src/app/manager/(console)/staff/StaffListContent.tsx` | 신규 | 목록 · 검색 · 등록 대화상자 | 아래 1-1 |
| `src/app/manager/(console)/staff/_components/StaffFields.tsx` · `staff-format.ts` | 신규 | 등록 대화상자 · 상세가 함께 쓰는 칸(이름 · 휴대폰 · 성별 · 생년월일) · 주소 · 칸 모양 | 아래 1-1 · 2-2 |
| `src/app/manager/(console)/staff/[user_id]/page.tsx` | 신규 | 얇은 page(주소의 회원 ID) | 생략 |
| `src/app/manager/(console)/staff/[user_id]/StaffDetailContent.tsx` · `_components/StaffInfoCard.tsx` | 신규 | 상세 머리 · 계정 정보 수정 | 아래 1-2 |
| `src/app/manager/(console)/staff/[user_id]/_components/StaffAccountCard.tsx` | 신규 | 비밀번호 초기화 · 정지 / 해제 · 삭제(확인 창) | 아래 1-3 |
| `src/app/css/manager/StaffListContent.module.css` · `StaffDetailContent.module.css` · `StaffFields.module.css` | 신규 | 시안 값 | 아래 4 |
| 테스트 — `staff/StaffListContent.test.tsx` · `staff/[user_id]/StaffDetailContent.test.tsx` · `staff-fixture.tsx` | 신규 | spec 8건 | 아래 테스트 |
| `AGENTS.md` | 수정 | Auth 줄 — 콘솔의 업체 총관리자 전용 화면 · 탭은 `isHeadManager(account)` | 만드는 순서 6 |

---

## 1. 비즈니스 로직 — 화면별 코드

쓰기는 Phase 11 · 12 와 같은 모양: 검사 → 큐(`try` 안은 `await` 만, 갈래는 `try` 밖 `send`) → 그 화면 조회를 다시(`reloadKey`). 조회는 효과 안 `.then` · `AbortController`(`src/app/manager/(console)/rooms/RoomsContent.tsx` 와 같다). **두 화면 모두 업체 총관리자가 아니면 조회를 부르지 않는다** — 효과 첫 줄에서 돌아가고, 화면은 안내만(spec 결정).

### 1-1. 업체 관리자 목록 — `StaffListContent` · `StaffFields`

```tsx
// src/app/manager/(console)/staff/StaffListContent.tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { AUTH_ID } from '@/contracts/common/roles';
import { createManagerStaff, getManagerStaffs } from '@/contracts/manager/api';
import { ManagerStaffListDto, ManagerStaffListResultDto } from '@/contracts/manager/dto/manager-staff-list.dto';
import { ManagerStaffDto, ManagerStaffResultDto } from '@/contracts/manager/dto/manager-staff.dto';
import { lookupName } from '@/contracts/common/lookup';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Modal from '@/shared/components/ui/modal/Modal';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone, toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { MANAGER_AUTH_BADGE } from '../../manager-auth';
import { isHeadManager, ManagerConsoleContext } from '../manager-console-context';
import StaffFields from './_components/StaffFields';
import { EMPTY_STAFF_FORM, HEAD_MANAGER_ONLY_TITLE, STAFF_STATE_TONE, StaffFormType, staffPath } from './staff-format';
import styles from '@/app/css/manager/StaffListContent.module.css';

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 검색어 · 아이디 최대 글자 수 — ManagerStaffListDto · ManagerStaffDto */
const KEYWORD_MAX = 100;
const LOGIN_ID_MAX = 30;

/**
 * M8 업체 관리자 목록 — 검색 · 표(업체 총관리자 줄은 상세로 가지 않음) · 등록 대화상자. 업체 총관리자만
 *
 * @returns
 */
export default function StaffListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                                                                                     // 매니저 토큰
    const {account} = useContext(ManagerConsoleContext);                                                                                                                                      // 로그인 때 기억한 계정 — 권한
    const router = useRouter();                                                                                                                                                               // 등록 뒤 상세로
    const loadPage = useEffectEvent((page: number, keyword: string, signal: AbortSignal) => getManagerStaffs(auth, new ManagerStaffListDto({page, size: PAGE_SIZE, keyword: keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [keywordInput, setKeywordInput] = useState<string>('');                 // ③ 검색 칸
    const [keyword, setKeyword] = useState<string>('');                           // ③ 제출한 검색어
    const [page, setPage] = useState<number>(1);                                  // 보는 쪽
    const [reloadKey, setReloadKey] = useState<number>(0);                        // ⑤ 다시 불러오기(등록이 늦어졌을 때)
    const [result, setResult] = useState<ManagerStaffListResultDto | null>(null); // ② 목록
    const [creating, setCreating] = useState<boolean>(false);                     // ④ 등록 대화상자
    const [loginId, setLoginId] = useState<string>('');                           // ④ 아이디 칸
    const [form, setForm] = useState<StaffFormType>(EMPTY_STAFF_FORM);            // ④ 이름 · 휴대폰 · 성별 · 생년월일 칸
    const [busy, setBusy] = useState<boolean>(false);                             // 등록 중

    // 계산 값
    const allowed = isHeadManager(account); // ① 업체 총관리자만(모르면 막음)

    // 효과
    useEffect(() => {
        // ② 그 쪽 · 검색어 목록 — 업체 총관리자가 아니면 부르지 않는다(떠나면 결과를 버린다)
        if (!allowed) {
            return;
        }

        const controller = new AbortController();
        loadPage(page, keyword, controller.signal).then((next) => {
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
    }, [allowed, page, keyword, reloadKey]);

    // 함수
    function search(event: React.FormEvent<HTMLFormElement>): void {
        // ③ 검색어로 1쪽
        event.preventDefault();
        setKeyword(keywordInput.trim());
        setPage(1);
    }

    function openCreate(): void {
        // ④ 빈 칸으로 등록 대화상자
        setLoginId('');
        setForm(EMPTY_STAFF_FORM);
        setCreating(true);
    }

    async function create(): Promise<void> {
        // ④ 검사 → 등록(큐) → ⑤ 회원 ID 면 상세로, 늦어지면 닫고 1쪽 다시
        const dto = Object.assign(new ManagerStaffDto(), {login_id: loginId.trim(), name: form.name.trim(), phone: form.phone, gender: form.gender, birth: form.birth});
        if (busy || !(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let created: ManagerStaffResultDto | null = null; // 등록 결과 — 늦어지면 null
        let failure: {error: unknown} | null = null;      // 실패 — 처리는 try 밖에서
        try {
            created = await createManagerStaff(auth, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error); // ⑤ 아이디 · 휴대폰이 겹치면 그 칸 옆
            return;
        }

        if (created) {
            router.push(staffPath(created.user_id));
            return;
        }

        setCreating(false);
        setPage(1);
        setReloadKey((key) => key + 1);
    }

    if (!allowed) {
        return (
            // ① 업체 총관리자만
            <EmptyState title={HEAD_MANAGER_ONLY_TITLE} />
        );
    }

    return (
        // 업체 관리자 목록
        <div className={styles.page}>
            {/* 머리 */}
            <div className={styles.head}>
                <div>
                    <h1 className={styles.title}>업체 관리자</h1>
                    <p className={styles.subtitle}>이 업체 콘솔에 로그인하는 계정입니다. 아이디 · 휴대폰 번호는 업체 안에서 겹칠 수 없습니다.</p>
                </div>
                <Button variant="primary" onClick={openCreate}>업체 관리자 등록</Button>
            </div>

            {/* ③ 검색 */}
            <form role="search" className={styles.search} onSubmit={search}>
                <div className={styles.searchField}>
                    <label className={styles.label} htmlFor="staff-keyword">검색</label>
                    <Input id="staff-keyword" placeholder="아이디 · 이름 · 휴대폰 번호" maxLength={KEYWORD_MAX} value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} />
                </div>
                <Button type="submit">검색</Button>
            </form>

            {/* ② 표 */}
            {result && result.list.length === 0 ? <EmptyState title="검색한 업체 관리자가 없습니다." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">아이디</th><th scope="col">이름</th><th scope="col">휴대폰</th><th scope="col">권한</th><th scope="col">상태</th><th scope="col">비밀번호 변경 필요</th><th scope="col">등록일</th></tr></thead>
                    <tbody>
                        {result.list.map((staff) => {
                            const head = staff.auth_id === AUTH_ID.HEAD_MANAGER;
                            const badge = MANAGER_AUTH_BADGE.get(staff.auth_id);
                            return (
                                <tr key={staff.user_id} className={head ? styles.mine : undefined}>
                                    <td>{head ? <b>{staff.login_id}</b> : <Link href={staffPath(staff.user_id)}>{staff.login_id}</Link>}</td>
                                    <td>{staff.name}</td>
                                    <td className={styles.number}>{staff.phone ? formatPhone(staff.phone) : '—'}</td>
                                    <td>{badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : staff.auth_id}</td>
                                    <td><Badge tone={STAFF_STATE_TONE[staff.state_id] ?? 'neutral'}>{lookupName('state_id', staff.state_id)}</Badge></td>
                                    <td>{staff.is_password_change_required === 1 ? <Badge tone="warn">필요</Badge> : '—'}</td>
                                    <td className={styles.number}>{toKst(staff.created_at, 'YYYY-MM-DD')}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            ) : null}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="업체 관리자 페이지" />

            {/* ④⑤ 등록 */}
            <Modal open={creating} title="업체 관리자 등록" onClose={() => setCreating(false)} footer={<><Button onClick={() => setCreating(false)}>취소</Button><Button variant="primary" disabled={busy} onClick={create}>{busy ? '처리 중…' : '등록'}</Button></>}>
                <div className={styles.form}>
                    <Field label="아이디" name="login_id" htmlFor="staff-new-login-id" hint="영문 · 숫자 · _ 4~30자, 업체 안에서 겹치지 않게" required>
                        <Input id="staff-new-login-id" autoComplete="off" maxLength={LOGIN_ID_MAX} value={loginId} onChange={(event) => setLoginId(event.target.value)} />
                    </Field>
                    <StaffFields idPrefix="staff-new" form={form} onChange={(patch) => setForm((prev) => ({...prev, ...patch}))} />
                    <p className={styles.hint}>등록하면 업체코드 · 아이디 · 임시 비밀번호가 그 휴대폰으로 문자로 갑니다.</p>
                </div>
            </Modal>
        </div>
    );
}
```

```tsx
// src/app/manager/(console)/staff/_components/StaffFields.tsx
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Segmented from '@/shared/components/ui/form/Segmented';
import { digitsOnly } from '@/shared/utils/util';
import { GENDER_OPTIONS, PHONE_MAX, StaffFormType } from '../staff-format';
import styles from '@/app/css/manager/StaffFields.module.css';

type StaffFieldsProps = {
    idPrefix: string;                                  // 칸 id 앞(등록 대화상자 · 상세 카드)
    form: StaffFormType;                               // 칸 값
    onChange: (patch: Partial<StaffFormType>) => void; // 칸 바꿈
};

/** 이름 최대 글자 수 — ManagerStaffDto */
const NAME_MAX = 50;

/**
 * 업체 관리자 칸 — 이름 · 휴대폰(숫자만) · 성별 · 생년월일. 등록 대화상자와 상세 계정 정보 카드가 함께 쓴다
 *
 * @param param0
 * @returns
 */
export default function StaffFields({idPrefix, form, onChange}: StaffFieldsProps): React.ReactNode {
    return (
        // 업체 관리자 칸
        <div className={styles.grid}>
            {/* 이름 · 휴대폰 */}
            <Field label="이름" name="name" htmlFor={`${idPrefix}-name`} required>
                <Input id={`${idPrefix}-name`} maxLength={NAME_MAX} value={form.name} onChange={(event) => onChange({name: event.target.value})} />
            </Field>
            <Field label="휴대폰 번호" name="phone" htmlFor={`${idPrefix}-phone`} hint="숫자만 — 임시 비밀번호 · 아이디 찾기에 씁니다." required>
                <Input id={`${idPrefix}-phone`} type="tel" inputMode="numeric" value={form.phone} onChange={(event) => onChange({phone: digitsOnly(event.target.value, PHONE_MAX)})} />
            </Field>

            {/* 성별 · 생년월일 */}
            <Field label="성별" name="gender" group required>
                <Segmented label="성별" options={GENDER_OPTIONS} value={form.gender} onChange={(gender) => onChange({gender})} />
            </Field>
            <Field label="생년월일" name="birth" htmlFor={`${idPrefix}-birth`} required>
                <Input id={`${idPrefix}-birth`} type="date" value={form.birth} onChange={(event) => onChange({birth: event.target.value})} />
            </Field>
        </div>
    );
}
```

### 1-2. 업체 관리자 상세 — `StaffDetailContent` · `StaffInfoCard`

계정 정보 칸은 회원이 바뀔 때만(`key={user_id}`) 받은 값으로 채운다 — 정지 · 초기화 뒤 상세를 다시 불러와도 고치던 칸이 남는다(객실 그룹 기본 정보와 같다).

```tsx
// src/app/manager/(console)/staff/[user_id]/StaffDetailContent.tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { getManagerStaff } from '@/contracts/manager/api';
import { ManagerStaffDetailResultDto } from '@/contracts/manager/dto/manager-staff-detail.dto';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { MANAGER_AUTH_BADGE } from '../../../manager-auth';
import { isHeadManager, ManagerConsoleContext } from '../../manager-console-context';
import { HEAD_MANAGER_ONLY_TITLE, STAFF_LIST_PATH, STAFF_STATE_TONE } from '../staff-format';
import StaffAccountCard from './_components/StaffAccountCard';
import StaffInfoCard from './_components/StaffInfoCard';
import styles from '@/app/css/manager/StaffDetailContent.module.css';

type StaffDetailContentProps = {
    userId: string; // 주소의 회원 ID
};

/**
 * M8 업체 관리자 상세 — 머리(이름 · 권한 · 상태 · 비밀번호 변경 필요) · 계정 정보 수정 · 계정 관리. 업체 총관리자만
 *
 * @param param0
 * @returns
 */
export default function StaffDetailContent({userId}: StaffDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                              // 매니저 토큰
    const {account} = useContext(ManagerConsoleContext);                                               // 로그인 때 기억한 계정 — 권한
    const router = useRouter();                                                                        // 삭제 뒤 목록으로
    const loadStaff = useEffectEvent((signal: AbortSignal) => getManagerStaff(auth, userId, signal)); // 그때의 auth · 회원으로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                           // ④ 다시 불러오기
    const [staff, setStaff] = useState<ManagerStaffDetailResultDto | null>(null);    // ① 상세
    const [failed, setFailed] = useState<boolean>(false);                            // ① 못 읽음

    // 계산 값
    const allowed = isHeadManager(account);                                          // ① 업체 총관리자만(모르면 막음)
    const badge = staff ? MANAGER_AUTH_BADGE.get(staff.auth_id) : undefined;         // ② 권한 배지

    // 효과
    useEffect(() => {
        // ① 상세 — 업체 총관리자가 아니면 부르지 않는다(회원이 바뀌거나 다시 부를 때 · 떠나면 결과를 버린다)
        if (!allowed) {
            return;
        }

        const controller = new AbortController();
        loadStaff(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setStaff(next);
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
    }, [allowed, userId, reloadKey]);

    // 함수
    function reload(): void {
        // ④ 다시 불러오기
        setReloadKey((key) => key + 1);
    }

    if (!allowed) {
        return (
            // ① 업체 총관리자만
            <EmptyState title={HEAD_MANAGER_ONLY_TITLE} />
        );
    }

    if (!staff) {
        return failed ? (
            // ① 못 읽음
            <EmptyState title="업체 관리자를 불러오지 못했어요" description="지워졌거나 잠시 연결이 안 됩니다." action={<Link href={STAFF_LIST_PATH} className={buttonClass({size: 'sm'})}>목록으로</Link>} />
        ) : null;
    }

    return (
        // 업체 관리자 상세
        <div className={styles.page}>
            {/* ② 머리 */}
            <div>
                <p className={styles.crumb}><Link href={STAFF_LIST_PATH}>업체 관리자</Link> › {staff.login_id}</p>
                <h1 className={styles.title}>
                    {staff.name}
                    {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}
                    <Badge tone={STAFF_STATE_TONE[staff.state_id] ?? 'neutral'}>{lookupName('state_id', staff.state_id)}</Badge>
                    {staff.is_password_change_required === 1 ? <Badge tone="warn">비밀번호 변경 필요</Badge> : null}
                </h1>
            </div>

            {/* ③ 계정 정보 · 계정 관리 */}
            <div className={styles.cols}>
                <StaffInfoCard key={staff.user_id} staff={staff} onSaved={reload} />
                <StaffAccountCard staff={staff} onChanged={reload} onDeleted={() => router.push(STAFF_LIST_PATH)} />
            </div>
        </div>
    );
}
```

```tsx
// src/app/manager/(console)/staff/[user_id]/_components/StaffInfoCard.tsx
'use client';
import { useContext, useState } from 'react';
import { updateManagerStaff } from '@/contracts/manager/api';
import { ManagerStaffDetailResultDto } from '@/contracts/manager/dto/manager-staff-detail.dto';
import { ManagerStaffUpdateDto } from '@/contracts/manager/dto/manager-staff-update.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import StaffFields from '../../_components/StaffFields';
import { staffFormOf, StaffFormType } from '../../staff-format';
import styles from '@/app/css/manager/StaffDetailContent.module.css';

type StaffInfoCardProps = {
    staff: ManagerStaffDetailResultDto; // 상세 — 칸을 한 번 채운다
    onSaved: () => void;                // 저장 뒤 상세 다시
};

/**
 * 계정 정보 카드 — 아이디 · 등록일 · 수정일은 읽기만, 이름 · 휴대폰 · 성별 · 생년월일 저장(통째로)
 *
 * @param param0
 * @returns
 */
export default function StaffInfoCard({staff, onSaved}: StaffInfoCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [form, setForm] = useState<StaffFormType>(() => staffFormOf(staff)); // 칸 값
    const [saving, setSaving] = useState<boolean>(false);                      // 저장 중

    // 함수
    async function save(): Promise<void> {
        // ③ 검사 → 수정(큐 — 네 칸 통째로) → ④ 상세 다시
        const dto = Object.assign(new ManagerStaffUpdateDto(), {name: form.name.trim(), phone: form.phone, gender: form.gender, birth: form.birth});
        if (saving || !(await validateAction(dto))) {
            return;
        }

        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateManagerStaff(auth, staff.user_id, dto);
        } catch (error) {
            failure = {error};
        }

        setSaving(false);
        if (failure) {
            handleApiError(failure.error); // ④ 휴대폰이 겹치면 그 칸 옆
            return;
        }

        onSaved();
    }

    return (
        // 계정 정보
        <Card title="계정 정보">
            {/* 읽기만 */}
            <dl className={styles.dl}>
                <dt>아이디</dt><dd>{staff.login_id}</dd>
                <dt>등록일</dt><dd className={styles.number}>{toKst(staff.created_at, 'YYYY-MM-DD HH:mm')}</dd>
                <dt>수정일</dt><dd className={styles.number}>{toKst(staff.updated_at, 'YYYY-MM-DD HH:mm')}</dd>
            </dl>
            <hr className={styles.sep} />

            {/* ③ 고치는 칸 */}
            <StaffFields idPrefix="staff-info" form={form} onChange={(patch) => setForm((prev) => ({...prev, ...patch}))} />
            <div className={styles.actions}><Button variant="primary" disabled={saving} onClick={save}>{saving ? '처리 중…' : '저장'}</Button></div>
        </Card>
    );
}
```

### 1-3. 계정 관리 — `StaffAccountCard`

확인 창 하나(`ConfirmModal`)를 동작 셋이 함께 쓴다 — 고른 동작(`confirming`)이 문구 · 버튼 · 보낼 함수를 정한다. 정지는 확인 창을 열기 전에 사유를 검사한다. 정지 해제는 확인 없이 바로(spec 결정).

```tsx
// src/app/manager/(console)/staff/[user_id]/_components/StaffAccountCard.tsx
'use client';
import { useContext, useState } from 'react';
import { deleteManagerStaff, resetManagerStaffPassword, updateManagerStaffState } from '@/contracts/manager/api';
import { ManagerStaffDetailResultDto } from '@/contracts/manager/dto/manager-staff-detail.dto';
import { ManagerStaffStateDto } from '@/contracts/manager/dto/manager-staff-state.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { STAFF_STATE } from '../../staff-format';
import styles from '@/app/css/manager/StaffDetailContent.module.css';

type StaffAccountCardProps = {
    staff: ManagerStaffDetailResultDto; // 상세 — 휴대폰 · 상태 · 정지 사유
    onChanged: () => void;              // 초기화 · 정지 · 해제 뒤 상세 다시
    onDeleted: () => void;              // 삭제 뒤 — 목록으로
};

/** 확인 창을 거치는 동작 */
type StaffActionType = 'reset' | 'block' | 'delete';

/** 정지 사유 최대 글자 수 — ManagerStaffStateDto */
const BLOCK_COMMENT_MAX = 255;

/**
 * 계정 관리 카드 — 비밀번호 초기화 · 정지(사유) / 정지 해제 · 삭제. 초기화 · 정지 · 삭제는 확인 창 뒤(spec 결정)
 *
 * @param param0
 * @returns
 */
export default function StaffAccountCard({staff, onChanged, onDeleted}: StaffAccountCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [blockComment, setBlockComment] = useState<string>('');                // 정지 사유 칸
    const [confirming, setConfirming] = useState<StaffActionType | null>(null);  // ② 확인 창 — 고른 동작
    const [busy, setBusy] = useState<boolean>(false);                            // 보내는 중
    const [notice, setNotice] = useState<string | null>(null);                   // ④ 초기화 안내

    // 계산 값
    const blocked = staff.state_id === STAFF_STATE.BLOCK;                        // 정지된 계정 — 정지 줄 대신 해제
    const phone = staff.phone ? formatPhone(staff.phone) : '등록된 휴대폰';      // 문자가 갈 번호
    const confirmText: Record<StaffActionType, {title: string; message: string; label: string}> = {
        reset: {title: '비밀번호 초기화', message: `${staff.login_id} 계정의 비밀번호를 초기화할까요? 임시 비밀번호가 ${phone} 로 문자로 갑니다.`, label: '초기화'},
        block: {title: '계정 정지', message: `${staff.login_id} 계정을 정지할까요? 바로 로그인이 막힙니다.`, label: '정지'},
        delete: {title: '계정 삭제', message: `${staff.login_id} 계정을 삭제할까요?`, label: '삭제'},
    };                                                                           // ② 확인 창 문구
    const current = confirming ? confirmText[confirming] : null;                 // 지금 확인 창

    // 함수
    function blockDto(): ManagerStaffStateDto {
        // 정지 값 — 사유는 다듬고 비면 보내지 않는다
        return Object.assign(new ManagerStaffStateDto(), {state_id: STAFF_STATE.BLOCK, block_comment: blockComment.trim() || undefined});
    }

    async function askBlock(): Promise<void> {
        // ② 정지 — 사유 검사 뒤 확인 창
        if (await validateAction(blockDto())) {
            setConfirming('block');
        }
    }

    async function confirmAction(): Promise<void> {
        // ③ 확인한 동작을 보낸다(큐) → ④ 안내 · 상세 다시, 삭제는 목록으로
        const action = confirming;
        if (busy || action === null) {
            return;
        }

        const send = action === 'reset'
            ? () => resetManagerStaffPassword(auth, staff.user_id)
            : action === 'block'
                ? () => updateManagerStaffState(auth, staff.user_id, blockDto())
                : () => deleteManagerStaff(auth, staff.user_id); // try 안에 갈래를 두지 않는다
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await send();
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setConfirming(null);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        if (action === 'delete') {
            onDeleted();
            return;
        }

        if (action === 'reset') {
            setNotice('임시 비밀번호를 보냈습니다.');
        }
        setBlockComment('');
        onChanged();
    }

    async function unblock(): Promise<void> {
        // 정지 해제 — 확인 없이 바로(큐) → 상세 다시
        if (busy) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateManagerStaffState(auth, staff.user_id, Object.assign(new ManagerStaffStateDto(), {state_id: STAFF_STATE.ACTIVE}));
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
        // 계정 관리
        <Card title="계정 관리">
            <div className={styles.rows}>
                {/* 비밀번호 초기화 */}
                <div className={styles.row}>
                    <div><b>비밀번호 초기화</b><p className={styles.hint}>임시 비밀번호(영문 + 숫자 10자리)를 {phone} 로 문자로 보냅니다. 로그인하면 비밀번호를 바꾸게 됩니다.</p></div>
                    <Button disabled={busy} onClick={() => setConfirming('reset')}>비밀번호 초기화</Button>
                </div>
                {notice ? <Band tone="ok" role="status">{notice}</Band> : null}
                <hr className={styles.sep} />

                {/* 정지 · 해제 */}
                {blocked ? (
                    <div className={styles.row}>
                        <div><Badge tone="danger">정지</Badge> <span>정지 사유: {staff.block_comment ?? '-'}</span></div>
                        <Button disabled={busy} onClick={unblock}>정지 해제</Button>
                    </div>
                ) : (
                    <Field label="정지 사유 (선택 · 255자 — 로그인할 때 보입니다)" name="block_comment" htmlFor="staff-block-comment" hint="정지하면 로그인 · 토큰 재발급이 막힙니다. 해제하면 다시 쓸 수 있습니다.">
                        <div className={styles.inline}>
                            <Input id="staff-block-comment" placeholder="예: 근무 종료" maxLength={BLOCK_COMMENT_MAX} value={blockComment} onChange={(event) => setBlockComment(event.target.value)} />
                            <Button variant="danger" disabled={busy} onClick={askBlock}>정지</Button>
                        </div>
                    </Field>
                )}
                <hr className={styles.sep} />

                {/* 삭제 */}
                <div className={styles.row}>
                    <div><b>삭제</b><p className={styles.hint}>탈퇴 처리되어 목록에서 사라집니다. 같은 아이디 · 휴대폰 번호로 다시 등록할 수 있습니다.</p></div>
                    <Button variant="danger" disabled={busy} onClick={() => setConfirming('delete')}>삭제</Button>
                </div>
            </div>

            {/* ② 확인 창 */}
            <ConfirmModal open={current !== null} title={current?.title ?? ''} message={current?.message ?? ''} confirmLabel={current?.label} danger busy={busy} onConfirm={confirmAction} onClose={() => setConfirming(null)} />
        </Card>
    );
}
```

---

## 2. 규약만으로 예측할 수 없는 부분

### 2-1. 업체 총관리자 판단을 한 곳으로 — `isHeadManager` (`src/app/manager/(console)/manager-console-context.ts`)

"계정이 업체 총관리자인가(모르면 아니다)"를 내 업체 설정 문 연동 탭(`store/StoreSettingsContent.tsx:40`)과 업체 관리자 두 화면이 쓴다 — 세 곳이라 영업중지 판단(`isStoreSuspended`)과 같은 파일로 모은다(AGENTS.md "두 곳 이상에서 쓰게 되면 그때 옮긴다" · 리뷰 261119 #2 와 같은 정리).

```ts
// src/app/manager/(console)/manager-console-context.ts — 더함
import { AUTH_ID } from '@/contracts/common/roles';
import { AreaAccountType } from '@/shared/api/cookie';

/**
 * 계정이 업체 총관리자인가 — 업체 관리자 화면 · 문 연동 탭. 계정을 모르면(쿠키 없음) 아니다(안전한 쪽)
 *
 * @param account 로그인 때 기억한 계정 — 없으면 null
 * @returns
 */
export function isHeadManager(account: AreaAccountType | null): boolean {
    return account?.auth_id === AUTH_ID.HEAD_MANAGER;
}

// src/app/manager/(console)/store/StoreSettingsContent.tsx:40-41 — AUTH_ID import 를 지우고 isHeadManager 를 가져온다.
// 계산 값 이름은 함수와 겹치지 않게 headManager
const headManager = isHeadManager(account);                                     // ⑥ 문 연동 탭 — 업체 총관리자만(모르면 숨김)
const tabs = STORE_TABS.filter((item) => item.value !== 'door' || headManager); // 보일 탭
```

### 2-2. 업체 관리자 칸 · 주소 — `src/app/manager/(console)/staff/staff-format.ts`

등록 대화상자와 상세 카드가 같은 칸을 쓴다(성별은 등록 때 고르지 않은 채로 시작 — 빈 값이면 "성별을 입력해주세요."). 휴대폰은 숫자만 칸 값으로 둔다(`digitsOnly`).

```ts
import { ManagerStaffDetailResultDto } from '@/contracts/manager/dto/manager-staff-detail.dto';
import { SegmentedOptionType } from '@/shared/components/ui/form/Segmented';

/** 업체 관리자 목록 주소 */
export const STAFF_LIST_PATH = '/manager/staff/';

/** 업체 총관리자가 아닐 때 안내 */
export const HEAD_MANAGER_ONLY_TITLE = '업체 총관리자만 볼 수 있는 화면입니다.';

/** 회원 상태 — state_id(업체 관리자는 ACTIVE · BLOCK) */
export const STAFF_STATE = {ACTIVE: 'ACTIVE', BLOCK: 'BLOCK'} as const;

/** 상태 배지 색 — 시안 M8(정상 ok · 정지 err) */
export const STAFF_STATE_TONE: Record<string, 'ok' | 'danger'> = {[STAFF_STATE.ACTIVE]: 'ok', [STAFF_STATE.BLOCK]: 'danger'};

/** 휴대폰 최대 자리 — ManagerStaffDto(01X + 7 ~ 8자리) */
export const PHONE_MAX = 11;

/** 성별 — 고르지 않음 '' */
export type GenderType = '' | 'M' | 'F';

/** 성별 고르기 */
export const GENDER_OPTIONS: Array<SegmentedOptionType<GenderType>> = [{value: 'M', label: '남'}, {value: 'F', label: '여'}];

/** 업체 관리자 칸(아이디 밖) */
export type StaffFormType = {
    name: string;       // 이름
    phone: string;      // 휴대폰(숫자만)
    gender: GenderType; // 성별
    birth: string;      // 생년월일(YYYY-MM-DD)
};

/** 등록 대화상자 빈 칸 */
export const EMPTY_STAFF_FORM: StaffFormType = {name: '', phone: '', gender: '', birth: ''};

/**
 * 업체 관리자 상세 주소
 *
 * @param userId 회원 ID
 */
export function staffPath(userId: string): string {
    return `${STAFF_LIST_PATH}${encodeURIComponent(userId)}/`;
}

/**
 * 받은 상세 → 칸(휴대폰 없음은 빈 칸)
 *
 * @param staff 업체 관리자 상세
 */
export function staffFormOf(staff: ManagerStaffDetailResultDto): StaffFormType {
    return {name: staff.name, phone: staff.phone ?? '', gender: staff.gender === 'F' ? 'F' : 'M', birth: staff.birth};
}
```

---

## 3. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| DTO 사본 7개(`manager-staff*`) | 지침서 블록 그대로(`## manager/dto/<파일>` → `src/contracts/manager/dto/<파일>`), 상대 import(`../../common/pagination.dto`) 유지 | `src/contracts/room/dto/room-group-list.dto.ts` |
| `getManagerStaffs(auth, query, signal?)` · `getManagerStaff(auth, user_id, signal?)` | `withAuth` + `request` GET `/admin-service/manager/staff`(query `{keyword, page, size}`) · `/manager/staff/<id>`(`encodeURIComponent`) | `src/contracts/room/api.ts` `getRoomGroups` · `getRoomGroup` |
| `createManagerStaff(auth, dto)`(POST — `ManagerStaffResultDto \| null`) | `withAuth` + `callQueue<ManagerStaffResultDto>` | `src/contracts/room/api.ts` `createRoomGroup` |
| `updateManagerStaff(auth, id, dto)` · `updateManagerStaffState(auth, id, dto)`(PATCH `/state`) · `resetManagerStaffPassword(auth, id)`(PATCH `/password-reset`, 본문 없음) · `deleteManagerStaff(auth, id)`(DELETE) — `Promise<null>` | `withAuth` + `callQueue<null>` | `src/contracts/manager/api.ts` `changeManagerPassword` · `src/contracts/room/api.ts` `deleteRoomGroup` |
| `staff/page.tsx` | 얇은 page — `<StaffListContent />`(로그인 가드는 콘솔 layout) | `src/app/manager/(console)/rooms/page.tsx` |
| `staff/[user_id]/page.tsx` | `PageProps<'/manager/staff/[user_id]'>` 의 `await params` → `<StaffDetailContent userId={user_id} />` | `src/app/manager/(console)/room-groups/[room_group_id]/page.tsx` |

## 4. 스타일 — 시안 값

시안 `frontend/design/manager.html` M8(`.phd` · `.crumb` · `.pt` · `.fb` · `.dl` · `.kv` · `.row` · `.sep`)을 토큰으로. 머리 · 검색 · 표는 호실 · 객실 그룹 목록과 같은 모양.

```css
/* StaffListContent.module.css — 머리 · 검색(시안 .fb) · 표, 내 계정 줄은 옅은 면 */
.page { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }
.title { margin: 0; font-size: 22px; font-weight: 700; }
.subtitle { margin: 6px 0 0; font-size: 13px; color: var(--muted); }
.search { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
.searchField { width: 320px; max-width: 100%; }
.label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 700; }
.number { font-variant-numeric: tabular-nums; }
.mine td { background: var(--surface-2); }
.form { display: flex; flex-direction: column; gap: 16px; }
.hint { margin: 0; font-size: 13px; line-height: 1.6; color: var(--muted); }

/* StaffDetailContent.module.css — 머리(.crumb · .pt) · 두 칸 · 계정 정보 dl · 계정 관리 줄 */
.page { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.crumb { margin: 0 0 6px; font-size: 13px; color: var(--muted); }
.title { margin: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 22px; font-weight: 700; }
.cols { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; }
.cols > * { flex: 1 1 420px; min-width: 0; }
.dl { margin: 0; display: grid; grid-template-columns: 100px 1fr; gap: 10px 16px; font-size: 14px; }
.dl dt { font-size: 13px; font-weight: 700; color: var(--muted); }
.dl dd { margin: 0; }
.number { font-variant-numeric: tabular-nums; }
.sep { height: 1px; margin: 16px 0; border: 0; background: var(--line); }
.actions { display: flex; justify-content: flex-end; margin-top: 16px; }
.rows { display: flex; flex-direction: column; gap: 4px; }
.row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.inline { display: flex; gap: 8px; }
.hint { margin: 4px 0 0; font-size: 13px; line-height: 1.6; color: var(--muted); }

/* StaffFields.module.css — 칸 두 줄(시안 .fg) */
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
```

## 테스트

spec 의 "결과" 표에서 ✓ 표시된 8건을 그대로 테스트로 옮긴다("계산 규칙" 표는 없다). 여기에는 추가분이 없다.

테스트 파일과 경계 mock(`@/contracts/manager/api` mock · `next/navigation` 의 `useRouter` 는 `push` mock):
- 픽스처 — `src/test/app/manager/(console)/staff-fixture.tsx`: 목록 한 쪽(업체 총관리자 1 · 업체 관리자 1), 상세(문태오 · 정상 · 휴대폰 있음), `renderAsAccount(node, auth_id)` — `RootLayoutProvider`(매니저 토큰 — `store-fixture.tsx` 의 `MANAGER_AUTH`) + `ManagerConsoleContext.Provider`(계정 권한)로 감싼다(`StoreSettingsContent.test.tsx:12` 모양).
- 목록 — `staff/StaffListContent.test.tsx`: 등록(휴대폰 `010-5530-1942` 입력 → 본문은 숫자만 · 성별 '여' · 날짜) → `createManagerStaff` 1번 인자 → `push('/manager/staff/<id>/')` / 아이디 `abc` → 칸 문구 · 0번 / 업체 관리자(`MANAGER`) 계정 → 안내 · `getManagerStaffs` 0번
- 상세 — `staff/[user_id]/StaffDetailContent.test.tsx`: 이름 · 휴대폰 저장 → `updateManagerStaff(auth, id, {name, phone, gender, birth})` 1번 · 상세 2번 / 휴대폰 7자리 → 칸 문구 · 0번 / 정지 사유 · 정지 → 확인 창 "정지" → `updateManagerStaffState(auth, id, {state_id: 'BLOCK', block_comment})` 1번 · 상세 2번 / 초기화 → 확인 → `resetManagerStaffPassword(auth, id)` 1번 · "임시 비밀번호를 보냈습니다." · 상세 2번 / 삭제 → 확인 → `deleteManagerStaff` 1번 → `push('/manager/staff/')`
- React Compiler 회귀 테스트(`src/test/react-compiler.test.ts`)가 새 컴포넌트를 모두 컴파일하는지 함께 본다.

## 만드는 순서

1. DTO 사본 7개 → `src/contracts/manager/api.ts` 함수 7개
2. 공용 — `isHeadManager`(2-1) + 내 업체 설정 머리 정리
3. `staff-format.ts`(2-2) · `StaffFields` → `StaffListContent`(1-1) + page + css + 테스트
4. `StaffInfoCard`(1-2) · `StaffAccountCard`(1-3) · `StaffDetailContent`(1-2) + page + css + 테스트
5. `npx next typegen && npx tsc --noEmit` · `npx vitest run`(AGENTS.md 가 허용)
6. 문서 — AGENTS.md Auth 줄("업체 관리자 메뉴는 업체 총관리자만" 뒤에 — 콘솔의 업체 총관리자 전용 화면 · 탭은 `isHeadManager(account)` 로 막고, 모르면 막는다)
