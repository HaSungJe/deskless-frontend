'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { MANAGER_AUTH_BADGE } from '@/app/manager/manager-auth';
import { lookupName } from '@/contracts/common/lookup';
import { memberStateTone } from '@/contracts/common/member.constants';
import { STORE_STATE } from '@/contracts/common/store.constants';
import { getManagerAccount } from '@/contracts/manager/api';
import { ManagerAccountDetailResultDto } from '@/contracts/manager/dto/manager-account-detail.dto';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone, toKst } from '@/shared/utils/format';
import { MANAGER_LIST_PATH, storePath } from '../../admin-paths';
import { STORE_STATE_TONE } from '../../stores/store-format';
import { managerAuthTone } from '../manager-format';
import ManagerPasswordCard from './_components/ManagerPasswordCard';
import styles from '@/app/css/admin/AdminDetail.module.css';

type AdminManagerDetailContentProps = {
    userId: string; // 주소의 업체 관리자 회원 ID
};

/**
 * A5 업체 관리자 상세 — 계정 정보(보기만) · 비밀번호 초기화
 * - 초기화 카드는 key 없이 둔다 — 초기화 뒤 상세를 다시 읽어도 보낸 안내 띠가 남는다(새 값이 올 때까지 이전 상세를 그린다)
 *
 * @param param0
 * @returns
 */
export default function AdminManagerDetailContent({userId}: AdminManagerDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                               // 관리자 토큰
    const loadAccount = useEffectEvent((signal: AbortSignal) => getManagerAccount(auth, userId, signal)); // 그때의 auth · 계정으로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                               // ④ 다시 읽기
    const [account, setAccount] = useState<ManagerAccountDetailResultDto | null>(null); // ① 상세
    const [failed, setFailed] = useState<boolean>(false);                                // ① 못 읽음

    // 계산 값
    const authBadge = account ? MANAGER_AUTH_BADGE.get(account.auth_id) : undefined; // 권한 설명 — "업체 관리자"

    // 효과
    useEffect(() => {
        // ① 상세(계정이 바뀌거나 다시 읽을 때 · 떠나면 결과를 버린다)
        const controller = new AbortController();
        loadAccount(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setAccount(next);
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
        // ④ 상세 다시
        setReloadKey((key) => key + 1);
    }

    if (!account) {
        return failed ? (
            // ① 못 읽음
            <EmptyState title="업체 관리자를 불러오지 못했어요" description="없는 계정이거나 잠시 연결이 안 됩니다." action={<Link href={MANAGER_LIST_PATH} className={buttonClass({size: 'sm'})}>업체 관리자 목록</Link>} />
        ) : null;
    }

    return (
        // 업체 관리자 상세
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <p className={styles.crumb}><Link href={MANAGER_LIST_PATH}>업체 관리자 목록</Link></p>
                <h1 className={styles.title}>{account.name}<Badge tone={managerAuthTone(account.auth_id)}>{lookupName('auth_id', account.auth_id)}</Badge><Badge tone={memberStateTone(account.state_id)}>{lookupName('state_id', account.state_id)}</Badge></h1>
                <p className={styles.sub}>아이디 {account.login_id} · {account.store_name}</p>
            </div>

            <div className={styles.cols}>
                {/* ① 계정 정보 */}
                <Card title="계정 정보">
                    <div className={styles.cardBody}>
                        <dl className={styles.dl}>
                            <dt>업체</dt>
                            <dd><span className={styles.inline}><Link href={storePath(account.store_id)}>{account.store_name}</Link><Badge tone={STORE_STATE_TONE[account.store_state_id] ?? 'neutral'}>{lookupName('store_state_id', account.store_state_id)}</Badge></span></dd>
                            <dt>아이디</dt><dd className={styles.mono}>{account.login_id}</dd>
                            <dt>이름</dt><dd>{account.name}</dd>
                            <dt>휴대폰</dt><dd>{account.phone ? formatPhone(account.phone) : '—'}</dd>
                            <dt>성별</dt><dd>{lookupName('gender', account.gender) || '—'}</dd>
                            <dt>생년월일</dt><dd>{account.birth || '—'}</dd>
                            <dt>권한</dt><dd>{lookupName('auth_id', account.auth_id)}{authBadge ? `(${authBadge.label})` : ''}</dd>
                            <dt>상태</dt><dd><Badge tone={memberStateTone(account.state_id)}>{lookupName('state_id', account.state_id)}</Badge></dd>
                            <dt>정지 사유</dt><dd>{account.block_comment ?? '—'}</dd>
                            <dt>비밀번호 변경 필요</dt><dd>{account.is_password_change_required === 1 ? <span className={styles.inline}>예<Badge tone="warn">임시 비밀번호</Badge></span> : '아니오'}</dd>
                            <dt>등록일시</dt><dd className={styles.mono}>{toKst(account.created_at, 'YYYY-MM-DD HH:mm')}</dd>
                        </dl>
                        {account.store_state_id === STORE_STATE.LEAVE ? <p className={styles.muted}>탈퇴한 업체의 계정입니다.</p> : null}
                    </div>
                </Card>

                {/* ②③④ 비밀번호 초기화 */}
                <ManagerPasswordCard account={account} onReset={reload} />
            </div>
        </div>
    );
}
