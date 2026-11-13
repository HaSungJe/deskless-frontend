import styles from '@/shared/css/ui/form/Field.module.css';

type FieldProps = {
    label: string;
    name: string;      // 오류 span 의 data-id — 백엔드 DTO 필드 이름
    htmlFor?: string;  // 라벨이 가리킬 입력 id (기본 name)
    dataKey?: string;  // 중첩 DTO 키 — validateActionChildren(dto, key) 의 key
    hint?: string;
    required?: boolean;
    children: React.ReactNode;
};

/**
 * 입력 칸 — 라벨 · 입력 · 오류 span(validation-alert) · 도움말
 * - 오류 span 은 src/shared/utils/validation.ts 의 showValidationErrors / resetValidationError 가 채우고 지운다
 *
 * @param param0
 * @returns
 */
export default function Field({label, name, htmlFor, dataKey, hint, required = false, children}: FieldProps): React.ReactNode {
    // 변수
    const inputId = htmlFor ?? name; // 라벨이 가리킬 입력 id

    return (
        // 칸
        <div className={styles.field}>
            {/* 라벨 — 필수면 * */}
            <label className={styles.label} htmlFor={inputId}>
                {label}
                {required ? <span className={styles.required} aria-hidden="true"> *</span> : null}
            </label>

            {/* 입력 */}
            {children}

            {/* 오류 span — validation.ts 가 채우고 지운다 */}
            <span className={styles.error} data-type="validation-alert" data-id={name} data-key={dataKey} />

            {/* 도움말 */}
            {hint ? <p className={styles.hint}>{hint}</p> : null}
        </div>
    );
}
