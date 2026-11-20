'use client';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { createRoomGroupPlanPrice, deleteRoomGroupPlanPrice, getRoomGroupPlanPrices, updateRoomGroupPlanPrice } from '@/contracts/room/api';
import { RoomGroupDetailPlanResultDto } from '@/contracts/room/dto/room-group-detail.dto';
import { RoomGroupPlanPriceItemResultDto, RoomGroupPlanPriceListDto, RoomGroupPlanPriceListResultDto } from '@/contracts/room/dto/room-group-plan-price-list.dto';
import { RoomGroupPlanPriceUpdateDto } from '@/contracts/room/dto/room-group-plan-price-update.dto';
import { RoomGroupPlanPriceDto } from '@/contracts/room/dto/room-group-plan-price.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Segmented from '@/shared/components/ui/form/Segmented';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import Modal from '@/shared/components/ui/modal/Modal';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPrice } from '@/shared/utils/format';
import { numberOf } from '@/shared/utils/util';
import { resetValidationError, validateActionChildren } from '@/shared/utils/validation';
import styles from '@/app/css/manager/RoomGroupPrices.module.css';

type RoomGroupPricesProps = {
    roomGroupId: string;                        // 그룹 ID
    plans: Array<RoomGroupDetailPlanResultDto>; // 그룹 상품 — 상품 이름 · 기본 요금
    type: string;                               // 고른 상품
    onTypeChange: (type: string) => void;       // ① 상품 고르기
    onChanged: () => void;                      // ⑤ 상세 다시(기간 가격 개수)
};

/** 기간 가격 대화상자 칸 */
type PriceFormType = {
    start_date: string; // 시작 날짜(YYYY-MM-DD)
    end_date: string;   // 종료 날짜
    price: string;      // 요금 칸 글자
    memo: string;       // 메모
};

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 메모 최대 글자 수 — RoomGroupPlanPriceDto */
const MEMO_MAX = 30;

/** 대화상자 칸 오류 키 — 그룹 상품 줄의 price 와 나눈다 */
const PRICE_FORM_KEY = 'plan_price';

/** 빈 대화상자 칸 */
const EMPTY_PRICE_FORM: PriceFormType = {start_date: '', end_date: '', price: '', memo: ''};

/**
 * 상품별 기간 가격 — 상품 고르기 · 목록(시작 날짜 순) · 추가 / 수정 대화상자 · 삭제
 * - 상품은 부모가 정한다(key 에 상품 — 바꾸면 1쪽부터 새로 그린다)
 *
 * @param param0
 * @returns
 */
