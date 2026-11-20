'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { getManagerStaff } from '@/contracts/manager/api';
import { ManagerStaffDetailResultDto } from '@/contracts/manager/dto/manager-staff-detail.dto';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { MANAGER_AUTH_BADGE } from '../../../manager-auth';
import { isHeadManager, ManagerConsoleContext } from '../../manager-console-context';
import { HEAD_MANAGER_ONLY_TITLE, STAFF_LIST_PATH, STAFF_STATE_TONE } from '../staff-format';
import StaffAccountCard from './_components/StaffAccountCard';
import StaffInfoCard from './_components/StaffInfoCard';
import styles from '@/app/css/manager/StaffDetailContent.module.css';

type StaffDetailContentProps = {
    userId: string; // 주소의 회원 ID
};

/**
 * M8 업체 관리자 상세 — 머리(이름 · 권한 · 상태 · 비밀번호 변경 필요) · 계정 정보 수정 · 계정 관리. 업체 총관리자만
 * - 계정 정보 칸은 회원이 바뀔 때만(key) 받은 값으로 채운다 — 정지 · 초기화 뒤 다시 불러와도 고치던 칸이 남는다
 *
 * @param param0
 * @returns
 */
export default function StaffDetailContent({userId}: StaffDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                              // 매니저 토큰
    const {account, accountLoaded} = useContext(ManagerConsoleContext);                                // 로그인 때 기억한 계정 — 권한 · 다 읽었나
    const router = useRouter();                                                                        // 삭제 뒤 목록으로
    const loadStaff = useEffectEvent((signal: AbortSignal) => getManagerStaff(auth, userId, signal)); // 그때의 auth · 회원으로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                        // ④ 다시 불러오기
    const [staff, setStaff] = useState<ManagerStaffDetailResultDto | null>(null); // ① 상세
    const [failed, setFailed] = useState<boolean>(false);                         // ① 못 읽음

    // 계산 값
    const allowed = isHeadManager(account);                                  // ① 업체 총관리자만(모르면 막음)
    const badge = staff ? MANAGER_AUTH_BADGE.get(staff.auth_id) : undefined; // ② 권한 배지

    // 효과
    useEffect(() => {
        // ① 상세 — 업체 총관리자가 아니면 부르지 않는다(회원이 바뀌거나 다시 부를 때 · 떠나면 결과를 버린다)
        if (!allowed) {
            return;
        }

        const controller = new AbortController();
        loadStaff(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setStaff(next);
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
    }, [allowed, userId, reloadKey]);

    // 함수
    function reload(): void {
        // ④ 다시 불러오기
        setReloadKey((key) => key + 1);
    }

    if (!accountLoaded) {
        // ① 계정 쿠키를 읽는 중 — 권한을 아직 모른다(안내를 먼저 보이지 않는다)
        return null;
    }

    if (!allowed) {
        return (
            // ① 업체 총관리자만
            <EmptyState title={HEAD_MANAGER_ONLY_TITLE} />
        );
    }

    if (!staff) {
        return failed ? (
            // ① 못 읽음
            <EmptyState title="업체 관리자를 불러오지 못했어요" description="지워졌거나 잠시 연결이 안 됩니다." action={<Link href={STAFF_LIST_PATH} className={buttonClass({size: 'sm'})}>목록으로</Link>} />
        ) : null;
    }

    return (
        // 업체 관리자 상세
        <div className={styles.page}>
            {/* ② 머리 */}
            <div>
                <p className={styles.crumb}><Link href={STAFF_LIST_PATH}>업체 관리자</Link> › {staff.login_id}</p>
                <h1 className={styles.title}>
                    {staff.name}
                    {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}
                    <Badge tone={STAFF_STATE_TONE[staff.state_id] ?? 'neutral'}>{lookupName('state_id', staff.state_id)}</Badge>
                    {staff.is_password_change_required === 1 ? <Badge tone="warn">비밀번호 변경 필요</Badge> : null}
                </h1>
            </div>

            {/* ③ 계정 정보 · 계정 관리 */}
            <div className={styles.cols}>
                <StaffInfoCard key={staff.user_id} staff={staff} onSaved={reload} />
                <StaffAccountCard staff={staff} onChanged={reload} onDeleted={() => router.push(STAFF_LIST_PATH)} />
            </div>
        </div>
    );
}
