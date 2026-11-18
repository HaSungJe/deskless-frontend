# Plan — 마이페이지 · 입점 신청

> 무엇을·왜는 [spec](../../spec/store/mypage-store-application-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 화면마다 비즈니스 로직 — `<화면>Content` 안 함수(AGENTS.md "화면 로직") ② 계산 함수 ③ 공용 부품을 넓히는 곳 ④ 시안 값 스타일(형제 없음)
> **싣지 않는 것** page.tsx, DTO 사본, contracts 함수 — 따르는 패턴을 표 한 줄로 가리킨다
>
> 지침서 frontend/screens.md U10(:142-150) · U11(:152-165), frontend/api.md(:95-98 · :133-139), 시안 frontend/design/user.html U10(:1492-1600) · U11 목록(:1605-1651) · 작성(:1652-1739) · 상세(:1740-1881).

## 선행 조건

- [x] 이용자 틀 · 로그인 가드 · 내 정보(`UserMeContext.reloadMe`) · 회원 상태 띠 · 휴대폰 인증 화면이 있다(Phase 5)
- [x] 주소 검색 · 파일 올리기(`searchAddressWithCoords` · `uploadFile`)가 있다(Phase 4)

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/app/(user)/me/MyPageContent.tsx` | 신규 | U10 마이페이지 | 아래 1-1 |
| `src/app/(user)/store-applications/StoreApplicationListContent.tsx` · `_components/ApplicationCard.tsx` | 신규 | U11 목록 · 신청 카드 | 아래 1-2 |
| `src/app/(user)/store-applications/new/StoreApplicationFormContent.tsx` | 신규 | U11 작성 | 아래 1-3 |
| `src/app/(user)/store-applications/[store_application_id]/StoreApplicationDetailContent.tsx` · `_components/ApplicationFiles.tsx` | 신규 | U11 상세 · 파일 칸(시안대로 전용 — 사용자 결정) | 아래 1-4 |
| `src/shared/utils/format.ts` | 수정 | `formatPhone` · `formatBusinessNumber` · `formatKoreanDate` | 아래 2-1 |
| `src/shared/utils/util.ts` | 수정 | `digitsOnly` | 아래 2-2 |
| `src/app/(user)/store-applications/store-application-format.ts` | 신규 | `managerLoginUrl` · 상태 색 · 파일 용도 · 최대 장수 | 아래 2-3 |
| `src/app/(user)/_components/MemberStateBand.tsx` | 수정 | 탈퇴 대기 띠에 할 일(`action`)을 받는다 | 아래 3-1 |
| `src/shared/components/ui/display/Band.tsx` · `src/shared/css/ui/display/Band.module.css` | 수정 | `ok` 톤(승인 띠) | 아래 3-2 |
| `src/shared/components/ui/button/CopyButton.tsx` | 수정 | `variant` · `full` | 아래 3-3 |
| `src/app/css/user/ReservationPage.module.css` → `UserPage.module.css` | 이름 변경 | 이용자 화면 공통(카드 · dl · 아래 영역) — 예약 화면 13곳 import 고침 | 아래 3-4 |
| `src/contracts/user/dto/user-leave.dto.ts` · `src/contracts/store/dto/` 7개(`store-application` · `store-my-application-list` · `store-my-application` · `store-application-cancel` · `store-application-file-upload-url` · `store-application-file` · `store-application-file-delete`) | 신규 | 지침서 사본 | 생략 |
| `src/contracts/user/api.ts` | 수정 | `leaveUser` · `cancelLeave` | 생략 |
| `src/contracts/store/api.ts` | 신규 | 입점 신청 함수 7개 | 생략 |
| `src/app/(user)/me/page.tsx` · `store-applications/page.tsx` · `new/page.tsx` · `[store_application_id]/page.tsx` | 신규 | 얇은 page + 로그인 가드 | 생략 |
| `src/app/css/user/MyPageContent.module.css` · `StoreApplicationListContent.module.css` · `StoreApplicationFormContent.module.css` · `StoreApplicationDetailContent.module.css` · `ApplicationFiles.module.css` | 신규 | 시안 값 | 아래 5 |
| `src/test/shared/utils/format.test.ts` · `util.test.ts`(더함) · `src/test/app/(user)/store-applications/store-application-format.test.ts` · 화면 테스트 4개 | 신규 · 수정 | spec 테스트 | 아래 테스트 |
| `docs/integrations.md` · `AGENTS.md` | 수정 | 입점 신청 파일 올리기 · 표시 형식 줄(`formatPhone` · `formatBusinessNumber` · `formatKoreanDate`) | 만드는 순서 6 |

---

## 1. 비즈니스 로직 — 화면별 코드

spec 의 "동작 흐름" 번호와 주석 번호가 같다. 네 화면 모두 page 가 `<AuthGuard>`. 형제: `MyReservationContent`(목록 · 페이지), `ReservationDetailContent`(상세 · 없는 것 처리 · 실패 처리는 try 밖), `SignupContent`(입력 칸). 큐 결과 처리는 모두 try 밖(React Compiler — docs/conventions.md).

### 1-1. 마이페이지 — `MyPageContent`

탈퇴 · 철회 큐는 결과 DTO 가 null 이라 done · pending 이 같다 — 내 정보를 다시 읽어 상태로 확인하고, 바뀌지 않았으면 늦어짐 안내(형제 `PhoneVerificationContent` 의 확인 뒤 다시 읽기). 로그아웃은 토큰을 지운 뒤 첫 화면을 **새로** 연다 — 화면 안 이동(router)이면 로그인 가드가 먼저 로그인 화면으로 보낸다.

```tsx
// src/app/(user)/me/MyPageContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { cancelLeave, leaveUser } from '@/contracts/user/api';
import { UserLeaveDto } from '@/contracts/user/dto/user-leave.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import ReasonModal from '@/shared/components/ui/modal/ReasonModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { RETURN_URL_KEY } from '@/shared/utils/area';
import { withBasePath } from '@/shared/utils/base-path';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatKoreanDate, formatPhone } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import MemberStateBand from '../_components/MemberStateBand';
import { UserMeContext } from '../_components/UserMeProvider';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/MyPageContent.module.css';

/** 회원 상태 → 배지 색(시안: 정상 ok · 탈퇴 대기 warn) */
const MEMBER_TONE = new Map<string, 'ok' | 'warn' | 'danger'>([['ACTIVE', 'ok'], ['LEAVE_WAIT', 'warn'], ['BLOCK', 'danger']]);

/** 탈퇴 대기 */
const LEAVE_WAIT = 'LEAVE_WAIT';

/** 휴대폰 인증 — 인증 뒤 이 화면으로 */
const PHONE_VERIFY_PATH = `/phone-verification/?${RETURN_URL_KEY}=${encodeURIComponent('/me/')}`;

/** 탈퇴 사유 최대 글자 수 — UserLeaveDto */
const LEAVE_COMMENT_MAX = 255;

/** 아이콘 — 시안 U10 */
const PERSON_ICON = <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>;
const CHEVRON_ICON = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;

