import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

/**
 * AreaChart component
 * Props:
 *  - data: Array<{ name: string, y: number }>
 *  - title: string (optional)
 *  - stacked: boolean (optional) - se true, empilha as áreas
 */
export default function AreaChart({ data = [], title = 'Gráfico de Área', stacked = false }) {
  const options = {
    chart: {
      type: 'areaspline',
      backgroundColor: 'transparent',
      height: 380,
      style: { fontFamily: 'Inter, system-ui, sans-serif' },
    },
    title: {
      text: title || null,
      style: { color: '#0f172a', fontSize: '16px', fontWeight: '600' },
    },
    credits: { enabled: false },
    xAxis: {
      categories: data.map(item => item.name),
      labels: {
        style: { color: '#64748b' },
      },
      lineColor: '#e2e8f0',
      tickColor: '#e2e8f0',
    },
    yAxis: {
      title: {
        text: 'Quantidade',
        style: { color: '#64748b' },
      },
      labels: {
        style: { color: '#64748b' },
      },
      gridLineColor: '#f1f5f9',
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b>',
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      style: { color: '#334155' },
    },
    accessibility: { enabled: false },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.3,
        marker: {
          enabled: true,
          radius: 4,
        },
        dataLabels: {
          enabled: true,
          style: { color: '#334155', textOutline: 'none' },
        },
        stacking: stacked ? 'normal' : null,
      },
    },
    series: [
      {
        name: 'Distribuição',
        data: data.map(item => item.y),
        color: '#10b981',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(16, 185, 129, 0.4)'],
            [1, 'rgba(16, 185, 129, 0.1)']
          ]
        },
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}