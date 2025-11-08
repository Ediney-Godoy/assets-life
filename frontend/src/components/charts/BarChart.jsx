import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

/**
 * BarChart component
 * Props:
 *  - data: Array<{ name: string, y: number }>
 *  - title: string (optional)
 *  - horizontal: boolean (optional) - se true, cria barras horizontais
 */
export default function BarChart({ data = [], title = 'Gráfico de Barras', horizontal = false, showPercent = false }) {
  const total = data.reduce((sum, item) => sum + (Number(item.y) || 0), 0);
  const options = {
    chart: {
      type: horizontal ? 'bar' : 'column',
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
      pointFormatter: function() {
        const y = Number(this.y) || 0;
        if (showPercent && total > 0) {
          const pct = (y / total) * 100;
          return `<b>${y}</b> (${pct.toFixed(1)}%)`;
        }
        return `<b>${y}</b>`;
      },
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      style: { color: '#334155' },
    },
    accessibility: { enabled: false },
    plotOptions: {
      column: {
        borderRadius: 4,
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          formatter: function () {
            const y = Number(this.y) || 0;
            if (showPercent && total > 0) {
              const pct = (y / total) * 100;
              return `${y} (${pct.toFixed(1)}%)`;
            }
            return `${y}`;
          },
          style: { color: '#334155', textOutline: 'none' },
        },
      },
      bar: {
        borderRadius: 4,
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          formatter: function () {
            const y = Number(this.y) || 0;
            if (showPercent && total > 0) {
              const pct = (y / total) * 100;
              return `${y} (${pct.toFixed(1)}%)`;
            }
            return `${y}`;
          },
          style: { color: '#334155', textOutline: 'none' },
        },
      },
    },
    colors: [
      '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ],
    series: [
      {
        name: 'Quantidade',
        data: data.map(item => item.y),
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}