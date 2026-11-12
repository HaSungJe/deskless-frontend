'use client';
import dynamic from 'next/dynamic';

// apexcharts 는 window 를 쓰므로 서버 렌더링에서 뺀다
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default Chart;
