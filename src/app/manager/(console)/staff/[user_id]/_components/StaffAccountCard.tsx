'use client';
import { useContext, useState } from 'react';
import { deleteManagerStaff, resetManagerStaffPassword, updateManagerStaffState } from '@/contracts/manager/api';
import { ManagerStaffDetailResultDto } from '@/contracts/manager/dto/manager-staff-detail.dto';
import { ManagerStaffStateDto } from '@/contracts/manager/dto/manager-staff-state.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { STAFF_STATE } from '../../staff-format';
import styles from '@/app/css/manager/StaffDetailContent.module.css';

type StaffAccountCardProps = {
    staff: ManagerStaffDetailResultDto; // 상세 — 휴대폰 · 상태 · 정지 사유
    onChanged: () => void;              // 초기화 · 정지 · 해제 뒤 상세 다시
    onDeleted: () => void;              // 삭제 뒤 — 목록으로
};

/** 확인 창을 거치는 동작 */
type StaffActionType = 'reset' | 'block' | 'delete';

/** 정지 사유 최대 글자 수 — ManagerStaffStateDto */
const BLOCK_COMMENT_MAX = 255;

/**
 * 계정 관리 카드 — 비밀번호 초기화 · 정지(사유) / 정지 해제 · 삭제. 초기화 · 정지 · 삭제는 확인 창 뒤(spec 결정), 해제는 바로
 * - 확인 창 하나를 세 동작이 함께 쓴다 — 고른 동작이 문구 · 버튼 · 보낼 함수를 정한다
 *
 * @param param0
 * @returns
 */
export default function StaffAccountCard({staff, onChanged, onDeleted}: StaffAccountCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [blockComment, setBlockComment] = useState<string>('');               // 정지 사유 칸
    const [confirming, setConfirming] = useState<StaffActionType | null>(null); // ② 확인 창 — 고른 동작
    const [busy, setBusy] = useState<boolean>(false);                           // 보내는 중
    const [notice, setNotice] = useState<string | null>(null);                  // ④ 초기화 안내

    // 계산 값
    const blocked = staff.state_id === STAFF_STATE.BLOCK;                                 // 정지된 계정 — 정지 줄 대신 해제
    const phoneTo = staff.phone ? `${formatPhone(staff.phone)} 로` : '등록된 휴대폰으로'; // 문자가 갈 곳 — 조사까지 한 덩어리
    const confirmText: Record<StaffActionType, {title: string; message: string; label: string}> = {
        reset: {title: '비밀번호 초기화', message: `${staff.login_id} 계정의 비밀번호를 초기화할까요? 임시 비밀번호가 ${phoneTo} 문자로 갑니다.`, label: '초기화'},
        block: {title: '계정 정지', message: `${staff.login_id} 계정을 정지할까요? 바로 로그인이 막힙니다.`, label: '정지'},
        delete: {title: '계정 삭제', message: `${staff.login_id} 계정을 삭제할까요?`, label: '삭제'},
    };                                                                                    // ② 확인 창 문구
    const current = confirming ? confirmText[confirming] : null;                          // 지금 확인 창

    // 함수
    function blockDto(): ManagerStaffStateDto {
        // 정지 값 — 사유는 다듬고 비면 보내지 않는다
        return Object.assign(new ManagerStaffStateDto(), {state_id: STAFF_STATE.BLOCK, block_comment: blockComment.trim() || undefined});
    }

    async function askBlock(): Promise<void> {
        // ② 정지 — 사유 검사 뒤 확인 창
        if (await validateAction(blockDto())) {
            setConfirming('block');
        }
    }

    async function confirmAction(): Promise<void> {
        // ③ 확인한 동작을 보낸다(큐) → ④ 안내 · 상세 다시, 삭제는 목록으로
        const action = confirming;
        if (busy || action === null) {
            return;
        }

        const send = action === 'reset'
            ? () => resetManagerStaffPassword(auth, staff.user_id)
            : action === 'block'
                ? () => updateManagerStaffState(auth, staff.user_id, blockDto())
                : () => deleteManagerStaff(auth, staff.user_id); // try 안에 갈래를 두지 않는다
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await send();
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setConfirming(null);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        if (action === 'delete') {
            onDeleted();
            return;
        }

        if (action === 'reset') {
            setNotice('임시 비밀번호를 보냈습니다.');
        }
        setBlockComment('');
        onChanged();
    }

    async function unblock(): Promise<void> {
        // 정지 해제 — 확인 없이 바로(큐) → 상세 다시
        if (busy) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateManagerStaffState(auth, staff.user_id, Object.assign(new ManagerStaffStateDto(), {state_id: STAFF_STATE.ACTIVE}));
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
        // 계정 관리
        <Card title="계정 관리">
            <div className={styles.rows}>
                {/* 비밀번호 초기화 */}
                <div className={styles.row}>
                    <div><b>비밀번호 초기화</b><p className={styles.hint}>임시 비밀번호(영문 + 숫자 10자리)를 {phoneTo} 문자로 보냅니다. 로그인하면 비밀번호를 바꾸게 됩니다.</p></div>
                    <Button disabled={busy} onClick={() => setConfirming('reset')}>비밀번호 초기화</Button>
                </div>
                {notice ? <Band tone="ok" role="status">{notice}</Band> : null}
                <hr className={styles.sep} />

                {/* 정지 · 해제 */}
                {blocked ? (
                    <div className={styles.row}>
                        <div><Badge tone="danger">정지</Badge> <span>정지 사유: {staff.block_comment ?? '-'}</span></div>
                        <Button disabled={busy} onClick={unblock}>정지 해제</Button>
                    </div>
                ) : (
                    <Field label="정지 사유 (선택 · 255자 — 로그인할 때 보입니다)" name="block_comment" htmlFor="staff-block-comment" hint="정지하면 로그인 · 토큰 재발급이 막힙니다. 해제하면 다시 쓸 수 있습니다.">
                        <div className={styles.inline}>
                            <Input id="staff-block-comment" placeholder="예: 근무 종료" maxLength={BLOCK_COMMENT_MAX} value={blockComment} onChange={(event) => setBlockComment(event.target.value)} />
                            <Button variant="danger" disabled={busy} onClick={askBlock}>정지</Button>
                        </div>
                    </Field>
                )}
                <hr className={styles.sep} />

                {/* 삭제 */}
                <div className={styles.row}>
                    <div><b>삭제</b><p className={styles.hint}>탈퇴 처리되어 목록에서 사라집니다. 같은 아이디 · 휴대폰 번호로 다시 등록할 수 있습니다.</p></div>
                    <Button variant="danger" disabled={busy} onClick={() => setConfirming('delete')}>삭제</Button>
                </div>
            </div>

            {/* ② 확인 창 */}
            <ConfirmModal open={current !== null} title={current?.title ?? ''} message={current?.message ?? ''} confirmLabel={current?.label} danger busy={busy} onConfirm={confirmAction} onClose={() => setConfirming(null)} />
        </Card>
    );
}
