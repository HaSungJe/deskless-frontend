'use client';
import { useContext, useState } from 'react';
import { updateMyStoreBreaks, updateMyStoreHours } from '@/contracts/store/api';
import { StoreMineBreakDto, StoreMineBreaksDto } from '@/contracts/store/dto/store-mine-breaks.dto';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Card from '@/shared/components/ui/display/Card';
import Table from '@/shared/components/ui/display/Table';
import FieldError from '@/shared/components/ui/form/FieldError';
import Input from '@/shared/components/ui/form/Input';
import Switch from '@/shared/components/ui/form/Switch';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { validateActionRows } from '@/shared/utils/validation';
import { BREAK_MAX, BreakRowType, DAY_NAMES, HourRowType, hourRowsOf, overnightLabel, toHoursDto } from '../store-settings-format';
import styles from '@/app/css/manager/StoreHoursTab.module.css';

type StoreHoursTabProps = {
    store: StoreMineResultDto;    // 내 업체 상세 — is_always_open · hours · breaks
    onSaved: () => Promise<void>; // 저장 뒤 다시 읽기
};

/**
 * 영업시간 · 브레이크 탭 — 둘 다 통째로 저장(보낸 목록이 전부)
 * - 표 · 줄의 칸 오류 이름은 백엔드 점 경로(hours.3.close_time · breaks.1.end_time) — 화면 검사와 큐 failed 의 validation_errors 가 같은 칸에 붙는다
 *
 * @param param0
 * @returns
 */
