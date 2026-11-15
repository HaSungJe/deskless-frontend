/** 큐 API 응답 이벤트 — accepted 뒤에 done · failed · pending 중 하나가 오고 스트림이 끝난다 */
export const COMMAND_STREAM_EVENT = {
    /** 접수됨 — data: `{request_id}` */
    ACCEPTED: 'accepted',
    /** 성공 — data: 그 API 의 응답 DTO (없으면 null) */
    DONE: 'done',
    /** 실패 — data: `{status_code, message, validation_errors, ...}` */
    FAILED: 'failed',
    /** 30초 안에 결과가 오지 않음 — data: `{request_id, message}`. 처리됐을 수 있으니 그 리소스를 다시 조회한다 */
    PENDING: 'pending',
} as const;
