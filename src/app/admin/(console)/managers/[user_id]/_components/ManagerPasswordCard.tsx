'use client';
import { useContext, useState } from 'react';
import { resetManagerAccountPassword } from '@/contracts/manager/api';
import { ManagerAccountDetailResultDto } from '@/contracts/manager/dto/manager-account-detail.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone } from '@/shared/utils/format';
import { passwordResetOf } from '../../manager-format';
import styles from '@/app/css/admin/AdminDetail.module.css';

type ManagerPasswordCardProps = {
    account: ManagerAccountDetailResultDto; // 상세 — 이름 · 아이디 · 휴대폰 · 업체 상태
    onReset: () => void;                    // ④ 초기화 뒤 상세 다시
};

/**
 * 비밀번호 초기화 카드 — 초기화 판단(휴대폰 · 탈퇴 업체) · 확인 창 · 초기화(큐) · 보낸 안내
 *
 * @param param0
 * @returns
 */
export default function ManagerPasswordCard({account, onReset}: ManagerPasswordCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰

    // 상태
    const [confirming, setConfirming] = useState<boolean>(false); // ③ 확인 창
    const [busy, setBusy] = useState<boolean>(false);             // 보내는 중
    const [notice, setNotice] = useState<string | null>(null);    // ④ 보낸 안내

    // 계산 값
    const reset = passwordResetOf(account);                            // ② 초기화할 수 있는지 · 막는 이유
    const phoneText = account.phone ? formatPhone(account.phone) : ''; // 문자가 갈 휴대폰

    // 함수
    async function confirmReset(): Promise<void> {
        // ④ 초기화(큐) → 보낸 안내 · 상세 다시
        if (busy) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await resetManagerAccountPassword(auth, account.user_id);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setConfirming(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        setNotice(`임시 비밀번호를 ${phoneText} 로 보냈습니다.`);
        onReset();
    }

    return (
        // 비밀번호 초기화
        <Card title="비밀번호 초기화">
            <div className={styles.cardBody}>
                {/* 안내 · ④ 보낸 안내 */}
                <p className={styles.muted}>임시 비밀번호를 만들어 {phoneText ? `${phoneText} 로` : '등록된 휴대폰으로'} 문자를 보냅니다. 업체 관리자는 로그인한 뒤 비밀번호를 바꾸게 됩니다.</p>
                {notice ? <Band tone="ok" role="status">{notice}</Band> : null}

                {/* ②③ 버튼 · 막는 이유 */}
                <div><Button variant="primary" disabled={!reset.allowed || busy} onClick={() => setConfirming(true)}>비밀번호 초기화</Button></div>
                {reset.reason ? <p className={styles.muted}>{reset.reason}</p> : null}

                {/* 참고 */}
                <ul className={styles.notes}>
                    <li>휴대폰 번호가 없는 계정 · 탈퇴한 업체의 계정은 초기화할 수 없습니다.</li>
                    <li>정지된 계정도 초기화할 수 있습니다.</li>
                    <li>계정 정보 수정 · 정지는 그 업체의 업체 총관리자가 업체 관리자 콘솔에서 합니다.</li>
                </ul>
            </div>

            {/* ③ 확인 창 */}
            <ConfirmModal open={confirming} title="비밀번호를 초기화할까요?" message={`${account.name}(${account.login_id})의 임시 비밀번호를 만들어 ${phoneText} 로 SMS 를 보냅니다. 지금 비밀번호로는 더 이상 로그인할 수 없습니다.`} confirmLabel="비밀번호 초기화" danger busy={busy} onConfirm={confirmReset} onClose={() => setConfirming(false)} />
        </Card>
    );
}
