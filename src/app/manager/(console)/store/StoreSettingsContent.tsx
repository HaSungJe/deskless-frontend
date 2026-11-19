'use client';
import { useContext, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { AUTH_ID } from '@/contracts/common/roles';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Tabs from '@/shared/components/ui/nav/Tabs';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { toKst } from '@/shared/utils/format';
import { isStoreSuspended, ManagerConsoleContext } from '../manager-console-context';
import StoreDoorTab from './_components/StoreDoorTab';
import StoreHoursTab from './_components/StoreHoursTab';
import StorePhotosTab from './_components/StorePhotosTab';
import StorePolicyTab from './_components/StorePolicyTab';
import StoreProfileTab from './_components/StoreProfileTab';
import StoreUnavailableTab from './_components/StoreUnavailableTab';
import { STORE_TABS, StoreTabType } from './store-settings-format';
import styles from '@/app/css/manager/StoreSettingsContent.module.css';

/** 저장 뒤 내 업체를 다시 읽지 못함 */
const RELOAD_FAILED_MESSAGE = '저장했지만 내 업체 정보를 다시 불러오지 못했어요. 잠시 뒤 다시 들어와 확인해 주세요.';

/**
 * M7 내 업체 설정 — 머리(상태 · 영업중 · 마지막 수정) · 영업중지 띠 · 탭 6개(문 연동은 업체 총관리자만)
 * - 내 업체 상세는 콘솔 틀이 읽은 값, 저장 뒤 reloadStore — 상단 바 · 대시보드도 같은 값을 본다
 *
 * @returns
 */
export default function StoreSettingsContent(): React.ReactNode {
    // 변수
    const {store, account, reloadStore} = useContext(ManagerConsoleContext); // 내 업체 · 계정 · 다시 읽기

    // 상태
    const [tab, setTab] = useState<StoreTabType>('profile');    // 지금 탭 — 화면 상태(사용자 결정)
    const [reloading, setReloading] = useState<boolean>(false); // 다시 불러오는 중

    // 계산 값
    const isHeadManager = account?.auth_id === AUTH_ID.HEAD_MANAGER;                  // ⑥ 문 연동 탭 — 업체 총관리자만(모르면 숨김)
    const tabs = STORE_TABS.filter((item) => item.value !== 'door' || isHeadManager); // 보일 탭
    const activeTab = tabs.some((item) => item.value === tab) ? tab : 'profile';      // 숨긴 탭이면 기본 정보
    const suspended = isStoreSuspended(store);                                        // 영업중지 — 띠 · 상태 배지 색

    // 함수
    async function onSaved(): Promise<void> {
        // 저장 뒤 — 내 업체를 다시 읽고, 못 읽으면 안내(리뷰 261118-5 #6 — 부르는 화면이 안내)
        const next = await reloadStore();
        if (!next) {
            showErrorPopup(RELOAD_FAILED_MESSAGE);
        }
    }

    async function retry(): Promise<void> {
        // 내 업체를 못 읽었을 때 다시 불러오기
        setReloading(true);
        await reloadStore();
        setReloading(false);
    }

    if (!store) {
        return (
            // 내 업체를 아직 · 못 읽음
            <EmptyState title="내 업체 정보를 불러오지 못했어요" description="잠시 뒤 다시 불러와 주세요." action={<Button size="sm" disabled={reloading} onClick={retry}>다시 불러오기</Button>} />
        );
    }

    return (
        // 내 업체 설정
        <div className={styles.page}>
            {/* ① 머리 — 상태 · 영업중 · 마지막 수정 */}
            <div>
                <h1 className={styles.title}>
                    내 업체 설정
                    <Badge tone={suspended ? 'danger' : 'ok'}>{lookupName('store_state_id', store.store_state_id)}</Badge>
                    <Badge tone={store.is_open === 1 ? 'primary' : 'neutral'}>{store.is_open === 1 ? '영업중' : '영업 안 함'}</Badge>
                </h1>
                <p className={styles.subtitle}>마지막 수정 {toKst(store.updated_at, 'YYYY-MM-DD HH:mm')}</p>
            </div>

            {/* ① 영업중지 띠 */}
            {suspended ? <Band tone="danger" title="영업중지된 업체입니다.">사유: {store.suspend_comment ?? '-'}</Band> : null}

            {/* 탭 — 화면 상태 */}
            <Tabs label="내 업체 설정" items={tabs} value={activeTab} onChange={setTab} />

            {/* 지금 탭 */}
            {activeTab === 'profile' ? <StoreProfileTab store={store} onSaved={onSaved} /> : null}
            {activeTab === 'photos' ? <StorePhotosTab store={store} onSaved={onSaved} /> : null}
            {activeTab === 'hours' ? <StoreHoursTab store={store} onSaved={onSaved} /> : null}
            {activeTab === 'policy' ? <StorePolicyTab store={store} onSaved={onSaved} /> : null}
            {activeTab === 'unavailable' ? <StoreUnavailableTab /> : null}
            {activeTab === 'door' ? <StoreDoorTab store={store} onSaved={onSaved} /> : null}
        </div>
    );
}
