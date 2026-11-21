# Plan — 관리자 콘솔 — 콘솔 틀 · 관리자 로그인 · 비밀번호 변경

> 무엇을·왜는 [spec](../../spec/admin/admin-login-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 진입점마다 비즈니스 로직 전체 ② 계산 함수 ③ 규약만으로 예측할 수 없는 데이터 규칙
> **싣지 않는 것** page · layout 껍데기, DTO 사본, 형제와 같은 contracts 함수 — 따르는 패턴을 표 한 줄로 가리킨다

로드맵 Phase 15(#51 · #52)를 이 plan 하나로 만든다. 업체 콘솔(Phase 10 — `.beaver/output/plan/manager/console-manager-login-plan.md`)과 같은 모양이라, 두 콘솔이 똑같이 쓰는 부분은 이번에 공통으로 옮긴다(아래 3).

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/app/admin/layout.tsx` | 신규 | 관리자 영역 전체에 콘솔 크기(`data-area="console"`) | 생략 |
| `src/app/admin/(console)/layout.tsx` | 신규 | 콘솔 틀 — `<AuthGuard>` 로 감싼다 | 생략 |
| `src/app/admin/(console)/AdminConsoleLayoutContent.tsx` | 신규 | 콘솔 틀 — 계정 · 메뉴 · 로그아웃 · Context | 아래 1-1 |
| `src/app/admin/(console)/admin-console-context.ts` | 신규 | `AdminConsoleContext`(계정) — 비밀번호 변경 설명 줄 | 아래 1-1 |
| `src/app/admin/(console)/admin-menu.tsx` | 신규 | 관리자 메뉴 5개(시안 아이콘) | 아래 1-1 |
| `src/app/admin/(console)/page.tsx` · `AdminDashboardContent.tsx` | 신규 | 첫 화면 — 대시보드 준비 중 안내(Phase 17 에서 바뀐다) | 아래 1-1 |
| `src/app/admin/admin-auth.ts` | 신규 | 비밀번호 변경 주소 · 로그인 뒤 주소 · 권한 배지 | 아래 1-2 |
| `src/app/admin/login/page.tsx` · `AdminLoginContent.tsx` | 신규 | A1 관리자 로그인 | 아래 1-2 |
| `src/app/api/admin/login/route.ts` | 신규 | 로그인 처리 — 백엔드 로그인 → 토큰 · 계정 쿠키 | 아래 1-3 |
| `src/app/admin/(console)/password/page.tsx` · `AdminPasswordContent.tsx` | 신규 | A1 비밀번호 변경(콘솔 안) | 아래 1-4 |
| `src/contracts/admin/dto/admin-login.dto.ts` · `admin-password.dto.ts` | 신규 | 지침서 사본(`frontend/dto/admin.md`) | 생략 |
| `src/contracts/admin/api.ts` | 수정 | `loginAdmin`(서버) · `loginAdminByRoute`(화면) · `changeAdminPassword`(큐) | 아래 1-3 · 생략 |
| `src/app/api/route-util.ts` | 수정 | 로그인 처리 route 공통 `backendLogin` · `textOf` 옮김 | 아래 3-1 |
| `src/app/api/manager/login/route.ts` · `src/app/api/user/sign/route.ts` | 수정 | `backendLogin` · `textOf` 를 쓰고 자기 사본을 지운다 | 아래 3-1 |
| `src/shared/api/route.ts` | 신규 | 프론트 route 부르기 `postRoute` · 실패 → `routeFailure` · 로그인 띠 `loginFailureOf` | 아래 3-2 |
| `src/contracts/manager/api.ts` · `src/contracts/user/api.ts` | 수정 | `loginManagerByRoute` · `signWithSns` 가 `postRoute` · `routeFailure` 를 쓰고 본문 타입 사본을 지운다 | 아래 3-2 |
| `src/app/manager/[store_code]/login/ManagerLoginContent.tsx` | 수정 | 띠 계산을 `loginFailureOf`(shared)로 — 자기 사본 지움 | 아래 3-2 |
| `src/shared/hooks/useConsoleLogout.ts` | 신규 | 콘솔 로그아웃(쿠키 삭제 → 그 영역 로그인 문서) | 아래 3-3 |
| `src/app/manager/(console)/ManagerConsoleLayoutContent.tsx` | 수정 | 로그아웃을 `useConsoleLogout` 로 — 자기 사본 지움 | 아래 3-3 |
| `src/shared/components/console/ConsoleShell.tsx` · `console-menu.ts` · `src/shared/css/console/ConsoleShell.module.css` | 수정 | 상단 바 "비밀번호 변경"을 그 주소에서 강조(`isCurrentPath`) | 아래 3-4 |
| `src/app/css/admin/AdminLoginContent.module.css` · `AdminPasswordContent.module.css` · `AdminDashboardContent.module.css` | 신규 | 시안 값(`frontend/design/admin.html` A1 · A2) | 아래 5 |
| 테스트 4파일 | 신규 | spec 테스트 9건 | 아래 테스트 |
| `AGENTS.md` · `docs/data-layer.md` · `docs/architecture.md` · `docs/conventions.md` | 수정 | 관리자 로그인 route · 공통으로 옮긴 함수 | 만드는 순서 8 |

---

## 1. 비즈니스 로직 — 화면별 코드

### 1-1. 콘솔 틀 — `AdminConsoleLayoutContent`

틀은 `(console)/layout.tsx` 가 `<AuthGuard>` 로 감싼 안에서만 그린다. 업체 콘솔과 달리 읽을 업체가 없어 상단 바 왼쪽(`heading`)은 비운다 — 로고 · "관리자 콘솔"은 왼쪽 메뉴 위에 이미 있다.

```ts
// src/app/admin/(console)/admin-console-context.ts
'use client';
import { createContext } from 'react';
import { AreaAccountType } from '@/shared/api/cookie';

/** 콘솔 틀이 나눠 주는 값 — 비밀번호 변경(설명 줄의 아이디) */
export type AdminConsoleContextType = {
    account: AreaAccountType | null; // 로그인 때 기억한 계정(아이디 · 권한) — 아직 읽는 중 · 쿠키가 없으면 null
};

export const AdminConsoleContext = createContext<AdminConsoleContextType>({account: null});
```

```tsx
// src/app/admin/(console)/admin-menu.tsx
import { ConsoleMenuItemType } from '@/shared/components/console/console-menu';

/** 관리자 메뉴 — 시안 콘솔 틀 순서 · 아이콘(frontend/design/admin.html A2), 총괄관리자 · 관리자 같은 메뉴(admin.html:260) */
export const ADMIN_MENU: ReadonlyArray<ConsoleMenuItemType> = [
    {href: '/admin/', label: '대시보드', exact: true, icon: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>},
    {href: '/admin/store-applications/', label: '입점 신청', icon: <><path d="M9 3.5h6v3H9z" /><path d="M9 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H15" /><path d="m9 14 2 2 4-4" /></>},
    {href: '/admin/stores/', label: '업체', icon: <><path d="M4 10v10h16V10" /><path d="M3 10l2-6h14l2 6z" /><path d="M10 20v-5h4v5" /></>},
    {href: '/admin/managers/', label: '업체 관리자', icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 5h5M16 9h5M18 13h3" /></>},
    {href: '/admin/users/', label: '이용자', icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14.5c2.4 0 4 1.6 4.5 4.5" /></>},
];
```

```tsx
// src/app/admin/(console)/AdminConsoleLayoutContent.tsx
'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AreaAccountType, getAreaAccount } from '@/shared/api/cookie';
import ConsoleShell from '@/shared/components/console/ConsoleShell';
import { visibleMenu } from '@/shared/components/console/console-menu';
import Badge from '@/shared/components/ui/display/Badge';
import useConsoleLogout from '@/shared/hooks/useConsoleLogout';
import { ADMIN_AUTH_BADGE, ADMIN_PASSWORD_PATH } from '../admin-auth';
import { AdminConsoleContext } from './admin-console-context';
import { ADMIN_MENU } from './admin-menu';

type AdminConsoleLayoutContentProps = {
    children: React.ReactNode;
};

/**
 * 관리자 콘솔 틀 — 기억한 계정을 읽어 상단 바 · 메뉴를 그리고 Context 로 나눈다
 *
 * @param param0
 * @returns
 */
export default function AdminConsoleLayoutContent({children}: AdminConsoleLayoutContentProps): React.ReactNode {
    // 변수
    const pathname = usePathname();                  // 지금 주소 — 메뉴 · 비밀번호 변경 강조
    const {loggingOut, logout} = useConsoleLogout(); // ⑤ 로그아웃 — 토큰 · 계정 쿠키 삭제 → 관리자 로그인 문서

    // 상태
    const [account, setAccount] = useState<AreaAccountType | null>(null); // 기억한 계정

    // 계산 값
    const menu = visibleMenu(ADMIN_MENU, account?.auth_id ?? null);            // ③ 메뉴 5개 — 권한이 정해진 메뉴가 없어 모두 보인다
    const badge = account ? ADMIN_AUTH_BADGE.get(account.auth_id) : undefined; // ② 권한 배지 글자 · 색

    // 효과
    useEffect(() => {
        // ② 들어오면 기억한 계정(아이디 · 권한)을 읽는다(떠나면 결과를 버린다)
        let active = true;
        getAreaAccount('admin').then((next) => {
            if (active) {
                setAccount(next);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    return (
        // 콘솔 Context + 틀
        <AdminConsoleContext.Provider value={{account}}>
            <ConsoleShell
                areaName="관리자 콘솔"
                menu={menu}
                pathname={pathname}
                heading={null}
                account={account ? <><span>{account.login_id}</span>{badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}</> : null}
                passwordHref={ADMIN_PASSWORD_PATH}
                loggingOut={loggingOut}
                onLogout={logout}
            >
                {children}
            </ConsoleShell>
        </AdminConsoleContext.Provider>
    );
}
```

```tsx
// src/app/admin/(console)/AdminDashboardContent.tsx
'use client';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import styles from '@/app/css/admin/AdminDashboardContent.module.css';

/**
 * A2 대시보드 자리 — Phase 17 에서 통계 화면으로 바뀐다. 그때까지 준비 중 안내만(spec 결정)
 *
 * @returns
 */
export default function AdminDashboardContent(): React.ReactNode {
    return (
        // 대시보드
        <div className={styles.page}>
            {/* 제목 */}
            <h1 className={styles.title}>대시보드</h1>

            {/* ④ 준비 중 */}
            <EmptyState title="대시보드는 준비 중이에요" description="입점 신청 · 업체 · 업체 관리자 · 이용자 화면도 차례로 열립니다." />
        </div>
    );
}
```

### 1-2. 관리자 로그인 — `AdminLoginContent`

업체 로그인(`ManagerLoginContent`)에서 업체 확인 · 아이디 찾기 링크를 뺀 모양. 다른 점은 시안대로 실패 띠가 아이디 칸 위(form 안)이고 정지 사유 머리가 "사유:", 실패하면 비밀번호 칸만 비운다.

```ts
// src/app/admin/admin-auth.ts
import { AUTH_ID } from '@/contracts/common/roles';
import { safeReturnPath } from '@/shared/utils/area';

/** 비밀번호 변경 — 상단 바 링크(띠 없이) */
export const ADMIN_PASSWORD_PATH = '/admin/password/';

/** 비밀번호 변경 — 처음 로그인했을 때(안내 띠) */
const PASSWORD_REQUIRED_PATH = '/admin/password/?required=1';

/** 권한 배지 — 시안 글자(frontend/design/admin.html:348) */
export const ADMIN_AUTH_BADGE = new Map<string, {label: string; tone: 'primary' | 'neutral'}>([
    [AUTH_ID.SUPER_ADMIN, {label: '총괄관리자', tone: 'primary'}],
    [AUTH_ID.ADMIN, {label: '관리자', tone: 'neutral'}],
]);

/**
 * 로그인 뒤 갈 주소 — 처음 로그인(비밀번호 변경 필요)이면 비밀번호 변경, 아니면 돌아갈 주소(없으면 첫 화면)
 *
 * @param isPasswordChangeRequired 로그인 결과 is_password_change_required
 * @param returnUrl 돌아갈 주소
 */
export function afterAdminLoginPath(isPasswordChangeRequired: number, returnUrl: string | null): string {
    return isPasswordChangeRequired === 1 ? PASSWORD_REQUIRED_PATH : safeReturnPath(returnUrl, 'admin');
}
```

```tsx
// src/app/admin/login/AdminLoginContent.tsx
'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { AdminLoginRouteResultType, loginAdminByRoute } from '@/contracts/admin/api';
import { AdminLoginDto } from '@/contracts/admin/dto/admin-login.dto';
import { handleApiError } from '@/shared/api/error';
import { LoginFailureType, loginFailureOf } from '@/shared/api/route';
import ConsoleAuthCard from '@/shared/components/console/ConsoleAuthCard';
import ConsoleAuthFrame from '@/shared/components/console/ConsoleAuthFrame';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { safeReturnPath } from '@/shared/utils/area';
import { validateAction } from '@/shared/utils/validation';
import { afterAdminLoginPath } from '../admin-auth';
import styles from '@/app/css/admin/AdminLoginContent.module.css';

type AdminLoginContentProps = {
    returnUrl: string | null; // 로그인 뒤 돌아갈 주소
};

/**
 * A1 관리자 로그인 — 아이디 · 비밀번호 → 로그인 처리 route → 비밀번호 변경 · 돌아갈 주소
 *
 * @param param0
 * @returns
 */
export default function AdminLoginContent({returnUrl}: AdminLoginContentProps): React.ReactNode {
    // 변수
    const router = useRouter();           // 로그인 뒤 · 이미 로그인 때 이동
    const auth = useContext(AuthContext); // 이미 관리자로 로그인했는지

    // 상태
    const [loginId, setLoginId] = useState<string>('');                    // 아이디
    const [loginPw, setLoginPw] = useState<string>('');                    // 비밀번호
    const [failure, setFailure] = useState<LoginFailureType | null>(null); // 실패 띠
    const [submitting, setSubmitting] = useState<boolean>(false);          // 로그인 중 — 두 번 누름 막기

    // 효과
    useEffect(() => {
        // ② 이미 관리자로 로그인했으면 돌아갈 주소로
        if (auth.isLogin) {
            router.replace(safeReturnPath(returnUrl, 'admin'));
        }
    }, [auth.isLogin, returnUrl, router]);

    // 함수
    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        // ③ 아이디 · 비밀번호 검사(틀린 칸 옆) → 로그인 처리
        event.preventDefault();
        const dto = Object.assign(new AdminLoginDto(), {login_id: loginId.trim(), login_pw: loginPw});
        if (submitting || !(await validateAction(dto))) {
            return;
        }

        setSubmitting(true);
        setFailure(null);
        let result: AdminLoginRouteResultType | null = null; // 로그인 처리 결과
        let error: {cause: unknown} | null = null;           // 실패 — 처리는 try 밖에서(React Compiler)
        try {
            result = await loginAdminByRoute(dto);
        } catch (cause) {
            error = {cause};
        }

        if (!result) {
            // ⑤ 안 되면 아이디 칸 위 띠(받은 문구 · 정지 사유) · 비밀번호 칸만 비움, 칸 오류 · 그 밖은 공통 처리
            setSubmitting(false);
            const band = error ? loginFailureOf(error.cause) : null;
            if (band) {
                setFailure(band);
                setLoginPw('');
                return;
            }

            handleApiError(error?.cause);
            return;
        }

        // ④ 처음 로그인이면 비밀번호 변경, 아니면 돌아갈 주소(없으면 첫 화면) — 다른 화면으로 가므로 버튼은 막아 둔다
        router.replace(afterAdminLoginPath(result.is_password_change_required, returnUrl));
    }

    return (
        // 관리자 로그인 — 메뉴 없는 가운데 카드
        <ConsoleAuthFrame areaName="관리자 콘솔">
            <ConsoleAuthCard title="관리자 로그인" description="총괄관리자 · 관리자 계정으로 로그인합니다.">
                {/* ① 아이디 · 비밀번호 — ⑤ 실패 띠는 아이디 칸 위 */}
                <form className={styles.form} onSubmit={submit} noValidate>
                    {failure ? <Band tone="danger" role="alert" title={failure.message}>{failure.blockComment ? `사유: ${failure.blockComment}` : null}</Band> : null}
                    <Field label="아이디" name="login_id" htmlFor="admin-login-id">
                        <Input id="admin-login-id" autoComplete="username" value={loginId} onChange={(event) => setLoginId(event.target.value)} />
                    </Field>
                    <Field label="비밀번호" name="login_pw" htmlFor="admin-login-pw">
                        <Input id="admin-login-pw" type="password" autoComplete="current-password" placeholder="비밀번호를 입력하세요" value={loginPw} onChange={(event) => setLoginPw(event.target.value)} />
                    </Field>
                    <Button type="submit" variant="primary" full disabled={submitting}>로그인</Button>
                </form>

                {/* ① 아이디 찾기 · 비밀번호 초기화 없음 */}
                <p className={styles.notice}>관리자 계정은 아이디 찾기 · 비밀번호 초기화를 제공하지 않습니다.</p>
            </ConsoleAuthCard>
        </ConsoleAuthFrame>
    );
}
```

### 1-3. 로그인 처리 — `POST /api/admin/login`

업체 로그인 처리와 앞부분(같은 사이트 JSON · 백엔드 로그인 · 거절 본문 · 다시 시도)이 같아 `backendLogin`(아래 3-1)을 함께 쓴다. 관리자는 업체코드 쿠키가 없다.

```ts
// src/app/api/admin/login/route.ts
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { loginAdmin } from '@/contracts/admin/api';
import { AdminLoginDto } from '@/contracts/admin/dto/admin-login.dto';
import { setAccountCookie, setTokenCookies } from '../../cookie/token-cookie';
import { backendLogin, json, textOf } from '../../route-util';

/**
 * 관리자 로그인 — Next 서버가 백엔드 admin/login(동기) → 토큰 · 계정 쿠키
 * - 재발급도 Next 서버가 부르므로 로그인 IP 와 재발급 IP 가 같다(docs/data-layer.md "⚠️ 백엔드 재발급")
 *
 * @param request 본문 {login_id, login_pw}
 */
export async function POST(request: NextRequest): Promise<Response> {
    // ①② 같은 사이트 JSON → 백엔드 로그인 — ④ 거절(4xx) · 다시 시도는 만든 응답 그대로(쿠키 없음)
    const login = await backendLogin(request, (form) => Object.assign(new AdminLoginDto(), {login_id: textOf(form?.login_id), login_pw: textOf(form?.login_pw)}), loginAdmin, 'admin-login');
    if ('response' in login) {
        return login.response;
    }

    // ③ 토큰 쿠키 2개 · 계정 쿠키(토큰과 같이 끝남)
    const cookieStore = await cookies();
    await setTokenCookies(cookieStore, 'admin', login.result);
    await setAccountCookie(cookieStore, 'admin', {login_id: login.dto.login_id, auth_id: login.result.auth_id}, login.result.refresh_token_expires_at);
    return json({success: true, data: {is_password_change_required: login.result.is_password_change_required}});
}
```

```ts
// src/contracts/admin/api.ts — 더하는 것(refreshAdminToken 은 그대로)
import { AuthType, withAuth } from '@/shared/api/auth';
import { callQueue } from '@/shared/api/queue';
import { request } from '@/shared/api/request';
import { postRoute, routeFailure } from '@/shared/api/route';
import { AdminLoginDto, AdminLoginResultDto } from './dto/admin-login.dto';
import { AdminPasswordDto } from './dto/admin-password.dto';

/** 로그인 처리 route 결과 */
export type AdminLoginRouteResultType = {
    is_password_change_required: number; // 1 이면 비밀번호 변경으로
};

/**
 * 관리자 로그인 — 동기 · 공개 (POST /admin-service/admin/login) — 서버(로그인 처리 route)만 부른다(로그인 IP = 재발급 IP)
 *
 * @param dto 아이디 · 비밀번호
 */
export function loginAdmin(dto: AdminLoginDto): Promise<AdminLoginResultDto | null> {
    return request<AdminLoginResultDto>({method: 'POST', path: '/admin-service/admin/login', body: dto});
}

/**
 * 관리자 로그인 — 프론트 route(POST /api/admin/login/)를 거친다(서버가 백엔드 로그인 · 쿠키)
 * - 거절은 ApiError(문구 · 칸 오류 · block_comment 그대로), 다시 시도는 ApiError(503), 응답 없음은 NetworkError — loginManagerByRoute 와 같다
 *
 * @param dto 아이디 · 비밀번호
 */
export async function loginAdminByRoute(dto: AdminLoginDto): Promise<AdminLoginRouteResultType> {
    const result = await postRoute<AdminLoginRouteResultType>('/api/admin/login/', {login_id: dto.login_id, login_pw: dto.login_pw});
    if (result.success && result.data) {
        return result.data;
    }

    throw routeFailure(result, true);
}
```

### 1-4. 비밀번호 변경 — `AdminPasswordContent`

제출 흐름은 업체 비밀번호 변경(`src/app/manager/password/ManagerPasswordContent.tsx` `submit`)과 같고, 화면은 시안대로 콘솔 안(제목 · 설명 · 띠 · 카드). 계정은 콘솔 틀이 읽은 것을 Context 로 받는다(쿠키를 다시 읽지 않는다).

```tsx
// src/app/admin/(console)/password/AdminPasswordContent.tsx
'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useContext, useState } from 'react';
import { changeAdminPassword } from '@/contracts/admin/api';
import { AdminPasswordDto } from '@/contracts/admin/dto/admin-password.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { AREA_HOME } from '@/shared/utils/area';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { validateAction } from '@/shared/utils/validation';
import { AdminConsoleContext } from '../admin-console-context';
import styles from '@/app/css/admin/AdminPasswordContent.module.css';

type AdminPasswordContentProps = {
    required: boolean; // 처음 로그인해서 왔는지(?required=1) — 안내 띠
};

/** 바꾼 뒤 — 시안 성공 문구 */
const PASSWORD_CHANGED_MESSAGE = '비밀번호를 변경했습니다.';

/**
 * A1 비밀번호 변경 — 현재 · 새 비밀번호 → 변경(큐) → 첫 화면
 * - 결과는 null(완료 · 늦어짐 같음)이고 확인할 조회가 없어 됨으로 안내한다(업체 비밀번호 변경과 같다)
 *
 * @param param0
 * @returns
 */
export default function AdminPasswordContent({required}: AdminPasswordContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                         // 바꾼 뒤 첫 화면
    const auth = useContext(AuthContext);               // 관리자 토큰
    const {account} = useContext(AdminConsoleContext); // ① 지금 계정 — 설명 줄의 아이디

    // 상태
    const [currentPassword, setCurrentPassword] = useState<string>(''); // 현재 비밀번호
    const [newPassword, setNewPassword] = useState<string>('');         // 새 비밀번호
    const [submitting, setSubmitting] = useState<boolean>(false);       // 바꾸는 중

    // 함수
    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        // ③ 현재 · 새 비밀번호 검사(틀린 칸 옆) → 변경(큐) → ④ 안내 뒤 첫 화면 · ⑤ 실패는 받은 문구
        event.preventDefault();
        const dto = Object.assign(new AdminPasswordDto(), {current_password: currentPassword, new_password: newPassword});
        if (submitting || !(await validateAction(dto))) {
            return;
        }

        setSubmitting(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await changeAdminPassword(auth, dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setSubmitting(false);
            handleApiError(failure.error);
            return;
        }

        showErrorPopup(PASSWORD_CHANGED_MESSAGE);
        router.replace(AREA_HOME.admin);
    }

    return (
        // 비밀번호 변경 — 콘솔 안
        <div className={styles.page}>
            {/* ① 제목 · 설명 */}
            <div>
                <h1 className={styles.title}>비밀번호 변경</h1>
                <p className={styles.subtitle}>지금 로그인한 관리자 계정{account ? `(${account.login_id})` : ''}의 비밀번호를 바꿉니다.</p>
            </div>

            <div className={styles.body}>
                {/* ② 처음 로그인했을 때만 */}
                {required ? <Band tone="info">처음 로그인했습니다. 새 비밀번호로 바꾼 뒤 콘솔을 쓰세요.</Band> : null}

                {/* ③ 현재 · 새 비밀번호 */}
                <Card>
                    <form className={styles.form} onSubmit={submit} noValidate>
                        <Field label="현재 비밀번호" name="current_password" htmlFor="admin-current-password">
                            <Input id="admin-current-password" type="password" autoComplete="current-password" placeholder="지금 쓰는 비밀번호" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                        </Field>
                        <Field label="새 비밀번호" name="new_password" htmlFor="admin-new-password" hint="8~20자, 영문과 숫자를 반드시 넣고, 특수문자는 !@#$%^&* 만 쓸 수 있습니다.">
                            <Input id="admin-new-password" type="password" autoComplete="new-password" placeholder="새 비밀번호" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                        </Field>
                        <div className={styles.actions}>
                            <Button type="submit" variant="primary" disabled={submitting}>비밀번호 변경</Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
```

```ts
// src/contracts/admin/api.ts — 비밀번호 변경
/**
 * 비밀번호 변경 — 큐 · 관리자 (PATCH /admin-service/admin/password) — 결과 null
 *
 * @param auth AuthContext 값
 * @param dto 현재 · 새 비밀번호
 */
export function changeAdminPassword(auth: AuthType, dto: AdminPasswordDto): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: '/admin-service/admin/password', body: dto, token}));
}
```

---

## 3. 데이터 규칙 — 두 콘솔이 함께 쓰게 옮기는 것

업체 콘솔에만 있던 코드를 관리자가 똑같이 쓰게 되어(AGENTS.md "두 곳 이상에서 쓰게 되면 그때 contracts · shared 로") 옮기고, 원래 자리의 사본은 지운다. 옮긴 뒤 업체 쪽 동작은 그대로다(기존 테스트가 확인).

### 3-1. 로그인 처리 route 공통 — `src/app/api/route-util.ts`

업체 로그인 처리(`src/app/api/manager/login/route.ts:18-44`)의 ① ② 단계를 그대로 옮긴다. 관리자 route 를 그대로 베끼면 거절 본문 · 다시 시도 처리가 두 벌이 되어 한쪽만 고쳐지기 쉽다.

```ts
// src/app/api/route-util.ts — 더하는 것
import { NETWORK_ERROR_MESSAGE } from '@/shared/api/error';
import { ApiError } from '@/shared/api/request';

/** 로그인 처리 route 의 백엔드 로그인 — 되면 보낸 DTO · 백엔드 결과, 안 되면 route 가 그대로 돌려줄 응답 */
export type BackendLoginType<D, R> = {dto: D; result: R} | {response: Response};

/**
 * 로그인 처리 route 공통(매니저 · 관리자) — ① 같은 사이트 JSON 만 ② 본문 → DTO → 백엔드 로그인(동기)
 * - 백엔드 4xx 는 message · validation_errors · block_comment 그대로, 네트워크 · 5xx 는 retry — 어느 쪽이든 쿠키는 쓰지 않는다
 *
 * @param request 요청
 * @param toDto 본문 → 로그인 DTO(글자가 아닌 값은 textOf 로 빈 글자 — 백엔드 검증이 칸 오류로 돌려준다)
 * @param login 백엔드 로그인(contracts 의 서버용 함수)
 * @param tag 로그 머리('manager-login' · 'admin-login')
 */
export async function backendLogin<D, R>(request: Request, toDto: (form: Record<string, unknown> | null) => D, login: (dto: D) => Promise<R | null>, tag: string): Promise<BackendLoginType<D, R>> {
    if (!isSameSiteJson(request)) {
        return {response: json({success: false, message: INVALID_REQUEST_MESSAGE})};
    }

    const form = (await request.json().catch((): null => null)) as Record<string, unknown> | null;
    const dto = toDto(form);
    let result: R | null = null;
    try {
        result = await login(dto);
    } catch (error) {
        if (error instanceof ApiError && error.status < 500) {
            const blockComment = typeof error.body.block_comment === 'string' ? error.body.block_comment : null;
            return {response: json({success: false, message: error.body.message, validation_errors: error.body.validation_errors, block_comment: blockComment})};
        }

        console.log(`[${tag}] 로그인 결과를 받지 못함 —`, error instanceof Error ? error.message : error);
    }

    return result ? {dto, result} : {response: json({success: false, message: NETWORK_ERROR_MESSAGE, retry: true})};
}

/**
 * 본문 값 → 글자(아니면 빈 글자 — 백엔드 검증이 칸 오류로 돌려준다) — 가입 · 로그인 route
 *
 * @param value 본문 값
 */
export function textOf(value: unknown): string {
    return typeof value === 'string' ? value : '';
}
```

```ts
// src/app/api/manager/login/route.ts — POST 를 이렇게 줄인다(isSameSiteJson · ApiError · NETWORK_ERROR_MESSAGE import 와 아래 textOf 사본은 지운다)
export async function POST(request: NextRequest): Promise<Response> {
    // ①② 같은 사이트 JSON → 백엔드 로그인 — ④ 거절(4xx) · 다시 시도는 만든 응답 그대로(쿠키 없음)
    const login = await backendLogin(request, (form) => Object.assign(new ManagerLoginDto(), {store_code: textOf(form?.store_code), login_id: textOf(form?.login_id), login_pw: textOf(form?.login_pw)}), loginManager, 'manager-login');
    if ('response' in login) {
        return login.response;
    }

    // ③ 토큰 쿠키 2개 · 계정 쿠키(토큰과 같이 끝남) · 업체코드 쿠키(1년 — 로그아웃해도 남는다)
    const cookieStore = await cookies();
    await setTokenCookies(cookieStore, 'manager', login.result);
    await setAccountCookie(cookieStore, 'manager', {login_id: login.dto.login_id, auth_id: login.result.auth_id}, login.result.refresh_token_expires_at);
    await setRememberCookie(cookieStore, STORE_CODE_COOKIE, login.dto.store_code, STORE_CODE_REMEMBER_DAYS);
    return json({success: true, data: {is_password_change_required: login.result.is_password_change_required}});
}
```

가입 route(`src/app/api/user/sign/route.ts:72`)는 자기 `textOf` 를 지우고 route-util 의 것을 가져온다(나머지 그대로).

### 3-2. 프론트 route 부르기 · 로그인 띠 — `src/shared/api/route.ts`

화면 쪽에서 route 를 부르는 코드(`loginManagerByRoute` `src/contracts/manager/api.ts:70-91` · `signWithSns` `src/contracts/user/api.ts:137-161`)가 보내기 · 본문 읽기 · 실패 → ApiError 를 똑같이 하고, 관리자가 세 번째가 된다. 로그인 띠 계산(`ManagerLoginContent.tsx:31-53` `loginFailureOf`)도 관리자 로그인이 똑같이 쓴다. 도메인을 모르는 실패 처리라 `shared/api` 에 둔다.

```ts
// src/shared/api/route.ts
import { withBasePath } from '@/shared/utils/base-path';
import { ValidationErrorType } from '@/shared/utils/validation';
import { ApiError, ApiFailBodyType, NetworkError, sendRequest } from './request';

/** 프론트 route 응답 본문 — src/app/api/route-util.ts RouteBodyType 과 같은 모양(실패도 200) */
export type RouteResponseType<T> = {
    success: boolean;
    data?: T;
    retry?: boolean;                                       // 일시 실패 — 다시 시도
    message?: string;                                      // 실패 문구
    code?: string;                                         // 화면이 갈래를 나눌 코드(NO_SNS)
    validation_errors?: Array<ValidationErrorType> | null; // 백엔드 칸 오류 그대로
    block_comment?: string | null;                         // 정지 계정 로그인 — 정지 사유
};

/** 로그인 실패 띠 — 받은 문구 · 정지 사유(업체 · 관리자 로그인) */
export type LoginFailureType = {
    message: string;             // "잘못된 로그인 정보입니다." · "이용이 제한된 계정입니다."
    blockComment: string | null; // 정지 사유(403)
};

/** 문구 없이 실패했을 때 */
const LOGIN_FAILED_MESSAGE = '로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.';

/**
 * 프론트 route 에 JSON 을 보낸다(POST — 가입 · 업체 로그인 · 관리자 로그인)
 * - route 는 실패도 200 이라 200 이 아니거나 본문을 못 읽으면 응답이 없는 것으로 본다(NetworkError)
 *
 * @param path route 주소('/api/admin/login/' — basePath 는 여기서 붙인다)
 * @param body JSON 본문
 */
export async function postRoute<T>(path: string, body: unknown): Promise<RouteResponseType<T>> {
    const response = await sendRequest(withBasePath(path), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
    if (!response.ok) {
        throw new NetworkError(new Error(`${path} ${response.status}`));
    }

    const result = (await response.json().catch((): null => null)) as RouteResponseType<T> | null;
    if (!result) {
        throw new NetworkError(new Error(`${path} body`));
    }

    return result;
}

/**
 * route 실패 본문 → ApiError — 다시 시도는 503, 그 밖은 400(문구 · 칸 오류 그대로 — handleApiError · 로그인 띠가 읽는다)
 * - (build 때 고침) 가입 실패에는 정지 사유 칸이 없고 업체 로그인 실패에는 늘 있다(없으면 null) — 기존 테스트가 두 모양을 확인해 인자로 가른다
 *
 * @param result route 응답 본문(success false)
 * @param withBlockComment 로그인 route 면 true — 정지 사유 칸을 늘 붙인다(없으면 null). 가입은 두 칸만
 */
export function routeFailure(result: RouteResponseType<unknown>, withBlockComment: boolean = false): ApiError {
    const body: ApiFailBodyType = {message: result.message ?? '', validation_errors: result.validation_errors ?? null}; // 실패 본문
    return new ApiError(result.retry ? 503 : 400, withBlockComment ? {...body, block_comment: result.block_comment ?? null} : body);
}

/**
 * 띠로 보일 로그인 실패인지 — 칸 오류가 없는 ApiError(로그인 처리가 넘긴 백엔드 문구 · 다시 시도)
 * - 컴포넌트 밖(React Compiler — catch 안 값 계산을 건너뛴다)
 *
 * @param error 로그인 처리 실패
 * @returns 띠 내용, 칸 오류 · 그 밖의 오류면 null(공통 처리)
 */
export function loginFailureOf(error: unknown): LoginFailureType | null {
    if (!(error instanceof ApiError) || (error.body.validation_errors?.length ?? 0) > 0) {
        return null;
    }

    const blockComment = typeof error.body.block_comment === 'string' && error.body.block_comment ? error.body.block_comment : null;
    return {message: error.body.message || LOGIN_FAILED_MESSAGE, blockComment};
}
```

```ts
// src/contracts/manager/api.ts — loginManagerByRoute 를 이렇게(ManagerLoginRouteBodyType · sendRequest · NetworkError · withBasePath · ValidationErrorType import 는 지운다)
export async function loginManagerByRoute(dto: ManagerLoginDto): Promise<ManagerLoginRouteResultType> {
    const result = await postRoute<ManagerLoginRouteResultType>('/api/manager/login/', {store_code: dto.store_code, login_id: dto.login_id, login_pw: dto.login_pw});
    if (result.success && result.data) {
        return result.data;
    }

    throw routeFailure(result, true);
}

// src/contracts/user/api.ts — signWithSns 를 이렇게(SignRouteBodyType 사본 · 쓰지 않게 된 import 는 지운다)
export async function signWithSns(form: UserSignFormType): Promise<SignWithSnsResultType> {
    const result = await postRoute<{is_phone_verified: number}>('/api/user/sign/', {gender: form.gender, birth: form.birth, nickname: form.nickname});
    if (result.success && result.data) {
        return {state: 'ok', is_phone_verified: result.data.is_phone_verified};
    }

    if (result.code === NO_SNS_CODE) {
        return {state: 'no-sns'};
    }

    throw routeFailure(result);
}
```

`ManagerLoginContent.tsx` 는 자기 `LoginFailureType` · `LOGIN_FAILED_MESSAGE` · `loginFailureOf` 를 지우고 `@/shared/api/route` 에서 가져온다(띠 글자 "정지 사유: …" 는 그대로).

### 3-3. 콘솔 로그아웃 — `src/shared/hooks/useConsoleLogout.ts`

업체 콘솔 틀(`ManagerConsoleLayoutContent.tsx:88-99` `logout`)과 똑같다. 갈 곳은 그 영역 로그인 주소(`AREA_LOGIN_PATH[auth.area]` — 매니저 `/manager/login/` · 관리자 `/admin/login/`)라 인자 없이 정해진다.

```ts
// src/shared/hooks/useConsoleLogout.ts
'use client';
import { useContext, useState } from 'react';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { AREA_LOGIN_PATH } from '@/shared/utils/area';
import { replaceDocument } from '@/shared/utils/base-path';
import { showErrorPopup } from '@/shared/utils/error-popup';

/** 토큰 쿠키를 지우지 못함 */
const LOGOUT_FAILED_MESSAGE = '로그아웃하지 못했어요. 잠시 뒤 다시 시도해 주세요.';

export type UseConsoleLogoutType = {
    loggingOut: boolean;         // 로그아웃 중 — 두 번 누름 막기
    logout: () => Promise<void>; // 로그아웃
};

/**
 * 콘솔 로그아웃(업체 관리자 · 관리자 콘솔 틀) — 그 영역 토큰 · 계정 쿠키만 지우고(로그아웃 API 없음) 그 영역 로그인 주소 문서를 새로 연다
 * - 매니저는 업체 로그인 주소 안내 → 기억한 업체 로그인(업체코드 쿠키는 남는다), 관리자는 관리자 로그인
 *
 * @returns
 */
export default function useConsoleLogout(): UseConsoleLogoutType {
    // 변수
    const auth = useContext(AuthContext); // 그 영역 토큰 · 로그아웃

    // 상태
    const [loggingOut, setLoggingOut] = useState<boolean>(false); // 로그아웃 중

    // 함수
    async function logout(): Promise<void> {
        // 쿠키 삭제 → 못 지우면 안내, 지우면 로그인 주소 문서를 새로 연다
        setLoggingOut(true);
        const deleted = await auth.logout();
        if (!deleted) {
            setLoggingOut(false);
            showErrorPopup(LOGOUT_FAILED_MESSAGE);
            return;
        }

        replaceDocument(AREA_LOGIN_PATH[auth.area]);
    }

    return {loggingOut, logout};
}
```

`ManagerConsoleLayoutContent.tsx` 는 `loggingOut` 상태 · `logout` 함수 · `LOGOUT_FAILED_MESSAGE` · 쓰지 않게 된 import(`AREA_LOGIN_PATH` · `replaceDocument` · `showErrorPopup`)를 지우고 `const {loggingOut, logout} = useConsoleLogout();` 한 줄로.

### 3-4. 상단 바 "비밀번호 변경" 강조 — `ConsoleShell`

관리자 비밀번호 변경은 콘솔 안이라 시안이 상단 바 버튼을 강조한다(`admin.html:461`). 메뉴 강조(`activeMenuHref`)와 같은 끝 `/` 규칙으로 본다.

```ts
// src/shared/components/console/console-menu.ts — 더하는 것
/**
 * 지금 주소가 그 주소인지 — 끝 '/' 는 보지 않는다(상단 바 비밀번호 변경 강조)
 *
 * @param pathname 지금 주소
 * @param href 견줄 주소
 */
export function isCurrentPath(pathname: string, href: string): boolean {
    return trimSlash(pathname) === trimSlash(href);
}
```

```tsx
// src/shared/components/console/ConsoleShell.tsx — 비밀번호 변경 링크
<Link href={passwordHref} className={styles.passwordLink} aria-current={isCurrentPath(pathname, passwordHref) ? 'page' : undefined}>비밀번호 변경</Link>
```

```css
/* src/shared/css/console/ConsoleShell.module.css — 지금 화면이면(관리자 비밀번호 변경) */
.passwordLink[aria-current='page'] {
    color: var(--primary-strong);
    font-weight: 700;
}
```

---

## 4. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| `src/app/admin/layout.tsx` | 영역 전체 `data-area="console"` | `src/app/manager/layout.tsx:5-10` |
| `src/app/admin/(console)/layout.tsx` | `<AuthGuard>` 로 콘솔 틀을 감싼다(로그인 화면 `/admin/login` 은 이 그룹 밖) | `src/app/manager/(console)/layout.tsx:9-15` |
| `src/app/admin/(console)/page.tsx` | Content 만 그린다 | `src/app/manager/(console)/page.tsx:4-9` |
| `src/app/admin/login/page.tsx` | `searchParams` 의 `return_url` 을 `firstQueryValue` 로 넘긴다 | `src/app/manager/[store_code]/login/page.tsx:5-13` |
| `src/app/admin/(console)/password/page.tsx` | `?required=1` 을 boolean 으로 넘긴다(가드는 콘솔 layout 이 한다) | `src/app/manager/password/page.tsx:6-15` |
| `src/contracts/admin/dto/admin-login.dto.ts` · `admin-password.dto.ts` | 지침서 사본 그대로(`frontend/dto/admin.md`) | `src/contracts/admin/dto/admin-token-refresh.dto.ts` |
| 재발급 · 토큰 확인 · 401 처리 | 이미 영역 공통 — 관리자 재발급 함수도 있다 | `src/app/api/cookie/token-cookie.ts:38-42` · `src/shared/api/auth.ts:31` |

## 5. 스타일 — 시안 값

| 파일 | 내용 | 근거 |
|---|---|---|
| `src/app/css/admin/AdminLoginContent.module.css` | `.form`(세로 16px) · `.notice`(가운데 13px muted) | `src/app/css/manager/ManagerLoginContent.module.css` · 시안 A1 로그인 |
| `src/app/css/admin/AdminPasswordContent.module.css` | `.page`(세로 20px) · `.title`(22px 700) · `.subtitle`(13px muted) · `.body`(최대 560px · 세로 16px) · `.form`(세로 20px) · `.actions`(오른쪽) | 시안 A1 비밀번호 변경 · `src/app/css/manager/PlansContent.module.css` 머리 |
| `src/app/css/admin/AdminDashboardContent.module.css` | `.page` · `.title` | 같은 머리 |

## 테스트

spec의 "결과" 표에서 ✓ 표시된 9건(콘솔 틀 1 · 관리자 로그인 4 · 로그인 처리 2 · 비밀번호 변경 2)을 그대로 테스트로 옮긴다. 계산 규칙은 없다(spec 결정). 여기에는 추가분만 적는다.

| 종류 | 대상 | 이유 |
|---|---|---|
| 회귀(새 테스트 없음) | `src/test/app/api/manager/login.test.ts` · `src/test/app/manager/(console)/ManagerConsoleLayoutContent.test.tsx` · `src/test/app/manager/[store_code]/login/ManagerLoginContent.test.tsx` · `src/test/app/(user)/signup/SignupContent.test.tsx` | 3 에서 옮긴 공통 함수(`backendLogin` · `postRoute` · `loginFailureOf` · `useConsoleLogout`)를 업체 · 가입이 그대로 쓰는지 — 기존 테스트가 그대로 통과해야 한다 |

테스트 모양 — 파일은 `src/test/app/admin/(console)/AdminConsoleLayoutContent.test.tsx` · `src/test/app/admin/login/AdminLoginContent.test.tsx` · `src/test/app/api/admin/login.test.ts` · `src/test/app/admin/(console)/password/AdminPasswordContent.test.tsx`, 각각 업체 쪽 같은 이름 테스트를 따른다.
- 콘솔 틀 — 상단 바 아이디 · "총괄관리자" · 비밀번호 변경 주소 `/admin/password/`, 메뉴 글자 5개 순서 · 대시보드 `aria-current`, 로그아웃 → `logout` 1번 · `replaceDocument('/admin/login/')` 1번 · 오류 팝업 0번.
- 관리자 로그인 — 성공 인자(`{login_id: 다듬은 값, login_pw}`) · `replace` 주소, 처음 로그인 → `'/admin/password/?required=1'`, 정지 → 띠(`role="alert"` · "사유: …") · 비밀번호 칸 값 `''` · `replace` 0번, 아이디 비움 → 칸 문구 · 로그인 처리 0번.
- 로그인 처리 — 백엔드 주소 `${API_BASE_URL}/admin-service/admin/login` · 본문, 쿠키 `admin_access_token` · `admin_refresh_token` · `admin_account`(`{login_id, auth_id}` · refresh 만료) — `set` 3번(업체코드 쿠키 없음), 404 · 403 → 받은 본문 그대로 · `set` 0번.
- 비밀번호 변경 — 변경 인자 · 토큰, 오류 팝업 "비밀번호를 변경했습니다." · `replace('/admin/')`, 숫자 없는 새 비밀번호 → 칸 옆 DTO 문구 · 변경 0번.

## 만드는 순서

1. DTO 사본 2개 → `src/shared/api/route.ts` → `src/contracts/admin/api.ts`, `loginManagerByRoute` · `signWithSns` 를 `postRoute` · `routeFailure` 로.
2. `route-util.ts` `backendLogin` · `textOf` → 업체 로그인 처리 · 가입 route 를 바꾸고 → 관리자 로그인 처리 route.
3. `useConsoleLogout` → 업체 콘솔 틀을 바꾸고, `ManagerLoginContent` 의 띠 계산을 shared 로.
4. `console-menu.ts` `isCurrentPath` · `ConsoleShell` 비밀번호 변경 강조 · css.
5. `admin-auth.ts` → 관리자 영역 layout · 콘솔 layout · Context · 메뉴 · 콘솔 틀 · 첫 화면.
6. 관리자 로그인 page · Content, 비밀번호 변경 page · Content, css 3개.
7. 테스트 4파일(9건).
8. 문서 — `AGENTS.md`(⚠️ "관리자 A1 로그인 화면은 아직 없다" 줄 · Auth 에 관리자 로그인 줄 · 콘솔 부품에 `useConsoleLogout`), `docs/data-layer.md`(로그인 route 표에 `POST /api/admin/login/` · IP 줄 · `backendLogin` · `postRoute`), `docs/architecture.md`(api/ 에 admin/login), `docs/conventions.md`(공통 부품 · 훅 목록에 `useConsoleLogout` 이 있으면 더함).
