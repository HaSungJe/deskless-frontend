import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Segmented from '@/shared/components/ui/form/Segmented';
import { digitsOnly } from '@/shared/utils/util';
import { GENDER_OPTIONS, PHONE_MAX, StaffFormType } from '../staff-format';
import styles from '@/app/css/manager/StaffFields.module.css';

type StaffFieldsProps = {
    idPrefix: string;                                  // 칸 id 앞(등록 대화상자 · 상세 카드)
    form: StaffFormType;                               // 칸 값
    onChange: (patch: Partial<StaffFormType>) => void; // 칸 바꿈
};

/** 이름 최대 글자 수 — ManagerStaffDto */
const NAME_MAX = 50;

/**
 * 업체 관리자 칸 — 이름 · 휴대폰(숫자만) · 성별 · 생년월일. 등록 대화상자와 상세 계정 정보 카드가 함께 쓴다
 *
 * @param param0
 * @returns
 */
export default function StaffFields({idPrefix, form, onChange}: StaffFieldsProps): React.ReactNode {
    return (
        // 업체 관리자 칸
        <div className={styles.grid}>
            {/* 이름 · 휴대폰 */}
            <Field label="이름" name="name" htmlFor={`${idPrefix}-name`} required>
                <Input id={`${idPrefix}-name`} maxLength={NAME_MAX} value={form.name} onChange={(event) => onChange({name: event.target.value})} />
            </Field>
            <Field label="휴대폰 번호" name="phone" htmlFor={`${idPrefix}-phone`} hint="숫자만 — 임시 비밀번호 · 아이디 찾기에 씁니다." required>
                <Input id={`${idPrefix}-phone`} type="tel" inputMode="numeric" value={form.phone} onChange={(event) => onChange({phone: digitsOnly(event.target.value, PHONE_MAX)})} />
            </Field>

            {/* 성별 · 생년월일 */}
            <Field label="성별" name="gender" group required>
                <Segmented label="성별" options={GENDER_OPTIONS} value={form.gender} onChange={(gender) => onChange({gender})} />
            </Field>
            <Field label="생년월일" name="birth" htmlFor={`${idPrefix}-birth`} required>
                <Input id={`${idPrefix}-birth`} type="date" value={form.birth} onChange={(event) => onChange({birth: event.target.value})} />
            </Field>
        </div>
    );
}
