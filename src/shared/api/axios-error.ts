import { resetValidationError, showValidationErrors, ValidationErrorType } from "@/shared/utils/validation";

/**
 * Axios Error 핸들링
 * - ValidationErrors(유효성 검증 실패 목록)를 넘겨받으면, 해당 값에 맞는 Document를 찾아 메세지 출력. (못찾으면 Alert)
 *
 * @param error API 에러
 * @param isReset 기존 Document에 출력한 에러 정보를 초기상태로 되돌릴지의 여부
 */
export async function axiosErrorHandle(error: any, isReset: boolean = true): Promise<void> {
    if (!error?.status) {
        return;
    }

    const message: string | undefined = error?.response?.data?.message;
    const validationErrors: Array<ValidationErrorType> = error?.response?.data?.validationErrors ?? [];
    if (validationErrors.length > 0) {
        if (isReset) {
            resetValidationError();
        }

        if (showValidationErrors(validationErrors) === 0 && message) {
            alert(message);
        }
    } else if (message) {
        alert(message);
    }
}
