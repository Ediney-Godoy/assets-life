import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

/**
 * DonutChart component
 * Props:
 *  - data: Array<{ name: string, y: number }>
 *  - title: string (optional)
 *  - centerText: string (optional) - texto no centro do donut
 */
export default function DonutChart({ data = [], title = 'Gráfico Donut', centerText = '' }) {
  const total = data.reduce((sum, item) => sum + item.y, 0);
  
  const options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
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
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      style: { color: '#334155' },
    },
    accessibility: { enabled: false },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        innerSize: '60%', // Isso cria o efeito donut
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}',
          style: { color: '#334155', textOutline: 'none' },
          distance: 20,
        },
        showInLegend: true,
      },
    },
    legend: {
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
      itemStyle: { color: '#64748b' },
    },
    colors: [
      '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ],
    series: [
      {
        name: 'Distribuição',
        colorByPoint: true,
        data: data,
      },
    ],
  };

  // Adicionar texto no centro se fornecido
  if (centerText) {
    options.annotations = [{
      labels: [{
        point: { x: 0, y: 0 },
        text: centerText,
        style: {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#0f172a',
        },
        useHTML: true,
      }],
    }];
  }

  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 relative">
      <HighchartsReact highcharts={Highcharts} options={options} />
      {centerText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{centerText}</div>
          </div>
        </div>
      )}
    </div>
  );
}