/**
 * U10 마이페이지 — 내 정보 · 회원 상태 · 메뉴 · 로그아웃 · 탈퇴 신청 / 철회
 *
 * @returns
 */
export default function MyPageContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                       // 이용자 토큰 — 탈퇴 · 철회 · 로그아웃
    const {me, reloadMe} = useContext(UserMeContext);           // 내 정보 — 다시 읽으면 다른 화면의 회원 상태 띠도 같이 바뀐다
    const loadMe = useEffectEvent(() => reloadMe());            // 그때의 reloadMe 로(효과를 다시 걸지 않는다)

    // 상태
    const [leaveOpen, setLeaveOpen] = useState<boolean>(false); // 탈퇴 사유 창
    const [busy, setBusy] = useState<boolean>(false);           // 탈퇴 · 철회 · 로그아웃 중

    // 계산 값
    const leaving = me?.state_id === LEAVE_WAIT;                 // 탈퇴 대기 — 탈퇴 신청을 숨긴다
    const verified = me?.is_phone_verified === 1;                // 휴대폰 인증

    // 효과
    useEffect(() => {
        // ① 들어오면 내 정보를 다시 읽는다(앱을 연 뒤 회원 상태 · 휴대폰 인증이 바뀌었을 수 있다)
        loadMe();
    }, []);

    // 함수
    async function leave(reason: string): Promise<void> {
        // ④ 탈퇴 신청 — 사유(선택) → 큐 → 내 정보 다시(결과가 null 이라 상태로 확인)
        const dto = Object.assign(new UserLeaveDto(), reason ? {leave_comment: reason} : {});
        if (!(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서(React Compiler)
        try {
            await leaveUser(auth, dto);
        } catch (error) {
            failure = {error};
        }

        const next = await reloadMe();
        setBusy(false);
        setLeaveOpen(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        if (next?.state_id !== LEAVE_WAIT) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
        }
    }

    async function withdraw(): Promise<void> {
        // ④ 탈퇴 철회 — 큐 → 내 정보 다시
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await cancelLeave(auth);
        } catch (error) {
            failure = {error};
        }

        const next = await reloadMe();
        setBusy(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        if (next?.state_id === LEAVE_WAIT) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
        }
    }

    async function logout(): Promise<void> {
        // ⑤ 로그아웃 — 토큰을 지우고 첫 화면을 새로 연다(화면 안 이동이면 로그인 가드가 먼저 로그인 화면으로 보낸다)
        setBusy(true);
        await auth.logout();
        window.location.assign(withBasePath('/'));
    }

    return (
        // 마이페이지
        <div className={pageStyles.page}>
            {/* 머리 */}
            <header className={pageStyles.plainHeader}><h1 className={pageStyles.plainTitle}>마이</h1></header>

            {/* ③ 회원 상태 — 이용 제한 사유 · 탈퇴 대기(철회 버튼) */}
            <MemberStateBand me={me} action={<button type="button" className={styles.withdraw} disabled={busy} onClick={withdraw}>탈퇴 철회</button>} />

            {me ? (
                <div className={pageStyles.body}>
                    {/* ② 프로필 */}
                    <section className={styles.profile}>
                        <span className={styles.avatar}>{PERSON_ICON}</span>
                        <div className={styles.profileText}>
                            <h2 className={styles.nickname}>{me.nickname}</h2>
                            <Badge tone={MEMBER_TONE.get(me.state_id) ?? 'neutral'}>{lookupName('state_id', me.state_id)}</Badge>
                        </div>
                    </section>

                    {/* ② 내 정보 */}
                    <section className={pageStyles.card} aria-labelledby="me-info-title">
                        <h2 id="me-info-title" className={pageStyles.cardTitle}>내 정보</h2>
                        <dl className={`${pageStyles.dl} ${styles.infoDl}`}>
                            <dt>가입한 SNS</dt><dd>{lookupName('sns_id', me.sns_id) || '-'}</dd>
                            <dt>휴대폰</dt>
                            <dd className={styles.phone}>
                                {verified ? <>{formatPhone(me.phone)}<Badge tone="ok">인증 완료</Badge></> : <><Badge tone="warn">인증 전</Badge><Link href={PHONE_VERIFY_PATH} className={buttonClass({size: 'sm'})}>휴대폰 인증하기</Link></>}
                            </dd>
                            <dt>성별</dt><dd>{lookupName('gender', me.gender)}</dd>
                            <dt>생년월일</dt><dd>{formatKoreanDate(me.birth)}</dd>
                            <dt>가입일</dt><dd>{formatKoreanDate(me.created_at)}</dd>
                            <dt>회원 식별 코드</dt><dd className={pageStyles.mono}>{me.user_search_code}</dd>
                        </dl>
                    </section>

                    {/* ② 메뉴 */}
                    <nav className={styles.menu} aria-label="마이 메뉴">
                        <Link href="/reservation/" className={styles.menuRow}>내 예약{CHEVRON_ICON}</Link>
                        <Link href="/store-applications/" className={styles.menuRow}>입점 신청{CHEVRON_ICON}</Link>
                    </nav>

                    {/* ⑤ 로그아웃 · ④ 탈퇴 신청(탈퇴 대기면 없음) */}
                    <Button full disabled={busy} onClick={logout}>로그아웃</Button>
                    {leaving ? null : <button type="button" className={styles.leave} disabled={busy} onClick={() => setLeaveOpen(true)}>탈퇴 신청</button>}
                </div>
            ) : null}

            {/* 탈퇴 사유 */}
            <ReasonModal open={leaveOpen} title="탈퇴 신청" description="탈퇴를 신청하면 14일 뒤 탈퇴돼요. 그 전까지는 로그인해서 철회할 수 있어요." label="탈퇴 사유(선택)" name="leave_comment" maxLength={LEAVE_COMMENT_MAX} required={false} confirmLabel="탈퇴 신청" danger busy={busy} onConfirm={leave} onClose={() => setLeaveOpen(false)} />
        </div>
    );
}
```

### 1-2. 입점 신청 목록 — `StoreApplicationListContent`

형제 `MyReservationContent` 그대로(쪽은 화면 상태, 응답 data 가 없으면 빈 목록). 승인 카드는 안에 복사 버튼이 있어 카드 전체를 링크로 못 한다 — 이름만 링크(시안 :1636).

```tsx
// src/app/(user)/store-applications/StoreApplicationListContent.tsx
'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getMyStoreApplications } from '@/contracts/store/api';
import { StoreMyApplicationItemResultDto, StoreMyApplicationListDto } from '@/contracts/store/dto/store-my-application-list.dto';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { PaginationType } from '@/shared/types/pagination';
import UserTopBar from '../_components/UserTopBar';
import ApplicationCard from './_components/ApplicationCard';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/StoreApplicationListContent.module.css';

/** 한 쪽 신청 수 */
const PAGE_SIZE = 20;

/** 받은 한 쪽 — 응답에 data 가 없으면 빈 목록 */
type ApplicationPageType = {
    list: Array<StoreMyApplicationItemResultDto>; // 신청(신청일 최신순)
    pagination: PaginationType | null;            // 페이지
};

