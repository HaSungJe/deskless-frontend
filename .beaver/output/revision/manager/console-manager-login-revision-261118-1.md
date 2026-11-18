# Revision — 업체 콘솔 — 콘솔 틀 · 매니저 로그인 · 대시보드 — 261118-1

> 기존 기능의 변경 계획. 원래 [spec](../../spec/manager/console-manager-login-spec.md) · [plan](../../plan/manager/console-manager-login-plan.md)은 고치지 않고 참조만 한다.

## Reason for Change Request
업체 로그인 화면이 주소의 업체코드가 맞는지 모른 채 열린다 — 업체 ID(같은 32자 모양)나 틀린 값으로 들어와도 로그인 칸이 보이고, 로그인을 눌러야 "잘못된 로그인 정보입니다."로 아이디 · 비밀번호가 틀린 것처럼 보인다(사용자 2026-11-18). 백엔드가 업체코드로 업체를 확인하는 공개 API 를 더했다 — `frontend/changes/2026-11-18-store-login-store.md`(`GET /api/v1/admin-service/store/login-store/:store_code`). 화면이 열릴 때 업체를 확인하고, 제목에 "업체 관리자 로그인" 대신 업체명을 보인다.

## Spec Before → After

| Item | Before | After |
|------|--------|-------|
| 업체 로그인 화면이 열릴 때 | 주소의 업체코드를 확인하지 않고 바로 로그인 칸 | 업체 확인(1번) — 있으면 로그인 칸, 없으면 안내만 |
| 업체 로그인 제목 | "업체 관리자 로그인" | 업체명(위 작은 글자 "업체 관리자 로그인") |
| 없는 업체 · 탈퇴 업체 · 업체 ID 등 틀린 업체코드(404) | 로그인을 눌러야 "잘못된 로그인 정보입니다." | "업체 로그인 주소를 확인해 주세요" 안내, 로그인 칸 없음, "업체코드 다시 입력"(안내 화면 — 기억한 업체로 다시 보내지 않음) |
| 영업중지 업체(400) | 구별 없음 | "영업이 중지된 업체입니다." 위험 띠 + 정지 사유, 로그인 칸은 그대로(백엔드 로그인은 막히지 않고, 로그인해서 정지 사유를 본다 — 제목은 "업체 관리자 로그인") |
| 업체 확인이 실패한다(네트워크 · 5xx) | — | 공통 실패 안내, 로그인 칸은 그대로(제목 "업체 관리자 로그인") |
| 아이디 찾기 · 비밀번호 초기화 | 업체 확인 없음 | 로그인과 같은 업체 확인 — 제목 위 작은 글자로 업체명, 없으면 같은 안내, 영업중지면 같은 띠 |
| 업체 로그인 주소 안내 `/manager/login` | 기억한 업체코드가 있으면 늘 그 업체 로그인으로 | `?manual=1` 이면 보내지 않고 붙여 넣기 칸을 보인다(없는 업체 안내에서 온 경우 — 기억한 업체가 그 업체면 같은 안내로 되돌아가지 않게) |

## Affected Files
| File | Change Type | Description |
|------|-------------|-------------|
| `src/contracts/store/dto/store-login-store.dto.ts` | add | 변경 문서의 DTO 사본 그대로 |
| `src/contracts/store/api.ts` | modify | `getLoginStore(store_code, signal?)` — 동기 · 공개 |
| `src/app/manager/[store_code]/useLoginStore.ts` | add | 업체 확인 훅 — 세 화면이 쓴다 |
| `src/app/manager/[store_code]/_components/LoginStoreNotFound.tsx` | add | 없는 업체 안내 카드 |
| `src/app/manager/[store_code]/_components/LoginStoreSuspended.tsx` | add | 영업중지 띠 |
| `src/shared/components/console/ConsoleAuthCard.tsx` · `src/shared/css/console/ConsoleAuthCard.module.css` | modify | 제목 위 작은 글자 `caption` |
| `src/app/manager/[store_code]/login/ManagerLoginContent.tsx` | modify | 업체 확인 · 제목에 업체명 |
| `src/app/manager/[store_code]/find-login-id/ManagerFindLoginIdContent.tsx` · `password-reset/ManagerPasswordResetContent.tsx` | modify | 업체 확인 · 제목 위 업체명 |
| `src/app/manager/login/page.tsx` · `src/app/manager/manager-auth.ts` | modify | `?manual=1` 이면 기억한 업체로 보내지 않음 · `MANAGER_GUIDE_MANUAL_PATH` |
| `src/test/app/manager/[store_code]/login/ManagerLoginContent.test.tsx` · `find-login-id/ManagerFindLoginIdContent.test.tsx` | modify | 업체 확인 mock · 업체명 · 없는 업체 |
| `docs/data-layer.md` · `AGENTS.md` | modify | 반영한 백엔드 수정 요청 기록, M1 업체 확인 |

