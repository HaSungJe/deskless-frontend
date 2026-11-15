/** 입력 칸 오류 1건 — 그 칸 옆에 message 를 보여 준다 */
export class ValidationErrorResultDto {
    /** 오류가 난 입력 필드 이름(중첩은 점 경로 — hours.0.open_time) */
    property: string;

    /** 보여 줄 메시지 */
    message: string;
}

/** 모든 실패의 본문 */
export class ApiFailResultDto {
    /** 보여 줄 메시지 */
    message: string;

    /** 입력 칸 오류 목록 — 입력 칸 오류가 아니면 null */
    validation_errors: ValidationErrorResultDto[] | null;
}

/** 큐 응답의 failed 이벤트 data — 실패 본문 + 상태 코드 */
export type CommandFailedEventData = ApiFailResultDto & {status_code: number} & Record<string, unknown>;
