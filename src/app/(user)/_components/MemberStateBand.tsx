import Link from 'next/link';
import dayjs from 'dayjs';
import { MEMBER_STATE } from '@/contracts/common/member.constants';
import { UserMeResultDto } from '@/contracts/user/dto/user-me.dto';
import Band from '@/shared/components/ui/display/Band';

type MemberStateBandProps = {
    me: Pick<UserMeResultDto, 'state_id' | 'block_comment' | 'leave_reserved_at'> | null; // 내 정보 — 없으면 그리지 않음
    action?: React.ReactNode;                                                               // 탈퇴 대기 띠의 할 일 — 없으면 마이페이지로 가는 "탈퇴 철회하기" 링크(마이페이지는 철회 버튼을 넘긴다)
};

/**
 * 회원 상태 띠 — 이용 제한(BLOCK) · 탈퇴 대기(LEAVE_WAIT)만, 그 밖은 그리지 않는다(시안 user.html:282-302)
 * - 예약(U3) · 연장(U9) · 마이페이지(U10)가 쓴다(사용자 결정 — 필요한 화면에만)
 *
 * @param param0
 * @returns
 */
export default function MemberStateBand({me, action}: MemberStateBandProps): React.ReactNode {
    if (me?.state_id === MEMBER_STATE.BLOCK) {
        return (
            // 이용 제한
            <Band tone="danger" title="이용이 제한된 계정이에요">
                {me.block_comment ? <span>정지 사유: {me.block_comment}</span> : null}
                <span>로그인과 기존 예약 이용은 되지만 새 예약 · 연장은 할 수 없어요.</span>
            </Band>
        );
    }

    if (me?.state_id === MEMBER_STATE.LEAVE_WAIT) {
        return (
            // 탈퇴 대기
            <Band tone="warn" title="탈퇴 대기 중이에요">
                <span>{formatLeaveAt(me.leave_reserved_at)}에 탈퇴돼요. 그 전까지 철회할 수 있어요.</span>
                {action ?? <Link href="/me/">탈퇴 철회하기</Link>}
            </Band>
        );
    }

    return null;
}

/**
 * 탈퇴 예정 시각 — 백엔드가 한국 시각 'YYYY-MM-DD HH:mm:ss'(오프셋 없음)로 주므로 바꾸지 않고 모양만
 *
 * @param value leave_reserved_at
 */
function formatLeaveAt(value: string | null): string {
    return value ? dayjs(value).format('YYYY년 M월 D일 HH:mm') : '';
}
