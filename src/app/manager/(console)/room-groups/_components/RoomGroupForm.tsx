import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Switch from '@/shared/components/ui/form/Switch';
import Textarea from '@/shared/components/ui/form/Textarea';
import { ROOM_GROUP_DETAIL_KEY, RoomGroupFormType } from '../room-group-format';
import styles from '@/app/css/manager/RoomGroupForm.module.css';

type RoomGroupFormProps = {
    idPrefix: string;                                      // 칸 id 앞(등록 대화상자 · 상세 카드)
    form: RoomGroupFormType;                               // 칸 값
    onChange: (patch: Partial<RoomGroupFormType>) => void; // 칸 바꿈
};

/** 그룹명 최대 글자 수 — RoomGroupDto */
const NAME_MAX = 100;

/** 설명 최대 글자 수 — RoomGroupDto */
const DESCRIPTION_MAX = 2000;

/**
 * 객실 그룹 칸 — 그룹명 · 방 개수 · 설명 · 편의시설(샤워실 · TV · PC). 목록의 등록 대화상자와 상세의 기본 정보 카드가 함께 쓴다
 * - 방 개수는 안쪽 DTO(room_group_detail)라 오류 키를 붙인다
 *
 * @param param0
 * @returns
 */
export default function RoomGroupForm({idPrefix, form, onChange}: RoomGroupFormProps): React.ReactNode {
    return (
        // 그룹 칸
        <div className={styles.form}>
            {/* 그룹명 · 방 개수 */}
            <div className={styles.grid}>
                <Field label="그룹명" name="room_group_name" htmlFor={`${idPrefix}-name`} hint="업체 안에서 겹치지 않게, 100자 이내" required>
                    <Input id={`${idPrefix}-name`} maxLength={NAME_MAX} value={form.room_group_name} onChange={(event) => onChange({room_group_name: event.target.value})} />
                </Field>
                <Field label="방 개수" name="room_count" dataKey={ROOM_GROUP_DETAIL_KEY} htmlFor={`${idPrefix}-room-count`}>
                    <div className={styles.unit}><Input id={`${idPrefix}-room-count`} type="number" min={1} max={20} value={form.room_count} onChange={(event) => onChange({room_count: event.target.value})} /><span>개(원룸 1 · 투룸 2)</span></div>
                </Field>
            </div>

            {/* 설명 */}
            <Field label="설명" name="description" htmlFor={`${idPrefix}-description`} hint={`${form.description.length.toLocaleString('ko-KR')} / ${DESCRIPTION_MAX.toLocaleString('ko-KR')}`}>
                <Textarea id={`${idPrefix}-description`} rows={3} maxLength={DESCRIPTION_MAX} value={form.description} onChange={(event) => onChange({description: event.target.value})} />
            </Field>

            {/* 편의시설 */}
            <fieldset className={styles.amenities}>
                <legend className={styles.legend}>편의시설</legend>
                <Switch label="샤워실" checked={form.has_shower} onChange={(checked) => onChange({has_shower: checked})} />
                <Switch label="TV" checked={form.has_tv} onChange={(checked) => onChange({has_tv: checked})} />
                <Switch label="PC" checked={form.has_pc} onChange={(checked) => onChange({has_pc: checked})} />
            </fieldset>
        </div>
    );
}
