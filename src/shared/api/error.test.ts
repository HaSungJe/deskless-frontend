import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleApiError, NETWORK_ERROR_MESSAGE } from './error';
import { ApiError } from './request';

/**
 * 오류 칸 두 개 — store_name(비어 있음) · phone(이전 오류가 떠 있음)
 */
function renderAlertSpans(): {storeName: HTMLElement; phone: HTMLElement} {
    document.body.innerHTML = '<span data-type="validation-alert" data-id="store_name"></span><span data-type="validation-alert" data-id="phone"></span>';
    const storeName = document.querySelector<HTMLElement>('[data-id="store_name"]') as HTMLElement;
    const phone = document.querySelector<HTMLElement>('[data-id="phone"]') as HTMLElement;
    phone.innerText = '이전 오류';
    phone.style.display = 'block';

    return {storeName, phone};
}

let alertSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});

describe('handleApiError', () => {
    it('[FAIL:validation] 맞는 칸이 있으면 칸 옆에 보여 주고 alert 는 띄우지 않으며 이전 칸 오류는 지운다', () => {
        const {storeName, phone} = renderAlertSpans();
        const error = new ApiError(400, {message: '입력값을 확인해 주세요.', validation_errors: [{property: 'store_name', message: '업체명을 입력해 주세요.'}]});

        handleApiError(error);

        expect(storeName.innerText).toBe('업체명을 입력해 주세요.');
        expect(storeName.style.display).toBe('block');
        expect(phone.innerText).toBe('');
        expect(phone.style.display).toBe('none');
        expect(alertSpy).not.toHaveBeenCalled();
    });

    it('[FAIL:validation] validation_errors 는 있는데 맞는 칸이 없으면 message 를 alert 로 한 번', () => {
        renderAlertSpans();
        const error = new ApiError(400, {message: '입력값을 확인해 주세요.', validation_errors: [{property: 'hours.0.open_time', message: '여는 시각을 입력해 주세요.'}]});

        handleApiError(error);

        expect(alertSpy).toHaveBeenCalledTimes(1);
        expect(alertSpy).toHaveBeenCalledWith('입력값을 확인해 주세요.');
    });

    it('[FAIL:validation] validation_errors 가 null 이면 message 를 alert 로 한 번', () => {
        const {storeName} = renderAlertSpans();
        const error = new ApiError(403, {message: '이용이 제한된 계정입니다.', validation_errors: null, block_comment: '운영 정책 위반'});

        handleApiError(error);

        expect(alertSpy).toHaveBeenCalledTimes(1);
        expect(alertSpy).toHaveBeenCalledWith('이용이 제한된 계정입니다.');
        expect(storeName.style.display).toBe(''); // 칸은 건드리지 않는다(jsdom 은 손대지 않은 span 의 innerText 가 undefined)
    });

    it('[FAIL:network] ApiError 가 아닌 오류(fetch TypeError)는 고정 문구를 alert 로 한 번', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        handleApiError(new TypeError('Failed to fetch'));

        expect(alertSpy).toHaveBeenCalledTimes(1);
        expect(alertSpy).toHaveBeenCalledWith(NETWORK_ERROR_MESSAGE);
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('[FAIL:abort] 화면이 취소한 요청(AbortError)은 아무것도 띄우지 않는다', () => {
        handleApiError(new DOMException('The operation was aborted.', 'AbortError'));

        expect(alertSpy).not.toHaveBeenCalled();
    });
});
