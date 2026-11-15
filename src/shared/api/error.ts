import { ApiError } from '@/shared/api/request';
import { resetValidationError, showValidationErrors } from '@/shared/utils/validation';

/** 응답이 없는 실패(네트워크 · 서버 꺼짐) 문구 */
export const NETWORK_ERROR_MESSAGE = '서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.';

/**
 * API 실패 보여 주기 — 화면은 catch 에서 handleApiError(error)
 * - validation_errors 는 칸 옆에(맞는 칸이 없으면 alert(message)), 없으면 alert(message)
 * - 응답이 없는 실패는 NETWORK_ERROR_MESSAGE, 취소(AbortError)는 보여 주지 않는다
 *
 * @param error catch 로 받은 값
 * @param isReset 전에 보여 준 칸 오류를 지울지
 */
export function handleApiError(error: unknown, isReset: boolean = true): void {
    if (isAbortError(error)) {
        return;
    }

    if (!(error instanceof ApiError)) {
        console.error(error);
        alert(NETWORK_ERROR_MESSAGE);
        return;
    }

    const {message, validation_errors} = error.body;
    if (validation_errors && validation_errors.length > 0) {
        if (isReset) {
            resetValidationError();
        }

        if (showValidationErrors(validation_errors) === 0) {
            alert(message);
        }
        return;
    }

    alert(message);
}

/**
 * 화면이 스스로 취소한 요청인지 — fetch 는 AbortError(DOMException)를 던진다
 *
 * @param error catch 로 받은 값
 */
function isAbortError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as {name?: unknown}).name === 'AbortError';
}