## Code Changes

```ts
// src/contracts/store/api.ts — after (더함)
/**
 * 매니저 로그인용 업체 확인 — 동기 · 공개 (GET /admin-service/store/login-store/:store_code)
 * - 없음 · 탈퇴 · 모양이 틀린 업체코드는 404, 영업중지는 400 + suspend_comment(frontend/changes/2026-11-18-store-login-store.md)
 *
 * @param store_code 주소의 업체코드
 * @param signal 화면을 떠날 때 취소
 */
export function getLoginStore(store_code: string, signal?: AbortSignal): Promise<StoreLoginStoreResultDto | null> {
    return request<StoreLoginStoreResultDto>({path: `/admin-service/store/login-store/${encodeURIComponent(store_code)}`, signal});
}
```

```ts
// src/app/manager/[store_code]/useLoginStore.ts — 새 파일
'use client';
import { useEffect, useState } from 'react';
import { getLoginStore } from '@/contracts/store/api';
import { StoreLoginStoreResultDto } from '@/contracts/store/dto/store-login-store.dto';
import { handleApiError } from '@/shared/api/error';
import { ApiError } from '@/shared/api/request';

/** 업체 확인 결과 — 확인 중 · 있음 · 없음 · 영업중지 · 확인 못 함 */
export type UseLoginStoreType =
    | {status: 'loading'}
    | {status: 'ok'; store: StoreLoginStoreResultDto}
    | {status: 'not-found'}
    | {status: 'suspended'; message: string; suspendComment: string | null}
    | {status: 'unknown'};

/**
 * 업체 확인 실패 → 결과 — 404 없음, 400 영업중지(+ 정지 사유), 그 밖은 확인 못 함(컴포넌트 밖 — 값 계산)
 *
 * @param error 업체 확인 실패
 */
function loginStoreFailureOf(error: unknown): UseLoginStoreType {
    if (error instanceof ApiError && error.status === 404) {
        return {status: 'not-found'};
    }

    if (error instanceof ApiError && error.status === 400) {
        const suspendComment = typeof error.body.suspend_comment === 'string' && error.body.suspend_comment ? error.body.suspend_comment : null;
        return {status: 'suspended', message: error.body.message, suspendComment};
    }

    return {status: 'unknown'};
}

/**
 * 주소의 업체코드로 업체 확인 — 업체 로그인 · 아이디 찾기 · 비밀번호 초기화가 열릴 때
 *
 * @param storeCode 주소의 업체코드
 */
export default function useLoginStore(storeCode: string): UseLoginStoreType {
    // 상태
    const [result, setResult] = useState<UseLoginStoreType>({status: 'loading'}); // 업체 확인 결과

    // 효과
    useEffect(() => {
        // 업체 확인 1번 — 확인 못 함(네트워크 · 5xx)은 공통 안내(떠나면 결과를 버린다)
        const controller = new AbortController();
        getLoginStore(storeCode, controller.signal).then((store) => {
            if (!controller.signal.aborted) {
                setResult(store ? {status: 'ok', store} : {status: 'not-found'});
            }
        }).catch((error: unknown) => {
            if (controller.signal.aborted) {
                return;
            }

            const failure = loginStoreFailureOf(error);
            if (failure.status === 'unknown') {
                handleApiError(error);
            }
            setResult(failure);
        });

        return () => {
            controller.abort();
        };
    }, [storeCode]);

    return result;
}
```

