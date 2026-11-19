import styles from '@/shared/css/ui/form/Field.module.css';

type FieldErrorProps = {
    name: string;     // 칸 이름 — data-id(백엔드 점 경로 hours.3.close_time 도 된다)
    dataKey?: string; // 중첩 DTO 키 — validateActionChildren 의 key
};

/**
 * 칸 오류 span — validation.ts 가 채우고 지운다(Field 안 · 라벨 없는 표 칸 · 줄 칸)
 *
 * @param param0
 * @returns
 */
export default function FieldError({name, dataKey}: FieldErrorProps): React.ReactNode {
    return (
        // 오류 span
        <span className={styles.error} data-type="validation-alert" data-id={name} data-key={dataKey} />
    );
}
