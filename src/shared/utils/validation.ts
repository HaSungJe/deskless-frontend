import { validateOrReject, ValidationError } from "class-validator";
import { showErrorPopup } from "@/shared/utils/error-popup";

export type ValidationErrorType = {
    type?: string;
    property: string;
    message: string;
}

/**
 * 입력 칸 오류 표시 요소 찾기 — <span data-type="validation-alert" data-id="칸 이름" data-key="중첩 DTO 키">
 * - 칸 이름에 점(`hours.0.open_time`) 같은 문자가 들어와도 되도록 escape 한다
 *
 * @param property 칸 이름
 * @param key 중첩 DTO 키 (validateActionChildren 용)
 */
function findValidationAlert(property: string, key?: string): HTMLElement | null {
    let selector = `span[data-type="validation-alert"][data-id="${CSS.escape(String(property))}"]`;
    if (key !== undefined) {
        selector += `[data-key="${CSS.escape(key)}"]`;
    }

    return document.querySelector<HTMLElement>(selector);
}

/**
 * 입력 칸 오류 표시 — 찾은 칸 수를 돌려준다(0 이면 호출한 쪽이 오류 팝업으로 대신 보여 준다)
 *
 * @param errors 오류 목록
 * @param key 중첩 DTO 키
 */
export function showValidationErrors(errors: Array<ValidationErrorType>, key?: string): number {
    let shownCount: number = 0;
    for (const error of errors) {
        const alertElement = findValidationAlert(error.property, key);
        if (alertElement) {
            shownCount++;
            alertElement.innerText = error.message;
            alertElement.style.color = 'var(--danger)';
            alertElement.style.display = 'block';
        }
    }

    return shownCount;
}

/**
 * Validation Error 초기화
 */
export function resetValidationError(): void {
    const alertElements = document.querySelectorAll<HTMLElement>(`span[data-type="validation-alert"]`);
    alertElements.forEach((alertElement) => {
        alertElement.innerText = '';
        alertElement.style.color = '';
        alertElement.style.display = 'none';
    });
}

/**
 * class-validator 오류를 화면용 오류 목록으로 바꾼다
 * - isBoolean 은 contexts 의 target 이 있으면 그것을 칸 이름으로 쓴다
 *
 * @param errors class-validator 오류
 */
function toValidationErrors(errors: Array<ValidationError>): Array<ValidationErrorType> {
    const result: Array<ValidationErrorType> = [];
    for (const error of errors) {
        const type = Object.keys(error.constraints ?? {})[0];
        if (!type) {
            continue;
        }

        const contextTarget: string | undefined = type === 'isBoolean' ? error.contexts?.[type]?.['target'] : undefined;
        result.push({type, property: contextTarget ?? error.property, message: error.constraints[type]});
    }

    return result;
}

/**
 * Validation 체크 및 오류처리
 *
 * @param dto
 * @param reset 기존 오류 표시를 지울지 여부
 */
export async function validateAction(dto: object, reset: boolean = true): Promise<boolean> {
    if (reset) {
        resetValidationError();
    }

    try {
        await validateOrReject(dto);
        return true;
    } catch (err) {
        const validationErrors = toValidationErrors(err as Array<ValidationError>);
        if (validationErrors.length > 0 && showValidationErrors(validationErrors) === 0) {
            showErrorPopup(validationErrors[0].message);
        }

        return false;
    }
}

/**
 * Validation 체크 및 오류처리
 * - dto 안의 dto. 오류 표시 span 에 data-key 를 붙여 구분한다
 *
 * @param dto
 * @param key span 의 data-key 값
 * @returns
 */
export async function validateActionChildren(dto: object, key: string): Promise<boolean> {
    try {
        await validateOrReject(dto);
        return true;
    } catch (err) {
        const validationErrors = toValidationErrors(err as Array<ValidationError>);
        if (validationErrors.length > 0 && showValidationErrors(validationErrors, key) === 0) {
            showErrorPopup(validationErrors[0].message);
        }

        return false;
    }
}
