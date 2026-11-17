/** km 로 쓰기 시작하는 거리(m) */
const KM_FROM_METERS = 1000;

/**
 * 거리(m) → 카드 글자 — 1km 아래는 '420m', 1km 부터는 100m 단위 반올림 '11.3km'(소수 한 자리 — 시안 '12.0km')
 *
 * @param meters 중심에서 거리(m — 응답 distance_m)
 */
export function formatDistance(meters: number): string {
    if (meters < KM_FROM_METERS) {
        return `${Math.round(meters)}m`;
    }

    return `${(Math.round(meters / 100) / 10).toFixed(1)}km`;
}
