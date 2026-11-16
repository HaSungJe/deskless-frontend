/** 생년월일 숫자 자리 수 */
const BIRTH_DIGITS = 8;

/**
 * 생년월일 칸 글자 → 숫자만 골라 YYYY-MM-DD 모양(치는 중에도 4자리 · 6자리 뒤에 '-') — 사용자 결정
 *
 * @param raw 칸에 친 글자
 */
export function formatBirthInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, BIRTH_DIGITS);
    if (digits.length <= 4) {
        return digits;
    }

    if (digits.length <= 6) {
        return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }

    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}
