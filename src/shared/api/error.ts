import { LoginRequiredError } from '@/shared/api/auth';
import { ApiError, isAbortError, NetworkError } from '@/shared/api/request';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { resetValidationError, showValidationErrors } from '@/shared/utils/validation';

/** 응답이 없는 실패(네트워크 · 서버 꺼짐) 문구 */
export const NETWORK_ERROR_MESSAGE = '서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.';

/** 그 밖의 오류(코드 오류 등) 문구 */
export const UNKNOWN_ERROR_MESSAGE = '처리 중 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.';

/**
 * API 실패 보여 주기 — 화면은 catch 에서 handleApiError(error)
 * - validation_errors 는 칸 옆에(맞는 칸이 없으면 팝업), 없으면 message 를 오류 팝업으로
 * - NetworkError 는 NETWORK_ERROR_MESSAGE, 그 밖의 오류는 UNKNOWN_ERROR_MESSAGE(개발 때만 원문) + console.error
 * - 취소(AbortError) · 로그인 만료(LoginRequiredError — 이미 로그인 화면으로 보냈다)는 보여 주지 않는다
 *
 * @param error catch 로 받은 값
 * @param isReset 전에 보여 준 칸 오류를 지울지
 * @param key 칸 오류 키 — 같은 이름의 칸이 여럿인 화면에서 그 카드 · 줄(Field dataKey)에만 붙인다. 없으면 이름만으로 찾는다
 */
export function handleApiError(error: unknown, isReset: boolean = true, key?: string): void {
    if (isAbortError(error) || error instanceof LoginRequiredError) {
        return;
    }

    if (error instanceof NetworkError) {
        showErrorPopup(NETWORK_ERROR_MESSAGE);
        return;
    }

    if (!(error instanceof ApiError)) {
        console.error(error);
        showErrorPopup(UNKNOWN_ERROR_MESSAGE, process.env.NODE_ENV === 'production' ? undefined : errorDetail(error));
        return;
    }

    const {message, validation_errors} = error.body;
    if (validation_errors && validation_errors.length > 0) {
        if (isReset) {
            resetValidationError();
        }

        if (showValidationErrors(validation_errors, key) === 0) {
            showErrorPopup(message);
        }
        return;
    }

    showErrorPopup(message);
}

/**
 * 오류 원문 — 개발 때 팝업 아래에 보인다
 *
 * @param error catch 로 받은 값
 */
function errorDetail(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
