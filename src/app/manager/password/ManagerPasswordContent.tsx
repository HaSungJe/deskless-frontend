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
 * - 결과는 null(완료 · 늦어짐 같음)이고 확인할 조회가 없어 됨으로 안내한다(spec 결정)
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
