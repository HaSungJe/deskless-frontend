'use client';
import type { ApexOptions } from 'apexcharts';
import Chart from './Chart';

/** 막대 묶음 하나 — 이름 · 값 · 색 토큰 */
export type BarChartSeriesType = {
    name: string;        // 범례 이름(결제액)
    data: Array<number>; // 분류마다 값
    colorVar: string;    // globals.css 색 토큰 이름('--primary')
};

type BarChartProps = {
    label: string;                           // 그래프 설명(aria-label)
    categories: Array<string>;               // 가로축(달)
    series: Array<BarChartSeriesType>;       // 묶음
    height: number;                          // 높이(px)
    formatValue?: (value: number) => string; // 막대 위 값 · 세로축 · 툴팁 글자(기본 쉼표)
};

/** 토큰을 못 읽었을 때 — 주색 */
const FALLBACK_COLOR = '#2457D6';

/**
 * 쉼표 숫자 — 기본 글자
 *
 * @param value 값
 */
function formatNumber(value: number): string {
    return value.toLocaleString('ko-KR');
}

/**
 * 색 토큰 값 — apexcharts 는 색 글자를 직접 다뤄(hover 음영) var(--…) 를 못 읽는다
 * - 그래프는 서버에서 그리지 않으므로(Chart — ssr: false) 문서가 없을 때는 대신 색
 *
 * @param colorKey 토큰 이름들(공백으로 나눔)
 */
function tokenColors(colorKey: string): Array<string> {
    const names = colorKey.split(' ');
    if (typeof document === 'undefined') {
        return names.map(() => FALLBACK_COLOR);
    }

    const style = getComputedStyle(document.documentElement);
    return names.map((name) => style.getPropertyValue(name).trim() || FALLBACK_COLOR);
}

/**
 * 묶음 막대그래프 — 분류(달)마다 묶음(결제액 · 환불액) 막대, 색은 globals.css 토큰 값
 *
 * @param param0
 * @returns
 */
export default function BarChart({label, categories, series, height, formatValue = formatNumber}: BarChartProps): React.ReactNode {
    // 계산 값
    const colors = tokenColors(series.map((item) => item.colorVar).join(' ')); // 토큰에서 읽은 색
    const options: ApexOptions = {
        chart: {toolbar: {show: false}, fontFamily: 'inherit', animations: {enabled: false}},
        plotOptions: {bar: {columnWidth: '50%', borderRadius: 3, dataLabels: {position: 'top'}}},
        colors,
        dataLabels: {enabled: true, offsetY: -18, formatter: (value) => formatValue(Number(value)), style: {fontSize: '12px', fontWeight: 500}},
        legend: {position: 'top', horizontalAlign: 'right'},
        xaxis: {categories},
        yaxis: {labels: {formatter: (value) => formatValue(value)}},
        tooltip: {y: {formatter: (value) => formatValue(value)}},
    };                                                                          // apexcharts 설정

    return (
        // 막대그래프
        <div role="img" aria-label={label}>
            <Chart type="bar" options={options} series={series.map((item) => ({name: item.name, data: item.data}))} width="100%" height={height} />
        </div>
    );
}