```tsx
// src/app/manager/[store_code]/_components/LoginStoreNotFound.tsx — 새 파일
import Link from 'next/link';
import ConsoleAuthCard from '@/shared/components/console/ConsoleAuthCard';
import { buttonClass } from '@/shared/components/ui/button/Button';
import { MANAGER_GUIDE_MANUAL_PATH } from '../../manager-auth';

/**
 * 없는 업체 안내 — 로그인 칸 없이, 업체코드를 다시 넣는 안내 화면으로(기억한 업체로 보내지 않음)
 *
 * @returns
 */
export default function LoginStoreNotFound(): React.ReactNode {
    return (
        // 없는 업체
        <ConsoleAuthCard title="업체 로그인 주소를 확인해 주세요" description="업체를 찾을 수 없습니다. 업체 총관리자에게 받은 로그인 주소가 맞는지 확인해 주세요.">
            <Link href={MANAGER_GUIDE_MANUAL_PATH} className={buttonClass({variant: 'primary', full: true})}>업체코드 다시 입력</Link>
        </ConsoleAuthCard>
    );
}
```

```tsx
// src/app/manager/[store_code]/_components/LoginStoreSuspended.tsx — 새 파일
import Band from '@/shared/components/ui/display/Band';

type LoginStoreSuspendedProps = {
    message: string;              // "영업이 중지된 업체입니다."
    suspendComment: string | null; // 정지 사유
};

/**
 * 영업중지 띠 — 로그인은 그대로 두고 알리기만(로그인해서 정지 사유를 본다)
 *
 * @param param0
 * @returns
 */
export default function LoginStoreSuspended({message, suspendComment}: LoginStoreSuspendedProps): React.ReactNode {
    return (
        // 영업중지
        <Band tone="danger" title={message}>{suspendComment ? `정지 사유: ${suspendComment}` : null}</Band>
    );
}
```

```tsx
// src/shared/components/console/ConsoleAuthCard.tsx — before
type ConsoleAuthCardProps = {
    title?: string;                // 카드 제목(h1)
    description?: React.ReactNode; // 제목 아래 설명
// …
            {title ? (
                <div>
                    <h1 className={styles.title}>{title}</h1>
```

```tsx
// src/shared/components/console/ConsoleAuthCard.tsx — after
type ConsoleAuthCardProps = {
    caption?: string;              // 제목 위 작은 글자(업체명 · "업체 관리자 로그인")
    title?: string;                // 카드 제목(h1)
    description?: React.ReactNode; // 제목 아래 설명
// …
            {title ? (
                <div>
                    {caption ? <p className={styles.caption}>{caption}</p> : null}
                    <h1 className={styles.title}>{title}</h1>
```

```tsx
// src/app/manager/[store_code]/login/ManagerLoginContent.tsx — after(바뀌는 곳)
    // 변수
    const router = useRouter();                // 로그인 뒤 · 이미 로그인 때 이동
    const auth = useContext(AuthContext);      // 이미 매니저로 로그인했는지
    const loginStore = useLoginStore(storeCode); // ① 주소의 업체코드로 업체 확인

    // 계산 값
    const storeName = loginStore.status === 'ok' ? loginStore.store.store_name : null; // 제목 — 확인된 업체명

    // …(효과 · submit 그대로)

    return (
        // 업체 로그인 — 메뉴 없는 가운데 카드
        <ConsoleAuthFrame areaName="업체 관리자 콘솔">
            {loginStore.status === 'loading' ? <Loading size={40} height={20} /> : null}

            {/* 없는 업체 — 로그인 칸 없음 */}
            {loginStore.status === 'not-found' ? <LoginStoreNotFound /> : null}

            {/* 있는 업체 · 영업중지 · 확인 못 함 — 로그인 칸 */}
            {loginStore.status === 'ok' || loginStore.status === 'suspended' || loginStore.status === 'unknown' ? (
                <ConsoleAuthCard caption={storeName ? '업체 관리자 로그인' : undefined} title={storeName ?? '업체 관리자 로그인'} description="아이디와 비밀번호를 입력해주세요.">
                    {loginStore.status === 'suspended' ? <LoginStoreSuspended message={loginStore.message} suspendComment={loginStore.suspendComment} /> : null}
                    {/* ⑤ 실패 띠 · ① 아이디 · 비밀번호 · 링크 — 그대로 */}
                </ConsoleAuthCard>
            ) : null}
        </ConsoleAuthFrame>
    );
```

