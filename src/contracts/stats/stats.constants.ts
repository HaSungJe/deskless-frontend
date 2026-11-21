/** 통계 값 이름 — 전체 통계 · 내 업체 통계가 같은 다섯 값(StatsSummaryResultDto · StatsMineSummaryResultDto) */
export type StatsSummaryKeyType = 'user_count' | 'completed_count' | 'paid_amount' | 'refund_amount' | 'profit';

/** 합계 · 월별 항목 — 카드 · 표 순서(시안 M2 · A2) */
export const STATS_SUMMARY_ITEMS: ReadonlyArray<{key: StatsSummaryKeyType; label: string; unit: string}> = [
    {key: 'user_count', label: '이용자 수', unit: '명'},
    {key: 'completed_count', label: '이용 건수', unit: '건'},
    {key: 'paid_amount', label: '결제액', unit: '원'},
    {key: 'refund_amount', label: '환불액', unit: '원'},
    {key: 'profit', label: '수익', unit: '원'},
];
