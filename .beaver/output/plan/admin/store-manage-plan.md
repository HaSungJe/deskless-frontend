# Plan — 입점 신청 · 업체 관리 — 승인 · 반려 · 업체 상태

> 무엇을·왜는 [spec](../../spec/admin/store-manage-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 진입점마다 비즈니스 로직 전체 ② 계산 함수 ③ 규약만으로 예측할 수 없는 데이터 규칙
> **싣지 않는 것** page 껍데기, DTO 사본, 형제와 같은 contracts 함수 — 따르는 패턴을 표 한 줄로 가리킨다

로드맵 Phase 16(#53 ~ #56)을 이 plan 하나로 만든다. 목록은 업체 관리자 목록(`src/app/manager/(console)/staff/StaffListContent.tsx`), 상세는 업체 관리자 상세(`staff/[user_id]/StaffDetailContent.tsx`)와 같은 모양이다.

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/contracts/store/dto/` 9개(`store-application-list` · `-detail` · `-approve` · `-reject` · `store-list` · `store-detail` · `store-update` · `store-state` · `store-open`) | 신규 | 지침서 사본(`frontend/dto/store.md`) | 생략 |
| `src/contracts/store/api.ts` | 수정 | 관리자 API 9개 | 생략 (아래 4) |
| `src/contracts/common/store.constants.ts` | 신규 | 입점 신청 상태 · 파일 용도 · 업체 상태 값 · 신청 상태 배지 색 | 아래 3-1 |
| `src/app/(user)/store-applications/store-application-format.ts` 와 그 3곳 · `src/app/manager/(console)/manager-console-context.ts` | 수정 | 옮긴 상수를 쓰고 자기 사본을 지운다 | 아래 3-1 |
| `src/app/admin/(console)/admin-paths.ts` | 신규 | 관리자 화면 주소(목록 · 상세 · Phase 17 의 업체 관리자 · 이용자) | 아래 3-2 |
| `src/app/admin/(console)/_components/ListFilter.tsx` | 신규 | 상태 칩 · 검색(두 목록 — Phase 17 목록도) | 아래 1-1 |
| `src/app/admin/(console)/_components/StoreFilesCard.tsx` | 신규 | 업체 정보 파일 보기(사업자등록증 새 창 · 업체 사진) — 두 상세 | 아래 1-2 |
| `src/app/admin/(console)/store-applications/page.tsx` · `AdminApplicationListContent.tsx` | 신규 | A3 입점 신청 목록 | 아래 1-1 |
| `src/app/admin/(console)/store-applications/application-format.ts` | 신규 | 승인할 수 있는지 · 승인 결과 업체 | 아래 2-1 · 3-3 |
| `src/app/admin/(console)/store-applications/[store_application_id]/page.tsx` · `AdminApplicationDetailContent.tsx` | 신규 | A3 입점 신청 상세 | 아래 1-2 |
| `src/app/admin/(console)/stores/page.tsx` · `AdminStoreListContent.tsx` | 신규 | A4 업체 목록 | 아래 1-3 |
| `src/app/admin/(console)/stores/store-format.ts` | 신규 | 업체 상태 배지 색 · 사업자등록번호 글자 · 칸 ↔ DTO | 아래 1-3 · 1-4 |
| `src/app/admin/(console)/stores/[store_id]/page.tsx` · `AdminStoreDetailContent.tsx` | 신규 | A4 업체 상세 | 아래 1-4 |
| `src/app/admin/(console)/stores/[store_id]/_components/StoreInfoCard.tsx` · `StoreStateCard.tsx` · `StoreOpenCard.tsx` | 신규 | 정보 수정(주소 검색) · 상태 변경(탈퇴 확인) · 영업중 | 아래 1-4 |
| `src/app/css/admin/AdminList.module.css` · `AdminDetail.module.css` · `ListFilter.module.css` · `StoreFilesCard.module.css` | 신규 | 시안 값(`frontend/design/admin.html` A3 · A4) | 아래 5 |
| 테스트 5파일 + 픽스처 | 신규 | spec 14건 | 아래 테스트 |
| `AGENTS.md` · `docs/architecture.md` | 수정 | 관리자 A3 · A4 생김, 공통 상수 · 주소 모음 | 만드는 순서 8 |

---

## 1. 비즈니스 로직 — 화면별 코드

### 1-1. 입점 신청 목록 — `AdminApplicationListContent` · `ListFilter`

거르기 · 쪽은 한 상태(`ListQueryType`)로 두고 바꿀 때마다 새 객체를 넣어 효과가 다시 읽는다 — 상태 칩 · 검색어를 바꾸면 쪽은 1로. 업체 목록(1-3)도 같은 상태 · 부품을 쓴다.

```tsx
// src/app/admin/(console)/_components/ListFilter.tsx
'use client';
import { useState } from 'react';
import Button from '@/shared/components/ui/button/Button';
import Chip from '@/shared/components/ui/form/Chip';
import Input from '@/shared/components/ui/form/Input';
import styles from '@/app/css/admin/ListFilter.module.css';

/** 목록 거르기 · 쪽 — 상태(null 이 전체) · 제출한 검색어 · 쪽 */
export type ListQueryType = {
    state: string | null; // 상태 칩
    keyword: string;      // 조회한 검색어(앞뒤 빈칸 뗌)
    page: number;         // 보는 쪽
};

/** 처음 목록 — 전체 · 검색어 없음 · 1쪽 */
export const FIRST_LIST_QUERY: ListQueryType = {state: null, keyword: '', page: 1};

/** 검색어 최대 글자 수 — StoreApplicationListDto · StoreListDto */
const KEYWORD_MAX = 100;

type ListFilterProps = {
    stateLabel: string;                                             // 칩 묶음 이름 — "신청 상태"
    states: ReadonlyArray<{value: string | null; label: string}>;  // 칩(null 이 전체)
    placeholder: string;                                            // 검색 칸 안내 — "상호명 · 사업자등록번호"
    query: ListQueryType;                                           // 지금 거르기
    onChange: (next: ListQueryType) => void;                        // 바뀐 거르기 — 쪽은 1로
};

/**
 * 관리자 목록 거르기 — 상태 칩 · 검색어(시안 A3 · A4 목록 위 줄)
 *
 * @param param0
 * @returns
 */
export default function ListFilter({stateLabel, states, placeholder, query, onChange}: ListFilterProps): React.ReactNode {
    // 상태
    const [keywordInput, setKeywordInput] = useState<string>(query.keyword); // 검색 칸

    // 함수
    function pickState(state: string | null): void {
        // ② 상태 칩 → 1쪽부터
        onChange({...query, state, page: 1});
    }

    function search(event: React.FormEvent<HTMLFormElement>): void {
        // ② 검색어 → 1쪽부터
        event.preventDefault();
        onChange({...query, keyword: keywordInput.trim(), page: 1});
    }

    return (
        // 거르기 줄
        <div className={styles.bar}>
            {/* 상태 칩 */}
            <div role="group" aria-label={stateLabel} className={styles.chips}>
                <span className={styles.label}>상태</span>
                {states.map((option) => <Chip key={option.label} pressed={query.state === option.value} onClick={() => pickState(option.value)}>{option.label}</Chip>)}
            </div>

            {/* 검색 */}
            <form role="search" className={styles.search} onSubmit={search}>
                <Input type="search" aria-label="검색어" placeholder={placeholder} maxLength={KEYWORD_MAX} value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} />
                <Button type="submit">조회</Button>
            </form>
        </div>
    );
}
```

```tsx
// src/app/admin/(console)/store-applications/AdminApplicationListContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { applicationStateTone, STORE_APPLICATION_STATE } from '@/contracts/common/store.constants';
import { getStoreApplications } from '@/contracts/store/api';
import { StoreApplicationListDto, StoreApplicationListResultDto } from '@/contracts/store/dto/store-application-list.dto';
import { handleApiError } from '@/shared/api/error';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatBusinessNumber, toKst } from '@/shared/utils/format';
import { applicationPath, storePath } from '../admin-paths';
import ListFilter, { FIRST_LIST_QUERY, ListQueryType } from '../_components/ListFilter';
import styles from '@/app/css/admin/AdminList.module.css';

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 상태 칩 — 시안 A3(전체 · 대기 · 승인 · 반려) */
const STATE_CHIPS: ReadonlyArray<{value: string | null; label: string}> = [
    {value: null, label: '전체'},
    {value: STORE_APPLICATION_STATE.WAIT, label: '대기'},
    {value: STORE_APPLICATION_STATE.APPROVED, label: '승인'},
    {value: STORE_APPLICATION_STATE.REJECTED, label: '반려'},
]; // (build 때 고침) as const 로 두면 null 칸이 any 로 잡혀 타입을 적었다

