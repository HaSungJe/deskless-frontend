/** 오류 팝업 내용 */
export type ErrorPopupType = {
    message: string; // 보여 줄 문구
    detail?: string; // 개발 때만 — 오류 원문
};

type ListenerType = () => void;

let current: ErrorPopupType | null = null;    // 지금 띄운 오류 — 없으면 null
const listeners = new Set<ListenerType>();    // ErrorPopup 이 붙인 알림 함수

/**
 * 바뀜 알리기
 */
function emit(): void {
    listeners.forEach((listener) => listener());
}

/**
 * 오류 팝업 띄우기 — 열려 있으면 새 내용으로 바꾼다
 *
 * @param message 보여 줄 문구
 * @param detail 개발 때만 보여 줄 오류 원문
 */
export function showErrorPopup(message: string, detail?: string): void {
    current = {message, detail};
    emit();
}

/**
 * 오류 팝업 닫기
 */
export function closeErrorPopup(): void {
    current = null;
    emit();
}

/**
 * 바뀜 구독 — useSyncExternalStore 용
 *
 * @param listener 알림 함수
 */
export function subscribeErrorPopup(listener: ListenerType): () => void {
    listeners.add(listener);
    return (): void => {
        listeners.delete(listener);
    };
}

/**
 * 지금 띄운 오류 — useSyncExternalStore 용
 */
export function getErrorPopup(): ErrorPopupType | null {
    return current;
}
