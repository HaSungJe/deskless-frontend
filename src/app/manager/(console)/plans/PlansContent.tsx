'use client';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getRoomPlans } from '@/contracts/room/api';
import { RoomPlanListResultDto } from '@/contracts/room/dto/room-plan-list.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import PlanCard from './_components/PlanCard';
import styles from '@/app/css/manager/PlansContent.module.css';

/**
 * M6 상품 설정 — 상품 3개(시간 이용 · 1박 · 연박) 카드, 카드마다 저장
 * - 저장 뒤 다시 불러오면 카드 key(reloadKey)가 바뀌어 받은 값으로 다시 그린다. "저장했습니다."는 이 화면이 기억한다
 *
 * @returns
 */
export default function PlansContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                    // 매니저 토큰
    const loadPlans = useEffectEvent((signal: AbortSignal) => getRoomPlans(auth, signal)); // 그때의 auth 로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                    // 다시 불러오기(저장 뒤) — 카드 key 에도 쓴다
    const [result, setResult] = useState<RoomPlanListResultDto | null>(null); // ① 상품 3개
    const [failed, setFailed] = useState<boolean>(false);                     // 못 읽음
    const [savedType, setSavedType] = useState<string | null>(null);          // ④ 방금 저장한 상품 — "저장했습니다."

    // 효과
    useEffect(() => {
        // ① 상품 설정 3개(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadPlans(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult(next);
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
    }, [reloadKey]);

    // 함수
    function reload(): void {
        // 다시 불러오기
        setReloadKey((key) => key + 1);
    }

    function onSaved(type: string): void {
        // ④ 저장 뒤 — 그 카드에 "저장했습니다." · 3개 다시
        setSavedType(type);
        reload();
    }

    return (
        // 상품 설정
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <h1 className={styles.title}>상품 설정</h1>
                <p className={styles.subtitle}>업체 전체에 걸리는 상품별 판매 · 요일 · 시간 · 연장 설정입니다. 그룹마다 판매 여부와 요금은 객실 그룹에서 정합니다.</p>
            </div>

            {/* ① 안내 띠 */}
            <Band tone="info">연장 설정은 이용자가 연장할 때의 지금 설정을 따릅니다. 판매하지 않는 상품은 그룹 상품을 켜도 팔리지 않습니다.</Band>

            {/* 못 읽음 */}
            {failed && !result ? <EmptyState title="상품 설정을 불러오지 못했어요" description="잠시 뒤 다시 불러와 주세요." action={<Button size="sm" onClick={reload}>다시 불러오기</Button>} /> : null}

            {/* ② 카드 3개 */}
            <div className={styles.plans}>
                {result?.list.map((plan) => <PlanCard key={`${plan.room_plan_type_id}-${reloadKey}`} plan={plan} saved={savedType === plan.room_plan_type_id} onSaved={onSaved} />)}
            </div>
        </div>
    );
}