/** 더하기 — 시안 U11 새 입점 신청 */
const PLUS_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>;

/**
 * U11 입점 신청 목록 — 새 입점 신청 · 내 신청 카드 · 페이지
 *
 * @returns
 */
export default function StoreApplicationListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 이용자 토큰
    const loadPage = useEffectEvent((page: number, signal: AbortSignal) => getMyStoreApplications(auth, new StoreMyApplicationListDto({page, size: PAGE_SIZE}), signal)); // 그때의 auth 로

    // 상태
    const [page, setPage] = useState<number>(1);                               // 보는 쪽
    const [result, setResult] = useState<ApplicationPageType | null>(null);    // 목록 — 불러오기 전 null

    // 계산 값
    const applications = result?.list ?? []; // 신청

    // 효과
    useEffect(() => {
        // ① · ④ 쪽이 바뀌면 그 쪽 — 떠나면 취소
        const controller = new AbortController();
        loadPage(page, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult({list: next?.list ?? [], pagination: next?.pagination ?? null});
            }
        }).catch((error: unknown) => handleApiError(error));

        return () => {
            controller.abort();
        };
    }, [page]);

    return (
        // 입점 신청 목록
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="입점 신청" backHref="/me/" />

            <div className={pageStyles.body}>
                {/* ② 새 입점 신청 */}
                <section className={pageStyles.card}>
                    <h2 className={pageStyles.cardTitle}>무인 객실 업체를 운영하나요?</h2>
                    <p className={styles.introText}>입점 신청을 보내면 관리자가 확인한 뒤 업체 콘솔을 열어 드려요.</p>
                    <Link href="/store-applications/new/" className={buttonClass({variant: 'primary', full: true})}>{PLUS_ICON}새 입점 신청</Link>
                </section>

                {/* ② · ③ 내 신청 */}
                <h2 className={styles.sectionTitle}>내 신청</h2>
                {result && applications.length === 0 ? <EmptyState title="아직 보낸 입점 신청이 없어요" description="위의 새 입점 신청으로 시작해요." /> : null}
                {applications.map((item) => <ApplicationCard key={item.store_application_id} item={item} />)}

                {/* ④ 페이지 */}
                <Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="입점 신청 페이지" />
            </div>
        </div>
    );
}
```

```tsx
// src/app/(user)/store-applications/_components/ApplicationCard.tsx
import Link from 'next/link';
import { lookupName } from '@/contracts/common/lookup';
import { StoreMyApplicationItemResultDto } from '@/contracts/store/dto/store-my-application-list.dto';
import CopyButton from '@/shared/components/ui/button/CopyButton';
import Badge from '@/shared/components/ui/display/Badge';
import { formatBusinessNumber, formatKoreanDate } from '@/shared/utils/format';
import { applicationStateTone, storeConsoleLoginUrl } from '../store-application-format';
import styles from '@/app/css/user/StoreApplicationListContent.module.css';

type ApplicationCardProps = {
    item: StoreMyApplicationItemResultDto; // 신청 한 건
};

/** 업체코드 앞 몇 자만 — 시안은 "3f9a2c7e…"(전체는 title) */
const CODE_PREVIEW = 8;

/**
 * 신청 카드 — 이름 · 상태 · 사업자등록번호 · 신청일, 반려면 사유, 승인이면 업체코드 · 로그인 주소 · 복사(시안 user.html U11 목록)
 * - 승인 카드는 복사 버튼이 있어 이름만 링크, 그 밖은 카드 전체가 링크
 *
 * @param param0
 * @returns
 */
export default function ApplicationCard({item}: ApplicationCardProps): React.ReactNode {
    // 계산 값
    const href = `/store-applications/${encodeURIComponent(item.store_application_id)}/`;                                   // 상세
    const meta = `사업자등록번호 ${formatBusinessNumber(item.business_number)} · 신청일 ${formatKoreanDate(item.created_at)}`;   // 둘째 줄
    const badge = <Badge tone={applicationStateTone(item.store_application_state_id)}>{lookupName('store_application_state_id', item.store_application_state_id)}</Badge>; // 상태

    if (item.store_code) {
        const loginUrl = storeConsoleLoginUrl(item.store_code); // 업체 콘솔 로그인 주소
        return (
            // 승인 — 이름만 링크
            <div className={styles.card}>
                <div className={styles.head}><Link href={href} className={styles.name}>{item.store_name}</Link>{badge}</div>
                <span className={styles.meta}>{meta}</span>
                <div className={styles.approved}>
                    <div className={styles.approvedRow}>
                        <span className={styles.approvedLabel}>업체코드</span>
                        <span className={styles.code} title={item.store_code}>{item.store_code.slice(0, CODE_PREVIEW)}…</span>
                    </div>
                    <span className={styles.approvedLabel}>업체 관리자 콘솔 로그인 주소</span>
                    <span className={styles.url}>{loginUrl}</span>
                    <p className={styles.approvedText}>이 주소에서 신청 때 정한 아이디 · 비밀번호로 로그인하세요.</p>
                    <CopyButton text={loginUrl} label="로그인 주소 복사" size="md" full />
                </div>
            </div>
        );
    }

    return (
        // 대기 · 반려 — 카드 전체가 링크
        <Link href={href} className={styles.card}>
            <div className={styles.head}><strong className={styles.name}>{item.store_name}</strong>{badge}</div>
            <span className={styles.meta}>{meta}</span>
            {item.reject_comment ? (
                <div className={styles.reject}>
                    <span className={styles.rejectLabel}>반려 사유</span>
                    <p className={styles.rejectText}>{item.reject_comment}</p>
                </div>
            ) : null}
        </Link>
    );
}
```

### 1-3. 입점 신청 작성 — `StoreApplicationFormContent`

입력 칸은 `name`(= DTO 필드)으로 한 함수가 받는다 — 번호 칸은 `digitsOnly`, 남길 말은 500자. 주소 칸은 읽기 전용이라 주소 검색으로만 바뀌고 좌표가 같이 들어간다 — 주소가 비면 주소 칸 옆 오류만 보이고(좌표 칸은 없어 위도 · 경도 오류는 팝업으로 가지 않는다 — `validateAction` 은 칸에 하나라도 보이면 팝업을 띄우지 않는다, `src/shared/utils/validation.ts:96`). 들어올 때 `preloadAddressSearch`(클릭 직후 팝업을 열어야 막히지 않는다 — docs/integrations.md).

```tsx
// src/app/(user)/store-applications/new/StoreApplicationFormContent.tsx
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
```

### 1-4. 입점 신청 상세 — `StoreApplicationDetailContent`

형제 `ReservationDetailContent`(효과 이벤트로 그때의 auth · 없는 것은 안내 뒤 목록 · 효과는 ID · 다시 불러오기에만). 파일 올리기는 `uploadFile` 의 두 단계를 **try 밖에서** 만들어 넘긴다(try 안에는 await 만). 올리기 · 지우기는 성공 · 실패 · 늦어짐 모두 상세를 다시 부른다(큐 늦어짐은 다시 조회 — 그사이 붙었을 수 있다). 신청 취소 결과도 DTO 가 null 이라 done · pending 이 같다 — 목록으로 가면 목록이 지금 상태를 보여 준다.

```tsx
// src/app/(user)/store-applications/[store_application_id]/StoreApplicationDetailContent.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { cancelStoreApplication, deleteStoreApplicationFile, getMyStoreApplication, issueStoreApplicationFileUrl, registerStoreApplicationFile } from '@/contracts/store/api';
import { StoreApplicationFileUploadUrlDto } from '@/contracts/store/dto/store-application-file-upload-url.dto';
import { StoreApplicationFileDto, StoreApplicationFileResultDto } from '@/contracts/store/dto/store-application-file.dto';
import { StoreMyApplicationFileResultDto, StoreMyApplicationResultDto } from '@/contracts/store/dto/store-my-application.dto';
import { handleApiError } from '@/shared/api/error';
import { ApiError } from '@/shared/api/request';
import { uploadFile, UploadStepsType } from '@/shared/api/upload';
import Button from '@/shared/components/ui/button/Button';
import CopyButton from '@/shared/components/ui/button/CopyButton';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatBusinessNumber, formatKoreanDate, formatPhone } from '@/shared/utils/format';
import UserTopBar from '../../_components/UserTopBar';
import { APPLICATION_STATE, applicationStateTone, FILE_PURPOSE, storeConsoleLoginUrl } from '../store-application-format';
import ApplicationFiles from './_components/ApplicationFiles';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/StoreApplicationDetailContent.module.css';

