import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import Highcharts3DModule from 'highcharts/highcharts-3d';

// Enable 3D module with compatibility for different bundlers
try {
  const apply3D = Highcharts3DModule?.default || Highcharts3DModule;
  if (typeof apply3D === 'function') apply3D(Highcharts);
} catch (e) {
  console.warn('Highcharts 3D module init warning:', e);
}

/**
 * Pie3D chart component
 * Props:
 *  - data: Array<{ name: string, y: number }>
 *  - title: string (optional)
 */
export default function Pie3D({ data = [], title = 'Distribuição de Ativos' }) {
  const options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      options3d: { enabled: true, alpha: 45, beta: 0 },
      height: 380,
      style: { fontFamily: 'Inter, system-ui, sans-serif' },
    },
    title: {
      text: title || null,
      style: { color: '#0f172a', fontSize: '16px', fontWeight: '600' },
    },
    credits: { enabled: false },
    tooltip: {
      pointFormat: '<b>{point.y}</b> ({point.percentage:.1f}%)',
    },
    accessibility: { enabled: false },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        depth: 35,
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}',
          style: { color: '#334155', textOutline: 'none' },
        },
      },
    },
    series: [
      {
        name: 'Ativos',
        colorByPoint: true,
        data: data,
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}