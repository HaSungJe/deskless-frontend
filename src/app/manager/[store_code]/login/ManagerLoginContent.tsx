'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { loginManagerByRoute, ManagerLoginRouteResultType } from '@/contracts/manager/api';
import { ManagerLoginDto } from '@/contracts/manager/dto/manager-login.dto';
import { handleApiError } from '@/shared/api/error';
import { LoginFailureType, loginFailureOf } from '@/shared/api/route';
import ConsoleAuthCard from '@/shared/components/console/ConsoleAuthCard';
import ConsoleAuthFrame from '@/shared/components/console/ConsoleAuthFrame';
import Loading from '@/shared/components/Loading';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { safeReturnPath } from '@/shared/utils/area';
import { validateAction } from '@/shared/utils/validation';
import { afterManagerLoginPath, managerStorePath } from '../../manager-auth';
import LoginStoreNotFound from '../_components/LoginStoreNotFound';
import LoginStoreSuspended from '../_components/LoginStoreSuspended';
import useLoginStore from '../useLoginStore';
import styles from '@/app/css/manager/ManagerLoginContent.module.css';

type ManagerLoginContentProps = {
    storeCode: string;        // 주소의 업체코드 — 화면에서 받지 않는다
    returnUrl: string | null; // 로그인 뒤 돌아갈 주소
};

/**
 * M1 업체 로그인 — 주소의 업체코드로 업체 확인(업체명 제목) → 아이디 · 비밀번호 → 로그인 처리 route → 비밀번호 변경 · 돌아갈 주소
 *
 * @param param0
 * @returns
 */
export default function ManagerLoginContent({storeCode, returnUrl}: ManagerLoginContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                  // 로그인 뒤 · 이미 로그인 때 이동
    const auth = useContext(AuthContext);        // 이미 매니저로 로그인했는지
    const loginStore = useLoginStore(storeCode); // ① 주소의 업체코드로 업체 확인

    // 상태
    const [loginId, setLoginId] = useState<string>('');                    // 아이디
    const [loginPw, setLoginPw] = useState<string>('');                    // 비밀번호
    const [failure, setFailure] = useState<LoginFailureType | null>(null); // 실패 띠
    const [submitting, setSubmitting] = useState<boolean>(false);          // 로그인 중 — 두 번 누름 막기

    // 계산 값
    const storeName = loginStore.status === 'ok' ? loginStore.store.store_name : null;     // 제목 — 확인된 업체명
    const showForm = loginStore.status !== 'loading' && loginStore.status !== 'not-found'; // 로그인 칸 — 없는 업체면 안내만

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
            {/* ① 업체 확인 중 */}
            {loginStore.status === 'loading' ? <Loading size={40} height={20} /> : null}

            {/* ① 없는 업체 — 로그인 칸 없이 안내 */}
            {loginStore.status === 'not-found' ? <LoginStoreNotFound /> : null}

            {/* 있는 업체 · 영업중지 · 확인 못 함 — 로그인 칸(제목은 업체명, 모르면 "업체 관리자 로그인") */}
            {showForm ? (
                <ConsoleAuthCard caption={storeName ? '업체 관리자 로그인' : undefined} title={storeName ?? '업체 관리자 로그인'} description="아이디와 비밀번호를 입력해주세요.">
                    {/* 영업중지 — 로그인은 그대로 */}
                    {loginStore.status === 'suspended' ? <LoginStoreSuspended message={loginStore.message} suspendComment={loginStore.suspendComment} /> : null}

                    {/* ⑤ 실패 띠 */}
                    {failure ? (
                        <Band tone="danger" role="alert" title={failure.message}>{failure.blockComment ? `정지 사유: ${failure.blockComment}` : null}</Band>
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
            ) : null}
        </ConsoleAuthFrame>
    );
}