export default function StoreHoursTab({store, onSaved}: StoreHoursTabProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [alwaysOpen, setAlwaysOpen] = useState<boolean>(store.is_always_open === 1);                                                                    // ① 24시간 연중무휴
    const [hours, setHours] = useState<Array<HourRowType>>(() => hourRowsOf(store.hours));                                                                 // ① 일 ~ 토 7줄
    const [breaks, setBreaks] = useState<Array<BreakRowType>>(() => store.breaks.map((item) => ({start_time: item.start_time, end_time: item.end_time}))); // ③ 브레이크 줄
    const [saving, setSaving] = useState<'hours' | 'breaks' | null>(null);                                                                                 // 저장 중인 카드

    // 함수
    function changeHour(index: number, patch: Partial<HourRowType>): void {
        // 한 요일 줄 고치기
        setHours((rows) => rows.map((row, at) => (at === index ? {...row, ...patch} : row)));
    }

    function changeBreak(index: number, patch: Partial<BreakRowType>): void {
        // 한 브레이크 줄 고치기
        setBreaks((rows) => rows.map((row, at) => (at === index ? {...row, ...patch} : row)));
    }

    async function saveHours(): Promise<void> {
        // ② 휴무가 아닌 요일 시각 검사(그 요일 칸 아래) → 영업시간 통째로 저장(큐) → 다시 읽기
        const dto = toHoursDto(alwaysOpen, hours);
        if (saving || !(await validateActionRows(dto.hours, 'hours'))) {
            return;
        }

        setSaving('hours');
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateMyStoreHours(auth, dto);
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setSaving(null);
            handleApiError(failure.error);
            return;
        }

        await onSaved();
        setSaving(null);
    }

    async function saveBreaks(): Promise<void> {
        // ④ 줄 검사(칸 아래) → 브레이크 통째로 저장(큐 — 빈 목록이면 모두 지움) → 다시 읽기
        const rows = breaks.map((row) => Object.assign(new StoreMineBreakDto(), row));
        if (saving || !(await validateActionRows(rows, 'breaks'))) {
            return;
        }

        setSaving('breaks');
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateMyStoreBreaks(auth, Object.assign(new StoreMineBreaksDto(), {breaks: rows}));
        } catch (error) {
            failure = {error};
        }

        if (failure) {
            setSaving(null);
            handleApiError(failure.error);
            return;
        }

        await onSaved();
        setSaving(null);
    }

    return (
        // 영업시간 · 브레이크
        <div className={styles.cols}>
            {/* ①② 영업시간 */}
            <Card title="영업시간" actions={<Switch label="24시간 연중무휴" checked={alwaysOpen} onChange={setAlwaysOpen} />}>
                {alwaysOpen ? <p className={styles.alwaysOpen}>24시간 연중무휴로 영업합니다.</p> : (
                    <Table>
                        <thead><tr><th scope="col">요일</th><th scope="col">휴무</th><th scope="col">여는 시각</th><th scope="col">닫는 시각</th><th scope="col"><span className={styles.srOnly}>안내</span></th></tr></thead>
                        <tbody>
                            {hours.map((row, index) => (
                                <tr key={row.day_of_week}>
                                    <th scope="row">{DAY_NAMES[row.day_of_week]}</th>
                                    <td><Switch label={`${DAY_NAMES[row.day_of_week]}요일 휴무`} checked={row.is_closed} onChange={(checked) => changeHour(index, {is_closed: checked})} /></td>
                                    <td>
                                        <Input type="time" className={styles.time} aria-label={`${DAY_NAMES[row.day_of_week]}요일 여는 시각`} disabled={row.is_closed} value={row.open_time} onChange={(event) => changeHour(index, {open_time: event.target.value})} />
                                        <FieldError name={`hours.${index}.open_time`} />
                                    </td>
                                    <td>
                                        <Input type="time" className={styles.time} aria-label={`${DAY_NAMES[row.day_of_week]}요일 닫는 시각`} disabled={row.is_closed} value={row.close_time} onChange={(event) => changeHour(index, {close_time: event.target.value})} />
                                        <FieldError name={`hours.${index}.close_time`} />
                                    </td>
                                    <td className={styles.muted}>{row.is_closed ? <Badge>휴무</Badge> : overnightLabel(row.open_time, row.close_time)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
                <div className={styles.footer}>
                    <span className={styles.hint}>7요일을 통째로 저장합니다. 24시간을 켜면 요일 표를 숨기고 빈 목록으로 보냅니다.</span>
                    <Button variant="primary" disabled={saving !== null} onClick={saveHours}>{saving === 'hours' ? '처리 중…' : '영업시간 저장'}</Button>
                </div>
            </Card>

            {/* ③④ 브레이크타임 */}
            <Card title={`브레이크타임 ${breaks.length} / ${BREAK_MAX}`}>
                <p className={styles.hint}>매일 같은 시각에 예약을 받지 않습니다. 서로 겹치면 안 되고(끝점이 맞닿는 것은 됩니다), 마감이 시작보다 이르면 다음 날까지입니다.</p>
                <div className={styles.breaks}>
                    {breaks.map((row, index) => (
                        <div key={`break-${index}`} className={styles.breakRow}>
                            <div><Input type="time" className={styles.time} aria-label={`브레이크 ${index + 1} 시작 시각`} value={row.start_time} onChange={(event) => changeBreak(index, {start_time: event.target.value})} /><FieldError name={`breaks.${index}.start_time`} /></div>
                            <span className={styles.muted}>~</span>
                            <div><Input type="time" className={styles.time} aria-label={`브레이크 ${index + 1} 마감 시각`} value={row.end_time} onChange={(event) => changeBreak(index, {end_time: event.target.value})} /><FieldError name={`breaks.${index}.end_time`} /></div>
                            <span className={styles.muted}>{overnightLabel(row.start_time, row.end_time)}</span>
                            <Button size="sm" variant="danger" icon aria-label={`브레이크 ${index + 1} 삭제`} onClick={() => setBreaks((rows) => rows.filter((_, at) => at !== index))}>×</Button>
                        </div>
                    ))}
                </div>
                <div className={styles.footer}>
                    <Button disabled={breaks.length >= BREAK_MAX} onClick={() => setBreaks((rows) => [...rows, {start_time: '', end_time: ''}])}>브레이크 추가</Button>
                    <Button variant="primary" disabled={saving !== null} onClick={saveBreaks}>{saving === 'breaks' ? '처리 중…' : '브레이크 저장'}</Button>
                </div>
            </Card>
        </div>
    );
}
