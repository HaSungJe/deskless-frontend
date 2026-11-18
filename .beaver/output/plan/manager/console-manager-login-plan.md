# Plan — 업체 콘솔 — 콘솔 틀 · 매니저 로그인 · 대시보드

> 무엇을·왜는 [spec](../../spec/manager/console-manager-login-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 진입점마다 비즈니스 로직 전체 ② 계산 함수 ③ 규약만으로 예측할 수 없는 데이터 규칙
> **싣지 않는 것** page 껍데기, DTO 사본, 형제와 같은 contracts 함수 — 따르는 패턴을 표 한 줄로 가리킨다

로드맵 Phase 10(#31 ~ #36)과 Phase 14 의 #48(M2 대시보드 — 사용자 결정 2026-11-18)을 이 plan 하나로 만든다.

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/app/manager/layout.tsx` | 신규 | 매니저 영역 전체에 콘솔 크기(`data-area="console"`) | 생략 |
| `src/app/manager/(console)/layout.tsx` · `ManagerConsoleLayoutContent.tsx` | 신규 | 콘솔 틀 — 로그인 가드 · 내 업체 · 계정 · 메뉴 · 로그아웃 | 아래 1-1 |
| `src/app/manager/(console)/manager-console-context.ts` | 신규 | `ManagerConsoleContext`(내 업체 · 계정 · 다시 읽기) | 아래 1-1 |
| `src/app/manager/(console)/manager-menu.tsx` | 신규 | 업체 관리자 메뉴 7개(아이콘 · 권한) | 아래 2-1 |
| `src/shared/components/console/ConsoleShell.tsx` · `console-menu.ts` | 신규 | 공용 콘솔 틀(왼쪽 메뉴 · 상단 바) · 메뉴 고르기 — 관리자 콘솔(Phase 15)도 쓴다 | 아래 1-1 · 2-1 |
| `src/shared/components/console/ConsoleAuthFrame.tsx` · `ConsoleAuthCard.tsx` | 신규 | 로그인 계열 바탕(로고 + 가운데 카드) — 관리자 A1 도 쓴다 | 아래 3-4 |
| `src/app/manager/[store_code]/login/page.tsx` · `ManagerLoginContent.tsx` | 신규 | M1 업체 로그인 | 아래 1-2 |
| `src/app/api/manager/login/route.ts` | 신규 | 로그인 처리 — 백엔드 로그인 → 쿠키 | 아래 1-3 |
| `src/app/manager/[store_code]/find-login-id/page.tsx` · `ManagerFindLoginIdContent.tsx` | 신규 | M1 아이디 찾기 | 아래 1-4 |
| `src/app/manager/[store_code]/password-reset/page.tsx` · `ManagerPasswordResetContent.tsx` | 신규 | M1 비밀번호 초기화 | 아래 1-5 |
| `src/app/manager/[store_code]/_components/SmsSteps.tsx` | 신규 | 1 · 2 단계 표시(아이디 찾기 · 초기화) | 아래 1-4 |
| `src/app/manager/login/page.tsx` · `ManagerLoginGuideContent.tsx` · `dto.ts` | 신규 | M1 업체 로그인 주소 안내(기억한 업체코드면 서버에서 바로 보냄) | 아래 1-6 |
| `src/app/manager/password/page.tsx` · `ManagerPasswordContent.tsx` | 신규 | M1 비밀번호 변경 | 아래 1-7 |
| `src/app/manager/(console)/page.tsx` · `ManagerDashboardContent.tsx` | 신규 | M2 대시보드 | 아래 1-8 |
| `src/app/manager/manager-auth.ts` | 신규 | 업체코드 쿠키 이름 · 업체 로그인 주소 · 업체코드 줄임 · 로그인 뒤 주소 · 권한 배지 | 아래 2-2 |
| `src/shared/utils/format.ts` | 수정 | `formatManwon` | 아래 2-3 |
| `src/shared/components/chart/BarChart.tsx` | 고쳐 씀 | 쓰지 않던 템플릿 → 묶음 막대(색은 토큰 값) | 아래 3-3 |
| `src/app/api/cookie/token-cookie.ts` | 수정 | 계정 쿠키 쓰기 · 읽기 · 지우기, 오래 기억하는 쿠키, 재발급 때 계정 쿠키 만료 갱신 | 아래 3-1 |
| `src/app/api/cookie/[area]/account/route.ts` | 신규 | 기억한 계정 읽기 `GET /api/cookie/<area>/account/` | 아래 3-2 |
| `src/shared/api/cookie.ts` | 수정 | `getAreaAccount(area)` · `AreaAccountType` | 아래 3-2 |
| `src/app/api/route-util.ts` · `src/app/api/user/sns-session.ts` · `src/app/api/user/sign/route.ts` | 수정 | `block_comment` 칸 · `INVALID_REQUEST_MESSAGE` 를 route-util 로 옮김 | 아래 3-5 |
| `src/contracts/manager/dto/` 6개(`manager-login` · `manager-find-login-id` · `manager-find-login-id-confirm` · `manager-password-reset` · `manager-password-reset-confirm` · `manager-password`) · `src/contracts/store/dto/store-mine.dto.ts` · `src/contracts/stats/dto/stats-mine.dto.ts` | 신규 | 지침서 사본 | 생략 |
| `src/contracts/manager/api.ts` | 수정 | 로그인 · 로그인 route · 아이디 찾기 · 초기화 · 비밀번호 변경 | 일부 (아래 1-3) |
| `src/contracts/store/api.ts` · `src/contracts/stats/api.ts` | 수정 · 신규 | `getMyStore` · `getMyStats` | 생략 |
| `src/app/css/manager/*.module.css` · `src/shared/css/console/*.module.css` | 신규 | 시안 값 | 아래 5 |
| 테스트 10파일 + `src/test/app/api/cookie/token-cookie.test.ts`(더함) | 신규 · 수정 | spec 테스트 | 아래 테스트 |
| `AGENTS.md` · `docs/data-layer.md` · `docs/architecture.md` · `docs/conventions.md` | 수정 | 매니저 로그인 route · 계정 · 업체코드 쿠키, 콘솔 틀 · 로그인 바탕 부품 | 만드는 순서 7 |

---

## 1. 비즈니스 로직 — 화면별 코드

### 1-1. 콘솔 틀 — `ManagerConsoleLayoutContent` · `ConsoleShell`

틀은 `(console)/layout.tsx` 가 `<AuthGuard>` 로 감싼 안에서만 그린다 — 내 업체 상세는 토큰이 있어야 읽힌다. 효과 이벤트는 앞에 선언된 `auth` 만 쓰고 상태는 효과의 `.then` 에서 바꾼다(React Compiler).

```ts
// src/app/manager/(console)/manager-console-context.ts
'use client';
import { createContext } from 'react';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { AreaAccountType } from '@/shared/api/cookie';

/** 콘솔 틀이 나눠 주는 값 — 대시보드(영업중지 띠) · 내 업체 설정(Phase 11) */
export type ManagerConsoleContextType = {
    store: StoreMineResultDto | null;                      // 내 업체 상세 — 아직 · 못 읽었으면 null
    account: AreaAccountType | null;                       // 로그인 때 기억한 계정(아이디 · 권한) — 쿠키가 없으면 null
    reloadStore: () => Promise<StoreMineResultDto | null>; // 다시 읽기(내 업체 설정을 바꾼 뒤) — 못 읽으면 이전 값을 두고 null
};

export const ManagerConsoleContext = createContext<ManagerConsoleContextType>({store: null, account: null, reloadStore: async () => null});
```

```tsx
// src/app/manager/(console)/ManagerConsoleLayoutContent.tsx
'use client';
import { usePathname } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getMyStore } from '@/contracts/store/api';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { AreaAccountType, getAreaAccount } from '@/shared/api/cookie';
import { handleApiError } from '@/shared/api/error';
import ConsoleShell from '@/shared/components/console/ConsoleShell';
import { visibleMenu } from '@/shared/components/console/console-menu';
import Badge from '@/shared/components/ui/display/Badge';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { AREA_LOGIN_PATH } from '@/shared/utils/area';
import { replaceDocument } from '@/shared/utils/base-path';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { MANAGER_AUTH_BADGE, shortStoreCode } from '../manager-auth';
import { ManagerConsoleContext } from './manager-console-context';
import { MANAGER_MENU } from './manager-menu';
import styles from '@/app/css/manager/ManagerConsoleLayoutContent.module.css';

type ManagerConsoleLayoutContentProps = {
    children: React.ReactNode;
};

/** 토큰 쿠키를 지우지 못함 */
const LOGOUT_FAILED_MESSAGE = '로그아웃하지 못했어요. 잠시 뒤 다시 시도해 주세요.';

/** 비밀번호 변경 — 상단 바 링크(띠 없이) */
const PASSWORD_PATH = '/manager/password/';

/**
 * 업체 관리자 콘솔 틀 — 내 업체 · 계정을 읽어 상단 바 · 권한별 메뉴를 그리고 Context 로 나눈다
 *
 * @param param0
 * @returns
 */
export default function ManagerConsoleLayoutContent({children}: ManagerConsoleLayoutContentProps): React.ReactNode {
    // 변수
    const pathname = usePathname();                                                       // 지금 주소 — 메뉴 강조
    const auth = useContext(AuthContext);                                                 // 매니저 토큰
    const loadStore = useEffectEvent((signal: AbortSignal) => getMyStore(auth, signal)); // 그때의 auth 로 내 업체 상세

    // 상태
    const [store, setStore] = useState<StoreMineResultDto | null>(null);       // 내 업체 상세
    const [account, setAccount] = useState<AreaAccountType | null>(null);      // 기억한 계정
    const [loggingOut, setLoggingOut] = useState<boolean>(false);              // 로그아웃 중 — 두 번 누름 막기

    // 계산 값
    const menu = visibleMenu(MANAGER_MENU, account?.auth_id ?? null);          // ④ 업체 관리자 메뉴는 업체 총관리자만
    const badge = account ? MANAGER_AUTH_BADGE.get(account.auth_id) : undefined; // 권한 배지 글자 · 색

    // 효과
    useEffect(() => {
        // ② 들어오면 내 업체 상세와 기억한 계정을 읽는다(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadStore(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setStore(next);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });
        getAreaAccount('manager').then((next) => {
            if (!controller.signal.aborted) {
                setAccount(next);
            }
        });

        return () => {
            controller.abort();
        };
    }, []);

    // 함수
    async function reloadStore(): Promise<StoreMineResultDto | null> {
        // 내 업체 상세 다시 — 못 읽으면 이전 값을 두고 null
        const next = await getMyStore(auth).catch((): null => null);
        if (next) {
            setStore(next);
        }

        return next;
    }

    async function logout(): Promise<void> {
        // ⑤ 로그아웃 — 토큰 · 계정 쿠키만 지우고(업체코드 쿠키는 남는다) 업체 로그인 주소 안내 문서를 새로 연다 → 기억한 업체 로그인
        setLoggingOut(true);
        const deleted = await auth.logout();
        if (!deleted) {
            setLoggingOut(false);
            showErrorPopup(LOGOUT_FAILED_MESSAGE);
            return;
        }

        replaceDocument(AREA_LOGIN_PATH.manager);
    }

    return (
        // 콘솔 Context + 틀
        <ManagerConsoleContext.Provider value={{store, account, reloadStore}}>
            <ConsoleShell
                areaName="업체 관리자 콘솔"
                menu={menu}
                pathname={pathname}
                heading={store ? <><b className={styles.storeName}>{store.store_name}</b><span className={styles.storeCode}>업체코드 {shortStoreCode(store.store_code)}</span></> : null}
                account={account ? <><span>{account.login_id}</span>{badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}</> : null}
                passwordHref={PASSWORD_PATH}
                loggingOut={loggingOut}
                onLogout={logout}
            >
                {children}
            </ConsoleShell>
        </ManagerConsoleContext.Provider>
    );
}
```

```tsx
// src/shared/components/console/ConsoleShell.tsx
import Link from 'next/link';
import Button from '@/shared/components/ui/button/Button';
import { activeMenuHref, ConsoleMenuItemType } from './console-menu';
import styles from '@/shared/css/console/ConsoleShell.module.css';

type ConsoleShellProps = {
    areaName: string;                       // 로고 아래 글자 — "업체 관리자 콘솔"
    menu: Array<ConsoleMenuItemType>;       // 보일 메뉴(권한으로 거른 것)
    pathname: string;                       // 지금 주소 — 강조할 메뉴
    heading: React.ReactNode;               // 상단 바 왼쪽(업체 이름 · 업체코드) — 아직 없으면 null
    account: React.ReactNode;               // 상단 바 오른쪽 계정(아이디 · 배지) — 없으면 null
    passwordHref: string;                   // 비밀번호 변경
    loggingOut: boolean;                    // 로그아웃 중
    onLogout: () => void;                   // 로그아웃
    children: React.ReactNode;              // 화면
};

/** 로고 — 시안 manager.html `#i-logo` */
const LOGO = <svg className={styles.mark} viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="7" fill="var(--primary)" /><path d="M10 21V8h8v13M8 21h12" fill="none" stroke="var(--on-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="15.5" cy="14.5" r="1.2" fill="var(--on-primary)" /></svg>;

/**
 * 콘솔 틀 — 왼쪽 메뉴 232px · 상단 바(왼쪽 heading, 오른쪽 계정 · 비밀번호 변경 · 로그아웃) · 본문
 * - 본문은 메뉴 옆 flex-wrap 줄이라 좁으면 메뉴가 위로 쌓인다(시안 콘솔 틀)
 * - 도메인을 모른다 — 메뉴 · 글자는 영역 layout 이 넘긴다(업체 관리자 · 관리자)
 *
 * @param param0
 * @returns
 */
export default function ConsoleShell({areaName, menu, pathname, heading, account, passwordHref, loggingOut, onLogout, children}: ConsoleShellProps): React.ReactNode {
    // 계산 값
    const activeHref = activeMenuHref(pathname, menu); // 강조할 메뉴

    return (
        // 콘솔
        <div className={styles.console}>
            {/* 왼쪽 메뉴 */}
            <aside className={styles.side} aria-label="메뉴">
                <div className={styles.logo}>{LOGO}<div><b>roomless</b><small>{areaName}</small></div></div>
                <nav className={styles.nav} aria-label={`${areaName} 메뉴`}>
                    {menu.map((item) => (
                        <Link key={item.href} href={item.href} aria-current={item.href === activeHref ? 'page' : undefined}>
                            <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg>
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            <div className={styles.main}>
                {/* 상단 바 */}
                <header className={styles.top}>
                    <div className={styles.topLeft}>{heading}</div>
                    <div className={styles.topRight}>
                        {account}
                        <Link href={passwordHref} className={styles.passwordLink}>비밀번호 변경</Link>
                        <Button size="sm" disabled={loggingOut} onClick={onLogout}>로그아웃</Button>
                    </div>
                </header>

                {/* 화면 */}
                <main className={styles.page}>{children}</main>
            </div>
        </div>
    );
}
```

### 1-2. 업체 로그인 — `ManagerLoginContent`

실패 띠는 받은 문구를 그대로 보인다(어느 칸이 틀렸는지 가르지 않는 404 · 정지 403 + 정지 사유). 칸 오류(`validation_errors`)가 오면 띠 대신 공통 처리로 칸 옆에.

```tsx
// src/app/manager/[store_code]/login/ManagerLoginContent.tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { loginManagerByRoute, ManagerLoginRouteResultType } from '@/contracts/manager/api';
import { ManagerLoginDto } from '@/contracts/manager/dto/manager-login.dto';
import { handleApiError } from '@/shared/api/error';
import { ApiError } from '@/shared/api/request';
import ConsoleAuthCard from '@/shared/components/console/ConsoleAuthCard';
import ConsoleAuthFrame from '@/shared/components/console/ConsoleAuthFrame';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { safeReturnPath } from '@/shared/utils/area';
import { validateAction } from '@/shared/utils/validation';
import { afterManagerLoginPath, managerStorePath } from '../../manager-auth';
import styles from '@/app/css/manager/ManagerLoginContent.module.css';

type ManagerLoginContentProps = {
    storeCode: string;        // 주소의 업체코드 — 화면에서 받지 않는다
    returnUrl: string | null; // 로그인 뒤 돌아갈 주소
};

/** 로그인 실패 띠 — 받은 문구 · 정지 사유 */
type LoginFailureType = {
    message: string;            // "잘못된 로그인 정보입니다." · "이용이 제한된 계정입니다."
    blockComment: string | null; // 정지 사유(403)
};

/** 문구 없이 실패했을 때 */
const LOGIN_FAILED_MESSAGE = '로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.';

/**
 * 띠로 보일 실패인지 — 칸 오류가 없는 ApiError(로그인 처리가 넘긴 백엔드 문구 · 다시 시도)
 * - 컴포넌트 밖(React Compiler — catch 안 값 계산을 건너뛴다)
 *
 * @param error 로그인 처리 실패
 * @returns 띠 내용, 칸 오류 · 그 밖의 오류면 null(공통 처리)
 */
function loginFailureOf(error: unknown): LoginFailureType | null {
    if (!(error instanceof ApiError) || (error.body.validation_errors?.length ?? 0) > 0) {
        return null;
    }

    const blockComment = typeof error.body.block_comment === 'string' && error.body.block_comment ? error.body.block_comment : null;
    return {message: error.body.message || LOGIN_FAILED_MESSAGE, blockComment};
}

/**
 * M1 업체 로그인 — 주소의 업체코드 + 아이디 · 비밀번호 → 로그인 처리 route → 비밀번호 변경 · 돌아갈 주소
 *
 * @param param0
 * @returns
 */
export default function ManagerLoginContent({storeCode, returnUrl}: ManagerLoginContentProps): React.ReactNode {
    // 변수
    const router = useRouter();             // 로그인 뒤 · 이미 로그인 때 이동
    const auth = useContext(AuthContext);   // 이미 매니저로 로그인했는지

    // 상태
    const [loginId, setLoginId] = useState<string>('');                       // 아이디
    const [loginPw, setLoginPw] = useState<string>('');                       // 비밀번호
    const [failure, setFailure] = useState<LoginFailureType | null>(null);    // 실패 띠
    const [submitting, setSubmitting] = useState<boolean>(false);             // 로그인 중 — 두 번 누름 막기

    // 효과
    useEffect(() => {
        // ② 이미 매니저로 로그인했으면 돌아갈 주소로
        if (auth.isLogin) {
            router.replace(safeReturnPath(returnUrl, 'manager'));
        }
    }, [auth.isLogin, returnUrl, router]);

    // 함수
    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        // ③ 주소의 업체코드 · 아이디 · 비밀번호 검사(틀린 칸 옆) → 로그인 처리
        event.preventDefault();
        const dto = Object.assign(new ManagerLoginDto(), {store_code: storeCode, login_id: loginId.trim(), login_pw: loginPw});
        if (submitting || !(await validateAction(dto))) {
            return;
        }

        setSubmitting(true);
        setFailure(null);
        let result: ManagerLoginRouteResultType | null = null; // 로그인 처리 결과
        let error: {cause: unknown} | null = null;             // 실패 — 처리는 try 밖에서(React Compiler)
        try {
            result = await loginManagerByRoute(dto);
        } catch (cause) {
            error = {cause};
        }

        if (!result) {
            // ⑤ 안 되면 띠(받은 문구 · 정지 사유), 칸 오류 · 그 밖은 공통 처리
            setSubmitting(false);
            const band = error ? loginFailureOf(error.cause) : null;
            if (band) {
                setFailure(band);
                return;
            }

            handleApiError(error?.cause);
            return;
        }

        // ④ 임시 비밀번호면 비밀번호 변경, 아니면 돌아갈 주소(없으면 대시보드) — 다른 화면으로 가므로 버튼은 막아 둔다
        router.replace(afterManagerLoginPath(result.is_password_change_required, returnUrl));
    }

    return (
        // 업체 로그인 — 메뉴 없는 가운데 카드
        <ConsoleAuthFrame areaName="업체 관리자 콘솔">
            <ConsoleAuthCard title="업체 관리자 로그인" description="아이디와 비밀번호를 입력해주세요.">
                {/* ⑤ 실패 띠 */}
                {failure ? (
                    <Band tone="danger" title={failure.message}>{failure.blockComment ? `정지 사유: ${failure.blockComment}` : null}</Band>
                ) : null}

                {/* ① 아이디 · 비밀번호 */}
                <form className={styles.form} onSubmit={submit} noValidate>
                    <Field label="아이디" name="login_id" htmlFor="manager-login-id">
                        <Input id="manager-login-id" autoComplete="username" value={loginId} onChange={(event) => setLoginId(event.target.value)} />
                    </Field>
                    <Field label="비밀번호" name="login_pw" htmlFor="manager-login-pw">
                        <Input id="manager-login-pw" type="password" autoComplete="current-password" value={loginPw} onChange={(event) => setLoginPw(event.target.value)} />
                    </Field>
                    <Button type="submit" variant="primary" full disabled={submitting}>로그인</Button>
                </form>

                {/* 같은 업체코드 주소의 아이디 찾기 · 비밀번호 초기화 */}
                <div className={styles.links}>
                    <Link href={managerStorePath(storeCode, 'find-login-id')}>아이디 찾기</Link>
                    <span aria-hidden="true">|</span>
                    <Link href={managerStorePath(storeCode, 'password-reset')}>비밀번호 초기화</Link>
                </div>
            </ConsoleAuthCard>
        </ConsoleAuthFrame>
    );
}
```

### 1-3. 로그인 처리 — `POST /api/manager/login/` · `loginManagerByRoute`

쿠키 셋은 백엔드 로그인이 된 뒤에만 쓴다. 계정 쿠키의 아이디는 로그인 결과에 없어 요청 본문의 값(백엔드가 받아들인 값)을 쓴다.

```ts
// src/app/api/manager/login/route.ts
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { STORE_CODE_COOKIE, STORE_CODE_REMEMBER_DAYS } from '@/app/manager/manager-auth';
import { loginManager } from '@/contracts/manager/api';
import { ManagerLoginDto, ManagerLoginResultDto } from '@/contracts/manager/dto/manager-login.dto';
import { NETWORK_ERROR_MESSAGE } from '@/shared/api/error';
import { ApiError } from '@/shared/api/request';
import { setAccountCookie, setRememberCookie, setTokenCookies } from '../../cookie/token-cookie';
import { INVALID_REQUEST_MESSAGE, isSameSiteJson, json } from '../../route-util';

/**
 * 매니저 로그인 — Next 서버가 백엔드 manager/login(동기) → 토큰 · 계정 · 업체코드 쿠키
 * - 재발급도 Next 서버가 부르므로 로그인 IP 와 재발급 IP 가 같다(docs/data-layer.md "⚠️ 백엔드 재발급")
 * - 백엔드 4xx 는 message · validation_errors · block_comment 그대로, 쿠키는 쓰지 않는다. 네트워크 · 5xx 는 retry
 *
 * @param request 본문 {store_code, login_id, login_pw}
 */
export async function POST(request: NextRequest): Promise<Response> {
    // ① 같은 사이트 JSON 만
    if (!isSameSiteJson(request)) {
        return json({success: false, message: INVALID_REQUEST_MESSAGE});
    }

    const form = (await request.json().catch((): null => null)) as Record<string, unknown> | null;
    const dto = Object.assign(new ManagerLoginDto(), {
        store_code: textOf(form?.store_code),
        login_id: textOf(form?.login_id),
        login_pw: textOf(form?.login_pw),
    });

    // ② 백엔드 로그인 — 거절(4xx)은 받은 본문 그대로
    let result: ManagerLoginResultDto | null = null;
    try {
        result = await loginManager(dto);
    } catch (error) {
        if (error instanceof ApiError && error.status < 500) {
            const blockComment = typeof error.body.block_comment === 'string' ? error.body.block_comment : null;
            return json({success: false, message: error.body.message, validation_errors: error.body.validation_errors, block_comment: blockComment});
        }

        console.log('[manager-login] 로그인 결과를 받지 못함 —', error instanceof Error ? error.message : error);
    }
    if (!result) {
        return json({success: false, message: NETWORK_ERROR_MESSAGE, retry: true});
    }

    // ③ 토큰 쿠키 2개 · 계정 쿠키(토큰과 같이 끝남) · 업체코드 쿠키(1년 — 로그아웃해도 남는다)
    const cookieStore = await cookies();
    await setTokenCookies(cookieStore, 'manager', result);
    await setAccountCookie(cookieStore, 'manager', {login_id: dto.login_id, auth_id: result.auth_id}, result.refresh_token_expires_at);
    await setRememberCookie(cookieStore, STORE_CODE_COOKIE, dto.store_code, STORE_CODE_REMEMBER_DAYS);
    return json({success: true, data: {is_password_change_required: result.is_password_change_required}});
}

/**
 * 본문 값 → 글자(아니면 빈 글자 — 백엔드 검증이 칸 오류로 돌려준다). 가입 route 와 같다(route 파일은 처리 함수만 내보낸다)
 *
 * @param value 본문 값
 */
function textOf(value: unknown): string {
    return typeof value === 'string' ? value : '';
}
```

```ts
// src/contracts/manager/api.ts — 더하는 것 중 route 를 부르는 함수(나머지는 아래 4)
/** 로그인 처리 route 결과 */
export type ManagerLoginRouteResultType = {
    is_password_change_required: number; // 1 이면 비밀번호 변경으로
};

/** 로그인 처리 route 본문(src/app/api/manager/login/route.ts) */
type ManagerLoginRouteBodyType = {
    success: boolean;
    data?: ManagerLoginRouteResultType;
    message?: string;
    validation_errors?: Array<ValidationErrorType> | null;
    block_comment?: string | null;
    retry?: boolean;
};

/**
 * 매니저 로그인 — 프론트 route(POST /api/manager/login/)를 거친다(서버가 백엔드 로그인 · 쿠키)
 * - 거절은 ApiError(문구 · 칸 오류 · block_comment 그대로), 다시 시도는 ApiError(503), 응답 없음은 NetworkError — signWithSns 와 같다
 *
 * @param dto 업체코드 · 아이디 · 비밀번호
 */
export async function loginManagerByRoute(dto: ManagerLoginDto): Promise<ManagerLoginRouteResultType> {
    const response = await sendRequest(withBasePath('/api/manager/login/'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({store_code: dto.store_code, login_id: dto.login_id, login_pw: dto.login_pw}),
    });
    if (!response.ok) {
        throw new NetworkError(new Error(`manager login route ${response.status}`));
    }

    const result = (await response.json().catch((): null => null)) as ManagerLoginRouteBodyType | null;
    if (!result) {
        throw new NetworkError(new Error('manager login route body'));
    }

    if (result.success && result.data) {
        return result.data;
    }

    throw new ApiError(result.retry ? 503 : 400, {message: result.message ?? '', validation_errors: result.validation_errors ?? null, block_comment: result.block_comment ?? null});
}
```

### 1-4. 아이디 찾기 — `ManagerFindLoginIdContent`

이용자 아이디 찾기(`src/app/(user)/find-login-id/FindLoginIdContent.tsx:33-69`)와 같은 흐름에 주소의 업체코드를 붙인다. 단계 표시는 발송이 되면 2단계.

```tsx
// src/app/manager/[store_code]/find-login-id/ManagerFindLoginIdContent.tsx
'use client';
import Link from 'next/link';
import { useState } from 'react';
import { confirmManagerFindLoginId, sendManagerFindLoginId } from '@/contracts/manager/api';
import { ManagerFindLoginIdConfirmDto, ManagerFindLoginIdConfirmResultDto } from '@/contracts/manager/dto/manager-find-login-id-confirm.dto';
import { ManagerFindLoginIdDto } from '@/contracts/manager/dto/manager-find-login-id.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import ConsoleAuthCard from '@/shared/components/console/ConsoleAuthCard';
import ConsoleAuthFrame from '@/shared/components/console/ConsoleAuthFrame';
import SmsVerification, { SmsSentType } from '@/shared/components/sms/SmsVerification';
import { buttonClass } from '@/shared/components/ui/button/Button';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { managerStorePath } from '../../manager-auth';
import SmsSteps from '../_components/SmsSteps';
import styles from '@/app/css/manager/ManagerFindLoginIdContent.module.css';

type ManagerFindLoginIdContentProps = {
    storeCode: string; // 주소의 업체코드
};

/**
 * M1 아이디 찾기 — 주소의 업체코드 + 번호 → 인증번호 → 아이디 · 등록일
 *
 * @param param0
 * @returns
 */
export default function ManagerFindLoginIdContent({storeCode}: ManagerFindLoginIdContentProps): React.ReactNode {
    // 상태
    const [sent, setSent] = useState<boolean>(false);                                    // 인증번호를 보냈는지 — 단계 표시
    const [found, setFound] = useState<ManagerFindLoginIdConfirmResultDto | null>(null); // 찾은 아이디

    // 함수
    async function send(phone: string): Promise<SmsSentType | null> {
        // ② 발송 — 주소의 업체코드 + 번호, DTO 검증 → 큐, 늦어지면 안내
        const dto = Object.assign(new ManagerFindLoginIdDto(), {store_code: storeCode, phone});
        if (!(await validateAction(dto))) {
            return null;
        }

        let result: SmsSentType | null = null;      // 발송 결과
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            result = await sendManagerFindLoginId(dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
            return null;
        }

        if (!result) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
            return null;
        }

        setSent(true);
        return result;
    }

    async function confirm(sms_verification_id: string, code: string): Promise<void> {
        // ③ 확인 — 아이디 · 등록일, ④ 늦어지면 안내
        const dto = Object.assign(new ManagerFindLoginIdConfirmDto(), {sms_verification_id, code});
        if (!(await validateAction(dto))) {
            return;
        }

        let result: ManagerFindLoginIdConfirmResultDto | null = null; // 찾은 아이디
        let failure: {error: unknown} | null = null;                   // 실패 — 처리는 try 밖에서
        try {
            result = await confirmManagerFindLoginId(dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
            return;
        }

        if (!result) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
            return;
        }

        setFound(result);
    }

    return (
        // 아이디 찾기 — 메뉴 없는 가운데 카드
        <ConsoleAuthFrame areaName="업체 관리자 콘솔">
            {found ? (
                // ③ 찾은 아이디
                <ConsoleAuthCard>
                    <div className={styles.resultHead}>
                        <span className={styles.okMark} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" /></svg></span>
                        <h1 className={styles.resultTitle}>계정 아이디를 찾았습니다.</h1>
                    </div>
                    <dl className={styles.summary}>
                        <dt>아이디</dt><dd><b>{found.login_id}</b></dd>
                        <dt>등록일</dt><dd>{toKst(found.created_at, 'YYYY-MM-DD')}</dd>
                    </dl>
                    <div className={styles.actions}>
                        <Link href={managerStorePath(storeCode, 'login')} className={buttonClass({variant: 'primary'})}>로그인</Link>
                        <Link href={managerStorePath(storeCode, 'password-reset')} className={buttonClass()}>비밀번호 초기화</Link>
                    </div>
                </ConsoleAuthCard>
            ) : (
                // ①② 번호 → 인증번호
                <ConsoleAuthCard title="아이디 찾기" description="계정에 등록된 휴대폰 번호로 인증번호를 받습니다.">
                    <SmsSteps sent={sent} />
                    <SmsVerification onSend={send} onConfirm={confirm} confirmLabel="확인" notice={false} />
                    <div className={styles.links}><Link href={managerStorePath(storeCode, 'login')}>로그인으로 돌아가기</Link></div>
                </ConsoleAuthCard>
            )}
        </ConsoleAuthFrame>
    );
}
```

```tsx
// src/app/manager/[store_code]/_components/SmsSteps.tsx
import styles from '@/app/css/manager/SmsSteps.module.css';

type SmsStepsProps = {
    sent: boolean; // 인증번호를 보냈는지 — 2단계
};

/**
 * 인증 단계 표시 — 1 인증번호 받기 · 2 인증번호 확인(시안 M1 `.steps`)
 *
 * @param param0
 * @returns
 */
export default function SmsSteps({sent}: SmsStepsProps): React.ReactNode {
    return (
        // 단계
        <ol className={styles.steps}>
            <li className={sent ? styles.done : undefined} aria-current={sent ? undefined : 'step'}><span className={styles.dot}>1</span>인증번호 받기</li>
            <li className={styles.line} aria-hidden="true" />
            <li aria-current={sent ? 'step' : undefined}><span className={styles.dot}>2</span>인증번호 확인</li>
        </ol>
    );
}
```

### 1-5. 비밀번호 초기화 — `ManagerPasswordResetContent`

확인 결과는 null(완료 · 늦어짐 같음)이고 다시 확인할 조회가 없어 됨으로 안내한다(spec 결정).

```tsx
// src/app/manager/[store_code]/password-reset/ManagerPasswordResetContent.tsx
'use client';
import Link from 'next/link';
import { useState } from 'react';
import { confirmManagerPasswordReset, sendManagerPasswordReset } from '@/contracts/manager/api';
import { ManagerPasswordResetConfirmDto } from '@/contracts/manager/dto/manager-password-reset-confirm.dto';
import { ManagerPasswordResetDto, ManagerPasswordResetResultDto } from '@/contracts/manager/dto/manager-password-reset.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import ConsoleAuthCard from '@/shared/components/console/ConsoleAuthCard';
import ConsoleAuthFrame from '@/shared/components/console/ConsoleAuthFrame';
import SmsVerification, { SmsSentType } from '@/shared/components/sms/SmsVerification';
import { buttonClass } from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { validateAction } from '@/shared/utils/validation';
import { managerStorePath } from '../../manager-auth';
import SmsSteps from '../_components/SmsSteps';
import styles from '@/app/css/manager/ManagerPasswordResetContent.module.css';

type ManagerPasswordResetContentProps = {
    storeCode: string; // 주소의 업체코드
};

/**
 * M1 비밀번호 초기화 — 주소의 업체코드 + 아이디 · 번호 → 인증번호 → 임시 비밀번호 문자
 *
 * @param param0
 * @returns
 */
export default function ManagerPasswordResetContent({storeCode}: ManagerPasswordResetContentProps): React.ReactNode {
    // 상태
    const [loginId, setLoginId] = useState<string>(''); // 아이디
    const [sent, setSent] = useState<boolean>(false);   // 인증번호를 보냈는지 — 단계 표시
    const [done, setDone] = useState<boolean>(false);   // 인증이 끝났는지 — 임시 비밀번호 안내

    // 함수
    async function send(phone: string): Promise<SmsSentType | null> {
        // ② 발송 — 업체코드 · 아이디 · 번호, DTO 검증 → 큐
        const dto = Object.assign(new ManagerPasswordResetDto(), {store_code: storeCode, login_id: loginId.trim(), phone});
        if (!(await validateAction(dto))) {
            return null;
        }

        let result: ManagerPasswordResetResultDto | null = null; // 발송 결과
        let failure: {error: unknown} | null = null;             // 실패 — 처리는 try 밖에서
        try {
            result = await sendManagerPasswordReset(dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
            return null;
        }

        if (!result) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
            return null;
        }

        setSent(true);
        return result;
    }

    async function confirm(sms_verification_id: string, code: string): Promise<void> {
        // ③ 확인(큐 — 결과 null) → 임시 비밀번호 안내
        const dto = Object.assign(new ManagerPasswordResetConfirmDto(), {sms_verification_id, code});
        if (!(await validateAction(dto))) {
            return;
        }

        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await confirmManagerPasswordReset(dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            handleApiError(failure.error);
            return;
        }

        setDone(true);
    }

    return (
        // 비밀번호 초기화 — 메뉴 없는 가운데 카드
        <ConsoleAuthFrame areaName="업체 관리자 콘솔">
            {done ? (
                // ③ 임시 비밀번호 안내
                <ConsoleAuthCard>
                    <div className={styles.resultHead}>
                        <span className={styles.okMark} aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg></span>
                        <h1 className={styles.resultTitle}>임시 비밀번호를 문자로 보냈습니다.</h1>
                    </div>
                    <Band tone="info">받은 임시 비밀번호(영문 + 숫자 10자리)로 로그인하면 비밀번호 변경 화면으로 이동합니다. 새 비밀번호로 바꿔 주세요. 문자가 오지 않으면 다시 초기화해 주세요.</Band>
                    <Link href={managerStorePath(storeCode, 'login')} className={buttonClass({variant: 'primary', full: true})}>로그인</Link>
                </ConsoleAuthCard>
            ) : (
                // ①② 아이디 · 번호 → 인증번호
                <ConsoleAuthCard title="비밀번호 초기화" description="아이디와 등록된 휴대폰 번호가 맞으면 인증번호를 보냅니다. 인증이 끝나면 임시 비밀번호가 문자로 갑니다.">
                    <SmsSteps sent={sent} />
                    <SmsVerification onSend={send} onConfirm={confirm} confirmLabel="확인" notice={false}>
                        <Field label="아이디" name="login_id" htmlFor="manager-reset-login-id">
                            <Input id="manager-reset-login-id" autoComplete="username" value={loginId} onChange={(event) => setLoginId(event.target.value)} />
                        </Field>
                    </SmsVerification>
                    <div className={styles.links}>
                        <Link href={managerStorePath(storeCode, 'login')}>로그인으로 돌아가기</Link>
                        <span aria-hidden="true">|</span>
                        <Link href={managerStorePath(storeCode, 'find-login-id')}>아이디 찾기</Link>
                    </div>
                </ConsoleAuthCard>
            )}
        </ConsoleAuthFrame>
    );
}
```

### 1-6. 업체 로그인 주소 안내 — `page.tsx`(서버) · `ManagerLoginGuideContent`

기억한 업체코드는 httpOnly 쿠키라 서버 page 에서 읽어 바로 보낸다(화면이 한 번 그려졌다가 넘어가지 않게). `redirect()` 는 basePath 를 Next 가 붙인다.

```tsx
// src/app/manager/login/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { firstQueryValue } from '@/shared/utils/util';
import { managerLoginPath, STORE_CODE_COOKIE } from '../manager-auth';
import ManagerLoginGuideContent from './ManagerLoginGuideContent';

// M1 업체 로그인 주소 안내 — /manager/login (기억한 업체코드가 있으면 그 업체 로그인으로)
export default async function ManagerLoginGuide({searchParams}: PageProps<'/manager/login'>): Promise<React.ReactNode> {
    const query = await searchParams;
    const returnUrl = firstQueryValue(query.return_url);

    // ① 기억한 업체코드 → 그 업체 로그인(돌아갈 주소를 들고)
    const remembered = managerLoginPath((await cookies()).get(STORE_CODE_COOKIE)?.value ?? '', returnUrl);
    if (remembered) {
        redirect(remembered);
    }

    return (
        // ② 없으면 안내
        <ManagerLoginGuideContent returnUrl={returnUrl} />
    );
}
```

```tsx
// src/app/manager/login/ManagerLoginGuideContent.tsx
'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import ConsoleAuthCard from '@/shared/components/console/ConsoleAuthCard';
import ConsoleAuthFrame from '@/shared/components/console/ConsoleAuthFrame';
import Button from '@/shared/components/ui/button/Button';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { validateAction } from '@/shared/utils/validation';
import { managerLoginPath } from '../manager-auth';
import { StoreCodeDto } from './dto';
import styles from '@/app/css/manager/ManagerLoginGuideContent.module.css';

type ManagerLoginGuideContentProps = {
    returnUrl: string | null; // 로그인 뒤 돌아갈 주소 — 업체 로그인으로 넘긴다
};

/**
 * M1 업체 로그인 주소 안내 — 업체코드를 붙여 넣으면 그 업체 로그인 화면으로(API 없음)
 *
 * @param param0
 * @returns
 */
export default function ManagerLoginGuideContent({returnUrl}: ManagerLoginGuideContentProps): React.ReactNode {
    // 변수
    const router = useRouter(); // 업체 로그인으로 이동

    // 상태
    const [storeCode, setStoreCode] = useState<string>(''); // 붙여 넣은 업체코드

    // 함수
    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        // ③ 앞뒤 공백을 지우고 32자 모양 검사(칸 아래 오류) → 그 업체 로그인
        event.preventDefault();
        const dto = Object.assign(new StoreCodeDto(), {store_code: storeCode.trim()});
        if (!(await validateAction(dto))) {
            return;
        }

        const next = managerLoginPath(dto.store_code, returnUrl);
        if (next) {
            router.push(next);
        }
    }

    return (
        // 업체 로그인 주소 안내 — 메뉴 없는 가운데 카드
        <ConsoleAuthFrame areaName="업체 관리자 콘솔">
            <ConsoleAuthCard wide title="업체 로그인 주소로 접속해 주세요" description="업체 관리자 콘솔은 업체마다 로그인 주소가 따로 있습니다. 업체 총관리자에게 받은 로그인 주소로 접속하고, 즐겨찾기해 두면 다음부터 바로 들어올 수 있습니다.">
                {/* ② 로그인 주소 모양 */}
                <p className={styles.sample}>로그인 주소 모양 · {`${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/manager/`}<b>업체코드 32자</b>/login</p>

                {/* ③ 업체코드 */}
                <form className={styles.form} onSubmit={submit} noValidate>
                    <Field label="업체코드" name="store_code" htmlFor="manager-guide-code" hint="영문 소문자 · 숫자 32자 — 내 업체 설정 › 기본 정보에서 업체 총관리자가 확인할 수 있습니다.">
                        <Input id="manager-guide-code" autoComplete="off" spellCheck={false} placeholder="로그인 주소 안의 32자를 붙여 넣으세요" value={storeCode} onChange={(event) => setStoreCode(event.target.value)} />
                    </Field>
                    <Button type="submit" variant="primary" full>로그인 화면으로 이동</Button>
                </form>
            </ConsoleAuthCard>
        </ConsoleAuthFrame>
    );
}
```

### 1-7. 비밀번호 변경 — `ManagerPasswordContent`

결과는 null(완료 · 늦어짐 같음)이고 확인할 조회가 없어 됨으로 안내한다(spec 결정). 로그인 가드는 page 가 감싼다(콘솔 틀 밖 — 시안대로 메뉴 없는 카드).

```tsx
// src/app/manager/password/ManagerPasswordContent.tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { changeManagerPassword } from '@/contracts/manager/api';
import { ManagerPasswordDto } from '@/contracts/manager/dto/manager-password.dto';
import { AreaAccountType, getAreaAccount } from '@/shared/api/cookie';
import { handleApiError } from '@/shared/api/error';
import ConsoleAuthCard from '@/shared/components/console/ConsoleAuthCard';
import ConsoleAuthFrame from '@/shared/components/console/ConsoleAuthFrame';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { AREA_HOME } from '@/shared/utils/area';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { validateAction } from '@/shared/utils/validation';
import { MANAGER_AUTH_BADGE } from '../manager-auth';
import styles from '@/app/css/manager/ManagerPasswordContent.module.css';

type ManagerPasswordContentProps = {
    required: boolean; // 임시 비밀번호로 로그인해서 왔는지(?required=1) — 안내 띠
};

/** 바꾼 뒤 */
const PASSWORD_CHANGED_MESSAGE = '비밀번호를 바꿨습니다.';

/**
 * M1 비밀번호 변경 — 현재 · 새 비밀번호 → 변경(큐) → 대시보드
 *
 * @param param0
 * @returns
 */
export default function ManagerPasswordContent({required}: ManagerPasswordContentProps): React.ReactNode {
    // 변수
    const router = useRouter();           // 바꾼 뒤 대시보드
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [account, setAccount] = useState<AreaAccountType | null>(null); // 기억한 계정 — 제목 아래
    const [currentPassword, setCurrentPassword] = useState<string>('');   // 현재 비밀번호
    const [newPassword, setNewPassword] = useState<string>('');           // 새 비밀번호
    const [submitting, setSubmitting] = useState<boolean>(false);         // 바꾸는 중

    // 계산 값
    const badge = account ? MANAGER_AUTH_BADGE.get(account.auth_id) : undefined; // 권한 배지

    // 효과
    useEffect(() => {
        // ① 기억한 계정(아이디 · 권한)
        let active = true;
        getAreaAccount('manager').then((next) => {
            if (active) {
                setAccount(next);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    // 함수
    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        // ③ 현재 · 새 비밀번호 검사(틀린 칸 옆) → 변경(큐) → ④ 안내 뒤 대시보드
        event.preventDefault();
        const dto = Object.assign(new ManagerPasswordDto(), {current_password: currentPassword, new_password: newPassword});
        if (submitting || !(await validateAction(dto))) {
            return;
        }

        setSubmitting(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await changeManagerPassword(auth, dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setSubmitting(false);
            handleApiError(failure.error);
            return;
        }

        showErrorPopup(PASSWORD_CHANGED_MESSAGE);
        router.replace(AREA_HOME.manager);
    }

    return (
        // 비밀번호 변경 — 메뉴 없는 가운데 카드
        <ConsoleAuthFrame areaName="업체 관리자 콘솔">
            <ConsoleAuthCard title="비밀번호 변경" description={account ? <span className={styles.account}>{account.login_id}{badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}</span> : null}>
                {/* ② 임시 비밀번호로 로그인했을 때만 */}
                {required ? <Band tone="warn">임시 비밀번호로 로그인했습니다. 새 비밀번호로 바꿔 주세요.</Band> : null}

                {/* ③ 현재 · 새 비밀번호 */}
                <form className={styles.form} onSubmit={submit} noValidate>
                    <Field label="현재 비밀번호" name="current_password" htmlFor="manager-current-password" hint="임시 비밀번호로 로그인했다면 문자로 받은 임시 비밀번호">
                        <Input id="manager-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                    </Field>
                    <Field label="새 비밀번호" name="new_password" htmlFor="manager-new-password" hint="8 ~ 20자, 영문과 숫자를 반드시 포함(특수문자는 !@#$%^&* 만)">
                        <Input id="manager-new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                    </Field>
                    <div className={styles.actions}>
                        <Link href={AREA_HOME.manager} className={buttonClass()}>취소</Link>
                        <Button type="submit" variant="primary" disabled={submitting}>비밀번호 변경</Button>
                    </div>
                </form>
            </ConsoleAuthCard>
        </ConsoleAuthFrame>
    );
}
```

### 1-8. 대시보드 — `ManagerDashboardContent`

조회는 "제출한 조건(`query`)"이 바뀔 때만 다시 부른다 — 칸을 고치는 동안은 부르지 않는다. 받은 기간으로 칸을 채워 빈 기간(최근 3개월)도 보이게 한다.

```tsx
// src/app/manager/(console)/ManagerDashboardContent.tsx
'use client';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getMyStats } from '@/contracts/stats/api';
import { StatsMineDto, StatsMineResultDto, StatsMineSummaryResultDto } from '@/contracts/stats/dto/stats-mine.dto';
import { handleApiError } from '@/shared/api/error';
import BarChart from '@/shared/components/chart/BarChart';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import Table from '@/shared/components/ui/display/Table';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Segmented, { SegmentedOptionType } from '@/shared/components/ui/form/Segmented';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatManwon } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { ManagerConsoleContext } from './manager-console-context';
import styles from '@/app/css/manager/ManagerDashboardContent.module.css';

/** 결제 환경 */
type EnvironmentType = 'LIVE' | 'TEST';

/** 합계 · 월별 항목 — 카드 · 표 줄 순서(시안 M2) */
const SUMMARY_ITEMS: Array<{key: keyof StatsMineSummaryResultDto; label: string; unit: string}> = [
    {key: 'user_count', label: '이용자 수', unit: '명'},
    {key: 'completed_count', label: '이용 건수', unit: '건'},
    {key: 'paid_amount', label: '결제액', unit: '원'},
    {key: 'refund_amount', label: '환불액', unit: '원'},
    {key: 'profit', label: '수익', unit: '원'},
];

/** 결제 환경 고르기 */
const ENVIRONMENT_OPTIONS: Array<SegmentedOptionType<EnvironmentType>> = [{value: 'LIVE', label: '실결제'}, {value: 'TEST', label: '테스트 결제'}];

/** 영업중지 업체 상태 */
const STORE_SUSPENDED = 'SUSPEND';

/** 숫자 쉼표 */
const NUMBER_FORMAT = new Intl.NumberFormat('ko-KR');

/**
 * M2 대시보드 — 기간 · 결제 환경 → 내 업체 통계(합계 카드 · 월별 그래프 · 월별 표), 영업중지 띠
 *
 * @returns
 */
export default function ManagerDashboardContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                            // 매니저 토큰
    const {store} = useContext(ManagerConsoleContext);                                                               // 내 업체 — 영업중지 띠
    const loadStats = useEffectEvent((query: StatsMineDto, signal: AbortSignal) => getMyStats(auth, query, signal)); // 그때의 auth 로

    // 상태
    const [startMonth, setStartMonth] = useState<string>('');                   // 시작 달 칸(YYYY-MM)
    const [endMonth, setEndMonth] = useState<string>('');                       // 끝 달 칸
    const [environment, setEnvironment] = useState<EnvironmentType>('LIVE');    // 결제 환경 칸
    const [query, setQuery] = useState<StatsMineDto>(() => new StatsMineDto()); // 제출한 조건 — 처음은 기간 비움 · 실결제
    const [stats, setStats] = useState<StatsMineResultDto | null>(null);       // 받은 통계

    // 계산 값
    const suspended = store?.store_state_id === STORE_SUSPENDED;                                       // ④ 영업중지
    const months = stats?.monthly ?? [];                                                               // 월별(오래된 달부터)
    const chartSeries = [
        {name: '결제액', data: months.map((month) => month.paid_amount), colorVar: '--primary'},
        {name: '환불액', data: months.map((month) => month.refund_amount), colorVar: '--warn'},
    ];                                                                                                 // ③ 월별 결제액 · 환불액 막대

    // 효과
    useEffect(() => {
        // ①② 제출한 조건으로 통계 — 받은 기간을 칸에 채운다(떠나거나 다시 조회하면 결과를 버린다)
        const controller = new AbortController();
        loadStats(query, controller.signal).then((next) => {
            if (controller.signal.aborted || !next) {
                return;
            }

            setStats(next);
            setStartMonth(next.period.start_month);
            setEndMonth(next.period.end_month);
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [query]);

    // 함수
    async function search(): Promise<void> {
        // ② 칸 값으로 다시 — 비운 달은 null(최근 3개월), 검사 뒤 제출
        const dto = new StatsMineDto({start_month: startMonth || null, end_month: endMonth || null, environment});
        if (!(await validateAction(dto))) {
            return;
        }

        setQuery(dto);
    }

    return (
        // 대시보드
        <div className={styles.page}>
            {/* 제목 */}
            <div>
                <h1 className={styles.title}>대시보드</h1>
                <p className={styles.subtitle}>내 업체의 이용 · 결제 통계(한국 달 기준)</p>
            </div>

            {/* ④ 영업중지 */}
            {suspended ? <Band tone="danger" title="영업중지된 업체입니다.">사유: {store?.suspend_comment ?? '-'}</Band> : null}

            {/* ② 기간 · 결제 환경 */}
            <div className={styles.filter}>
                <Field label="시작 달" name="start_month" htmlFor="dashboard-start">
                    <Input id="dashboard-start" type="month" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} />
                </Field>
                <span className={styles.tilde} aria-hidden="true">~</span>
                <Field label="끝 달" name="end_month" htmlFor="dashboard-end">
                    <Input id="dashboard-end" type="month" value={endMonth} onChange={(event) => setEndMonth(event.target.value)} />
                </Field>
                <Field label="결제 환경" name="environment" group>
                    <Segmented label="결제 환경" options={ENVIRONMENT_OPTIONS} value={environment} onChange={setEnvironment} />
                </Field>
                <Button variant="primary" onClick={search}>조회</Button>
                <p className={styles.filterNote}>비우면 최근 3개월 · 최대 12개월</p>
            </div>

            {stats ? (
                <>
                    {/* ③ 합계 카드 */}
                    <section className={styles.kpis} aria-label="합계">
                        {SUMMARY_ITEMS.map((item) => (
                            <div key={item.key} className={styles.kpi}>
                                <span className={styles.kpiLabel}>{item.label}</span>
                                <span className={item.key === 'profit' ? `${styles.kpiValue} ${styles.profit}` : styles.kpiValue}>{NUMBER_FORMAT.format(stats.total[item.key])}<small>{item.unit}</small></span>
                            </div>
                        ))}
                    </section>

                    {/* ③ 월별 결제액 · 환불액 */}
                    <Card title="월별 결제액 · 환불액">
                        <BarChart label={`${stats.period.start_month} ~ ${stats.period.end_month} 월별 결제액과 환불액`} categories={months.map((month) => month.month)} series={chartSeries} height={290} formatValue={formatManwon} />
                    </Card>

                    {/* ③ 월별 표 — 항목 5줄 × 달 + 합계 */}
                    <Card title="월별 통계">
                        <Table>
                            <thead>
                                <tr>
                                    <th scope="col">항목</th>
                                    {months.map((month) => <th key={month.month} scope="col" className={styles.number}>{month.month}</th>)}
                                    <th scope="col" className={styles.number}>합계</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SUMMARY_ITEMS.map((item) => (
                                    <tr key={item.key}>
                                        <th scope="row">{item.label}({item.unit})</th>
                                        {months.map((month) => <td key={month.month} className={styles.number}>{NUMBER_FORMAT.format(month[item.key])}</td>)}
                                        <td className={styles.number}><b>{NUMBER_FORMAT.format(stats.total[item.key])}</b></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        <p className={styles.tableNote}>이용자 수 · 이용 건수는 이용 끝이 그 달인 이용 완료 예약(합계 이용자 수는 기간 전체에서 중복 제거), 결제액은 승인 시각, 환불액은 환불 신청 시각 기준. 수익 = 결제액 − 환불액(음수일 수 있다).</p>
                    </Card>
                </>
            ) : null}
        </div>
    );
}
```

---

## 2. 계산 함수

### 2-1. 권한별 메뉴 · 지금 메뉴 — `src/shared/components/console/console-menu.ts` · `src/app/manager/(console)/manager-menu.tsx`

대시보드는 영역 첫 화면이라 모든 주소의 위다 — `exact` 로 첫 화면에서만 강조한다. 주소 비교는 `/` 단위(`/manager/rooms` 는 `/manager/room-groups` 아래가 아니다 — `area.ts` 의 `isUnder` 와 같은 규칙).

```ts
// src/shared/components/console/console-menu.ts
/** 콘솔 메뉴 한 줄 — 업체 관리자 · 관리자 */
export type ConsoleMenuItemType = {
    href: string;                   // 주소('/manager/rooms/')
    label: string;                  // 이름
    icon: React.ReactNode;          // svg 안 모양(viewBox 0 0 24 24)
    exact?: boolean;                // 이 주소일 때만 강조(영역 첫 화면 — 대시보드)
    roles?: ReadonlyArray<string>;  // 이 권한에게만 보인다 — 없으면 모두
};

/**
 * 보일 메뉴 — 권한이 정해진 메뉴는 그 권한에게만, 권한을 모르면(null) 그 메뉴를 숨긴다
 *
 * @param menu 영역 메뉴
 * @param authId 로그인 때 기억한 권한
 */
export function visibleMenu(menu: ReadonlyArray<ConsoleMenuItemType>, authId: string | null): Array<ConsoleMenuItemType> {
    return menu.filter((item) => !item.roles || (authId !== null && item.roles.includes(authId)));
}

/**
 * 강조할 메뉴 주소 — 메뉴 주소와 같거나 그 아래 주소면 그 메뉴, exact 메뉴는 같을 때만
 *
 * @param pathname 지금 주소
 * @param menu 보이는 메뉴
 * @returns 메뉴 href, 없으면 null(비밀번호 변경처럼 메뉴 밖 화면)
 */
export function activeMenuHref(pathname: string, menu: ReadonlyArray<ConsoleMenuItemType>): string | null {
    const path = trimSlash(pathname);
    const active = menu.find((item) => {
        const base = trimSlash(item.href);
        return item.exact ? path === base : path === base || path.startsWith(`${base}/`);
    });
    return active?.href ?? null;
}

/**
 * 끝 / 떼기(루트는 그대로)
 *
 * @param path 주소
 */
function trimSlash(path: string): string {
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
}
```

```tsx
// src/app/manager/(console)/manager-menu.tsx
import { AUTH_ID } from '@/contracts/common/roles';
import { ConsoleMenuItemType } from '@/shared/components/console/console-menu';

/** 업체 관리자 메뉴 — 시안 콘솔 틀 순서 · 아이콘(manager.html symbol), 업체 관리자는 업체 총관리자만 */
export const MANAGER_MENU: ReadonlyArray<ConsoleMenuItemType> = [
    {href: '/manager/', label: '대시보드', exact: true, icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>},
    {href: '/manager/reservations/', label: '예약 현황', icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>},
    {href: '/manager/rooms/', label: '호실', icon: <><path d="M6 21V4h12v17M4 21h16" /><path d="M14.5 12.5h.01" /></>},
    {href: '/manager/room-groups/', label: '객실 그룹', icon: <><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></>},
    {href: '/manager/plans/', label: '상품 설정', icon: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>},
    {href: '/manager/store/', label: '내 업체 설정', icon: <><path d="M4 10v10h16V10" /><path d="M3 10 5 4h14l2 6H3z" /><path d="M10 20v-5h4v5" /></>},
    {href: '/manager/staff/', label: '업체 관리자', roles: [AUTH_ID.HEAD_MANAGER], icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></>},
];
```
(아이콘은 시안 `frontend/design/manager.html:275-281` 의 symbol 그대로.)

### 2-2. 업체 로그인 주소 · 업체코드 줄임 — `src/app/manager/manager-auth.ts`

route handler(서버) · 안내 page(서버) · 화면(클라이언트)이 함께 쓴다 — React · 브라우저 API 를 쓰지 않는다.

```ts
// src/app/manager/manager-auth.ts
import { AUTH_ID } from '@/contracts/common/roles';
import { RETURN_URL_KEY, safeReturnPath, toSamePath } from '@/shared/utils/area';

/** 업체코드 쿠키 — 로그인 처리가 쓰고 업체 로그인 주소 안내가 읽는다(로그아웃해도 남는다) */
export const STORE_CODE_COOKIE = 'manager_store_code';

/** 업체코드 쿠키를 기억하는 날 수 */
export const STORE_CODE_REMEMBER_DAYS = 365;

/** 업체코드 모양 — 32자 영문 소문자 · 숫자(ManagerLoginDto) */
export const STORE_CODE_PATTERN = /^[a-f0-9]{32}$/;

/** 비밀번호 변경 — 임시 비밀번호로 로그인했을 때(안내 띠) */
const PASSWORD_REQUIRED_PATH = '/manager/password/?required=1';

/** 업체코드를 줄여 보일 앞 글자 수 */
const STORE_CODE_SHORT_LENGTH = 8;

/** 권한 배지 — 지침서 화면 문구(screens.md M1 · 시안 배지) */
export const MANAGER_AUTH_BADGE = new Map<string, {label: string; tone: 'primary' | 'neutral'}>([
    [AUTH_ID.HEAD_MANAGER, {label: '업체 총관리자', tone: 'primary'}],
    [AUTH_ID.MANAGER, {label: '업체 관리자', tone: 'neutral'}],
]);

/**
 * 업체코드 주소의 화면 — /manager/<업체코드>/<화면>/
 *
 * @param storeCode 업체코드(주소 값)
 * @param page login · find-login-id · password-reset
 */
export function managerStorePath(storeCode: string, page: 'login' | 'find-login-id' | 'password-reset'): string {
    return `/manager/${encodeURIComponent(storeCode)}/${page}/`;
}

/**
 * 업체 로그인 주소 — 업체코드 모양이 맞을 때만, 같은 사이트의 돌아갈 주소만 붙인다
 *
 * @param storeCode 업체코드(쿠키 · 붙여 넣은 값)
 * @param returnUrl 돌아갈 주소
 * @returns 업체 로그인 주소, 업체코드 모양이 아니면 null
 */
export function managerLoginPath(storeCode: string, returnUrl: string | null): string | null {
    if (!STORE_CODE_PATTERN.test(storeCode)) {
        return null;
    }

    const loginPath = managerStorePath(storeCode, 'login');
    const samePath = toSamePath(returnUrl);
    return samePath ? `${loginPath}?${RETURN_URL_KEY}=${encodeURIComponent(samePath)}` : loginPath;
}

/**
 * 로그인 뒤 갈 주소 — 임시 비밀번호면 비밀번호 변경, 아니면 돌아갈 주소(없으면 대시보드)
 *
 * @param isPasswordChangeRequired 로그인 결과 is_password_change_required
 * @param returnUrl 돌아갈 주소
 */
export function afterManagerLoginPath(isPasswordChangeRequired: number, returnUrl: string | null): string {
    return isPasswordChangeRequired === 1 ? PASSWORD_REQUIRED_PATH : safeReturnPath(returnUrl, 'manager');
}

/**
 * 업체코드 줄임 — 앞 8자 + 줄임표(상단 바)
 *
 * @param storeCode 업체코드
 */
export function shortStoreCode(storeCode: string): string {
    return storeCode.length > STORE_CODE_SHORT_LENGTH ? `${storeCode.slice(0, STORE_CODE_SHORT_LENGTH)}…` : storeCode;
}
```

### 2-3. 금액 "만" 글자 — `src/shared/utils/format.ts`

관리자 대시보드(A2)도 쓴다 — 공통 표시 형식에 둔다.

```ts
// src/shared/utils/format.ts — 더함
/** 만 원 */
const MANWON = 10000;

/**
 * 금액 "만" 글자 — 그래프 막대 값 · 눈금(342만). 1만 원 미만은 쉼표 숫자 그대로
 *
 * @param amount 원
 */
export function formatManwon(amount: number): string {
    if (Math.abs(amount) < MANWON) {
        return amount.toLocaleString('ko-KR');
    }

    return `${Math.round(amount / MANWON).toLocaleString('ko-KR')}만`;
}
```

---

## 3. 데이터 규칙 · 공용 부품 — 규약만으로 예측할 수 없는 부분

### 3-1. 계정 쿠키 · 업체코드 쿠키 — `src/app/api/cookie/token-cookie.ts`

계정 쿠키는 토큰과 수명을 맞춘다 — 지우는 곳은 `clearTokenCookies` 하나(로그아웃 · 재발급 실패 모두 여기를 지난다), 재발급 때는 새 refresh 만료로 다시 쓴다(refresh 토큰이 재발급마다 1년 늘어나 계정만 먼저 끝나지 않게). 업체코드 쿠키는 토큰과 상관없이 남아야 해 `clearTokenCookies` 가 건드리지 않는다.

```ts
// src/app/api/cookie/token-cookie.ts — 더하고 고치는 곳
/** 로그인 때 기억한 계정 — 로그인 결과에 아이디가 없어 로그인 때 받은 값(매니저 · 관리자 상단 바 · 메뉴 권한) */
export type AccountType = {
    login_id: string; // 로그인 아이디
    auth_id: string;  // 권한(HEAD_MANAGER · MANAGER · SUPER_ADMIN · ADMIN)
};

/** 하루(ms) */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 계정 쿠키 이름 — manager_account
 *
 * @param area 영역
 */
export function accountCookieName(area: AreaType): string {
    return `${area}_account`;
}

/**
 * 계정 쿠키 저장 — refresh 쿠키와 같은 만료(같이 끝난다)
 *
 * @param cookieStore cookies()
 * @param area 영역
 * @param account 아이디 · 권한
 * @param expiresAt refresh_token_expires_at
 */
export async function setAccountCookie(cookieStore: CookieStoreType, area: AreaType, account: AccountType, expiresAt: string): Promise<void> {
    cookieStore.set(accountCookieName(area), JSON.stringify({login_id: account.login_id, auth_id: account.auth_id}), await cookieOptions(new Date(expiresAt)));
}

/**
 * 계정 쿠키 읽기 — 없거나 모양이 다르면 null
 *
 * @param cookieStore cookies()
 * @param area 영역
 */
export function readAccountCookie(cookieStore: CookieStoreType, area: AreaType): AccountType | null {
    const raw = cookieStore.get(accountCookieName(area))?.value;
    if (!raw) {
        return null;
    }

    try {
        const value = JSON.parse(raw) as Partial<AccountType>;
        return typeof value.login_id === 'string' && typeof value.auth_id === 'string' ? {login_id: value.login_id, auth_id: value.auth_id} : null;
    } catch {
        return null;
    }
}

/**
 * 오래 기억하는 쿠키(업체코드) — 토큰 쿠키와 같은 옵션, 로그아웃이 지우지 않는다
 *
 * @param cookieStore cookies()
 * @param name 쿠키 이름
 * @param value 값
 * @param days 기억할 날 수
 */
export async function setRememberCookie(cookieStore: CookieStoreType, name: string, value: string, days: number): Promise<void> {
    cookieStore.set(name, value, await cookieOptions(new Date(Date.now() + days * DAY_MS)));
}

// clearTokenCookies — 계정 쿠키도 함께
export async function clearTokenCookies(cookieStore: CookieStoreType, area: AreaType): Promise<void> {
    const options = {...(await cookieOptions(new Date(0))), maxAge: 0};
    cookieStore.set(accessCookieName(area), '', options);
    cookieStore.set(refreshCookieName(area), '', options);
    cookieStore.set(accountCookieName(area), '', options);
}

// refreshAndStore — 새 토큰을 쓴 뒤 계정 쿠키 만료도 새 refresh 만료로
    await setTokenCookies(cookieStore, area, result.tokens);
    const account = readAccountCookie(cookieStore, area);
    if (account) {
        await setAccountCookie(cookieStore, area, account, result.tokens.refresh_token_expires_at);
    }
    return {state: 'ok', accessToken: result.tokens.access_token};
```

### 3-2. 기억한 계정 읽기 — `GET /api/cookie/<area>/account/` · `getAreaAccount`

클라이언트는 쿠키를 직접 읽지 않으므로(AGENTS.md "Auth") 토큰과 같은 route 묶음에 읽기만 더한다. 쓰기는 로그인 처리 route 가 서버에서 한다(브라우저가 계정을 심을 길을 열지 않는다).

```ts
// src/app/api/cookie/[area]/account/route.ts
import { cookies } from 'next/headers';
import { json } from '../../../route-util';
import { readAccountCookie, toArea } from '../../token-cookie';

/**
 * 로그인 때 기억한 계정(아이디 · 권한) — 없으면 {success: false}
 *
 * @param _request
 * @param context [area]
 */
export async function GET(_request: Request, context: RouteContext<'/api/cookie/[area]/account'>): Promise<Response> {
    const area = toArea((await context.params).area);
    if (!area) {
        return json({success: false});
    }

    const account = readAccountCookie(await cookies(), area);
    return account ? json({success: true, data: account}) : json({success: false});
}
```

```ts
// src/shared/api/cookie.ts — 더함
/** 로그인 때 기억한 계정 — route handler 의 AccountType 과 같은 모양 */
export type AreaAccountType = {
    login_id: string; // 로그인 아이디
    auth_id: string;  // 권한
};

/**
 * 그 영역 로그인 때 기억한 계정 — 없거나 못 읽으면 null
 *
 * @param area 영역
 */
export async function getAreaAccount(area: AreaType): Promise<AreaAccountType | null> {
    const result = await callCookieRoute<AreaAccountType>(withBasePath(`/api/cookie/${area}/account/`));
    return result?.success ? result.data ?? null : null;
}
```

### 3-3. 월별 묶음 막대 — `src/shared/components/chart/BarChart.tsx`(고쳐 씀)

쓰는 곳이 없던 템플릿(`distributed` — 막대마다 다른 색 · `colors.ts` 팔레트)을 묶음 막대로 바꾼다(사용자 결정 — apexcharts). apexcharts 는 색 글자를 직접 다뤄(hover 음영) `var(--…)` 를 못 읽으므로, 그린 뒤 `globals.css` 토큰 값을 읽어 넘긴다. `colors.ts` 는 `LineChart` · `DonutChart` 가 쓰므로 둔다.

```tsx
// src/shared/components/chart/BarChart.tsx
'use client';
import type { ApexOptions } from 'apexcharts';
import { useEffect, useState } from 'react';
import Chart from './Chart';

/** 막대 묶음 하나 — 이름 · 값 · 색 토큰 */
export type BarChartSeriesType = {
    name: string;         // 범례 이름(결제액)
    data: Array<number>;  // 분류마다 값
    colorVar: string;     // globals.css 색 토큰 이름('--primary')
};

type BarChartProps = {
    label: string;                            // 그래프 설명(aria-label)
    categories: Array<string>;                // 가로축(달)
    series: Array<BarChartSeriesType>;        // 묶음
    height: number;                           // 높이(px)
    formatValue?: (value: number) => string;  // 막대 위 값 · 세로축 글자(기본 쉼표)
};

/** 토큰을 못 읽었을 때 */
const FALLBACK_COLOR = '#2457D6';

/**
 * 묶음 막대그래프 — 분류(달)마다 묶음(결제액 · 환불액) 막대, 색은 토큰 값
 *
 * @param param0
 * @returns
 */
export default function BarChart({label, categories, series, height, formatValue = (value) => value.toLocaleString('ko-KR')}: BarChartProps): React.ReactNode {
    // 상태
    const [colors, setColors] = useState<Array<string> | null>(null); // 토큰에서 읽은 색 — 읽기 전에는 그리지 않는다

    // 계산 값
    const colorKey = series.map((item) => item.colorVar).join(' '); // 색 토큰이 바뀔 때만 다시 읽는다
    const options: ApexOptions = {
        chart: {toolbar: {show: false}, fontFamily: 'inherit', animations: {enabled: false}},
        plotOptions: {bar: {columnWidth: '50%', borderRadius: 3, dataLabels: {position: 'top'}}},
        colors: colors ?? [],
        dataLabels: {enabled: true, offsetY: -18, formatter: (value) => formatValue(Number(value)), style: {fontSize: '12px', fontWeight: 500}},
        legend: {position: 'top', horizontalAlign: 'right'},
        xaxis: {categories},
        yaxis: {labels: {formatter: (value) => formatValue(value)}},
        grid: {strokeDashArray: 0},
        tooltip: {y: {formatter: (value) => formatValue(value)}},
    };                                                                // apexcharts 설정

    // 효과
    useEffect(() => {
        // 그린 뒤 토큰 값을 읽는다(서버에는 문서가 없다)
        const style = getComputedStyle(document.documentElement);
        setColors(colorKey.split(' ').map((name) => style.getPropertyValue(name).trim() || FALLBACK_COLOR));
    }, [colorKey]);

    return (
        // 막대그래프
        <div role="img" aria-label={label}>
            {colors ? <Chart type="bar" options={options} series={series.map((item) => ({name: item.name, data: item.data}))} width="100%" height={height} /> : null}
        </div>
    );
}
```

### 3-4. 로그인 계열 바탕 · 카드 — `ConsoleAuthFrame` · `ConsoleAuthCard`

M1 화면 5개와 관리자 A1(Phase 15)이 같은 바탕(로고 + 가운데 카드)을 쓴다 — 시안 `.auth` · `.auth-card`.

```tsx
// src/shared/components/console/ConsoleAuthFrame.tsx
import styles from '@/shared/css/console/ConsoleAuthFrame.module.css';

type ConsoleAuthFrameProps = {
    areaName: string;          // 로고 아래 글자 — "업체 관리자 콘솔"
    children: React.ReactNode; // 카드
};

/** 로고 — 시안 `#i-logo`(ConsoleShell 과 같은 모양, 32px) */
const LOGO = <svg className={styles.mark} viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="7" fill="var(--primary)" /><path d="M10 21V8h8v13M8 21h12" fill="none" stroke="var(--on-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="15.5" cy="14.5" r="1.2" fill="var(--on-primary)" /></svg>;

/**
 * 로그인 계열 바탕 — 메뉴 없이 바탕 위 로고 + 가운데 카드(시안 M1)
 *
 * @param param0
 * @returns
 */
export default function ConsoleAuthFrame({areaName, children}: ConsoleAuthFrameProps): React.ReactNode {
    return (
        // 바탕
        <div className={styles.frame}>
            {/* 로고 */}
            <div className={styles.logo}>{LOGO}<div><b>roomless</b><small>{areaName}</small></div></div>

            {/* 카드 */}
            {children}
        </div>
    );
}
```

```tsx
// src/shared/components/console/ConsoleAuthCard.tsx
import styles from '@/shared/css/console/ConsoleAuthCard.module.css';

type ConsoleAuthCardProps = {
    title?: string;                // 카드 제목(h1)
    description?: React.ReactNode; // 제목 아래 설명
    wide?: boolean;                // 460px(안내) — 기본 420px
    children: React.ReactNode;
};

/**
 * 로그인 계열 카드 — 제목 · 설명 · 내용(시안 `.auth-card`)
 *
 * @param param0
 * @returns
 */
export default function ConsoleAuthCard({title, description, wide = false, children}: ConsoleAuthCardProps): React.ReactNode {
    return (
        // 카드
        <section className={wide ? `${styles.card} ${styles.wide}` : styles.card}>
            {/* 제목 · 설명 */}
            {title ? (
                <div>
                    <h1 className={styles.title}>{title}</h1>
                    {description ? <p className={styles.description}>{description}</p> : null}
                </div>
            ) : null}

            {/* 내용 */}
            {children}
        </section>
    );
}
```

### 3-5. route 응답 · 공용 문구 — `route-util.ts`

정지 사유는 로그인 실패에만 오는 기능별 추가 필드라 `RouteBodyType` 에 칸을 더한다. `INVALID_REQUEST_MESSAGE` 는 가입 · 매니저 로그인 route 가 함께 쓰므로 `sns-session.ts` 에서 `route-util.ts` 로 옮긴다(가입 route import 고침 — 다른 사용처 없음).

```ts
// src/app/api/route-util.ts — 더함
/** 같은 사이트 JSON 이 아닌 요청 */
export const INVALID_REQUEST_MESSAGE = '잘못된 요청입니다.';

export type RouteBodyType = {
    // …기존 칸
    block_comment?: string | null; // 정지 계정 로그인 — 정지 사유(매니저 로그인)
};
```

---

## 4. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| DTO 사본 8개(manager 6 · `store-mine` · `stats-mine`) | 지침서 블록 그대로(`copy-dto.js`), 파일 이름 · 상대 import 유지 | `src/contracts/user/dto/user-token-refresh.dto.ts:5` |
| `loginManager(dto)` | 동기 공개 `request` POST `/admin-service/manager/login` — 서버(로그인 처리 route)만 부른다 | `src/contracts/user/api.ts:49` `loginUser` |
| `sendManagerFindLoginId` · `confirmManagerFindLoginId` · `sendManagerPasswordReset` · `confirmManagerPasswordReset`(`Promise<null>`) | 공개 `callQueue` POST `/admin-service/manager/find-login-id` · `/confirm` · `/password-reset` · `/confirm` | `src/contracts/user/api.ts:118-129` `sendFindLoginId` · `confirmFindLoginId` |
| `changeManagerPassword(auth, dto)` | `withAuth` + `callQueue<null>` PATCH `/admin-service/manager/password` | `src/contracts/user/api.ts:109` `cancelLeave` |
| `getMyStore(auth, signal?)` | `withAuth` + `request` GET `/admin-service/store/mine` | `src/contracts/store/api.ts` `getMyStoreApplication` |
| `getMyStats(auth, dto, signal?)` | `withAuth` + `request` GET `/admin-service/stats/mine`(query `start_month` · `end_month` · `environment`, null 은 빼고) | `src/contracts/reservation/api.ts` `getMyReservations` |
| `src/app/manager/(console)/layout.tsx` | 얇은 layout — `<AuthGuard><ManagerConsoleLayoutContent>` | `src/app/(user)/layout.tsx` · `src/app/(user)/phone-verification/page.tsx:11` |
| `src/app/manager/layout.tsx` | 얇은 layout — `<div data-area="console">{children}</div>`(콘솔 크기 토큰) | `src/app/css/globals.css:62` |
| `[store_code]/login` · `find-login-id` · `password-reset` page.tsx | 얇은 page — `params.store_code` · `return_url` 을 Content 로(로그인 가드 없음) | `src/app/(user)/login/page.tsx` |
| `src/app/manager/password/page.tsx` | `<AuthGuard>` + `required={firstQueryValue(query.required) === '1'}` | `src/app/(user)/phone-verification/page.tsx:11` |
| `src/app/manager/(console)/page.tsx` | 얇은 page — `<ManagerDashboardContent />` | `src/app/(user)/me/page.tsx` |
| `src/app/manager/login/dto.ts` `StoreCodeDto` | 화면 DTO — `@Matches(STORE_CODE_PATTERN, '업체코드가 올바르지 않습니다.')` · `@IsNotEmpty('업체코드를 입력해주세요.')`(ManagerLoginDto 문구 그대로) | `src/app/(user)/signup/dto.ts` |
| 기간 · 결제 환경 고르기 | 대시보드 화면 안에 둔다 — A2 를 만들 때 두 곳이 되면 공용으로 옮긴다(AGENTS.md "Shared Logic Separation") | 로드맵 #48 Key decision |

---

## 5. 스타일 — 시안 값

시안 `frontend/design/manager.html` 의 값을 토큰으로. 크기는 `data-area="console"`(글자 14 · 컨트롤 40).

```css
/* src/shared/css/console/ConsoleShell.module.css — 시안 .con · .side · .nav · .cm · .top · .pg */
.console { display: flex; flex-wrap: wrap; align-items: stretch; min-height: 100vh; background: var(--bg); }
.side { flex: 1 1 232px; padding: 20px 12px; background: var(--surface); border-right: 1px solid var(--line); }
.logo { display: flex; align-items: center; gap: 10px; padding: 4px 12px 20px; }
.logo b { display: block; font-size: 16px; line-height: 1.3; }
.logo small { display: block; font-size: 12px; font-weight: 500; color: var(--muted); }
.mark { width: 28px; height: 28px; flex: none; }
.nav { display: flex; flex-direction: column; gap: 2px; }
.nav a { display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; border-radius: var(--radius); font-size: 14px; font-weight: 500; color: var(--muted); text-decoration: none; }
.nav a:hover { background: var(--surface-2); color: var(--fg); }
.nav a[aria-current] { background: var(--primary-soft); color: var(--primary-strong); font-weight: 700; }
.icon { width: 20px; height: 20px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.main { flex: 999 1 560px; min-width: 0; display: flex; flex-direction: column; }
.top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; min-height: 64px; padding: 12px clamp(16px, 2.5vw, 32px); background: var(--surface); border-bottom: 1px solid var(--line); }
.topLeft { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
.topRight { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; font-size: 14px; font-weight: 500; }
.passwordLink { font-size: 13px; font-weight: 400; }
.page { display: flex; flex-direction: column; gap: 20px; min-width: 0; padding: 24px clamp(16px, 2.5vw, 32px) 48px; }
```

```css
/* src/shared/css/console/ConsoleAuthFrame.module.css · ConsoleAuthCard.module.css — 시안 .auth · .auth-logo · .auth-card */
.frame { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: 48px 16px; background: var(--bg); }
.logo { display: flex; align-items: center; gap: 10px; }
.logo b { display: block; font-size: 18px; line-height: 1.3; }
.logo small { display: block; font-size: 12px; font-weight: 500; color: var(--muted); }
.mark { width: 32px; height: 32px; flex: none; }

.card { width: 100%; max-width: 420px; padding: 32px; display: flex; flex-direction: column; gap: 20px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow); }
.wide { max-width: 460px; }
.title { margin: 0; font-size: 22px; font-weight: 700; }
.description { margin: 6px 0 0; font-size: 14px; line-height: 1.7; color: var(--muted); }
```

```css
/* src/app/css/manager/ — 화면들(로그인 · 안내 · 비밀번호 · 아이디 찾기 · 초기화 · 단계 · 콘솔 틀 · 대시보드) */
.form { display: flex; flex-direction: column; gap: 16px; }                                   /* 시안 .auth-card form */
.links { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 13px; }
.links span { color: var(--line); }
.sample { margin: 0; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface-2); font-size: 13px; color: var(--muted); overflow-wrap: anywhere; }
.sample b { color: var(--fg); }
.account { display: inline-flex; align-items: center; gap: 8px; }
.actions { display: flex; gap: 8px; }
.actions > * { flex: 1; }
.actions > :last-child { flex: 2; }                                                             /* 취소 1 : 변경 2 */
.resultHead { display: flex; align-items: center; gap: 10px; }
.resultTitle { margin: 0; font-size: 16px; font-weight: 700; }
.okMark { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 999px; background: var(--ok-soft); color: var(--ok); }
.okMark svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.summary { margin: 0; padding: 14px 16px; display: grid; grid-template-columns: 72px 1fr; gap: 6px 12px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface-2); font-size: 14px; }
.summary dt { color: var(--muted); font-weight: 700; }
.summary dd { margin: 0; font-variant-numeric: tabular-nums; }

/* SmsSteps — 시안 .steps */
.steps { margin: 0; padding: 0; list-style: none; display: flex; align-items: center; gap: 12px; font-size: 13px; }
.steps li { display: flex; align-items: center; gap: 8px; font-weight: 500; color: var(--muted); }
.steps li[aria-current] { font-weight: 700; color: var(--primary-strong); }
.dot { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 999px; font-size: 12px; font-weight: 700; background: var(--neutral-bg); color: var(--neutral-fg); }
.steps li[aria-current] .dot { background: var(--primary); color: var(--on-primary); }
.done .dot { background: var(--ok-soft); color: var(--ok); }
.line { flex: 1; height: 1px; background: var(--line); }

/* 콘솔 틀 상단 바 왼쪽 — 시안 .top-l */
.storeName { font-size: 16px; }
.storeCode { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; word-break: break-all; }

/* 대시보드 — 시안 .pt · .ps · .fb · .kpis · .kpi · .tbl .r */
.page { display: flex; flex-direction: column; gap: 20px; }
.title { margin: 0; font-size: 22px; font-weight: 700; }
.subtitle { margin: 6px 0 0; font-size: 13px; color: var(--muted); }
.filter { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; padding: 16px 20px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow); }
.tilde { height: var(--control-h); display: flex; align-items: center; color: var(--muted); }
.filterNote { margin: 0 0 10px; font-size: 13px; color: var(--muted); }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.kpi { padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow); }
.kpiLabel { font-size: 13px; font-weight: 700; color: var(--muted); }
.kpiValue { font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; }
.kpiValue small { margin-left: 2px; font-size: 14px; font-weight: 500; color: var(--muted); }
.profit { color: var(--primary-strong); }
.number { text-align: right; font-variant-numeric: tabular-nums; }
.tableNote { margin: 0; font-size: 13px; line-height: 1.6; color: var(--muted); }
```

(쓰는 토큰 `--radius` · `--radius-lg` · `--shadow` · `--on-primary` · `--control-h` 는 모두 `src/app/css/globals.css` 에 있다.)

## 테스트

spec 의 "결과" 표에서 ✓ 표시된 11건과 "계산 규칙" 표 13건을 그대로 테스트로 옮긴다. 여기에는 추가분만 적는다.

| 종류 | 대상 | 이유 |
|---|---|---|
| 쿠키 | `src/test/app/api/cookie/token-cookie.test.ts` — `clearTokenCookies` 가 계정 쿠키도 지우고, `refreshAndStore` 가 계정 쿠키 만료를 새 refresh 만료로 다시 쓴다(업체코드 쿠키는 건드리지 않음) | 계정 쿠키가 토큰보다 오래 남거나 먼저 끝나면 상단 바 · 메뉴 권한이 어긋난다 — 쿠키 경계는 이 파일이 지킨다 |

테스트 파일과 경계 mock:
- 계산 — `src/test/app/manager/(console)/manager-menu.test.ts`(권한별 메뉴 2 · 지금 메뉴 3 — 실제 `MANAGER_MENU` 로) · `src/test/app/manager/manager-auth.test.ts`(업체코드 줄임 2 · 업체 로그인 주소 3) · `src/test/shared/utils/format.test.ts`(금액 "만" 3 더함)
- 화면 — `ManagerConsoleLayoutContent.test.tsx`(`getMyStore` · `getAreaAccount` · `replaceDocument` · `usePathname` mock, `auth.logout` 호출 · `replaceDocument('/manager/login/')`) · `ManagerLoginContent.test.tsx`(`loginManagerByRoute` · `next/navigation` mock) · `ManagerFindLoginIdContent.test.tsx`(contracts mock — 발송 인자에 주소의 업체코드) · `ManagerLoginGuideContent.test.tsx`(칸 옆 오류는 `.innerText`) · `ManagerPasswordContent.test.tsx`(`changeManagerPassword` · `getAreaAccount` mock) · `ManagerDashboardContent.test.tsx`(`getMyStats` mock, `BarChart` 는 mock — apexcharts 는 jsdom 에서 그리지 않는다)
- route — `src/test/app/api/manager/login.test.ts`(`// @vitest-environment node`, `next/headers` · `fetch` mock — 가입 route 테스트 `src/test/app/api/user/sign.test.ts` 모양, 쿠키 이름 `manager_access_token` · `manager_refresh_token` · `manager_account` · `manager_store_code`)
- React Compiler 회귀 테스트(`src/test/react-compiler.test.ts`)가 새 컴포넌트를 모두 컴파일하는지 함께 본다.

## 만드는 순서

1. DTO 사본 8개 → `contracts/manager` · `store` · `stats` api 함수(`loginManagerByRoute` 는 1-3)
2. 계산 함수 + 그 테스트 — `console-menu.ts` · `manager-menu.tsx` · `manager-auth.ts` · `formatManwon`(2-1 ~ 2-3)
3. 쿠키 · route — `token-cookie.ts`(3-1) · `[area]/account` route + `getAreaAccount`(3-2) · `route-util.ts`(3-5) · `/api/manager/login`(1-3) + 테스트
4. 공용 부품 — `ConsoleShell` · `ConsoleAuthFrame` · `ConsoleAuthCard` · `BarChart`(1-1 · 3-3 · 3-4) + css
5. 화면 — 안내(1-6) → 로그인(1-2) → 아이디 찾기 · 초기화(1-4 · 1-5) → 콘솔 틀(1-1) → 대시보드(1-8) → 비밀번호 변경(1-7), page · layout 껍데기 + css + 테스트
6. `npx next typegen && npx tsc --noEmit` · `npx vitest run`(AGENTS.md 가 허용)
7. 문서 — AGENTS.md(⚠️ 줄 · Auth: 매니저 로그인 route · 계정 · 업체코드 쿠키), `docs/data-layer.md`(쿠키 표에 계정 · 업체코드, IP 줄), `docs/architecture.md`(manager 폴더 · shared/components/console), `docs/conventions.md`(콘솔 틀 · 로그인 바탕 부품)