type StoreApplicationDetailContentProps = {
    applicationId: string; // 주소의 입점 신청 ID
};

/** 없는 · 남의 신청 */
const APPLICATION_NOT_FOUND_MESSAGE = '입점 신청을 찾을 수 없습니다.';

/** 신청 취소 뒤 */
const APPLICATION_CANCELED_MESSAGE = '입점 신청을 취소했어요.';

/** 신청 목록 */
const LIST_PATH = '/store-applications/';

/**
 * U11 입점 신청 상세 — 상태 띠 · (승인) 업체 콘솔 · 파일 · 신청 내용, 대기면 파일 올리기 · 지우기 · 신청 취소
 *
 * @param param0
 * @returns
 */
export default function StoreApplicationDetailContent({applicationId}: StoreApplicationDetailContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                                                                       // 취소 뒤 · 없는 신청이면 목록
    const auth = useContext(AuthContext);                                                             // 이용자 토큰
    const loadDetail = useEffectEvent((signal: AbortSignal) => getMyStoreApplication(auth, applicationId, signal)); // 그때의 auth 로
    const leaveNotFound = useEffectEvent((): void => {
        showErrorPopup(APPLICATION_NOT_FOUND_MESSAGE);
        router.replace(LIST_PATH);
    });                                                                                               // 없는 신청 — 안내 뒤 목록

    // 상태
    const [detail, setDetail] = useState<StoreMyApplicationResultDto | null>(null);         // 신청 상세
    const [reloadKey, setReloadKey] = useState<number>(0);                                  // 다시 불러오기(올리기 · 지우기 뒤)
    const [busy, setBusy] = useState<boolean>(false);                                       // 올리는 중 · 지우는 중 · 취소 중
    const [deleting, setDeleting] = useState<StoreMyApplicationFileResultDto | null>(null); // 지울 파일 — 확인 창
    const [cancelOpen, setCancelOpen] = useState<boolean>(false);                           // 신청 취소 확인 창

    // 계산 값
    const state = detail?.store_application_state_id ?? '';                                                      // 신청 상태
    const editable = state === APPLICATION_STATE.WAIT;                                                           // 대기 — 파일 · 취소
    const files = detail?.files ?? [];                                                                           // 업체 정보 파일
    const licenses = files.filter((file) => file.store_file_purpose_id === FILE_PURPOSE.LICENSE);               // 사업자등록증
    const images = files.filter((file) => file.store_file_purpose_id === FILE_PURPOSE.IMAGE);                   // 업체 사진
    const consoleUrl = detail?.store_code ? storeConsoleLoginUrl(detail.store_code) : '';                        // 업체 콘솔 로그인 주소(승인)
    const summaryMeta = editable ? `신청일 ${formatKoreanDate(detail?.created_at)} · 관리자가 확인하고 있어요` : `신청일 ${formatKoreanDate(detail?.created_at)} · 처리일 ${formatKoreanDate(detail?.reviewed_at)}`; // 요약 둘째 줄

    // 효과
    useEffect(() => {
        // ① 상세 — 없거나 남의 신청이면 목록(떠나면 취소)
        const controller = new AbortController();
        loadDetail(controller.signal).then((next) => {
            if (controller.signal.aborted) {
                return;
            }

            if (!next) {
                leaveNotFound();
                return;
            }

            setDetail(next);
        }).catch((error: unknown) => {
            if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
                leaveNotFound();
                return;
            }

            handleApiError(error);
        });

        return () => {
            controller.abort();
        };
    }, [applicationId, reloadKey]);

    // 함수
    function reload(): void {
        // 상세 다시
        setReloadKey((key) => key + 1);
    }

    async function upload(purpose: string, file: File): Promise<void> {
        // ③ 올리기 — 업로드 주소 발급 → PUT → 등록(큐) → 상세 다시(성공 · 실패 · 늦어짐 모두)
        const steps: UploadStepsType<StoreApplicationFileResultDto> = {
            issue: (content_type) => issueStoreApplicationFileUrl(auth, applicationId, Object.assign(new StoreApplicationFileUploadUrlDto(), {store_file_purpose_id: purpose, content_type})),
            register: (uploaded) => registerStoreApplicationFile(auth, applicationId, Object.assign(new StoreApplicationFileDto(), {store_file_purpose_id: purpose, ...uploaded})),
        };
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await uploadFile(file, steps);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error);
        }
        reload();
    }

    async function confirmDelete(): Promise<void> {
        // ③ 지우기 — 확인 뒤 큐 → 상세 다시
        const target = deleting;
        if (!target) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteStoreApplicationFile(auth, applicationId, target.store_file_id);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setDeleting(null);
        if (failure) {
            handleApiError(failure.error);
        }
        reload();
    }

    async function confirmCancel(): Promise<void> {
        // ④ 신청 취소 — 확인 뒤 큐 → 목록(실패면 창을 닫고 상세 다시)
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await cancelStoreApplication(auth, applicationId);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setBusy(false);
            setCancelOpen(false);
            handleApiError(failure.error);
            reload();
            return;
        }

        showErrorPopup(APPLICATION_CANCELED_MESSAGE);
        router.replace(LIST_PATH);
    }

    return (
        // 입점 신청 상세
        <div className={pageStyles.page}>
            {/* 상단 바 */}
            <UserTopBar title="입점 신청 상세" backHref={LIST_PATH} />

            {detail ? (
                <>
                    {/* ② 요약 */}
                    <section className={styles.summary}>
                        <div className={styles.summaryHead}>
                            <h2 className={styles.storeName}>{detail.store_name}</h2>
                            <Badge tone={applicationStateTone(state)}>{lookupName('store_application_state_id', state)}</Badge>
                        </div>
                        <span className={styles.meta}>{summaryMeta}</span>
                    </section>

                    {/* ② 상태 띠 — 대기 · 사업자등록증 없음 / 반려 사유 / 승인 */}
                    {editable && licenses.length === 0 ? <Band tone="warn" title="사업자등록증 사진이 아직 없어요.">사진이 있어야 관리자가 승인할 수 있어요.</Band> : null}
                    {state === APPLICATION_STATE.REJECTED ? <Band tone="danger" title="반려된 신청이에요">{detail.reject_comment ?? '반려 사유가 없어요.'}</Band> : null}
                    {detail.store_code ? <Band tone="ok" title="입점이 승인되었어요.">아래 주소에서 업체 관리자 콘솔에 로그인할 수 있어요.</Band> : null}

                    <div className={pageStyles.body}>
                        {/* ② 업체 관리자 콘솔(승인) */}
                        {detail.store_code ? (
                            <section className={pageStyles.card} aria-labelledby="application-console-title">
                                <h2 id="application-console-title" className={pageStyles.cardTitle}>업체 관리자 콘솔</h2>
                                <div className={pageStyles.stack}>
                                    <span className={styles.fieldLabel}>업체코드</span>
                                    <span className={pageStyles.mono}>{detail.store_code}</span>
                                </div>
                                <div className={pageStyles.stack}>
                                    <span className={styles.fieldLabel}>업체 관리자 콘솔 로그인 주소</span>
                                    <span className={styles.urlBox}>{consoleUrl}</span>
                                </div>
                                <p className={styles.text}>이 주소에서 신청 때 정한 아이디 · 비밀번호로 로그인하세요.</p>
                                <CopyButton text={consoleUrl} label="로그인 주소 복사" size="md" variant="primary" full />
                            </section>
                        ) : null}

                        {/* ③ 업체 정보 파일 */}
                        <ApplicationFiles licenses={licenses} images={images} editable={editable} busy={busy} onUpload={upload} onDelete={setDeleting} />

                        {/* ⑤ 신청 내용 */}
                        <section className={pageStyles.card} aria-labelledby="application-content-title">
                            <h2 id="application-content-title" className={pageStyles.cardTitle}>신청 내용</h2>
                            <dl className={`${pageStyles.dl} ${styles.contentDl}`}>
                                <dt>상호명</dt><dd>{detail.store_name}</dd>
                                <dt>사업자등록번호</dt><dd>{formatBusinessNumber(detail.business_number)}</dd>
                                <dt>대표자명</dt><dd>{detail.owner_name}</dd>
                                <dt>대표자 휴대폰</dt><dd>{formatPhone(detail.owner_phone)}</dd>
                                <dt>총관리자 아이디</dt><dd>{detail.head_manager_login_id}</dd>
                                <dt>업체 연락처</dt><dd>{formatPhone(detail.phone)}</dd>
                                <dt>주소</dt><dd>{detail.address_detail ? `${detail.address}, ${detail.address_detail}` : detail.address}</dd>
                                <dt>남길 말</dt><dd>{detail.application_comment ?? '없음'}</dd>
                            </dl>
                        </section>
                    </div>

                    {/* ④ 신청 취소(대기만) */}
                    {editable ? (
                        <div className={pageStyles.footer}>
                            <Button variant="danger" size="lg" full disabled={busy} onClick={() => setCancelOpen(true)}>신청 취소</Button>
                        </div>
                    ) : null}

                    {/* 확인 창 — 사진 지우기 · 신청 취소 */}
                    <ConfirmModal open={deleting !== null} title="사진 지우기" message="이 사진을 지울까요?" confirmLabel="지우기" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
                    <ConfirmModal open={cancelOpen} title="신청 취소" message="입점 신청을 취소할까요? 올린 파일도 함께 지워져요." confirmLabel="신청 취소" danger busy={busy} onConfirm={confirmCancel} onClose={() => setCancelOpen(false)} />
                </>
            ) : null}
        </div>
    );
}
```

```tsx
// src/app/(user)/store-applications/[store_application_id]/_components/ApplicationFiles.tsx
import Image from 'next/image';
import { ChangeEvent } from 'react';
import { StoreMyApplicationFileResultDto } from '@/contracts/store/dto/store-my-application.dto';
import { buttonClass } from '@/shared/components/ui/button/Button';
import { FILE_MAX, FILE_PURPOSE } from '../../store-application-format';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/ApplicationFiles.module.css';

