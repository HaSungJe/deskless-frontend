import styles from '@/shared/css/ui/form/Field.module.css';

type FieldProps = {
    label: string;
    name: string;           // 오류 span 의 data-id — 백엔드 DTO 필드 이름
    htmlFor?: string;       // 라벨이 가리킬 입력 id (기본 name)
    dataKey?: string;       // 중첩 DTO 키 — validateActionChildren(dto, key) 의 key
    hint?: React.ReactNode; // 도움말 — 글자 수처럼 한 줄에 나눠 둘 때는 span 으로
    required?: boolean;
    group?: boolean;        // 라디오 묶음처럼 입력이 여럿 — fieldset · legend 로 그린다(htmlFor 안 씀)
    children: React.ReactNode;
};

/**
 * 입력 칸 — 라벨 · 입력 · 오류 span(validation-alert) · 도움말
 * - 오류 span 은 src/shared/utils/validation.ts 의 showValidationErrors / resetValidationError 가 채우고 지운다
 *
 * @param param0
 * @returns
 */
export default function Field({label, name, htmlFor, dataKey, hint, required = false, group = false, children}: FieldProps): React.ReactNode {
    // 변수
    const inputId = htmlFor ?? name; // 라벨이 가리킬 입력 id

    // 계산 값
    const requiredMark = required ? <span className={styles.required} aria-hidden="true"> *</span> : null; // 필수면 *
    const hintLine = hint ? <p className={styles.hint}>{hint}</p> : null;                                   // 도움말

    // 묶음 — fieldset · legend
    if (group) {
        return (
            <fieldset className={`${styles.field} ${styles.group}`}>
                {/* 라벨 */}
                <legend className={styles.label}>{label}{requiredMark}</legend>

                {/* 입력들 */}
                {children}

                {/* 오류 span · 도움말 */}
                <span className={styles.error} data-type="validation-alert" data-id={name} data-key={dataKey} />
                {hintLine}
            </fieldset>
        );
    }

    return (
        // 칸
        <div className={styles.field}>
            {/* 라벨 */}
            <label className={styles.label} htmlFor={inputId}>{label}{requiredMark}</label>

            {/* 입력 */}
            {children}

            {/* 오류 span — validation.ts 가 채우고 지운다 · 도움말 */}
            <span className={styles.error} data-type="validation-alert" data-id={name} data-key={dataKey} />
            {hintLine}
        </div>
    );
}