/**
 * A3 입점 신청 목록 — 상태 칩 · 검색 · 표(신청일 최신순)
 *
 * @returns
 */
export default function AdminApplicationListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰
    const loadPage = useEffectEvent((query: ListQueryType, signal: AbortSignal) => getStoreApplications(auth, new StoreApplicationListDto({page: query.page, size: PAGE_SIZE, store_application_state_id: query.state, keyword: query.keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [query, setQuery] = useState<ListQueryType>(FIRST_LIST_QUERY);                // ①②③ 상태 · 검색어 · 쪽
    const [result, setResult] = useState<StoreApplicationListResultDto | null>(null); // ① 목록

    // 효과
    useEffect(() => {
        // ①②③ 그 거르기 · 쪽 목록(떠나면 결과를 버린다)
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
        // 입점 신청 목록
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <h1 className={styles.title}>입점 신청</h1>
                <p className={styles.subtitle}>이용자가 보낸 입점 신청을 보고 승인 · 반려합니다. 신청일 최신순.</p>
            </div>

            {/* ② 거르기 */}
            <ListFilter stateLabel="신청 상태" states={STATE_CHIPS} placeholder="상호명 · 사업자등록번호" query={query} onChange={setQuery} />

            {/* ① 표 · 빈 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="조건에 맞는 입점 신청이 없습니다." description='상태를 "전체" 로 바꾸거나 검색어를 지워 보세요.' /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">번호</th><th scope="col">상호명</th><th scope="col">사업자등록번호</th><th scope="col">대표자</th><th scope="col">상태</th><th scope="col">신청일시</th><th scope="col">처리일시</th><th scope="col">만든 업체</th></tr></thead>
                    <tbody>
                        {result.list.map((item, index) => (
                            <tr key={item.store_application_id}>
                                <td className={styles.number}>{result.pagination.content_start_number - index}</td>
                                <td><Link href={applicationPath(item.store_application_id)}>{item.store_name}</Link></td>
                                <td className={styles.number}>{formatBusinessNumber(item.business_number)}</td>
                                <td>{item.owner_name}</td>
                                <td><Badge tone={applicationStateTone(item.store_application_state_id)}>{lookupName('store_application_state_id', item.store_application_state_id)}</Badge></td>
                                <td className={styles.number}>{toKst(item.created_at, 'YYYY-MM-DD HH:mm')}</td>
                                <td className={styles.number}>{item.reviewed_at ? toKst(item.reviewed_at, 'YYYY-MM-DD HH:mm') : '—'}</td>
                                <td>{item.store_id ? <Link href={storePath(item.store_id)}>업체 보기</Link> : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}

            {/* ③ 페이지 */}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setQuery((prev) => ({...prev, page: Number(next)}))} label="입점 신청 페이지" />
        </div>
    );
}
```

### 1-2. 입점 신청 상세 — `AdminApplicationDetailContent` · `StoreFilesCard`

승인 결과(`store_id` · `store_code`)는 큐가 늦으면 `null` 이다 — 그때는 다시 읽은 상세의 업체코드로 띠를 그린다(아래 3-3). 반려 사유 대화상자는 공통 `ReasonModal`(비면 "반려하기"가 꺼진다 — `src/shared/components/ui/modal/ReasonModal.tsx`), 칸 이름은 `reject_comment` 라 서버 칸 오류도 그 칸에 붙는다.

```tsx
// src/app/admin/(console)/store-applications/[store_application_id]/AdminApplicationDetailContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { storeConsoleLoginUrl } from '@/app/manager/manager-auth';
import { lookupName } from '@/contracts/common/lookup';
import { applicationStateTone } from '@/contracts/common/store.constants';
import { approveStoreApplication, getStoreApplication, rejectStoreApplication } from '@/contracts/store/api';
import { StoreApplicationApproveResultDto } from '@/contracts/store/dto/store-application-approve.dto';
import { StoreApplicationDetailResultDto } from '@/contracts/store/dto/store-application-detail.dto';
import { StoreApplicationRejectDto } from '@/contracts/store/dto/store-application-reject.dto';
import { handleApiError } from '@/shared/api/error';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import CopyButton from '@/shared/components/ui/button/CopyButton';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import ReasonModal from '@/shared/components/ui/modal/ReasonModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatBusinessNumber, formatPhone, toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { APPLICATION_LIST_PATH, storePath, userPath } from '../../admin-paths';
import StoreFilesCard from '../../_components/StoreFilesCard';
import { ApprovedStoreType, approvalOf, approvedStoreOf } from '../application-format';
import styles from '@/app/css/admin/AdminDetail.module.css';

type AdminApplicationDetailContentProps = {
    applicationId: string; // 주소의 입점 신청 ID
};

/** 반려 사유 최대 글자 수 — StoreApplicationRejectDto */
const REJECT_COMMENT_MAX = 255;

/**
 * A3 입점 신청 상세 — 신청 내용 · 신청자 · 처리 · 업체 정보 파일 · 승인(업체코드 · 로그인 주소 안내) · 반려(사유)
 *
 * @param param0
 * @returns
 */
export default function AdminApplicationDetailContent({applicationId}: AdminApplicationDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                       // 관리자 토큰
    const loadDetail = useEffectEvent((signal: AbortSignal) => getStoreApplication(auth, applicationId, signal)); // 그때의 auth · 신청으로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                               // ④⑤ 다시 읽기
    const [detail, setDetail] = useState<StoreApplicationDetailResultDto | null>(null); // ① 상세
    const [failed, setFailed] = useState<boolean>(false);                                // ① 못 읽음
    const [approved, setApproved] = useState<ApprovedStoreType | null>(null);           // ④ 방금 승인 — 받은 업체(늦으면 비어 있음)
    const [rejecting, setRejecting] = useState<boolean>(false);                          // ⑤ 반려 대화상자
    const [busy, setBusy] = useState<boolean>(false);                                    // ③⑤ 승인 · 반려 중

    // 계산 값
    const approval = detail ? approvalOf(detail) : null;                                          // ② 버튼 · 막는 이유
    const bandStore = approved ? approvedStoreOf(approved, detail) : null;                         // ④ 승인 띠의 업체 — 늦어 아직 없으면 null
    const consoleUrl = bandStore ? storeConsoleLoginUrl(bandStore.store_code) : '';               // ④ 업체 콘솔 로그인 주소

    // 효과
    useEffect(() => {
        // ① 상세(신청이 바뀌거나 다시 읽을 때 · 떠나면 결과를 버린다) — 사업자등록증 열람 주소도 이때 새로
        const controller = new AbortController();
        loadDetail(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setDetail(next);
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
    }, [applicationId, reloadKey]);

    // 함수
    function reload(): void {
        // ④⑤ 상세 다시
        setReloadKey((key) => key + 1);
    }

    async function approve(): Promise<void> {
        // ③ 승인(큐) → ④ 받은 업체 · 상세 다시(받은 게 없으면 다시 읽은 업체코드로)
        if (busy) {
            return;
        }

        setBusy(true);
        let result: StoreApplicationApproveResultDto | null = null; // 승인 결과 — 늦으면 null
        let failure: {error: unknown} | null = null;               // 실패 — 처리는 try 밖에서
        try {
            result = await approveStoreApplication(auth, applicationId);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error); // ③ 이미 처리됨 · 사업자등록증 없음 — 받은 문구
            return;
        }

        setApproved({store_id: result?.store_id ?? null, store_code: result?.store_code ?? null});
        reload();
    }

    async function reject(reason: string): Promise<void> {
        // ⑤ 사유 검사 → 반려(큐) → 닫고 상세 다시
        const dto = Object.assign(new StoreApplicationRejectDto(), {reject_comment: reason});
        if (busy || !(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await rejectStoreApplication(auth, applicationId, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error); // 사유 칸 오류는 대화상자 칸 옆
            return;
        }

        setRejecting(false);
        reload();
    }

    if (!detail) {
        return failed ? (
            // ① 못 읽음 — 받은 문구는 팝업으로
            <EmptyState title="입점 신청을 불러오지 못했어요" description="없는 신청이거나 잠시 연결이 안 됩니다." action={<Link href={APPLICATION_LIST_PATH} className={buttonClass({size: 'sm'})}>입점 신청 목록</Link>} />
        ) : null;
    }

    return (
        // 입점 신청 상세
        <div className={styles.page}>
            {/* 머리 — ② 대기면 반려 · 승인 */}
            <div className={styles.head}>
                <div>
                    <p className={styles.crumb}><Link href={APPLICATION_LIST_PATH}>입점 신청 목록</Link></p>
                    <h1 className={styles.title}>{detail.store_name}<Badge tone={applicationStateTone(detail.store_application_state_id)}>{lookupName('store_application_state_id', detail.store_application_state_id)}</Badge></h1>
                    <p className={styles.sub}>신청일시 {toKst(detail.created_at, 'YYYY-MM-DD HH:mm')} · 처리일시 {detail.reviewed_at ? toKst(detail.reviewed_at, 'YYYY-MM-DD HH:mm') : '—'}</p>
                </div>
                {approval?.visible ? (
                    <div className={styles.actions}>
                        <Button variant="danger" disabled={busy} onClick={() => setRejecting(true)}>반려</Button>
                        <Button variant="primary" disabled={busy || !approval.canApprove} onClick={approve}>{busy ? '처리 중…' : '승인'}</Button>
                    </div>
                ) : null}
            </div>

            {/* ④ 승인 결과 */}
            {bandStore ? (
                <Band tone="ok" role="status" title="입점을 승인했습니다. 대표자 휴대폰으로 승인 문자를 보냈습니다.">
                    <dl className={styles.bandDl}>
                        <dt>업체코드</dt><dd className={styles.mono}>{bandStore.store_code}</dd>
                        <dt>업체 관리자 콘솔 로그인 주소</dt><dd className={styles.mono}>{consoleUrl}</dd>
                    </dl>
                    <div className={styles.bandActions}><CopyButton text={consoleUrl} label="로그인 주소 복사" size="sm" /><Link href={storePath(bandStore.store_id)} className={buttonClass({size: 'sm'})}>업체 상세로</Link></div>
                </Band>
            ) : null}

            {/* ② 승인 안내 · 막는 이유 */}
            {approval?.blockedReason ? <Band tone="warn">{approval.blockedReason}</Band> : null}
            {approval?.canApprove ? <Band tone="info">승인하면 업체와 업체 총관리자 계정(아이디 {detail.head_manager_login_id}, 신청 때 정한 비밀번호)이 만들어지고, 대표자 휴대폰 {formatPhone(detail.owner_phone)} 로 승인 문자가 갑니다. 대기 중인 신청만 승인 · 반려할 수 있습니다.</Band> : null}

            {/* ① 신청 내용 · 신청자 · 처리 */}
            <div className={styles.cols}>
                <Card title="신청 내용">
                    <dl className={styles.dl}>
                        <dt>상호명</dt><dd>{detail.store_name}</dd>
                        <dt>사업자등록번호</dt><dd className={styles.mono}>{formatBusinessNumber(detail.business_number)}</dd>
                        <dt>대표자명</dt><dd>{detail.owner_name}</dd>
                        <dt>대표자 휴대폰</dt><dd className={styles.mono}>{formatPhone(detail.owner_phone)}</dd>
                        <dt>업체 총관리자 아이디</dt><dd className={styles.mono}>{detail.head_manager_login_id}</dd>
                        <dt>업체 연락처</dt><dd className={styles.mono}>{formatPhone(detail.phone)}</dd>
                        <dt>주소</dt><dd>{detail.address}</dd>
                        <dt>상세주소</dt><dd>{detail.address_detail ?? '—'}</dd>
                        <dt>위도 · 경도</dt><dd className={styles.mono}>{detail.latitude} · {detail.longitude}</dd>
                        <dt>신청 메모</dt><dd>{detail.application_comment ?? '—'}</dd>
                    </dl>
                </Card>
                <div className={styles.stack}>
                    <Card title="신청자">
                        {detail.applicant ? (
                            <>
                                <dl className={styles.dl}>
                                    <dt>이름</dt><dd>{detail.applicant.name}</dd>
                                    <dt>닉네임</dt><dd>{detail.applicant.nickname}</dd>
                                    <dt>휴대폰</dt><dd className={styles.mono}>{detail.applicant.phone ? formatPhone(detail.applicant.phone) : '—'}</dd>
                                </dl>
                                <Link href={userPath(detail.applicant.user_id)} className={buttonClass({size: 'sm'})}>이용자 상세 보기</Link>
                            </>
                        ) : <p className={styles.muted}>신청자 정보 없음</p>}
                    </Card>
                    <Card title="처리">
                        <dl className={styles.dl}>
                            <dt>상태</dt><dd><Badge tone={applicationStateTone(detail.store_application_state_id)}>{lookupName('store_application_state_id', detail.store_application_state_id)}</Badge></dd>
                            <dt>처리일시</dt><dd className={styles.mono}>{detail.reviewed_at ? toKst(detail.reviewed_at, 'YYYY-MM-DD HH:mm') : '—'}</dd>
                            <dt>업체코드</dt><dd className={styles.mono}>{detail.store_code ?? '— (승인 뒤 생김)'}</dd>
                            <dt>반려 사유</dt><dd>{detail.reject_comment ?? '—'}</dd>
                        </dl>
                    </Card>
                </div>
            </div>

            {/* ① 업체 정보 파일 */}
            <StoreFilesCard files={detail.files} />

            {/* ⑤ 반려 사유 */}
            <ReasonModal open={rejecting} title="입점 신청 반려" description={`${detail.store_name} 신청을 반려합니다. 사유는 신청자가 내 신청 화면에서 봅니다.`} label="반려 사유" name="reject_comment" maxLength={REJECT_COMMENT_MAX} confirmLabel="반려하기" danger busy={busy} onConfirm={reject} onClose={() => setRejecting(false)} />
        </div>
    );
}
```

```tsx
// src/app/admin/(console)/_components/StoreFilesCard.tsx
import Image from 'next/image';
import { STORE_FILE_PURPOSE } from '@/contracts/common/store.constants';
import { StoreDetailFileResultDto } from '@/contracts/store/dto/store-detail.dto';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import { toKst } from '@/shared/utils/format';
import styles from '@/app/css/admin/StoreFilesCard.module.css';

/** 보일 파일 — 입점 신청 상세 · 업체 상세 파일의 같은 칸 */
type StoreFileViewType = Pick<StoreDetailFileResultDto, 'store_file_id' | 'store_file_purpose_id' | 'file_name' | 'content_type' | 'is_private' | 'file_url' | 'created_at'>;

type StoreFilesCardProps = {
    files: Array<StoreFileViewType>; // 용도 · 정렬 순서대로 온 파일
    markFirst?: boolean;             // 업체 사진 첫 장에 "대표"(업체 상세 — 정렬 0 이 대표)
};

/**
 * 업체 정보 파일 보기 — 사업자등록증(새 창 · 비공개면 10분 안내) · 업체 사진(정렬 순서). 관리자는 보기만
 *
 * @param param0
 * @returns
 */
export default function StoreFilesCard({files, markFirst = false}: StoreFilesCardProps): React.ReactNode {
    // 계산 값
    const licenses = files.filter((file) => file.store_file_purpose_id === STORE_FILE_PURPOSE.LICENSE); // 사업자등록증
    const images = files.filter((file) => file.store_file_purpose_id === STORE_FILE_PURPOSE.IMAGE);     // 업체 사진

    return (
        // 업체 정보 파일
        <Card title="업체 정보 파일">
            {/* 사업자등록증 */}
            <div className={styles.block}>
                <h3 className={styles.blockTitle}>사업자등록증</h3>
                {licenses.length === 0 ? <p className={styles.muted}>사업자등록증이 없습니다.</p> : null}
                {licenses.map((file) => (
                    <div key={file.store_file_id} className={styles.license}>
                        <p className={styles.meta}>{file.file_name} · {file.content_type} · {toKst(file.created_at, 'YYYY-MM-DD HH:mm')}{file.is_private === 1 ? <Badge tone="neutral">비공개</Badge> : null}</p>
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer">새 창으로 열기</a>
                        {file.is_private === 1 ? <p className={styles.muted}>비공개 파일이라 열람 주소가 10분 뒤 닫힙니다. 열리지 않으면 이 화면을 새로고침하세요.</p> : null}
                    </div>
                ))}
            </div>

            {/* 업체 사진 */}
            <div className={styles.block}>
                <h3 className={styles.blockTitle}>업체 사진 <span className={styles.muted}>{images.length}장 · 정렬 순서대로</span></h3>
                <div className={styles.grid}>
                    {images.map((file, index) => (
                        <figure key={file.store_file_id} className={styles.figure}>
                            <div className={styles.thumb}><Image src={file.file_url} alt={file.file_name} fill sizes="160px" unoptimized className={styles.img} /></div>
                            <figcaption className={styles.caption}>{markFirst && index === 0 ? <Badge tone="primary">대표</Badge> : null}{file.file_name}</figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </Card>
    );
}
```

### 1-3. 업체 목록 — `AdminStoreListContent`

입점 신청 목록(1-1)과 같은 상태 · 거르기 · 효과. 다른 것은 칩 · 검색 칸 · 표뿐이다.

```tsx
// src/app/admin/(console)/stores/AdminStoreListContent.tsx — 1-1 과 같은 import 에서 바뀌는 것만: getStores · StoreListDto · StoreListResultDto · STORE_STATE · lookupName · formatPhone · shortStoreCode(@/app/manager/manager-auth) · businessNumberText · STORE_STATE_TONE · OPEN_BADGE(./store-format)

/** 상태 칩 — 시안 A4(전체 · 활성 · 영업중지 · 탈퇴) */
const STATE_CHIPS: ReadonlyArray<{value: string | null; label: string}> = [
    {value: null, label: '전체'},
    {value: STORE_STATE.ACTIVE, label: '활성'},
    {value: STORE_STATE.SUSPEND, label: '영업중지'},
    {value: STORE_STATE.LEAVE, label: '탈퇴'},
];

/**
 * A4 업체 목록 — 상태 칩 · 검색 · 표(등록일 최신순)
 *
 * @returns
 */
export default function AdminStoreListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰
    const loadPage = useEffectEvent((query: ListQueryType, signal: AbortSignal) => getStores(auth, new StoreListDto({page: query.page, size: PAGE_SIZE, store_state_id: query.state, keyword: query.keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [query, setQuery] = useState<ListQueryType>(FIRST_LIST_QUERY);     // ①②③ 상태 · 검색어 · 쪽
    const [result, setResult] = useState<StoreListResultDto | null>(null); // ① 목록

    // 효과 — 1-1 과 같다(query 가 바뀌면 다시 읽고, 떠나면 결과를 버린다)

    return (
        // 업체 목록
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <h1 className={styles.title}>업체</h1>
                <p className={styles.subtitle}>입점 승인으로 만들어진 업체입니다. 등록일 최신순. 영업중지 · 탈퇴 업체는 이용자 지도에 나오지 않습니다.</p>
            </div>

            {/* ② 거르기 */}
            <ListFilter stateLabel="업체 상태" states={STATE_CHIPS} placeholder="상호명 · 사업자등록번호 · 대표자명" query={query} onChange={setQuery} />

            {/* ① 표 · 빈 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="조건에 맞는 업체가 없습니다." description='상태를 "전체" 로 바꾸거나 검색어를 지워 보세요.' /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">업체코드</th><th scope="col">상호명</th><th scope="col">사업자등록번호</th><th scope="col">대표자</th><th scope="col">전화</th><th scope="col">주소</th><th scope="col">영업중</th><th scope="col">상태</th></tr></thead>
                    <tbody>
                        {result.list.map((store) => {
                            const open = OPEN_BADGE[store.is_open === 1 ? 'open' : 'closed'];
                            const business = businessNumberText(store.business_number);
                            return (
                                <tr key={store.store_id}>
                                    <td className={styles.mono} title={store.store_code}>{shortStoreCode(store.store_code)}</td>
                                    <td><Link href={storePath(store.store_id)}>{store.store_name}</Link></td>
                                    <td className={business.left ? `${styles.mono} ${styles.muted}` : styles.number} title={store.business_number}>{business.text}</td>
                                    <td>{store.owner_name}</td>
                                    <td className={styles.number}>{formatPhone(store.phone)}</td>
                                    <td>{store.address}</td>
                                    <td><Badge tone={open.tone}>{open.label}</Badge></td>
                                    <td><Badge tone={STORE_STATE_TONE[store.store_state_id] ?? 'neutral'}>{lookupName('store_state_id', store.store_state_id)}</Badge></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            ) : null}

            {/* ③ 페이지 */}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setQuery((prev) => ({...prev, page: Number(next)}))} label="업체 페이지" />
        </div>
    );
}
```

```ts
// src/app/admin/(console)/stores/store-format.ts
import { STORE_STATE } from '@/contracts/common/store.constants';
import { StoreDetailResultDto } from '@/contracts/store/dto/store-detail.dto';
import { StoreUpdateDto } from '@/contracts/store/dto/store-update.dto';
import { formatBusinessNumber } from '@/shared/utils/format';
import { numberOf } from '@/shared/utils/util';

/** 업체 상태 배지 색 — 시안(활성 ok · 영업중지 danger · 탈퇴 neutral) */
export const STORE_STATE_TONE: Record<string, 'ok' | 'danger' | 'neutral'> = {
    [STORE_STATE.ACTIVE]: 'ok',
    [STORE_STATE.SUSPEND]: 'danger',
    [STORE_STATE.LEAVE]: 'neutral',
};

/** 영업중 배지 — is_open 1 영업중 · 0 영업준비 */
export const OPEN_BADGE = {
    open: {label: '영업중', tone: 'ok'},
    closed: {label: '영업준비', tone: 'neutral'},
} as const;

/** 탈퇴 업체 사업자등록번호 머리 — 백엔드가 DELETE_<업체 ID> 로 바꿔 준다 */
const LEFT_PREFIX = 'DELETE_';

/** 탈퇴 업체 사업자등록번호를 줄일 뒤 글자 수 — DELETE_ 뒤 앞 8자 */
const LEFT_SHORT = 8;

/** 업체 정보 칸 — 숫자 칸은 글자로 두고 보낼 때 숫자로 */
export type StoreFormType = {
    store_name: string;     // 상호명
    owner_name: string;     // 대표자명
    phone: string;          // 연락처 — 숫자만
    address: string;        // 주소 — 주소 검색이 채운다
    address_detail: string; // 상세주소
    latitude: string;       // 위도 칸 글자
    longitude: string;      // 경도 칸 글자
};

/**
 * 사업자등록번호 글자 — 보통은 123-45-67890, 탈퇴 업체(DELETE_…)는 줄여서 흐리게
 *
 * @param value business_number
 */
export function businessNumberText(value: string): {text: string; left: boolean} {
    return value.startsWith(LEFT_PREFIX) ? {text: `${value.slice(0, LEFT_PREFIX.length + LEFT_SHORT)}…`, left: true} : {text: formatBusinessNumber(value), left: false};
}

/**
 * 받은 업체 상세 → 정보 칸
 *
 * @param store 업체 상세
 */
export function storeFormOf(store: StoreDetailResultDto): StoreFormType {
    return {store_name: store.store_name, owner_name: store.owner_name, phone: store.phone, address: store.address, address_detail: store.address_detail ?? '', latitude: String(store.latitude), longitude: String(store.longitude)};
}

/**
 * 정보 칸 → 업체 정보 수정 보낼 값 — 상세주소는 빈 글자로도 보낸다(백엔드가 비우면 null — 빠뜨리면 지우지 못한다)
 *
 * @param form 정보 칸
 */
export function toStoreUpdateDto(form: StoreFormType): StoreUpdateDto {
    return Object.assign(new StoreUpdateDto(), {
        store_name: form.store_name.trim(),
        owner_name: form.owner_name.trim(),
        phone: form.phone,
        address: form.address.trim(),
        address_detail: form.address_detail.trim(),
        latitude: numberOf(form.latitude),
        longitude: numberOf(form.longitude),
    });
}
```

### 1-4. 업체 상세 — `AdminStoreDetailContent` · `StoreInfoCard` · `StoreStateCard` · `StoreOpenCard`

칸 카드는 상세를 다시 읽어도 고치던 칸이 남게 `key` 로 다시 만든다 — 정보 칸은 업체가 바뀔 때만(`store_id`), 상태 칸은 상태가 바뀔 때도(`store_id`-`store_state_id` — 바꾼 뒤 고른 값 · 사유를 비운다).

```tsx
// src/app/admin/(console)/stores/[store_id]/AdminStoreDetailContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { storeConsoleLoginUrl } from '@/app/manager/manager-auth';
import { lookupName } from '@/contracts/common/lookup';
import { STORE_STATE } from '@/contracts/common/store.constants';
import { getStore } from '@/contracts/store/api';
import { StoreDetailResultDto } from '@/contracts/store/dto/store-detail.dto';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import CopyButton from '@/shared/components/ui/button/CopyButton';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { STORE_LIST_PATH, storeManagersPath } from '../../admin-paths';
import StoreFilesCard from '../../_components/StoreFilesCard';
import { OPEN_BADGE, STORE_STATE_TONE } from '../store-format';
import StoreInfoCard from './_components/StoreInfoCard';
import StoreOpenCard from './_components/StoreOpenCard';
import StoreStateCard from './_components/StoreStateCard';
import styles from '@/app/css/admin/AdminDetail.module.css';

type AdminStoreDetailContentProps = {
    storeId: string; // 주소의 업체 ID
};

/**
 * A4 업체 상세 — 머리(업체코드 · 로그인 주소 복사 · 업체 관리자로) · 정보 수정 · 상태 · 영업중 · 운영 규정 · 업체 정보 파일
 *
 * @param param0
 * @returns
 */
export default function AdminStoreDetailContent({storeId}: AdminStoreDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                    // 관리자 토큰
    const loadStore = useEffectEvent((signal: AbortSignal) => getStore(auth, storeId, signal)); // 그때의 auth · 업체로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                  // ③④⑤ 다시 읽기
    const [store, setStore] = useState<StoreDetailResultDto | null>(null); // ① 상세
    const [failed, setFailed] = useState<boolean>(false);                   // ① 못 읽음

    // 계산 값
    const locked = store?.store_state_id === STORE_STATE.LEAVE;               // ① 탈퇴 — 모든 칸 · 버튼 잠금
    const loginUrl = store ? storeConsoleLoginUrl(store.store_code) : '';     // 업체 콘솔 로그인 주소
    const open = OPEN_BADGE[store?.is_open === 1 ? 'open' : 'closed'];        // 영업중 배지

    // 효과
    useEffect(() => {
        // ① 상세(업체가 바뀌거나 다시 읽을 때 · 떠나면 결과를 버린다) — 사업자등록증 열람 주소도 이때 새로
        const controller = new AbortController();
        loadStore(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setStore(next);
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
    }, [storeId, reloadKey]);

    // 함수
    function reload(): void {
        // ③④⑤ 상세 다시
        setReloadKey((key) => key + 1);
    }

    if (!store) {
        return failed ? (
            // ① 못 읽음
            <EmptyState title="업체를 불러오지 못했어요" description="없는 업체이거나 잠시 연결이 안 됩니다." action={<Link href={STORE_LIST_PATH} className={buttonClass({size: 'sm'})}>업체 목록</Link>} />
        ) : null;
    }

    return (
        // 업체 상세
        <div className={styles.page}>
            {/* 머리 — 업체코드 · 로그인 주소 · ⑥ 업체 관리자로 */}
            <div className={styles.head}>
                <div>
                    <p className={styles.crumb}><Link href={STORE_LIST_PATH}>업체 목록</Link></p>
                    <h1 className={styles.title}>{store.store_name}<Badge tone={STORE_STATE_TONE[store.store_state_id] ?? 'neutral'}>{lookupName('store_state_id', store.store_state_id)}</Badge><Badge tone={open.tone}>{open.label}</Badge></h1>
                    <div className={styles.copyRow}><span className={styles.muted}>업체코드</span><code className={styles.mono}>{store.store_code}</code><CopyButton text={store.store_code} size="sm" /></div>
                    <div className={styles.copyRow}><span className={styles.muted}>업체 관리자 콘솔 로그인 주소</span><code className={styles.mono}>{loginUrl}</code><CopyButton text={loginUrl} label="로그인 주소 복사" size="sm" /></div>
                    <p className={styles.sub}>등록 {toKst(store.created_at, 'YYYY-MM-DD HH:mm')} · 수정 {toKst(store.updated_at, 'YYYY-MM-DD HH:mm')}</p>
                </div>
                <Link href={storeManagersPath(store.store_id)} className={buttonClass({})}>이 업체의 업체 관리자</Link>
            </div>

            {/* 영업중지 사유 · ① 탈퇴 잠금 */}
            {store.store_state_id === STORE_STATE.SUSPEND && store.suspend_comment ? <Band tone="danger" title="영업중지 사유">{store.suspend_comment}</Band> : null}
            {locked ? <Band tone="warn">탈퇴한 업체는 바꿀 수 없습니다.</Band> : null}

            {/* ②③ 정보 · ④ 상태 · ⑤ 영업중 */}
            <div className={styles.cols}>
                <StoreInfoCard key={store.store_id} store={store} locked={locked} onSaved={reload} />
                <div className={styles.stack}>
                    <StoreStateCard key={`${store.store_id}-${store.store_state_id}`} store={store} locked={locked} onChanged={reload} />
                    <StoreOpenCard store={store} locked={locked} onChanged={reload} />
                </div>
            </div>

            {/* 운영 규정(보기만) · 업체 정보 파일 */}
            <div className={styles.cols}>
                <Card title="운영 규정">
                    <p className={styles.muted}>업체 관리자가 내 업체 설정에서 바꿉니다. 여기서는 읽기만.</p>
                    <dl className={styles.dl}>
                        <dt>24시간 연중무휴</dt><dd>{store.is_always_open === 1 ? '예' : '아니오 (요일별 영업시간을 씀)'}</dd>
                        <dt>정비시간</dt><dd>{store.maintenance_minutes}분</dd>
                        <dt>예약 가능 시작</dt><dd>이용 시작 {store.booking_open_hours}시간 전부터</dd>
                        <dt>100% 환불 마감</dt><dd>이용 시작 {store.refund_deadline_minutes}분 전까지</dd>
                        <dt>마감 뒤 환불 비율</dt><dd>{store.late_refund_percent}%</dd>
                        <dt>업체 소개</dt><dd>{store.introduction ?? '—'}</dd>
                    </dl>
                </Card>
                <StoreFilesCard files={store.files} markFirst />
            </div>
        </div>
    );
}
```

```tsx
// src/app/admin/(console)/stores/[store_id]/_components/StoreInfoCard.tsx
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
            <div className={styles.cardActions}><Button variant="primary" disabled={saving || locked} onClick={save}>{saving ? '처리 중…' : '정보 저장'}</Button></div>
        </Card>
    );
}
```

```tsx
// src/app/admin/(console)/stores/[store_id]/_components/StoreStateCard.tsx
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

/** 바꿀 상태 — 시안 A4 라디오(이름 · 설명) */
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
    const changed = stateId !== store.store_state_id;    // ④ 지금과 다르면 "상태 변경" 켜짐
    const suspending = stateId === STORE_STATE.SUSPEND;  // ④ 정지 사유 칸 켜짐

    // 함수 — send 를 submit 보다 먼저(build 때 고침 — 아래에 선언된 함수를 부르면 React Compiler 가 건너뛴다)
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
```

```tsx
// src/app/admin/(console)/stores/[store_id]/_components/StoreOpenCard.tsx
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
```

---

## 2. 계산 함수

### 2-1. 승인할 수 있는지 — `src/app/admin/(console)/store-applications/application-format.ts` `approvalOf`

```ts
import { STORE_APPLICATION_STATE, STORE_FILE_PURPOSE } from '@/contracts/common/store.constants';
import { StoreApplicationDetailResultDto } from '@/contracts/store/dto/store-application-detail.dto';

/** 사업자등록증이 없어 승인할 수 없음 — 시안 A3 · 서버도 400 */
export const LICENSE_MISSING_MESSAGE = '사업자등록증이 없어 승인할 수 없습니다. 신청자가 내 신청 화면에서 사업자등록증을 올린 뒤 승인하세요.';

/** 신청자 정보가 없어 승인할 수 없음 — 서버도 400 */
export const APPLICANT_MISSING_MESSAGE = '신청자 정보를 찾을 수 없어 승인할 수 없습니다.';

/** 승인 · 반려 버튼 */
export type ApprovalType = {
    visible: boolean;             // 반려 · 승인 버튼을 보일지 — 대기만
    canApprove: boolean;          // 승인 켜짐
    blockedReason: string | null; // 승인을 막은 이유(띠)
};

/**
 * 승인할 수 있는지 — 대기 중인 신청만 버튼, 사업자등록증 · 신청자가 모두 있어야 승인
 *
 * @param detail 입점 신청 상세
 */
export function approvalOf(detail: Pick<StoreApplicationDetailResultDto, 'store_application_state_id' | 'files' | 'applicant'>): ApprovalType {
    if (detail.store_application_state_id !== STORE_APPLICATION_STATE.WAIT) {
        return {visible: false, canApprove: false, blockedReason: null};
    }

    const hasLicense = detail.files.some((file) => file.store_file_purpose_id === STORE_FILE_PURPOSE.LICENSE);
    const blockedReason = !hasLicense ? LICENSE_MISSING_MESSAGE : detail.applicant === null ? APPLICANT_MISSING_MESSAGE : null;
    return {visible: true, canApprove: blockedReason === null, blockedReason};
}
```

---

## 3. 데이터 규칙 — 규약만으로 예측할 수 없는 부분

### 3-1. 업체 · 입점 신청 상태 값을 함께 쓰는 곳으로 — `src/contracts/common/store.constants.ts`

입점 신청 상태 · 파일 용도 값과 신청 상태 배지 색은 이용자 입점 신청(`src/app/(user)/store-applications/store-application-format.ts:2-21`)에만 있었는데 관리자 A3 가 똑같이 쓴다. 업체 상태 값은 업체 관리자 콘솔(`src/app/manager/(console)/manager-console-context.ts:18` `STORE_SUSPENDED`)과 관리자 A4 가 쓴다. 이용자 · 업체 관리자 · 관리자 세 영역이 함께 쓰는 백엔드 값이라 `contracts/common`(이름 `lookup.ts` 옆 — `room.constants.ts` 와 같은 자리)으로 옮기고 원래 자리의 사본을 지운다.

```ts
// src/contracts/common/store.constants.ts
/** 입점 신청 상태 — store_application_state_id(대기 · 승인 · 반려) — 이용자 입점 신청 · 관리자 입점 신청 관리 */
export const STORE_APPLICATION_STATE = {WAIT: 'WAIT', APPROVED: 'APPROVED', REJECTED: 'REJECTED'} as const;

/** 업체 정보 파일 용도 — store_file_purpose_id(사업자등록증 · 업체 사진) */
export const STORE_FILE_PURPOSE = {LICENSE: 'BUSINESS_LICENSE', IMAGE: 'STORE_IMAGE'} as const;

/** 업체 상태 — store_state_id(활성 · 영업중지 · 탈퇴) — 업체 관리자 콘솔 · 관리자 업체 관리 */
export const STORE_STATE = {ACTIVE: 'ACTIVE', SUSPEND: 'SUSPEND', LEAVE: 'LEAVE'} as const;

/** 입점 신청 상태 → 배지 색(시안: 대기 warn · 승인 ok · 반려 danger) */
const APPLICATION_STATE_TONE = new Map<string, 'warn' | 'ok' | 'danger'>([[STORE_APPLICATION_STATE.WAIT, 'warn'], [STORE_APPLICATION_STATE.APPROVED, 'ok'], [STORE_APPLICATION_STATE.REJECTED, 'danger']]);

/**
 * 입점 신청 상태 → 배지 색, 모르는 상태는 neutral
 *
 * @param stateId store_application_state_id
 */
export function applicationStateTone(stateId: string): 'warn' | 'ok' | 'danger' | 'neutral' {
    return APPLICATION_STATE_TONE.get(stateId) ?? 'neutral';
}
```

- `store-application-format.ts` 는 `APPLICATION_STATE` · `FILE_PURPOSE` · `STATE_TONE` · `applicationStateTone` 을 지우고 `FILE_MAX` 만 남긴다. 쓰던 곳 3개(`StoreApplicationDetailContent.tsx:23,89,91-92,222,229` · `ApplicationFiles.tsx:5,50,55` · `ApplicationCard.tsx:8`)는 `STORE_APPLICATION_STATE` · `STORE_FILE_PURPOSE` · `applicationStateTone` 을 `@/contracts/common/store.constants` 에서.
- `manager-console-context.ts` 는 `STORE_SUSPENDED` 를 지우고 `isStoreSuspended` 가 `STORE_STATE.SUSPEND` 를 쓴다.

### 3-2. 관리자 화면 주소 모음 — `src/app/admin/(console)/admin-paths.ts`

목록 · 상세가 서로를 가리키고(신청 → 만든 업체, 업체 → 업체 관리자 A5, 신청자 → 이용자 A6), Phase 17 화면도 같은 주소를 쓴다 — 화면 폴더마다 두면 화면끼리 가져다 쓰게 된다.

```ts
// src/app/admin/(console)/admin-paths.ts
/** 입점 신청 목록 */
export const APPLICATION_LIST_PATH = '/admin/store-applications/';

/** 업체 목록 */
export const STORE_LIST_PATH = '/admin/stores/';

/**
 * 입점 신청 상세
 *
 * @param storeApplicationId 입점 신청 ID
 */
export function applicationPath(storeApplicationId: string): string {
    return `${APPLICATION_LIST_PATH}${encodeURIComponent(storeApplicationId)}/`;
}

/**
 * 업체 상세
 *
 * @param storeId 업체 ID
 */
export function storePath(storeId: string): string {
    return `${STORE_LIST_PATH}${encodeURIComponent(storeId)}/`;
}

/**
 * 그 업체로 거른 업체 관리자 목록(A5 — Phase 17 에서 화면이 생긴다)
 *
 * @param storeId 업체 ID
 */
export function storeManagersPath(storeId: string): string {
    return `/admin/managers/?store_id=${encodeURIComponent(storeId)}`;
}

/**
 * 이용자 상세(A6 — Phase 17 에서 화면이 생긴다)
 *
 * @param userId 회원 ID
 */
export function userPath(userId: string): string {
    return `/admin/users/${encodeURIComponent(userId)}/`;
}
```

### 3-3. 승인 결과가 늦을 때의 업체 — `application-format.ts` `approvedStoreOf`

승인(큐)이 늦으면 결과가 `null` 이라 업체코드를 모른다 — 다시 읽은 상세의 `store_id` · `store_code` 로 띠를 그린다(아직 처리 전이면 띠 없이 상태만).

```ts
/** 방금 승인한 업체 — 큐 결과(늦으면 비어 있음) */
export type ApprovedStoreType = {
    store_id: string | null;   // 만든 업체 ID
    store_code: string | null; // 업체코드
};

/**
 * 승인 띠에 쓸 업체 — 받은 결과, 없으면 다시 읽은 상세, 둘 다 없으면 null
 *
 * @param approved 승인 결과
 * @param detail 다시 읽은 상세
 */
export function approvedStoreOf(approved: ApprovedStoreType, detail: Pick<StoreApplicationDetailResultDto, 'store_id' | 'store_code'> | null): {store_id: string; store_code: string} | null {
    if (approved.store_id && approved.store_code) {
        return {store_id: approved.store_id, store_code: approved.store_code};
    }

    return detail?.store_id && detail.store_code ? {store_id: detail.store_id, store_code: detail.store_code} : null;
}
```

---

## 4. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| DTO 사본 9개 | 지침서 사본 그대로(`frontend/dto/store.md`) | `src/contracts/store/dto/store-mine.dto.ts` |
| `getStoreApplications` · `getStores` | 동기 · 관리자 — `withAuth` + `request`, query 는 DTO 값 그대로(`store_application_state_id` · `store_state_id` · `keyword` · `page` · `size`) | `src/contracts/manager/api.ts:123-125` `getManagerStaffs` |
| `getStoreApplication` · `getStore` | 동기 · 관리자 — 경로 값 `encodeURIComponent`, `signal` | `src/contracts/manager/api.ts` `getManagerStaff` |
| `approveStoreApplication`(결과 `StoreApplicationApproveResultDto \| null`) · `rejectStoreApplication` · `updateStore` · `updateStoreState` · `updateStoreOpen`(결과 `null`) | 큐 · 관리자 — `withAuth` + `callQueue` PATCH, 경로 `/admin-service/store/application/:id/approve · /reject`, `/admin-service/store/:id · /state · /open` | `src/contracts/manager/api.ts` 업체 관리자 상태 변경 · `src/contracts/store/api.ts:218` `updateMyStoreOpen` |
| page 4개 | Content 만 그린다(동적 주소는 `await params`) | `src/app/manager/(console)/staff/[user_id]/page.tsx` |
| 목록 · 상세 효과 · 다시 읽기 · 못 읽음 | `useEffectEvent` + `AbortController`, `reloadKey`, 못 읽으면 `EmptyState` + 목록 링크 | `src/app/manager/(console)/staff/[user_id]/StaffDetailContent.tsx` |
| 업체코드 줄임 · 콘솔 로그인 주소 | `shortStoreCode` · `storeConsoleLoginUrl`(이용자 · 업체 관리자 화면이 이미 가져다 쓴다) | `src/app/manager/manager-auth.ts:70,90` |
| 주소 검색 | `preloadAddressSearch` 효과 + `searchAddressWithCoords` | `src/app/(user)/store-applications/new/StoreApplicationFormContent.tsx` `searchAddress` |

## 5. 스타일 — 시안 값

| 파일 | 내용 | 근거 |
|---|---|---|
| `src/app/css/admin/AdminList.module.css` | `.page` · `.title` · `.subtitle` · `.number`(고정폭 숫자) · `.mono` · `.muted` | 시안 A3 · A4 목록 · `src/app/css/manager/StaffListContent.module.css` |
| `src/app/css/admin/AdminDetail.module.css` | `.page` · `.head`(제목 · 오른쪽 버튼) · `.crumb` · `.title`(배지 줄) · `.sub` · `.actions` · `.cols`(두 칸 · 좁으면 한 칸) · `.stack` · `.dl` · `.mono` · `.muted` · `.copyRow` · `.bandDl` · `.bandActions` · `.formGrid`(두 칸) · `.addressRow` · `.radios` · `.radio` · `.cardActions` | 시안 A3 · A4 상세 · `src/app/css/manager/StaffDetailContent.module.css` |
| `src/app/css/admin/ListFilter.module.css` | `.bar` · `.chips` · `.label` · `.search` | 시안 목록 위 줄 |
| `src/app/css/admin/StoreFilesCard.module.css` | `.block` · `.blockTitle` · `.license` · `.meta` · `.grid`(사진 160px) · `.figure` · `.thumb`(4:3) · `.img` · `.caption` · `.muted` | 시안 A3 · A4 파일 · `src/app/css/user/ApplicationFiles.module.css` |

## 테스트

spec 의 "결과" 표에서 ✓ 표시된 10건과 "계산 규칙" 표 4건(승인할 수 있는지 — 먼저 쓴다)을 그대로 테스트로 옮긴다. 여기에는 추가분만 적는다.

| 종류 | 대상 | 이유 |
|---|---|---|
| 회귀(새 테스트 없음) | `src/test/app/(user)/store-applications/**` · `src/test/app/manager/(console)/**` | 3-1 에서 옮긴 상수(`STORE_APPLICATION_STATE` · `STORE_FILE_PURPOSE` · `applicationStateTone` · `STORE_STATE`)를 이용자 입점 신청 · 업체 관리자 콘솔이 그대로 쓰는지 — 기존 테스트가 그대로 통과해야 한다 |

테스트 모양 — 파일은 `src/test/app/admin/(console)/store-applications/application-format.test.ts`(계산 4) · `AdminApplicationListContent.test.tsx`(1) · `[store_application_id]/AdminApplicationDetailContent.test.tsx`(3) · `stores/AdminStoreListContent.test.tsx`(1) · `stores/[store_id]/AdminStoreDetailContent.test.tsx`(5), 공통 픽스처 `src/test/app/admin/(console)/admin-fixture.tsx`(관리자 토큰 Provider 로 그리기 · 신청 상세 · 업체 상세 · 목록 응답). contracts api 는 mock.
- 목록 — 처음 1번(전체 · 1쪽) → 칩 → 검색어 조회 → 마지막 부름 인자(`{store_application_state_id: 'WAIT', keyword: '온담', page: 1}` · `{store_state_id: 'SUSPEND', …}`) · 표 글자(번호 · 사업자등록번호 모양 · 업체 보기 링크 / 업체코드 앞 8자 · DELETE_ 줄임).
- 신청 상세 — 승인: 승인 1번(신청 ID) · 상세 2번 · 띠 글자 · 업체코드 · 로그인 주소(`NEXT_PUBLIC_SERVER_URL` 을 stub). 반려: 대화상자 → 사유 → 반려 1번(`{reject_comment: 다듬은 사유}`) · 닫힘 · 상세 2번. 사유 비움: "반려하기" `disabled` · 반려 0번.
- 업체 상세 — 주소 검색(`searchAddressWithCoords` mock) → 저장 인자(숫자 위도 · 경도 · 빈 상세주소 `''`) · 상세 2번 / 연락처 7자리 → 칸 문구 · 수정 0번 / 영업중지 + 사유 → `{store_state_id: 'SUSPEND', suspend_comment: 다듬은 사유}` / 탈퇴 → 확인 대화상자 → `{store_state_id: 'LEAVE'}`(사유 없음) / 스위치 끔 → `{is_open: 0}`.

## 만드는 순서

1. DTO 사본 9개 → `src/contracts/common/store.constants.ts` → 이용자 입점 신청 · 업체 관리자 콘솔이 옮긴 상수를 쓰게(사본 지움) → `src/contracts/store/api.ts` 9개.
2. `application-format.ts` 계산 테스트 4건 → `approvalOf` · `approvedStoreOf`.
3. `admin-paths.ts` · `ListFilter` · `StoreFilesCard` · css 4개.
4. A3 목록 · 상세(page · Content).
5. `store-format.ts` → A4 목록 · 상세 · 카드 3개.
6. 화면 테스트 4파일(10건) + 픽스처.
7. 타입 검사 · 테스트(전체 — 회귀 포함).
8. 문서 — `AGENTS.md`(로그인 화면 줄의 "Phase 16 · 17" → A3 · A4 생김, 공통 상수 `store.constants.ts`), `docs/architecture.md`(admin 폴더 줄 · `admin-paths.ts`).
