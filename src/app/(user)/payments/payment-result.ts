import { safeReturnPath } from '@/shared/utils/area';

/**
 * 결제 결과 화면의 return_url → "다시 고르기" 주소 — ? 앞까지를 같은 사이트 주소로만, 없으면 첫 화면
 * - 우리 돌아갈 주소(U3 · U7 · U9)에는 query 가 없다. 토스가 우리 query 뒤에 ? 로 붙였을 때 대비
 *
 * @param raw return_url 값
 */
export function paymentReturnPath(raw: string | null | undefined): string {
    return safeReturnPath(raw ? raw.split('?')[0] : null, 'user');
}
