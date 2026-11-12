'use client';
import Chart from './Chart';
import type { ApexOptions } from 'apexcharts';

type ChartProps = {
    labels: Array<string | number>;
    series: Array<SeriesProps>;
    x_title: string;
    y_title: string;
    width: string;
    height: string;
}

type SeriesProps = {
    name: string;
    data: Array<number>;
}

export default function LineChart( {labels, series, x_title, y_title, width, height}: ChartProps ) {
    const options: ApexOptions = {
        chart: {
            id: x_title || '',
        },
        xaxis: {
            categories: labels,
            title: {
                text: x_title || ''
            }
        },
        yaxis: {
            title: {
                text: y_title || ''
            }
        }
    };

    return (
        <Chart 
            options={options} 
            series={series} 
            type="line" 
            width={width} 
            height={height} 
        />
    )
}