type ApplicationFilesProps = {
    licenses: Array<StoreMyApplicationFileResultDto>;            // 사업자등록증(1장)
    images: Array<StoreMyApplicationFileResultDto>;              // 업체 사진(5장까지)
    editable: boolean;                                           // 대기 — 올리기 · 지우기
    busy: boolean;                                               // 올리는 중 · 지우는 중
    onUpload: (purpose: string, file: File) => void;             // 고른 파일 — 화면이 uploadFile · 다시 조회
    onDelete: (file: StoreMyApplicationFileResultDto) => void;   // 지우기 — 확인 창은 화면이
};

/** 고를 수 있는 형식 — JPG · PNG(DTO) */
const ACCEPT = 'image/jpeg,image/png';

/** 아이콘 — 시안 U11 상세 */
const UPLOAD_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 20h16" /></svg>;
const PLUS_ICON = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
const TRASH_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></svg>;

/**
 * 업체 정보 파일 — 사업자등록증(1장) · 업체 사진(5장까지) 칸, 대기면 올리기 · 지우기(시안 user.html U11 상세 — 사용자 결정: 이 화면 전용)
 * - 신청 파일에는 대표 · 순서가 없어 공통 ImageUploader 대신 이 부품을 쓴다. 올리기는 화면이 uploadFile 로
 *
 * @param param0
 * @returns
 */
