'use client';
import { useContext, useState } from 'react';
import { MEMBER_STATE } from '@/contracts/common/member.constants';
import { updateUserState } from '@/contracts/user/api';
import { UserDetailResultDto } from '@/contracts/user/dto/user-detail.dto';
import { UserStateDto } from '@/contracts/user/dto/user-state.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import Field from '@/shared/components/ui/form/Field';
import Textarea from '@/shared/components/ui/form/Textarea';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import styles from '@/app/css/admin/AdminDetail.module.css';

type UserStateCardProps = {
    user: UserDetailResultDto; // 상세 — 닉네임 · 상태 · 이용 제한 사유
    onChanged: () => void;     // ③④ 바꾼 뒤 상세 다시
};

/** 이용 제한 사유 최대 글자 수 — UserStateDto */
const BLOCK_COMMENT_MAX = 255;

/**
 * 이용 제한 카드 — 정상이면 사유 칸 · 이용 제한(확인 창 — 사용자 결정), 정지면 사유 · 제한 해제(바로), 탈퇴 대기 · 탈퇴면 바꿀 수 없음
 *
 * @param param0
 * @returns
 */
export default function UserStateCard({user, onChanged}: UserStateCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰

    // 상태
    const [blockComment, setBlockComment] = useState<string>(''); // 이용 제한 사유 칸
    const [confirming, setConfirming] = useState<boolean>(false); // ③ 확인 창
    const [busy, setBusy] = useState<boolean>(false);             // 보내는 중
    const [notice, setNotice] = useState<string | null>(null);    // ③ 제한 안내

    // 계산 값
    const blocked = user.state_id === MEMBER_STATE.BLOCK;                                             // ② 정지 — 해제 버튼
    const locked = user.state_id === MEMBER_STATE.LEAVE_WAIT || user.state_id === MEMBER_STATE.LEAVE; // ② 탈퇴 대기 · 탈퇴 — 바꿀 수 없음

    // 함수
    function blockDto(): UserStateDto {
        // 이용 제한 값 — 사유는 다듬고 비면 보내지 않는다
        return Object.assign(new UserStateDto(), {state_id: MEMBER_STATE.BLOCK, block_comment: blockComment.trim() || undefined});
    }

    async function send(dto: UserStateDto): Promise<boolean> {
        // 상태 변경(큐) — 실패는 받은 문구(칸 오류는 칸 옆), 성공이면 true
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateUserState(auth, user.user_id, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error);
            return false;
        }

        return true;
    }

    async function askBlock(): Promise<void> {
        // ③ 이용 제한 — 사유 검사 뒤 확인 창
        if (await validateAction(blockDto())) {
            setConfirming(true);
        }
    }

    async function confirmBlock(): Promise<void> {
        // ③ 확인 → 상태 변경(정지 · 사유) → 안내 · 상세 다시
        if (busy) {
            return;
        }

        const done = await send(blockDto());
        setConfirming(false);
        if (!done) {
            return;
        }

        setBlockComment('');
        setNotice('이용을 제한했습니다. 이 이용자는 새 예약 · 연장을 할 수 없습니다.');
        onChanged();
    }

    async function unblock(): Promise<void> {
        // ④ 제한 해제 — 확인 없이 바로(정상) → 상세 다시(사유는 백엔드가 지운다)
        if (busy) {
            return;
        }

        if (await send(Object.assign(new UserStateDto(), {state_id: MEMBER_STATE.ACTIVE}))) {
            setNotice(null);
            onChanged();
        }
    }

    return (
        // 이용 제한
        <Card title="이용 제한">
            <div className={styles.cardBody}>
                {/* 안내 · ③ 제한 안내 */}
                <p className={styles.muted}>이용을 제한하면 로그인과 이미 한 예약의 이용은 되고, <strong>새 예약 · 연장만</strong> 막힙니다. 제한 사유는 이용자 화면에 보입니다.</p>
                {notice ? <Band tone="ok" role="status">{notice}</Band> : null}

                {locked ? (
                    // ② 탈퇴 대기 · 탈퇴 — 바꿀 수 없음
                    <>
                        <Band tone="warn">탈퇴 대기 · 탈퇴 회원은 상태를 바꿀 수 없습니다.</Band>
                        <div><Button variant="danger" disabled>이용 제한</Button></div>
                    </>
                ) : blocked ? (
                    // ② 정지 — 사유 · ④ 해제
                    <>
                        <Band tone="danger" title="이용 제한 사유">{user.block_comment ?? '—'}</Band>
                        <p className={styles.muted}>해제하면 사유는 지워집니다.</p>
                        <div><Button variant="primary" disabled={busy} onClick={unblock}>제한 해제</Button></div>
                    </>
                ) : (
                    // ② 정상 — 사유 칸 · ③ 이용 제한
                    <>
                        <Field label="이용 제한 사유" name="block_comment" htmlFor="user-block-comment" hint={<span>{blockComment.length} / {BLOCK_COMMENT_MAX}</span>}>
                            <Textarea id="user-block-comment" placeholder="이용자에게 보일 사유(선택)" maxLength={BLOCK_COMMENT_MAX} value={blockComment} onChange={(event) => setBlockComment(event.target.value)} />
                        </Field>
                        <div><Button variant="danger" disabled={busy} onClick={askBlock}>이용 제한</Button></div>
                    </>
                )}
            </div>

            {/* ③ 확인 창 */}
            <ConfirmModal open={confirming} title="이용 제한" message={`${user.nickname} 님의 이용을 제한할까요? 새 예약 · 연장이 막힙니다.`} confirmLabel="이용 제한" danger busy={busy} onConfirm={confirmBlock} onClose={() => setConfirming(false)} />
        </Card>
    );
}
