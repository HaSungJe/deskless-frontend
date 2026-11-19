'use client';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { createMyUnavailablePeriod, deleteMyUnavailablePeriod, getMyUnavailablePeriods } from '@/contracts/store/api';
import { StoreMineUnavailablePeriodListDto, StoreMineUnavailablePeriodListResultDto } from '@/contracts/store/dto/store-mine-unavailable-period-list.dto';
import { StoreMineUnavailablePeriodDto } from '@/contracts/store/dto/store-mine-unavailable-period.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { toPeriodText } from '../store-settings-format';
import styles from '@/app/css/manager/StoreUnavailableTab.module.css';

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 메모 최대 글자 수 — StoreMineUnavailablePeriodDto */
const MEMO_MAX = 30;

/**
 * 일시 예약불가 탭 — 끝나지 않은 기간 목록(시작 순) · 추가 · 삭제
 * - 목록은 이 탭만 쓰므로 탭이 직접 불러온다(내 예약 목록과 같은 쪽 · 효과 모양)
 *
 * @returns
 */
export default function StoreUnavailableTab(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                                                                              // 매니저 토큰
    const loadPage = useEffectEvent((page: number, signal: AbortSignal) => getMyUnavailablePeriods(auth, new StoreMineUnavailablePeriodListDto({page, size: PAGE_SIZE}), signal)); // 그때의 auth 로

    // 상태
    const [page, setPage] = useState<number>(1);                                                // 보는 쪽
    const [reloadKey, setReloadKey] = useState<number>(0);                                      // 다시 불러오기(추가 · 삭제 뒤)
    const [result, setResult] = useState<StoreMineUnavailablePeriodListResultDto | null>(null); // ① 목록
    const [startsAt, setStartsAt] = useState<string>('');                                       // ② 시작 일시(달력 칸)
    const [endsAt, setEndsAt] = useState<string>('');                                           // ② 종료 일시(달력 칸)
    const [memo, setMemo] = useState<string>('');                                               // ② 메모
    const [busy, setBusy] = useState<boolean>(false);                                           // 추가 · 삭제 중
    const [deleting, setDeleting] = useState<string | null>(null);                              // 지울 기간 ID — 확인 창

    // 효과
    useEffect(() => {
        // ① 그 쪽 목록(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadPage(page, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult(next);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [page, reloadKey]);

    // 함수
    function reloadFirstPage(): void {
        // ④ 1쪽 다시
        setPage(1);
        setReloadKey((key) => key + 1);
    }

    async function add(): Promise<void> {
        // ② 일시를 "날짜 시각" 모양으로 바꿔 검사 → 등록(큐) → ④ 칸 비우고 1쪽 다시
        const dto = Object.assign(new StoreMineUnavailablePeriodDto(), {starts_at: toPeriodText(startsAt), ends_at: toPeriodText(endsAt), memo: memo.trim() || undefined});
        if (busy || !(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await createMyUnavailablePeriod(auth, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        setStartsAt('');
        setEndsAt('');
        setMemo('');
        reloadFirstPage();
    }

    async function confirmDelete(): Promise<void> {
        // ③ 확인 뒤 삭제(큐) → ④ 1쪽 다시
        const target = deleting;
        if (!target) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteMyUnavailablePeriod(auth, target);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setDeleting(null);
        if (failure) {
            handleApiError(failure.error);
        }
        reloadFirstPage();
    }

    return (
        // 일시 예약불가
        <div className={styles.tab}>
            {/* ② 추가 */}
            <Card title="일시 예약불가 추가">
                <p className={styles.hint}>이 기간에는 업체 전체가 예약을 받지 않습니다. 종료 일시부터 다시 받습니다.</p>
                <div className={styles.form}>
                    <Field label="시작 일시" name="starts_at" htmlFor="unavailable-start"><Input id="unavailable-start" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></Field>
                    <Field label="종료 일시" name="ends_at" htmlFor="unavailable-end"><Input id="unavailable-end" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></Field>
                    <Field label="메모(선택 · 30자)" name="memo" htmlFor="unavailable-memo"><Input id="unavailable-memo" maxLength={MEMO_MAX} value={memo} onChange={(event) => setMemo(event.target.value)} /></Field>
                    <Button variant="primary" disabled={busy} onClick={add}>추가</Button>
                </div>
            </Card>

            {/* ① 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="예정된 일시 예약불가가 없습니다." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">시작</th><th scope="col">종료</th><th scope="col">메모</th><th scope="col">등록일</th><th scope="col">작업</th></tr></thead>
                    <tbody>
                        {result.list.map((item) => (
                            <tr key={item.store_unavailable_period_id}>
                                <td className={styles.number}>{toKst(item.starts_at, 'YYYY-MM-DD HH:mm')}</td>
                                <td className={styles.number}>{toKst(item.ends_at, 'YYYY-MM-DD HH:mm')}</td>
                                <td>{item.memo ?? '-'}</td>
                                <td className={`${styles.number} ${styles.muted}`}>{toKst(item.created_at, 'YYYY-MM-DD')}</td>
                                <td><Button size="sm" variant="danger" disabled={busy} onClick={() => setDeleting(item.store_unavailable_period_id)}>삭제</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="일시 예약불가 페이지" />

            {/* ③ 삭제 확인 */}
            <ConfirmModal open={deleting !== null} title="일시 예약불가 지우기" message="이 기간을 지울까요? 지우면 그 기간에도 예약을 받습니다." confirmLabel="지우기" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </div>
    );
}