export default function ApplicationFiles({licenses, images, editable, busy, onUpload, onDelete}: ApplicationFilesProps): React.ReactNode {
    // 계산 값
    const canAddLicense = editable && licenses.length < FILE_MAX.BUSINESS_LICENSE; // 사업자등록증 올리기
    const canAddImage = editable && images.length < FILE_MAX.STORE_IMAGE;          // 업체 사진 올리기

    // 함수
    function pick(purpose: string, event: ChangeEvent<HTMLInputElement>): void {
        // 고른 파일 한 장을 화면에 — 같은 파일을 다시 고를 수 있게 칸을 비운다
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) {
            onUpload(purpose, file);
        }
    }

    function pickLicense(event: ChangeEvent<HTMLInputElement>): void {
        // 사업자등록증
        pick(FILE_PURPOSE.LICENSE, event);
    }

    function pickImage(event: ChangeEvent<HTMLInputElement>): void {
        // 업체 사진
        pick(FILE_PURPOSE.IMAGE, event);
    }

    return (
        // 업체 정보 파일
        <section className={pageStyles.card} aria-labelledby="application-files-title">
            <h2 id="application-files-title" className={pageStyles.cardTitle}>업체 정보 파일</h2>

            {/* 사업자등록증 */}
            <div className={styles.block}>
                <div className={styles.blockHead}><span className={styles.blockTitle}>사업자등록증</span><span className={styles.count}>{licenses.length} / {FILE_MAX.BUSINESS_LICENSE}장</span></div>
                {licenses.length > 0 ? (
                    <div className={styles.grid}>
                        {licenses.map((file) => <Thumb key={file.store_file_id} file={file} label="사업자등록증" editable={editable} busy={busy} onDelete={onDelete} />)}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <span className={styles.emptyText}>아직 올린 사진이 없어요</span>
                        {canAddLicense ? (
                            <label className={`${buttonClass({})} ${busy ? styles.disabled : ''}`}>
                                <input type="file" accept={ACCEPT} className={styles.fileInput} disabled={busy} onChange={pickLicense} />
                                {UPLOAD_ICON}사업자등록증 올리기
                            </label>
                        ) : null}
                    </div>
                )}
            </div>

            {/* 업체 사진 */}
            <div className={styles.block}>
                <div className={styles.blockHead}><span className={styles.blockTitle}>업체 사진</span><span className={styles.count}>{images.length} / {FILE_MAX.STORE_IMAGE}장</span></div>
                <div className={styles.grid}>
                    {images.map((file, index) => <Thumb key={file.store_file_id} file={file} label={`업체 사진 ${index + 1}`} editable={editable} busy={busy} onDelete={onDelete} />)}
                    {canAddImage ? (
                        <label className={`${styles.add} ${busy ? styles.disabled : ''}`}>
                            <input type="file" accept={ACCEPT} className={styles.fileInput} disabled={busy} onChange={pickImage} />
                            {PLUS_ICON}사진 올리기
                        </label>
                    ) : null}
                </div>
            </div>

            {/* 안내 */}
            <p className={styles.note}>{editable ? 'JPG · PNG 사진만 올릴 수 있어요.' : '대기 중인 신청만 파일을 고칠 수 있어요.'}</p>
        </section>
    );
}

type ThumbProps = {
    file: StoreMyApplicationFileResultDto;                     // 파일
    label: string;                                             // 대체 글 · 지우기 버튼 이름
    editable: boolean;                                         // 지우기를 보일지
    busy: boolean;                                             // 지우기 막기
    onDelete: (file: StoreMyApplicationFileResultDto) => void; // 지우기
};

/**
 * 사진 한 칸 — 대기면 오른쪽 위 지우기
 *
 * @param param0
 * @returns
 */
function Thumb({file, label, editable, busy, onDelete}: ThumbProps): React.ReactNode {
    return (
        // 사진
        <div className={styles.thumb}>
            <Image src={file.file_url} alt={label} fill sizes="120px" unoptimized className={styles.img} />
            {editable ? <button type="button" className={styles.remove} aria-label={`${label} 지우기`} disabled={busy} onClick={() => onDelete(file)}>{TRASH_ICON}</button> : null}
        </div>
    );
}
```

---

## 2. 계산 함수

### 2-1. 전화번호 글자 · 사업자등록번호 글자 — `format.ts`

받은 값이 숫자만이 아니거나 모양이 다르면 그대로 돌려준다(화면이 깨지지 않게). `formatKoreanDate` 는 계산 규칙 밖(TDD 대상 아님) — `YYYY-MM-DD`(이미 한국 날짜 — 생년월일)는 그대로 읽고, ISO 시각은 `toKst` 로.

```ts
// src/shared/utils/format.ts — 더함(맨 아래)
/**
 * 전화번호 — 숫자만 있는 번호를 하이픈으로 나눈다(휴대폰 3-4-4 · 서울 02 · 지역 3자리 · 8자리 대표번호), 모양이 다르면 그대로
 *
 * @param value 숫자만 있는 번호(01012345678)
 */
export function formatPhone(value: string | null | undefined): string {
    const digits = value ?? '';
    if (!/^\d+$/.test(digits)) {
        return digits;
    }

    if (digits.length === 8) {
        return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }

    if (digits.startsWith('02') && (digits.length === 9 || digits.length === 10)) {
        return `02-${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
    }

    if (digits.length === 10 || digits.length === 11) {
        return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(-4)}`;
    }

    return digits;
}

/**
 * 사업자등록번호 — 10자리 숫자는 3-2-5, 모양이 다르면 그대로
 *
 * @param value 숫자 10자리(1234567890)
 */
export function formatBusinessNumber(value: string | null | undefined): string {
    const digits = value ?? '';
    return /^\d{10}$/.test(digits) ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}` : digits;
}

/**
 * 날짜 → 'YYYY년 M월 D일' — 'YYYY-MM-DD'(이미 한국 날짜)는 그대로 읽고, ISO 시각은 한국 시각으로, 읽을 수 없으면 ''
 *
 * @param value 'YYYY-MM-DD' 또는 ISO 시각
 */
export function formatKoreanDate(value: string | null | undefined): string {
    const ymd = /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? (value ?? '') : toKst(value, 'YYYY-MM-DD');
    if (!ymd) {
        return '';
    }

    const [year, month, day] = ymd.split('-').map(Number);
    return `${year}년 ${month}월 ${day}일`;
}
```

### 2-2. 입력 칸 숫자만 남기기 — `util.ts`

```ts
// src/shared/utils/util.ts — 더함(맨 아래)
/**
 * 숫자만 남기기 — 붙여 넣은 번호의 하이픈 · 공백을 빼고 max 자리까지
 *
 * @param value 입력한 글자
 * @param max 남길 자릿수
 */
export function digitsOnly(value: string, max: number): string {
    return value.replace(/\D/g, '').slice(0, max);
}
```

### 2-3. 업체 콘솔 로그인 주소 — `store-application-format.ts`

`managerLoginUrl` 은 프론트 주소 · 하위 경로를 인자로 받아 테스트하고, 화면은 빌드 때 박히는 값으로 감싼 `storeConsoleLoginUrl` 을 쓴다(`window` 를 읽지 않아 서버 렌더에서도 같은 값). 상태 색은 객체 대신 `Map`(형제 `reservation-state.ts`).