```tsx
// src/app/manager/[store_code]/find-login-id/ManagerFindLoginIdContent.tsx — after(바뀌는 곳 — 비밀번호 초기화도 같은 모양)
    // 변수
    const loginStore = useLoginStore(storeCode); // 주소의 업체코드로 업체 확인

    // 계산 값
    const storeName = loginStore.status === 'ok' ? loginStore.store.store_name : undefined; // 제목 위 업체명

    // …
            {loginStore.status === 'loading' ? <Loading size={40} height={20} /> : null}
            {loginStore.status === 'not-found' ? <LoginStoreNotFound /> : null}
            {/* 있는 업체 · 영업중지 · 확인 못 함 — 결과 카드 또는 입력 카드(그대로) */}
            <ConsoleAuthCard caption={storeName} title="아이디 찾기" description="계정에 등록된 휴대폰 번호로 인증번호를 받습니다.">
                {loginStore.status === 'suspended' ? <LoginStoreSuspended message={loginStore.message} suspendComment={loginStore.suspendComment} /> : null}
                {/* 단계 · 인증번호 · 링크 — 그대로 */}
            </ConsoleAuthCard>
```

```ts
// src/app/manager/manager-auth.ts — after(더함)
/** 업체 로그인 주소 안내 — 기억한 업체로 보내지 않고 붙여 넣기 칸(없는 업체 안내에서) */
export const MANAGER_GUIDE_MANUAL_PATH = '/manager/login/?manual=1';
```

```tsx
// src/app/manager/login/page.tsx — before
    const remembered = managerLoginPath((await cookies()).get(STORE_CODE_COOKIE)?.value ?? '', returnUrl);
    if (remembered) {
        redirect(remembered);
    }
```

```tsx
// src/app/manager/login/page.tsx — after
    // ① 기억한 업체코드 → 그 업체 로그인(돌아갈 주소를 들고) — 직접 넣겠다고 왔으면(?manual=1 — 없는 업체 안내) 보내지 않는다
    const manual = firstQueryValue(query.manual) === '1';
    const remembered = manual ? null : managerLoginPath((await cookies()).get(STORE_CODE_COOKIE)?.value ?? '', returnUrl);
    if (remembered) {
        redirect(remembered);
    }
```

```css
/* src/shared/css/console/ConsoleAuthCard.module.css — after(더함) */
.caption {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
}
```

## 테스트
- 업체 로그인 — `[SUCCESS]` 정상 테스트에 더한다: 업체 확인 1번(주소의 업체코드) → 제목이 업체명, 위 작은 글자 "업체 관리자 로그인". 새 `[FAIL:not-found]` 없는 업체코드로 들어온다 → "업체 로그인 주소를 확인해 주세요" · "업체코드 다시 입력" 링크(`/manager/login/?manual=1`), 아이디 칸 · 로그인 버튼 없음, 로그인 처리 0번.
- 아이디 찾기 — 정상 테스트에 업체 확인 mock 을 더하고 제목 위 업체명을 본다.
- 영업중지 띠 · 비밀번호 초기화 · 안내 `?manual=1` 은 테스트하지 않는다 — 같은 업체 확인의 갈래 · 띠만, 쿠키 page 는 서버 렌더.
- spec 24건 + 이번 1건 = 25건(테스트 상한 안).

## Decisions
- [x] 영업중지(400)면 로그인 칸은 그대로 두고 띠만 보인다. 근거: 백엔드 로그인은 영업중지 업체도 막지 않고(변경 문서), 업체 관리자는 로그인해서 내 업체 · 대시보드에서 정지 사유를 본다 — 막으면 정지를 풀 일을 볼 길이 없다.
- [x] 업체 확인은 화면(클라이언트)에서 한다. 근거: 형제 업체 상세 화면이 조회 · 없는 업체 처리를 화면 효과에서 한다(`src/app/(user)/stores/[store_id]/StoreDetailContent.tsx:62`), page 는 얇게(AGENTS.md).
- [x] 업체 로그인 주소 안내의 붙여 넣기는 이동 전에 확인하지 않는다 — 옮겨 간 로그인 화면이 확인한다(변경 문서 "선택").
- [x] 반영 기록은 `docs/data-layer.md` "백엔드 수정 요청" 줄에 남긴다 — `frontend/changes/README.md` 는 백엔드가 쓰는 사본이라 고치지 않는다.
