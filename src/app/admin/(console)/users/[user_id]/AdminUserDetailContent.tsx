'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { MEMBER_STATE, memberStateTone } from '@/contracts/common/member.constants';
import { getUser } from '@/contracts/user/api';
import { UserDetailResultDto } from '@/contracts/user/dto/user-detail.dto';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone, toKst } from '@/shared/utils/format';
import { USER_LIST_PATH } from '../../admin-paths';
import UserReservationsCard from './_components/UserReservationsCard';
import UserStateCard from './_components/UserStateCard';
import styles from '@/app/css/admin/AdminDetail.module.css';

type AdminUserDetailContentProps = {
    userId: string; // 주소의 이용자 회원 ID
};

/**
 * A6 이용자 상세 — 회원 정보 · 이용 제한 · 해제 · 예약 요약 · 예약 이력
 * - 예약 이력은 상태 변경과 상관없이 따로 쪽을 넘기므로 카드 안에서 따로 읽는다(상세를 다시 읽어도 이력 쪽이 그대로)
 * - 상태 카드는 key 없이 둔다 — 제한 안내 띠가 다시 읽은 뒤에도 남는다
 *
 * @param param0
 * @returns
 */
export default function AdminUserDetailContent({userId}: AdminUserDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                    // 관리자 토큰
    const loadUser = useEffectEvent((signal: AbortSignal) => getUser(auth, userId, signal)); // 그때의 auth · 이용자로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);             // ③④ 다시 읽기
    const [user, setUser] = useState<UserDetailResultDto | null>(null); // ① 상세
    const [failed, setFailed] = useState<boolean>(false);               // ① 못 읽음

    // 계산 값
    const snsText = lookupName('sns_id', user?.sns_id) || '—'; // 가입 SNS

    // 효과
    useEffect(() => {
        // ① 상세(이용자가 바뀌거나 다시 읽을 때 · 떠나면 결과를 버린다)
        const controller = new AbortController();
        loadUser(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setUser(next);
                setFailed(next === null);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setFailed(true);
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [userId, reloadKey]);

    // 함수
    function reload(): void {
        // ③④ 상세 다시
        setReloadKey((key) => key + 1);
    }

    if (!user) {
        return failed ? (
            // ① 못 읽음
            <EmptyState title="이용자를 불러오지 못했어요" description="없는 이용자이거나 잠시 연결이 안 됩니다." action={<Link href={USER_LIST_PATH} className={buttonClass({size: 'sm'})}>이용자 목록</Link>} />
        ) : null;
    }

    return (
        // 이용자 상세
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <p className={styles.crumb}><Link href={USER_LIST_PATH}>이용자 목록</Link></p>
                <h1 className={styles.title}>{user.nickname}<Badge tone={memberStateTone(user.state_id)}>{lookupName('state_id', user.state_id)}</Badge></h1>
                <p className={styles.sub}>{user.name} · {snsText} 가입 · {toKst(user.created_at, 'YYYY-MM-DD HH:mm')}</p>
            </div>

            <div className={styles.cols}>
                {/* ① 회원 정보 */}
                <Card title="회원 정보">
                    <dl className={styles.dl}>
                        <dt>닉네임</dt><dd>{user.nickname}</dd>
                        <dt>이름</dt><dd>{user.name}</dd>
                        <dt>성별</dt><dd>{lookupName('gender', user.gender) || '—'}</dd>
                        <dt>생년월일</dt><dd>{user.birth || '—'}</dd>
                        <dt>휴대폰</dt>
                        <dd>{user.phone ? <>{formatPhone(user.phone)}{user.phone_verified_at ? <span className={styles.muted}> · 인증 {toKst(user.phone_verified_at, 'YYYY-MM-DD HH:mm')}</span> : null}</> : user.state_id === MEMBER_STATE.LEAVE ? '—' : <Badge>미인증</Badge>}</dd>
                        <dt>가입 SNS</dt><dd>{snsText}</dd>
                        <dt>상태</dt><dd><Badge tone={memberStateTone(user.state_id)}>{lookupName('state_id', user.state_id)}</Badge></dd>
                        <dt>이용 제한 사유</dt><dd>{user.block_comment ?? '—'}</dd>
                        <dt>탈퇴 예정</dt><dd className={styles.mono}>{user.leave_reserved_at ?? '—'}</dd>
                        <dt>가입일시</dt><dd className={styles.mono}>{toKst(user.created_at, 'YYYY-MM-DD HH:mm')}</dd>
                    </dl>
                </Card>

                {/* ②③④ 이용 제한 · 해제 */}
                <UserStateCard user={user} onChanged={reload} />
            </div>

            {/* ① 예약 요약 — 결제 대기 만료는 세지 않는다 */}
            <Card title="예약 요약">
                <div className={styles.tiles}>
                    <div className={styles.tile}><span className={styles.muted}>전체</span><b className={styles.tileValue}>{user.reservation_summary.total}<small> 건</small></b></div>
                    <div className={styles.tile}><span className={styles.muted}>진행 중</span><b className={styles.tileValue}>{user.reservation_summary.in_progress}<small> 건</small></b><span className={styles.tileNote}>결제 대기 · 예약 확정 · 이용 중</span></div>
                    <div className={styles.tile}><span className={styles.muted}>이용 완료</span><b className={styles.tileValue}>{user.reservation_summary.completed}<small> 건</small></b></div>
                    <div className={styles.tile}><span className={styles.muted}>취소</span><b className={styles.tileValue}>{user.reservation_summary.canceled}<small> 건</small></b></div>
                </div>
                <p className={styles.muted}>결제 대기 만료는 세지 않습니다.</p>
            </Card>

            {/* ⑤⑥ 예약 이력 */}
            <UserReservationsCard userId={user.user_id} />
        </div>
    );
}
