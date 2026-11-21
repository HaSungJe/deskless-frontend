'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { storeConsoleLoginUrl } from '@/app/manager/manager-auth';
import { lookupName } from '@/contracts/common/lookup';
import { STORE_STATE } from '@/contracts/common/store.constants';
import { getStore } from '@/contracts/store/api';
import { StoreDetailResultDto } from '@/contracts/store/dto/store-detail.dto';
import { handleApiError } from '@/shared/api/error';
import { buttonClass } from '@/shared/components/ui/button/Button';
import CopyButton from '@/shared/components/ui/button/CopyButton';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { STORE_LIST_PATH, storeManagersPath } from '../../admin-paths';
import StoreFilesCard from '../../_components/StoreFilesCard';
import { OPEN_BADGE, STORE_STATE_TONE } from '../store-format';
import StoreInfoCard from './_components/StoreInfoCard';
import StoreOpenCard from './_components/StoreOpenCard';
import StoreStateCard from './_components/StoreStateCard';
import styles from '@/app/css/admin/AdminDetail.module.css';

type AdminStoreDetailContentProps = {
    storeId: string; // 주소의 업체 ID
};

/**
 * A4 업체 상세 — 머리(등록 · 수정일, 로그인 주소 복사 · 업체 관리자로) · 정보 수정 · 상태 · 영업중 · 운영 규정 · 업체 정보 파일
 * - 업체코드 · 로그인 주소 글자는 보이지 않는다 — 주소는 복사 버튼으로만(사용자 2026-11-22)
 * - 배치: 정보(넓게) · 상태 + 영업중(좁게), 아래 운영 규정 · 파일은 같은 높이
 * - 칸 카드는 다시 읽어도 고치던 칸이 남게 key 로 다시 만든다 — 정보 칸은 업체가 바뀔 때만, 상태 칸은 상태가 바뀔 때도(고른 값 · 사유를 비운다)
 *
 * @param param0
 * @returns
 */
export default function AdminStoreDetailContent({storeId}: AdminStoreDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                      // 관리자 토큰
    const loadStore = useEffectEvent((signal: AbortSignal) => getStore(auth, storeId, signal)); // 그때의 auth · 업체로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                  // ③④⑤ 다시 읽기
    const [store, setStore] = useState<StoreDetailResultDto | null>(null); // ① 상세
    const [failed, setFailed] = useState<boolean>(false);                   // ① 못 읽음

    // 계산 값
    const locked = store?.store_state_id === STORE_STATE.LEAVE;           // ① 탈퇴 — 모든 칸 · 버튼 잠금
    const loginUrl = store ? storeConsoleLoginUrl(store.store_code) : ''; // 업체 콘솔 로그인 주소
    const open = OPEN_BADGE[store?.is_open === 1 ? 'open' : 'closed'];    // 영업중 배지

    // 효과
    useEffect(() => {
        // ① 상세(업체가 바뀌거나 다시 읽을 때 · 떠나면 결과를 버린다) — 사업자등록증 열람 주소도 이때 새로
        const controller = new AbortController();
        loadStore(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setStore(next);
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
    }, [storeId, reloadKey]);

    // 함수
    function reload(): void {
        // ③④⑤ 상세 다시
        setReloadKey((key) => key + 1);
    }

    if (!store) {
        return failed ? (
            // ① 못 읽음
            <EmptyState title="업체를 불러오지 못했어요" description="없는 업체이거나 잠시 연결이 안 됩니다." action={<Link href={STORE_LIST_PATH} className={buttonClass({size: 'sm'})}>업체 목록</Link>} />
        ) : null;
    }

    return (
        // 업체 상세
        <div className={styles.page}>
            {/* 머리 — 이름 · 배지 · 등록 · 수정일, 오른쪽 로그인 주소 복사 · ⑥ 업체 관리자로 */}
            <div className={styles.head}>
                <div>
                    <p className={styles.crumb}><Link href={STORE_LIST_PATH}>업체 목록</Link></p>
                    <h1 className={styles.title}>{store.store_name}<Badge tone={STORE_STATE_TONE[store.store_state_id] ?? 'neutral'}>{lookupName('store_state_id', store.store_state_id)}</Badge><Badge tone={open.tone}>{open.label}</Badge></h1>
                    <dl className={styles.meta}>
                        <div><dt>등록일</dt><dd>{toKst(store.created_at, 'YYYY-MM-DD HH:mm')}</dd></div>
                        <div><dt>수정일</dt><dd>{toKst(store.updated_at, 'YYYY-MM-DD HH:mm')}</dd></div>
                    </dl>
                </div>
                <div className={styles.actions}>
                    <CopyButton text={loginUrl} label="로그인 주소 복사" />
                    <Link href={storeManagersPath(store.store_id)} className={buttonClass({})}>이 업체의 업체 관리자</Link>
                </div>
            </div>

            {/* 영업중지 사유 · ① 탈퇴 잠금 */}
            {store.store_state_id === STORE_STATE.SUSPEND && store.suspend_comment ? <Band tone="danger" title="영업중지 사유">{store.suspend_comment}</Band> : null}
            {locked ? <Band tone="warn">탈퇴한 업체는 바꿀 수 없습니다.</Band> : null}

            {/* ②③ 정보(넓게) · ④ 상태 · ⑤ 영업중(좁게) */}
            <div className={styles.cols}>
                <div className={styles.colWide}>
                    <StoreInfoCard key={store.store_id} store={store} locked={locked} onSaved={reload} />
                </div>
                <div className={`${styles.colNarrow} ${styles.stack}`}>
                    <StoreStateCard key={`${store.store_id}-${store.store_state_id}`} store={store} locked={locked} onChanged={reload} />
                    <StoreOpenCard store={store} locked={locked} onChanged={reload} />
                </div>
            </div>

            {/* 운영 규정(보기만) · 업체 정보 파일 — 같은 높이 */}
            <div className={`${styles.cols} ${styles.even}`}>
                <Card title="운영 규정">
                    <p className={styles.muted}>업체 관리자가 내 업체 설정에서 바꿉니다. 여기서는 읽기만.</p>
                    <dl className={styles.dl}>
                        <dt>24시간 연중무휴</dt><dd>{store.is_always_open === 1 ? '예' : '아니오 (요일별 영업시간을 씀)'}</dd>
                        <dt>정비시간</dt><dd>{store.maintenance_minutes}분</dd>
                        <dt>예약 가능 시작</dt><dd>이용 시작 {store.booking_open_hours}시간 전부터</dd>
                        <dt>100% 환불 마감</dt><dd>이용 시작 {store.refund_deadline_minutes}분 전까지</dd>
                        <dt>마감 뒤 환불 비율</dt><dd>{store.late_refund_percent}%</dd>
                        <dt>업체 소개</dt><dd>{store.introduction ?? '—'}</dd>
                    </dl>
                </Card>
                <StoreFilesCard files={store.files} markFirst />
            </div>
        </div>
    );
}