export default function RoomGroupPrices({roomGroupId, plans, type, onTypeChange, onChanged}: RoomGroupPricesProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                                                                                    // 매니저 토큰
    const loadPage = useEffectEvent((page: number, signal: AbortSignal) => getRoomGroupPlanPrices(auth, roomGroupId, type, new RoomGroupPlanPriceListDto({page, size: PAGE_SIZE}), signal)); // 그때의 auth · 상품으로

    // 상태
    const [page, setPage] = useState<number>(1);                                                  // 보는 쪽
    const [reloadKey, setReloadKey] = useState<number>(0);                                        // ⑤ 목록 다시
    const [result, setResult] = useState<RoomGroupPlanPriceListResultDto | null>(null);           // ① 목록
    const [editing, setEditing] = useState<RoomGroupPlanPriceItemResultDto | 'new' | null>(null); // ② 대화상자 — 추가 · 고칠 줄 · 닫힘
    const [form, setForm] = useState<PriceFormType>(EMPTY_PRICE_FORM);                           // ② 대화상자 칸
    const [busy, setBusy] = useState<boolean>(false);                                             // 저장 · 삭제 중
    const [deleting, setDeleting] = useState<string | null>(null);                                // ④ 지울 기간 가격 ID — 확인 창

    // 계산 값
    const plan = plans.find((item) => item.room_plan_type_id === type) ?? null;                              // 고른 상품 — 이름 · 기본 요금
    const planName = plan?.room_plan_type_name ?? '';                                                        // 상품 이름
    const options = plans.map((item) => ({value: item.room_plan_type_id, label: item.room_plan_type_name})); // ① 상품 고르기
    const isEdit = editing !== null && editing !== 'new';                                                    // 수정 대화상자

    // 효과
    useEffect(() => {
        // ① 그 상품 · 그 쪽 목록(떠나면 결과를 버린다)
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
    function openCreate(): void {
        // ② 빈 칸으로 추가
        setForm(EMPTY_PRICE_FORM);
        setEditing('new');
    }

    function openEdit(item: RoomGroupPlanPriceItemResultDto): void {
        // ② 그 줄 값으로 수정
        setForm({start_date: item.start_date, end_date: item.end_date, price: String(item.price), memo: item.memo ?? ''});
        setEditing(item);
    }

    function change(patch: Partial<PriceFormType>): void {
        // 대화상자 칸 바꿈
        setForm((prev) => ({...prev, ...patch}));
    }

    function changed(): void {
        // ⑤ 목록 · 상세 다시
        setReloadKey((key) => key + 1);
        onChanged();
    }

    async function save(): Promise<void> {
        // ③ 검사(대화상자 키) → 등록 · 수정(큐 — 통째로) → ⑤ 닫고 목록 · 상세 다시
        const target = editing;
        if (busy || target === null) {
            return;
        }

        const body = {start_date: form.start_date, end_date: form.end_date, price: numberOf(form.price), memo: form.memo.trim()};
        const dto = target === 'new' ? Object.assign(new RoomGroupPlanPriceDto(), body) : Object.assign(new RoomGroupPlanPriceUpdateDto(), body);
        resetValidationError();
        if (!(await validateActionChildren(dto, PRICE_FORM_KEY))) {
            return;
        }

        const send = target === 'new'
            ? () => createRoomGroupPlanPrice(auth, roomGroupId, type, dto)
            : () => updateRoomGroupPlanPrice(auth, roomGroupId, type, target.room_group_plan_price_id, dto); // try 안에 갈래를 두지 않는다
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await send();
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error, true, PRICE_FORM_KEY); // 날짜 겹침 · 종료가 빠름 — 대화상자 칸 옆
            return;
        }

        setEditing(null);
        changed();
    }

    async function confirmDelete(): Promise<void> {
        // ④ 확인 뒤 삭제(큐) → ⑤ 목록 · 상세 다시
        const target = deleting;
        if (!target) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteRoomGroupPlanPrice(auth, roomGroupId, type, target);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setDeleting(null);
        if (failure) {
            handleApiError(failure.error);
        }
        changed();
    }

    return (
        // 상품별 기간 가격
        <Card title="상품별 기간 가격" actions={<Button size="sm" variant="primary" onClick={openCreate}>기간 가격 추가</Button>}>
            <div className={styles.section}>
                {/* ① 상품 고르기 */}
                <Segmented label="상품" options={options} value={type} onChange={onTypeChange} />

                {/* ① 목록 */}
                {result && result.list.length === 0 ? <EmptyState title="기간 가격이 없습니다." /> : null}
                {result && result.list.length > 0 ? (
                    <Table>
                        <thead><tr><th scope="col">기간</th><th scope="col">요금</th><th scope="col">메모</th><th scope="col"><span className={styles.srOnly}>작업</span></th></tr></thead>
                        <tbody>
                            {result.list.map((item) => (
                                <tr key={item.room_group_plan_price_id}>
                                    <td className={styles.number}>{item.start_date} ~ {item.end_date}</td>
                                    <td className={styles.number}>{formatPrice(item.price)}</td>
                                    <td>{item.memo ?? '-'}</td>
                                    <td><div className={styles.acts}><Button size="sm" onClick={() => openEdit(item)}>수정</Button><Button size="sm" variant="danger" disabled={busy} onClick={() => setDeleting(item.room_group_plan_price_id)}>삭제</Button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : null}
                <Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="기간 가격 페이지" />
                {plan ? <p className={styles.hint}>시작 · 종료 날짜 모두 포함. 이 기간에는 기본 요금({planName} {formatPrice(plan.price)}) 대신 이 요금으로 팝니다.</p> : null}
            </div>

            {/* ②③ 추가 · 수정 */}
            <Modal open={editing !== null} title={`기간 가격 ${isEdit ? '수정' : '추가'} — ${planName}`} onClose={() => setEditing(null)} footer={<><Button onClick={() => setEditing(null)}>취소</Button><Button variant="primary" disabled={busy} onClick={save}>{busy ? '처리 중…' : isEdit ? '저장' : '추가'}</Button></>}>
                <div className={styles.form}>
                    <div className={styles.dates}>
                        <Field label="시작 날짜" name="start_date" dataKey={PRICE_FORM_KEY} htmlFor="price-start"><Input id="price-start" type="date" value={form.start_date} onChange={(event) => change({start_date: event.target.value})} /></Field>
                        <Field label="종료 날짜" name="end_date" dataKey={PRICE_FORM_KEY} htmlFor="price-end"><Input id="price-end" type="date" value={form.end_date} onChange={(event) => change({end_date: event.target.value})} /></Field>
                    </div>
                    <Field label="요금" name="price" dataKey={PRICE_FORM_KEY} htmlFor="price-price" hint="1 ~ 10,000,000원">
                        <div className={styles.unit}><Input id="price-price" type="number" min={1} value={form.price} onChange={(event) => change({price: event.target.value})} /><span>원</span></div>
                    </Field>
                    <Field label="메모(선택)" name="memo" dataKey={PRICE_FORM_KEY} htmlFor="price-memo" hint={`${form.memo.length} / ${MEMO_MAX}`}>
                        <Input id="price-memo" maxLength={MEMO_MAX} value={form.memo} onChange={(event) => change({memo: event.target.value})} />
                    </Field>
                    <p className={styles.hint}>시작 · 종료 날짜 모두 포함, 종료 날짜는 시작과 같거나 늦어야 합니다.</p>
                </div>
            </Modal>

            {/* ④ 삭제 확인 */}
            <ConfirmModal open={deleting !== null} title="기간 가격 지우기" message="이 기간 가격을 지울까요? 그 기간에는 기본 요금으로 팝니다." confirmLabel="지우기" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </Card>
    );
}