```ts
// src/app/(user)/store-applications/store-application-format.ts
/** 입점 신청 상태 — 대기만 파일을 바꾸고 취소한다 */
export const APPLICATION_STATE = {WAIT: 'WAIT', APPROVED: 'APPROVED', REJECTED: 'REJECTED'} as const;

/** 업체 정보 파일 용도 */
export const FILE_PURPOSE = {LICENSE: 'BUSINESS_LICENSE', IMAGE: 'STORE_IMAGE'} as const;

/** 용도별 최대 장수 — StoreApplicationFileUploadUrlDto(사업자등록증 1장 · 업체 사진 5장) */
export const FILE_MAX = {BUSINESS_LICENSE: 1, STORE_IMAGE: 5} as const;

/** 신청 상태 → 배지 색(시안: 대기 warn · 승인 ok · 반려 danger) */
const STATE_TONE = new Map<string, 'warn' | 'ok' | 'danger'>([[APPLICATION_STATE.WAIT, 'warn'], [APPLICATION_STATE.APPROVED, 'ok'], [APPLICATION_STATE.REJECTED, 'danger']]);

/**
 * 신청 상태 → 배지 색, 모르는 상태는 neutral
 *
 * @param stateId store_application_state_id
 */
export function applicationStateTone(stateId: string): 'warn' | 'ok' | 'danger' | 'neutral' {
    return STATE_TONE.get(stateId) ?? 'neutral';
}

/**
 * 업체 콘솔 로그인 주소 — <프론트 주소><하위 경로>/manager/<업체코드>/login/(지침서 U11 · trailingSlash)
 *
 * @param storeCode 업체코드
 * @param serverUrl 프론트 주소(끝 '/' 는 떼고 붙인다)
 * @param basePath 하위 경로('' 이거나 '/app' 처럼 '/' 로 시작)
 */
export function managerLoginUrl(storeCode: string, serverUrl: string, basePath: string): string {
    return `${serverUrl.replace(/\/+$/, '')}${basePath}/manager/${encodeURIComponent(storeCode)}/login/`;
}

/**
 * 이 배포의 업체 콘솔 로그인 주소 — 빌드 때 박히는 NEXT_PUBLIC_SERVER_URL · NEXT_PUBLIC_LOCAL_SERVER_PREFIX 로
 *
 * @param storeCode 업체코드
 */
export function storeConsoleLoginUrl(storeCode: string): string {
    return managerLoginUrl(storeCode, process.env.NEXT_PUBLIC_SERVER_URL ?? '', process.env.NEXT_PUBLIC_LOCAL_SERVER_PREFIX ?? '');
}
```

---

## 3. 공용 부품을 넓히는 곳 — 규약만으로 예측할 수 없는 부분

### 3-1. 회원 상태 띠가 탈퇴 대기의 할 일을 받는다 — `MemberStateBand.tsx`

다른 화면(예약 · 연장)에서는 지금처럼 마이페이지로 가는 링크, 마이페이지는 철회 버튼을 넘긴다(시안 U10 탈퇴 대기 — 띠 안 버튼).

```tsx
// src/app/(user)/_components/MemberStateBand.tsx — 바뀌는 곳
type MemberStateBandProps = {
    me: Pick<UserMeResultDto, 'state_id' | 'block_comment' | 'leave_reserved_at'> | null; // 내 정보 — 없으면 그리지 않음
    action?: React.ReactNode;                                                               // 탈퇴 대기 띠의 할 일 — 없으면 마이페이지로 가는 "탈퇴 철회하기" 링크
};

export default function MemberStateBand({me, action}: MemberStateBandProps): React.ReactNode {
    // …(이용 제한은 그대로)
    if (me?.state_id === 'LEAVE_WAIT') {
        return (
            // 탈퇴 대기
            <Band tone="warn" title="탈퇴 대기 중이에요">
                <span>{formatLeaveAt(me.leave_reserved_at)}에 탈퇴돼요. 그 전까지 철회할 수 있어요.</span>
                {action ?? <Link href="/me/">탈퇴 철회하기</Link>}
            </Band>
        );
    }
    // …
}
```

### 3-2. 승인 띠 — `Band` 의 `ok` 톤

```tsx
// src/shared/components/ui/display/Band.tsx — 바뀌는 곳
type BandProps = {
    tone?: 'info' | 'warn' | 'danger' | 'ok'; // ok — 승인 · 완료(입점 승인)
    title?: string;
    children?: React.ReactNode;
};
```

```css
/* src/shared/css/ui/display/Band.module.css — 더함(.danger 아래) */
.ok {
    background: var(--ok-soft);
    color: var(--ok);
}
```

### 3-3. 복사 버튼 모양 — `CopyButton` 의 `variant` · `full`

시안 U11 — 목록 카드는 기본 · 가로 꽉, 상세 콘솔 카드는 주 버튼 · 가로 꽉.

```tsx
// src/shared/components/ui/button/CopyButton.tsx — 바뀌는 곳
type CopyButtonProps = {
    text: string;                                // 복사할 글자 (예: 업체 로그인 주소)
    label?: string;                              // 기본 '복사'
    size?: 'md' | 'sm' | 'lg';
    variant?: 'default' | 'primary';             // 기본 'default'
    full?: boolean;                              // 가로 꽉 채움
};

export default function CopyButton({text, label = '복사', size = 'sm', variant = 'default', full = false}: CopyButtonProps): React.ReactNode {
    // …
    return (
        // 복사 버튼 — 복사하면 잠깐 "복사됨"
        <Button size={size} variant={variant} full={full} onClick={copy} aria-live="polite">
            {copied ? '복사됨' : label}
        </Button>
    );
}
```

### 3-4. 이용자 화면 공통 css 이름 — `ReservationPage.module.css` → `UserPage.module.css`

카드 · 머리 · dl · 아래 영역이 예약 화면만의 것이 아니게 되어(마이페이지 · 입점 신청이 같이 씀) 이름을 바꾼다. 내용은 그대로, 첫 줄 주석만 "이용자 화면 공통". 예약 화면 13곳 import 를 같이 고친다(`git mv` + 찾아 바꾸기 — 다른 내용은 건드리지 않는다).

```css
/* src/app/css/user/UserPage.module.css — 첫 줄만 바뀜 */
/* 이용자 화면 공통 — 머리 · 카드 · 히어로 · dl · 합계 · 아래 영역(U3 결제 대기 · U4 · U6 ~ U11, 시안 user.html) */
```

---

## 4. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| DTO 사본 8개(`user-leave` · store 7개) | `copy-dto.js` 로 `frontend/dto/user.md` · `store.md` 블록 그대로 | `src/contracts/user/dto/user-token-refresh.dto.ts:5` |
| `leaveUser(auth, dto)` · `cancelLeave(auth)` | `withAuth` + `callQueue<null>` DELETE · PATCH `/user-service/user/leave`(결과 DTO 없음 — 화면이 내 정보로 확인) | `src/contracts/user/api.ts:87` |
| `getMyStoreApplications(auth, query, signal?)` · `getMyStoreApplication(auth, id, signal?)` | `withAuth` + `request` GET `/user-service/store/application/mine`(query `page · size`) · `/mine/<id>` | `src/contracts/reservation/api.ts`(`getMyReservations` · `getReservation`) |
| `createStoreApplication(auth, dto)` · `cancelStoreApplication(auth, id)` · `registerStoreApplicationFile(auth, id, dto)` · `deleteStoreApplicationFile(auth, id, fileId)` | `withAuth` + `callQueue` POST `/user-service/store/application` · DELETE `/mine/<id>`(`Promise<null>`) · POST `/mine/<id>/file` · DELETE `/mine/<id>/file/<fileId>`(`Promise<null>`), ID 는 `encodeURIComponent` | `src/contracts/reservation/api.ts`(`cancelReservation`) |
| `issueStoreApplicationFileUrl(auth, id, dto)` | 업로드 주소는 **동기** — `withAuth` + `request` POST `/mine/<id>/file/upload-url` 본문 | `frontend/api.md:139` · `src/shared/api/upload.ts:19` |
| page.tsx 4개 | 얇은 page + `<AuthGuard>`, 상세는 `params.store_application_id` 를 Content 로 | `src/app/(user)/reservation/[reservation_id]/page.tsx` |

