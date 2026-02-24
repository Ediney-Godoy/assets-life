import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

/**
 * LineChart component
 * Props:
 *  - data: Array<{ name: string, y: number }> ou Array<{ x: string/number, y: number }>
 *  - title: string (optional)
 *  - smooth: boolean (optional) - se true, cria linhas suaves
 */
export default function LineChart({ data = [], title = 'Gráfico de Linhas', smooth = true }) {
  const options = {
    chart: {
      type: 'line',
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
      categories: data.map(item => item.name || item.x),
      labels: {
        style: { color: '#64748b' },
      },
      lineColor: '#e2e8f0',
      tickColor: '#e2e8f0',
    },
    yAxis: {
      title: {
        text: 'Valores',
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
      line: {
        dataLabels: {
          enabled: true,
          style: { color: '#334155', textOutline: 'none' },
        },
        enableMouseTracking: true,
        marker: {
          enabled: true,
          radius: 4,
        },
      },
      spline: {
        dataLabels: {
          enabled: true,
          style: { color: '#334155', textOutline: 'none' },
        },
        enableMouseTracking: true,
        marker: {
          enabled: true,
          radius: 4,
        },
      },
    },
    series: [
      {
        name: 'Evolução',
        data: data.map(item => item.y),
        color: '#3b82f6',
        type: smooth ? 'spline' : 'line',
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}