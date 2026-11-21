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
 * - 업체 로그인과 달리(시안) 실패 띠는 아이디 칸 위, 정지 사유 머리는 "사유:", 실패하면 비밀번호 칸만 비운다
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