---

## 5. 스타일 — 시안 값

형제가 없는 새 화면이라 값을 싣는다. 색 · 크기는 `globals.css` 토큰만(시안의 `--success` = `--ok`, `--surface-soft` = `--surface-2`, `--neutral(-soft)` = `--neutral-fg` · `--neutral-bg`).

```css
/* src/app/css/user/MyPageContent.module.css — 시안 user.html U10(:1492-1600) */
.profile {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
}

.avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 999px;
    background: var(--neutral-bg);
    color: var(--neutral-fg);
}

.profileText {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    min-width: 0;
}

.nickname {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
}

.infoDl {
    grid-template-columns: 100px minmax(0, 1fr);
    align-items: center;
    line-height: 1.5;
}

.phone {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
}

.menu {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
}

.menuRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 52px;
    padding: 0 16px;
    color: var(--fg);
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
}

.menuRow + .menuRow {
    border-top: 1px solid var(--line);
}

.menuRow svg {
    color: var(--muted);
}

/* 탈퇴 신청 — 밑줄 글자 버튼 */
.leave {
    align-self: center;
    height: 44px;
    padding: 0 12px;
    border: 0;
    background: transparent;
    color: var(--danger);
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    text-decoration: underline;
    cursor: pointer;
}

/* 탈퇴 대기 띠 안 — 탈퇴 철회 */
.withdraw {
    align-self: flex-start;
    height: 40px;
    margin-top: 4px;
    padding: 0 16px;
    border: 1px solid var(--warn);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--warn);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
}

.leave:disabled,
.withdraw:disabled {
    opacity: 0.5;
    cursor: default;
}
```

```css
/* src/app/css/user/StoreApplicationListContent.module.css — 시안 user.html U11 목록(:1605-1651) */
.introText {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--muted);
}

.sectionTitle {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 700;
}

.card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px;
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
    color: var(--fg);
    text-decoration: none;
}

.head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.name {
    font-size: 16px;
    font-weight: 700;
    color: var(--fg);
    text-decoration: none;
}

.meta {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
}

.reject {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--danger-soft);
}

.rejectLabel {
    font-size: 12px;
    font-weight: 700;
    color: var(--danger);
}

.rejectText {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
}

.approved {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--ok-soft);
}

.approvedRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.approvedLabel {
    font-size: 12px;
    font-weight: 700;
    color: var(--ok);
}

.code {
    font-family: var(--mono);
    font-size: 14px;
    font-weight: 700;
}

.url {
    font-family: var(--mono);
    font-size: 12px;
    word-break: break-all;
}

.approvedText {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
}
```

```css
/* src/app/css/user/StoreApplicationFormContent.module.css — 시안 user.html U11 작성(:1652-1739) */
.body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
}

.section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    background: var(--surface);
}

.sectionTitle {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
}

.optional {
    margin-left: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
}

.addressRow {
    display: flex;
    gap: 8px;
}

.addressRow > :first-child {
    flex: 1;
    min-width: 0;
}

.readonly {
    background: var(--surface-2);
}

.count {
    display: block;
    text-align: right;
}

.note {
    margin: 0;
    padding: 0 16px 16px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--muted);
}
```

```css
/* src/app/css/user/StoreApplicationDetailContent.module.css — 시안 user.html U11 상세(:1740-1881) */
.summary {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px;
    border-bottom: 1px solid var(--line);
    background: var(--surface);
}

.summaryHead {
    display: flex;
    align-items: center;
    gap: 8px;
}

.storeName {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
}

.meta {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
}

.fieldLabel {
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
}

.urlBox {
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface-2);
    font-family: var(--mono);
    font-size: 13px;
    line-height: 1.5;
    word-break: break-all;
}

.text {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
}

.contentDl {
    grid-template-columns: 112px minmax(0, 1fr);
    line-height: 1.5;
}
```

```css
/* src/app/css/user/ApplicationFiles.module.css — 시안 user.html U11 상세 파일(:1764-1786 · :1843) */
.block {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.blockHead {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
}

.blockTitle {
    font-size: 14px;
    font-weight: 700;
}

.count {
    font-size: 13px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
}

.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 16px;
    border: 1px dashed var(--warn);
    border-radius: var(--radius);
}

.emptyText {
    font-size: 13px;
    color: var(--muted);
}

.grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
}

.thumb {
    position: relative;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    border-radius: var(--radius);
    background: var(--neutral-bg);
}

.img {
    object-fit: cover;
}

.remove {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 999px;
    background: var(--surface);
    color: var(--fg);
    cursor: pointer;
}

.add {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    aspect-ratio: 1 / 1;
    border: 1px dashed var(--line);
    border-radius: var(--radius);
    background: var(--surface-2);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

/* 파일 칸 — 라벨이 누름을 받고 칸은 보이지 않게(키보드 · 화면 읽기는 그대로) */
.fileInput {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
}

.disabled {
    opacity: 0.5;
    pointer-events: none;
}

.note {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
}
```

---

## 테스트

spec 의 "결과" 표에서 ✓ 표시된 8건과 "계산 규칙" 표 12건을 그대로 테스트로 옮긴다. 추가분은 없다.

테스트 모양(형제 `src/test/app/(user)/reservation/**`):
- 계산 — `src/test/shared/utils/format.test.ts`(`formatPhone` 4 · `formatBusinessNumber` 2 더함) · `util.test.ts`(`digitsOnly` 3 더함) · `src/test/app/(user)/store-applications/store-application-format.test.ts`(`managerLoginUrl` 3).
- `MyPageContent.test.tsx` — `@/contracts/user/api`(`leaveUser` · `cancelLeave`) mock, `UserMeContext.Provider` 의 `reloadMe` 를 `vi.fn` 으로(첫 값 · 다음 값) 넘겨 호출 횟수 · 인자 확인.
- `StoreApplicationListContent.test.tsx` · `new/StoreApplicationFormContent.test.tsx`(`@/shared/utils/address` mock — `searchAddressWithCoords` 가 좌표를 돌려줌) · `[store_application_id]/StoreApplicationDetailContent.test.tsx`(`@/shared/api/upload` 의 `uploadFile` mock — 받은 단계 `issue` 를 불러 용도 확인) — `@/contracts/store/api` · `next/navigation` · `error-popup` mock, `RootLayoutProvider`(로그인함).

## 만드는 순서

1. DTO 사본 8개 → 2. 계산 함수(`format` · `util` · `store-application-format`)와 그 테스트 → 3. contracts(user 2 · store 7) · 공용 부품 넓히기(`MemberStateBand` · `Band` · `CopyButton`) · css 이름 바꾸기 → 4. 화면(마이페이지 → 목록 → 작성 → 상세)과 화면 테스트 → 5. 스타일 → 6. 문서(AGENTS.md 표시 형식 줄 · `docs/integrations.md` 파일 올리기에 입점 신청 · `docs/conventions.md` 공통 부품 목록의 `Band` 톤 · `CopyButton`)
