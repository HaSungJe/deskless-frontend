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
 * - 성공 안내 · 실패 문구는 오류 팝업 하나(시안은 띠 — 공통 오류 팝업 규칙, spec 결정)
 *
 * @param param0
 * @returns
 */
export default function AdminPasswordContent({required}: AdminPasswordContentProps): React.ReactNode {
    // 변수
    const router = useRouter();                        // 바꾼 뒤 첫 화면
    const auth = useContext(AuthContext);              // 관리자 토큰
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
